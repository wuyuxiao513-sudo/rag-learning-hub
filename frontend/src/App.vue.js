import { onMounted, ref } from 'vue';
import { createDocument, searchDocuments } from './api';
const query = ref('');
const title = ref('');
const content = ref('');
const documents = ref([]);
const message = ref('');
const loading = ref(false);
async function search() {
    loading.value = true;
    message.value = '';
    try {
        documents.value = await searchDocuments(query.value);
    }
    catch (error) {
        message.value = error instanceof Error ? error.message : '发生未知错误';
    }
    finally {
        loading.value = false;
    }
}
async function save() {
    if (!title.value.trim() || !content.value.trim()) {
        message.value = '标题和正文不能为空。';
        return;
    }
    loading.value = true;
    message.value = '';
    try {
        await createDocument(title.value, content.value);
        title.value = '';
        content.value = '';
        message.value = '文档已保存。';
        await search();
    }
    catch (error) {
        message.value = error instanceof Error ? error.message : '发生未知错误';
    }
    finally {
        loading.value = false;
    }
}
onMounted(search);
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.main, __VLS_intrinsics.main)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.header, __VLS_intrinsics.header)({
    ...{ class: "hero" },
});
/** @type {__VLS_StyleScopedClasses['hero']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "eyebrow" },
});
/** @type {__VLS_StyleScopedClasses['eyebrow']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
    ...{ class: "panel composer" },
});
/** @type {__VLS_StyleScopedClasses['panel']} */ ;
/** @type {__VLS_StyleScopedClasses['composer']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "section-title" },
});
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    maxlength: "200",
    placeholder: "例如：向量检索基础",
});
(__VLS_ctx.title);
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.textarea)({
    value: (__VLS_ctx.content),
    rows: "7",
    placeholder: "粘贴一段值得检索的技术笔记……",
});
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.save) },
    disabled: (__VLS_ctx.loading),
});
__VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
    ...{ class: "panel results" },
});
/** @type {__VLS_StyleScopedClasses['panel']} */ ;
/** @type {__VLS_StyleScopedClasses['results']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "section-title" },
});
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.form, __VLS_intrinsics.form)({
    ...{ onSubmit: (__VLS_ctx.search) },
    ...{ class: "search" },
});
/** @type {__VLS_StyleScopedClasses['search']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    placeholder: "输入标题或正文关键词",
});
(__VLS_ctx.query);
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    disabled: (__VLS_ctx.loading),
});
(__VLS_ctx.loading ? '检索中' : '搜索');
if (__VLS_ctx.message) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "message" },
    });
    /** @type {__VLS_StyleScopedClasses['message']} */ ;
    (__VLS_ctx.message);
}
if (!__VLS_ctx.loading && __VLS_ctx.documents.length === 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "empty" },
    });
    /** @type {__VLS_StyleScopedClasses['empty']} */ ;
}
for (const [document] of __VLS_vFor((__VLS_ctx.documents))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.article, __VLS_intrinsics.article)({
        key: (document.id),
        ...{ class: "document" },
    });
    /** @type {__VLS_StyleScopedClasses['document']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
    (document.id);
    (new Date(document.createdAt).toLocaleString());
    __VLS_asFunctionalElement1(__VLS_intrinsics.h3, __VLS_intrinsics.h3)({});
    (document.title);
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    (document.content);
    // @ts-ignore
    [title, content, save, loading, loading, loading, loading, search, query, message, message, documents, documents,];
}
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
