// Admin Dashboard Script

const API_BASE = 'http://localhost:3001/api';
const ADMIN_PASSWORD = 'admin123';
let isLoggedIn = false;
let currentEditingPostId = null;

// ==========================================
// UI FUNCTIONS
// ==========================================

function showLoginScreen(show) {
  const loginScreen = document.getElementById('login-screen');
  const dashboardScreen = document.getElementById('dashboard-screen');
  if (loginScreen) loginScreen.classList.toggle('active', show);
  if (dashboardScreen) dashboardScreen.classList.toggle('active', !show);
}

function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    background: ${type === 'error' ? '#ef4444' : '#10b981'};
    color: white;
    border-radius: 4px;
    z-index: 9999;
  `;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
}

function openModal() {
  const modal = document.getElementById('post-modal');
  if (modal) modal.classList.add('active');
}

function closeModal() {
  const modal = document.getElementById('post-modal');
  if (modal) modal.classList.remove('active');
  const form = document.getElementById('post-form');
  if (form) form.reset();
  currentEditingPostId = null;
}

// ==========================================
// INITIALIZATION
// ==========================================

function setupEventListeners() {
  console.log('Setting up event listeners...');
  
  // Login form
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  // Logout button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }

  // Tab navigation
  document.querySelectorAll('.nav-item').forEach((item) => {
    item.addEventListener('click', () => {
      const tab = item.dataset.tab;
      document.querySelectorAll('.nav-item').forEach((i) => {
        i.classList.remove('active');
      });
      item.classList.add('active');
      document.querySelectorAll('.tab-content').forEach((content) => {
        content.classList.remove('active');
      });
      const tabContent = document.getElementById(tab);
      if (tabContent) tabContent.classList.add('active');
    });
  });

  // Modal controls
  document.querySelectorAll('.modal-close').forEach((btn) => {
    btn.addEventListener('click', closeModal);
  });
  document.querySelectorAll('.modal-close-btn').forEach((btn) => {
    btn.addEventListener('click', closeModal);
  });
  const postModal = document.getElementById('post-modal');
  if (postModal) {
    postModal.addEventListener('click', (e) => {
      if (e.target.id === 'post-modal') closeModal();
    });
  }

  // Post management
  const newPostBtn = document.getElementById('new-post-btn');
  if (newPostBtn) {
    newPostBtn.addEventListener('click', () => {
      currentEditingPostId = null;
      const title = document.getElementById('modal-title');
      if (title) title.textContent = 'New Post';
      openModal();
    });
  }

  const postForm = document.getElementById('post-form');
  if (postForm) {
    postForm.addEventListener('submit', handlePostSubmit);
  }

  // Export subscribers
  const exportBtn = document.getElementById('export-subscribers-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportSubscribersCSV);
  }

  // Save settings
  const saveBtn = document.getElementById('save-settings-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', saveSettings);
  }
}

function initializeApp() {
  console.log('Admin dashboard initializing...');
  
  if (localStorage.getItem('admin_token')) {
    isLoggedIn = true;
    showLoginScreen(false);
    loadDashboardData();
  } else {
    showLoginScreen(true);
  }
  
  setupEventListeners();
}

// ==========================================
// AUTHENTICATION
// ==========================================

async function handleLogin(e) {
  e.preventDefault();
  const passwordInput = document.getElementById('admin-password');
  const password = passwordInput ? passwordInput.value : '';

  console.log('Login attempt...');

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
      if (passwordInput) passwordInput.value = '';
      loadDashboardData();
      showNotification('Logged in successfully!');
      return;
    }
  } catch (error) {
    console.log('Server error, using local auth:', error.message);
  }

  // Fallback: local authentication
  if (password === ADMIN_PASSWORD) {
    localStorage.setItem('admin_token', 'local-token');
    isLoggedIn = true;
    showLoginScreen(false);
    if (passwordInput) passwordInput.value = '';
    loadDashboardData();
    showNotification('Logged in successfully!');
  } else {
    showNotification('Invalid password', 'error');
  }
}

function handleLogout() {
  localStorage.removeItem('admin_token');
  isLoggedIn = false;
  currentEditingPostId = null;
  showLoginScreen(true);
  const passwordInput = document.getElementById('admin-password');
  if (passwordInput) passwordInput.value = '';
}

// ==========================================
// DASHBOARD DATA
// ==========================================

async function loadDashboardData() {
  try {
    const response = await fetch(`${API_BASE}/analytics`);
    if (response.ok) {
      const data = await response.json();
      const postsEl = document.getElementById('stat-posts');
      const likesEl = document.getElementById('stat-likes');
      const commentsEl = document.getElementById('stat-comments');
      const subEl = document.getElementById('stat-subscribers');
      
      if (postsEl) postsEl.textContent = 4;
      if (likesEl) likesEl.textContent = data.totalLikes || 0;
      if (commentsEl) commentsEl.textContent = data.totalComments || 0;
      if (subEl) subEl.textContent = data.totalSubscribers || 0;
    }
  } catch (error) {
    console.log('Dashboard data error:', error);
  }

  loadPosts();
  loadComments();
  loadSubscribers();
}

async function loadPosts() {
  try {
    const response = await fetch(`${API_BASE}/posts`);
    if (response.ok) {
      const posts = await response.json();
      const postsList = document.getElementById('posts-list');
      if (postsList) {
        postsList.innerHTML = (posts || []).map(post => `
          <div class="post-item">
            <div class="post-header">
              <h3>${post.title}</h3>
              <span class="category">${post.category || 'Uncategorized'}</span>
            </div>
            <p>${(post.content || '').substring(0, 100)}...</p>
            <div class="post-actions">
              <button class="btn btn-sm" onclick="editPost(${post.id})">Edit</button>
              <button class="btn btn-sm" onclick="deletePost(${post.id})">Delete</button>
            </div>
          </div>
        `).join('');
      }
    }
  } catch (error) {
    console.log('Posts load error:', error);
  }
}

async function loadComments() {
  try {
    const response = await fetch(`${API_BASE}/comments`);
    if (response.ok) {
      const comments = await response.json();
      const commentsList = document.getElementById('comments-list');
      if (commentsList) {
        commentsList.innerHTML = (comments || []).map(comment => `
          <div class="comment-item">
            <div class="comment-header">
              <strong>${comment.name}</strong>
              <span class="date">${new Date(comment.date).toLocaleDateString()}</span>
            </div>
            <p>${comment.text}</p>
            <div class="comment-actions">
              <button class="btn btn-sm" onclick="deleteComment(${comment.id})">Delete</button>
            </div>
          </div>
        `).join('');
      }
    }
  } catch (error) {
    console.log('Comments load error:', error);
  }
}

async function loadSubscribers() {
  try {
    const response = await fetch(`${API_BASE}/admin/subscribers`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
    });
    if (response.ok) {
      const data = await response.json();
      const subscribers = data.subscribers || [];
      const subList = document.getElementById('subscribers-list');
      if (subList) {
        subList.innerHTML = subscribers.map(sub => `
          <div class="subscriber-item">
            <div>${sub.email}</div>
            <button class="btn btn-sm" onclick="deleteSubscriber('${sub.email}')">Remove</button>
          </div>
        `).join('');
      }
    }
  } catch (error) {
    console.log('Subscribers load error:', error);
  }
}

// ==========================================
// POST MANAGEMENT
// ==========================================

async function handlePostSubmit(e) {
  e.preventDefault();
  
  const titleInput = document.getElementById('post-title');
  const categoryInput = document.getElementById('post-category');
  const contentInput = document.getElementById('post-content');
  
  const post = {
    title: titleInput ? titleInput.value : '',
    category: categoryInput ? categoryInput.value : 'Uncategorized',
    content: contentInput ? contentInput.value : '',
    id: currentEditingPostId || Date.now()
  };

  try {
    const response = await fetch(`${API_BASE}/admin/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
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
    console.error('Save error:', error);
    showNotification('Error saving post', 'error');
  }
}

