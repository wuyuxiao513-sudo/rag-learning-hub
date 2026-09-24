export async function searchDocuments(query) {
    const params = new URLSearchParams();
    if (query.trim())
        params.set('q', query.trim());
    const response = await fetch(`/api/documents?${params}`);
    if (!response.ok)
        throw new Error('检索失败，请确认后端已经启动。');
    return response.json();
}
export async function createDocument(title, content) {
    const response = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
    });
    if (!response.ok)
        throw new Error('保存失败，请检查标题和正文。');
    return response.json();
}
