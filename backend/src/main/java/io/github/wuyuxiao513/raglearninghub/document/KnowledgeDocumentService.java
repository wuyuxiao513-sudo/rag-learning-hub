package io.github.wuyuxiao513.raglearninghub.document;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;

@Service
@Transactional(readOnly = true)
public class KnowledgeDocumentService {

    private final KnowledgeDocumentRepository repository;

    public KnowledgeDocumentService(KnowledgeDocumentRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public KnowledgeDocument create(String title, String content, List<String> tags) {
        return repository.save(new KnowledgeDocument(title.strip(), content.strip(), normalizeTags(tags)));
    }

    public List<KnowledgeDocument> search(String query, String tag, String sort) {
        Specification<KnowledgeDocument> specification = (root, criteriaQuery, builder) -> builder.conjunction();

        if (query != null && !query.isBlank()) {
            String pattern = "%" + query.strip().toLowerCase(Locale.ROOT) + "%";
            specification = specification.and((root, criteriaQuery, builder) -> builder.or(
                    builder.like(builder.lower(root.get("title")), pattern),
                    builder.like(builder.lower(root.get("content")), pattern)
            ));
        }

        if (tag != null && !tag.isBlank()) {
            String normalizedTag = tag.strip().toLowerCase(Locale.ROOT);
            specification = specification.and((root, criteriaQuery, builder) -> {
                criteriaQuery.distinct(true);
                return builder.equal(builder.lower(root.join("tags")), normalizedTag);
            });
        }

        Sort ordering = switch (sort == null ? "newest" : sort) {
            case "oldest" -> Sort.by(Sort.Direction.ASC, "createdAt");
            case "title" -> Sort.by(Sort.Direction.ASC, "title");
            default -> Sort.by(Sort.Direction.DESC, "createdAt");
        };
        return repository.findAll(specification, PageRequest.of(0, 20, ordering)).getContent();
    }

    public KnowledgeDocument get(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new DocumentNotFoundException(id));
    }

    @Transactional
    public KnowledgeDocument update(Long id, String title, String content, List<String> tags) {
        KnowledgeDocument document = get(id);
        document.update(title.strip(), content.strip(), normalizeTags(tags));
        return document;
    }

    @Transactional
    public void delete(Long id) {
        KnowledgeDocument document = get(id);
        repository.delete(document);
    }

    private List<String> normalizeTags(List<String> tags) {
        if (tags == null) {
            return List.of();
        }

        LinkedHashMap<String, String> normalized = new LinkedHashMap<>();
        for (String tag : tags) {
            String stripped = tag.strip();
            normalized.putIfAbsent(stripped.toLowerCase(Locale.ROOT), stripped);
        }
        return List.copyOf(normalized.values());
    }
}

