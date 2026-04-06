// Admin Dashboard Script

console.log('Admin script loading...');

const API_BASE = 'http://localhost:3001/api';
const ADMIN_PASSWORD = 'admin123';

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAdmin);
} else {
  initAdmin();
}

function initAdmin() {
  console.log('Initializing admin dashboard...');
  
  // Get elements
  const loginForm = document.getElementById('login-form');
  const loginScreen = document.getElementById('login-screen');
  const dashboardScreen = document.getElementById('dashboard-screen');
  
  console.log('Elements:', {
    loginForm: !!loginForm,
    loginScreen: !!loginScreen,
    dashboardScreen: !!dashboardScreen
  });
  
  // Login form handler
  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      console.log('Form submitted');
      
      const passwordInput = document.getElementById('admin-password');
      const password = passwordInput ? passwordInput.value : '';
      
      console.log('Password check:', password, '==', ADMIN_PASSWORD, '?', password === ADMIN_PASSWORD);
      
      if (password === ADMIN_PASSWORD) {
        console.log('Password correct! Switching screens...');
        
        // Hide login, show dashboard
        if (loginScreen) {
          console.log('Hiding login screen');
          loginScreen.classList.add('hidden');
          loginScreen.style.display = 'none';
        }
        if (dashboardScreen) {
          console.log('Showing dashboard screen');
          dashboardScreen.classList.remove('hidden');
          dashboardScreen.style.display = 'grid';
        }
        
        alert('✅ Login successful!');
      } else {
        console.log('Password incorrect');
        alert('❌ Invalid password. Try: admin123');
        if (passwordInput) passwordInput.value = '';
      }
    });
  } else {
    console.error('Login form not found!');
  }
  
  // Logout handler
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
      console.log('Logout clicked');
      
      if (loginScreen) {
        loginScreen.classList.remove('hidden');
        loginScreen.style.display = 'flex';
      }
      if (dashboardScreen) {
        dashboardScreen.classList.add('hidden');
        dashboardScreen.style.display = 'none';
      }
      
      const passwordInput = document.getElementById('admin-password');
      if (passwordInput) passwordInput.value = '';
    });
  }
  
  // Tab navigation
  const navItems = document.querySelectorAll('.nav-item');
  console.log('Nav items found:', navItems.length);
  
  navItems.forEach(item => {
    item.addEventListener('click', function() {
      const tabName = this.dataset.tab;
      console.log('Tab clicked:', tabName);
      
      // Remove active from all nav items and tabs
      navItems.forEach(i => i.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
      });
      
      // Add active to selected
      this.classList.add('active');
      const tabContent = document.getElementById(tabName);
      if (tabContent) {
        tabContent.classList.add('active');
      }
    });
  });
  
  // Modal controls
  const closeButtons = document.querySelectorAll('.modal-close, .modal-close-btn');
  closeButtons.forEach(btn => {
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
  
  console.log('Admin dashboard initialized ✅');
}
