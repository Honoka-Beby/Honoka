// js/main.js
import { createCommentElement, createArticleCardElement, SectionController, getRandomAnimeImage, getHitokotoQuote, getDailyFortune, blogArticles, dailyFortunes } from './components.js';

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
    const blogFilterControls = document.querySelector('.blog-filter-controls'); // 获取筛选器容器
    const copyQqBtn = document.getElementById('copy-qq-btn'); // 复制QQ按钮


    // 过渡场景动画：页面加载
    // ----------------------------------------------------
    setTimeout(() => {
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
            loadingScreen.addEventListener('transitionend', () => {
                if (loadingScreen) loadingScreen.style.display = 'none';
                body.classList.add('loaded');
                console.log('[Main] Loading screen hidden, body loaded.');
            }, { once: true });
        } else {
            body.classList.add('loaded');
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
        '.main-nav .nav-item',
        '.page-section',
        '.mobile-nav-toggle',
        '.main-nav'
    );
    console.log('[Main] SectionController initialized.');


    // 博客文章动态加载
    // ----------------------------------------------------
    console.log('[Main] Fetching anime images for articles...');
    const articlePromises = blogArticles.map(async (article) => {
        try {
            article.coverImage = await getRandomAnimeImage();
        } catch (e) {
            console.error('[Main] Error getting random image for article ', article.id, ', using fallback:', e);
            article.coverImage = `assets/images/fallback-cover-${Math.floor(Math.random()*3)+1}.png`;
        }
        return article;
    });
    let articlesWithCovers = [];
    try {
        articlesWithCovers = await Promise.all(articlePromises);
        console.log('[Main] All article covers fetched.', articlesWithCovers);
    } catch (e) {
        console.error('[Main] Error in Promise.all for article covers:', e);
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
        container.innerHTML = '';
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
    if (blogFilterControls) {
        // 动态生成分类按钮
        const categories = [...new Set(blogArticles.map(article => article.category))];
        categories.forEach(category => {
            const button = document.createElement('button');
            button.classList.add('anime-button', 'filter-btn');
            button.setAttribute('data-category', category);
            button.textContent = category;
            blogFilterControls.appendChild(button);
        });
        
        const filterButtons = document.querySelectorAll('.blog-filter-controls .filter-btn'); // 重新选择所有按钮
        filterButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                filterButtons.forEach(btn => btn.classList.remove('active'));
                e.currentTarget.classList.add('active');

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
        console.log('[Main] Blog category filter listeners and dynamic buttons bound.');
    } else {
        console.log('[Main] blogFilterControls not found.');
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
    function createBurstElement(content, color, type = 'emoji') {
        const span = document.createElement('span');
        span.textContent = content;
        span.style.color = color;
        const dx = Math.random() * 100 - 50;
        const dy = Math.random() * 100 - 50;
        span.style.setProperty('--dx', `${dx}px`);
        span.style.setProperty('--dy', `${dy}px`);
        span.style.fontSize = type === 'text' ? '1.2em' : '2em';
        return span;
    }

    if (drawFortuneBtn && fortuneDisplay && fortuneResultArea && fortuneBurstAnimation) {
        const initialFortune = getDailyFortune();
        fortuneDisplay.textContent = `【${initialFortune.type}】${initialFortune.message}`;
        fortuneDisplay.style.color = initialFortune.color || '#fff';
        fortuneDisplay.classList.add('show'); // 默认显示
        console.log('[Main] Initial daily fortune displayed.', initialFortune);
        
        drawFortuneBtn.addEventListener('click', () => {
            if (drawFortuneBtn.disabled) return;

            drawFortuneBtn.disabled = true;
            fortuneDisplay.classList.remove('show');
            
            fortuneBurstAnimation.innerHTML = '';
            fortuneBurstAnimation.classList.remove('show');
            
            console.log('[Main] Drawing new fortune...');
            
            setTimeout(() => {
                const newFortune = getDailyFortune();
                fortuneDisplay.textContent = `【${newFortune.type}】${newFortune.message}`;
                fortuneDisplay.style.color = newFortune.color || '#fff';

                setTimeout(() => {
                    fortuneDisplay.classList.add('show');
                    drawFortuneBtn.disabled = false;
                    console.log('[Main] New fortune displayed with fade-in.');

                    fortuneBurstAnimation.classList.add('show');
                    
                    // 随机生成几个爆炸元素
                    const numEmojis = Math.floor(Math.random() * 3) + 3;
                    newFortune.emojis.forEach((char, i) => {
                        const burstElem = createBurstElement(char, newFortune.color || '#fff', 'emoji');
                        burstElem.style.animation = `burst-fade-out 0.8s ease-out forwards ${i * 0.05}s`;
                        fortuneBurstAnimation.appendChild(burstElem);
                    });
                    const numWords = Math.floor(Math.random() * 2) + 1;
                    newFortune.textBurst.forEach((word, i) => {
                         const burstElem = createBurstElement(word, newFortune.color || '#fff', 'text');
                         burstElem.style.animation = `burst-fade-out 0.8s ease-out forwards ${i * 0.08 + numEmojis * 0.05}s`; // 延迟一点
                         fortuneBurstAnimation.appendChild(burstElem);
                    });
                    
                    setTimeout(() => {
                        fortuneBurstAnimation.innerHTML = '';
                        fortuneBurstAnimation.classList.remove('show');
                        console.log('[Main] Fortune burst animation finished and cleared.');
                    }, 800 + (numEmojis + numWords) * 100);

                }, 300);
            }, 0);
        });
    } else {
        console.log('[Main] Daily fortune elements not found. Skipping fortune game.');
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
        console.log('[Main] commentForm not found. Skipping comment submission setup.');
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
        console.log('[Main] Scroll to top button not found. Skipping scroll-to-top setup.');
    }

    // **新增：复制QQ号功能**
    if (copyQqBtn) {
        copyQqBtn.addEventListener('click', async () => {
            const qqNumber = copyQqBtn.getAttribute('data-qq');
            try {
                await navigator.clipboard.writeText(qqNumber);
                alert(`QQ号 ${qqNumber} 已复制到剪贴板！`);
                console.log('[Main] QQ number copied to clipboard.', qqNumber);
            } catch (err) {
                console.error('[Main] Failed to copy QQ number:', err);
                alert(`复制失败，请手动添加：${qqNumber}`);
            }
        });
        console.log('[Main] Copy QQ button listener bound.');
    } else {
        console.log('[Main] Copy QQ button not found.');
    }

});