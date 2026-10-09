# Markdown/TXT File Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users preview and save Markdown/TXT files as searchable documents, retaining parsed text and source filename.

**Architecture:** A multipart preview endpoint delegates to file-type parsers and returns editable text without persistence. The existing JSON create endpoint saves that text with optional source metadata; the Vue composer remains the single save workflow.

**Tech Stack:** Java 17, Spring Boot 4.1.1, JPA, Flyway, JUnit/MockMvc, Vue 3, TypeScript, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-08-document-file-import-design.md`

## Global Constraints

- Supported extensions: `.md`, `.markdown`, `.txt`, case insensitive.
- Maximum binary file size: 1 MiB (1,048,576 bytes); maximum decoded content: 100,000 Java characters.
- UTF-8 and UTF-8 BOM only; malformed bytes are rejected.
- Persist parsed text and source filename, never original file bytes.
- Existing manual create, search, edit and delete remain available.

## Review Focus

- Windows or Unix path in a multipart filename yields only the basename; verify in Task 1.
- Rapid successive selections never let an older preview overwrite the newer one; verify in Task 3.
- Invalid UTF-8 is rejected without replacement characters; verify in Task 1.
- Oversized multipart requests return a readable 413 response; verify in Task 1.
- Markdown containing HTML appears as text in the editor and list; verify in Task 3.

---

### Task 1: Backend preview parser and HTTP errors

**Files:**
- Create: `backend/src/main/java/io/github/wuyuxiao513/raglearninghub/document/importing/DocumentTextParser.java`
- Create: `backend/src/main/java/io/github/wuyuxiao513/raglearninghub/document/importing/Utf8TextDecoder.java`
- Create: `backend/src/main/java/io/github/wuyuxiao513/raglearninghub/document/importing/MarkdownTextParser.java`
- Create: `backend/src/main/java/io/github/wuyuxiao513/raglearninghub/document/importing/PlainTextParser.java`
- Create: `backend/src/main/java/io/github/wuyuxiao513/raglearninghub/document/importing/DocumentImportService.java`
- Create: `backend/src/main/java/io/github/wuyuxiao513/raglearninghub/document/importing/DocumentImportException.java`
- Modify: `backend/src/main/java/io/github/wuyuxiao513/raglearninghub/api/DocumentController.java`
- Modify: `backend/src/main/java/io/github/wuyuxiao513/raglearninghub/api/ApiExceptionHandler.java`
- Modify: `backend/src/main/resources/application.yml`
- Test: `backend/src/test/java/io/github/wuyuxiao513/raglearninghub/api/DocumentImportControllerTest.java`

**Interfaces:**
- `DocumentTextParser`: `boolean supports(String extension)` and `String parse(byte[] bytes)`.
- `DocumentImportService.preview(MultipartFile file)`: returns `Preview(String title, String content, String sourceFilename)`; no database dependency.
- `POST /api/documents/preview`: multipart field `file`; JSON with `title`, `content`, `sourceFilename`.

- [ ] Write MockMvc tests for all three extensions, Chinese/BOM, empty or blank file, malformed UTF-8, unsupported extension (415), >1 MiB file (413), >100,000 decoded chars (400), path-bearing filename, and preview leaving the repository empty.
- [ ] Run `cd backend; ./mvnw -q -Dtest=DocumentImportControllerTest test`; confirm failures from absent endpoint.
- [ ] Implement the parser interface, strict UTF-8 decoder, import service, preview endpoint, multipart limits, and ProblemDetail handlers. Derive the 200-character title from the normalized filename; keep Markdown syntax as text.
- [ ] Run the targeted test again; confirm all cases pass.
- [ ] Commit the backend preview feature.

### Task 2: Save source filename with the existing document lifecycle

**Files:**
- Create: `backend/src/main/resources/db/migration/V3__add_source_filename.sql`
- Modify: `backend/src/main/java/io/github/wuyuxiao513/raglearninghub/document/KnowledgeDocument.java`
- Modify: `backend/src/main/java/io/github/wuyuxiao513/raglearninghub/document/KnowledgeDocumentService.java`
- Modify: `backend/src/main/java/io/github/wuyuxiao513/raglearninghub/api/DocumentController.java`
- Test: `backend/src/test/java/io/github/wuyuxiao513/raglearninghub/api/DocumentControllerTest.java`

**Interfaces:**
- `KnowledgeDocumentService.create(String title, String content, List<String> tags, String sourceFilename)` persists the optional source; `update` retains it.
- `DocumentResponse.sourceFilename` is nullable; create request accepts optional `sourceFilename`.

- [ ] Add API tests: imported create response/source persisted on GET, manual create returns null, update preserves source, path-bearing or blank source is normalized or rejected, and source over 255 characters is rejected.
- [ ] Run `cd backend; ./mvnw -q -Dtest=DocumentControllerTest test`; confirm new assertions fail.
- [ ] Add the nullable V3 column, entity field/getter, service normalization and DTO mapping; keep old documents readable.
- [ ] Run targeted and full backend tests; confirm pass.
- [ ] Commit the persistence feature.

### Task 3: File picker and editable preview in Vue

**Files:**
- Modify: `frontend/src/api.ts`
- Modify: `frontend/src/App.vue`
- Modify: `frontend/src/style.css`
- Test: `frontend/src/App.test.ts`

**Interfaces:**
- `previewDocument(file: File): Promise<{title:string; content:string; sourceFilename:string}>` sends `FormData` without manually setting Content-Type.
- `createDocument(title, content, tags, sourceFilename?)` includes source metadata only when present.

- [ ] Add component tests for choosing file, editable preview and save payload, successful reset, failed preview retaining the draft, source label in results, Markdown HTML rendered literally, and stale preview response protection.
- [ ] Run `cd frontend; npm test`; confirm new assertions fail.
- [ ] Add the API function, file input and preview state; use a request sequence number so only the newest selection updates the form. Reuse the existing save flow and expose ProblemDetail `detail` from preview errors.
- [ ] Run `npm test` and `npm run build`; confirm pass.
- [ ] Commit the frontend feature.

### Task 4: Documentation, release verification, and GitHub upload

**Files:**
- Modify: `README.md`
- Modify: `docs/ROADMAP.md`
- Modify: `backend/pom.xml`
- Modify: `frontend/package.json`
- Modify: `frontend/package-lock.json`

**Interfaces:** No new runtime interface. Document the preview request, limits and local workflow; mark the delivered portion of v0.2 while leaving PDF/chunking open.

- [ ] Update docs and versions to `0.2.0`; regenerate lockfile through npm's package manager.
- [ ] Run `cd backend; ./mvnw --batch-mode verify`, `cd frontend; npm test`, and `npm run build`; confirm exit code 0.
- [ ] Review diff, commit, push `main` to `origin`, and confirm the GitHub Actions run passes.
