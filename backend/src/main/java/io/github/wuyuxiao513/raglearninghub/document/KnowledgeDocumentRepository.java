package io.github.wuyuxiao513.raglearninghub.document;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface KnowledgeDocumentRepository extends
        JpaRepository<KnowledgeDocument, Long>,
        JpaSpecificationExecutor<KnowledgeDocument> {
}

