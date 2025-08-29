// js/comments.js
document.addEventListener('DOMContentLoaded', () => {
    console.log("💬 comments.js STARTING execution...");

    const commentForm = document.getElementById('comment-form');
    // Ensure commentsList is retrieved again after potential DOM changes in displayComments
    let commentsList = document.getElementById('comments-list'); 

    // !!! IMPORTANT: Replace with YOUR ACTUAL NETLIFY SITE'S DOMAIN !!!
    const backendBaseUrl = 'https://honoka1.netlify.app/.netlify/functions/'; // Honoka, Verify this is YOUR correct domain here!

    /**
     * Fetches all comments from the backend Netlify Function.
     */
    const getAllComments = async () => {
        console.log("[CommentsAPI] Attempting to fetch comments from", backendBaseUrl + 'getComments');
        try {
            const response = await fetch(`${backendBaseUrl}getComments`, {
                method: 'GET',
                headers: { 'Accept': 'application/json' } 
            });

            console.log(`[CommentsAPI] getComments raw response status: ${response.status}`);
             if(!response.ok) { // Check for non-200 OK responses (e.g. 4xx, 5xx)
                 const errorText = await response.text();
                 console.error(`[CommentsAPI] getComments HTTP NOT OK (${response.status || 'Unknown Status'}): ${response.statusText || 'Unknown Status Text'}`, errorText);
                 if(response.headers.get('content-type')?.includes('application/json')){
                     try {
                         const errorJson = JSON.parse(errorText); // Attempt to parse error as JSON
                         throw new Error(`Backend error (${response.status}): ${errorJson.message || errorJson.error || 'Unknown error from JSON response.'}`);
                     } catch (parseError) {
                         // If header indicates JSON, but parsing fails
                         throw new Error(`Backend error (${response.status}): Failed to parse JSON error response. Raw text: "${errorText.substring(0, 100)}..."`);
                     }
                 } else { // Fallback if plain text or no content-type
                     throw new Error(`Backend error (${response.status}): ${errorText || response.statusText || 'No detailed error message.'}.`);
                 }
             }

            const comments = await response.json(); // Parse successful JSON response
            console.log(`[CommentsAPI] Successfully fetched ${comments.length} comments.`);
            return comments;
        } catch (error) {
            console.error('[CommentsAPI] Failed to fetch comments: Firebase backend config or Netlify Function deployment problem. Details:', error);
            // Return an empty array on error to prevent further issues downstream
            return []; 
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
        try {
            const response = await fetch(`${backendBaseUrl}createComment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ author, text }), 
            });

            console.log(`[CommentsAPI] createComment raw response status: ${response.status}`);
             if (!response.ok) { 
                 const errorText = await response.text();
                 console.error(`[CommentsAPI] createComment HTTP NOT OK (${response.status || 'Unknown Status'}): ${response.statusText || 'Unknown Status Text'}`, errorText);
                 if(response.headers.get('content-type')?.includes('application/json')){
                     try {
                         const errorJson = JSON.parse(errorText);
                         throw new Error(`Backend error (${response.status}): ${errorJson.message || errorJson.error || 'Unknown error from JSON response.'}`);
                     } catch (parseError) {
                          throw new Error(`Backend error (${response.status}): Failed to parse JSON error response. Raw text: "${errorText.substring(0, 100)}..."`);
                     }
                 } else {
                     throw new Error(`Backend error (${response.status}): ${errorText || response.statusText || 'No detailed error message.'}.`);
                 }
             }

            const result = await response.json();
            console.log('[CommentsAPI] Comment posted successfully:', result); 
            alert('留言提交成功，感谢您的来访！'); // User-friendly alert
            return true; 
        } catch (error) {
            console.error('[CommentsAPI] Failed to post comment from frontend fetch. Details:', error);
            alert(`提交留言失败: ${error.message}. 请检查您的输入或稍后再试！`); 
            return false;
        }
    };

    /**
     * Dynamically renders and displays a list of comments in the DOM.
     * @param {Array<Object>} comments - An array of comment objects.
     */
    const displayComments = (comments) => {
        commentsList = document.getElementById('comments-list'); // Re-get element in case of re-rendering or dynamic content
        if (!commentsList) {
            console.error("[CommentsDisplay] Comments list container element not found (ID 'comments-list'). This should be present on comments.html.");
            return;
        }

        commentsList.innerHTML = ''; // Clear current comments

        if (!comments || comments.length === 0) {
            const noCommentsMessage = document.createElement('p');
            noCommentsMessage.classList.add('no-comments-message');
            noCommentsMessage.textContent = "还没有留言呢，成为第一个留下足迹的人吧！";
            commentsList.appendChild(noCommentsMessage); // Append the "no comments" message
            setTimeout(() => noCommentsMessage.classList.add('is-visible'), 50); // Trigger fade in
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
            commentCard.classList.add('post-card', 'comment-card', 'animate__slide-up'); 

            // Format timestamp for display
            const date = comment.timestamp ? new Date(comment.timestamp) : new Date(); 
            const formattedDate = date.toLocaleString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

            commentCard.innerHTML = `
                <div class="comment-info">
                   <p class="comment-text">${comment.text}</p>
                   <div class="comment-meta">留言于 <strong>${formattedDate}</strong> by <strong>${comment.author || '匿名访客'}</strong></div>
               </div>
            `;
            commentCard.style.animationDelay = `${index * 80}ms`; // Stagger animation start
            commentsList.appendChild(commentCard);
            // Explicitly add is-visible after a delay to ensure animation plays
            setTimeout(() => { commentCard.classList.add('is-visible'); }, index * 80 + 100); 
        });
        console.log(`[CommentsDisplay] Displayed ${sortedComments.length} comments.`);

        // Ensure the main container holding the comments list also gets its animation trigger, if applicable
        const parentContainer = commentsList.closest('.comments-list-container');
        if(parentContainer && !parentContainer.classList.contains('is-visible')) {
            setTimeout(() => parentContainer.classList.add('is-visible'), 100); 
            console.log("[CommentsDisplay] Main comments container set to visible for animation.");
        }
    };

    /**
     * Handles the form submission for new comments.
     * @param {Event} event - The form submission event.
     */
    const commentFormSubmitHandler = async (event) => {
        event.preventDefault(); // Prevent default form submission

        const authorInput = document.getElementById('comment-author');
        const commentTextInput = document.getElementById('comment-text');

        const author = authorInput.value.trim(); 
        const text = commentTextInput.value.trim();

        // Client-side validation for inputs
        if (!author) { alert('名字不能为空哦！'); authorInput.focus(); return; }
        if (author.length > 50) { alert('名字太长了，请控制在50个字符以内！'); authorInput.focus(); return; }
        if (!text) { alert('留言内容不能为空哦！'); commentTextInput.focus(); return; }
        if (text.length > 500) { alert('留言内容太长了，请控制在500个字符以内！'); commentTextInput.focus(); return; }

        const success = await postNewComment(author, text);

        if (success) {
            authorInput.value = ''; // Clear form fields on successful submission
            commentTextInput.value = ''; 
            await loadAndDisplayComments(); // Reload and re-display comments to show the new one
        } 
    };

    // Attach event listener if comment form exists on the page
    if (commentForm) {
        commentForm.addEventListener('submit', commentFormSubmitHandler);
        console.log("[CommentsForm] Comment form initialized with backend submission support.");
    } else {
        console.warn("[CommentsForm] Comment form element not found. Submission functionality disabled (expected if not on comments.html).");
    }

    /**
     * Helper function to load and display comments.
     */
    const loadAndDisplayComments = async () => {
        console.log("[Comments] Initiating load and display of comments...");
        const comments = await getAllComments();
        displayComments(comments);
    };

    // Always attempt to load and display comments if on comments.html
    if (commentsList) { 
        loadAndDisplayComments(); 
    }

    console.log("✅ comments.js FINISHED execution.");
});
