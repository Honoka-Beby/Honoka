// js/comments.js
document.addEventListener('DOMContentLoaded', () => {
    const commentForm = document.getElementById('comment-form');
    const commentsList = document.getElementById('comments-list');
    const noCommentsMessage = commentsList.querySelector('.no-comments-message'); // 获取“暂无留言”提示

    // !!! IMPORTANT: Replace with your actual Netlify Functions URLs !!!
    // Make sure your Netlify Functions URLs are correct. 
    // They will typically be: https://YOUR_NETLIFY_SITE_NAME.netlify.app/.netlify/functions/FUNCTION_NAME
    // Honoka's current Netlify domain from screenshot is honoka1.netlify.app
    const backendBaseUrl = 'https://honoka1.netlify.app/.netlify/functions/'; // Replace with your base function URL

    const getAllComments = async () => {
        try {
            const response = await fetch(`${backendBaseUrl}getComments`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const comments = await response.json();
            return comments;
        } catch (error) {
            console.error('Failed to fetch comments from backend:', error);
            // Fallback: If backend fails, show no comments message
            return null; 
        }
    };

    const postNewComment = async (author, text) => {
        try {
            const response = await fetch(`${backendBaseUrl}createComment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // 'Access-Control-Allow-Origin': 'https://honoka1.netlify.app', // Usually, browser infers this from response headers
                },
                body: JSON.stringify({ author, text }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message}`);
            }
            const result = await response.json();
            console.log('Comment posted successfully:', result);
            return true; // Successfully posted
        } catch (error) {
            console.error('Failed to post comment to backend:', error);
            alert(`提交留言失败: ${error.message}. 请稍后再试！`);
            return false; // Failed to post
        }
    };


    const displayComments = (comments) => {
        commentsList.innerHTML = ''; // 清空现有留言

        if (!comments || comments.length === 0) {
            commentsList.innerHTML = `<p class="no-comments-message">还没有留言呢，成为第一个留下足迹的人吧！</p>`;
            if (noCommentsMessage) noCommentsMessage.style.display = 'block'; // Ensure original message is hidden or updated
            return;
        } else if (noCommentsMessage) {
            // If comments exist but the default "no comments" message persists from initial load, hide it.
             noCommentsMessage.style.display = 'none'; 
        }

        comments.forEach(comment => {
            const commentCard = document.createElement('div');
            commentCard.classList.add('comment-card');

            const date = comment.timestamp ? new Date(comment.timestamp) : new Date(); // Use new date if timestamp is null
            const formattedDate = date.toLocaleString('zh-CN', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit' 
            });

            commentCard.innerHTML = `
                <p>${comment.text}</p>
                <div class="comment-meta">
                    留言于 <strong>${formattedDate}</strong> by <strong>${comment.author}</strong>
                </div>
            `;
            commentsList.appendChild(commentCard);
        });
    };

    // Handle form submission
    if (commentForm) {
        commentForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // 阻止表单默认提交行为

            const authorInput = document.getElementById('comment-author');
            const commentTextInput = document.getElementById('comment-text');

            const author = authorInput.value;
            const text = commentTextInput.value;

            const success = await postNewComment(author, text);

            if (success) {
                authorInput.value = ''; // 清空作者输入框
                commentTextInput.value = ''; // 清空留言内容
                await loadAndDisplayComments(); // 重新加载并显示最新留言
                alert('留言提交成功，感谢您的来访！');
            } else {
                 // Error handled by postNewComment, alert already displayed
            }
        });
    }

    // Initial load of comments when page loads
    const loadAndDisplayComments = async () => {
        const comments = await getAllComments();
        if (comments) {
            displayComments(comments);
        } else {
            // Even if empty array from successful fetch, it comes here
            displayComments([]); // Display empty list if fetch error or no comments
        }
    };

    loadAndDisplayComments();

});

