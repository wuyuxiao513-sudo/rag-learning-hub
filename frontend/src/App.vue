<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { createDocument, deleteDocument, searchDocuments, type KnowledgeDocument } from './api'

const query = ref('')
const activeQuery = ref('')
const title = ref('')
const content = ref('')
const documents = ref<KnowledgeDocument[]>([])
const message = ref('')
const loading = ref(false)
const deletingId = ref<number | null>(null)

async function search(): Promise<boolean> {
  const requestedQuery = query.value.trim()
  loading.value = true
  message.value = ''
  try {
    documents.value = await searchDocuments(requestedQuery)
    activeQuery.value = requestedQuery
    return true
  } catch (error) {
    message.value = error instanceof Error ? error.message : '发生未知错误'
    return false
  } finally {
    loading.value = false
  }
}

async function save() {
  if (!title.value.trim() || !content.value.trim()) {
    message.value = '标题和正文不能为空。'
    return
  }

  loading.value = true
  message.value = ''
  try {
    await createDocument(title.value, content.value)
    title.value = ''
    content.value = ''
    const refreshed = await search()
    if (refreshed) message.value = '文档已保存。'
  } catch (error) {
    message.value = error instanceof Error ? error.message : '发生未知错误'
  } finally {
    loading.value = false
  }
}

async function remove(document: KnowledgeDocument) {
  if (!window.confirm(`确定删除“${document.title}”吗？此操作无法撤销。`)) return

  deletingId.value = document.id
  message.value = ''
  try {
    await deleteDocument(document.id)
    const refreshed = await search()
    if (refreshed) message.value = '文档已删除。'
  } catch (error) {
    message.value = error instanceof Error ? error.message : '发生未知错误'
  } finally {
    deletingId.value = null
  }
}

onMounted(search)
</script>

<template>
  <main>
    <header class="hero">
      <span class="eyebrow">BUILD · RETRIEVE · EVALUATE</span>
      <h1>RAG Learning Hub</h1>
      <p>从关键词搜索开始，持续演进为可评测、可溯源的 RAG 知识库。</p>
    </header>

    <section class="panel composer">
      <div class="section-title">
        <span>01</span>
        <h2>添加学习资料</h2>
      </div>
      <label>
        标题
        <input v-model="title" maxlength="200" placeholder="例如：向量检索基础" />
      </label>
      <label>
        正文
        <textarea v-model="content" rows="7" placeholder="粘贴一段值得检索的技术笔记……" />
      </label>
      <button :disabled="loading" @click="save">保存文档</button>
    </section>

    <section class="panel results">
      <div class="section-title">
        <span>02</span>
        <h2>检索知识库</h2>
      </div>
      <form class="search" @submit.prevent="search">
        <input v-model="query" placeholder="输入标题或正文关键词" />
        <button :disabled="loading">{{ loading ? '检索中' : '搜索' }}</button>
      </form>

      <p class="result-summary" aria-live="polite">
        {{ loading
          ? '正在加载文档…'
          : activeQuery
            ? `找到 ${documents.length} 条结果`
            : `知识库共 ${documents.length} 篇文档`
        }}
      </p>

      <p v-if="message" class="message">{{ message }}</p>
      <p v-if="!loading && documents.length === 0" class="empty">还没有匹配的文档。</p>

      <article v-for="document in documents" :key="document.id" class="document">
        <div class="document-heading">
          <div>
            <small>#{{ document.id }} · {{ new Date(document.createdAt).toLocaleString() }}</small>
            <h3>{{ document.title }}</h3>
          </div>
          <button
            class="delete-button"
            type="button"
            :aria-label="`删除${document.title}`"
            :disabled="deletingId === document.id"
            @click="remove(document)"
          >
            {{ deletingId === document.id ? '删除中' : '删除' }}
          </button>
        </div>
        <p>{{ document.content }}</p>
      </article>
    </section>
  </main>
</template>

