// js/comments.js
document.addEventListener('DOMContentLoaded', () => {
    console.log("💬 comments.js STARTING execution...");

    const commentForm = document.getElementById('comment-form');
    const commentsList = document.getElementById('comments-list'); 

    // 确保这个URL是你部署后正确的Netlify站点URL
    const backendBaseUrl = 'https://honoka1.netlify.app/.netlify/functions/';

    const handleFetchError = async (response, context) => {
        const errorText = await response.text();
        console.error(`[CommentsAPI] ${context} Error: HTTP ${response.status}`, errorText);
        try {
            const errorJson = JSON.parse(errorText);
            return `服务器错误 (${response.status}): ${errorJson.message || '未知错误'}`;
        } catch (e) {
            return `请求失败 (${response.status})，无法连接到留言板服务。`;
        }
    };

    const getAllComments = async () => {
        console.log("[CommentsAPI] Attempting to fetch comments...");
        try {
            const response = await fetch(`${backendBaseUrl}getComments`);
            if (!response.ok) {
                const errorMessage = await handleFetchError(response, 'getComments');
                throw new Error(errorMessage);
            }
            const comments = await response.json();
            console.log(`[CommentsAPI] Successfully fetched ${comments.length} comments.`);
            return comments;
        } catch (error) {
            console.error('[CommentsAPI] Fetch comments failed:', error);
            if(commentsList) commentsList.innerHTML = `<p class="no-comments-message is-visible">呀，加载留言失败了... (${error.message})</p>`;
            return []; 
        }
    };

    const postNewComment = async (author, text) => {
        console.log("[CommentsAPI] Attempting to post new comment...");
    
        // ★★★ FIX: 增加了禁用按钮的交互，避免用户重复提交 ★★★
        const submitButton = commentForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = '提交中...';

        try {
            const response = await fetch(`${backendBaseUrl}createComment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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
            console.error('[CommentsAPI] Post comment failed:', error);
            alert(`提交留言失败: ${error.message}`); 
            return false;
        } finally {
            // ★★★ FIX: 无论成功失败，恢复按钮状态 ★★★
            submitButton.disabled = false;
            submitButton.textContent = '提交留言';
        }
    };

    const displayComments = (comments) => {
        if (!commentsList) return;
        commentsList.innerHTML = ''; 

        if (!comments || comments.length === 0) {
            commentsList.innerHTML = `<p class="no-comments-message is-visible">还没有留言呢，成为第一个留下足迹的人吧！</p>`;
            return;
        } 

        const sortedComments = [...comments].sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));

        sortedComments.forEach((comment, index) => {
            const commentCard = document.createElement('div');
            // ★★★ FIX: 确保动画类和is-visible能正确配合 ★★★
            commentCard.className = 'post-card comment-card animate__slide-up';
            const formattedDate = new Date(comment.timestamp).toLocaleString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

            commentCard.innerHTML = `
                <div class="comment-info">
                   <p class="comment-text">${comment.text.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
                   <div class="comment-meta">留言于 <strong>${formattedDate}</strong> by <strong>${comment.author.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</strong></div>
               </div>
            `;
            commentsList.appendChild(commentCard);
        });
    };

    const commentFormSubmitHandler = async (event) => {
        event.preventDefault();
        const authorInput = document.getElementById('comment-author');
        const commentTextInput = document.getElementById('comment-text');
        const author = authorInput.value.trim(); 
        const text = commentTextInput.value.trim();

        if (!author || !text) { alert('名字和留言内容都不能为空哦！'); return; }

        const success = await postNewComment(author, text);
        if (success) {
            authorInput.value = '';
            commentTextInput.value = ''; 
            const updatedComments = await getAllComments();
            displayComments(updatedComments);
        } 
    };

    const initCommentsPage = async () => {
        if(commentForm) {
            commentForm.addEventListener('submit', commentFormSubmitHandler);
        }
        if (commentsList) {
            const comments = await getAllComments();
            displayComments(comments);
        }
    };
    
    initCommentsPage();

    console.log("✅ comments.js FINISHED execution.");
});
