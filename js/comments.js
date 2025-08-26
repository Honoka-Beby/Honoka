document.addEventListener('DOMContentLoaded', () => {
    const commentForm = document.getElementById('comment-form');
    const commentsList = document.getElementById('comments-list');

    function loadComments() {
        if (!commentsList) return; 

        commentsList.innerHTML = '';
        const comments = JSON.parse(localStorage.getItem('blogComments')) || [];

        if (comments.length === 0) {
            // Updated class for the 'no comments' message with animation
            const noCommentMessage = document.createElement('p');
            noCommentMessage.classList.add('no-comments-message', 'animate__slide-up');
            noCommentMessage.textContent = '还没有留言呢，成为第一个留下足迹的人吧！';
            commentsList.appendChild(noCommentMessage);
            // Manually make it visible, as Intersection Observer might not be set up for this dynamic element
            setTimeout(() => { noCommentMessage.classList.add('is-visible'); }, 50); 
            return;
        }

        // Show newest comments first, applying staggering animation
        comments.reverse().forEach((comment, index) => { 
            const commentCard = document.createElement('div');
            commentCard.classList.add('comment-card', 'animate__slide-up');
            commentCard.setAttribute('data-delay', (index * 50).toString());

            commentCard.innerHTML = `
                <p>${comment.text}</p>
                <div class="comment-meta">
                    <strong>${comment.author}</strong> 于 ${new Date(comment.timestamp).toLocaleString()} 留言
                </div>
            `;
            commentsList.appendChild(commentCard);

            // Trigger animation for dynamically added elements
            setTimeout(() => {
                commentCard.classList.add('is-visible');
            }, (index * 50) + 100); 
        });
    }

    function saveComment(author, text) {
        const comments = JSON.parse(localStorage.getItem('blogComments')) || [];
        const newComment = {
            author: author,
            text: text,
            timestamp: new Date().toISOString()
        };
        comments.push(newComment);
        localStorage.setItem('blogComments', JSON.stringify(comments));
        loadComments(); 
    }

    if (commentForm) { 
        commentForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const authorInput = document.getElementById('comment-author');
            const textInput = document.getElementById('comment-text');

            const author = authorInput.value.trim();
            const text = textInput.value.trim();

            if (author && text) {
                saveComment(author, text);
                authorInput.value = '';
                textInput.value = '';
            } else {
                alert('请填写你的名字和留言内容哦！');
            }
        });
    }

    loadComments();
});