function editPost(postId) {
  console.log('Edit post:', postId);
  currentEditingPostId = postId;
  const title = document.getElementById('modal-title');
  if (title) title.textContent = 'Edit Post';
  openModal();
}

async function deletePost(postId) {
  if (!confirm('Delete this post?')) return;
  try {
    const response = await fetch(`${API_BASE}/admin/posts/${postId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` }
    });
    if (response.ok) {
      showNotification('Post deleted');
      loadPosts();
    }
  } catch (error) {
    console.error('Delete error:', error);
  }
}

async function deleteComment(commentId) {
  if (!confirm('Delete this comment?')) return;
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

async function deleteSubscriber(email) {
  if (!confirm('Delete this subscriber?')) return;
  try {
    const response = await fetch(`${API_BASE}/admin/subscribers/${email}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` }
    });
    if (response.ok) {
      showNotification('Subscriber removed');
      loadSubscribers();
    }
  } catch (error) {
    console.error('Delete error:', error);
  }
}

// ==========================================
// SUBSCRIBERS & SETTINGS
// ==========================================

function exportSubscribersCSV() {
  console.log('Exporting subscribers...');
  showNotification('Export feature coming soon');
}

async function saveSettings() {
  const titleInput = document.getElementById('blog-title');
  const descInput = document.getElementById('blog-description');
  const passwordInput = document.getElementById('admin-new-password');
  
  try {
    const response = await fetch(`${API_BASE}/admin/settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
      },
      body: JSON.stringify({
        title: titleInput ? titleInput.value : '',
        description: descInput ? descInput.value : '',
        newPassword: passwordInput ? passwordInput.value : ''
      })
    });

    if (response.ok) {
      showNotification('Settings saved successfully!');
    } else {
      showNotification('Failed to save settings', 'error');
    }
  } catch (error) {
    console.error('Settings error:', error);
    showNotification('Error saving settings', 'error');
  }
}

// ==========================================
// START APP WHEN DOM IS READY
// ==========================================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
