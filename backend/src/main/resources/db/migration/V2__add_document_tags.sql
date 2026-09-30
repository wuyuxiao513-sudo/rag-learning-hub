CREATE TABLE knowledge_document_tags (
    document_id BIGINT NOT NULL,
    tag VARCHAR(30) NOT NULL,
    PRIMARY KEY (document_id, tag),
    CONSTRAINT fk_document_tags_document
        FOREIGN KEY (document_id) REFERENCES knowledge_documents (id) ON DELETE CASCADE
);

CREATE INDEX idx_document_tags_tag ON knowledge_document_tags (tag);
