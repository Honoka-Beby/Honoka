// js/comments.js
document.addEventListener('DOMContentLoaded', () => {
    console.log("💬 comments.js STARTING execution...");

    const commentForm = document.getElementById('comment-form');
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

            // Console log the raw response status and text for debugging
            console.log(`[CommentsAPI] getComments response status: ${response.status}`);
            // if (!response.ok) { // Catches HTTP errors (4xx, 5xx)
            //     const errorBody = await response.json().catch(() => ({ message: 'Cannot parse error body' }));
            //     throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorBody.message || 'Server did not respond with success.'}`);
            // }

            // CRITIAL FIX: If response is 500 (our function handled error), or not ok for any reason,
            // we try to parse it, but also explicitly log what Netlify sent in the Function logs if possible.
             if(!response.ok) {
                 const errorText = await response.text();
                 console.error(`[CommentsAPI] getComments HTTP NOT OK (${response.status}): ${response.statusText}`, errorText);
                 if(response.headers.get('content-type')?.includes('application/json')){
                     const errorJson = JSON.parse(errorText); // Try parsing if JSON
                     throw new Error(`Backend error (${response.status}): ${errorJson.message || errorJson.error || 'Unknown error.'}`);
                 } else { // Fallback if plain text
                     throw new Error(`Backend error (${response.status}): ${errorText || response.statusText}.`);
                 }
             }

            const comments = await response.json();
            console.log(`[CommentsAPI] Successfully fetched ${comments.length} comments.`);
            return comments;
        } catch (error) {
            console.error('[CommentsAPI] Failed to fetch comments. This usually means a backend configuration issue (e.g. Firebase key) or Netlify Function deployment problem. Details:', error);
            return []; // Always return an array to prevent crashes even on severe backend errors.
        }
    };

    /**
     * Posts a new comment to the backend Netlify Function.
     */
    const postNewComment = async (author, text) => {
        console.log("[CommentsAPI] Attempting to post new comment to", backendBaseUrl + 'createComment');
        try {
            const response = await fetch(`${backendBaseUrl}createComment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ author, text }), 
            });

            // Console log the raw response status and text for debugging
            console.log(`[CommentsAPI] createComment response status: ${response.status}`);
            // CRITIAL FIX: Same robust error handling as in getAllComments
             if (!response.ok) { 
                 const errorText = await response.text();
                 console.error(`[CommentsAPI] createComment HTTP NOT OK (${response.status}): ${response.statusText}`, errorText);
                 if(response.headers.get('content-type')?.includes('application/json')){
                     const errorJson = JSON.parse(errorText); // Try parsing if JSON
                     throw new Error(`Backend error (${response.status}): ${errorJson.message || errorJson.error || 'Unknown error.'}`);
                 } else { // Fallback if plain text
                     throw new Error(`Backend error (${response.status}): ${errorText || response.statusText}.`);
                 }
             }

            const result = await response.json();
            console.log('[CommentsAPI] Comment posted successfully:', result); 
            alert('留言提交成功，感谢您的来访！'); 
            return true; 
        } catch (error) {
            console.error('[CommentsAPI] Failed to post comment from FRONTEND fetch. Details:', error);
            alert(`提交留言失败: ${error.message}. 请检查您的输入或稍后再试！`); 
            return false;
        }
    };

    /**
     * Dynamically renders and displays a list of comments in the DOM.
     */
    const displayComments = (comments) => {
        commentsList = document.getElementById('comments-list'); 
        if (!commentsList) {
            console.error("[CommentsDisplay] Comments list container element not found. This should not happen if on `comments.html`.", document.getElementById('comments-list'));
            return;
        }

        commentsList.innerHTML = ''; 

        if (!comments || comments.length === 0) {
            const noCommentsMessage = document.createElement('p');
            noCommentsMessage.classList.add('no-comments-message');
            noCommentsMessage.textContent = "还没有留言呢，成为第一个留下足迹的人吧！";
            commentsList.appendChild(noCommentsMessage); // Append message
            setTimeout(() => noCommentsMessage.classList.add('is-visible'), 50); // Fade in message
            console.log("[CommentsDisplay] No comments to display. Showing placeholder.");
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

            const date = comment.timestamp ? new Date(comment.timestamp) : new Date(); 
            const formattedDate = date.toLocaleString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

            commentCard.innerHTML = `
                <div class="comment-info">
                   <p class="comment-text">${comment.text}</p>
                   <div class="comment-meta">留言于 <strong>${formattedDate}</strong> by <strong>${comment.author}</strong></div>
               </div>
            `;
            commentCard.style.animationDelay = `${index * 80}ms`; 
            commentsList.appendChild(commentCard);
            setTimeout(() => { commentCard.classList.add('is-visible'); }, index * 80 + 100); 
        });
        console.log(`[CommentsDisplay] Displayed ${sortedComments.length} comments.`);

        // Ensure parent container (commentsList's direct parent, the .comments-list-container) has is-visible
        const parentContainer = commentsList.closest('.comments-list-container');
        if(parentContainer && !parentContainer.classList.contains('is-visible')) {
            parentContainer.classList.add('is-visible');
            console.log("[CommentsDisplay] Main comments container set to visible for animation.");
        }
    };

    /**
     * Handles the form submission for new comments.
     */
    const commentFormSubmitHandler = async (event) => {
        event.preventDefault(); 

        const authorInput = document.getElementById('comment-author');
        const commentTextInput = document.getElementById('comment-text');

        const author = authorInput.value.trim(); 
        const text = commentTextInput.value.trim();

        if (!author) { alert('名字不能为空哦！'); return; }
        if (author.length > 50) { alert('名字太长了，请控制在50个字符以内！'); return; }
        if (!text) { alert('留言内容不能为空哦！'); return; }
        if (text.length > 500) { alert('留言内容太长了，请控制在500个字符以内！'); return; }

        const success = await postNewComment(author, text);

        if (success) {
            authorInput.value = ''; 
            commentTextInput.value = ''; 
            await loadAndDisplayComments(); 
        } 
    };

    if (commentForm) {
        commentForm.addEventListener('submit', commentFormSubmitHandler);
        console.log("[CommentsForm] Comment form initialized with backend support.");
    } else {
        console.warn("[CommentsForm] Comment form element not found. Submission disabled (Expected if not on comments.html).");
    }

    const loadAndDisplayComments = async () => {
        console.log("[Comments] Initiating load and display of comments...");
        const comments = await getAllComments();
        displayComments(comments);
    };

    loadAndDisplayComments(); 

    console.log("✅ comments.js FINISHED execution.");
});
