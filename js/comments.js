// js/comments.js 
document.addEventListener('DOMContentLoaded', () => {
    console.log("💬 [Comments Module] comments.js STARTING execution...");

    const commentForm = document.getElementById('comment-form');
    // Ensure commentsList is retrieved reliably across function calls (may change if innerHTML updated)
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
        commentsList = document.getElementById('comments-list'); // Re-get inside the function before manipulation
        const parentContainer = commentsList?.closest('.comments-list-container');

        // Immediately show a loading state if possible
        if(commentsList) {
            commentsList.innerHTML = `<p class="no-comments-message is-visible">正在加载留言...</p>`;
            parentContainer?.classList.add('is-visible');
        }

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
            if(commentsList) {
                // Ensure the error message itself triggers the 'is-visible' class for animations
                commentsList.innerHTML = `<p class="no-comments-message is-visible">呀，加载留言列表失败了... (${error.message})</p>`;
                parentContainer?.classList.add('is-visible'); // Ensure container itself is visible
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
     * @param {number} [loadDelay=100] - Base delay for staggered loading of comments.
     */
    function displayComments(comments, loadDelay = 100) { 
        commentsList = document.getElementById('comments-list'); 
        if (!commentsList) {
            console.error("[CommentsDisplay] Comments list container element (ID 'comments-list') not found. Cannot display comments.");
            return;
        }

        commentsList.innerHTML = ''; // Clear existing comments

        if (!comments || comments.length === 0) {
            const noCommentsMessage = document.createElement('p');
            // 'is-visible' ensures CSS animation trigger. CSS 'visibility:hidden' as default.
            noCommentsMessage.classList.add('no-comments-message'); // Now relies on is-visible from script.js
            noCommentsMessage.textContent = "还没有留言呢，成为第一个留下足迹的人吧！";
            commentsList.appendChild(noCommentsMessage);
            console.log("[CommentsDisplay] No comments to display. Showing placeholder text.");
            commentsList.closest('.comments-list-container')?.classList.add('is-visible'); // Ensure container itself is visible
            
            // Explicitly force visibility of the message via JS if `is-visible` doesn't catch it quickly enough
            setTimeout(() => noCommentsMessage.classList.add('is-visible'), 10); // Small immediate delay.
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
            // Apply data-delay for staggered animation potential visually, this is mostly for the JS animator.
            commentCard.dataset.delay = String(index * 80); 

            // Robust date formatting
            const date = new Date(comment.timestamp);
            const formattedDate = date.toLocaleString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

            // CRITICAL FIX: HTML escape author and text to prevent XSS vulnerabilities from user input
            const escapedAuthor = comment.author ? comment.author.replace(/</g, "&lt;").replace(/>/g, "&gt;") : '匿名访客';
            const escapedText = comment.text ? comment.text.replace(/</g, "&lt;").replace(/>/g, "&gt;") : '';

            // Construct innerHTML with escaped values
            commentCard.innerHTML = `
                <div class="comment-info">
                   <p class="comment-text">${escapedText}</p>
                   <div class="comment-meta">留言于 <strong>${formattedDate}</strong> by <strong>${escapedAuthor}</strong></div>
               </div>
            `;
            commentsList.appendChild(commentCard);
            // This small delayed application of 'is-visible' ensures individual card fade in,
            // relying on its own CSS rules for `opacity:0` coupled with its `is-visible` for `opacity:1`.
            setTimeout(() => { commentCard.classList.add('is-visible'); }, loadDelay + (index * 80)); 
            
            // Also explicitly ensure children are visible if they have their own opaque defaults
            setTimeout(() => {
                commentCard.querySelector('.comment-text')?.classList.add('is-visible');
                commentCard.querySelector('.comment-meta')?.classList.add('is-visible');
            }, loadDelay + (index * 80) + 50); // Slightly more delay for internal text
        });
        console.log(`[CommentsDisplay] Displayed ${sortedComments.length} comments.`);

        const parentContainer = commentsList.closest('.comments-list-container');
        if(parentContainer && !parentContainer.classList.contains('is-visible')) {
            // Give a final nudge to ensure the whole container is visible if it still hasn't caught the `is-visible` from external scripts
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
            // After successful post, reload and re-display comments list visually immediately
            await loadAndDisplayComments(); 
            // Also explicitly show form hint related elements (if any)
            document.querySelector('.comment-form-container .form-hint')?.classList.add('is-visible');
        } 
    }

    /**
     * Initializer for comments page. This function encapsulates all comments-related setup.
     * 使用 function 声明，确保完全提升。
     */
    function setupCommentsPage() { 
        commentsList = document.getElementById('comments-list'); // Re-get for this function's scope
        
        if (commentForm) {
            commentForm.addEventListener('submit', commentFormSubmitHandler);
            console.log("[CommentsForm] Comment form submission listener attached.");
            // Ensure the form itselft is visible upon setup too
            commentForm.classList.add('is-visible');
        } else {
            console.warn("[CommentsForm] Comment Form element (ID 'comment-form') not found. Skipping submission setup. (Expected on non-comments.html)");
        }

        if (commentsList) {
            // Load and display comments immediately when the page is ready for rendering comments
            loadAndDisplayComments(); 
            commentsList.classList.add('is-visible'); // Make the list visible
        } else {
            console.warn("[Comments] Comments list element (ID 'comments-list') not found. Skipping comment display. (Expected on non-comments.html)");
        }
        
        // Ensure its parent `comment-section` is also explicitly visible.
        document.querySelector('.comment-section')?.classList.add('is-visible');
        setTimeout(() => document.querySelector('.comment-section .page-title')?.classList.add('is-visible'));
        
        console.log("✅ [Comments Module] Comments page setup completed.");
    }
    
    // Defer the execution of comments page setup until the very end of DOMContentLoaded processing,
    // to ensure script.js (core fixes) and critical DOM elements are fully ready.
    // Ensure it only runs if we are actually on a comments-related page (has form or list container).
    // Using a greater timeout to ensure `script.js` visibility fixes run first on all general elements.
    if (window.location.pathname.includes('comments.html') || document.getElementById('comment-form') || document.getElementById('comments-list')) {
        console.log("[Comments Module] Attempting to set up Comments page with a slight delay...");
        setTimeout(setupCommentsPage, 300); // Increased delay
    }

    console.log("✅ [Comments Module] comments.js FINISHED execution.");
});
