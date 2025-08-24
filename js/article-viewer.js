// js/article-viewer.js
// **重要修复：修改导入路径**
import { blogArticles, getRandomAnimeImage } from './components.js'; // 导入文章数据和图片获取函数

document.addEventListener('DOMContentLoaded', async () => { // 设为 async 函数
    console.log('DOMContentLoaded event fired on article.html, starting article-viewer.js initialization.');

    const urlParams = new URLSearchParams(window.location.search);
    const articleId = urlParams.get('id');
    console.log('Article ID from URL:', articleId);

    const articleTitleElem = document.getElementById('article-title');
    const articleDateElem = document.getElementById('article-date');
    const articleCategoryElem = document.getElementById('article-category');
    const articleContentElem = document.getElementById('article-content');
    const articleCoverElem = document.getElementById('article-cover');
    const currentYearArticleSpan = document.getElementById('current-year-article');

    // 从 localStorage 加载主题并应用
    const savedTheme = localStorage.getItem('theme') || 'light-theme';
    document.body.classList.remove('light-theme', 'dark-theme', 'pastel-theme');
    document.body.classList.add(savedTheme);

    // 设置页脚的年份
    if (currentYearArticleSpan) {
        currentYearArticleSpan.textContent = new Date().getFullYear();
    }


    if (articleId) {
        const article = blogArticles.find(a => a.id === articleId);
        console.log('Found article:', article);

        if (article) {
            document.title = `${article.title} - Honoka的二次元博客 V1.5`; // 更新标题
            if (articleTitleElem) articleTitleElem.textContent = article.title;
            if (articleDateElem) articleDateElem.textContent = article.date;
            if (articleCategoryElem) articleCategoryElem.textContent = article.category;
            if (articleContentElem) articleContentElem.innerHTML = article.content;

            // **重要修复：确保封面图片加载**
            if (articleCoverElem) {
                if (article.coverImage) {
                    articleCoverElem.src = article.coverImage; // 如果主页已经加载并保存了，直接用
                } else {
                    // 否则，动态获取一张封面图（即使不是为这篇文章预加载的，也确保有图）
                    try {
                        articleCoverElem.src = await getRandomAnimeImage();
                    } catch (e) {
                        console.error('Failed to load dynamic article cover, using default fallback:', e);
                        articleCoverElem.src = `assets/images/fallback-cover-${Math.floor(Math.random()*3)+1}.png`; // 使用随机本地备用图
                    }
                }
                articleCoverElem.alt = `${article.title}封面`;
                console.log('Article cover set:', articleCoverElem.src);
            }

        } else {
            console.warn('Article not found for ID:', articleId);
            document.title = '文章未找到 - Honoka的二次元博客 V1.5'; // 更新标题
            if (articleTitleElem) articleTitleElem.textContent = '404 - 文章未找到';
            if (articleDateElem) articleDateElem.textContent = '';
            if (articleCategoryElem) articleCategoryElem.textContent = '';
            if (articleContentElem) articleContentElem.innerHTML = '<p>很抱歉，您要查找的文章不存在。</p><p><a href="index.html#blog" class="anime-button">返回博客列表</a></p>';
            if (articleCoverElem) articleCoverElem.style.display = 'none'; // 隐藏封面
        }
    } else {
        console.warn('Article ID is missing in URL.');
        document.title = '文章ID缺失 - Honoka的二次元博客 V1.5'; // 更新标题
        if (articleTitleElem) articleTitleElem.textContent = '文章ID缺失';
        if (articleDateElem) articleDateElem.textContent = '';
        if (articleCategoryElem) articleCategoryElem.textContent = '';
        if (articleContentElem) articleContentElem.innerHTML = '<p>请通过正确的链接访问文章。</p><p><a href="index.html#blog" class="anime-button">返回博客列表</a></p>';
        if (articleCoverElem) articleCoverElem.style.display = 'none'; // 隐藏封面
    }
});