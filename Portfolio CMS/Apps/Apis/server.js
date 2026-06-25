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
const STORAGE_BUCKET = process.env.FIREBASE_STORAGE_BUCKET || `${PROJECT_ID}.firebasestorage.app`;

// Initialize Firebase Admin SDK
if (admin.apps.length === 0) {
  admin.initializeApp({
    projectId: PROJECT_ID,
    storageBucket: STORAGE_BUCKET
  });
}

const db = admin.firestore();

// Pre-built theme presets
const THEME_PRESETS = {
  deep_space: {
    colors: {
      primary_accent: '325, 100%, 58%',
      secondary_accent: '180, 100%, 48%',
      background: '#0c071d',
      text_primary: '#ffffff',
      text_secondary: '#c8bde0'
    },
    typography: { display_font: 'Outfit', body_font: 'Inter' },
    effects: { glass_intensity: 'medium', show_glow_blobs: true, show_particles: true, card_border_radius: 24 },
    active_preset: 'deep_space'
  },
  ocean_night: {
    colors: {
      primary_accent: '200, 100%, 55%',
      secondary_accent: '170, 85%, 45%',
      background: '#0a1628',
      text_primary: '#ffffff',
      text_secondary: '#b0c4de'
    },
    typography: { display_font: 'Space Grotesk', body_font: 'DM Sans' },
    effects: { glass_intensity: 'medium', show_glow_blobs: true, show_particles: true, card_border_radius: 24 },
    active_preset: 'ocean_night'
  },
  sakura: {
    colors: {
      primary_accent: '340, 82%, 62%',
      secondary_accent: '300, 60%, 70%',
      background: '#1a0a14',
      text_primary: '#fff0f5',
      text_secondary: '#d4a0b8'
    },
    typography: { display_font: 'Playfair Display', body_font: 'Nunito' },
    effects: { glass_intensity: 'high', show_glow_blobs: true, show_particles: true, card_border_radius: 28 },
    active_preset: 'sakura'
  },
  sunset: {
    colors: {
      primary_accent: '25, 95%, 55%',
      secondary_accent: '45, 100%, 52%',
      background: '#1a0e05',
      text_primary: '#ffffff',
      text_secondary: '#d4b896'
    },
    typography: { display_font: 'Sora', body_font: 'Roboto' },
    effects: { glass_intensity: 'medium', show_glow_blobs: true, show_particles: false, card_border_radius: 20 },
    active_preset: 'sunset'
  },
  forest: {
    colors: {
      primary_accent: '145, 70%, 45%',
      secondary_accent: '50, 80%, 55%',
      background: '#0a150d',
      text_primary: '#f0fff0',
      text_secondary: '#a8c8a8'
    },
    typography: { display_font: 'Montserrat', body_font: 'Source Sans 3' },
    effects: { glass_intensity: 'low', show_glow_blobs: true, show_particles: false, card_border_radius: 16 },
    active_preset: 'forest'
  },
  minimal_light: {
    colors: {
      primary_accent: '250, 60%, 55%',
      secondary_accent: '210, 50%, 50%',
      background: '#f8f9fa',
      text_primary: '#1a1a2e',
      text_secondary: '#4a4a6a'
    },
    typography: { display_font: 'Poppins', body_font: 'Lato' },
    effects: { glass_intensity: 'low', show_glow_blobs: false, show_particles: false, card_border_radius: 12 },
    active_preset: 'minimal_light'
  }
};

// Middlewares
app.use(cors());
app.use(express.json());

