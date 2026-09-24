package io.github.wuyuxiao513.raglearninghub.document;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class KnowledgeDocumentService {

    private final KnowledgeDocumentRepository repository;

    public KnowledgeDocumentService(KnowledgeDocumentRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public KnowledgeDocument create(String title, String content) {
        return repository.save(new KnowledgeDocument(title.strip(), content.strip()));
    }

    public List<KnowledgeDocument> search(String query) {
        if (query == null || query.isBlank()) {
            return repository.findTop20ByOrderByCreatedAtDesc();
        }
        String normalized = query.strip();
        return repository.findTop20ByTitleContainingIgnoreCaseOrContentContainingIgnoreCaseOrderByCreatedAtDesc(
                normalized,
                normalized
        );
    }

    public KnowledgeDocument get(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new DocumentNotFoundException(id));
    }
}

