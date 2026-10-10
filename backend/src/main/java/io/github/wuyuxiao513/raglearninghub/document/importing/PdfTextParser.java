package io.github.wuyuxiao513.raglearninghub.document.importing;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.encryption.InvalidPasswordException;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class PdfTextParser implements DocumentTextParser {
    @Override
    public boolean supports(String extension) {
        return "pdf".equals(extension);
    }

    @Override
    public String parse(byte[] bytes) {
        try (PDDocument document = Loader.loadPDF(bytes)) {
            if (document.isEncrypted() && !document.getCurrentAccessPermission().canExtractContent()) {
                throw new DocumentImportException(HttpStatus.BAD_REQUEST, "PDF 禁止提取文字或需要密码。");
            }
            String content = new PDFTextStripper().getText(document).strip();
            if (content.isEmpty()) {
                throw new DocumentImportException(HttpStatus.BAD_REQUEST, "PDF 未提取到文字；扫描件需要 OCR。");
            }
            return content;
        } catch (InvalidPasswordException exception) {
            throw new DocumentImportException(HttpStatus.BAD_REQUEST, "PDF 需要密码，暂不支持加密文件。");
        } catch (IOException exception) {
            throw new DocumentImportException(HttpStatus.BAD_REQUEST, "PDF 文件损坏或无法解析。");
        }
    }
}
