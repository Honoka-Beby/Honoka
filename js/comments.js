// js/comments.js
document.addEventListener('DOMContentLoaded', () => {
    console.log("💬 comments.js STARTING execution...");

    const commentForm = document.getElementById('comment-form');
    let commentsList = document.getElementById('comments-list'); 

    // !!! IMPORTANT: Replace with YOUR ACTUAL NETLIFY SITE'S DOMAIN !!!
    // This URL must match the frontend domain in netlify.toml Access-Control-Allow-Origin
    const backendBaseUrl = 'https://honoka1.netlify.app/.netlify/functions/'; // <-- Honoka, Verify this is YOUR correct domain here too!

    const getAllComments = async () => {
        console.log("[CommentsAPI] Attempting to fetch comments...");
        try {
            const response = await fetch(`${backendBaseUrl}getComments`, {
                method: 'GET',
                headers: { 'Accept': 'application/json' } 
            });

            if (!response.ok) { 
                const errorBody = await response.json().catch(() => ({ message: 'Unknown error' }));
                throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorBody.message || 'Server did not respond with success.'}`);
            }
            const comments = await response.json();
            console.log(`[CommentsAPI] Successfully fetched ${comments.length} comments.`);
            return comments;
        } catch (error) {
            console.error('[CommentsAPI] Failed to fetch comments from backend:', error);
            return []; 
        }
    };

    const postNewComment = async (author, text) => {
        console.log("[CommentsAPI] Attempting to post new comment...");
        try {
            const response = await fetch(`${backendBaseUrl}createComment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ author, text }),
            });

            if (!response.ok) { 
                const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
                throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorData.message || 'Server rejected the comment.'}`);
            }
            const result = await response.json();
            console.log('[CommentsAPI] Comment posted successfully:', result); 
            return true; 
        } catch (error) {
            console.error('[CommentsAPI] Failed to post comment to backend:', error);
            alert(`提交留言失败: ${error.message}. 请检查您的输入或稍后再试！`); 
            return false;
        }
    };

    const displayComments = (comments) => {
        commentsList = document.getElementById('comments-list') || commentsList; 
        if (!commentsList) {
            console.error("[CommentsDisplay] Comments list container element not found. Cannot display comments.");
            return;
        }

        commentsList.innerHTML = ''; 

        if (!comments || comments.length === 0) {
            commentsList.innerHTML = `<p class="no-comments-message">还没有留言呢，成为第一个留下足迹的人吧！</p>`;
             console.log("[CommentsDisplay] No comments to display.");
            return;
        } 

        const sortedComments = [...comments].sort((a,b) => {
            const dateA = a.timestamp ? new Date(a.timestamp) : new Date(0); 
            const dateB = b.timestamp ? new Date(b.timestamp) : new Date(0);
            return dateB.getTime() - dateA.getTime(); 
        });

        sortedComments.forEach((comment, index) => {
            const commentCard = document.createElement('div');
            // Using post-card for styling from global `posts-grid`
            commentCard.classList.add('post-card'); 
            commentCard.classList.add('comment-card');


            const date = comment.timestamp ? new Date(comment.timestamp) : new Date(); 
            const formattedDate = date.toLocaleString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

            commentCard.innerHTML = `
                <div class="comment-info">
                   <p class="comment-text">${comment.text}</p>
                   <div class="comment-meta">留言于 <strong>${formattedDate}</strong> by <strong>${comment.author}</strong></div>
               </div>
            `;
            commentCard.style.cssText = `animation-delay: ${index * 50}ms;`; // Apply sequential delay for comments
            commentsList.appendChild(commentCard);
            // After being added to DOM, manually trigger visibility for entrance animation
            setTimeout(() => { commentCard.classList.add('is-visible'); }, index * 50 + 100); 
        });
        console.log(`[CommentsDisplay] Displayed ${sortedComments.length} comments.`);
    };

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
            // alert('留言提交成功，感谢您的来访！'); // Already alerted by backend status, no need for redundant alert.
        } 
    };

    if (commentForm) {
        commentForm.addEventListener('submit', commentFormSubmitHandler);
        console.log("[CommentsForm] Comment form initialized with backend support.");
    } else {
        console.warn("[CommentsForm] Comment form element not found. Submission disabled. (This should only happen if not on comments.html).");
    }

    const loadAndDisplayComments = async () => {
        console.log("[Comments] Loading comments for initial display...");
        const comments = await getAllComments();
        displayComments(comments);
    };

    loadAndDisplayComments(); 

    console.log("✅ comments.js FINISHED execution.");
});
