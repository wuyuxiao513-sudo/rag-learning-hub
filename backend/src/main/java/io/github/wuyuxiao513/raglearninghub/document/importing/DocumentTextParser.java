package io.github.wuyuxiao513.raglearninghub.document.importing;

public interface DocumentTextParser {
    boolean supports(String extension);

    String parse(byte[] bytes);
}
