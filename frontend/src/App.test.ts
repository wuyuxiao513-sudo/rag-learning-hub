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
    await wrapper.get('.composer button').trigger('click')
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
    await wrapper.get('.composer button').trigger('click')
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
})
