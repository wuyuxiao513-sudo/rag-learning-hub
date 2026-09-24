CREATE TABLE knowledge_documents (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP(6) NOT NULL
);

CREATE INDEX idx_knowledge_documents_created_at
    ON knowledge_documents (created_at DESC);
