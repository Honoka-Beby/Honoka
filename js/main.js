// js/main.js
import { createCommentElement, createArticleCardElement, SectionController, getRandomAnimeImage, getHitokotoQuote, getDailyFortune, blogArticles } from './components.js';

document.addEventListener('DOMContentLoaded', async () => {
    console.log('[Main] DOMContentLoaded event fired on index.html, starting main.js initialization.');

    const body = document.body;
    const loadingScreen = document.getElementById('loading-screen');
    const themeToggleButton = document.getElementById('theme-toggle-btn');
    const commentForm = document.getElementById('comment-form');
    const commentsContainer = document.getElementById('comments-container');
    const currentTimeSpan = document.getElementById('current-time');
    const currentYearSpan = document.getElementById('current-year');
    const viewCountSpan = document.getElementById('view-count');
    const scrollToTopBtn = document.getElementById('scroll-to-top');
    const hitokotoQuoteElem = document.getElementById('hitokoto-quote');
    const drawFortuneBtn = document.getElementById('draw-fortune-btn');
    const fortuneDisplay = document.getElementById('fortune-display');
    const fortuneResultArea = document.getElementById('fortune-result-area');
    const fortuneBurstAnimation = document.getElementById('fortune-burst-animation');


    // 过渡场景动画：页面加载
    // ----------------------------------------------------
    setTimeout(() => {
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
            loadingScreen.addEventListener('transitionend', () => {
                if (loadingScreen) loadingScreen.style.display = 'none';
                body.classList.add('loaded'); // 页面内容淡入
                console.log('[Main] Loading screen hidden, body loaded.');
            }, { once: true });
        } else {
            body.classList.add('loaded'); // 如果没有加载屏，直接显示
        }
    }, 800);

    // 主题颜色功能
    // ----------------------------------------------------
    const savedTheme = localStorage.getItem('theme') || 'light-theme';
    body.classList.remove('light-theme', 'dark-theme', 'pastel-theme');
    body.classList.add(savedTheme);
    if (themeToggleButton) {
        if (savedTheme === 'dark-theme') {
            themeToggleButton.innerHTML = '<i class="fas fa-sun"></i>';
        } else if (savedTheme === 'pastel-theme') {
            themeToggleButton.innerHTML = '<i class="fas fa-paint-brush"></i>';
        } else { // light-theme
            themeToggleButton.innerHTML = '<i class="fas fa-moon"></i>';
        }
    }


    if (themeToggleButton) {
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
    }

    // 页面导航及过渡动画 (使用 SectionController 组件)
    // ----------------------------------------------------
    const sectionController = new SectionController(
        '.main-nav .nav-item',       // 导航项的选择器
        '.page-section',             // 页面 section 的选择器
        '.mobile-nav-toggle',        // 手机导航切换按钮的选择器
        '.main-nav'                  // 主导航容器的选择器
    );
    console.log('[Main] SectionController initialized.');


    // 博客文章动态加载
    // ----------------------------------------------------
    const blogPostsContainer = document.getElementById('blog-posts-container');
    const latestPostsContainer = document.getElementById('latest-posts-container');

    console.log('[Main] Fetching anime images for articles...');
    const articlePromises = blogArticles.map(async (article) => {
        try {
            article.coverImage = await getRandomAnimeImage();
        } catch (e) {
            console.error('[Main] Error getting random image for article ', article.id, ', using fallback:', e);
            article.coverImage = `assets/images/fallback-cover-${Math.floor(Math.random()*3)+1}.png`; // 确保使用模板字符串
        }
        return article;
    });
    let articlesWithCovers = [];
    try {
        articlesWithCovers = await Promise.all(articlePromises);
        console.log('[Main] All article covers fetched.', articlesWithCovers);
    } catch (e) {
        console.error('[Main] Error in Promise.all for article covers:', e);
        // Fallback: Use articles with potentially empty or existing covers, ensure local fallback loop
        articlesWithCovers = blogArticles.map(article => {
            if (!article.coverImage) {
                 article.coverImage = `assets/images/fallback-cover-${Math.floor(Math.random()*3)+1}.png`;
            }
            return article;
        });
    }


    if (blogPostsContainer) {
        blogPostsContainer.innerHTML = '';
        articlesWithCovers.forEach(post => {
            const articleElement = createArticleCardElement(post);
            blogPostsContainer.appendChild(articleElement);
        });
        console.log('[Main] Blog posts container populated.', blogPostsContainer);
    } else {
        console.log('[Main] blogPostsContainer not found.');
    }

    if (latestPostsContainer) {
        latestPostsContainer.innerHTML = '';
        articlesWithCovers.slice(0, 2).forEach(post => {
            const articleElement = createArticleCardElement(post);
            latestPostsContainer.appendChild(articleElement);
        });
        console.log('[Main] Latest posts container populated.', latestPostsContainer);
    } else {
        console.log('[Main] latestPostsContainer not found.');
    }

    // 随机一言功能
    // ----------------------------------------------------
    if (hitokotoQuoteElem) {
        try {
            const quote = await getHitokotoQuote();
            hitokotoQuoteElem.textContent = quote;
            console.log('[Main] Hitokoto quote loaded.', quote);
        } catch (e) {
            console.error('[Main] Failed to load Hitokoto quote:', e);
            hitokotoQuoteElem.textContent = '加载一言失败，请刷新重试。';
        }
    } else {
        console.log('[Main] hitokotoQuoteElem not found.');
    }

    // 今日运势功能
    // ----------------------------------------------------
    const fortuneEmojis = ['🎉', '✨', '💖', '🍀', '🌈', '🌟', '💫', '🌸', '🎐'];
    const fortuneTexts = ['WOW!', '恭喜!', '超棒!', 'Good!', 'Yeah!', '欧气!'];

    function createBurstElement(content, color) {
        const span = document.createElement('span');
        span.textContent = content;
        span.style.color = color;
        // 随机偏移量
        span.style.setProperty('--dx', `${Math.random() * 100 - 50}px`);
        span.style.setProperty('--dy', `${Math.random() * 100 - 50}px`);
        return span;
    }

    if (drawFortuneBtn && fortuneDisplay && fortuneResultArea && fortuneBurstAnimation) {
        // 页面加载时也显示今天的运势（如果已抽取）
        const initialFortune = getDailyFortune();
        fortuneDisplay.textContent = `【${initialFortune.type}】${initialFortune.message}`;
        fortuneDisplay.classList.add('show'); // 默认显示
        console.log('[Main] Initial daily fortune displayed.', initialFortune);
        
        drawFortuneBtn.addEventListener('click', () => {
            if (drawFortuneBtn.disabled) return; // 防止连点

            drawFortuneBtn.disabled = true;
            fortuneDisplay.classList.remove('show'); // 隐藏当前运势
            fortuneBurstAnimation.innerHTML = ''; // 清除上次动画

            console.log('[Main] Drawing new fortune...');
            
            // 动画1: 运势结果淡出
            setTimeout(() => {
                const newFortune = getDailyFortune(); // 重新获取运势，可能是今天第一次获取或获取已保存的
                fortuneDisplay.textContent = `【${newFortune.type}】${newFortune.message}`;
                fortuneDisplay.style.color = newFortune.color; // 设置运势文本颜色

                // 动画2: 运势文本淡入
                setTimeout(() => {
                    fortuneDisplay.classList.add('show');
                    drawFortuneBtn.disabled = false; // 动画结束后启用按钮
                    console.log('[Main] New fortune displayed with fade-in.');

                    // 动画3: 爆发效果
                    fortuneBurstAnimation.classList.add('fade-out'); // 先确保没有旧的动画状态
                    fortuneBurstAnimation.innerHTML = ''; // 清空之前的内容

                    // 随机生成几个爆炸元素
                    const numBursts = Math.floor(Math.random() * 3) + 3; // 3到5个
                    for (let i = 0; i < numBursts; i++) {
                        const burstContent = i % 2 === 0 ? newFortune.emoji : fortuneTexts[Math.floor(Math.random() * fortuneTexts.length)];
                        const burstElem = createBurstElement(burstContent, newFortune.color);
                        fortuneBurstAnimation.appendChild(burstElem);
                    }
                    // 触发动画
                    fortuneBurstAnimation.classList.remove('fade-out'); // 移除旧的淡出，确保动画可以播放
                    fortuneBurstAnimation.classList.add('play');
                    
                    // 动画结束后移除 burst-animation 类，以便下次重新播放
                    setTimeout(() => {
                        fortuneBurstAnimation.classList.remove('play');
                        console.log('[Main] Fortune burst animation finished.');
                    }, 800); // 配合 CSS 动画时长

                }, 300); // 运势文本淡入延迟
            }, 0); // 运势文本立即隐藏
        });
    } else {
        console.log('[Main] Daily fortune elements not found.');
    }
    
    // 浏览次数 (前端模拟存储，不依赖后端)
    // ----------------------------------------------------
    let views = localStorage.getItem('blog_views');
    if (!views) {
        views = 1;
        console.log('[Main] Initializing visitor count to 1.');
    } else {
        views = parseInt(views) + 1;
        console.log('[Main] Incrementing visitor count. Current:', views);
    }
    localStorage.setItem('blog_views', views);
    if (viewCountSpan) {
        viewCountSpan.textContent = views;
    } else {
        console.log('[Main] viewCountSpan not found.');
    }
    

    // 留言板 (前端模拟存储到 localStorage)
    // ----------------------------------------------------

    // 加载现有留言
    function loadComments() {
        if (!commentsContainer) {
            console.log('[Main] Comments container not found, skipping loading comments.');
            return;
        }
        commentsContainer.innerHTML = ''; // 清空现有留言
        const savedComments = JSON.parse(localStorage.getItem('blog_comments') || '[]');
        savedComments.sort((a, b) => new Date(b.date) - new Date(a.date)); // 按最新到最旧排序
        savedComments.forEach(commentData => {
            const commentElement = createCommentElement(commentData);
            commentsContainer.appendChild(commentElement);
        });
        console.log('[Main] Comments loaded:', savedComments.length, 'comments.');
    }

    loadComments(); // 页面加载时加载留言

    if (commentForm) {
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

                const savedComments = JSON.parse(localStorage.getItem('blog_comments') || '[]');
                savedComments.unshift(commentData); // 新留言放最前面
                localStorage.setItem('blog_comments', JSON.stringify(savedComments));
                console.log('[Main] New comment saved to localStorage.', commentData);

                const newCommentElement = createCommentElement(commentData);
                commentsContainer.prepend(newCommentElement);
                
                if (commentsContainer.firstElementChild) {
                    commentsContainer.firstElementChild.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }

                commentForm.reset();
                alert('留言已提交！');
            } else {
                alert('请填写昵称和留言内容！');
            }
        });
    } else {
        console.log('[Main] commentForm not found.');
    }


    // 更新当前时间和年份
    // ----------------------------------------------------
    function updateDateTime() {
        const now = new Date();
        const options = {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hour12: false
        };
        if (currentTimeSpan) currentTimeSpan.textContent = now.toLocaleString('zh-CN', options);
        if (currentYearSpan) currentYearSpan.textContent = now.getFullYear();
    }

    updateDateTime();
    setInterval(updateDateTime, 1000);


    // 返回顶部按钮功能
    // ----------------------------------------------------
    if (scrollToTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
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
    } else {
        console.log('[Main] Scroll to top button not found.');
    }
});