import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Database file paths
const commentsFile = path.join(__dirname, 'data', 'comments.json');
const analyticsFile = path.join(__dirname, 'data', 'analytics.json');
const subscribersFile = path.join(__dirname, 'data', 'subscribers.json');

// Initialize data directory
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize data files if they don't exist
function initializeDataFiles() {
  if (!fs.existsSync(commentsFile)) {
    fs.writeFileSync(commentsFile, JSON.stringify([], null, 2));
  }
  if (!fs.existsSync(analyticsFile)) {
    fs.writeFileSync(analyticsFile, JSON.stringify({
      postViews: {},
      totalLikes: 0,
      totalComments: 0
    }, null, 2));
  }
  if (!fs.existsSync(subscribersFile)) {
    fs.writeFileSync(subscribersFile, JSON.stringify([], null, 2));
  }
}

initializeDataFiles();

// Email configuration (using test credentials - configure with real service)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'your-app-password'
  }
});

// API: Get all comments for a post
app.get('/api/comments/:postId', (req, res) => {
  try {
    const comments = JSON.parse(fs.readFileSync(commentsFile, 'utf8'));
    const postComments = comments.filter(c => c.postId === req.params.postId);
    res.json(postComments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// API: Post a new comment
app.post('/api/comments', (req, res) => {
  try {
    const { postId, name, text } = req.body;
    
    if (!postId || !name || !text) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const comments = JSON.parse(fs.readFileSync(commentsFile, 'utf8'));
    const newComment = {
      id: uuidv4(),
      postId,
      name,
      text,
      timestamp: new Date().toISOString()
    };

    comments.push(newComment);
    fs.writeFileSync(commentsFile, JSON.stringify(comments, null, 2));

    // Update analytics
    const analytics = JSON.parse(fs.readFileSync(analyticsFile, 'utf8'));
    analytics.totalComments++;
    fs.writeFileSync(analyticsFile, JSON.stringify(analytics, null, 2));

    res.status(201).json(newComment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to post comment' });
  }
});

// API: Get analytics
app.get('/api/analytics', (req, res) => {
  try {
    const analytics = JSON.parse(fs.readFileSync(analyticsFile, 'utf8'));
    const subscribers = JSON.parse(fs.readFileSync(subscribersFile, 'utf8'));
    
    res.json({
      ...analytics,
      totalSubscribers: subscribers.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// API: Record page view
app.post('/api/analytics/view/:postId', (req, res) => {
  try {
    const analytics = JSON.parse(fs.readFileSync(analyticsFile, 'utf8'));
    const postId = req.params.postId;

    if (!analytics.postViews[postId]) {
      analytics.postViews[postId] = 0;
    }
    analytics.postViews[postId]++;

    fs.writeFileSync(analyticsFile, JSON.stringify(analytics, null, 2));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to record view' });
  }
});

// API: Like a post
app.post('/api/analytics/like', (req, res) => {
  try {
    const analytics = JSON.parse(fs.readFileSync(analyticsFile, 'utf8'));
    analytics.totalLikes++;
    fs.writeFileSync(analyticsFile, JSON.stringify(analytics, null, 2));
    res.json({ totalLikes: analytics.totalLikes });
  } catch (error) {
    res.status(500).json({ error: 'Failed to record like' });
  }
});

// API: Subscribe to newsletter
app.post('/api/subscribe', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Invalid email' });
    }

    const subscribers = JSON.parse(fs.readFileSync(subscribersFile, 'utf8'));
    
    // Check if already subscribed
    if (subscribers.includes(email)) {
      return res.status(400).json({ error: 'Already subscribed' });
    }

    subscribers.push(email);
    fs.writeFileSync(subscribersFile, JSON.stringify(subscribers, null, 2));

    // Send confirmation email (configure with real email service)
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER || 'your-email@gmail.com',
        to: email,
        subject: 'Welcome to Efe\'s Blog!',
        html: `
          <h2>Welcome to the Blog!</h2>
          <p>Thank you for subscribing to our newsletter.</p>
          <p>You'll now receive updates about new posts and insights.</p>
          <p>Best regards,<br>Efe</p>
        `
      });
    } catch (emailError) {
      console.log('Email service not configured: ', emailError.message);
      // Don't fail the subscription if email fails
    }

    res.json({ success: true, message: 'Subscribed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to subscribe' });
  }
});

// Start server
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const ADMIN_TOKEN = 'essence-admin-token-2026';

// ==========================================
// ADMIN AUTHENTICATION
// ==========================================

app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  
  if (password === ADMIN_PASSWORD) {
    res.json({ token: ADMIN_TOKEN });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

// Middleware to check admin token
function verifyAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];
  
  if (token === ADMIN_TOKEN) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

// ==========================================
// ADMIN: POSTS MANAGEMENT
// ==========================================

app.post('/api/admin/posts', verifyAdmin, (req, res) => {
  try {
    const { id, title, category, content } = req.body;
    // In a real app, save to database
    res.json({ success: true, id });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save post' });
  }
});

app.delete('/api/admin/posts/:id', verifyAdmin, (req, res) => {
  try {
    const { id } = req.params;
    // In a real app, delete from database
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// ==========================================
// ADMIN: SUBSCRIBERS MANAGEMENT
// ==========================================

app.get('/api/admin/subscribers', verifyAdmin, (req, res) => {
  try {
    const subscribers = JSON.parse(fs.readFileSync(subscribersFile, 'utf8'));
    const subscribersData = subscribers.map((email, index) => ({
      email,
      date: new Date().toISOString(),
      id: index
    }));
    res.json(subscribersData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch subscribers' });
  }
});

app.delete('/api/admin/subscribers/:id', verifyAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const subscribers = JSON.parse(fs.readFileSync(subscribersFile, 'utf8'));
    subscribers.splice(parseInt(id), 1);
    fs.writeFileSync(subscribersFile, JSON.stringify(subscribers, null, 2));
    
    // Update analytics
    const analytics = JSON.parse(fs.readFileSync(analyticsFile, 'utf8'));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete subscriber' });
  }
});

// ==========================================
// ADMIN: SETTINGS
// ==========================================

app.post('/api/admin/settings', verifyAdmin, (req, res) => {
  try {
    const { password } = req.body;
    
    if (password) {
      // In production, store hashed password in .env or database
      process.env.ADMIN_PASSWORD = password;
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'No settings to update' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

app.listen(PORT, () => {
  console.log(`Blog server running on http://localhost:${PORT}`);
  console.log(`Admin dashboard: http://localhost:${PORT}/admin.html`);
  console.log(`Default admin password: ${ADMIN_PASSWORD}`);
});
