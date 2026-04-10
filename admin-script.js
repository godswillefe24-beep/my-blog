const API = 'http://localhost:3001/api';
const PASSWORD = 'admin123';

let isLoggedIn = false;

// DOM Elements
const loginContainer = document.getElementById('login-container');
const dashboard = document.getElementById('dashboard');
const loginForm = document.getElementById('login-form');
const passwordInput = document.getElementById('password');
const logoutBtn = document.getElementById('logout-btn');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  console.log('Admin dashboard loaded');
  setupEventListeners();
});

function setupEventListeners() {
  // Login
  loginForm.addEventListener('submit', handleLogin);

  // Navigation
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      e.target.closest('.nav-btn').classList.add('active');
      
      const section = e.target.closest('.nav-btn').dataset.section;
      showSection(section);
    });
  });

  // Logout
  logoutBtn.addEventListener('click', handleLogout);

  // Post Modal
  const postModal = document.getElementById('post-modal');
  document.getElementById('new-post-btn').addEventListener('click', () => {
    document.getElementById('modal-title').textContent = 'New Post';
    postModal.classList.remove('hidden');
  });

  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => postModal.classList.add('hidden'));
  });

  document.getElementById('post-form').addEventListener('submit', (e) => {
    e.preventDefault();
    console.log('Post saved');
    postModal.classList.add('hidden');
  });

  // Save Settings
  document.getElementById('save-settings-btn').addEventListener('click', () => {
    console.log('Settings saved');
  });
}

function handleLogin(e) {
  e.preventDefault();
  
  if (passwordInput.value === PASSWORD) {
    isLoggedIn = true;
    loginContainer.classList.add('hidden');
    dashboard.classList.remove('hidden');
    loadDashboardData();
  } else {
    alert('Invalid password');
    passwordInput.value = '';
  }
}

function handleLogout() {
  isLoggedIn = false;
  loginContainer.classList.remove('hidden');
  dashboard.classList.add('hidden');
  passwordInput.value = '';
}

function showSection(sectionName) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  const section = document.getElementById(sectionName);
  if (section) {
    section.classList.add('active');
    
    // Load data for the section
    if (sectionName === 'posts') loadPosts();
    if (sectionName === 'comments') loadComments();
    if (sectionName === 'subscribers') loadSubscribers();
  }
}

async function loadDashboardData() {
  try {
    const response = await fetch(`${API}/analytics`);
    if (response.ok) {
      const data = await response.json();
      document.getElementById('stat-posts').textContent = 4;
      document.getElementById('stat-comments').textContent = data.totalComments || 0;
      document.getElementById('stat-likes').textContent = data.totalLikes || 0;
      document.getElementById('stat-subscribers').textContent = data.totalSubscribers || 0;
    }
  } catch (e) {
    console.log('Could not load analytics:', e.message);
    // Set defaults
    document.getElementById('stat-posts').textContent = 4;
    document.getElementById('stat-comments').textContent = 0;
    document.getElementById('stat-likes').textContent = 0;
    document.getElementById('stat-subscribers').textContent = 0;
  }
}

async function loadPosts() {
  try {
    const response = await fetch(`${API}/posts`);
    if (response.ok) {
      const posts = await response.json();
      const container = document.getElementById('posts-list');
      container.innerHTML = (posts || []).map(post => `
        <div class="item">
          <div class="item-info">
            <h3>${post.title}</h3>
            <p>${post.category} • ${new Date(post.date || Date.now()).toLocaleDateString()}</p>
          </div>
          <div class="item-actions">
            <button class="btn btn-sm">Edit</button>
            <button class="btn btn-sm btn-secondary">Delete</button>
          </div>
        </div>
      `).join('');
    }
  } catch (e) {
    console.log('Could not load posts:', e.message);
    document.getElementById('posts-list').innerHTML = '<p>No posts yet</p>';
  }
}

async function loadComments() {
  try {
    const response = await fetch(`${API}/comments`);
    if (response.ok) {
      const comments = await response.json();
      const container = document.getElementById('comments-list');
      container.innerHTML = (comments || []).map(comment => `
        <div class="item">
          <div class="item-info">
            <h3>${comment.name}</h3>
            <p>${comment.text.substring(0, 100)}...</p>
            <p style="font-size: 0.8rem; margin-top: 5px;">${new Date(comment.date).toLocaleDateString()}</p>
          </div>
          <div class="item-actions">
            <button class="btn btn-sm btn-secondary">Delete</button>
          </div>
        </div>
      `).join('');
    }
  } catch (e) {
    console.log('Could not load comments:', e.message);
    document.getElementById('comments-list').innerHTML = '<p>No comments yet</p>';
  }
}

async function loadSubscribers() {
  try {
    const response = await fetch(`${API}/admin/subscribers`, {
      headers: { 'Authorization': `Bearer local-token` }
    });
    if (response.ok) {
      const data = await response.json();
      const subscribers = data.subscribers || [];
      const container = document.getElementById('subscribers-list');
      container.innerHTML = (subscribers || []).map(sub => `
        <div class="item">
          <div class="item-info">
            <h3>${sub.email}</h3>
            <p>Subscribed • ${new Date(sub.subscribedAt || Date.now()).toLocaleDateString()}</p>
          </div>
          <div class="item-actions">
            <button class="btn btn-sm btn-secondary">Remove</button>
          </div>
        </div>
      `).join('');
    }
  } catch (e) {
    console.log('Could not load subscribers:', e.message);
    document.getElementById('subscribers-list').innerHTML = '<p>No subscribers yet</p>';
  }
}

console.log('Admin script ready');
