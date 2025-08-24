// js/components.js

// 模拟文章数据 (真实应用中会从后端 API 获取)
export const blogArticles = [
    {
        id: '1',
        title: '文章标题一：二次元生活分享',
        meta: '2025-08-23 | 分类：日常',
        date: '2025-08-23',
        category: '日常',
        excerpt: '这是一篇关于我最近看的新番和一些生活感悟的分享，希望也能给你带来一些乐趣。通过这次分享，我想让更多人了解二次元文化的魅力，以及它如何融入我们的日常生活。无论是一部令人沉思的电影，还是一首动听的动漫歌曲，都能带给我们无尽的想象空间和情感共鸣。',
        content: `
            <p>最近沉迷于一部名为《星空下的约定》的动漫，画风唯美，剧情感人至深。主角的成长线和细腻的情感描写都让我深陷其中。每一次追番都仿佛经历了一场心灵的洗礼。我也尝试为这部番剧写了一些同人小故事，发现创作过程本身就充满了乐趣。</p>
            <p>除了追番，我还喜欢用二次元风格的壁纸和主题装点我的电脑和手机。看着屏幕上可爱的角色，工作和学习的疲惫感也似乎减轻了不少。有人说这是“逃避现实”，但我更觉得这是在为生活注入一份小小的美好和动力。这种对生活的热爱，源于对心中美好事物的憧憬。</p>
            <h3>小确幸时刻</h3>
            <p>在闲暇时，我会尝试画一些简单的二次元 Q 版人物。虽然画技还有待提高，但每次完成一幅作品，都会有满满的成就感。这是一个自我放松、表达创造力的方式，也是与自己内心对话的过程。我发现，即便是不完美的线条，也能勾勒出心中最真实的感受。</p>
            <p>我也经常逛一些二次元周边店。那些精致的手办、可爱的徽章、实用的文具，都让我爱不释手。每一个小物件都承载着我对二次元世界的热爱与憧憬。它们不仅仅是商品，更是连接我和二次元世界的桥梁。</p>
            <p>二次元不仅仅是一种娱乐，更是一种生活态度，一种对美好和梦想的追求。它教会我们勇敢、善良，并始终心怀希望。希望我的分享也能点燃你心中的那份热爱！如果你也有精彩的二次元故事，欢迎在留言板分享哦。</p>
        `,
        coverImage: '' // 将由 getRandomAnimeImage 填充
    },
    {
        id: '2',
        title: '文章标题二：代码与魔法的邂逅',
        meta: '2025-08-20 | 分类：技术',
        date: '2025-08-20',
        category: '技术',
        excerpt: '探索前端技术如何实现酷炫的视觉效果，就像施展魔法一样，让网页活起来！这不仅仅是技术，更是一种艺术创造的过程。',
        content: `
            <p>作为一名编程爱好者，尤其是前端开发者，我总是着迷于如何用代码创造出令人惊叹的视觉交互效果。这就像是魔法师在吟唱咒语，而屏幕上的元素则随之起舞。每一次成功实现一个复杂的动画，都让我感到无比的兴奋和满足。</p>
            <p>最近我深入研究了 CSS3 的动画和过渡效果，发现仅仅通过一些简单的属性组合，就能让页面元素以平滑、优雅的方式呈现。例如，使用 <code>transform</code> 和 <code>transition</code> 属性可以实现元素的位移、旋转、缩放，再结合 <code>@keyframes</code> 规则，就能创造出复杂的序列动画。通过这些“魔法”，网页不再是冰冷的静态页面，而是充满生命力的互动空间。</p>
            <h3>JavaScript 与交互</h3>
            <p>如果说 CSS 是静态的魔法，那么 JavaScript 就是动态的咒语。通过 JavaScript，我们可以监听用户的操作（点击、滑动、滚动），然后根据这些操作实时地修改 DOM 结构和样式，从而实现高度交互的动态页面。比如，本博客的页面切换动画和主题切换功能，都离不开 JavaScript 的助力。它让用户体验变得更加流畅和个性化。</p>
            <p>未来的目标是尝试使用一些更高级的动画库，比如 GSAP (GreenSock Animation Platform) 或 Anime.js，它们能更方便地控制时间线、缓动函数，实现电影级别的网页动画效果。想象一下，一个充满魔法元素的二次元网站，所有的按钮、图片、文字都能随着用户的交互而生动起来，那将是一件多么酷的事情！我希望能将更多二次元的奇思妙想融入到前端技术中。</p>
            <p>代码不仅仅是逻辑和功能，它也可以是艺术和创意。在前端的世界里，我感受到了无限的可能性，期待未来能创造更多“魔法”。编程的乐趣，也正是在于不断学习和探索未知。</p>
        `,
        coverImage: ''
    },
    {
        id: '3',
        title: '文章标题三：游戏世界的探索之旅',
        meta: '2025-08-15 | 分类：游戏',
        date: '2025-08-15',
        category: '游戏',
        excerpt: '回顾那些让我沉迷的二次元手游和主机游戏，分享我的游戏心得。每一个游戏都有它独特的地方，等待我们去发现和热爱。',
        content: `
            <p>作为一名深度二次元玩家，我的游戏世界从来都不缺乏精彩。从充满策略性的回合制RPG到紧张刺激的动作冒险，每一款游戏都像一部可以互动的番剧，带我进入不同的奇幻世界。游戏，对我来说，不只是一种娱乐，更是另一种形式的艺术体验。</p>
            <p>最近沉迷的是某款开放世界冒险游戏，精美的画风、引人入胜的剧情和丰富的角色设定都让我欲罢不能。为了探索每一个角落，收集隐藏的宝藏，我常常废寝忘食。那种探索未知、挑战极限的快感，是任何其他形式的娱乐都无法比拟的。每次发现一个隐藏任务或彩蛋，都像是和开发者进行了一次秘密的对话。</p>
            <h3>手游与社交</h3>
            <p>除了主机游戏，二次元手游也是我日常消遣的重要部分。它们通常拥有精美的立绘、全语音的角色，以及方便的社交系统。和朋友们一起组队挑战副本、分享抽卡成果，也成为了我生活中的乐趣之一。虽然有时会被“歪”卡池气到，但更多时候还是会因为抽到心仪的角色而感到无比的幸福。手游的便捷性让我在碎片时间也能沉浸在二次元的乐趣中。</p>
            <p>游戏对我来说，不仅仅是放松和娱乐，更是一种体验故事、结识朋友、甚至磨练意志的方式。在虚拟的世界里，我能暂时放下现实的烦恼，与心爱的角色们一同经历冒险。游戏中的每一次成功，都让我学会了坚持和策略。</p>
            <p>你有什么推荐的二次元游戏吗？欢迎在留言板分享哦！我总是乐于尝试新的游戏，发现新的乐趣。</p>
        `,
        coverImage: ''
    }
];

