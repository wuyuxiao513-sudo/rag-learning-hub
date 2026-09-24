package io.github.wuyuxiao513.raglearninghub.api;

import io.github.wuyuxiao513.raglearninghub.document.KnowledgeDocument;
import io.github.wuyuxiao513.raglearninghub.document.KnowledgeDocumentService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
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

    public DocumentController(KnowledgeDocumentService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DocumentResponse create(@Valid @RequestBody CreateDocumentRequest request) {
        return DocumentResponse.from(service.create(request.title(), request.content()));
    }

    @GetMapping
    public List<DocumentResponse> search(@RequestParam(required = false) String q) {
        return service.search(q).stream().map(DocumentResponse::from).toList();
    }

    @GetMapping("/{id}")
    public DocumentResponse get(@PathVariable Long id) {
        return DocumentResponse.from(service.get(id));
    }

    public record CreateDocumentRequest(
            @NotBlank @Size(max = 200) String title,
            @NotBlank @Size(max = 100_000) String content
    ) {
    }

    public record DocumentResponse(Long id, String title, String content, Instant createdAt) {
        static DocumentResponse from(KnowledgeDocument document) {
            return new DocumentResponse(
                    document.getId(),
                    document.getTitle(),
                    document.getContent(),
                    document.getCreatedAt()
            );
        }
    }
}

