// Admin Dashboard Script

const API_BASE = 'http://localhost:3001/api';
let isLoggedIn = false;
let currentEditingPostId = null;

// ==========================================
// AUTHENTICATION
// ==========================================

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const password = document.getElementById('admin-password').value;

  try {
    const response = await fetch(`${API_BASE}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('admin_token', data.token);
      isLoggedIn = true;
      showLoginScreen(false);
      loadDashboardData();
    } else {
      showNotification('Invalid password', 'error');
    }
  } catch (error) {
    console.error('Login error:', error);
    showNotification('Login failed', 'error');
  }
});

document.getElementById('logout-btn').addEventListener('click', () => {
  localStorage.removeItem('admin_token');
  isLoggedIn = false;
  showLoginScreen(true);
  document.getElementById('admin-password').value = '';
});

// ==========================================
// UI FUNCTIONS
// ==========================================

function showLoginScreen(show) {
  document.getElementById('login-screen').classList.toggle('active', show);
  document.getElementById('dashboard-screen').classList.toggle('active', !show);
}

function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Tab Navigation
document.querySelectorAll('.nav-item').forEach((item) => {
  item.addEventListener('click', () => {
    const tab = item.dataset.tab;

    // Update active nav item
    document.querySelectorAll('.nav-item').forEach((i) => {
      i.classList.remove('active');
    });
    item.classList.add('active');

    // Update active tab content
    document.querySelectorAll('.tab-content').forEach((content) => {
      content.classList.remove('active');
    });
    document.getElementById(tab).classList.add('active');
  });
});

// Modal Controls
document.querySelectorAll('.modal-close').forEach((btn) => {
  btn.addEventListener('click', closeModal);
});

document.querySelectorAll('.modal-close-btn').forEach((btn) => {
  btn.addEventListener('click', closeModal);
});

document.getElementById('post-modal').addEventListener('click', (e) => {
  if (e.target.id === 'post-modal') closeModal();
});

function openModal() {
  document.getElementById('post-modal').classList.add('active');
}

function closeModal() {
  document.getElementById('post-modal').classList.remove('active');
  document.getElementById('post-form').reset();
  currentEditingPostId = null;
}

// ==========================================
// DASHBOARD DATA
// ==========================================

async function loadDashboardData() {
  try {
    const response = await fetch(`${API_BASE}/analytics`);
    if (response.ok) {
      const data = await response.json();
      document.getElementById('stat-posts').textContent = 4; // Fixed posts
      document.getElementById('stat-likes').textContent = data.totalLikes || 0;
      document.getElementById('stat-comments').textContent =
        data.totalComments || 0;
      document.getElementById('stat-subscribers').textContent =
        data.totalSubscribers || 0;
    }
  } catch (error) {
    console.log('Dashboard data error:', error);
  }

  loadPosts();
  loadComments();
  loadSubscribers();
}

// ==========================================
// POSTS MANAGEMENT
// ==========================================

document.getElementById('new-post-btn').addEventListener('click', () => {
  currentEditingPostId = null;
  document.getElementById('modal-title').textContent = 'New Post';
  document.getElementById('post-form').reset();
  openModal();
});

document.getElementById('post-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const post = {
    title: document.getElementById('post-title').value,
    category: document.getElementById('post-category').value,
    content: document.getElementById('post-content').value,
    id: currentEditingPostId || Date.now()
  };

  try {
    const response = await fetch(`${API_BASE}/admin/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('admin_token')}`
      },
      body: JSON.stringify(post)
    });

    if (response.ok) {
      showNotification('Post saved successfully!');
      closeModal();
      loadPosts();
    } else {
      showNotification('Failed to save post', 'error');
    }
  } catch (error) {
    console.error('Post save error:', error);
    showNotification('Error saving post', 'error');
  }
});

async function loadPosts() {
  const postsList = document.getElementById('posts-list');
  postsList.innerHTML = '<div class="empty-state"><p>Loading posts...</p></div>';

  try {
    // Fetch posts from local data
    const posts = [
      {
        id: 1,
        title: 'Welcome to my blog',
        category: 'Technology',
        date: '2025-11-26'
      },
      {
        id: 2,
        title: 'Latest Technology News and Innovations',
        category: 'Technology',
        date: '2026-03-01'
      },
      {
        id: 3,
        title: 'Getting Started with Your Blog',
        category: 'Thoughts',
        date: '2025-12-10'
      },
      {
        id: 4,
        title: 'Advanced Customization Techniques',
        category: 'Tutorial',
        date: '2026-01-15'
      }
    ];

    if (posts.length === 0) {
      postsList.innerHTML =
        '<div class="empty-state"><div class="empty-state-icon">📝</div><div class="empty-state-text">No posts yet</div></div>';
      return;
    }

    postsList.innerHTML = posts
      .map(
        (post) => `
      <div class="list-item">
        <div class="list-item-content">
          <div class="list-item-title">${post.title}</div>
          <div class="list-item-meta">${post.category} • ${post.date}</div>
        </div>
        <div class="list-item-actions">
          <button class="btn-edit" onclick="editPost(${post.id})">Edit</button>
          <button class="btn-delete" onclick="deletePost(${post.id})">Delete</button>
        </div>
      </div>
    `
      )
      .join('');
  } catch (error) {
    console.error('Load posts error:', error);
    postsList.innerHTML =
      '<div class="empty-state"><div class="empty-state-text">Error loading posts</div></div>';
  }
}

function editPost(postId) {
  currentEditingPostId = postId;
  document.getElementById('modal-title').textContent = 'Edit Post';
  document.getElementById('post-title').value = 'Post Title';
  document.getElementById('post-category').value = 'Technology';
  openModal();
}

async function deletePost(postId) {
  if (confirm('Are you sure you want to delete this post?')) {
    try {
      const response = await fetch(`${API_BASE}/admin/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('admin_token')}`
        }
      });

      if (response.ok) {
        showNotification('Post deleted');
        loadPosts();
      } else {
        showNotification('Failed to delete post', 'error');
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  }
}

// ==========================================
// COMMENTS MODERATION
// ==========================================

async function loadComments() {
  const commentsList = document.getElementById('comments-list');

  try {
    const response = await fetch(`${API_BASE}/comments`);
    if (!response.ok) throw new Error('Failed to load comments');

    const comments = await response.json();

    if (comments.length === 0) {
      commentsList.innerHTML =
        '<div class="empty-state"><div class="empty-state-icon">💬</div><div class="empty-state-text">No comments yet</div></div>';
      return;
    }

    commentsList.innerHTML = comments
      .map(
        (comment) => `
      <div class="list-item">
        <div class="list-item-content">
          <div class="list-item-title">${comment.name}</div>
          <div class="list-item-meta">${comment.text}</div>
        </div>
        <div class="list-item-actions">
          <button class="btn-approve" onclick="approveComment(${comment.id})">Approve</button>
          <button class="btn-delete" onclick="deleteComment(${comment.id})">Delete</button>
        </div>
      </div>
    `
      )
      .join('');
  } catch (error) {
    console.error('Load comments error:', error);
  }
}

function approveComment(commentId) {
  showNotification('Comment approved');
}

async function deleteComment(commentId) {
  if (confirm('Delete this comment?')) {
    try {
      const response = await fetch(`${API_BASE}/comments/${commentId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        showNotification('Comment deleted');
        loadComments();
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  }
}

