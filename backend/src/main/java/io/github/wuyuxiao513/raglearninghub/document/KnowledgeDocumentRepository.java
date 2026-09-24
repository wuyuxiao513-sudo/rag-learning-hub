package io.github.wuyuxiao513.raglearninghub.document;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface KnowledgeDocumentRepository extends JpaRepository<KnowledgeDocument, Long> {

    List<KnowledgeDocument> findTop20ByTitleContainingIgnoreCaseOrContentContainingIgnoreCaseOrderByCreatedAtDesc(
            String titleQuery,
            String contentQuery
    );

    List<KnowledgeDocument> findTop20ByOrderByCreatedAtDesc();
}

