export interface KnowledgeDocument {
  id: number
  title: string
  content: string
  tags: string[]
  createdAt: string
  sourceFilename?: string | null
}

export interface DocumentPreview {
  title: string
  content: string
  sourceFilename: string
}

export async function previewDocument(file: File): Promise<DocumentPreview> {
  const formData = new FormData()
  formData.append('file', file)
  const response = await fetch('/api/documents/preview', {
    method: 'POST',
    body: formData,
  })
  if (!response.ok) {
    const problem = await response.json().catch(() => null) as { detail?: string } | null
    throw new Error(problem?.detail || '解析失败，请选择有效的 Markdown、TXT 或 PDF 文件。')
  }
  return response.json()
}

export async function searchDocuments(
  query: string,
  tag = '',
  sort = 'newest',
): Promise<KnowledgeDocument[]> {
  const params = new URLSearchParams()
  if (query.trim()) params.set('q', query.trim())
  if (tag.trim()) params.set('tag', tag.trim())
  if (sort !== 'newest') params.set('sort', sort)

  const response = await fetch(`/api/documents?${params}`)
  if (!response.ok) throw new Error('检索失败，请确认后端已经启动。')
  return response.json()
}

export async function createDocument(
  title: string,
  content: string,
  tags: string[],
  sourceFilename?: string,
): Promise<KnowledgeDocument> {
  const response = await fetch('/api/documents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title,
      content,
      tags,
      ...(sourceFilename ? { sourceFilename } : {}),
    }),
  })
  if (!response.ok) throw new Error('保存失败，请检查标题和正文。')
  return response.json()
}

export async function deleteDocument(id: number): Promise<void> {
  const response = await fetch(`/api/documents/${id}`, { method: 'DELETE' })
  if (!response.ok) throw new Error('删除失败，文档可能已不存在。')
}

export async function updateDocument(
  id: number,
  title: string,
  content: string,
  tags: string[],
): Promise<KnowledgeDocument> {
  const response = await fetch(`/api/documents/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, content, tags }),
  })
  if (!response.ok) throw new Error('更新失败，请检查标题和正文。')
  return response.json()
}

