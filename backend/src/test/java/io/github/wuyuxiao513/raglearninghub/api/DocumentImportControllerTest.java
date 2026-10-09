package io.github.wuyuxiao513.raglearninghub.api;

import io.github.wuyuxiao513.raglearninghub.document.KnowledgeDocumentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.charset.StandardCharsets;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@AutoConfigureMockMvc
class DocumentImportControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private KnowledgeDocumentRepository repository;

    @BeforeEach
    void cleanDatabase() {
        repository.deleteAll();
    }

    @Test
    void previewsMarkdownWithoutSavingIt() throws Exception {
        mockMvc.perform(multipart("/api/documents/preview")
                        .file(file("向量检索.md", "# 向量检索\n<script>alert(1)</script>")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("向量检索"))
                .andExpect(jsonPath("$.sourceFilename").value("向量检索.md"))
                .andExpect(jsonPath("$.content").value("# 向量检索\n<script>alert(1)</script>"));
        assertThat(repository.count()).isZero();
    }

    @Test
    void previewsTxtAndMarkdownExtensionsCaseInsensitively() throws Exception {
        mockMvc.perform(multipart("/api/documents/preview").file(file("notes.TXT", "中文笔记")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("notes"))
                .andExpect(jsonPath("$.content").value("中文笔记"));
        mockMvc.perform(multipart("/api/documents/preview").file(file("guide.MARKDOWN", "# 指南")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("guide"));
    }

    @Test
    void acceptsUtf8BomAndNormalizesPathBearingFilename() throws Exception {
        byte[] text = "中文".getBytes(StandardCharsets.UTF_8);
        byte[] bytes = new byte[text.length + 3];
        bytes[0] = (byte) 0xEF;
        bytes[1] = (byte) 0xBB;
        bytes[2] = (byte) 0xBF;
        System.arraycopy(text, 0, bytes, 3, text.length);
        mockMvc.perform(multipart("/api/documents/preview")
                        .file(new MockMultipartFile("file", "C:\\notes\\资料.txt", "text/plain", bytes)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sourceFilename").value("资料.txt"))
                .andExpect(jsonPath("$.title").value("资料"))
                .andExpect(jsonPath("$.content").value("中文"));
    }

    @Test
    void rejectsEmptyAndWhitespaceOnlyFiles() throws Exception {
        mockMvc.perform(multipart("/api/documents/preview").file(file("empty.md", "")))
                .andExpect(status().isBadRequest());
        mockMvc.perform(multipart("/api/documents/preview").file(file("blank.txt", "  \n")))
                .andExpect(status().isBadRequest());
        assertThat(repository.count()).isZero();
    }

    @Test
    void rejectsMalformedUtf8() throws Exception {
        mockMvc.perform(multipart("/api/documents/preview")
                        .file(new MockMultipartFile("file", "bad.txt", "text/plain", new byte[]{(byte) 0xC3, 0x28})))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").isNotEmpty());
    }

    @Test
    void rejectsUnsupportedExtension() throws Exception {
        mockMvc.perform(multipart("/api/documents/preview").file(file("notes.pdf", "content")))
                .andExpect(status().isUnsupportedMediaType());
    }

    @Test
    void rejectsFileLargerThanOneMebibyte() throws Exception {
        mockMvc.perform(multipart("/api/documents/preview")
                        .file(new MockMultipartFile("file", "large.md", "text/markdown", new byte[1_048_577])))
                .andExpect(status().isPayloadTooLarge())
                .andExpect(jsonPath("$.detail").isNotEmpty());
    }

    @Test
    void rejectsDecodedContentLongerThanDocumentLimit() throws Exception {
        mockMvc.perform(multipart("/api/documents/preview").file(file("long.md", "a".repeat(100_001))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void rejectsMissingFilename() throws Exception {
        mockMvc.perform(multipart("/api/documents/preview")
                        .file(new MockMultipartFile("file", "", "text/plain", "text".getBytes(StandardCharsets.UTF_8))))
                .andExpect(status().isBadRequest());
    }

    private MockMultipartFile file(String filename, String content) {
        return new MockMultipartFile("file", filename, "text/plain", content.getBytes(StandardCharsets.UTF_8));
    }
}
