<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  createDocument,
  deleteDocument,
  previewDocument,
  searchDocuments,
  updateDocument,
  type KnowledgeDocument,
} from './api'

const query = ref('')
const activeQuery = ref('')
const selectedTag = ref('')
const activeTag = ref('')
const sortOrder = ref('newest')
const activeSort = ref('newest')
const title = ref('')
const content = ref('')
const tagsInput = ref('')
const sourceFilename = ref('')
const importMessage = ref('')
const previewing = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
let previewRequestId = 0
const documents = ref<KnowledgeDocument[]>([])
const availableTags = ref<string[]>([])
const message = ref('')
const loading = ref(false)
const deletingId = ref<number | null>(null)
const editingId = ref<number | null>(null)
const updatingId = ref<number | null>(null)
const editTitle = ref('')
const editContent = ref('')
const editTagsInput = ref('')
const hasActiveSearch = computed(() => (
  Boolean(activeQuery.value || activeTag.value) || activeSort.value !== 'newest'
))

function parseTags(value: string): string[] {
  const tags = value
    .split(/[,，]/)
    .map((tag) => tag.trim())
    .filter(Boolean)
  return [...new Map(tags.map((tag) => [tag.toLocaleLowerCase(), tag])).values()]
}

function rememberTags(results: KnowledgeDocument[]) {
  const tags = results.flatMap((document) => document.tags ?? [])
  availableTags.value = [...new Set([...availableTags.value, ...tags])]
    .sort((left, right) => left.localeCompare(right))
}

async function previewFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  input.value = ''

  const requestId = ++previewRequestId
  previewing.value = true
  importMessage.value = ''
  try {
    const preview = await previewDocument(file)
    if (requestId !== previewRequestId) return
    title.value = preview.title
    content.value = preview.content
    sourceFilename.value = preview.sourceFilename
    importMessage.value = '文件已解析，请确认内容后保存。'
  } catch (error) {
    if (requestId !== previewRequestId) return
    importMessage.value = error instanceof Error ? error.message : '文件解析失败。'
  } finally {
    if (requestId === previewRequestId) previewing.value = false
  }
}

async function search(): Promise<boolean> {
  const requestedQuery = query.value.trim()
  const requestedTag = selectedTag.value
  const requestedSort = sortOrder.value
  loading.value = true
  message.value = ''
  try {
    const results = await searchDocuments(requestedQuery, requestedTag, requestedSort)
    documents.value = results
    rememberTags(results)
    activeQuery.value = requestedQuery
    activeTag.value = requestedTag
    activeSort.value = requestedSort
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
    await createDocument(
      title.value, content.value, parseTags(tagsInput.value), sourceFilename.value || undefined,
    )
    title.value = ''
    content.value = ''
    tagsInput.value = ''
    sourceFilename.value = ''
    importMessage.value = ''
    if (fileInput.value) fileInput.value.value = ''
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
  selectedTag.value = ''
  sortOrder.value = 'newest'
  await search()
}

function startEdit(document: KnowledgeDocument) {
  editingId.value = document.id
  editTitle.value = document.title
  editContent.value = document.content
  editTagsInput.value = (document.tags ?? []).join(', ')
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
    const updated = await updateDocument(
      document.id,
      nextTitle,
      nextContent,
      parseTags(editTagsInput.value),
    )
    documents.value = documents.value.map((item) => item.id === updated.id ? updated : item)
    rememberTags([updated])
    editingId.value = null
    const refreshed = await search()
    if (refreshed) message.value = '文档已更新。'
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
      <label class="import-control">
        导入 Markdown / TXT / PDF 文件
        <input
          ref="fileInput"
          type="file"
          accept=".md,.markdown,.txt,.pdf"
          @change="previewFile"
        />
      </label>
      <p v-if="previewing" class="import-status" aria-live="polite">正在解析文件…</p>
      <p v-else-if="importMessage" class="import-status" aria-live="polite">{{ importMessage }}</p>
      <p v-if="sourceFilename" class="import-source">来源：{{ sourceFilename }}</p>
      <label>
        标题
        <input v-model="title" maxlength="200" placeholder="例如：向量检索基础" />
      </label>
      <label>
        正文
        <textarea v-model="content" rows="7" placeholder="粘贴一段值得检索的技术笔记……" />
      </label>
      <label>
        标签
        <input v-model="tagsInput" maxlength="320" placeholder="例如：RAG, Spring AI" />
      </label>
      <button :disabled="loading || previewing" @click="save">保存文档</button>
    </section>

    <section class="panel results">
      <div class="section-title">
        <span>02</span>
        <h2>检索知识库</h2>
      </div>
      <form class="search" @submit.prevent="search">
        <div class="search-primary">
          <input v-model="query" placeholder="输入标题或正文关键词" />
          <button :disabled="loading">{{ loading ? '检索中' : '搜索' }}</button>
          <button
            v-if="hasActiveSearch"
            class="clear-search secondary-button"
            type="button"
            :disabled="loading"
            @click="clearSearch"
          >
            清空搜索
          </button>
        </div>
        <div class="search-filters">
          <label>
            标签
            <select v-model="selectedTag" aria-label="按标签筛选">
              <option value="">全部标签</option>
              <option v-for="tag in availableTags" :key="tag" :value="tag">{{ tag }}</option>
            </select>
          </label>
          <label>
            排序
            <select v-model="sortOrder" aria-label="排序方式">
              <option value="newest">最新创建</option>
              <option value="oldest">最早创建</option>
              <option value="title">标题排序</option>
            </select>
          </label>
        </div>
      </form>

      <p class="result-summary" aria-live="polite">
        {{ loading
          ? '正在加载文档…'
          : activeQuery || activeTag
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
          <label>
            标签
            <input v-model="editTagsInput" maxlength="320" placeholder="例如：RAG, Spring AI" />
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
              <small v-if="document.sourceFilename" class="source-file">
                来源：{{ document.sourceFilename }}
              </small>
              <h3>{{ document.title }}</h3>
              <div v-if="document.tags?.length" class="tag-list">
                <button
                  v-for="tag in document.tags"
                  :key="tag"
                  class="tag-pill"
                  type="button"
                  @click="selectedTag = tag; search()"
                >
                  {{ tag }}
                </button>
              </div>
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

