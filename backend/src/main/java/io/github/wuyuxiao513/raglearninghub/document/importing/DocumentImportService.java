package io.github.wuyuxiao513.raglearninghub.document.importing;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Locale;

@Service
public class DocumentImportService {
    private static final long MAX_FILE_SIZE = 1_048_576;
    private static final int MAX_CONTENT_LENGTH = 100_000;
    private final List<DocumentTextParser> parsers;

    public DocumentImportService(List<DocumentTextParser> parsers) {
        this.parsers = parsers;
    }

    public Preview preview(MultipartFile file) {
        if (file == null || file.getOriginalFilename() == null) {
            throw new DocumentImportException(HttpStatus.BAD_REQUEST, "请选择有效文件。");
        }
        String filename = normalizeFilename(file.getOriginalFilename());
        int dot = filename.lastIndexOf('.');
        if (dot <= 0 || dot == filename.length() - 1) {
            throw new DocumentImportException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "仅支持 Markdown 和 TXT 文件。");
        }
        String extension = filename.substring(dot + 1).toLowerCase(Locale.ROOT);
        DocumentTextParser parser = parsers.stream()
                .filter(candidate -> candidate.supports(extension))
                .findFirst()
                .orElseThrow(() -> new DocumentImportException(
                        HttpStatus.UNSUPPORTED_MEDIA_TYPE, "仅支持 Markdown 和 TXT 文件。"));

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new DocumentImportException(HttpStatus.PAYLOAD_TOO_LARGE, "文件不能超过 1 MiB。");
        }
        if (file.isEmpty()) {
            throw new DocumentImportException(HttpStatus.BAD_REQUEST, "文件不能为空。");
        }

        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException exception) {
            throw new DocumentImportException(HttpStatus.BAD_REQUEST, "无法读取上传文件。");
        }
        if (bytes.length > MAX_FILE_SIZE) {
            throw new DocumentImportException(HttpStatus.PAYLOAD_TOO_LARGE, "文件不能超过 1 MiB。");
        }
        String content = parser.parse(bytes);
        if (content.isBlank()) {
            throw new DocumentImportException(HttpStatus.BAD_REQUEST, "文件正文不能为空。");
        }
        if (content.length() > MAX_CONTENT_LENGTH) {
            throw new DocumentImportException(HttpStatus.BAD_REQUEST, "文件正文不能超过 100,000 字符。");
        }
        String title = filename.substring(0, dot).strip();
        if (title.isEmpty()) {
            throw new DocumentImportException(HttpStatus.BAD_REQUEST, "文件名不能作为标题。");
        }
        if (title.length() > 200) {
            title = title.substring(0, 200);
            if (Character.isHighSurrogate(title.charAt(title.length() - 1))) {
                title = title.substring(0, title.length() - 1);
            }
        }
        return new Preview(title, content, filename);
    }

    public static String normalizeFilename(String rawFilename) {
        String filename = rawFilename.replace('\\', '/');
        filename = filename.substring(filename.lastIndexOf('/') + 1).strip();
        if (filename.isEmpty() || filename.length() > 255
                || filename.chars().anyMatch(Character::isISOControl)) {
            throw new DocumentImportException(HttpStatus.BAD_REQUEST, "原文件名无效或超过 255 字符。");
        }
        return filename;
    }

    public record Preview(String title, String content, String sourceFilename) {
    }
}
