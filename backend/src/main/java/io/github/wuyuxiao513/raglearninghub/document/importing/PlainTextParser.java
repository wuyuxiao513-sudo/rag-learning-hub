package io.github.wuyuxiao513.raglearninghub.document.importing;

import org.springframework.stereotype.Component;

@Component
public class PlainTextParser implements DocumentTextParser {
    @Override
    public boolean supports(String extension) {
        return "txt".equals(extension);
    }

    @Override
    public String parse(byte[] bytes) {
        return Utf8TextDecoder.decode(bytes);
    }
}
