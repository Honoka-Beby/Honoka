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
            <h3>最近的番剧推荐</h3>
            <p>最近沉迷于一部名为《星空下的约定》的动漫，画风唯美，剧情感人至深。主角的成长线和细腻的情感描写都让我深陷其中。每一次追番都仿佛经历了一场心灵的洗礼。我也尝试为这部番剧写了一些同人小故事，发现创作过程本身就充满了乐趣。剧中角色对梦想的执着，也激励着我在现实生活中不断努力。</p>
            <p>除了追番，我还喜欢用二次元风格的壁纸和主题装点我的电脑和手机。看着屏幕上可爱的角色，工作和学习的疲惫感也似乎减轻了不少。有人说这是“逃避现实”，但我更觉得这是在为生活注入一份小小的美好和动力。这种对生活的热爱，源于对心中美好事物的憧憬。我会定期更换桌面壁纸，让屏幕上的角色们陪伴着我度过每一个挑战。</p>
            <h3>小确幸时刻</h3>
            <p>在闲暇时，我会尝试画一些简单的二次元 Q 版人物。虽然画技还有待提高，但每次完成一幅作品，都会有满满的成就感。这是一个自我放松、表达创造力的方式，也是与自己内心对话的过程。我发现，即便是不完美的线条，也能勾勒出心中最真实的感受。我还喜欢收集一些动漫周边，比如手办、徽章和画册，它们都是我珍贵的回忆。</p>
            <p>二次元不仅仅是一种娱乐，更是一种生活态度，一种对美好和梦想的追求。它教会我们勇敢、善良，并始终心怀希望。希望我的分享也能点燃你心中的那份热爱！如果你也有精彩的二次元故事，欢迎在留言板分享哦。我很期待与大家交流彼此的二次元世界。</p>
        `,
        coverImage: ''
    },
    {
        id: '2',
        title: '文章标题二：代码与魔法的邂逅',
        meta: '2025-08-20 | 分类：技术',
        date: '2025-08-20',
        category: '技术',
        excerpt: '探索前端技术如何实现酷炫的视觉效果，就像施展魔法一样，让网页活起来！这不仅仅是技术，更是一种艺术创造的过程，通过代码我们能构造出无限可能的虚拟世界。',
        content: `
            <h3>前端的魅力</h3>
            <p>作为一名编程爱好者，尤其是前端开发者，我总是着迷于如何用代码创造出令人惊叹的视觉交互效果。这就像是魔法师在吟唱咒语，而屏幕上的元素则随之起舞。每一次成功实现一个复杂的动画，都让我感到无比的兴奋和满足。前端的每一行代码，都像是施展魔法的咒语，让静态的页面焕发出勃勃生机。</p>
            <h3>CSS3 的魔力</h3>
            <p>最近我深入研究了 CSS3 的动画和过渡效果，发现仅仅通过一些简单的属性组合，就能让页面元素以平滑、优雅的方式呈现。例如，使用 <code>transform</code> 和 <code>transition</code> 属性可以实现元素的位移、旋转、缩放，再结合 <code>@keyframes</code> 规则，就能创造出复杂的序列动画。通过这些“魔法”，网页不再是冰冷的静态页面，而是充满生命力的互动空间。我常常为了一个像素的对齐或一个过渡的时长而反复调试，只为追求那份极致的美感。</p>
            <h3>JavaScript 与交互</h3>
            <p>如果说 CSS 是静态的魔法，那么 JavaScript 就是动态的咒语。通过 JavaScript，我们可以监听用户的操作（点击、滑动、滚动），然后根据这些操作实时地修改 DOM 结构和样式，从而实现高度交互的动态页面。比如，本博客的页面切换动画和主题切换功能，都离不开 JavaScript 的助力。它让用户体验变得更加流畅和个性化。我喜欢用 JavaScript 编写一些小工具，让网站变得更加智能和便捷。</p>
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
        excerpt: '回顾那些让我沉迷的二次元手游和主机游戏，分享我的游戏心得。每一个游戏都有它独特的地方，等待我们去发现和热爱，体验不一样的冒险。',
        content: `
            <h3>我的游戏观</h3>
            <p>作为一名深度二次元玩家，我的游戏世界从来都不缺乏精彩。从充满策略性的回合制RPG到紧张刺激的动作冒险，每一款游戏都像一部可以互动的番剧，带我进入不同的奇幻世界。游戏，对我来说，不只是一种娱乐，更是另一种形式的艺术体验。我喜欢在游戏中体验不同的故事，扮演不同的角色，感受不同的人生。</p>
            <h3>开放世界的魅力</h3>
            <p>最近沉迷的是某款开放世界冒险游戏，精美的画风、引人入胜的剧情和丰富的角色设定都让我欲罢不能。为了探索每一个角落，收集隐藏的宝藏，我常常废寝忘食。那种探索未知、挑战极限的快感，是任何其他形式的娱乐都无法比拟的。每次发现一个隐藏任务或彩蛋，都像是和开发者进行了一次秘密的对话。我特别喜欢在游戏中漫无目的地探索，发现那些不为人知的风景和故事。</p>
            <h3>手游与社交</h3>
            <p>除了主机游戏，二次元手游也是我日常消遣的重要部分。它们通常拥有精美的立绘、全语音的角色，以及方便的社交系统。和朋友们一起组队挑战副本、分享抽卡成果，也成为了我生活中的乐趣之一。虽然有时会被“歪”卡池气到，但更多时候还是会因为抽到心仪的角色而感到无比的幸福。手游的便捷性让我在碎片时间也能沉浸在二次元的乐趣中。我尤其喜欢那些有深度剧情和丰富角色设定的二次元手游。</p>
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
    const categories = ['waifu', 'neko', 'shinobu', 'megumin', 'bully', 'cuddle', 'cry', 'hug', 'awoo', 'kiss', 'lick', 'pat', 'smug', 'bonk', 'yeet', 'blush'];
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    const apiUrl = `https://api.waifu.pics/sfw/${randomCategory}`;
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('[Components-Image] Fetched anime image:', data.url);
        return data.url;
    } catch (error) {
        console.error('[Components-Image] Failed to fetch anime image from API, using fallback:', error);
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
    const apiUrl = 'https://v1.hitokoto.cn/?c=a&c=c&c=d&c=g&c=h&c=i&c=j&c=k&c=l';
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('[Components-Hitokoto] Fetched Hitokoto quote:', data.hitokoto);
        const from = data.from ? `——《${data.from}》` : '';
        const creator = data.creator ? ` · ${data.creator}` : '';
        return `${data.hitokoto}${from}${creator}`;
    } catch (error) {
        console.error('[Components-Hitokoto] Failed to fetch Hitokoto quote, using fallback:', error);
        return '愿你被这世界温柔以待。'; // 备用一言
    }
}

