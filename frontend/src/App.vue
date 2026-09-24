<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { createDocument, searchDocuments, type KnowledgeDocument } from './api'

const query = ref('')
const title = ref('')
const content = ref('')
const documents = ref<KnowledgeDocument[]>([])
const message = ref('')
const loading = ref(false)

async function search() {
  loading.value = true
  message.value = ''
  try {
    documents.value = await searchDocuments(query.value)
  } catch (error) {
    message.value = error instanceof Error ? error.message : '发生未知错误'
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
    message.value = '文档已保存。'
    await search()
  } catch (error) {
    message.value = error instanceof Error ? error.message : '发生未知错误'
  } finally {
    loading.value = false
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

      <p v-if="message" class="message">{{ message }}</p>
      <p v-if="!loading && documents.length === 0" class="empty">还没有匹配的文档。</p>

      <article v-for="document in documents" :key="document.id" class="document">
        <div>
          <small>#{{ document.id }} · {{ new Date(document.createdAt).toLocaleString() }}</small>
          <h3>{{ document.title }}</h3>
        </div>
        <p>{{ document.content }}</p>
      </article>
    </section>
  </main>
</template>

