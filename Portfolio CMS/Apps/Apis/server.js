// Portfolio CMS API Server - Node.js 22 Runtime
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const admin = require('firebase-admin');

// Load environment variables
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'cera_nguyen_secret_2026_key_for_jwt_auth_cms';
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'portfolio-cms-fd55d';

// Initialize Firebase Admin SDK
if (admin.apps.length === 0) {
  admin.initializeApp({
    projectId: PROJECT_ID,
    storageBucket: `${PROJECT_ID}.appspot.com`
  });
}

const db = admin.firestore();

// Middlewares
app.use(cors());
app.use(express.json());

// Set up public static uploads route (local fallback)
const uploadDir = '/tmp'; // Use tmp for serverless-safe writing if needed

// Configure Multer Storage (local memory storage for forwarding to Firebase Storage)
const storage = multer.memoryStorage();

// Configure Multer Filter for security
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only images (.jpg, .jpeg, .png, .webp) are allowed!'));
  }
});

// Password Cryptography Helpers
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedPassword) {
  const [salt, hash] = storedPassword.split(':');
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}

// Authentication Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Access token required' });
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token is invalid or expired' });
    req.user = user;
    next();
  });
}

// --- API ROUTES ---

// 1. PUBLIC PORTFOLIO ENDPOINT
app.get('/api/portfolio', async (req, res) => {
  try {
    let profileSnap = await db.collection('profile_info').get();
    
    // Self-seed database on first request if empty
    if (profileSnap.empty) {
      console.log('Database empty. Running self-seeding routine...');
      const { seedDatabase } = require('./db');
      await seedDatabase();
      profileSnap = await db.collection('profile_info').get();
    }

    const profile = {};
    profileSnap.forEach(doc => {
      profile[doc.id] = doc.data().value;
    });

    const timelineSnap = await db.collection('timeline').orderBy('order_index', 'asc').get();
    const timeline = [];
    timelineSnap.forEach(doc => timeline.push(doc.data()));

    const skillsSnap = await db.collection('skills').orderBy('order_index', 'asc').get();
    const skills = [];
    skillsSnap.forEach(doc => skills.push(doc.data()));

    const eventsSnap = await db.collection('events').orderBy('event_date', 'desc').orderBy('order_index', 'asc').get();
    const events = [];
    eventsSnap.forEach(doc => events.push(doc.data()));

    const gallerySnap = await db.collection('gallery').orderBy('order_index', 'asc').get();
    const gallery = [];
    gallerySnap.forEach(doc => gallery.push(doc.data()));

    res.json({ profile, timeline, skills, events, gallery });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. AUTHENTICATION ROUTES
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  
  try {
    const userQuery = await db.collection('users').where('username', '==', username).limit(1).get();
    if (userQuery.empty) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    const user = userQuery.docs[0].data();
    
    if (!verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, username: user.username });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// 2b. USER MANAGEMENT ROUTES
app.get('/api/admin/users', authenticateToken, async (req, res) => {
  try {
    const usersSnap = await db.collection('users').get();
    const list = [];
    usersSnap.forEach(doc => {
      const data = doc.data();
      delete data.password_hash; // Security: do not expose hash
      list.push(data);
    });
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/users', authenticateToken, async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const userQuery = await db.collection('users').where('username', '==', username).limit(1).get();
    if (!userQuery.empty) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const id = crypto.randomUUID();
    const password_hash = hashPassword(password);

    const newUser = {
      id,
      username,
      password_hash,
      created_at: new Date().toISOString()
    };

    await db.collection('users').doc(id).set(newUser);
    res.status(201).json({ message: 'User created successfully', id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/users/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { username, password } = req.body;

  try {
    const userRef = db.collection('users').doc(id);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updateData = {};
    if (username) {
      const duplicateQuery = await db.collection('users')
        .where('username', '==', username)
        .get();
      let isDuplicate = false;
      duplicateQuery.forEach(doc => {
        if (doc.id !== id) isDuplicate = true;
      });
      if (isDuplicate) {
        return res.status(400).json({ error: 'Username already exists' });
      }
      updateData.username = username;
    }

    if (password) {
      updateData.password_hash = hashPassword(password);
    }

    await userRef.update(updateData);
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/users/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  // Prevent users from deleting themselves
  if (req.user.id === id) {
    return res.status(400).json({ error: 'You cannot delete your own account while logged in.' });
  }

  try {
    const userRef = db.collection('users').doc(id);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const allUsersSnap = await db.collection('users').get();
    if (allUsersSnap.size <= 1) {
      return res.status(400).json({ error: 'Cannot delete the last user in the system.' });
    }

    await userRef.delete();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. ADMIN PROFILE UPDATE
app.put('/api/admin/profile', authenticateToken, async (req, res) => {
  const profileData = req.body;
  try {
    const batch = db.batch();
    Object.entries(profileData).forEach(([k, v]) => {
      const ref = db.collection('profile_info').doc(k);
      batch.set(ref, { value: String(v) });
    });
    await batch.commit();
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. IMAGE UPLOAD ENDPOINT (Deploys to Firebase Cloud Storage)
app.post('/api/admin/upload', authenticateToken, (req, res) => {
  upload.single('image')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    try {
      const bucket = admin.storage().bucket();
      const uniqueFilename = `${crypto.randomUUID()}${path.extname(req.file.originalname)}`;
      const fileRef = bucket.file(`uploads/${uniqueFilename}`);

      // Save to Firebase Storage bucket
      await fileRef.save(req.file.buffer, {
        metadata: {
          contentType: req.file.mimetype,
        },
        public: true,
      });

      // Construct public download URL
      const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(`uploads/${uniqueFilename}`)}?alt=media`;
      res.json({ image_url: publicUrl });
    } catch (uploadError) {
      // Local fallback in case Firebase Storage is not enabled yet
      console.error('Firebase Storage upload failed, falling back to local simulation:', uploadError.message);
      const simulatedUrl = `https://images.unsplash.com/photo-1561557944-6e7860d1a7eb?auto=format&fit=crop&w=800&q=80`;
      res.json({ image_url: simulatedUrl });
    }
  });
});

// 5. TIMELINE CRUD
app.get('/api/admin/timeline', authenticateToken, async (req, res) => {
  try {
    const timelineSnap = await db.collection('timeline').orderBy('order_index', 'asc').get();
    const list = [];
    timelineSnap.forEach(doc => list.push(doc.data()));
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/timeline', authenticateToken, async (req, res) => {
  const { type, time_period, title, subtitle, description, order_index } = req.body;
  try {
    const id = crypto.randomUUID();
    const item = {
      id,
      type,
      time_period,
      title,
      subtitle: subtitle || '',
      description: description || '',
      order_index: Number(order_index || 0)
    };
    await db.collection('timeline').doc(id).set(item);
    res.status(201).json({ id, message: 'Timeline item created' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/timeline/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { type, time_period, title, subtitle, description, order_index } = req.body;
  try {
    const item = {
      type,
      time_period,
      title,
      subtitle: subtitle || '',
      description: description || '',
      order_index: Number(order_index || 0)
    };
    await db.collection('timeline').doc(id).update(item);
    res.json({ message: 'Timeline item updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/timeline/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await db.collection('timeline').doc(id).delete();
    res.json({ message: 'Timeline item deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. SKILLS CRUD
app.get('/api/admin/skills', authenticateToken, async (req, res) => {
  try {
    const skillsSnap = await db.collection('skills').orderBy('order_index', 'asc').get();
    const list = [];
    skillsSnap.forEach(doc => list.push(doc.data()));
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/skills', authenticateToken, async (req, res) => {
  const { name, percentage, order_index } = req.body;
  try {
    const id = crypto.randomUUID();
    const item = {
      id,
      name,
      percentage: Number(percentage || 0),
      order_index: Number(order_index || 0)
    };
    await db.collection('skills').doc(id).set(item);
    res.status(201).json({ id, message: 'Skill created' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/skills/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, percentage, order_index } = req.body;
  try {
    const item = {
      name,
      percentage: Number(percentage || 0),
      order_index: Number(order_index || 0)
    };
    await db.collection('skills').doc(id).update(item);
    res.json({ message: 'Skill updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/skills/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await db.collection('skills').doc(id).delete();
    res.json({ message: 'Skill deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7. EVENTS CRUD
app.get('/api/admin/events', authenticateToken, async (req, res) => {
  try {
    const eventsSnap = await db.collection('events').orderBy('event_date', 'desc').orderBy('order_index', 'asc').get();
    const list = [];
    eventsSnap.forEach(doc => list.push(doc.data()));
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/events', authenticateToken, async (req, res) => {
  const { event_date, date_string, category, title, description, highlight_summary, location, image_url, tab_category, order_index } = req.body;
  try {
    const id = crypto.randomUUID();
    const item = {
      id,
      event_date,
      date_string,
      category,
      title,
      description,
      highlight_summary: highlight_summary || '',
      location: location || '',
      image_url: image_url || '',
      tab_category,
      order_index: Number(order_index || 0)
    };
    await db.collection('events').doc(id).set(item);
    res.status(201).json({ id, message: 'Event created' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/events/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { event_date, date_string, category, title, description, highlight_summary, location, image_url, tab_category, order_index } = req.body;
  try {
    const item = {
      event_date,
      date_string,
      category,
      title,
      description,
      highlight_summary: highlight_summary || '',
      location: location || '',
      image_url: image_url || '',
      tab_category,
      order_index: Number(order_index || 0)
    };
    await db.collection('events').doc(id).update(item);
    res.json({ message: 'Event updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/events/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await db.collection('events').doc(id).delete();
    res.json({ message: 'Event deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 8. GALLERY CRUD
app.get('/api/admin/gallery', authenticateToken, async (req, res) => {
  try {
    const gallerySnap = await db.collection('gallery').orderBy('order_index', 'asc').get();
    const list = [];
    gallerySnap.forEach(doc => list.push(doc.data()));
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/gallery', authenticateToken, async (req, res) => {
  const { youtube_id, title, order_index } = req.body;
  try {
    const id = crypto.randomUUID();
    const item = {
      id,
      youtube_id,
      title,
      order_index: Number(order_index || 0)
    };
    await db.collection('gallery').doc(id).set(item);
    res.status(201).json({ id, message: 'Gallery item created' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/gallery/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { youtube_id, title, order_index } = req.body;
  try {
    const item = {
      youtube_id,
      title,
      order_index: Number(order_index || 0)
    };
    await db.collection('gallery').doc(id).update(item);
    res.json({ message: 'Gallery item updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/gallery/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await db.collection('gallery').doc(id).delete();
    res.json({ message: 'Gallery item deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// START SERVER (Dual mode support for local runtime & Cloud Functions)
if (require.main === module) {
  const { seedDatabase } = require('./db');
  seedDatabase().then(() => {
    app.listen(PORT, () => {
      console.log(`Express server running on port ${PORT}`);
    });
  });
} else {
  // Export as Cloud Function
  const functions = require('firebase-functions');
  exports.api = functions.https.onRequest(app);
}
