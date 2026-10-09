package io.github.wuyuxiao513.raglearninghub.document;

import jakarta.persistence.Column;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.Set;

@Entity
@Table(name = "knowledge_documents")
public class KnowledgeDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(length = 255)
    private String sourceFilename;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "knowledge_document_tags", joinColumns = @JoinColumn(name = "document_id"))
    @Column(name = "tag", nullable = false, length = 30)
    private Set<String> tags = new LinkedHashSet<>();

    protected KnowledgeDocument() {
    }

    public KnowledgeDocument(String title, String content, Collection<String> tags, String sourceFilename) {
        this.title = title;
        this.content = content;
        this.sourceFilename = sourceFilename;
        this.tags.addAll(tags);
        this.createdAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getContent() {
        return content;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public String getSourceFilename() {
        return sourceFilename;
    }

    public Set<String> getTags() {
        return Set.copyOf(tags);
    }

    public void update(String title, String content, Collection<String> tags) {
        this.title = title;
        this.content = content;
        this.tags.clear();
        this.tags.addAll(tags);
    }
}