// 今日运势数据 (含更多颜文字和颜色)
export const dailyFortunes = [
    { type: '大吉', message: '今日运势大吉，心想事成，万事顺利！桃花运旺，学业事业双丰收！', emojis: ['✨', '🌸', '💖'], color: '#8BC34A', textBurst: ['超棒!', '好运!', 'Yes!'] },
    { type: '中吉', message: '运势中吉，偶有小挑战，但转危为安。财运平稳，小心花销。', emojis: ['🌟', '🍀'], color: '#FFC107', textBurst: ['加油!', '不错!'] },
    { type: '小吉', message: '运势小吉，平淡是福。适合学习和沉淀，积累力量。', emojis: ['😊', '⭐'], color: '#03A9F4', textBurst: ['平稳!', '努力!'] },
    { type: '末吉', message: '运势平平，小有烦恼。保持平常心，注意身体健康。', emojis: ['💧', '💡'], color: '#9E9E9E', textBurst: ['谨慎!', '冷静!'] },
    { type: '凶', message: '今日运势稍有不顺，行事需谨慎。宜静不宜动，三思而后行。', emojis: ['⚠️', '🌧️', '😟'], color: '#FF5722', textBurst: ['注意!', '小心!'] },
    { type: '大凶', message: '运势不佳，可能会遇到较大阻碍。保持积极心态，寻求帮助可得贵人相助。', emojis: ['⛈️', '💔', '😭'], color: '#E91E63', textBurst: ['坚持!', '挺住!'] },
    { type: '超大吉', message: '逆天运势！所有不幸都会转化为幸福，意想不到的好运即将降临！', emojis: ['🎉', '💖', '🌟', '💎'], color: '#FFEB3B', textBurst: ['WOW!', '恭喜!', '爆发!', 'Amazing!'] },
    { type: '恋爱吉', message: '今日恋爱运势极佳，勇敢表白，会有意想不到的惊喜！', emojis: ['❤️', '💞', '🥰'], color: '#F06292', textBurst: ['脱单!', '表白!', '心动!'] },
    { type: '学业吉', message: '学业运势鼎盛，灵感如泉涌。是攻克难题，提升成绩的好时机！', emojis: ['📚', '💡', '🎓'], color: '#64B5F6', textBurst: ['学霸!', '进步!', '高分!'] },
];

/**
 * 获取今日运势
 * @returns {Object} 包含运势类型、消息、emoji和颜色的对象
 */
