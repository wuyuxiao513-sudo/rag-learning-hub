package io.github.wuyuxiao513.raglearninghub.document.importing;

import org.springframework.http.HttpStatus;

import java.nio.ByteBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;

final class Utf8TextDecoder {
    private Utf8TextDecoder() {
    }

    static String decode(byte[] bytes) {
        int offset = bytes.length >= 3
                && (bytes[0] & 0xff) == 0xef
                && (bytes[1] & 0xff) == 0xbb
                && (bytes[2] & 0xff) == 0xbf ? 3 : 0;
        try {
            return StandardCharsets.UTF_8.newDecoder()
                    .onMalformedInput(CodingErrorAction.REPORT)
                    .onUnmappableCharacter(CodingErrorAction.REPORT)
                    .decode(ByteBuffer.wrap(bytes, offset, bytes.length - offset))
                    .toString();
        } catch (CharacterCodingException exception) {
            throw new DocumentImportException(HttpStatus.BAD_REQUEST, "文件必须使用 UTF-8 编码。");
        }
    }
}
