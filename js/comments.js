// js/comments.js
document.addEventListener('DOMContentLoaded', () => {
    console.log("💬 [Comments Module] comments.js STARTING execution...");

    const commentForm = document.getElementById('comment-form');
    let commentsList = document.getElementById('comments-list'); 

    // ★★★ 请再次确认这里的URL与你部署的Netlify站点域名一致 ★★★
    const backendBaseUrl = 'https://honoka1.netlify.app/.netlify/functions/'; 

    /**
     * Helper function to handle fetch API errors and generate user-friendly messages.
     * @param {Response} response - The raw Fetch API response object.
     * @param {string} context - A string describing the API call (e.g., 'getComments', 'createComment').
     * @returns {Promise<string>} A user-friendly error message.
     */
    const handleFetchError = async (response, context) => {
        const errorDetail = await response.text(); // Get raw error response
        console.error(`[CommentsAPI] ${context} Error (HTTP ${response.status}): ${response.statusText}`, errorDetail);
        
        if (response.headers.get('content-type')?.includes('application/json')) {
            try {
                const errorJson = JSON.parse(errorDetail);
                // Return specific backend message if available
                return `服务器错误 (${response.status}): ${errorJson.message || errorJson.error || '后端返回未知JSON错误。'}`;
            } catch (jsonErr) {
                // If it claims to be JSON but fails to parse
                return `服务器错误 (${response.status}): 无法解析后端JSON，原始响应: "${errorDetail.substring(0, 100)}..."`;
            }
        } else {
            // Fallback for non-JSON or generic errors
            return `请求失败 (${response.status}): ${errorDetail || '网络或服务器错误，无法连接到留言板服务。'}`;
        }
    };

    /**
     * Fetches all comments from the backend Netlify Function.
     * @returns {Promise<Array<Object>>} An array of comment objects, or empty array on error.
     */
    const getAllComments = async () => {
        console.log("[CommentsAPI] Attempting to fetch comments from", backendBaseUrl + 'getComments');
        try {
            const response = await fetch(`${backendBaseUrl}getComments`, {
                method: 'GET',
                // Explicitly ask for JSON, though Netlify Functions typically default.
                headers: { 'Accept': 'application/json' } 
            });

            if(!response.ok) { // Check for HTTP status outside of 200 series (e.g., 404, 500)
                const errorMessage = await handleFetchError(response, 'getComments');
                throw new Error(errorMessage);
            }

            const comments = await response.json(); // Safely parse the successful JSON response
            console.log(`[CommentsAPI] Successfully fetched ${comments.length} comments.`);
            return comments;
        } catch (error) {
            console.error('[CommentsAPI] Failed to fetch comments. (Possibly Firebase backend config or Netlify Function deployment issue.):', error);
            // Display an error message directly on the page if list container exists
            if(commentsList) {
                commentsList.innerHTML = `<p class="no-comments-message is-visible">呀，加载留言列表失败了... (${error.message})</p>`;
            }
            return []; // Always return an empty array on error to prevent further script issues
        }
    };

    /**
     * Posts a new comment to the backend Netlify Function.
     * @param {string} author - The author's name.
     * @param {string} text - The comment text.
     * @returns {Promise<boolean>} True if successful, false otherwise.
     */
    const postNewComment = async (author, text) => {
        console.log("[CommentsAPI] Attempting to post new comment to", backendBaseUrl + 'createComment');
        const submitButton = commentForm.querySelector('button[type="submit"]');

        // ★★★ FIX: Temporarily disable button and provide feedback during submission ★★★
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = '提交中...'; // Inform user that action is pending
        }

        try {
            const response = await fetch(`${backendBaseUrl}createComment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ author, text }), 
            });

            if (!response.ok) { // Check for non-200 OK responses
                const errorMessage = await handleFetchError(response, 'createComment');
                throw new Error(errorMessage);
            }

            const result = await response.json(); // Parse successful JSON response
            console.log('[CommentsAPI] Comment posted successfully:', result); 
            alert('留言提交成功，感谢您的来访！'); 
            return true; 
        } catch (error) {
            console.error('[CommentsAPI] Failed to post comment from frontend:', error);
            alert(`提交留言失败: ${error.message}. 请检查您的输入或稍后再试！`); 
            return false;
        } finally {
            // ★★★ FIX: Re-enable button and restore original text regardless of outcome ★★★
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = '提交留言'; 
            }
        }
    };

    /**
     * Dynamically renders and displays a list of comments in the DOM.
     * @param {Array<Object>} comments - An array of comment objects.
     */
    const displayComments = (comments) => {
        // Ensure commentsList is the correct current element (important for dynamic updates)
        commentsList = document.getElementById('comments-list'); 
        if (!commentsList) {
            console.error("[CommentsDisplay] Comments list container element not found (ID 'comments-list'). Cannot display comments.");
            return;
        }

        commentsList.innerHTML = ''; // Clear existing comments

        if (!comments || comments.length === 0) {
            const noCommentsMessage = document.createElement('p');
            noCommentsMessage.classList.add('no-comments-message', 'is-visible'); // Directly add `is-visible` to show immediately
            noCommentsMessage.textContent = "还没有留言呢，成为第一个留下足迹的人吧！";
            commentsList.appendChild(noCommentsMessage);
            console.log("[CommentsDisplay] No comments to display. Showing placeholder text.");
            return;
        } 

        // Sort comments by timestamp (newest first)
        const sortedComments = [...comments].sort((a,b) => {
            const dateA = a.timestamp ? new Date(a.timestamp) : new Date(0); 
            const dateB = b.timestamp ? new Date(b.timestamp) : new Date(0);
            return dateB.getTime() - dateA.getTime(); 
        });

        sortedComments.forEach((comment, index) => {
            const commentCard = document.createElement('div');
            // Ensure the class names correctly activate initial CSS `opacity:0` and subsequent `transition`. Plus `is-visible`.
            commentCard.classList.add('post-card', 'comments-card', 'animate__slide-up'); 

            // Format timestamp for display
             const date = new Date(comment.timestamp); // Assuming timestamp is always valid per backend fix
            const formattedDate = date.toLocaleString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

            // ★★★ FIX: HTML escape author and text to prevent XSS vulnerabilities ★★★
            const escapedAuthor = comment.author ? comment.author.replace(/</g, "&lt;").replace(/>/g, "&gt;") : '匿名访客';
            const escapedText = comment.text ? comment.text.replace(/</g, "&lt;").replace(/>/g, "&gt;") : '';

            commentCard.innerHTML = `
                <div class="comment-info">
                   <p class="comment-text">${escapedText}</p>
                   <div class="comment-meta">留言于 <strong>${formattedDate}</strong> by <strong>${escapedAuthor}</strong></div>
               </div>
            `;
            // Stagger animation with a small delay for each card
            // We rely on the initial applyImmediateVisibilityFix in script.js to make sure the elements are found (in viewport or not)
            setTimeout(() => { commentCard.classList.add('is-visible'); }, index * 80 + 100); 
            commentsList.appendChild(commentCard);
        });
        console.log(`[CommentsDisplay] Displayed ${sortedComments.length} comments.`);

        // Ensure the main container holding the comments list also gets its animation triggered/is visible.
        const parentContainer = commentsList.closest('.comments-list-container');
        if(parentContainer && !parentContainer.classList.contains('is-visible')) {
            parentContainer.classList.add('is-visible'); // Force parent visible too
            console.log("[CommentsDisplay] Main comments list container set to visible for animation.");
        }
    };

    /**
     * Main handler for comment form submission.
     * @param {Event} event - The form submission event.
     */
    const commentFormSubmitHandler = async (event) => {
        event.preventDefault(); // Prevent default browser form submission

        const authorInput = document.getElementById('comment-author');
        const commentTextInput = document.getElementById('comment-text');

        const author = authorInput?.value.trim(); 
        const text = commentTextInput?.value.trim();

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
            // Reload and re-display all comments, including the new one
            await loadAndDisplayComments(); 
        } 
    };

    /**
     * Initializes the comments board functionality.
     * This function will be called by `script.js` directly or when `comments.html` is visited.
     */
    const initCommentsPage = async () => {
        if(commentForm) {
            commentForm.addEventListener('submit', commentFormSubmitHandler);
            console.log("[CommentsForm] Comment form submission listener attached.");
        } else {
             console.warn("[CommentsForm] Comment Form element (ID 'comment-form') not found. Skipping submission setup. (Expected on non-comments.html pages)");
        }
        
        if (commentsList) { // Only load/display comments if the comments list container exists
            await loadAndDisplayComments(); // Load comments initially on page
        } else {
             console.warn("[Comments] Comments list element (ID 'comments-list') not found. Skipping comment display. (Expected on non-comments.html pages)");
        }
    };
    
    // Call the initializer. This will be triggered once on comments.html via DOMContentLoaded
    // or by script.js when all global features initialize.
    initCommentsPage();

    console.log("✅ [Comments Module] comments.js FINISHED execution.");
});
