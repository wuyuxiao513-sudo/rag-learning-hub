<script setup lang="ts">
import { onMounted, ref } from 'vue'
import {
  createDocument,
  deleteDocument,
  searchDocuments,
  updateDocument,
  type KnowledgeDocument,
} from './api'

const query = ref('')
const activeQuery = ref('')
const title = ref('')
const content = ref('')
const documents = ref<KnowledgeDocument[]>([])
const message = ref('')
const loading = ref(false)
const deletingId = ref<number | null>(null)
const editingId = ref<number | null>(null)
const updatingId = ref<number | null>(null)
const editTitle = ref('')
const editContent = ref('')

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

async function clearSearch() {
  query.value = ''
  await search()
}

function startEdit(document: KnowledgeDocument) {
  editingId.value = document.id
  editTitle.value = document.title
  editContent.value = document.content
  message.value = ''
}

async function saveEdit(document: KnowledgeDocument) {
  const nextTitle = editTitle.value.trim()
  const nextContent = editContent.value.trim()
  if (!nextTitle || !nextContent) {
    message.value = '标题和正文不能为空。'
    return
  }

  updatingId.value = document.id
  message.value = ''
  try {
    const updated = await updateDocument(document.id, nextTitle, nextContent)
    documents.value = documents.value.map((item) => item.id === updated.id ? updated : item)
    editingId.value = null
    message.value = '文档已更新。'
  } catch (error) {
    message.value = error instanceof Error ? error.message : '发生未知错误'
  } finally {
    updatingId.value = null
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
        <button
          v-if="activeQuery"
          class="clear-search secondary-button"
          type="button"
          :disabled="loading"
          @click="clearSearch"
        >
          清空搜索
        </button>
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
        <form
          v-if="editingId === document.id"
          class="document-edit"
          @submit.prevent="saveEdit(document)"
        >
          <label>
            标题
            <input v-model="editTitle" maxlength="200" />
          </label>
          <label>
            正文
            <textarea v-model="editContent" rows="5" />
          </label>
          <div class="document-actions">
            <button
              class="save-edit"
              :disabled="updatingId === document.id"
            >
              {{ updatingId === document.id ? '保存中' : '保存修改' }}
            </button>
            <button
              class="cancel-edit secondary-button"
              type="button"
              :disabled="updatingId === document.id"
              @click="editingId = null"
            >
              取消
            </button>
          </div>
        </form>
        <template v-else>
          <div class="document-heading">
            <div>
              <small>#{{ document.id }} · {{ new Date(document.createdAt).toLocaleString() }}</small>
              <h3>{{ document.title }}</h3>
            </div>
            <div class="document-actions">
              <button
                class="edit-button secondary-button"
                type="button"
                :aria-label="`编辑${document.title}`"
                @click="startEdit(document)"
              >
                编辑
              </button>
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
          </div>
          <p>{{ document.content }}</p>
        </template>
      </article>
    </section>
  </main>
</template>

