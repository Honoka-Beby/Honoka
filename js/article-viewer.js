// js/article-viewer.js
import { blogArticles } from './components.js'; // 导入文章数据

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const articleId = urlParams.get('id');

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
    currentYearArticleSpan.textContent = new Date().getFullYear();


    if (articleId) {
        const article = blogArticles.find(a => a.id === articleId);

        if (article) {
            document.title = `${article.title} - Honoka的二次元博客 V1.3`; // 更新标题
            articleTitleElem.textContent = article.title;
            articleDateElem.textContent = article.date;
            articleCategoryElem.textContent = article.category;
            articleContentElem.innerHTML = article.content;
            articleCoverElem.src = article.coverImage;
            articleCoverElem.alt = `${article.title}封面`;
        } else {
            document.title = '文章未找到 - Honoka的二次元博客 V1.3'; // 更新标题
            articleTitleElem.textContent = '404 - 文章未找到';
            articleDateElem.textContent = '';
            articleCategoryElem.textContent = '';
            articleContentElem.innerHTML = '<p>很抱歉，您要查找的文章不存在。</p><p><a href="index.html#blog" class="anime-button">返回博客列表</a></p>';
            articleCoverElem.style.display = 'none'; // 隐藏封面
        }
    } else {
        document.title = '文章ID缺失 - Honoka的二次元博客 V1.3'; // 更新标题
        articleTitleElem.textContent = '文章ID缺失';
        articleDateElem.textContent = '';
        articleCategoryElem.textContent = '';
        articleContentElem.innerHTML = '<p>请通过正确的链接访问文章。</p><p><a href="index.html#blog" class="anime-button">返回博客列表</a></p>';
        articleCoverElem.style.display = 'none'; // 隐藏封面
    }
});