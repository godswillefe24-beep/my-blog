// Admin Dashboard Script

console.log('Admin script loading...');

const API_BASE = 'http://localhost:3001/api';
const ADMIN_PASSWORD = 'admin123';

// Initialize immediately
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM ready, initializing...');
  
  // Login handler
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    console.log('Login form found, adding listener');
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      console.log('Login form submitted');
      
      const password = document.getElementById('admin-password').value;
      console.log('Password entered:', password === ADMIN_PASSWORD ? 'CORRECT' : 'WRONG');
      
      if (password === ADMIN_PASSWORD) {
        console.log('Password correct, showing dashboard');
        const loginScreen = document.getElementById('login-screen');
        const dashboardScreen = document.getElementById('dashboard-screen');
        
        if (loginScreen) {
          loginScreen.style.display = 'none';
          console.log('Login screen hidden');
        }
        if (dashboardScreen) {
          dashboardScreen.style.display = 'block';
          console.log('Dashboard screen shown');
        }
        
        alert('Login successful!');
      } else {
        alert('Invalid password. Try: admin123');
      }
    });
  } else {
    console.error('Login form NOT found!');
  }
  
  // Logout handler
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
      console.log('Logout clicked');
      const loginScreen = document.getElementById('login-screen');
      const dashboardScreen = document.getElementById('dashboard-screen');
      
      if (loginScreen) loginScreen.style.display = 'flex';
      if (dashboardScreen) dashboardScreen.style.display = 'none';
      
      document.getElementById('admin-password').value = '';
    });
  }
  
  // Tab navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function() {
      const tab = this.dataset.tab;
      console.log('Tab clicked:', tab);
      
      // Remove active from all
      document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      // Add active to selected
      this.classList.add('active');
      const tabContent = document.getElementById(tab);
      if (tabContent) tabContent.classList.add('active');
    });
  });
  
  // Modal close buttons
  document.querySelectorAll('.modal-close, .modal-close-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const modal = document.getElementById('post-modal');
      if (modal) modal.classList.remove('active');
    });
  });
  
  // New post button
  const newPostBtn = document.getElementById('new-post-btn');
  if (newPostBtn) {
    newPostBtn.addEventListener('click', function() {
      const modal = document.getElementById('post-modal');
      if (modal) modal.classList.add('active');
    });
  }
  
  console.log('Initialization complete');
});
