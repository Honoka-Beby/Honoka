// js/comments.js 
document.addEventListener('DOMContentLoaded', () => {
    console.log("💬 [Comments Module] comments.js STARTING execution...");

    const commentForm = document.getElementById('comment-form');
    let commentsList = document.getElementById('comments-list'); 

    // ★★★ IMPORTANT: Replace with YOUR ACTUAL NETLIFY DEPLOYED FRONTEND DOMAIN !!! ★★★
    // This value is used by backend functions for CORS. Ensure it matches your live site.
    const backendBaseUrl = 'https://honoka1.netlify.app/.netlify/functions/'; 

    /**
     * Helper function to handle fetch API errors and generate user-friendly messages.
     * 使用 function 声明，确保完全提升。
     * @param {Response} response - The raw Fetch API response object.
     * @param {string} context - A string describing the API call (e.g., 'getComments', 'createComment').
     * @returns {Promise<string>} A user-friendly error message resolved asynchronously.
     */
    async function handleFetchError(response, context) {
        let errorDetail = '';
        try {
            errorDetail = await response.text(); 
        } catch (e) {
            console.warn(`[CommentsAPI] ${context} Could not read error response text:`, e);
            errorDetail = `Could not read error response for ${context}.`;
        }
        
        console.error(`[CommentsAPI] ${context} Error (HTTP ${response.status}): ${response.statusText}`, errorDetail);
        
        if (response.headers.get('content-type')?.includes('application/json')) {
            try {
                const errorJson = JSON.parse(errorDetail); 
                return `服务器错误 (${response.status}): ${errorJson.message || errorJson.error || '后端返回未知JSON错误。'}`;
            } catch (jsonErr) {
                return `服务器错误 (${response.status}): 无法解析后端响应，原始文本: "${errorDetail.substring(0, 100)}..."`;
            }
        } else {
            return `请求失败 (${response.status}): ${errorDetail || '网络或服务器错误，请检查您的连接或FireBase配置。'}`;
        }
    }

    /**
     * Fetches all comments from the backend Netlify Function.
     * 使用 function 声明，确保完全提升。
     * @returns {Promise<Array<Object>>} An array of comment objects, or empty array on error.
     */
    async function getAllComments() {
        console.log("[CommentsAPI] Attempting to fetch comments from", backendBaseUrl + 'getComments');
        commentsList = document.getElementById('comments-list'); // Re-get it here, in case previous steps updated the DOM
        const parentContainer = commentsList?.closest('.comments-list-container');

        if(commentsList) {
            commentsList.innerHTML = `<p class="no-comments-message is-visible">正在加载留言...</p>`;
            parentContainer?.classList.add('is-visible');
        }

        try {
            // Give a more generous timeout for API calls. If the backend function is cold-starting, it might take longer.
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 seconds timeout for API calls
            
            const response = await fetch(`${backendBaseUrl}getComments`, {
                method: "GET",
                 headers: { "Accept": "application/json" },
                 signal: controller.signal
            });
            clearTimeout(timeoutId); // Clear timeout if response is received within time

            if(!response.ok) { 
                const errorMessage = await handleFetchError(response, 'getComments');
                throw new Error(errorMessage);
            }

            const comments = await response.json(); 
            console.log(`[CommentsAPI] Successfully fetched ${comments.length} comments.`);
            return comments;
        } catch (error) {
            console.error('[CommentsAPI] Failed to fetch comments: Firebase backend config or Netlify Function deployment issue. Details:', error);
            if(error.name === 'AbortError') { // Handle timeout specifically
                error.message = "请求加载留言超时，可能是后端服务冷启动或网络较差。";
            }
            if(commentsList) {
                commentsList.innerHTML = `<p class="no-comments-message is-visible">呀，加载留言列表失败了... (${error.message})</p>`;
                parentContainer?.classList.add('is-visible'); 
            }
            return []; 
        }
    }

    /**
     * Posts a new comment to the backend Netlify Function.
     * 使用 function 声明，确保完全提升。
     * @param {string} author - The author's name.
     * @param {string} text - The comment text.
     * @returns {Promise<boolean>} True if successful, false otherwise.
     */
    async function postNewComment(author, text) {
        console.log("[CommentsAPI] Attempting to post new comment to", backendBaseUrl + 'createComment');
        const submitButton = commentForm?.querySelector('button[type="submit"]');

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = '提交中...'; 
            submitButton.style.cursor = 'wait'; 
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 seconds timeout
            
            const response = await fetch(`${backendBaseUrl}createComment`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ author, text }), 
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!response.ok) { 
                const errorMessage = await handleFetchError(response, 'createComment');
                throw new Error(errorMessage);
            }

            const result = await response.json(); 
            console.log('[CommentsAPI] Comment posted successfully:', result); 
            alert('留言提交成功，感谢您的来访！'); 
            return true; 
        } catch (error) {
            console.error('[CommentsAPI] Failed to post comment from frontend:', error);
            if(error.name === 'AbortError') {
                error.message = "提交留言请求超时，可能是后端服务冷启动或网络较差。";
            }
            alert(`提交留言失败: ${error.message}. 请检查您的输入或稍后再试！`); 
            return false;
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = '提交留言'; 
                submitButton.style.cursor = 'pointer'; 
            }
        }
    }

    /**
     * Dynamically renders and displays a list of comments in the DOM.
     * 使用 function 声明，确保完全提升。
     * @param {Array<Object>} comments - An array of comment objects.
     * @param {number} [loadDelay=100] - Base delay for staggered loading of comments.
     */
    function displayComments(comments, loadDelay = 100) { 
        commentsList = document.getElementById('comments-list'); 
        if (!commentsList) {
            console.error("[CommentsDisplay] Comments list container element (ID 'comments-list') not found. Cannot display comments.");
            return;
        }

        commentsList.innerHTML = ''; 

        if (!comments || comments.length === 0) {
            const noCommentsMessage = document.createElement('p');
            // 'is-visible' will already be force-applied by script.js, just make sure it's the correct class.
            noCommentsMessage.classList.add('no-comments-message'); 
            noCommentsMessage.textContent = "还没有留言呢，成为第一个留下足迹的人吧！";
            commentsList.appendChild(noCommentsMessage);
            console.log("[CommentsDisplay] No comments to display. Showing placeholder text.");
            // Ensure message itself finally gets the visibility treatment if not caught by script.js
            setTimeout(() => noCommentsMessage.classList.add('is-visible'), loadDelay + 10); 
            commentsList.closest('.comments-list-container')?.classList.add('is-visible'); 
            return;
        } 

        const sortedComments = [...comments].sort((a,b) => {
            const dateA = a.timestamp ? new Date(a.timestamp) : new Date(0); 
            const dateB = b.timestamp ? new Date(b.timestamp) : new Date(0);
            return dateB.getTime() - dateA.getTime(); 
        });

        sortedComments.forEach((comment, index) => {
            const commentCard = document.createElement('div');
            commentCard.classList.add('post-card', 'comment-card', 'animate__slide-up'); 
            commentCard.dataset.delay = String(index * 80); 

            const date = new Date(comment.timestamp);
            const formattedDate = date.toLocaleString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

            const escapedAuthor = comment.author ? comment.author.replace(/</g, "&lt;").replace(/>/g, "&gt;") : '匿名访客';
            const escapedText = comment.text ? comment.text.replace(/</g, "&lt;").replace(/>/g, "&gt;") : '';

            commentCard.innerHTML = `
                <div class="comment-info">
                   <p class="comment-text">${escapedText}</p>
                   <div class="comment-meta">留言于 <strong>${formattedDate}</strong> by <strong>${escapedAuthor}</strong></div>
               </div>
            `;
            commentsList.appendChild(commentCard);
            // Stagger actual 'is-visible' class based on index and load delay for a cascading animation
            setTimeout(() => { commentCard.classList.add('is-visible'); }, loadDelay + (index * 80)); 
            
            // Explicitly ensure internal elements also get 'is-visible'
            setTimeout(() => {
                commentCard.querySelector('.comment-text')?.classList.add('is-visible');
                commentCard.querySelector('.comment-meta')?.classList.add('is-visible');
            }, loadDelay + (index * 80) + 50); // Slightly more delay for internal text
        });
        console.log(`[CommentsDisplay] Displayed ${sortedComments.length} comments.`);

        // Ensure the entire comments list container is visible.
        const parentContainer = commentsList.closest('.comments-list-container');
        if(parentContainer) { // No need to check if !contains('is-visible') as script.js should manage this.
            setTimeout(() => parentContainer.classList.add('is-visible'), loadDelay + 250); 
            console.log("[CommentsDisplay] Main comments list container set to visible for animation.");
        }
    } 

    /**
     * Main handler for comment form submission.
     * 使用 function 声明，确保完全提升。
     * @param {Event} event - The form submission event.
     */
    async function commentFormSubmitHandler(event) {
        event.preventDefault(); 

        const authorInput = document.getElementById('comment-author');
        const commentTextInput = document.getElementById('comment-text');

        const author = authorInput?.value.trim() || ''; 
        const text = commentTextInput?.value.trim() || '';

        if (!author) { alert('名字不能为空哦！'); authorInput?.focus(); return; }
        if (author.length > 50) { alert('名字太长了，请控制在50个字符以内！'); authorInput?.focus(); return; }
        if (!text) { alert('留言内容不能为空哦！'); commentTextInput?.focus(); return; }
        if (text.length > 500) { alert('留言内容太长了，请控制在500个字符以内！'); commentTextInput?.focus(); return; }

        const success = await postNewComment(author, text);

        if (success) {
            if(authorInput) authorInput.value = ''; 
            if(commentTextInput) commentTextInput.value = ''; 
            await loadAndDisplayComments(); 
            document.querySelector('.comment-form-container .form-hint')?.classList.add('is-visible'); // Explicitly show hint.
        } 
    }

    /**
     * Initializer for comments page. This function encapsulates all comments-related setup.
     * 使用 function 声明，确保完全提升。
     */
    function setupCommentsPage() { 
        commentsList = document.getElementById('comments-list'); 
        
        if (commentForm) {
            commentForm.addEventListener('submit', commentFormSubmitHandler);
            console.log("[CommentsForm] Comment form submission listener attached.");
            commentForm.classList.add('is-visible'); // Ensure the form itself is visible on comments.html
        } else {
            console.warn("[CommentsForm] Comment Form element (ID 'comment-form') not found. Skipping submission setup. (Expected on non-comments.html)");
        }

        if (commentsList) {
            loadAndDisplayComments(); 
            // The commentsList.classList.add('is-visible') is now handled directly by displayComments for more fine-grained control
        } else {
            console.warn("[Comments] Comments list element (ID 'comments-list') not found. Skipping comment display. (Expected on non-comments.html)");
        }
        
        // Ensure its parent `comment-section` and its title are also explicitly visible during individual setup
        const commentSection = document.querySelector('.comment-section');
        if (commentSection) {
            commentSection.classList.add('is-visible');
            setTimeout(() => commentSection.querySelector('.page-title')?.classList.add('is-visible'), 50); // Small stagger for title
        }
        
        console.log("✅ [Comments Module] Comments page setup completed.");
    }
    
    // Defer the execution of comments page setup until the very end of DOMContentLoaded processing,
    // and after script.js has run its visibility fixes on general elements.
    // Ensure it only runs if we are actually on a comments-related page.
    if (window.location.pathname.includes('comments.html') || document.getElementById('comment-form') || document.getElementById('comments-list')) {
        console.log("[Comments Module] Attempting to set up Comments page with a slightly increased delay to ensure core CSS/JS visibility.");
        setTimeout(setupCommentsPage, 350); // Increased delay
    }

    console.log("✅ [Comments Module] comments.js FINISHED execution.");
});
