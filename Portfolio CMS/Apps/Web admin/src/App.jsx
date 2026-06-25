import React, { useState, useEffect } from 'react';
import './App.css';

const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000'
  : '';

const DEFAULT_THEME = {
  colors: { primary_accent: '325, 100%, 58%', secondary_accent: '180, 100%, 48%', background: '#0c071d', text_primary: '#ffffff', text_secondary: '#c8bde0' },
  typography: { display_font: 'Outfit', body_font: 'Inter' },
  effects: { glass_intensity: 'medium', show_glow_blobs: true, show_particles: true, card_border_radius: 24 },
  active_preset: 'deep_space'
};

const PRESET_META = [
  { key: 'deep_space', label: '🌌 Deep Space', desc: 'Purple + pink/cyan neon' },
  { key: 'ocean_night', label: '🌊 Ocean Night', desc: 'Navy + teal/blue' },
  { key: 'sakura', label: '🌸 Sakura', desc: 'Cherry blossom pink' },
  { key: 'sunset', label: '🔥 Sunset', desc: 'Warm orange/amber' },
  { key: 'forest', label: '🍀 Forest', desc: 'Emerald + gold' },
  { key: 'minimal_light', label: '⚪ Minimal Light', desc: 'Clean light mode' }
];

const DISPLAY_FONTS = ['Outfit', 'Playfair Display', 'Space Grotesk', 'Poppins', 'Montserrat', 'Sora'];
const BODY_FONTS = ['Inter', 'Roboto', 'DM Sans', 'Nunito', 'Source Sans 3', 'Lato'];

const getFullAssetUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_URL}${url}`;
};

const renderLocale = (field) => {
  if (!field) return '';
  if (typeof field === 'object') {
    return field.vi || field.en || '';
  }
  return String(field);
};

function TranslatableField({ label, value, onChange, type = 'text', placeholder = '', apiCall, setError, setSuccess }) {
  const [translating, setTranslating] = React.useState(false);

  const valVi = typeof value === 'object' && value ? (value.vi || '') : (value || '');
  const valEn = typeof value === 'object' && value ? (value.en || '') : (value || '');

  const handleViChange = (e) => {
    onChange({ vi: e.target.value, en: valEn });
  };

  const handleEnChange = (e) => {
    onChange({ vi: valVi, en: e.target.value });
  };

  const triggerTranslate = async () => {
    if (!valVi) return;
    setTranslating(true);
    try {
      const res = await apiCall('/api/admin/translate', {
        method: 'POST',
        body: JSON.stringify({ text: valVi, from: 'vi', to: 'en' })
      });
      if (res && res.translatedText) {
        onChange({ vi: valVi, en: res.translatedText });
        if (setSuccess) setSuccess('Auto-translated successfully!');
      }
    } catch (err) {
      setError(`Auto-translation error: ${err.message}`);
    } finally {
      setTranslating(false);
    }
  };

  return (
    <div className="translatable-field-container" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '8px', 
      marginBottom: '16px', 
      padding: '12px', 
      background: 'rgba(255, 255, 255, 0.02)', 
      borderRadius: '12px', 
      border: '1px solid rgba(255, 255, 255, 0.05)' 
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label className="form-label" style={{ fontWeight: '600', marginBottom: 0 }}>{label}</label>
        <button 
          type="button" 
          onClick={triggerTranslate} 
          disabled={translating || !valVi}
          className="btn-secondary"
          style={{ 
            fontSize: '11px', 
            padding: '3px 8px', 
            cursor: !valVi ? 'not-allowed' : 'pointer', 
            opacity: !valVi ? 0.5 : 1, 
            display: 'flex', 
            alignItems: 'center', 
            gap: '4px', 
            background: 'linear-gradient(135deg, rgba(236,72,153,0.1), rgba(139,92,246,0.1))', 
            border: '1px solid rgba(236,72,153,0.3)', 
            borderRadius: '6px', 
            color: '#fff' 
          }}
        >
          {translating ? 'Translating...' : '✨ Auto-translate VI to EN'}
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '4px' }}>Tiếng Việt (VI)</span>
          {type === 'textarea' ? (
            <textarea
              className="form-control"
              value={valVi}
              onChange={handleViChange}
              placeholder={placeholder}
              rows="3"
            />
          ) : (
            <input
              type="text"
              className="form-control"
              value={valVi}
              onChange={handleViChange}
              placeholder={placeholder}
            />
          )}
        </div>
        <div>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '4px' }}>English (EN)</span>
          {type === 'textarea' ? (
            <textarea
              className="form-control"
              value={valEn}
              onChange={handleEnChange}
              placeholder={placeholder}
              rows="3"
            />
          ) : (
            <input
              type="text"
              className="form-control"
              value={valEn}
              onChange={handleEnChange}
              placeholder={placeholder}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function App() {
  const [token, setToken] = useState(localStorage.getItem('portfolio_admin_token') || '');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Dashboard navigation
  const [activePanel, setActivePanel] = useState('profile'); // 'profile' | 'timeline' | 'skills' | 'events' | 'gallery'
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentUser, setCurrentUser] = useState(localStorage.getItem('portfolio_admin_username') || '');

  // Custom Toast notifications manager
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  useEffect(() => {
    if (success) {
      addToast(success, 'success');
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      addToast(error, 'error');
    }
  }, [error]);

  // Main portfolio data (for rendering tables and inputs)
  const [portfolioData, setPortfolioData] = useState({
    profile: {},
    timeline: [],
    skills: [],
    events: [],
    gallery: []
  });

  // Modal forms states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(''); // 'timeline' | 'skills' | 'events' | 'gallery'
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [currentItemId, setCurrentItemId] = useState(null);

  // Form local states
  const [profileForm, setProfileForm] = useState({});
  const [timelineForm, setTimelineForm] = useState({ type: 'education', time_period: '', title: '', subtitle: '', description: '', order_index: 0 });
  const [skillsForm, setSkillsForm] = useState({ name: '', percentage: 80, order_index: 0 });
  const [eventsForm, setEventsForm] = useState({ event_date: '', date_string: '', category: '', title: '', description: '', highlight_summary: '', location: '', image_url: '', tab_category: 'science', order_index: 0 });
  const [galleryForm, setGalleryForm] = useState({ youtube_id: '', title: '', order_index: 0 });
  const [usersList, setUsersList] = useState([]);
  const [usersForm, setUsersForm] = useState({ username: '', password: '' });

  // Theme state
  const [themeForm, setThemeForm] = useState(JSON.parse(JSON.stringify(DEFAULT_THEME)));
  const [themePresets, setThemePresets] = useState({});

  // Handle API Fetch wrapper with automatic auth error interception
  const apiCall = async (endpoint, options = {}) => {
    setError('');
    setSuccess('');
    
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
      
      // Auto handle token expiration or unauthorized access on admin endpoints
      if ((response.status === 401 || response.status === 403) && endpoint.startsWith('/api/admin')) {
        handleLogout();
        throw new Error('Session expired. Please log in again.');
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error ${response.status}`);
      }
      
      return await response.json().catch(() => ({}));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Fetch all CMS database data when logged in
  const fetchCMSData = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/portfolio`);
      if (res.ok) {
        const json = await res.json();
        setPortfolioData(json);
        setProfileForm(json.profile || {});
      }
    } catch (err) {
      setError('Could not fetch portfolio database. Verify server is running.');
    }
  };

  const fetchUsers = async () => {
    if (!token) return;
    try {
      const res = await apiCall('/api/admin/users');
      setUsersList(res || []);
    } catch (err) {
      console.error('Could not fetch users list:', err.message);
    }
  };

  const fetchTheme = async () => {
    try {
      const res = await fetch(`${API_URL}/api/theme`);
      if (res.ok) {
        const data = await res.json();
        setThemeForm(data);
      }
    } catch (err) {
      console.error('Could not fetch theme:', err.message);
    }
  };

  const fetchPresets = async () => {
    try {
      const res = await fetch(`${API_URL}/api/theme/presets`);
      if (res.ok) {
        const data = await res.json();
        setThemePresets(data);
      }
    } catch (err) {
      console.error('Could not fetch presets:', err.message);
    }
  };

  const saveTheme = async () => {
    try {
      await apiCall('/api/admin/theme', {
        method: 'PUT',
        body: JSON.stringify(themeForm)
      });
      setSuccess('Theme saved successfully! Public site will reflect changes on next visit.');
    } catch (err) {}
  };

  const applyPreset = (presetKey) => {
    const preset = themePresets[presetKey];
    if (preset) {
      setThemeForm(JSON.parse(JSON.stringify(preset)));
    }
  };

  const resetTheme = () => {
    setThemeForm(JSON.parse(JSON.stringify(DEFAULT_THEME)));
  };

  useEffect(() => {
    if (token) {
      fetchCMSData();
      fetchUsers();
      fetchTheme();
      fetchPresets();
    }
  }, [token]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) return setError('Username and password are required.');
    try {
      const res = await apiCall('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });
      if (res.token) {
        localStorage.setItem('portfolio_admin_token', res.token);
        localStorage.setItem('portfolio_admin_username', res.username);
        setToken(res.token);
        setCurrentUser(res.username);
        setUsername('');
        setPassword('');
        setSuccess('Logged in successfully!');
      }
    } catch (err) {}
  };

  const handleLogout = () => {
    localStorage.removeItem('portfolio_admin_token');
    localStorage.removeItem('portfolio_admin_username');
    setToken('');
    setCurrentUser('');
    setPortfolioData({ profile: {}, timeline: [], skills: [], events: [], gallery: [] });
    setSuccess('Logged out successfully.');
  };

  // --- Profile Settings save handler ---
  const saveProfileSettings = async (e) => {
    e.preventDefault();
    try {
      await apiCall('/api/admin/profile', {
        method: 'PUT',
        body: JSON.stringify(profileForm)
      });
      setSuccess('Profile settings updated successfully!');
      fetchCMSData();
    } catch (err) {}
  };

  // --- Reusable Image Upload Helper ---
  const uploadImageFile = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await fetch(`${API_URL}/api/admin/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Upload failed');
    }

    const result = await response.json();
    return result.image_url;
  };

  const handleEventImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setError('');
      setSuccess('');
      const imageUrl = await uploadImageFile(file);
      setEventsForm(prev => ({ ...prev, image_url: imageUrl }));
      setSuccess('Event cover image uploaded successfully.');
    } catch (err) {
      setError(`Image upload error: ${err.message}`);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setError('');
      setSuccess('');
      const imageUrl = await uploadImageFile(file);
      setProfileForm(prev => ({ ...prev, avatar: imageUrl }));
      setSuccess('Avatar image uploaded successfully.');
    } catch (err) {
      setError(`Avatar upload error: ${err.message}`);
    }
  };

  // --- CRUD ACTION HANDLERS ---

  const openCreateModal = (type) => {
    setModalType(type);
    setModalMode('create');
    setCurrentItemId(null);
    setModalOpen(true);
    
    // Reset forms to defaults
    if (type === 'timeline') setTimelineForm({ type: 'education', time_period: { vi: '', en: '' }, title: { vi: '', en: '' }, subtitle: { vi: '', en: '' }, description: { vi: '', en: '' }, order_index: 0 });
    if (type === 'skills') setSkillsForm({ name: { vi: '', en: '' }, percentage: 80, order_index: 0 });
    if (type === 'events') setEventsForm({ event_date: '', date_string: { vi: '', en: '' }, category: { vi: '', en: '' }, title: { vi: '', en: '' }, description: { vi: '', en: '' }, highlight_summary: { vi: '', en: '' }, location: { vi: '', en: '' }, image_url: '', tab_category: 'science', order_index: 0 });
    if (type === 'gallery') setGalleryForm({ youtube_id: '', title: '', order_index: 0 });
    if (type === 'users') setUsersForm({ username: '', password: '' });
  };

  const openEditModal = (type, item) => {
    setModalType(type);
    setModalMode('edit');
    setCurrentItemId(item.id);
    setModalOpen(true);
    
    const normalize = (field) => typeof field === 'object' && field ? field : { vi: field || '', en: field || '' };
    
    // Populate form states
    if (type === 'timeline') setTimelineForm({ 
      ...item,
      time_period: normalize(item.time_period),
      title: normalize(item.title),
      subtitle: normalize(item.subtitle),
      description: normalize(item.description)
    });
    if (type === 'skills') setSkillsForm({ 
      ...item,
      name: normalize(item.name)
    });
    if (type === 'events') setEventsForm({ 
      ...item,
      date_string: normalize(item.date_string),
      category: normalize(item.category),
      title: normalize(item.title),
      description: normalize(item.description),
      highlight_summary: normalize(item.highlight_summary),
      location: normalize(item.location)
    });
    if (type === 'gallery') setGalleryForm({ ...item });
    if (type === 'users') setUsersForm({ username: item.username, password: '' });
  };

  const deleteItem = async (type, id) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this item? This action cannot be undone.');
    if (!confirmDelete) return;

    try {
      await apiCall(`/api/admin/${type}/${id}`, {
        method: 'DELETE'
      });
      setSuccess('Item deleted successfully.');
      fetchCMSData();
      if (type === 'users') fetchUsers();
    } catch (err) {}
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    let bodyData;
    if (modalType === 'timeline') bodyData = timelineForm;
    if (modalType === 'skills') bodyData = skillsForm;
    if (modalType === 'events') bodyData = eventsForm;
    if (modalType === 'gallery') bodyData = galleryForm;
    if (modalType === 'users') {
      bodyData = { username: usersForm.username };
      if (usersForm.password) {
        bodyData.password = usersForm.password;
      }
    }

    const method = modalMode === 'create' ? 'POST' : 'PUT';
    const endpoint = modalMode === 'create' ? `/api/admin/${modalType}` : `/api/admin/${modalType}/${currentItemId}`;

    try {
      await apiCall(endpoint, {
        method: method,
        body: JSON.stringify(bodyData)
      });
      setSuccess(`Item ${modalMode === 'create' ? 'created' : 'updated'} successfully.`);
      setModalOpen(false);
      fetchCMSData();
      if (modalType === 'users') fetchUsers();
    } catch (err) {}
  };

  // --- RENDER LOGIN VIEW ---
  if (!token) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-logo">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7z"/><path d="M5 20h14"/></svg>
            <span>Portfolio CMS</span>
          </div>

          <h2 className="auth-title">Admin Login</h2>
          <p className="auth-subtitle">Enter credentials to manage portfolio databases</p>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input 
                type="text" 
                className="form-control" 
                value={username}
                onChange={e => setUsername(e.target.value)} 
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input 
                type="password" 
                className="form-control" 
                value={password}
                onChange={e => setPassword(e.target.value)} 
                required 
              />
            </div>
            <button type="submit" className="auth-btn">
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- RENDER DASHBOARD LAYOUT ---
  return (
    <div className="dashboard-container">
      {/* Sidebar Navigation */}
      <nav className="sidebar">
        <div className="sidebar-brand">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7z"/><path d="M5 20h14"/></svg>
          <span>Portfolio CMS</span>
        </div>
        <div className="sidebar-user">
          Logged in as: <strong>{currentUser}</strong>
        </div>
        <ul className="sidebar-menu">
          <li className={`menu-item ${activePanel === 'profile' ? 'active' : ''}`}>
            <button onClick={() => setActivePanel('profile')}>Profile Details</button>
          </li>
          <li className={`menu-item ${activePanel === 'timeline' ? 'active' : ''}`}>
            <button onClick={() => setActivePanel('timeline')}>Timeline (Edu/Exp)</button>
          </li>
          <li className={`menu-item ${activePanel === 'skills' ? 'active' : ''}`}>
            <button onClick={() => setActivePanel('skills')}>Skills Meter</button>
          </li>
          <li className={`menu-item ${activePanel === 'events' ? 'active' : ''}`}>
            <button onClick={() => setActivePanel('events')}>Events & Awards</button>
          </li>
          <li className={`menu-item ${activePanel === 'gallery' ? 'active' : ''}`}>
            <button onClick={() => setActivePanel('gallery')}>Behind the Scenes</button>
          </li>
          <li className={`menu-item ${activePanel === 'theme' ? 'active' : ''}`}>
            <button onClick={() => setActivePanel('theme')}>Theme Settings</button>
          </li>
          <li className={`menu-item ${activePanel === 'users' ? 'active' : ''}`}>
            <button onClick={() => setActivePanel('users')}>Manage Accounts</button>
          </li>
        </ul>
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>Sign Out</button>
        </div>
      </nav>

      {/* Main Panel Workspace */}
      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">
            {activePanel === 'profile' && 'General Profile & Meta Configuration'}
            {activePanel === 'timeline' && 'Timeline Configuration'}
            {activePanel === 'skills' && 'Skills Configuration'}
            {activePanel === 'events' && 'Events & Awards Configuration'}
            {activePanel === 'gallery' && 'Video Gallery Configuration'}
            {activePanel === 'theme' && 'Theme & Appearance Settings'}
            {activePanel === 'users' && 'User Accounts Configuration'}
          </h1>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {/* PROFILE SETTINGS VIEW */}
        {activePanel === 'profile' && (
          <div className="panel-card">
            <form onSubmit={saveProfileSettings}>
              <h3 style={{ marginBottom: '20px', color: 'var(--color-pink)' }}>Hero Section</h3>
              <TranslatableField 
                label="Hero Banner Title"
                value={profileForm.hero_title}
                onChange={val => setProfileForm({ ...profileForm, hero_title: val })}
                apiCall={apiCall}
                setError={setError}
                setSuccess={setSuccess}
              />
              <TranslatableField 
                label="Hero Subtitle"
                value={profileForm.hero_subtitle}
                onChange={val => setProfileForm({ ...profileForm, hero_subtitle: val })}
                apiCall={apiCall}
                setError={setError}
                setSuccess={setSuccess}
              />
              <TranslatableField 
                label="Hero Description"
                type="textarea"
                value={profileForm.hero_description}
                onChange={val => setProfileForm({ ...profileForm, hero_description: val })}
                apiCall={apiCall}
                setError={setError}
                setSuccess={setSuccess}
              />
              <div className="form-group">
                <label className="form-label">Hero Background Image URL</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={profileForm.hero_bg_image || ''} 
                  onChange={e => setProfileForm({ ...profileForm, hero_bg_image: e.target.value })}
                />
              </div>

              <h3 style={{ margin: '40px 0 20px 0', color: 'var(--color-pink)' }}>About Me Section</h3>
              <div className="form-group">
                <label className="form-label">Upload Profile Avatar (About Me Image)</label>
                <div className="upload-widget">
                  {profileForm.avatar && (
                    <div 
                      className="upload-preview" 
                      style={{ backgroundImage: `url('${getFullAssetUrl(profileForm.avatar)}')` }}
                    ></div>
                  )}
                  <div className="upload-btn-wrapper">
                    <button className="btn-secondary" type="button">Upload File</button>
                    <input type="file" accept="image/*" onChange={handleAvatarUpload} />
                  </div>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Or input image URL" 
                    style={{ flex: 1 }}
                    value={profileForm.avatar || ''}
                    onChange={e => setProfileForm({ ...profileForm, avatar: e.target.value })}
                  />
                </div>
              </div>
              <TranslatableField 
                label="About Biography - Paragraph 1"
                type="textarea"
                value={profileForm.about_bio_p1}
                onChange={val => setProfileForm({ ...profileForm, about_bio_p1: val })}
                apiCall={apiCall}
                setError={setError}
                setSuccess={setSuccess}
              />
              <TranslatableField 
                label="About Biography - Paragraph 2"
                type="textarea"
                value={profileForm.about_bio_p2}
                onChange={val => setProfileForm({ ...profileForm, about_bio_p2: val })}
                apiCall={apiCall}
                setError={setError}
                setSuccess={setSuccess}
              />
              <TranslatableField 
                label="Highlight Quote"
                type="textarea"
                value={profileForm.personal_quote}
                onChange={val => setProfileForm({ ...profileForm, personal_quote: val })}
                apiCall={apiCall}
                setError={setError}
                setSuccess={setSuccess}
              />

              <h3 style={{ margin: '40px 0 20px 0', color: 'var(--color-pink)' }}>Metadata & Communication</h3>
              <TranslatableField 
                label="Browser Window Title (SEO Meta)"
                value={profileForm.meta_title}
                onChange={val => setProfileForm({ ...profileForm, meta_title: val })}
                apiCall={apiCall}
                setError={setError}
                setSuccess={setSuccess}
              />
              <TranslatableField 
                label="Browser Description (SEO Meta)"
                type="textarea"
                value={profileForm.meta_description}
                onChange={val => setProfileForm({ ...profileForm, meta_description: val })}
                apiCall={apiCall}
                setError={setError}
                setSuccess={setSuccess}
              />
              <div className="form-group">
                <label className="form-label">Contact Destination Email</label>
                <input 
                  type="email" 
                  className="form-control" 
                  value={profileForm.contact_email || ''} 
                  onChange={e => setProfileForm({ ...profileForm, contact_email: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Instagram Link</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={profileForm.instagram_url || ''} 
                  onChange={e => setProfileForm({ ...profileForm, instagram_url: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Facebook Link</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={profileForm.facebook_url || ''} 
                  onChange={e => setProfileForm({ ...profileForm, facebook_url: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">TikTok Link</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={profileForm.tiktok_url || ''} 
                  onChange={e => setProfileForm({ ...profileForm, tiktok_url: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Threads Link</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={profileForm.threads_url || ''} 
                  onChange={e => setProfileForm({ ...profileForm, threads_url: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">YouTube Link</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={profileForm.youtube_url || ''} 
                  onChange={e => setProfileForm({ ...profileForm, youtube_url: e.target.value })}
                />
              </div>

              <button type="submit" className="btn-primary" style={{ marginTop: '20px' }}>Save General Settings</button>
            </form>
          </div>
        )}

        {/* TIMELINE LIST VIEW */}
        {activePanel === 'timeline' && (
          <div className="panel-card">
            <div className="data-header">
              <h3 style={{ color: 'var(--color-pink)' }}>Timeline Cards</h3>
              <button className="btn-primary" onClick={() => openCreateModal('timeline')}>Add New Item</button>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Period</th>
                  <th>Title</th>
                  <th>Subtitle</th>
                  <th>Order</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {portfolioData.timeline.map(item => (
                  <tr key={item.id}>
                    <td><span className="form-label" style={{ marginBottom: 0, color: 'var(--color-cyan)' }}>{item.type}</span></td>
                    <td>{renderLocale(item.time_period)}</td>
                    <td>{renderLocale(item.title)}</td>
                    <td>{renderLocale(item.subtitle) || '-'}</td>
                    <td>{item.order_index}</td>
                    <td className="action-buttons">
                      <button className="btn-edit" onClick={() => openEditModal('timeline', item)}>Edit</button>
                      <button className="btn-delete" onClick={() => deleteItem('timeline', item.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* SKILLS LIST VIEW */}
        {activePanel === 'skills' && (
          <div className="panel-card">
            <div className="data-header">
              <h3 style={{ color: 'var(--color-pink)' }}>Skills Levels</h3>
              <button className="btn-primary" onClick={() => openCreateModal('skills')}>Add New Skill</button>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Skill Name</th>
                  <th>Percentage</th>
                  <th>Order</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {portfolioData.skills.map(item => (
                  <tr key={item.id}>
                    <td><strong>{renderLocale(item.name)}</strong></td>
                    <td>{item.percentage}%</td>
                    <td>{item.order_index}</td>
                    <td className="action-buttons">
                      <button className="btn-edit" onClick={() => openEditModal('skills', item)}>Edit</button>
                      <button className="btn-delete" onClick={() => deleteItem('skills', item.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* EVENTS LIST VIEW */}
        {activePanel === 'events' && (
          <div className="panel-card">
            <div className="data-header">
              <h3 style={{ color: 'var(--color-pink)' }}>Event Logs & Achievements</h3>
              <button className="btn-primary" onClick={() => openCreateModal('events')}>Add New Event</button>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date string</th>
                  <th>Tab Categories</th>
                  <th>Title</th>
                  <th>Category label</th>
                  <th>Order</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {portfolioData.events.map(item => (
                  <tr key={item.id}>
                    <td>{renderLocale(item.date_string)}</td>
                    <td><span style={{ color: 'var(--color-cyan)', fontSize: '13px' }}>{item.tab_category}</span></td>
                    <td><strong>{renderLocale(item.title)}</strong></td>
                    <td>{renderLocale(item.category)}</td>
                    <td>{item.order_index}</td>
                    <td className="action-buttons">
                      <button className="btn-edit" onClick={() => openEditModal('events', item)}>Edit</button>
                      <button className="btn-delete" onClick={() => deleteItem('events', item.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* GALLERY LIST VIEW */}
        {activePanel === 'gallery' && (
          <div className="panel-card">
            <div className="data-header">
              <h3 style={{ color: 'var(--color-pink)' }}>Behind the Scenes Playlists</h3>
              <button className="btn-primary" onClick={() => openCreateModal('gallery')}>Add New Video</button>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Video Link / ID</th>
                  <th>Video Title</th>
                  <th>Order</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {portfolioData.gallery.map(item => (
                  <tr key={item.id}>
                    <td>
                      <span 
                        style={{ color: 'var(--color-cyan)', cursor: 'help' }} 
                        title={item.youtube_id}
                      >
                        {item.youtube_id && item.youtube_id.length > 30 
                          ? item.youtube_id.substring(0, 27) + '...'
                          : item.youtube_id}
                      </span>
                    </td>
                    <td>{item.title}</td>
                    <td>{item.order_index}</td>
                    <td className="action-buttons">
                      <button className="btn-edit" onClick={() => openEditModal('gallery', item)}>Edit</button>
                      <button className="btn-delete" onClick={() => deleteItem('gallery', item.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* THEME SETTINGS VIEW */}
        {activePanel === 'theme' && (
          <div className="panel-card">
            {/* Section A: Preset Themes */}
            <h3 style={{ color: 'var(--color-pink)', marginBottom: '16px' }}>Quick Presets</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px', marginBottom: '36px' }}>
              {PRESET_META.map(p => (
                <button
                  key={p.key}
                  onClick={() => applyPreset(p.key)}
                  style={{
                    background: themeForm.active_preset === p.key
                      ? 'linear-gradient(135deg, rgba(236,72,153,0.25), rgba(139,92,246,0.25))'
                      : 'rgba(255,255,255,0.04)',
                    border: themeForm.active_preset === p.key
                      ? '2px solid rgba(236,72,153,0.6)'
                      : '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '14px',
                    padding: '16px 14px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                    color: '#fff'
                  }}
                >
                  <div style={{ fontSize: '1.3rem', marginBottom: '6px' }}>{p.label}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>{p.desc}</div>
                  {themePresets[p.key] && (
                    <div style={{ display: 'flex', gap: '4px', marginTop: '10px' }}>
                      {['primary_accent', 'secondary_accent'].map(c => (
                        <div key={c} style={{
                          width: '20px', height: '20px', borderRadius: '50%',
                          background: `hsl(${themePresets[p.key].colors[c]})`,
                          border: '2px solid rgba(255,255,255,0.15)'
                        }} />
                      ))}
                      <div style={{
                        width: '20px', height: '20px', borderRadius: '50%',
                        background: themePresets[p.key].colors.background,
                        border: '2px solid rgba(255,255,255,0.15)'
                      }} />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Section B: Color Palette */}
            <h3 style={{ color: 'var(--color-pink)', marginBottom: '16px' }}>Color Palette</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginBottom: '36px' }}>
              {[
                { key: 'primary_accent', label: 'Primary Accent', hint: 'Buttons, links, gradients (HSL values)', isHsl: true },
                { key: 'secondary_accent', label: 'Secondary Accent', hint: 'Subtitles, highlights (HSL values)', isHsl: true },
                { key: 'background', label: 'Background Color', hint: 'Page background (hex)', isHsl: false },
                { key: 'text_primary', label: 'Text Primary', hint: 'Main text color (hex)', isHsl: false },
                { key: 'text_secondary', label: 'Text Secondary', hint: 'Body text color (hex)', isHsl: false }
              ].map(c => (
                <div key={c.key} className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">{c.label}</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                      background: c.isHsl ? `hsl(${themeForm.colors?.[c.key] || ''})` : (themeForm.colors?.[c.key] || '#000'),
                      border: '2px solid rgba(255,255,255,0.15)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                    }} />
                    <input
                      type="text"
                      className="form-control"
                      placeholder={c.hint}
                      value={themeForm.colors?.[c.key] || ''}
                      onChange={e => setThemeForm(prev => ({
                        ...prev,
                        colors: { ...prev.colors, [c.key]: e.target.value },
                        active_preset: 'custom'
                      }))}
                      style={{ flex: 1 }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Section C: Typography */}
            <h3 style={{ color: 'var(--color-pink)', marginBottom: '16px' }}>Typography</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginBottom: '36px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Display Font (Headings, Nav)</label>
                <select
                  className="form-control"
                  style={{ background: 'rgba(0,0,0,0.5)' }}
                  value={themeForm.typography?.display_font || 'Outfit'}
                  onChange={e => setThemeForm(prev => ({
                    ...prev,
                    typography: { ...prev.typography, display_font: e.target.value },
                    active_preset: 'custom'
                  }))}
                >
                  {DISPLAY_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Body Font (Paragraphs)</label>
                <select
                  className="form-control"
                  style={{ background: 'rgba(0,0,0,0.5)' }}
                  value={themeForm.typography?.body_font || 'Inter'}
                  onChange={e => setThemeForm(prev => ({
                    ...prev,
                    typography: { ...prev.typography, body_font: e.target.value },
                    active_preset: 'custom'
                  }))}
                >
                  {BODY_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            </div>

            {/* Section D: Visual Effects */}
            <h3 style={{ color: 'var(--color-pink)', marginBottom: '16px' }}>Visual Effects</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginBottom: '36px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Glass Effect Intensity</label>
                <select
                  className="form-control"
                  style={{ background: 'rgba(0,0,0,0.5)' }}
                  value={themeForm.effects?.glass_intensity || 'medium'}
                  onChange={e => setThemeForm(prev => ({
                    ...prev,
                    effects: { ...prev.effects, glass_intensity: e.target.value },
                    active_preset: 'custom'
                  }))}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Card Border Radius ({themeForm.effects?.card_border_radius || 24}px)</label>
                <input
                  type="range"
                  min="4"
                  max="32"
                  className="form-control"
                  value={themeForm.effects?.card_border_radius || 24}
                  onChange={e => setThemeForm(prev => ({
                    ...prev,
                    effects: { ...prev.effects, card_border_radius: Number(e.target.value) },
                    active_preset: 'custom'
                  }))}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  <input
                    type="checkbox"
                    checked={themeForm.effects?.show_glow_blobs ?? true}
                    onChange={e => setThemeForm(prev => ({
                      ...prev,
                      effects: { ...prev.effects, show_glow_blobs: e.target.checked },
                      active_preset: 'custom'
                    }))}
                    style={{ width: '18px', height: '18px', accentColor: 'hsl(325, 100%, 58%)' }}
                  />
                  Show Ambient Glow Blobs
                </label>
              </div>
              <div className="form-group" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  <input
                    type="checkbox"
                    checked={themeForm.effects?.show_particles ?? true}
                    onChange={e => setThemeForm(prev => ({
                      ...prev,
                      effects: { ...prev.effects, show_particles: e.target.checked },
                      active_preset: 'custom'
                    }))}
                    style={{ width: '18px', height: '18px', accentColor: 'hsl(325, 100%, 58%)' }}
                  />
                  Show Floating Particles
                </label>
              </div>
            </div>

            {/* Section E: Actions */}
            <div style={{ display: 'flex', gap: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <button className="btn-primary" onClick={saveTheme} style={{ flex: 1 }}>Save Theme</button>
              <button className="btn-secondary" onClick={resetTheme}>Reset to Default</button>
            </div>
          </div>
        )}

        {/* USERS LIST VIEW */}
        {activePanel === 'users' && (
          <div className="panel-card">
            <div className="data-header">
              <h3 style={{ color: 'var(--color-pink)' }}>User Accounts</h3>
              <button className="btn-primary" onClick={() => openCreateModal('users')}>Add New User</button>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map(item => (
                  <tr key={item.id}>
                    <td><strong>{item.username}</strong></td>
                    <td>{item.created_at ? new Date(item.created_at).toLocaleString('vi-VN') : '-'}</td>
                    <td className="action-buttons">
                      <button className="btn-edit" onClick={() => openEditModal('users', item)}>Change Password</button>
                      {item.username !== currentUser ? (
                        <button className="btn-delete" onClick={() => deleteItem('users', item.id)}>Delete</button>
                      ) : (
                        <button className="btn-delete" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} title="You cannot delete yourself">Delete</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* --- DASHBOARD ENTRY FORMS IN DIALOG MODALS --- */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">
              {modalMode === 'create' ? 'Create New ' : 'Edit '}
              {modalType === 'timeline' && 'Timeline Item'}
              {modalType === 'skills' && 'Skill Indicator'}
              {modalType === 'events' && 'Event log / Award'}
              {modalType === 'gallery' && 'Video Link'}
              {modalType === 'users' && 'User Account'}
            </h2>
            <form onSubmit={handleModalSubmit}>
              {/* TIMELINE FORM */}
              {modalType === 'timeline' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Classification Type</label>
                    <select 
                      className="form-control" 
                      style={{ background: 'rgba(0,0,0,0.5)' }}
                      value={timelineForm.type}
                      onChange={e => setTimelineForm({ ...timelineForm, type: e.target.value })}
                    >
                      <option value="education">Hành trình Học tập (Education)</option>
                      <option value="certification">Chứng chỉ Đạt được (Certification)</option>
                      <option value="experience">Kinh nghiệm thực tiễn (Experience)</option>
                    </select>
                  </div>
                  <TranslatableField 
                    label="Time Period"
                    value={timelineForm.time_period}
                    onChange={val => setTimelineForm({ ...timelineForm, time_period: val })}
                    placeholder="e.g. 2024 - Hiện tại / Grade 3 Piano"
                    apiCall={apiCall}
                    setError={setError}
                    setSuccess={setSuccess}
                  />
                  <TranslatableField 
                    label="Title / Board"
                    value={timelineForm.title}
                    onChange={val => setTimelineForm({ ...timelineForm, title: val })}
                    placeholder="e.g. Học sinh / Associated Board..."
                    apiCall={apiCall}
                    setError={setError}
                    setSuccess={setSuccess}
                  />
                  <TranslatableField 
                    label="Subtitle / Organisation"
                    value={timelineForm.subtitle}
                    onChange={val => setTimelineForm({ ...timelineForm, subtitle: val })}
                    placeholder="e.g. Amazing Music Center or WASS"
                    apiCall={apiCall}
                    setError={setError}
                    setSuccess={setSuccess}
                  />
                  <TranslatableField 
                    label="Bullet Description (Use newlines for bullets)"
                    type="textarea"
                    value={timelineForm.description}
                    onChange={val => setTimelineForm({ ...timelineForm, description: val })}
                    placeholder="e.g. * Hỗ trợ giáo viên&#13;* Thị phạm chơi đàn"
                    apiCall={apiCall}
                    setError={setError}
                    setSuccess={setSuccess}
                  />
                  <div className="form-group">
                    <label className="form-label">Sort Weight (Order Index)</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={timelineForm.order_index}
                      onChange={e => setTimelineForm({ ...timelineForm, order_index: e.target.value })}
                    />
                  </div>
                </>
              )}

              {/* SKILLS FORM */}
              {modalType === 'skills' && (
                <>
                  <TranslatableField 
                    label="Skill Name"
                    value={skillsForm.name}
                    onChange={val => setSkillsForm({ ...skillsForm, name: val })}
                    placeholder="e.g. Kỹ năng giao tiếp"
                    apiCall={apiCall}
                    setError={setError}
                    setSuccess={setSuccess}
                  />
                  <div className="form-group">
                    <label className="form-label">Percentage Level ({skillsForm.percentage}%)</label>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      className="form-control" 
                      value={skillsForm.percentage}
                      onChange={e => setSkillsForm({ ...skillsForm, percentage: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Sort Weight (Order Index)</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={skillsForm.order_index}
                      onChange={e => setSkillsForm({ ...skillsForm, order_index: e.target.value })}
                    />
                  </div>
                </>
              )}

              {/* EVENTS FORM */}
              {modalType === 'events' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Sort Date (Format: YYYY-MM)</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. 2026-05" 
                      value={eventsForm.event_date || ''}
                      onChange={e => setEventsForm({ ...eventsForm, event_date: e.target.value })}
                      required
                    />
                  </div>
                  <TranslatableField 
                    label="Display Date Title"
                    value={eventsForm.date_string}
                    onChange={val => setEventsForm({ ...eventsForm, date_string: val })}
                    placeholder="e.g. 05/2026 or 2025"
                    apiCall={apiCall}
                    setError={setError}
                    setSuccess={setSuccess}
                  />
                  <div className="form-group">
                    <label className="form-label">Tag Category tabs (Comma separated)</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. science,awards or arts" 
                      value={eventsForm.tab_category || ''}
                      onChange={e => setEventsForm({ ...eventsForm, tab_category: e.target.value })}
                      required
                    />
                  </div>
                  <TranslatableField 
                    label="Category Title Label"
                    value={eventsForm.category}
                    onChange={val => setEventsForm({ ...eventsForm, category: val })}
                    placeholder="e.g. Tournament or Music Performance"
                    apiCall={apiCall}
                    setError={setError}
                    setSuccess={setSuccess}
                  />
                  <TranslatableField 
                    label="Event/Award Title"
                    value={eventsForm.title}
                    onChange={val => setEventsForm({ ...eventsForm, title: val })}
                    placeholder="e.g. VEX IQ MS World Championship 2026"
                    apiCall={apiCall}
                    setError={setError}
                    setSuccess={setSuccess}
                  />
                  <TranslatableField 
                    label="Highlight Summary (Single-sentence award tab highlight)"
                    value={eventsForm.highlight_summary}
                    onChange={val => setEventsForm({ ...eventsForm, highlight_summary: val })}
                    placeholder="Use **bold** highlights. Defaults to Title if empty."
                    apiCall={apiCall}
                    setError={setError}
                    setSuccess={setSuccess}
                  />
                  <TranslatableField 
                    label="Description (Timeline body paragraph)"
                    type="textarea"
                    value={eventsForm.description}
                    onChange={val => setEventsForm({ ...eventsForm, description: val })}
                    placeholder="Event detailed description..."
                    apiCall={apiCall}
                    setError={setError}
                    setSuccess={setSuccess}
                  />
                  <TranslatableField 
                    label="Location (Optional)"
                    value={eventsForm.location}
                    onChange={val => setEventsForm({ ...eventsForm, location: val })}
                    placeholder="e.g. Dallas, Texas, USA"
                    apiCall={apiCall}
                    setError={setError}
                    setSuccess={setSuccess}
                  />
                  <div className="form-group">
                    <label className="form-label">Upload Event cover image</label>
                    <div className="upload-widget">
                      {eventsForm.image_url && (
                        <div 
                          className="upload-preview" 
                          style={{ backgroundImage: `url('${getFullAssetUrl(eventsForm.image_url)}')` }}
                        ></div>
                      )}
                      <div className="upload-btn-wrapper">
                        <button className="btn-secondary" type="button">Upload File</button>
                        <input type="file" accept="image/*" onChange={handleEventImageUpload} />
                      </div>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Or input image URL" 
                        style={{ flex: 1 }}
                        value={eventsForm.image_url || ''}
                        onChange={e => setEventsForm({ ...eventsForm, image_url: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Sort Weight (Order Index)</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={eventsForm.order_index}
                      onChange={e => setEventsForm({ ...eventsForm, order_index: e.target.value })}
                    />
                  </div>
                </>
              )}

              {/* GALLERY FORM */}
              {modalType === 'gallery' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Video Title</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={galleryForm.title || ''}
                      onChange={e => setGalleryForm({ ...galleryForm, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Video URL or YouTube ID</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. YouTube/TikTok link or YouTube ID"
                      value={galleryForm.youtube_id || ''}
                      onChange={e => setGalleryForm({ ...galleryForm, youtube_id: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Sort Weight (Order Index)</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={galleryForm.order_index}
                      onChange={e => setGalleryForm({ ...galleryForm, order_index: e.target.value })}
                    />
                  </div>
                </>
              )}

              {/* USERS FORM */}
              {modalType === 'users' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Username</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={usersForm.username || ''}
                      onChange={e => setUsersForm({ ...usersForm, username: e.target.value })}
                      required
                      disabled={modalMode === 'edit'}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      {modalMode === 'create' ? 'Password' : 'New Password (leave blank to keep current)'}
                    </label>
                    <input 
                      type="password" 
                      className="form-control" 
                      value={usersForm.password || ''}
                      onChange={e => setUsersForm({ ...usersForm, password: e.target.value })}
                      required={modalMode === 'create'}
                    />
                  </div>
                </>
              )}

              <div className="modal-footer">
                <button className="btn-secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</button>
                <button className="btn-primary" type="submit">Submit Details</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Toast Notifications Overlay Container */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <span>{t.message}</span>
            <button 
              className="toast-close-btn" 
              onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
            >
              &times;
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