// 备用本地图片数组
const fallbackImages = [
    'assets/images/fallback-cover-1.png',
    'assets/images/fallback-cover-2.png',
    'assets/images/fallback-cover-3.png'
];
let fallbackImageIndex = 0; // 用于循环使用备用图片

/**
 * 从waifu.pics获取随机二次元图片，失败则使用本地备用图片。
 * @returns {Promise<string>} 返回图片URL
 */
export async function getRandomAnimeImage() {
    // 随机选择 SFW (Safe For Work) 类型，避免不适宜内容
    const categories = ['waifu', 'neko', 'shinobu', 'megumin', 'bully', 'cuddle', 'cry', 'hug', 'awoo', 'kiss', 'lick', 'pat', 'smug', 'bonk', 'yeet', 'blush'];
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    const apiUrl = `https://api.waifu.pics/sfw/${randomCategory}`;
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.url;
    } catch (error) {
        console.error('Failed to fetch anime image from API, using fallback:', error);
        // 使用本地备用图片并循环
        const imageUrl = fallbackImages[fallbackImageIndex];
        fallbackImageIndex = (fallbackImageIndex + 1) % fallbackImages.length;
        return imageUrl;
    }
}

/**
 * 从 hitokoto API 获取随机一言。
 * @returns {Promise<string>} 返回一言内容及来源
 */
export async function getHitokotoQuote() {
    const apiUrl = 'https://v1.hitokoto.cn/?c=a&c=b&c=c&c=d&c=e&c=f&c=g&c=h&c=i&c=j&c=k&c=l'; // 尽可能获取多个类型
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const from = data.from ? `——《${data.from}》` : '';
        const creator = data.creator ? ` · ${data.creator}` : '';
        return `${data.hitokoto}${from}${creator}`;
    } catch (error) {
        console.error('Failed to fetch Hitokoto quote, using fallback:', error);
        return '愿你被这世界温柔以待。'; // 备用一言
    }
}


/**
 * 创建一个符合二次元风格的博客文章卡片DOM元素。
 * @param {Object} articleData - 文章数据
 * @param {string} articleData.id - 文章唯一ID
 * @param {string} articleData.title - 文章标题
 * @param {string} articleData.meta - 文章元信息 (如发布日期, 分类)
 * @param {string} articleData.excerpt - 文章节选
 * @param {string} articleData.coverImage - 文章封面图片URL
 * @returns {HTMLElement} articleElement - 生成的 <article> DOM 元素
 */
export function createArticleCardElement(articleData) {
    const article = document.createElement('article');
    article.classList.add('anime-card');
    article.innerHTML = `
        <img src="${articleData.coverImage}" alt="${articleData.title}封面" class="card-cover" loading="lazy">
        <h3>${articleData.title}</h3>
        <p class="post-meta">${articleData.meta}</p>
        <p>${articleData.excerpt}</p>
        <a href="article.html?id=${articleData.id}" class="read-more anime-button">阅读全文 <i class="fas fa-angle-right"></i></a>
    `;
    return article;
}

/**
 * 创建一个留言板中的留言项DOM元素。
 * @param {Object} commentData - 留言数据
 * @param {string} commentData.name - 留言者昵称
 * @param {string} commentData.content - 留言内容
 * @param {string} commentData.date - 留言日期时间字符串 (格式: YYYY-MM-DD HH:MM:SS)
 * @returns {HTMLElement} commentElement - 生成的 <div> DOM 元素
 */
