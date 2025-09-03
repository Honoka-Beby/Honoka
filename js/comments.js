// js/comments.js 
document.addEventListener('DOMContentLoaded', () => {
    console.log("💬 [Comments Module] comments.js STARTING execution...");

    const commentForm = document.getElementById('comment-form');
    let commentsList = document.getElementById('comments-list'); 

    const backendBaseUrl = 'https://honoka1.netlify.app/.netlify/functions/'; 

    /**
     * Helper function to handle fetch API errors and generate user-friendly messages.
     * 使用 function 声明，确保完全提升。
     */
    async function handleFetchError(response, context) {
        let errorDetail = '';
        try {
            errorDetail = await response.text(); 
        } catch (e) {
            console.warn(`[CommentsAPI] ${context} Could not read error response text:`, e);
        }
        
        console.error(`[CommentsAPI] ${context} Error (HTTP ${response.status}): ${response.statusText}`, errorDetail);
        
        if (response.headers.get('content-type')?.includes('application/json')) {
            try {
                const errorJson = JSON.parse(errorDetail); 
                return `服务器错误 (${response.status}): ${errorJson.message || errorJson.error || '后端返回未知JSON错误。'}`;
            } catch (jsonErr) {
                return `服务器错误 (${response.status}): 无法解析后端JSON，原始响应: "${errorDetail.substring(0, 100)}..."`;
            }
        } else {
            return `请求失败 (${response.status}): ${errorDetail || '网络或服务器错误，无法连接到留言板服务。'}`;
        }
    }

    /**
     * Fetches all comments from the backend Netlify Function.
     * 使用 function 声明，确保完全提升。
     */
    async function getAllComments() {
        console.log("[CommentsAPI] Attempting to fetch comments from", backendBaseUrl + 'getComments');
        try {
            const response = await fetch(`${backendBaseUrl}getComments`, {
                method: "GET",
                 headers: { "Accept": "application/json" } 
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
            }
            return []; // Always return empty array on error to prevent further issues downstream
        }
    }

    /**
     * Posts a new comment to the backend Netlify Function.
     * 使用 function 声明，确保完全提升。
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
     */
    function displayComments(comments) { 
        commentsList = document.getElementById('comments-list'); 
        if (!commentsList) {
            console.error("[CommentsDisplay] Comments list container element not found (ID 'comments-list'). Cannot display comments.");
            return;
        }

        commentsList.innerHTML = ''; 

        if (!comments || comments.length === 0) {
            const noCommentsMessage = document.createElement('p');
            noCommentsMessage.classList.add('no-comments-message', 'is-visible'); 
            noCommentsMessage.textContent = "还没有留言呢，成为第一个留下足迹的人吧！";
            commentsList.appendChild(noCommentsMessage);
            console.log("[CommentsDisplay] No comments to display. Showing placeholder text.");
            const parentContainer = commentsList.closest('.comments-list-container');
            parentContainer?.classList.add('is-visible'); 
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
            setTimeout(() => { commentCard.classList.add('is-visible'); }, index * 80 + 100); 
        });
        console.log(`[CommentsDisplay] Displayed ${sortedComments.length} comments.`);

        const parentContainer = commentsList.closest('.comments-list-container');
        if(parentContainer && !parentContainer.classList.contains('is-visible')) {
            parentContainer.classList.add('is-visible'); 
            console.log("[CommentsDisplay] Main comments list container set to visible for animation.");
        }
    } 

    /**
     * Helper function to load and display comments.
     * 使用 function 声明，确保完全提升。
     */
    async function loadAndDisplayComments() {
        console.log("-> [Comments] Initiating load and display of comments...");
        const comments = await getAllComments();
        displayComments(comments);
        console.log("<- [Comments] Finished load and display of comments.");
    }

    /**
     * Main handler for comment form submission.
     * 使用 function 声明，确保完全提升。
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
            // After successful post, reload and redisplay all comments.
            await loadAndDisplayComments(); 
        } 
    }

    /**
     * Initializer for comments page.
     * 使用 function 声明，确保完全提升。
     */
    function setupCommentsPage() { // Renamed from initCommentsPage for clarity, follows hoisting best practice.
        if (commentForm) {
            commentForm.addEventListener('submit', commentFormSubmitHandler);
            console.log("[CommentsForm] Comment form submission listener attached.");
        } else {
            console.warn("[CommentsForm] Comment Form element not found. Skipping submission setup on this page.");
        }

        if (commentsList) {
            loadAndDisplayComments(); // Initiates fetching and displaying comments right away
        } else {
            console.warn("[Comments] Comments list element not found. Skipping comment display on this page.");
        }
    }
    
    // Defer the execution of comments page setup until the very end, to ensure script.js (core fixes) complete first
    // This allows setupCommentsPage to rely on a fully functional DOM and other JS modules.
    // Also, wrap the call to setupCommentsPage to ensure it only runs once and if on comments.html
    if (window.location.pathname.includes('comments.html') || document.getElementById('comment-form') || document.getElementById('comments-list')) {
        setTimeout(setupCommentsPage, 100); 
    }

    console.log("✅ [Comments Module] comments.js FINISHED execution.");
});
