package io.github.wuyuxiao513.raglearninghub.document;

public class DocumentNotFoundException extends RuntimeException {

    public DocumentNotFoundException(Long id) {
        super("Document %d was not found".formatted(id));
    }
}

