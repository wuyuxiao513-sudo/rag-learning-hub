import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App.vue'

describe('App', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows a delete action for each loaded document', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{
        id: 7,
        title: '检索笔记',
        content: '用于测试删除入口。',
        createdAt: '2026-09-28T06:00:00Z',
      }],
    }))

    const wrapper = mount(App)
    await flushPromises()

    expect(wrapper.find('button[aria-label="删除检索笔记"]').exists()).toBe(true)
    expect(wrapper.get('.result-summary').text()).toBe('知识库共 1 篇文档')

    await wrapper.get('input[placeholder="输入标题或正文关键词"]').setValue('检索')
    await wrapper.get('form.search').trigger('submit')
    await flushPromises()

    expect(wrapper.get('.result-summary').text()).toBe('找到 1 条结果')
  })

  it('deletes a confirmed document and refreshes the results', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{
          id: 7,
          title: '检索笔记',
          content: '用于测试删除行为。',
          createdAt: '2026-09-28T06:00:00Z',
        }],
      })
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: true, json: async () => [] })

    vi.stubGlobal('fetch', fetchMock)
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true))

    const wrapper = mount(App)
    await flushPromises()
    await wrapper.get('button[aria-label="删除检索笔记"]').trigger('click')
    await flushPromises()

    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/documents/7', { method: 'DELETE' })
    expect(wrapper.findAll('.document')).toHaveLength(0)
    expect(wrapper.text()).toContain('文档已删除。')
  })

  it('keeps the refresh error visible after a successful delete', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{
          id: 7,
          title: '检索笔记',
          content: '用于测试刷新失败。',
          createdAt: '2026-09-28T06:00:00Z',
        }],
      })
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: false })

    vi.stubGlobal('fetch', fetchMock)
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true))

    const wrapper = mount(App)
    await flushPromises()
    await wrapper.get('button[aria-label="删除检索笔记"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('检索失败，请确认后端已经启动。')
    expect(wrapper.text()).not.toContain('文档已删除。')
  })

  it('shows the success message after saving and refreshing', async () => {
    const savedDocument = {
      id: 8,
      title: '新资料',
      content: '保存状态需要保留。',
      createdAt: '2026-09-28T06:10:00Z',
    }
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => savedDocument })
      .mockResolvedValueOnce({ ok: true, json: async () => [savedDocument] })

    vi.stubGlobal('fetch', fetchMock)

    const wrapper = mount(App)
    await flushPromises()
    await wrapper.get('input[placeholder="例如：向量检索基础"]').setValue('新资料')
    await wrapper.get('textarea').setValue('保存状态需要保留。')
    await wrapper.get('.composer > button').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('文档已保存。')
    expect(wrapper.text()).toContain('新资料')
  })

  it('edits a document and updates the visible card', async () => {
    const originalDocument = {
      id: 7,
      title: '旧标题',
      content: '旧正文',
      tags: ['旧标签'],
      createdAt: '2026-09-28T06:00:00Z',
    }
    const updatedDocument = {
      ...originalDocument,
      title: '新标题',
      content: '新正文',
      tags: ['RAG', 'Spring AI'],
    }
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [originalDocument] })
      .mockResolvedValueOnce({ ok: true, json: async () => updatedDocument })
      .mockResolvedValueOnce({ ok: true, json: async () => [updatedDocument] })

    vi.stubGlobal('fetch', fetchMock)

    const wrapper = mount(App)
    await flushPromises()
    await wrapper.get('button[aria-label="编辑旧标题"]').trigger('click')
    await wrapper.get('.document-edit input').setValue('新标题')
    await wrapper.get('.document-edit textarea').setValue('新正文')
    await wrapper.get('.document-edit input[placeholder="例如：RAG, Spring AI"]').setValue('RAG, Spring AI')
    await wrapper.get('form.document-edit').trigger('submit')
    await flushPromises()

    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/documents/7', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '新标题', content: '新正文', tags: ['RAG', 'Spring AI'] }),
    })
    expect(wrapper.text()).toContain('新标题')
    expect(wrapper.text()).toContain('新正文')
    expect(wrapper.text()).toContain('文档已更新。')
  })

  it('clears an active search and reloads all documents', async () => {
    const firstDocument = {
      id: 7,
      title: '检索笔记',
      content: '第一篇正文。',
      createdAt: '2026-09-28T06:00:00Z',
    }
    const secondDocument = {
      id: 8,
      title: '完整资料',
      content: '第二篇正文。',
      createdAt: '2026-09-28T06:10:00Z',
    }
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [firstDocument, secondDocument] })
      .mockResolvedValueOnce({ ok: true, json: async () => [firstDocument] })
      .mockResolvedValueOnce({ ok: true, json: async () => [firstDocument, secondDocument] })

    vi.stubGlobal('fetch', fetchMock)

    const wrapper = mount(App)
    await flushPromises()
    const searchInput = wrapper.get('input[placeholder="输入标题或正文关键词"]')
    await searchInput.setValue('检索')
    await wrapper.get('form.search').trigger('submit')
    await flushPromises()

    expect(wrapper.get('.result-summary').text()).toBe('找到 1 条结果')
    await wrapper.get('.clear-search').trigger('click')
    await flushPromises()

    expect(fetchMock).toHaveBeenNthCalledWith(3, '/api/documents?')
    expect((searchInput.element as HTMLInputElement).value).toBe('')
    expect(wrapper.get('.result-summary').text()).toBe('知识库共 2 篇文档')
  })

  it('saves comma-separated tags and renders returned tag pills', async () => {
    const savedDocument = {
      id: 9,
      title: '标签资料',
      content: '标签正文。',
      tags: ['RAG', 'Spring AI'],
      createdAt: '2026-09-30T06:00:00Z',
    }
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => savedDocument })
      .mockResolvedValueOnce({ ok: true, json: async () => [savedDocument] })

    vi.stubGlobal('fetch', fetchMock)

    const wrapper = mount(App)
    await flushPromises()
    await wrapper.get('input[placeholder="例如：向量检索基础"]').setValue('标签资料')
    await wrapper.get('.composer textarea').setValue('标签正文。')
    await wrapper.get('input[placeholder="例如：RAG, Spring AI"]').setValue('RAG，Spring AI')
    await wrapper.get('.composer > button').trigger('click')
    await flushPromises()

    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '标签资料', content: '标签正文。', tags: ['RAG', 'Spring AI'] }),
    })
    expect(wrapper.findAll('.tag-pill').map((pill) => pill.text())).toEqual(['RAG', 'Spring AI'])
  })

  it('combines keyword and tag filters with title sorting', async () => {
    const documents = [{
      id: 10,
      title: 'RAG 检索',
      content: '组合筛选。',
      tags: ['RAG', 'Spring AI'],
      createdAt: '2026-09-30T06:10:00Z',
    }]
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => documents })
      .mockResolvedValueOnce({ ok: true, json: async () => documents })

    vi.stubGlobal('fetch', fetchMock)

    const wrapper = mount(App)
    await flushPromises()
    await wrapper.get('input[placeholder="输入标题或正文关键词"]').setValue('检索')
    await wrapper.get('select[aria-label="按标签筛选"]').setValue('RAG')
    await wrapper.get('select[aria-label="排序方式"]').setValue('title')
    await wrapper.get('form.search').trigger('submit')
    await flushPromises()

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/documents?q=%E6%A3%80%E7%B4%A2&tag=RAG&sort=title',
    )
    expect(wrapper.get('.result-summary').text()).toBe('找到 1 条结果')
  })

  it('filters documents when a displayed tag is clicked', async () => {
    const document = {
      id: 11,
      title: '可点击标签',
      content: '点击标签直接筛选。',
      tags: ['RAG'],
      createdAt: '2026-09-30T06:20:00Z',
    }
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [document] })
      .mockResolvedValueOnce({ ok: true, json: async () => [document] })

    vi.stubGlobal('fetch', fetchMock)

    const wrapper = mount(App)
    await flushPromises()
    await wrapper.get('.tag-pill').trigger('click')
    await flushPromises()

    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/documents?tag=RAG')
    expect(wrapper.get('.result-summary').text()).toBe('找到 1 条结果')
  })

  it('refreshes an active tag filter after editing a document', async () => {
    const originalDocument = {
      id: 12,
      title: '标签变化',
      content: '编辑后不再匹配筛选。',
      tags: ['RAG'],
      createdAt: '2026-09-30T06:30:00Z',
    }
    const updatedDocument = { ...originalDocument, tags: ['Spring AI'] }
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [originalDocument] })
      .mockResolvedValueOnce({ ok: true, json: async () => [originalDocument] })
      .mockResolvedValueOnce({ ok: true, json: async () => updatedDocument })
      .mockResolvedValueOnce({ ok: true, json: async () => [] })

    vi.stubGlobal('fetch', fetchMock)

    const wrapper = mount(App)
    await flushPromises()
    await wrapper.get('.tag-pill').trigger('click')
    await flushPromises()
    await wrapper.get('button[aria-label="编辑标签变化"]').trigger('click')
    await wrapper.get('.document-edit input[placeholder="例如：RAG, Spring AI"]').setValue('Spring AI')
    await wrapper.get('form.document-edit').trigger('submit')
    await flushPromises()

    expect(fetchMock).toHaveBeenNthCalledWith(4, '/api/documents?tag=RAG')
    expect(wrapper.findAll('.document')).toHaveLength(0)
    expect(wrapper.text()).toContain('文档已更新。')
  })

  it('previews an uploaded file and saves the edited text with its source', async () => {
    const savedDocument = {
      id: 21,
      title: '修订标题',
      content: '# 修订正文\n<script>alert(1)</script>',
      tags: ['RAG'],
      sourceFilename: '原始笔记.md',
      createdAt: '2026-10-09T10:00:00Z',
    }
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          title: '原始笔记',
          content: '# 原始正文\n<script>alert(1)</script>',
          sourceFilename: '原始笔记.md',
        }),
      })
      .mockResolvedValueOnce({ ok: true, json: async () => savedDocument })
      .mockResolvedValueOnce({ ok: true, json: async () => [savedDocument] })
    vi.stubGlobal('fetch', fetchMock)

    const wrapper = mount(App)
    await flushPromises()
    const fileInput = wrapper.get('input[type="file"]')
    Object.defineProperty(fileInput.element, 'files', {
      configurable: true,
      value: [new File(['# 原始正文'], '原始笔记.md', { type: 'text/markdown' })],
    })
    await fileInput.trigger('change')
    await flushPromises()

    const previewCall = fetchMock.mock.calls[1]
    expect(previewCall[0]).toBe('/api/documents/preview')
    expect(previewCall[1].body).toBeInstanceOf(FormData)
    expect(previewCall[1].body.get('file')).toBeInstanceOf(File)
    expect((wrapper.get('.composer textarea').element as HTMLTextAreaElement).value)
      .toContain('<script>alert(1)</script>')
    expect(wrapper.find('script').exists()).toBe(false)
    expect(wrapper.text()).toContain('原始笔记.md')

    await wrapper.get('input[placeholder="例如：向量检索基础"]').setValue('修订标题')
    await wrapper.get('.composer textarea').setValue(savedDocument.content)
    await wrapper.get('input[placeholder="例如：RAG, Spring AI"]').setValue('RAG')
    await wrapper.get('.composer > button').trigger('click')
    await flushPromises()

    expect(fetchMock).toHaveBeenNthCalledWith(3, '/api/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: '修订标题',
        content: savedDocument.content,
        tags: ['RAG'],
        sourceFilename: '原始笔记.md',
      }),
    })
    expect(wrapper.get('.source-file').text()).toContain('原始笔记.md')
    expect(wrapper.get('.document p').text()).toContain('<script>alert(1)</script>')
    expect(wrapper.find('script').exists()).toBe(false)
    expect((wrapper.get('.composer textarea').element as HTMLTextAreaElement).value).toBe('')
  })

  it('warns about matching existing content but still allows saving', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          title: '新资料', content: '相同正文', sourceFilename: 'new.txt',
          duplicateDocument: { id: 7, title: '已有资料' },
        }),
      })
      .mockResolvedValueOnce({ ok: true, json: async () => ({
        id: 8, title: '新资料', content: '相同正文', tags: [],
        sourceFilename: 'new.txt', createdAt: '2026-10-12T00:00:00Z',
      }) })
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
    vi.stubGlobal('fetch', fetchMock)

    const wrapper = mount(App)
    await flushPromises()
    const input = wrapper.get('input[type="file"]')
    Object.defineProperty(input.element, 'files', {
      configurable: true,
      value: [new File(['相同正文'], 'new.txt', { type: 'text/plain' })],
    })
    await input.trigger('change')
    await flushPromises()

    expect(wrapper.text()).toContain('已有资料')
    expect(wrapper.text()).toContain('重复')
    expect(wrapper.get('.composer > button').attributes('disabled')).toBeUndefined()
    await wrapper.get('.composer > button').trigger('click')
    await flushPromises()
    expect(fetchMock).toHaveBeenNthCalledWith(3, '/api/documents', expect.objectContaining({
      method: 'POST',
    }))
  })

  it('keeps the existing draft when file preview fails', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: '文件必须使用 UTF-8 编码。' }),
      })
    vi.stubGlobal('fetch', fetchMock)

    const wrapper = mount(App)
    await flushPromises()
    await wrapper.get('input[placeholder="例如：向量检索基础"]').setValue('草稿标题')
    await wrapper.get('.composer textarea').setValue('草稿正文')
    const fileInput = wrapper.get('input[type="file"]')
    Object.defineProperty(fileInput.element, 'files', {
      configurable: true,
      value: [new File(['bad'], 'bad.txt')],
    })
    await fileInput.trigger('change')
    await flushPromises()

    expect((wrapper.get('input[placeholder="例如：向量检索基础"]').element as HTMLInputElement).value)
      .toBe('草稿标题')
    expect((wrapper.get('.composer textarea').element as HTMLTextAreaElement).value).toBe('草稿正文')
    expect(wrapper.text()).toContain('文件必须使用 UTF-8 编码。')
  })

  it('clears the picker after parsing so the same file can be selected again', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValue({
        ok: true,
        json: async () => ({ title: '笔记', content: '正文', sourceFilename: 'same.txt' }),
      })
    vi.stubGlobal('fetch', fetchMock)

    const wrapper = mount(App)
    await flushPromises()
    const fileInput = wrapper.get('input[type="file"]')
    Object.defineProperty(fileInput.element, 'files', {
      configurable: true,
      value: [new File(['正文'], 'same.txt')],
    })
    Object.defineProperty(fileInput.element, 'value', {
      configurable: true,
      writable: true,
      value: 'C:\\fakepath\\same.txt',
    })
    await fileInput.trigger('change')
    await flushPromises()

    expect((fileInput.element as HTMLInputElement).value).toBe('')
  })

  it('does not let an older file preview overwrite a newer selection', async () => {
    let resolveFirst: (value: unknown) => void = () => {}
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockImplementationOnce(() => new Promise((resolve) => { resolveFirst = resolve }))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ title: '第二份', content: '第二份正文', sourceFilename: 'second.txt' }),
      })
    vi.stubGlobal('fetch', fetchMock)

    const wrapper = mount(App)
    await flushPromises()
    const fileInput = wrapper.get('input[type="file"]')
    Object.defineProperty(fileInput.element, 'files', {
      configurable: true,
      value: [new File(['first'], 'first.txt')],
    })
    await fileInput.trigger('change')
    Object.defineProperty(fileInput.element, 'files', {
      configurable: true,
      value: [new File(['second'], 'second.txt')],
    })
    await fileInput.trigger('change')
    await flushPromises()
    expect((wrapper.get('.composer textarea').element as HTMLTextAreaElement).value).toBe('第二份正文')

    resolveFirst({
      ok: true,
      json: async () => ({ title: '第一份', content: '第一份正文', sourceFilename: 'first.txt' }),
    })
    await flushPromises()
    expect((wrapper.get('.composer textarea').element as HTMLTextAreaElement).value).toBe('第二份正文')
  })

  it('offers PDF selection and previews its extracted text', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          title: '资料',
          content: 'PDF 中提取的正文',
          sourceFilename: '资料.pdf',
        }),
      })
    vi.stubGlobal('fetch', fetchMock)

    const wrapper = mount(App)
    await flushPromises()
    const input = wrapper.get('input[type="file"]')
    expect(input.attributes('accept')).toContain('.pdf')
    Object.defineProperty(input.element, 'files', {
      configurable: true,
      value: [new File(['pdf'], '资料.pdf', { type: 'application/pdf' })],
    })
    await input.trigger('change')
    await flushPromises()

    expect((wrapper.get('.composer textarea').element as HTMLTextAreaElement).value)
      .toBe('PDF 中提取的正文')
    expect(wrapper.text()).toContain('资料.pdf')
  })

  it('shows overlapping chunks from an import and updates them when content or settings change', async () => {
    const body = 'A'.repeat(300) + 'B'.repeat(300)
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => ({
        title: '长文', content: body, sourceFilename: 'long.txt', duplicateDocument: null,
      }) })
    vi.stubGlobal('fetch', fetchMock)

    const wrapper = mount(App)
    await flushPromises()
    expect(wrapper.findAll('.chunk-preview')).toHaveLength(0)
    const input = wrapper.get('input[type="file"]')
    Object.defineProperty(input.element, 'files', {
      configurable: true,
      value: [new File([body], 'long.txt', { type: 'text/plain' })],
    })
    await input.trigger('change')
    await flushPromises()

    expect(wrapper.findAll('.chunk-preview')).toHaveLength(2)
    expect(wrapper.findAll('.chunk-content')[0].text()).toBe('A'.repeat(300) + 'B'.repeat(200))
    expect(wrapper.findAll('.chunk-content')[1].text()).toBe('B'.repeat(150))

    await wrapper.get('select[aria-label="分块大小"]').setValue('300')
    await wrapper.get('select[aria-label="重叠字符数"]').setValue('100')
    expect(wrapper.findAll('.chunk-preview')).toHaveLength(3)
    expect(wrapper.findAll('.chunk-content')[1].text()).toBe('A'.repeat(100) + 'B'.repeat(200))

    await wrapper.get('.composer textarea').setValue('已修改正文')
    expect(wrapper.findAll('.chunk-preview')).toHaveLength(1)
    expect(wrapper.find('.chunk-content').text()).toBe('已修改正文')
  })

  it('does not split emoji in the middle of a chunk', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [] }))
    const wrapper = mount(App)
    await flushPromises()
    await wrapper.get('.composer textarea').setValue('🙂'.repeat(301))

    expect(wrapper.findAll('.chunk-preview')).toHaveLength(1)
    expect(wrapper.find('.chunk-content').text()).toBe('🙂'.repeat(301))
    await wrapper.get('select[aria-label="分块大小"]').setValue('300')
    expect(wrapper.findAll('.chunk-preview')).toHaveLength(2)
    expect(wrapper.findAll('.chunk-content')[0].text()).toBe('🙂'.repeat(300))
    expect(wrapper.findAll('.chunk-content')[1].text()).toBe('🙂'.repeat(51))
  })

  it('downloads current chunk data as JSON without sending another request', async () => {
    const body = 'A'.repeat(300) + 'B'.repeat(300)
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => ({
        title: '资料', content: body, sourceFilename: 'notes.txt', duplicateDocument: null,
      }) })
    vi.stubGlobal('fetch', fetchMock)
    const blobs: Blob[] = []
    const createObjectURL = vi.fn((blob: Blob) => {
      blobs.push(blob)
      return 'blob:chunks-test'
    })
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL })
    const downloads: string[] = []
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      downloads.push(this.download)
    })

    const wrapper = mount(App)
    await flushPromises()
    expect(wrapper.find('button[aria-label="下载分块 JSON"]').exists()).toBe(false)
    const input = wrapper.get('input[type="file"]')
    Object.defineProperty(input.element, 'files', {
      configurable: true,
      value: [new File([body], 'notes.txt', { type: 'text/plain' })],
    })
    await input.trigger('change')
    await flushPromises()
    await wrapper.get('select[aria-label="分块大小"]').setValue('300')
    await wrapper.get('select[aria-label="重叠字符数"]').setValue('100')
    await wrapper.get('button[aria-label="下载分块 JSON"]').trigger('click')

    expect(downloads).toEqual(['chunks.json'])
    expect(JSON.parse(await blobs[0].text())).toEqual({
      title: '资料',
      sourceFilename: 'notes.txt',
      chunkSize: 300,
      overlap: 100,
      chunks: [
        { index: 1, content: 'A'.repeat(300) },
        { index: 2, content: 'A'.repeat(100) + 'B'.repeat(200) },
        { index: 3, content: 'B'.repeat(200) },
      ],
    })
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:chunks-test')
    click.mockRestore()
  })

  it('highlights only the submitted keyword and clears highlights with the search', async () => {
    const document = {
      id: 31, title: 'RAG 入门', content: '学习 rag 与 RaG。', tags: [],
      createdAt: '2026-10-19T00:00:00Z', sourceFilename: null,
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [document] }))

    const wrapper = mount(App)
    await flushPromises()
    const searchInput = wrapper.get('input[placeholder="输入标题或正文关键词"]')
    await searchInput.setValue('rag')
    expect(wrapper.findAll('.document mark')).toHaveLength(0)

    await wrapper.get('form.search').trigger('submit')
    await flushPromises()
    expect(wrapper.get('.document h3').text()).toBe('RAG 入门')
    expect(wrapper.get('.document p').text()).toBe('学习 rag 与 RaG。')
    expect(wrapper.findAll('.document mark').map((item) => item.text())).toEqual(['RAG', 'rag', 'RaG'])

    await searchInput.setValue('其他词')
    expect(wrapper.findAll('.document mark').map((item) => item.text())).toEqual(['RAG', 'rag', 'RaG'])
    await wrapper.get('.clear-search').trigger('click')
    await flushPromises()
    expect(wrapper.findAll('.document mark')).toHaveLength(0)
  })

  it('treats special search characters literally and never renders document HTML', async () => {
    const document = {
      id: 32, title: '<script>alert(1)</script> C++',
      content: 'C++ <img src=x onerror=alert(1)>', tags: [],
      createdAt: '2026-10-19T00:00:00Z', sourceFilename: null,
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [document] }))

    const wrapper = mount(App)
    await flushPromises()
    await wrapper.get('input[placeholder="输入标题或正文关键词"]').setValue('C++')
    await wrapper.get('form.search').trigger('submit')
    await flushPromises()

    expect(wrapper.findAll('.document mark').map((item) => item.text())).toEqual(['C++', 'C++'])
    expect(wrapper.get('.document h3').text()).toContain('<script>alert(1)</script>')
    expect(wrapper.get('.document p').text()).toContain('<img src=x onerror=alert(1)>')
    expect(wrapper.find('.document script').exists()).toBe(false)
    expect(wrapper.find('.document img').exists()).toBe(false)
  })

  it('appends a later page and hides Load More after the last page', async () => {
    const firstPage = Array.from({ length: 20 }, (_, index) => ({
      id: index + 1, title: `Note ${index + 1}`, content: 'body', tags: [],
      createdAt: '2026-10-21T00:00:00Z', sourceFilename: null,
    }))
    const lastDocument = { ...firstPage[0], id: 21, title: 'Note 21' }
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, headers: { get: () => 'true' }, json: async () => firstPage })
      .mockResolvedValueOnce({ ok: true, headers: { get: () => 'false' }, json: async () => [lastDocument] })
    vi.stubGlobal('fetch', fetchMock)

    const wrapper = mount(App)
    await flushPromises()
    expect(wrapper.findAll('.document')).toHaveLength(20)
    expect(wrapper.get('.load-more').text()).toContain('加载更多')
    await wrapper.get('.load-more').trigger('click')
    await flushPromises()

    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/documents?page=1')
    expect(wrapper.findAll('.document')).toHaveLength(21)
    expect(wrapper.find('.load-more').exists()).toBe(false)
  })

  it('does not show Load More for an exactly full last page', async () => {
    const documents = Array.from({ length: 20 }, (_, index) => ({
      id: index + 1, title: `Note ${index + 1}`, content: 'body', tags: [],
      createdAt: '2026-10-21T00:00:00Z', sourceFilename: null,
    }))
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true, headers: { get: () => 'false' }, json: async () => documents,
    }))

    const wrapper = mount(App)
    await flushPromises()
    expect(wrapper.findAll('.document')).toHaveLength(20)
    expect(wrapper.find('.load-more').exists()).toBe(false)
  })

  it('uses committed filters for later pages and resets on a new search', async () => {
    const firstPage = Array.from({ length: 20 }, (_, index) => ({
      id: index + 1, title: `RAG ${index + 1}`, content: 'body', tags: ['RAG'],
      createdAt: '2026-10-21T00:00:00Z', sourceFilename: null,
    }))
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, headers: { get: () => 'false' }, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, headers: { get: () => 'true' }, json: async () => firstPage })
      .mockResolvedValueOnce({ ok: true, headers: { get: () => 'false' }, json: async () => [{ ...firstPage[0], id: 21 }] })
      .mockResolvedValueOnce({ ok: true, headers: { get: () => 'false' }, json: async () => [] })
    vi.stubGlobal('fetch', fetchMock)

    const wrapper = mount(App)
    await flushPromises()
    await wrapper.get('input[placeholder="输入标题或正文关键词"]').setValue('rag')
    await wrapper.get('form.search').trigger('submit')
    await flushPromises()
    await wrapper.get('input[placeholder="输入标题或正文关键词"]').setValue('changed')
    await wrapper.get('.load-more').trigger('click')
    await flushPromises()
    expect(fetchMock).toHaveBeenNthCalledWith(3, '/api/documents?q=rag&page=1')
    expect(wrapper.findAll('.document')).toHaveLength(21)

    await wrapper.get('form.search').trigger('submit')
    await flushPromises()
    expect(fetchMock).toHaveBeenNthCalledWith(4, '/api/documents?q=changed')
    expect(wrapper.findAll('.document')).toHaveLength(0)
  })

  it('keeps current results and permits retry when loading more fails', async () => {
    const firstPage = Array.from({ length: 20 }, (_, index) => ({
      id: index + 1, title: `Note ${index + 1}`, content: 'body', tags: [],
      createdAt: '2026-10-21T00:00:00Z', sourceFilename: null,
    }))
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, headers: { get: () => 'true' }, json: async () => firstPage })
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce({ ok: true, headers: { get: () => 'false' }, json: async () => [{ ...firstPage[0], id: 21 }] })
    vi.stubGlobal('fetch', fetchMock)

    const wrapper = mount(App)
    await flushPromises()
    await wrapper.get('.load-more').trigger('click')
    await flushPromises()
    expect(wrapper.findAll('.document')).toHaveLength(20)
    expect(wrapper.find('.load-more').exists()).toBe(true)
    await wrapper.get('.load-more').trigger('click')
    await flushPromises()
    expect(fetchMock).toHaveBeenNthCalledWith(3, '/api/documents?page=1')
    expect(wrapper.findAll('.document')).toHaveLength(21)
  })

  it('ignores a stale later page after a tag search starts', async () => {
    const firstPage = Array.from({ length: 20 }, (_, index) => ({
      id: index + 1, title: `Note ${index + 1}`, content: 'body', tags: ['RAG'],
      createdAt: '2026-10-21T00:00:00Z', sourceFilename: null,
    }))
    let resolveLaterPage!: (value: object) => void
    const laterPage = new Promise<object>((resolve) => { resolveLaterPage = resolve })
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, headers: { get: () => 'true' }, json: async () => firstPage })
      .mockReturnValueOnce(laterPage)
      .mockResolvedValueOnce({ ok: true, headers: { get: () => 'false' }, json: async () => [firstPage[0]] })
    vi.stubGlobal('fetch', fetchMock)

    const wrapper = mount(App)
    await flushPromises()
    await wrapper.get('.load-more').trigger('click')
    await wrapper.get('.tag-pill').trigger('click')
    await flushPromises()
    resolveLaterPage({ ok: true, headers: { get: () => 'false' }, json: async () => [{ ...firstPage[0], id: 21 }] })
    await flushPromises()

    expect(fetchMock).toHaveBeenNthCalledWith(3, '/api/documents?tag=RAG')
    expect(wrapper.findAll('.document')).toHaveLength(1)
  })
})
