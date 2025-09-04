// js/comments.js 
document.addEventListener('DOMContentLoaded', () => {
    console.log("💬 [Comments Module] comments.js STARTING execution...");

    const commentForm = document.getElementById('comment-form');
    // Ensure commentsList is retrieved reliably across function calls (may change if innerHTML updated)
    let commentsList = document.getElementById('comments-list'); 

    // ★★★ IMPORTANT: Replace with YOUR ACTUAL NETLIFY DEPLOYED FRONTEND DOMAIN !!! ★★★
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
            errorDetail = await response.text(); // Attempt to get raw error text
        } catch (e) {
            console.warn(`[CommentsAPI] ${context} Could not read error response text:`, e);
        }
        
        console.error(`[CommentsAPI] ${context} Error (HTTP ${response.status}): ${response.statusText}`, errorDetail);
        
        // Try parsing JSON error if content-type indicates it
        if (response.headers.get('content-type')?.includes('application/json')) {
            try {
                const errorJson = JSON.parse(errorDetail); 
                return `服务器错误 (${response.status}): ${errorJson.message || errorJson.error || '后端返回未知JSON错误。'}`;
            } catch (jsonErr) {
                // Fallback for malformed JSON or other parsing issues
                return `服务器错误 (${response.status}): 无法解析后端响应，原始文本: "${errorDetail.substring(0, 100)}..."`;
            }
        } else {
            // Generic error for network or non-JSON responses
            return `请求失败 (${response.status}): ${errorDetail || '网络或服务器错误，请检查连接。'}`;
        }
    }

    /**
     * Fetches all comments from the backend Netlify Function.
     * 使用 function 声明，确保完全提升。
     * @returns {Promise<Array<Object>>} An array of comment objects, or empty array on error.
     */
    async function getAllComments() {
        console.log("[CommentsAPI] Attempting to fetch comments from", backendBaseUrl + 'getComments');
        try {
            const response = await fetch(`${backendBaseUrl}getComments`, {
                method: "GET",
                 headers: { "Accept": "application/json" } // Explicitly accept JSON
            });

            if(!response.ok) { 
                const errorMessage = await handleFetchError(response, 'getComments');
                throw new Error(errorMessage);
            }

            const comments = await response.json(); 
            console.log(`[CommentsAPI] Successfully fetched ${comments.length} comments.`);
            return comments;
        } catch (error) {
            console.error('[CommentsAPI] Failed to fetch comments: Firebase backend config or Netlify Function deployment issue. Details:', error);
            // Display an error message directly on the page if list container exists
            commentsList = document.getElementById('comments-list'); // Re-get it, just in case
            if(commentsList) {
                // The class 'is-visible' ensures CSS animation trigger
                commentsList.innerHTML = `<p class="no-comments-message is-visible">呀，加载留言列表失败了... (${error.message})</p>`;
                // Also ensure its parent container is forcefully visible if comments.html is loaded
                commentsList.closest('.comments-list-container')?.classList.add('is-visible');
            }
            return []; // Always return empty array on error to prevent further issues downstream
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

        // Provide immediate user feedback and prevent double submission
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = '提交中...'; 
            submitButton.style.cursor = 'wait'; 
        }

        try {
            const response = await fetch(`${backendBaseUrl}createComment`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ author, text }), 
            });

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
            alert(`提交留言失败: ${error.message}. 请检查您的输入或稍后再试！`); 
            return false;
        } finally {
            // Re-enable button and restore original text / cursor regardless of outcome
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
     */
    function displayComments(comments, loadDelay = 100) { 
        commentsList = document.getElementById('comments-list'); 
        if (!commentsList) {
            console.error("[CommentsDisplay] Comments list container element not found (ID 'comments-list'). Cannot display comments.");
            return;
        }

        commentsList.innerHTML = ''; // Clear existing comments

        if (!comments || comments.length === 0) {
            const noCommentsMessage = document.createElement('p');
            noCommentsMessage.classList.add('no-comments-message', 'is-visible'); 
            noCommentsMessage.textContent = "还没有留言呢，成为第一个留下足迹的人吧！";
            commentsList.appendChild(noCommentsMessage);
            console.log("[CommentsDisplay] No comments to display. Showing placeholder text.");
            commentsList.closest('.comments-list-container')?.classList.add('is-visible'); 
            return;
        } 

        // Sort comments by timestamp (newest first) for consistent display order
        const sortedComments = [...comments].sort((a,b) => {
            const dateA = a.timestamp ? new Date(a.timestamp) : new Date(0); 
            const dateB = b.timestamp ? new Date(b.timestamp) : new Date(0);
            return dateB.getTime() - dateA.getTime(); 
        });

        sortedComments.forEach((comment, index) => {
            const commentCard = document.createElement('div');
            // 'post-card' for general styling, 'comment-card' for specific overrides.
            commentCard.classList.add('post-card', 'comment-card', 'animate__slide-up'); 
            // Apply data-delay for staggered animation potential (even visually).
            commentCard.dataset.delay = String(index * 80); 

            // Robust date formatting
            const date = new Date(comment.timestamp);
            const formattedDate = date.toLocaleString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

            // CRITICAL FIX: HTML escape author and text to prevent XSS vulnerabilities
            const escapedAuthor = comment.author ? comment.author.replace(/</g, "&lt;").replace(/>/g, "&gt;") : '匿名访客';
            const escapedText = comment.text ? comment.text.replace(/</g, "&lt;").replace(/>/g, "&gt;") : '';

            commentCard.innerHTML = `
                <div class="comment-info">
                   <p class="comment-text">${escapedText}</p>
                   <div class="comment-meta">留言于 <strong>${formattedDate}</strong> by <strong>${escapedAuthor}</strong></div>
               </div>
            `;
            commentsList.appendChild(commentCard);
            // This small delayed application of 'is-visible' ensures individual card fade in,
            // while the parent container's 'is-visible' already revealed the section.
            setTimeout(() => { commentCard.classList.add('is-visible'); }, parseInt(commentCard.dataset.delay) + loadDelay); 
        });
        console.log(`[CommentsDisplay] Displayed ${sortedComments.length} comments.`);

        const parentContainer = commentsList.closest('.comments-list-container');
        if(parentContainer && !parentContainer.classList.contains('is-visible')) {
            setTimeout(() => parentContainer.classList.add('is-visible'), loadDelay + 50); // Ensure parent also fades in
            console.log("[CommentsDisplay] Main comments list container set to visible for animation.");
        }
    } 

    /**
     * Main handler for comment form submission.
     * 使用 function 声明，确保完全提升。
     * @param {Event} event - The form submission event.
     */
    async function commentFormSubmitHandler(event) {
        event.preventDefault(); // Prevent default form submission

        const authorInput = document.getElementById('comment-author');
        const commentTextInput = document.getElementById('comment-text');

        const author = authorInput?.value.trim() || ''; 
        const text = commentTextInput?.value.trim() || '';

        // Client-side validation: basic checks before sending to server
        if (!author) { alert('名字不能为空哦！'); authorInput?.focus(); return; }
        if (author.length > 50) { alert('名字太长了，请控制在50个字符以内！'); authorInput?.focus(); return; }
        if (!text) { alert('留言内容不能为空哦！'); commentTextInput?.focus(); return; }
        if (text.length > 500) { alert('留言内容太长了，请控制在500个字符以内！'); commentTextInput?.focus(); return; }

        const success = await postNewComment(author, text);

        if (success) {
            // Clear form fields only on successful submission
            if(authorInput) authorInput.value = ''; 
            if(commentTextInput) commentTextInput.value = ''; 
            // After successful post, reload and re-display (newest comments will appear first)
            await loadAndDisplayComments(); 
        } 
    }

    /**
     * Initializer for comments page. This function encapsulates all comments-related setup.
     * 使用 function 声明，确保完全提升。
     */
    function setupCommentsPage() { 
        commentsList = document.getElementById('comments-list'); // Re-get for this function
        
        if (commentForm) {
            commentForm.addEventListener('submit', commentFormSubmitHandler);
            console.log("[CommentsForm] Comment form submission listener attached.");
        } else {
            console.warn("[CommentsForm] Comment Form element (ID 'comment-form') not found. Skipping submission setup on this page. (Expected on non-comments.html)");
        }

        if (commentsList) {
            // Load and display comments immediately when the page is ready for rendering comments
            loadAndDisplayComments(); 
        } else {
            console.warn("[Comments] Comments list element (ID 'comments-list') not found. Skipping comment display on this page. (Expected on non-comments.html)");
        }
        console.log("✅ [Comments Module] Comments page setup completed.");
    }
    
    // Defer the execution of comments page setup until the very end of DOMContentLoaded processing,
    // to ensure script.js (core fixes) and critical DOM elements are fully ready.
    // Ensure it only runs if we are actually on a comments-related page (has form or list container).
    if (window.location.pathname.includes('comments.html') || document.getElementById('comment-form') || document.getElementById('comments-list')) {
        setTimeout(setupCommentsPage, 150); // Small delay after other core script.js initializations finish up.
    }

    console.log("✅ [Comments Module] comments.js FINISHED execution.");
});
