// js/comments.js
document.addEventListener('DOMContentLoaded', () => {
    console.log("💬 comments.js STARTING execution...");

    const commentForm = document.getElementById('comment-form');
    // Ensure commentsList is always a fresh reference from the DOM if it's dynamic.
    let commentsList = document.getElementById('comments-list'); 

    // !!! IMPORTANT: Replace with YOUR ACTUAL NETLIFY SITE'S DOMAIN !!!
    // This URL must match the frontend domain in netlify.toml Access-Control-Allow-Origin
    const backendBaseUrl = 'https://honoka1.netlify.app/.netlify/functions/'; // <-- Honoika, Verify this is YOUR correct domain here too!

    /**
     * Fetches all comments from the backend Netlify Function.
     * Robust error handling prevents UI breakdown from network or API issues.
     * @returns {Array<Object>} An array of comment objects (can be empty), never returns null.
     */
    const getAllComments = async () => {
        console.log("[CommentsAPI] Attempting to fetch comments...");
        try {
            const response = await fetch(`${backendBaseUrl}getComments`, {
                method: 'GET',
                headers: { 'Accept': 'application/json' } 
            });

            if (!response.ok) { // Catches HTTP errors (4xx, 5xx)
                const errorBody = await response.json().catch(() => ({ message: 'Unknown parsing error' }));
                throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorBody.message || 'Server did not respond with success.'}`);
            }
            const comments = await response.json();
            console.log(`[CommentsAPI] Successfully fetched ${comments.length} comments.`);
            return comments;
        } catch (error) {
            console.error('[CommentsAPI] Failed to fetch comments: Reasons could be CORS, Network, or Function error ->', error);
            // Return empty array on error to safely display "no comments" rather than breaking UI
            return []; 
        }
    };

    /**
     * Posts a new comment to the backend Netlify Function.
     * Includes client-side basic validation and user feedback.
     * @param {string} author - The name of the commenter.
     * @param {string} text - The comment content.
     * @returns {boolean} True if post successful, false on error/validation failure.
     */
    const postNewComment = async (author, text) => {
        console.log("[CommentsAPI] Attempting to post new comment...");
        try {
            const response = await fetch(`${backendBaseUrl}createComment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ author, text }), 
            });

            if (!response.ok) { // Check HTTP response, including successful processing but returned error code.
                const errorData = await response.json().catch(() => ({ message: 'Unknown parsing error' }));
                throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorData.message || 'Server rejected the comment.'}`);
            }
            const result = await response.json();
            console.log('[CommentsAPI] Comment posted successfully:', result); 
            alert('留言提交成功，感谢您的来访！'); // Provide immediate user feedback.
            return true; 
        } catch (error) {
            console.error('[CommentsAPI] Failed to post comment to backend:', error);
            alert(`提交留言失败: ${error.message}. 请检查您的输入或稍后再试！`); 
            return false;
        }
    };

    /**
     * Dynamically renders and displays a list of comments in the DOM.
     * Includes sorting, formatting, and handling of the "no comments" message.
     * @param {Array<Object>} comments - An array of comment objects to render.
     */
    const displayComments = (comments) => {
        // Always get a fresh reference to the comments list to handle dynamic DOM changes robustly.
        commentsList = document.getElementById('comments-list'); 
        if (!commentsList) {
            console.error("[CommentsDisplay] Comments list container element not found. Cannot display comments.", document.getElementById('comments-list'));
            return;
        }

        commentsList.innerHTML = ''; // Clear previous contents before re-rendering.

        if (!comments || comments.length === 0) {
            // Apply both specific no-comments-message class and global is-visible for entrance animation.
            const noCommentsMessageHtml = `<p class="no-comments-message is-visible">还没有留言呢，成为第一个留下足迹的人吧！</p>`;
            commentsList.innerHTML = noCommentsMessageHtml;
            commentsList.querySelector('.no-comments-message').classList.add('is-visible'); // Force animation
            console.log("[CommentsDisplay] No comments to display. Showing placeholder.");
            return;
        } 

        // Sort comments by timestamp (newest first). This is also done on backend, but client-side sort adds robustness.
        const sortedComments = [...comments].sort((a,b) => {
            const dateA = a.timestamp ? new Date(a.timestamp) : new Date(0); 
            const dateB = b.timestamp ? new Date(b.timestamp) : new Date(0);
            return dateB.getTime() - dateA.getTime(); 
        });

        // Loop through sorted comments to create and append new comment cards.
        sortedComments.forEach((comment, index) => {
            const commentCard = document.createElement('div');
            commentCard.classList.add('post-card', 'comment-card', 'animate__slide-up'); // Re-use general card and animation styles.

            // Safely format timestamp.
            const date = comment.timestamp ? new Date(comment.timestamp) : new Date(); 
            const formattedDate = date.toLocaleString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

            commentCard.innerHTML = `
                <div class="comment-info">
                   <p class="comment-text">${comment.text}</p>
                   <div class="comment-meta">留言于 <strong>${formattedDate}</strong> by <strong>${comment.author}</strong></div>
               </div>
            `;
            // Apply staggered animation delay (CSS `animation-delay` does this directly)
            commentCard.style.animationDelay = `${index * 80}ms`; // Customize or remove this as needed from your 'animations.css'
            commentsList.appendChild(commentCard);
            // Manually trigger the entrance animation after slight delay.
            setTimeout(() => { commentCard.classList.add('is-visible'); }, index * 80 + 100); 
        });
        console.log(`[CommentsDisplay] Displayed ${sortedComments.length} comments.`);

        // Ensure parent container (commentsList) has is-visible to allow its children to animate/be seen
        if (commentsList.parentNode && !commentsList.parentNode.classList.contains('is-visible')) {
            // Try to find the nearest animateable parent (e.g. comments-list-container)
            const parentContainer = commentsList.closest('.comments-list-container');
             if(parentContainer) {
                 parentContainer.classList.add('is-visible');
                 console.log("[CommentsDisplay] Main comments container set to visible.");
             }
         }
    };

    /**
     * Handles the form submission for new comments, including client-side validation
     * and re-loading comments on successful post.
     */
    const commentFormSubmitHandler = async (event) => {
        event.preventDefault(); 

        const authorInput = document.getElementById('comment-author');
        const commentTextInput = document.getElementById('comment-text');

        const author = authorInput.value.trim(); 
        const text = commentTextInput.value.trim();

        // Basic client-side validation. Server-side validation is still critical.
        if (!author) { alert('名字不能为空哦！'); return; }
        if (author.length > 50) { alert('名字太长了，请控制在50个字符以内！'); return; }
        if (!text) { alert('留言内容不能为空哦！'); return; }
        if (text.length > 500) { alert('留言内容太长了，请控制在500个字符以内！'); return; }

        const success = await postNewComment(author, text);

        if (success) {
            authorInput.value = ''; 
            commentTextInput.value = ''; 
            await loadAndDisplayComments(); // Refresh comment list
        } 
    };

    // Attach form submission listener if form exists.
    if (commentForm) {
        commentForm.addEventListener('submit', commentFormSubmitHandler);
        console.log("[CommentsForm] Comment form initialized with backend support.");
    } else {
        console.warn("[CommentsForm] Comment form element not found. Submission disabled. (Expected if not on comments.html).");
    }

    /**
     * Orchestrates the initial loading and display of comments.
     */
    const loadAndDisplayComments = async () => {
        console.log("[Comments] Initiating load and display of comments...");
        const comments = await getAllComments(); // Fetches comments. Will be an array (even if empty).
        displayComments(comments); // Renders comments.
    };

    loadAndDisplayComments(); // Call this function when DOM is ready.

    console.log("✅ comments.js FINISHED execution.");
});
