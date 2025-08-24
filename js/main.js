// js/main.js
import { createCommentElement, createArticleCardElement, SectionController, getRandomAnimeImage, getHitokotoQuote, blogArticles } from './components.js';

document.addEventListener('DOMContentLoaded', async () => { // 注意这里是 async 函数
    const body = document.body;
    const loadingScreen = document.getElementById('loading-screen');
    const themeToggleButton = document.getElementById('theme-toggle-btn');
    const commentForm = document.getElementById('comment-form');
    const commentsContainer = document.getElementById('comments-container');
    const currentTimeSpan = document.getElementById('current-time');
    const currentYearSpan = document.getElementById('current-year');
    const viewCountSpan = document.getElementById('view-count');
    const scrollToTopBtn = document.getElementById('scroll-to-top');
    const hitokotoQuoteElem = document.getElementById('hitokoto-quote'); // 随机一言DOM元素


    // 过渡场景动画：页面加载
    // ----------------------------------------------------
    setTimeout(() => {
        loadingScreen.classList.add('hidden');
        loadingScreen.addEventListener('transitionend', () => {
            loadingScreen.style.display = 'none';
            body.classList.add('loaded'); // 页面内容淡入
        }, { once: true });
    }, 800);

    // 主题颜色功能
    // ----------------------------------------------------
    const savedTheme = localStorage.getItem('theme') || 'light-theme';
    body.classList.remove('light-theme', 'dark-theme', 'pastel-theme');
    body.classList.add(savedTheme);
    // 更新主题切换按钮的图标
    if (savedTheme === 'dark-theme') {
        themeToggleButton.innerHTML = '<i class="fas fa-sun"></i>';
    } else if (savedTheme === 'pastel-theme') {
        themeToggleButton.innerHTML = '<i class="fas fa-paint-brush"></i>';
    } else { // light-theme
        themeToggleButton.innerHTML = '<i class="fas fa-moon"></i>';
    }


    themeToggleButton.addEventListener('click', () => {
        if (body.classList.contains('light-theme')) {
            body.classList.replace('light-theme', 'dark-theme');
            localStorage.setItem('theme', 'dark-theme');
            themeToggleButton.innerHTML = '<i class="fas fa-sun"></i>';
        } else if (body.classList.contains('dark-theme')) {
            body.classList.replace('dark-theme', 'pastel-theme');
            localStorage.setItem('theme', 'pastel-theme');
            themeToggleButton.innerHTML = '<i class="fas fa-paint-brush"></i>';
        } else { // 当前是 pastel-theme 或其他未知主题
            body.classList.replace('pastel-theme', 'light-theme');
            localStorage.setItem('theme', 'light-theme');
            themeToggleButton.innerHTML = '<i class="fas fa-moon"></i>';
        }
    });

    // 页面导航及过渡动画 (使用 SectionController 组件)
    // ----------------------------------------------------
    const sectionController = new SectionController(
        '.main-nav .nav-item',       // 导航项的选择器
        '.page-section',             // 页面 section 的选择器
        '.mobile-nav-toggle',        // 手机导航切换按钮的选择器
        '.main-nav'                  // 主导航容器的选择器
    );

    // 博客文章动态加载
    // ----------------------------------------------------
    const blogPostsContainer = document.getElementById('blog-posts-container');
    const latestPostsContainer = document.getElementById('latest-posts-container');

    // 为每篇文章获取封面图片 (并行处理，优化加载速度)
    const articlePromises = blogArticles.map(async (article) => {
        article.coverImage = await getRandomAnimeImage();
        return article;
    });
    const articlesWithCovers = await Promise.all(articlePromises); // 等待所有图片加载完毕

    // 加载所有文章到博客页面
    if (blogPostsContainer) {
        blogPostsContainer.innerHTML = ''; // 清空静态内容
        articlesWithCovers.forEach(post => {
            const articleElement = createArticleCardElement(post);
            blogPostsContainer.appendChild(articleElement);
        });
    }

    // 加载最新文章到首页 (这里简单取前2篇，如果需要更复杂的“最新”逻辑，请自行实现)
    if (latestPostsContainer) {
        latestPostsContainer.innerHTML = ''; // 清空静态内容
        articlesWithCovers.slice(0, 2).forEach(post => {
            const articleElement = createArticleCardElement(post);
            latestPostsContainer.appendChild(articleElement);
        });
    }

    // 随机一言功能
    // ----------------------------------------------------
    if (hitokotoQuoteElem) {
        const quote = await getHitokotoQuote();
        hitokotoQuoteElem.textContent = quote;
    }


    // 浏览次数 (前端模拟存储，不依赖后端)
    // ----------------------------------------------------
    let views = localStorage.getItem('blog_views');
    if (views) {
        views = parseInt(views) + 1;
    } else {
        views = 1;
    }
    localStorage.setItem('blog_views', views);
    viewCountSpan.textContent = views;

    // 留言板 (前端模拟存储到 localStorage)
    // ----------------------------------------------------

    // 加载现有留言
    function loadComments() {
        commentsContainer.innerHTML = ''; // 清空现有留言
        const savedComments = JSON.parse(localStorage.getItem('blog_comments') || '[]');
        // 按最新到最旧排序
        savedComments.sort((a, b) => new Date(b.date) - new Date(a.date));
        savedComments.forEach(commentData => {
            const commentElement = createCommentElement(commentData);
            commentsContainer.appendChild(commentElement);
        });
    }

    loadComments(); // 页面加载时加载留言

    commentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const nameInput = document.getElementById('comment-name');
        const contentInput = document.getElementById('comment-content');
        const name = nameInput.value.trim();
        const content = contentInput.value.trim();

        if (name && content) {
            const now = new Date();
            const dateStr = now.getFullYear() + '-' +
                            String(now.getMonth() + 1).padStart(2, '0') + '-' +
                            String(now.getDate()).padStart(2, '0') + ' ' +
                            String(now.getHours()).padStart(2, '0') + ':' +
                            String(now.getMinutes()).padStart(2, '0') + ':' +
                            String(now.getSeconds()).padStart(2, '0');

            const commentData = { name, content, date: dateStr };

            // 保存到 localStorage
            const savedComments = JSON.parse(localStorage.getItem('blog_comments') || '[]');
            savedComments.unshift(commentData); // 新留言放最前面
            localStorage.setItem('blog_comments', JSON.stringify(savedComments));

            // 更新 DOM
            const newCommentElement = createCommentElement(commentData);
            commentsContainer.prepend(newCommentElement); // 最新留言放最上面
            // 确保显示最新留言时滚动到顶部
            if (commentsContainer.firstElementChild) {
                commentsContainer.firstElementChild.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }

            // 清空表单
            commentForm.reset();
            alert('留言已提交！');
        } else {
            alert('请填写昵称和留言内容！');
        }
    });

    // 更新当前时间和年份
    // ----------------------------------------------------
    function updateDateTime() {
        const now = new Date();
        const options = {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hour12: false
        };
        currentTimeSpan.textContent = now.toLocaleString('zh-CN', options);
        currentYearSpan.textContent = now.getFullYear();
    }

    updateDateTime();
    setInterval(updateDateTime, 1000); // 每秒更新一次时间


    // 返回顶部按钮功能
    // ----------------------------------------------------
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) { // 滚动超过300px显示按钮
            scrollToTopBtn.classList.add('show');
        } else {
            scrollToTopBtn.classList.remove('show');
        }
    });

    scrollToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
});