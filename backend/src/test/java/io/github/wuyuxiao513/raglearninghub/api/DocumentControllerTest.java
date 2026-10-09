package io.github.wuyuxiao513.raglearninghub.api;

import io.github.wuyuxiao513.raglearninghub.document.KnowledgeDocumentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.nullValue;

@SpringBootTest
@AutoConfigureMockMvc
class DocumentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private KnowledgeDocumentRepository repository;

    @BeforeEach
    void cleanDatabase() {
        repository.deleteAll();
    }

    @Test
    void createsAndFindsDocument() throws Exception {
        mockMvc.perform(post("/api/documents")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "RAG 入门",
                                  "content": "向量检索为模型提供可信上下文。"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.title").value("RAG 入门"));

        mockMvc.perform(get("/api/documents").queryParam("q", "向量"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("RAG 入门"));
    }

    @Test
    void rejectsBlankDocument() throws Exception {
        mockMvc.perform(post("/api/documents")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title": "", "content": ""}
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void deletesExistingDocument() throws Exception {
        String response = mockMvc.perform(post("/api/documents")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "待删除资料",
                                  "content": "这份资料不再需要。"
                                }
                                """))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        long id = Long.parseLong(response.replaceAll(".*\\\"id\\\":(\\d+).*", "$1"));

        mockMvc.perform(delete("/api/documents/{id}", id))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/documents/{id}", id))
                .andExpect(status().isNotFound());
    }

    @Test
    void updatesExistingDocument() throws Exception {
        String response = mockMvc.perform(post("/api/documents")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "旧标题",
                                  "content": "旧正文"
                                }
                                """))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        long id = Long.parseLong(response.replaceAll(".*\\\"id\\\":(\\d+).*", "$1"));

        mockMvc.perform(put("/api/documents/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "  新标题  ",
                                  "content": "  新正文  "
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id))
                .andExpect(jsonPath("$.title").value("新标题"))
                .andExpect(jsonPath("$.content").value("新正文"));

        mockMvc.perform(get("/api/documents/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("新标题"));
    }

    @Test
    void createsDocumentWithNormalizedTags() throws Exception {
        mockMvc.perform(post("/api/documents")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "带标签资料",
                                  "content": "标签应该被保存并去重。",
                                  "tags": [" RAG ", "rag", "Spring AI"]
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.tags", containsInAnyOrder("RAG", "Spring AI")));
    }

    @Test
    void updatesDocumentTags() throws Exception {
        String response = mockMvc.perform(post("/api/documents")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "待更新标签",
                                  "content": "原始正文",
                                  "tags": ["旧标签"]
                                }
                                """))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        long id = Long.parseLong(response.replaceAll(".*\\\"id\\\":(\\d+).*", "$1"));

        mockMvc.perform(put("/api/documents/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "标签已更新",
                                  "content": "更新后的正文",
                                  "tags": ["RAG", "Spring AI"]
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tags", containsInAnyOrder("RAG", "Spring AI")));

        mockMvc.perform(get("/api/documents/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tags", containsInAnyOrder("RAG", "Spring AI")));
    }

    @Test
    void combinesKeywordAndTagFiltersAndSortsByTitle() throws Exception {
        mockMvc.perform(post("/api/documents")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title": "B 向量资料", "content": "基础", "tags": ["RAG", "Spring AI"]}
                                """))
                .andExpect(status().isCreated());
        mockMvc.perform(post("/api/documents")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title": "A 向量资料", "content": "实践", "tags": ["RAG"]}
                                """))
                .andExpect(status().isCreated());
        mockMvc.perform(post("/api/documents")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title": "C 数据库资料", "content": "数据库", "tags": ["Spring AI"]}
                                """))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/documents")
                        .queryParam("q", "资料")
                        .queryParam("tag", "RAG")
                        .queryParam("sort", "title"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].title", contains("A 向量资料", "B 向量资料")));
    }

    @Test
    void rejectsMoreThanTenTags() throws Exception {
        mockMvc.perform(post("/api/documents")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "标签过多",
                                  "content": "最多允许十个标签。",
                                  "tags": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"]
                                }
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void rejectsTagLongerThanThirtyCharacters() throws Exception {
        mockMvc.perform(post("/api/documents")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "标签过长",
                                  "content": "标签长度需要受到限制。",
                                  "tags": ["1234567890123456789012345678901"]
                                }
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void sortsOldestDocumentsFirst() throws Exception {
        mockMvc.perform(post("/api/documents")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title": "先创建", "content": "第一篇", "tags": []}
                                """))
                .andExpect(status().isCreated());
        mockMvc.perform(post("/api/documents")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title": "后创建", "content": "第二篇", "tags": []}
                                """))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/documents").queryParam("sort", "oldest"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].title", contains("先创建", "后创建")));
    }

    @Test
    void savesImportedSourceFilenameAndPreservesItOnEdit() throws Exception {
        String response = mockMvc.perform(post("/api/documents")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "导入资料",
                                  "content": "# 导入正文",
                                  "sourceFilename": "C:/notes/资料.md"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.sourceFilename").value("资料.md"))
                .andReturn().getResponse().getContentAsString();

        long id = Long.parseLong(response.replaceAll(".*\\\"id\\\":(\\d+).*", "$1"));
        mockMvc.perform(put("/api/documents/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title": "改过标题", "content": "改过正文", "tags": ["RAG"]}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sourceFilename").value("资料.md"));
        mockMvc.perform(get("/api/documents/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sourceFilename").value("资料.md"));
    }

    @Test
    void manualDocumentHasNullSourceFilename() throws Exception {
        mockMvc.perform(post("/api/documents")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title": "手动创建", "content": "没有原文件。"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.sourceFilename").value(nullValue()));
    }

    @Test
    void rejectsBlankAndTooLongSourceFilenames() throws Exception {
        mockMvc.perform(post("/api/documents")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title": "资料", "content": "正文", "sourceFilename": "  "}
                                """))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/documents")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title": "资料", "content": "正文", "sourceFilename": "%s"}
                                """.formatted("x".repeat(256))))
                .andExpect(status().isBadRequest());
    }
}
