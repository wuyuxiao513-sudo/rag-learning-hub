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
})
