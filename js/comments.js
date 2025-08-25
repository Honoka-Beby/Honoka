document.addEventListener('DOMContentLoaded', () => {
    const commentForm = document.getElementById('comment-form');
    const commentsList = document.getElementById('comments-list');

    // Function to load comments from localStorage
    function loadComments() {
        commentsList.innerHTML = ''; // Clear previous A-i generated content / comments
        const comments = JSON.parse(localStorage.getItem('blogComments')) || [];

        if (comments.length === 0) {
            commentsList.innerHTML = '<p class="no-comments-message animate__fade-in is-visible">还没有留言呢，成为第一个留下足迹的人吧！</p>';
            return;
        }

        comments.reverse().forEach((comment, index) => { // Show newest comments first
            const commentCard = document.createElement('div');
            commentCard.classList.add('comment-card', 'animate__fade-up');
            // Add a small delay for staggering
            commentCard.setAttribute('data-delay', (index * 50).toString()); // 50ms delay per comment

            commentCard.innerHTML = `
                <p>${comment.text}</p>
                <div class="comment-meta">
                    <strong>${comment.author}</strong> 于 ${new Date(comment.timestamp).toLocaleString()} 留言
                </div>
            `;
            commentsList.appendChild(commentCard);
            // Manually trigger animation for dynamically added elements
            setTimeout(() => {
                commentCard.classList.add('is-visible');
            }, (index * 50) + 100); // Small initial delay + stagger delay
        });
    }

    // Function to save a new comment
    function saveComment(author, text) {
        const comments = JSON.parse(localStorage.getItem('blogComments')) || [];
        const newComment = {
            author: author,
            text: text,
            timestamp: new Date().toISOString()
        };
        comments.push(newComment);
        localStorage.setItem('blogComments', JSON.stringify(comments));
        loadComments(); // Reload and re-render comments
    }

    // Handle form submission
    if (commentForm) { // Ensure form exists before adding listener
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

    // Initial load of comments when the page loads
    if (commentsList) { // Ensure comments list div exists
        loadComments();
    }
});