export function getDailyFortune() {
    const today = new Date().toDateString();
    let fortuneData = localStorage.getItem('daily_fortune_' + today);

    if (fortuneData) {
        console.log('[Components-Fortune] Loaded daily fortune from localStorage.', JSON.parse(fortuneData));
        return JSON.parse(fortuneData);
    } else {
        const randomIndex = Math.floor(Math.random() * dailyFortunes.length);
        const selectedFortune = dailyFortunes[randomIndex];
        // 保存完整对象，包括 emoji 和 color
        localStorage.setItem('daily_fortune_' + today, JSON.stringify(selectedFortune)); // 每天只抽取一次
        console.log('[Components-Fortune] New daily fortune generated.', selectedFortune);
        return selectedFortune;
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
    article.setAttribute('data-category', articleData.category); // 用于筛选
    article.innerHTML = `
        <img src="${articleData.coverImage}" alt="${articleData.title}封面" class="card-cover" loading="lazy" onerror="this.onerror=null;this.src='assets/images/fallback-cover-${Math.floor(Math.random()*3)+1}.png';">
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
    constructor(navItemSelector, pageSectionSelector, mobileNavToggleSelector, mainNavContainerSelector) {
        this.navItems = document.querySelectorAll(navItemSelector); // 选择所有 .nav-item 链接
        this.pageSections = document.querySelectorAll(pageSectionSelector);
        this.mobileNavToggle = document.querySelector(mobileNavToggleSelector);
        this.mainNavContainer = document.querySelector(mainNavContainerSelector);
        this.currentActiveSectionId = window.location.hash.substring(1) || 'home';

        console.log('[SectionController] Initializing. Nav items count:', this.navItems.length, 'Sections count:', this.pageSections.length);
        this.init();
    }

    init() {
        this.navItems.forEach(item => {
            item.addEventListener('click', this.handleNavClick.bind(this));
        });
        console.log('[SectionController] Nav item click handlers bound.');

        if (this.mobileNavToggle) {
            this.mobileNavToggle.addEventListener('click', this.toggleMobileNav.bind(this));
            console.log('[SectionController] Mobile nav toggle handler bound.');
        }

        window.addEventListener('hashchange', () => {
            const hash = window.location.hash.substring(1);
            console.log('[SectionController] Hash changed to:', hash);
            if (hash && this.getSectionById(hash)) {
                this.setActive(hash);
            } else {
                this.setActive('home');
            }
            document.title = `Honoka的二次元博客 - V1.0 - ${this.getSectionTitle(hash)}`;
        });
        console.log('[SectionController] Hashchange listener bound.');

        this.setActive(this.currentActiveSectionId);
        document.title = `Honoka的二次元博客 - V1.0 - ${this.getSectionTitle(this.currentActiveSectionId)}`;
    }

    getSectionById(id) {
        return document.getElementById(id);
    }

    getSectionTitle(id) {
        switch (id) {
            case 'home': return '首页';
            case 'blog': return '博客';
            case 'about': return '关于我';
            case 'message-board': return '留言板';
            default: return '未知页面';
        }
    }

    setActive(targetSectionId) {
        console.log(`[SectionController] Attempting to set active section to: ${targetSectionId}`);

        this.currentActiveSectionId = targetSectionId;

        this.pageSections.forEach(section => {
            if (section.id === targetSectionId) {
                if (!section.classList.contains('active')) {
                    section.classList.add('active');
                    console.log(`[SectionController] Added active to #${section.id}`);
                }
            } else {
                if (section.classList.contains('active')) {
                    section.classList.remove('active');
                    console.log(`[SectionController] Removed active from #${section.id}`);
                }
            }
        });

        this.navItems.forEach(navLink => {
            if (navLink.getAttribute('data-section') === targetSectionId) {
                if (!navLink.classList.contains('active')) {
                    navLink.classList.add('active');
                    console.log(`[SectionController] Added active to nav item for ${targetSectionId}`);
                }
            } else {
                if (navLink.classList.contains('active')) {
                    navLink.classList.remove('active');
                    console.log(`[SectionController] Removed active from nav item for ${navLink.getAttribute('data-section')}`);
                }
            }
        });

        if (window.location.hash.substring(1) !== targetSectionId) {
            window.location.hash = targetSectionId;
            console.log(`[SectionController] Updated window hash to #${targetSectionId}`);
        }
    }

    handleNavClick(e) {
        e.preventDefault();
        const navLink = e.target.closest('.nav-item[data-section]'); // 确保点击的是带有data-section的a标签
        if (navLink) {
            const targetSectionId = navLink.getAttribute('data-section');
            this.setActive(targetSectionId);

            if (this.mainNavContainer && this.mainNavContainer.classList.contains('active')) {
                this.toggleMobileNav();
                console.log('[SectionController] Mobile nav closed after click.');
            }
        } else {
            console.warn('[SectionController] Clicked nav item without valid data-section link.', e.target);
        }
    }

    toggleMobileNav() {
        if (this.mainNavContainer) {
            this.mainNavContainer.classList.toggle('active');
            console.log('[SectionController] Toggled mainNavContainer active class. Is active:', this.mainNavContainer.classList.contains('active'));
        }
        if (this.mobileNavToggle) {
            this.mobileNavToggle.classList.toggle('open');
            console.log('[SectionController] Toggled mobileNavToggle open class. Is open:', this.mobileNavToggle.classList.contains('open'));
        }
    }
}