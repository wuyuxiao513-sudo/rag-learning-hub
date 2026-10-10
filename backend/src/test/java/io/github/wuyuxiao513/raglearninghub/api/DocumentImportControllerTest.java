package io.github.wuyuxiao513.raglearninghub.api;

import io.github.wuyuxiao513.raglearninghub.document.KnowledgeDocumentRepository;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.encryption.AccessPermission;
import org.apache.pdfbox.pdmodel.encryption.StandardProtectionPolicy;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

import static org.hamcrest.Matchers.containsString;
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
        mockMvc.perform(multipart("/api/documents/preview").file(file("notes.docx", "content")))
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

    @Test
    void previewsPdfTextWithoutSavingIt() throws Exception {
        mockMvc.perform(multipart("/api/documents/preview")
                        .file(new MockMultipartFile("file", "guide.PDF", "application/pdf", pdf("RAG PDF content"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("guide"))
                .andExpect(jsonPath("$.sourceFilename").value("guide.PDF"))
                .andExpect(jsonPath("$.content", containsString("RAG PDF content")));
        assertThat(repository.count()).isZero();
    }

    @Test
    void rejectsCorruptPdfWithReadableError() throws Exception {
        mockMvc.perform(multipart("/api/documents/preview")
                        .file(new MockMultipartFile("file", "broken.pdf", "application/pdf", new byte[]{1, 2, 3})))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail", containsString("PDF")));
    }

    @Test
    void rejectsPdfWithoutExtractableText() throws Exception {
        mockMvc.perform(multipart("/api/documents/preview")
                        .file(new MockMultipartFile("file", "scan.pdf", "application/pdf", pdf(""))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail", containsString("文字")));
    }

    @Test
    void rejectsPasswordProtectedPdf() throws Exception {
        mockMvc.perform(multipart("/api/documents/preview")
                        .file(new MockMultipartFile("file", "locked.pdf", "application/pdf", protectedPdf())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail", containsString("密码")));
    }

    private byte[] pdf(String text) throws IOException {
        try (PDDocument document = new PDDocument();
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            PDPage page = new PDPage();
            document.addPage(page);
            if (!text.isEmpty()) {
                try (PDPageContentStream stream = new PDPageContentStream(document, page)) {
                    stream.beginText();
                    stream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 12);
                    stream.newLineAtOffset(50, 700);
                    stream.showText(text);
                    stream.endText();
                }
            }
            document.save(output);
            return output.toByteArray();
        }
    }

    private byte[] protectedPdf() throws IOException {
        try (PDDocument document = new PDDocument();
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            document.addPage(new PDPage());
            document.protect(new StandardProtectionPolicy(
                    "owner-password", "user-password", new AccessPermission()));
            document.save(output);
            return output.toByteArray();
        }
    }

    private MockMultipartFile file(String filename, String content) {
        return new MockMultipartFile("file", filename, "text/plain", content.getBytes(StandardCharsets.UTF_8));
    }
}