// ==========================================
// SUBSCRIBERS MANAGEMENT
// ==========================================

async function loadSubscribers() {
  const subscribersList = document.getElementById('subscribers-list');

  try {
    const response = await fetch(`${API_BASE}/admin/subscribers`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('admin_token')}`
      }
    });

    if (!response.ok) throw new Error('Failed to load subscribers');

    const subscribers = await response.json();

    if (subscribers.length === 0) {
      subscribersList.innerHTML =
        '<div class="empty-state"><div class="empty-state-icon">📧</div><div class="empty-state-text">No subscribers yet</div></div>';
      return;
    }

    subscribersList.innerHTML = subscribers
      .map(
        (sub, index) => `
      <div class="list-item">
        <div class="list-item-content">
          <div class="list-item-title">${sub.email}</div>
          <div class="list-item-meta">Subscribed on ${new Date(sub.date).toLocaleDateString()}</div>
        </div>
        <div class="list-item-actions">
          <button class="btn-delete" onclick="deleteSubscriber(${index})">Remove</button>
        </div>
      </div>
    `
      )
      .join('');
  } catch (error) {
    console.error('Load subscribers error:', error);
  }
}

async function deleteSubscriber(index) {
  if (confirm('Remove this subscriber?')) {
    try {
      const response = await fetch(`${API_BASE}/admin/subscribers/${index}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('admin_token')}`
        }
      });

      if (response.ok) {
        showNotification('Subscriber removed');
        loadSubscribers();
        loadDashboardData();
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  }
}

document.getElementById('export-subscribers-btn').addEventListener('click', () => {
  fetch(`${API_BASE}/admin/subscribers`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('admin_token')}`
    }
  })
    .then((r) => r.json())
    .then((subscribers) => {
      const csv = subscribers.map((s) => s.email).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'subscribers.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    });
});

// ==========================================
// SETTINGS
// ==========================================

document.getElementById('save-settings-btn').addEventListener('click', async () => {
  const newPassword = document.getElementById('admin-new-password').value;

  try {
    const response = await fetch(`${API_BASE}/admin/settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('admin_token')}`
      },
      body: JSON.stringify({
        password: newPassword || undefined
      })
    });

    if (response.ok) {
      showNotification('Settings saved');
      document.getElementById('admin-new-password').value = '';
    } else {
      showNotification('Failed to save settings', 'error');
    }
  } catch (error) {
    console.error('Settings error:', error);
  }
});

// ==========================================
// INITIALIZATION
// ==========================================

// Check if already logged in
window.addEventListener('load', () => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    isLoggedIn = true;
    showLoginScreen(false);
    loadDashboardData();
  } else {
    showLoginScreen(true);
  }
});
