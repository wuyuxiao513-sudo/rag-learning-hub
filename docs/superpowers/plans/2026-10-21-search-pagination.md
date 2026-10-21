# Search Pagination Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make documents beyond the current first 20 reachable through a reliable Load More flow.

**Architecture:** The existing search endpoint keeps its array body and adds a zero-based page parameter plus `X-Has-More` header. The Vue client tracks the committed filters and page, appending later pages without replacing earlier results.

**Tech Stack:** Java 17, Spring Boot, Spring Data JPA, Vue 3, TypeScript, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-21-search-pagination-design.md`

## Global Constraints

- Page size is 20; default page is 0.
- The API JSON body remains an array for backward compatibility.
- Browser search continues to use the existing keyword, tag, and sort controls.
- No new runtime dependencies.

## Review Focus

- Exactly 20 matching documents: the button must be absent, not lead to an empty next page; cover in API and UI tests.
- Equal sort values across page boundaries: IDs must provide deterministic ordering; cover in API test.
- Changed filters while a page request is pending: stale results must not append; cover in UI test.
- A later-page request fails: earlier results remain and retry is possible; cover in UI test.
- A negative page: return HTTP 400 rather than a server error; cover in API test.

---

### Task 1: Backend paged search contract

**Files:**
- Modify: `backend/src/test/java/io/github/wuyuxiao513/raglearninghub/api/DocumentControllerTest.java`
- Modify: `backend/src/main/java/io/github/wuyuxiao513/raglearninghub/document/KnowledgeDocumentService.java`
- Modify: `backend/src/main/java/io/github/wuyuxiao513/raglearninghub/api/DocumentController.java`

**Interfaces:**
- Produces: `GET /api/documents?q=&tag=&sort=&page=N`, document array body, and `X-Has-More: true|false`.

- [ ] Write integration tests for 21 matches split 20/1, exactly 20 matches, filtered/sorted pagination with ties, and negative page.
- [ ] Run targeted backend tests and verify each new test fails for the missing behavior.
- [ ] Change service search to return a `Page<KnowledgeDocument>` for the requested page, adding ID as a secondary sort key.
- [ ] Change controller to validate page, map page content, and set/expose the header.
- [ ] Run targeted backend tests and verify they pass.
- [ ] Commit the backend change with its tests.

### Task 2: Frontend Load More

**Files:**
- Modify: `frontend/src/App.test.ts`
- Modify: `frontend/src/api.ts`
- Modify: `frontend/src/App.vue`
- Modify: `frontend/src/style.css` (only if button spacing needs it)

**Interfaces:**
- Consumes: array body, `X-Has-More` header, and zero-based `page` query parameter from Task 1.
- Produces: `searchDocuments(query, tag, sort, page)` returning `{ documents, hasMore }` and a Load More UI action.

- [ ] Write tests for initial/full/last page, append, reset on new search, committed-filter requests, stale response, and retry after load failure.
- [ ] Run targeted frontend tests and verify failures are due to missing pagination behavior.
- [ ] Implement API parsing and Vue pagination state; preserve earlier results on later-page errors.
- [ ] Run targeted frontend tests and verify they pass.
- [ ] Commit the frontend change with its tests.

### Task 3: Final verification and publication

**Files:**
- Modify: `README.md` if the search instructions need updating.

- [ ] Run complete backend verification, frontend tests, and frontend production build; inspect all exit codes.
- [ ] Review the diff and `git status`; ensure no unrelated files or secrets are included.
- [ ] Fast-forward the local main branch, then push it to `wuyuxiao513-sudo/rag-learning-hub` without force.
- [ ] Confirm the remote commit and GitHub Actions result; report any failure honestly.
