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
    const blogPostsContainer = document.getElementById('blog-posts-container');
    const latestPostsContainer = document.getElementById('latest-posts-container');
    const filterButtons = document.querySelectorAll('.blog-filter-controls .filter-btn'); // 新增筛选按钮选择器


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
    console.log('[Main] Fetching anime images for articles...');
    // 为每篇文章获取封面图片 (并行处理，优化加载速度)
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

    // 渲染文章列表的函数，支持筛选
    function renderArticles(container, articlesToRender) {
        if (!container) return;
        container.innerHTML = ''; // 清空现有内容
        articlesToRender.forEach(post => {
            const articleElement = createArticleCardElement(post);
            container.appendChild(articleElement);
        });
        console.log(`[Main] Rendered ${articlesToRender.length} articles to ${container.id}.`);
    }

    // 初始加载所有文章
    renderArticles(blogPostsContainer, articlesWithCovers);
    renderArticles(latestPostsContainer, articlesWithCovers.slice(0, 2));


    // **新增：博客分类筛选功能逻辑**
    filterButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            filterButtons.forEach(btn => btn.classList.remove('active')); // 移除所有active
            e.currentTarget.classList.add('active'); // 添加当前active

            const category = e.currentTarget.getAttribute('data-category');
            let filteredArticles;
            if (category === 'all') {
                filteredArticles = articlesWithCovers;
            } else {
                filteredArticles = articlesWithCovers.filter(article => article.category === category);
            }
            renderArticles(blogPostsContainer, filteredArticles);
        });
    });
    console.log('[Main] Blog category filter listeners bound.');


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
    const FortuneBurstCharacters = {
        positive: ['🎉', '✨', '💖', '🌟', '🍀', '🌈', '🌸', '🎐'],
        neutral: ['😊', '⭐'],
        negative: ['💧', '⚠️', '🌧️', '💔']
    };
    const FortuneTextBurst = {
        positive: ['WOW!', '恭喜!', '超棒!', '好运!', 'Yeah!'],
        neutral: ['平稳!', '努力!', '加油!'],
        negative: ['注意!', '小心!', '坚持!', '挺住!']
    };

    function createBurstElement(content, color, type = 'emoji') {
        const span = document.createElement('span');
        span.textContent = content;
        span.style.color = color;
        // 随机偏移量
        const dx = Math.random() * 100 - 50; // -50px to 50px
        const dy = Math.random() * 100 - 50; // -50px to 50px
        span.style.setProperty('--dx', `${dx}px`);
        span.style.setProperty('--dy', `${dy}px`);
        span.style.fontSize = type === 'text' ? '1.2em' : '2em'; // 文本小一点，emoji大一点
        return span;
    }

    if (drawFortuneBtn && fortuneDisplay && fortuneResultArea && fortuneBurstAnimation) {
        const initialFortune = getDailyFortune();
        fortuneDisplay.textContent = `【${initialFortune.type}】${initialFortune.message}`;
        fortuneDisplay.style.color = initialFortune.color || '#fff'; // 确保颜色
        fortuneDisplay.classList.add('show');
        console.log('[Main] Initial daily fortune displayed.', initialFortune);
        
        drawFortuneBtn.addEventListener('click', () => {
            if (drawFortuneBtn.disabled) return;

            drawFortuneBtn.disabled = true;
            fortuneDisplay.classList.remove('show'); // 隐藏当前运势
            
            // 为动画做准备
            fortuneBurstAnimation.innerHTML = ''; // 先清空
            fortuneBurstAnimation.classList.remove('show');
            
            console.log('[Main] Drawing new fortune...');
            
            setTimeout(() => {
                const newFortune = getDailyFortune();
                fortuneDisplay.textContent = `【${newFortune.type}】${newFortune.message}`;
                fortuneDisplay.style.color = newFortune.color || '#fff'; // 设置运势文本颜色

                setTimeout(() => {
                    fortuneDisplay.classList.add('show');
                    drawFortuneBtn.disabled = false;
                    console.log('[Main] New fortune displayed with fade-in.');

                    // 动画: 爆发效果
                    fortuneBurstAnimation.classList.add('show'); // 显示容器
                    
                    let burstChars = [];
                    let burstWords = [];
                    if (['大吉', '超大吉', '恋爱吉', '学业吉'].includes(newFortune.type)) {
                        burstChars = FortuneBurstCharacters.positive;
                        burstWords = FortuneTextBurst.positive;
                    } else if (['中吉', '小吉'].includes(newFortune.type)) {
                        burstChars = FortuneBurstCharacters.neutral;
                        burstWords = FortuneTextBurst.neutral;
                    } else { // 末吉, 凶, 大凶
                        burstChars = FortuneBurstCharacters.negative;
                        burstWords = FortuneTextBurst.negative;
                    }

                    const numEmojis = Math.floor(Math.random() * 3) + 3; // 3到5个emoji
                    for (let i = 0; i < numEmojis; i++) {
                        const char = burstChars[Math.floor(Math.random() * burstChars.length)];
                        const burstElem = createBurstElement(char, newFortune.color || '#fff', 'emoji');
                        burstElem.style.animation = `burst-fade-out 0.8s ease-out forwards ${i * 0.05}s`;
                        fortuneBurstAnimation.appendChild(burstElem);
                    }
                    const numWords = Math.floor(Math.random() * 2) + 1; // 1到2个文字
                     for (let i = 0; i < numWords; i++) {
                        const word = burstWords[Math.floor(Math.random() * burstWords.length)];
                        const burstElem = createBurstElement(word, newFortune.color || '#fff', 'text');
                        burstElem.style.animation = `burst-fade-out 0.8s ease-out forwards ${i * 0.08}s`;
                        fortuneBurstAnimation.appendChild(burstElem);
                    }
                    
                    setTimeout(() => {
                        fortuneBurstAnimation.innerHTML = ''; // 动画结束后清空
                        fortuneBurstAnimation.classList.remove('show');
                        console.log('[Main] Fortune burst animation finished and cleared.');
                    }, 800 + (numEmojis + numWords)*80); // 确保所有动画都播放完

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
        commentsContainer.innerHTML = '';
        const savedComments = JSON.parse(localStorage.getItem('blog_comments') || '[]');
        savedComments.sort((a, b) => new Date(b.date) - new Date(a.date));
        savedComments.forEach(commentData => {
            const commentElement = createCommentElement(commentData);
            commentsContainer.appendChild(commentElement);
        });
        console.log('[Main] Comments loaded:', savedComments.length, 'comments.');
    }

    loadComments();

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
                savedComments.unshift(commentData);
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