export function createCommentElement(commentData) {
    const newComment = document.createElement('div');
    newComment.classList.add('comment-item');
    newComment.innerHTML = `
        <p class="comment-author">${commentData.name} <span class="comment-date">${commentData.date}</span></p>
        <p class="comment-text">${commentData.content}</p>
    `;
    return newComment;
}

/**
 * 一个用于管理页面 section (分区) 切换的控制器类，支持导航高亮和手机端菜单切换。
 */
export class SectionController {
    /**
     * @param {string} navItemSelector - 导航项的选择器 (例如 '.main-nav .nav-item')
     * @param {string} pageSectionSelector - 页面 section 的选择器 (例如 '.page-section')
     * @param {string} mobileNavToggleSelector - 手机导航切换按钮的选择器 (例如 '.mobile-nav-toggle')
     * @param {string} mainNavContainerSelector - 主导航容器的选择器 (例如 '.main-nav')
     */
    constructor(navItemSelector, pageSectionSelector, mobileNavToggleSelector, mainNavContainerSelector) {
        this.navItems = document.querySelectorAll(navItemSelector);
        this.pageSections = document.querySelectorAll(pageSectionSelector);
        this.mobileNavToggle = document.querySelector(mobileNavToggleSelector);
        this.mainNavContainer = document.querySelector(mainNavContainerSelector);
        this.currentActiveSectionId = window.location.hash.substring(1) || 'home'; // 默认激活首页

        this.init();
    }

    init() {
        // 绑定导航点击事件
        this.navItems.forEach(item => {
            item.addEventListener('click', this.handleNavClick.bind(this));
        });

        // 绑定手机端导航切换事件
        if (this.mobileNavToggle) {
            this.mobileNavToggle.addEventListener('click', this.toggleMobileNav.bind(this));
        }

        // 监听 URL 哈希变化，支持浏览器前进/后退
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash.substring(1);
            if (hash && this.getSectionById(hash)) { // 确保哈希对应一个存在的 section
                this.setActive(hash);
            } else {
                this.setActive('home'); // 如果哈希无效，则回到首页
            }
            document.title = `Honoka的二次元博客 - V1.3 - ${this.getSectionTitle(hash)}`; // 更新标题
        });

        // 初始化显示默认 section
        this.setActive(this.currentActiveSectionId);
        document.title = `Honoka的二次元博客 - V1.3 - ${this.getSectionTitle(this.currentActiveSectionId)}`; // 初始化标题
    }

    /**
     * 获取指定 ID 的 section 元素
     * @param {string} id - Section 的 ID
     * @returns {HTMLElement|null}
     */
    getSectionById(id) {
        return document.getElementById(id);
    }

    /**
     * 获取 section 的标题，用于动态更新页面标题
     * @param {string} id - Section 的 ID
     * @returns {string} 标题文本
     */
    getSectionTitle(id) {
        switch (id) {
            case 'home': return '首页';
            case 'blog': return '博客';
            case 'about': return '关于我';
            case 'message-board': return '留言板';
            default: return '未知页面';
        }
    }

    /**
     * 设置当前激活的页面 section，并更新导航高亮。
     * @param {string} targetSectionId - 目标 section 的 ID (不带 #)
     */
    setActive(targetSectionId) {
        this.currentActiveSectionId = targetSectionId;

        this.pageSections.forEach(section => {
            if (section.id === targetSectionId) {
                section.classList.add('active');
            } else {
                section.classList.remove('active');
            }
        });

        this.navItems.forEach(item => {
            if (item.getAttribute('data-section') === targetSectionId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        if (window.location.hash.substring(1) !== targetSectionId) {
            window.location.hash = targetSectionId;
        }
    }

    /**
     * 处理导航项点击事件。
     * @param {Event} e - 点击事件对象
     */
    handleNavClick(e) {
        e.preventDefault();
        const targetSectionId = e.target.closest('.nav-item').getAttribute('data-section');
        this.setActive(targetSectionId);

        // 如果是手机端导航，点击后关闭菜单
        if (this.mainNavContainer && this.mainNavContainer.classList.contains('active')) {
            this.toggleMobileNav();
        }
    }

    /**
     * 切换手机端导航菜单的显示/隐藏状态。
     */
    toggleMobileNav() {
        if (this.mainNavContainer) {
            this.mainNavContainer.classList.toggle('active');
        }
        if (this.mobileNavToggle) {
            this.mobileNavToggle.classList.toggle('open');
        }
    }
}```

---

### **6. `js/main.js` (JavaScript 主要逻辑 - 主页)**

主要变化：
*   **加载随机一言**：在页面加载时调用 `getHitokotoQuote` 并显示在 Hero Area。
*   **所有文章和最新动态**：确保调用 `createArticleCardElement` 来动态加载文章。
*   **留言板持久化**：使用 `localStorage` 存储和加载留言，并移除了前端提示。
*   **关于我页面**：QQ 链接的文本和图标。

```javascript
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