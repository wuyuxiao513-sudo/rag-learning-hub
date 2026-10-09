package io.github.wuyuxiao513.raglearninghub.api;

import io.github.wuyuxiao513.raglearninghub.document.KnowledgeDocument;
import io.github.wuyuxiao513.raglearninghub.document.KnowledgeDocumentService;
import io.github.wuyuxiao513.raglearninghub.document.importing.DocumentImportService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/documents")
@CrossOrigin(origins = "http://localhost:5173")
public class DocumentController {

    private final KnowledgeDocumentService service;
    private final DocumentImportService importService;

    public DocumentController(KnowledgeDocumentService service, DocumentImportService importService) {
        this.service = service;
        this.importService = importService;
    }

    @PostMapping(path = "/preview", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public DocumentImportService.Preview preview(@RequestParam("file") MultipartFile file) {
        return importService.preview(file);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DocumentResponse create(@Valid @RequestBody CreateDocumentRequest request) {
        return DocumentResponse.from(service.create(
                request.title(), request.content(), request.tags(), request.sourceFilename()));
    }

    @GetMapping
    public List<DocumentResponse> search(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String tag,
            @RequestParam(defaultValue = "newest") String sort
    ) {
        return service.search(q, tag, sort).stream().map(DocumentResponse::from).toList();
    }

    @GetMapping("/{id}")
    public DocumentResponse get(@PathVariable Long id) {
        return DocumentResponse.from(service.get(id));
    }

    @PutMapping("/{id}")
    public DocumentResponse update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateDocumentRequest request
    ) {
        return DocumentResponse.from(service.update(id, request.title(), request.content(), request.tags()));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }

    public record CreateDocumentRequest(
            @NotBlank @Size(max = 200) String title,
            @NotBlank @Size(max = 100_000) String content,
            @Size(max = 10) List<@NotBlank @Size(max = 30) String> tags,
            String sourceFilename
    ) {
    }

    public record UpdateDocumentRequest(
            @NotBlank @Size(max = 200) String title,
            @NotBlank @Size(max = 100_000) String content,
            @Size(max = 10) List<@NotBlank @Size(max = 30) String> tags
    ) {
    }

    public record DocumentResponse(
            Long id, String title, String content, Instant createdAt, List<String> tags, String sourceFilename
    ) {
        static DocumentResponse from(KnowledgeDocument document) {
            return new DocumentResponse(
                    document.getId(),
                    document.getTitle(),
                    document.getContent(),
                    document.getCreatedAt(),
                    document.getTags().stream().sorted(String.CASE_INSENSITIVE_ORDER).toList(),
                    document.getSourceFilename()
            );
        }
    }
}

