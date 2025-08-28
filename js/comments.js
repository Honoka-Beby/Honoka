// js/comments.js
document.addEventListener('DOMContentLoaded', () => {
    // Debugging: Log comments.js start
    console.log("💬 comments.js STARTING execution...");

    const commentForm = document.getElementById('comment-form');
    let commentsList = document.getElementById('comments-list'); // Use let to allow re-assignment if structure changes dynamically

    // !!! IMPORTANT: Replace this with YOUR ACTUAL NETLIFY SITE'S DOMAIN !!!
    // This URL must match the frontend domain in netlify.toml Access-Control-Allow-Origin
    // Example: 'https://your-netlify-site-name.netlify.app/.netlify/functions/'
    const backendBaseUrl = 'https://honoka1.netlify.app/.netlify/functions/'; // <-- Honoka, Verify this is YOUR correct domain here too!

    /**
     * Fetches all comments from the backend Netlify Function.
     * Includes error handling for network or API issues.
     * @returns {Array<Object>|null} An array of comment objects or null on failure.
     */
    const getAllComments = async () => {
        console.log("[CommentsAPI] Attempting to fetch comments...");
        try {
            const response = await fetch(`${backendBaseUrl}getComments`, {
                method: 'GET',
                // Explicitly set headers accepted based on server rules (optional but good practice)
                headers: { 'Accept': 'application/json' } 
            });

            if (!response.ok) { // Check for HTTP errors (e.g., 404, 500)
                const errorBody = await response.json().catch(() => ({ message: 'Unknown error' }));
                throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorBody.message || 'Server did not respond with success.'}`);
            }
            const comments = await response.json();
            console.log(`[CommentsAPI] Successfully fetched ${comments.length} comments.`);
            return comments;
        } catch (error) {
            console.error('[CommentsAPI] Failed to fetch comments from backend:', error);
            // Even on error, return an empty array to prevent breaking display flow
            return []; 
        }
    };

    /**
     * Posts a new comment to the backend Netlify Function.
     * Requires author and text, performs validation, and notifies the user of success/failure.
     * @param {string} author - The name of the commenter.
     * @param {string} text - The comment content.
     * @returns {boolean} True if comment was posted successfully, false otherwise.
     */
    const postNewComment = async (author, text) => {
        console.log("[CommentsAPI] Attempting to post new comment...");
        try {
            const response = await fetch(`${backendBaseUrl}createComment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // 'Access-Control-Allow-Origin' is a CORS response header, not request.
                    // No need to set the browser typically adds Origin automatically.
                },
                body: JSON.stringify({ author, text }), // Send data as JSON body
            });

            if (!response.ok) { // If an HTTP error occurs (e.g., validation failure from function, 400 Bad Request)
                const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
                throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorData.message || 'Server rejected the comment.'}`);
            }
            const result = await response.json();
            console.log('[CommentsAPI] Comment posted successfully:', result); // Log success message
            return true; // Indicate successful post
        } catch (error) {
            console.error('[CommentsAPI] Failed to post comment to backend:', error);
            alert(`提交留言失败: ${error.message}. 请检查您的输入或稍后再试！`); // User-friendly alert
            return false; // Indicate failure
        }
    };

    /**
     * Dynamically displays a list of comments in the DOM.
     * Handles presence of a "no comments" message and formats timestamps.
     * @param {Array<Object>} comments - An array of comment objects to display.
     */
    const displayComments = (comments) => {
        // If commentsList is dynamically re-created, ensure we get reference again
        commentsList = document.getElementById('comments-list') || commentsList; 
        if (!commentsList) {
            console.error("[CommentsDisplay] Comments list container element not found. Cannot display comments.");
            return;
        }

        commentsList.innerHTML = ''; // Clear previous comments to re-render

        // Show a placeholder message if no comments are available
        if (!comments || comments.length === 0) {
            commentsList.innerHTML = `<p class="no-comments-message">还没有留言呢，成为第一个留下足迹的人吧！</p>`;
             console.log("[CommentsDisplay] No comments to display.");
            return;
        } 

        // Sort comments by timestamp when displaying, newest first (ensure consistent display regardless of fetch order)
        // This is a client-side sort, should ideally occur on backend or with backend sort
        // However, `getAllComments` now uses orderBy('timestamp', 'desc'), so this redundant sort is only for robustness.
        const sortedComments = [...comments].sort((a,b) => {
            const dateA = a.timestamp ? new Date(a.timestamp) : new Date(0); // Use epoch for null/invalid timestamps
            const dateB = b.timestamp ? new Date(b.timestamp) : new Date(0);
            return dateB.getTime() - dateA.getTime(); // Newest first
        });


        // Iterate through sorted comments and create DOM elements
        sortedComments.forEach(comment => {
            const commentCard = document.createElement('div');
            commentCard.classList.add('post-card'); // Use .post-card for consistent card styling
            commentCard.classList.add('comment-card'); // Add specific class too

            // Safely parse timestamp to a readable format
            const date = comment.timestamp ? new Date(comment.timestamp) : new Date(); // Fallback if timestamp is missing/invalid
            const formattedDate = date.toLocaleString('zh-CN', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit' 
            });

            // Populate comment card with data
            // Sanitize input if accepting user HTML, but for this blog simple text/author is OK
            commentCard.innerHTML = `
                <div class="comment-info">
                   <p class="comment-text">${comment.text}</p>
                   <div class="comment-meta">留言于 <strong>${formattedDate}</strong> by <strong>${comment.author}</strong></div>
               </div>
            `;
            // Add custom animation classes if appropriate for comments via JS
            commentCard.classList.add('animate__slide-up');
            // Adding a small progressive delay for animation if desire (disabled for general comment load often, can be re-enabled)
            // commentCard.dataset.delay = index * 50; 
            commentsList.appendChild(commentCard);
            // Manually trigger animation if desired, otherwise let A.O. handle
            setTimeout(() => { commentCard.classList.add('is-visible'); }, 50); // Small initial reveal
        });
        console.log(`[CommentsDisplay] Displayed ${sortedComments.length} comments.`);

        // After displaying, ensure animations apply correctly to newly added items
        // (This might be handled by existing setupScrollAnimations or needs specific trigger)
        // If animated elements added after initial setup, need to re-observe if using IntersectionObserver for new content
        if (typeof window.setupScrollAnimations === 'function') {
            window.setupScrollAnimations(true); // Re-run observer for new content if available
        }
    };

    // Handle form submission for new comments
    const commentFormSubmitHandler = async (event) => {
        event.preventDefault(); // Prevent default browser form submission

        const authorInput = document.getElementById('comment-author');
        const commentTextInput = document.getElementById('comment-text');

        const author = authorInput.value.trim(); // Trim whitespace
        const text = commentTextInput.value.trim();

        // Client-side basic validation
        if (!author) { alert('名字不能为空哦！'); return; }
        if (author.length > 50) { alert('名字太长了，请控制在50个字符以内！'); return; }
        if (!text) { alert('留言内容不能为空哦！'); return; }
        if (text.length > 500) { alert('留言内容太长了，请控制在500个字符以内！'); return; }

        // Attempt to post the new comment to the backend
        const success = await postNewComment(author, text);

        if (success) {
            authorInput.value = ''; // Clear input fields on success
            commentTextInput.value = ''; 
            await loadAndDisplayComments(); // Reload and display all comments, including the new one
            alert('留言提交成功，感谢您的来访！');
        } else {
            // Error alert already handled by postNewComment function
        }
    };

    // Add submit listener if form element exists
    if (commentForm) {
        commentForm.addEventListener('submit', commentFormSubmitHandler);
        console.log("[CommentsForm] Comment form initialized.");
    } else {
        console.warn("[CommentsForm] Comment form element not found. Submission disabled.");
    }

    // Initial load and display of comments when the page structure is ready
    const loadAndDisplayComments = async () => {
        console.log("[Comments] Loading comments for initial display...");
        const comments = await getAllComments();
        // `getAllComments` now always returns an array, possibly empty, so no null check needed.
        displayComments(comments);
    };

    loadAndDisplayComments(); // Execute on page load

    // Debugging: Log comments.js finish
    console.log("✅ comments.js FINISHED execution.");
});
