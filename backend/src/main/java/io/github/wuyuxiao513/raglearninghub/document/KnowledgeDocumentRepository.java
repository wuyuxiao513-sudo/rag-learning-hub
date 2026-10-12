package io.github.wuyuxiao513.raglearninghub.document;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface KnowledgeDocumentRepository extends
        JpaRepository<KnowledgeDocument, Long>,
        JpaSpecificationExecutor<KnowledgeDocument> {
    Optional<KnowledgeDocument> findFirstByContentOrderByIdAsc(String content);
}

