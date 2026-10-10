# RAG Learning Hub

一个面向学生与开发者的渐进式 RAG 学习项目：从可运行的文档管理与关键词检索开始，逐步演进到向量检索、混合搜索、引用溯源和自动化评测。

## 为什么做这个项目

- 用一个真实产品串联 Spring Boot、Vue、数据库和 AI 应用开发。
- 每个里程碑都有可验证的功能，适合长期维护，而不是一次性 Demo。
- 记录架构决策、实验数据和踩坑过程，形成可复用的学习资料。

## 当前版本：v0.2.1 PDF 文字导入

- 创建、查看、编辑和删除文档
- 每篇文档最多添加 10 个自由标签
- 关键词与标签组合筛选，支持最新、最早和标题排序
- 点击标签直接筛选，并可一键清空搜索条件
- 上传 Markdown/TXT/PDF 文件，预览并修改解析出的标题、正文和标签后保存
- 仅保存解析后的文字和原文件名；不保存原始文件
- Vue 3 单页界面、结果数量与操作状态反馈
- H2 本地数据库与 Flyway 迁移
- Actuator 健康检查
- 前后端自动化测试与 GitHub Actions
- MySQL、Redis、Qdrant 的 Docker Compose 基础设施

## 快速开始

### 后端

需要 Java 17+ 和 Maven 3.9+。

```bash
cd backend
./mvnw spring-boot:run
```

API 默认运行在 `http://localhost:8080`，健康检查地址为
`http://localhost:8080/actuator/health`。

### 前端

需要 Node.js 20+。

```bash
cd frontend
npm install
npm run dev
```

浏览器访问 `http://localhost:5173`。

### 可选基础设施

```bash
docker compose up -d
```

默认开发环境使用 H2，不启动容器也能运行。后续接入向量检索时使用 Qdrant；切换 MySQL 时启用 `docker` profile。

```bash
cd backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=docker
```

## API

文件预览不会写入数据库。支持 `.md`、`.markdown`、`.txt` 和 `.pdf`，文件不超过 1 MiB；Markdown/TXT 必须是 UTF-8 编码，解析后正文最多 100,000 字符。PDF 仅提取可选中的文字，不支持加密文件或扫描件 OCR。

```bash
curl -F "file=@notes.md" http://localhost:8080/api/documents/preview
```

预览结果包含 `title`、`content` 和 `sourceFilename`。确认内容后，通过现有创建接口保存；导入文档可在请求中额外传入 `sourceFilename`。手动创建时省略该字段即可。

```http
POST /api/documents
Content-Type: application/json

{
  "title": "RAG 入门",
  "content": "检索增强生成先检索可信资料，再把上下文交给模型。",
  "tags": ["RAG", "检索"]
}
```

```http
PUT /api/documents/{id}
Content-Type: application/json

{
  "title": "更新后的标题",
  "content": "更新后的正文",
  "tags": ["Spring AI", "向量检索"]
}
```

```http
GET /api/documents?q=检索&tag=RAG&sort=title
GET /api/documents/{id}
DELETE /api/documents/{id}
```

`sort` 支持 `newest`、`oldest` 和 `title`，默认使用 `newest`。

## 路线图

- [x] v0.1：文档管理、关键词检索与基础界面
- [x] v0.1.1：文档删除、状态反馈与前端组件测试
- [x] v0.1.2：文档编辑、清空搜索与交互反馈
- [x] v0.1.3：多标签、组合筛选与排序
- [x] v0.2.0：Markdown/TXT 导入、可编辑预览与来源文件名
- [x] v0.2.1：PDF 文字导入与可编辑预览
- [ ] v0.2.2：分块预览与重复内容校验
- [ ] v0.3：Embedding 与 Qdrant 向量检索
- [ ] v0.4：Spring AI 问答、引用溯源
- [ ] v0.5：BM25 + 向量混合检索、重排序
- [ ] v0.6：用户系统、知识库隔离、对话历史
- [ ] v0.7：RAGAS 风格评测集与可视化面板
- [ ] v0.8：LangChain4j 适配器和实现对比
- [ ] v1.0：部署、安全、监控与完整使用文档

详细规划见 [ROADMAP.md](docs/ROADMAP.md)，架构说明见 [overview.md](docs/architecture/overview.md)。

## 贡献方式

欢迎通过 Issue 提交需求或缺陷。每次提交应包含一个可说明、可验证的改进；请避免空提交或无意义拆分。

## License

[MIT](LICENSE)