// Set up public static uploads route (local fallback)
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

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
    
    // Self-seed database on first request if empty or migrate if old structure exists
    let needsMigration = false;
    const translatableProfileKeys = ['hero_title', 'hero_subtitle', 'hero_description', 'about_bio_p1', 'about_bio_p2', 'personal_quote', 'meta_title', 'meta_description'];
    profileSnap.forEach(doc => {
      if (translatableProfileKeys.includes(doc.id) && typeof doc.data().value === 'string') {
        needsMigration = true;
      }
    });

    if (profileSnap.empty || needsMigration) {
      const { seedDatabase, migrateToLocales } = require('./db');
      if (profileSnap.empty) {
        console.log('Database empty. Running self-seeding routine...');
        await seedDatabase();
      } else {
        console.log('Database contains old string format. Running automatic migration...');
        await migrateToLocales();
      }
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

    // Fetch theme settings
    const themeSnap = await db.collection('theme_settings').doc('current').get();
    let theme = null;
    if (themeSnap.exists) {
      theme = themeSnap.data();
    } else {
      theme = THEME_PRESETS.deep_space;
    }

    res.json({ profile, timeline, skills, events, gallery, theme });
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

// 2c. TRANSLATION ROUTE (FREE AUTO-TRANSLATE)
app.post('/api/admin/translate', authenticateToken, async (req, res) => {
  const { text, from, to } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Text to translate is required' });
  }

  try {
    const sourceLang = from || 'vi';
    const targetLang = to || 'en';
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Google Translate API returned status ${response.status}`);
    }

    const data = await response.json();
    let translatedText = '';
    if (data && data[0]) {
      data[0].forEach(item => {
        if (item && item[0]) {
          translatedText += item[0];
        }
      });
    }

    if (!translatedText) {
      throw new Error('Could not parse translated text from Google API response');
    }

    res.json({ translatedText });
  } catch (error) {
    console.error('Translation failed:', error);
    res.status(500).json({ error: `Translation failed: ${error.message}` });
  }
});

// 3. ADMIN PROFILE UPDATE
app.put('/api/admin/profile', authenticateToken, async (req, res) => {
  const profileData = req.body;
  try {
    const batch = db.batch();
    Object.entries(profileData).forEach(([k, v]) => {
      const ref = db.collection('profile_info').doc(k);
      batch.set(ref, { value: v });
    });
    await batch.commit();
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/upload', authenticateToken, (req, res) => {
  upload.single('image')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    const uniqueFilename = `${crypto.randomUUID()}${path.extname(req.file.originalname)}`;

    try {
      const bucket = admin.storage().bucket();
      const fileRef = bucket.file(`uploads/${uniqueFilename}`);
      const downloadToken = crypto.randomUUID();

      // Save to Firebase Storage bucket with custom metadata download token
      await fileRef.save(req.file.buffer, {
        metadata: {
          contentType: req.file.mimetype,
          metadata: {
            firebaseStorageDownloadTokens: downloadToken
          }
        }
      });

      // Construct public download URL using downloadToken
      const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(`uploads/${uniqueFilename}`)}?alt=media&token=${downloadToken}`;
      res.json({ image_url: publicUrl });
    } catch (uploadError) {
      console.warn('Firebase Storage upload failed, falling back to local storage:', uploadError.message);
      
      try {
        // Save to local filesystem
        const localUploadsDir = path.join(__dirname, 'public/uploads');
        fs.mkdirSync(localUploadsDir, { recursive: true });
        
        const localFilePath = path.join(localUploadsDir, uniqueFilename);
        fs.writeFileSync(localFilePath, req.file.buffer);
        
        // Return local relative URL (served via express.static on /uploads)
        res.json({ image_url: `/uploads/${uniqueFilename}` });
      } catch (localError) {
        console.error('Local file write failed:', localError);
        res.status(500).json({ error: `Image upload failed on both cloud and local storage: ${localError.message}` });
      }
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
      time_period: time_period || { vi: '', en: '' },
      title: title || { vi: '', en: '' },
      subtitle: subtitle || { vi: '', en: '' },
      description: description || { vi: '', en: '' },
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
      time_period: time_period || { vi: '', en: '' },
      title: title || { vi: '', en: '' },
      subtitle: subtitle || { vi: '', en: '' },
      description: description || { vi: '', en: '' },
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
      name: name || { vi: '', en: '' },
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
      name: name || { vi: '', en: '' },
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
      date_string: date_string || { vi: '', en: '' },
      category: category || { vi: '', en: '' },
      title: title || { vi: '', en: '' },
      description: description || { vi: '', en: '' },
      highlight_summary: highlight_summary || { vi: '', en: '' },
      location: location || { vi: '', en: '' },
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
      date_string: date_string || { vi: '', en: '' },
      category: category || { vi: '', en: '' },
      title: title || { vi: '', en: '' },
      description: description || { vi: '', en: '' },
      highlight_summary: highlight_summary || { vi: '', en: '' },
      location: location || { vi: '', en: '' },
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

// 9. THEME SETTINGS

// Pre-built theme presets - moved to top

// GET current theme (public — no auth)
app.get('/api/theme', async (req, res) => {
  try {
    const themeDoc = await db.collection('theme_settings').doc('current').get();
    if (themeDoc.exists) {
      res.json(themeDoc.data());
    } else {
      // Return default preset if no theme saved yet
      res.json(THEME_PRESETS.deep_space);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET all presets (public — for admin UI preset picker)
app.get('/api/theme/presets', async (req, res) => {
  res.json(THEME_PRESETS);
});

// PUT save theme (admin only)
app.put('/api/admin/theme', authenticateToken, async (req, res) => {
  const themeData = req.body;
  try {
    // Validate required fields
    if (!themeData.colors || !themeData.typography || !themeData.effects) {
      return res.status(400).json({ error: 'Theme must include colors, typography, and effects.' });
    }
    await db.collection('theme_settings').doc('current').set(themeData);
    res.json({ message: 'Theme saved successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


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
