const WORDS_PER_MINUTE = 220;

export const firestoreValueToDate = (value) => {
    if (!value) return null;
    if (value?.toDate) return value.toDate();
    if (typeof value === 'number') return new Date(value);
    if (typeof value === 'string') {
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    return null;
};

export const formatArticleDate = (value) => {
    const date = firestoreValueToDate(value);
    return date ? date.toLocaleDateString('vi-VN') : '';
};

export const isPostPubliclyVisible = (post, now = new Date()) => {
    if (!post?.isPublished) return false;
    const publishDate = firestoreValueToDate(post.publishAt);
    return !publishDate || publishDate <= now;
};

const collectText = (value) => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) return value.map(collectText).join(' ');
    if (typeof value === 'object') return Object.values(value).map(collectText).join(' ');
    return '';
};

export const getPlainText = (content = '', isBlockMode = false) => {
    let source = content;
    if (isBlockMode && typeof content === 'string') {
        try {
            source = collectText(JSON.parse(content)?.blocks || []);
        } catch {
            source = content;
        }
    }

    return String(source || '')
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;|&#160;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/\s+/g, ' ')
        .trim();
};

export const getReadingTime = (content = '', isBlockMode = false) => {
    const wordCount = getPlainText(content, isBlockMode).split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE));
};

export const createHeadingId = (text = '', usedIds = new Set()) => {
    const base = getPlainText(text)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[đĐ]/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-') || 'muc';

    let candidate = base;
    let suffix = 2;
    while (usedIds.has(candidate)) {
        candidate = `${base}-${suffix}`;
        suffix += 1;
    }
    usedIds.add(candidate);
    return candidate;
};

export const prepareArticleContent = (post) => {
    if (!post?.content) return { blockData: null, html: '', toc: [] };

    const usedIds = new Set();
    const toc = [];

    if (post.isBlockMode) {
        try {
            const blockData = JSON.parse(post.content);
            const blocks = (blockData.blocks || []).map((block) => {
                if (block.type !== 'header' || ![2, 3].includes(Number(block.data?.level))) return block;
                const id = createHeadingId(block.data.text, usedIds);
                toc.push({ id, level: Number(block.data.level), text: getPlainText(block.data.text) });
                return { ...block, data: { ...block.data, anchorId: id } };
            });
            return { blockData: { ...blockData, blocks }, html: '', toc };
        } catch {
            return { blockData: null, html: post.content, toc: [] };
        }
    }

    if (typeof DOMParser === 'undefined') return { blockData: null, html: post.content, toc: [] };

    const documentNode = new DOMParser().parseFromString(`<div id="article-content-root">${post.content}</div>`, 'text/html');
    const root = documentNode.getElementById('article-content-root');
    root?.querySelectorAll('h2, h3').forEach((heading) => {
        const id = createHeadingId(heading.textContent, usedIds);
        heading.id = id;
        heading.classList.add('scroll-mt-28');
        toc.push({ id, level: Number(heading.tagName.substring(1)), text: heading.textContent.trim() });
    });

    return { blockData: null, html: root?.innerHTML || post.content, toc };
};
