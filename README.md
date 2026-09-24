# RAG Learning Hub

一个面向学生与开发者的渐进式 RAG 学习项目：从可运行的文档管理与关键词检索开始，逐步演进到向量检索、混合搜索、引用溯源和自动化评测。

## 为什么做这个项目

- 用一个真实产品串联 Spring Boot、Vue、数据库和 AI 应用开发。
- 每个里程碑都有可验证的功能，适合长期维护，而不是一次性 Demo。
- 记录架构决策、实验数据和踩坑过程，形成可复用的学习资料。

## 当前版本：v0.1 Foundation

- 创建和查看文档
- 标题、正文关键词检索
- Vue 3 单页界面
- H2 本地数据库与 Flyway 迁移
- Actuator 健康检查
- 后端接口测试与 GitHub Actions
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

```http
POST /api/documents
Content-Type: application/json

{
  "title": "RAG 入门",
  "content": "检索增强生成先检索可信资料，再把上下文交给模型。"
}
```

```http
GET /api/documents?q=检索
GET /api/documents/{id}
```

## 路线图

- [x] v0.1：文档管理、关键词检索与基础界面
- [ ] v0.2：Markdown/PDF 上传、解析和分块
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
