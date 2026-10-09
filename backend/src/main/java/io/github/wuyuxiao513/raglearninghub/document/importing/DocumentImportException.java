package io.github.wuyuxiao513.raglearninghub.document.importing;

import org.springframework.http.HttpStatus;

public class DocumentImportException extends RuntimeException {
    private final HttpStatus status;

    public DocumentImportException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
