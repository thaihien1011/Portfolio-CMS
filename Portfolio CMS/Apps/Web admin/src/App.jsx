import React, { useState, useEffect } from 'react';
import './App.css';

const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000'
  : '';

const getFullAssetUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_URL}${url}`;
};

function App() {
  const [token, setToken] = useState(localStorage.getItem('portfolio_admin_token') || '');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Dashboard navigation
  const [activePanel, setActivePanel] = useState('profile'); // 'profile' | 'timeline' | 'skills' | 'events' | 'gallery'
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentUser, setCurrentUser] = useState(localStorage.getItem('portfolio_admin_username') || '');

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

  useEffect(() => {
    if (token) {
      fetchCMSData();
      fetchUsers();
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
      }
    } catch (err) {}
  };

  const handleLogout = () => {
    localStorage.removeItem('portfolio_admin_token');
    localStorage.removeItem('portfolio_admin_username');
    setToken('');
    setCurrentUser('');
    setPortfolioData({ profile: {}, timeline: [], skills: [], events: [], gallery: [] });
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

  // --- Image Upload Handler ---
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      setError('');
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
      // Update form image reference path
      setEventsForm(prev => ({ ...prev, image_url: result.image_url }));
      setSuccess('Image uploaded successfully.');
    } catch (err) {
      setError(`Image upload error: ${err.message}`);
    }
  };

  // --- CRUD ACTION HANDLERS ---

  const openCreateModal = (type) => {
    setModalType(type);
    setModalMode('create');
    setCurrentItemId(null);
    setModalOpen(true);
    
    // Reset forms to defaults
    if (type === 'timeline') setTimelineForm({ type: 'education', time_period: '', title: '', subtitle: '', description: '', order_index: 0 });
    if (type === 'skills') setSkillsForm({ name: '', percentage: 80, order_index: 0 });
    if (type === 'events') setEventsForm({ event_date: '', date_string: '', category: '', title: '', description: '', highlight_summary: '', location: '', image_url: '', tab_category: 'science', order_index: 0 });
    if (type === 'gallery') setGalleryForm({ youtube_id: '', title: '', order_index: 0 });
    if (type === 'users') setUsersForm({ username: '', password: '' });
  };

  const openEditModal = (type, item) => {
    setModalType(type);
    setModalMode('edit');
    setCurrentItemId(item.id);
    setModalOpen(true);
    
    // Populate form states
    if (type === 'timeline') setTimelineForm({ ...item });
    if (type === 'skills') setSkillsForm({ ...item });
    if (type === 'events') setEventsForm({ ...item });
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
              <div className="form-group">
                <label className="form-label">Hero Banner Title</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={profileForm.hero_title || ''} 
                  onChange={e => setProfileForm({ ...profileForm, hero_title: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Hero Subtitle</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={profileForm.hero_subtitle || ''} 
                  onChange={e => setProfileForm({ ...profileForm, hero_subtitle: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Hero Description</label>
                <textarea 
                  className="form-control" 
                  value={profileForm.hero_description || ''} 
                  onChange={e => setProfileForm({ ...profileForm, hero_description: e.target.value })}
                />
              </div>
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
                <label className="form-label">About Biography - Paragraph 1</label>
                <textarea 
                  className="form-control" 
                  value={profileForm.about_bio_p1 || ''} 
                  onChange={e => setProfileForm({ ...profileForm, about_bio_p1: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">About Biography - Paragraph 2</label>
                <textarea 
                  className="form-control" 
                  value={profileForm.about_bio_p2 || ''} 
                  onChange={e => setProfileForm({ ...profileForm, about_bio_p2: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Highlight Quote</label>
                <textarea 
                  className="form-control" 
                  value={profileForm.personal_quote || ''} 
                  onChange={e => setProfileForm({ ...profileForm, personal_quote: e.target.value })}
                />
              </div>

              <h3 style={{ margin: '40px 0 20px 0', color: 'var(--color-pink)' }}>Metadata & Communication</h3>
              <div className="form-group">
                <label className="form-label">Browser Window Title (SEO Meta)</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={profileForm.meta_title || ''} 
                  onChange={e => setProfileForm({ ...profileForm, meta_title: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Browser Description (SEO Meta)</label>
                <textarea 
                  className="form-control" 
                  value={profileForm.meta_description || ''} 
                  onChange={e => setProfileForm({ ...profileForm, meta_description: e.target.value })}
                />
              </div>
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
                    <td>{item.time_period}</td>
                    <td>{item.title}</td>
                    <td>{item.subtitle || '-'}</td>
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
                    <td><strong>{item.name}</strong></td>
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
                    <td>{item.date_string}</td>
                    <td><span style={{ color: 'var(--color-cyan)', fontSize: '13px' }}>{item.tab_category}</span></td>
                    <td><strong>{item.title}</strong></td>
                    <td>{item.category}</td>
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
                  <th>YouTube ID</th>
                  <th>Video Title</th>
                  <th>Order</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {portfolioData.gallery.map(item => (
                  <tr key={item.id}>
                    <td><span style={{ color: 'var(--color-cyan)' }}>{item.youtube_id}</span></td>
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
                  <div className="form-group">
                    <label className="form-label">Time Period</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. 2024 - Hiện tại or Grade 3 Piano" 
                      value={timelineForm.time_period || ''}
                      onChange={e => setTimelineForm({ ...timelineForm, time_period: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Title / Board</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. Học sinh, Associated Board, etc." 
                      value={timelineForm.title || ''}
                      onChange={e => setTimelineForm({ ...timelineForm, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Subtitle / Organisation</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. Amazing Music Center or WASS" 
                      value={timelineForm.subtitle || ''}
                      onChange={e => setTimelineForm({ ...timelineForm, subtitle: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Bullet Description (Use newlines for bullets)</label>
                    <textarea 
                      className="form-control" 
                      placeholder="e.g. * Hỗ trợ giáo viên&#13;* Thị phạm chơi đàn"
                      value={timelineForm.description || ''}
                      onChange={e => setTimelineForm({ ...timelineForm, description: e.target.value })}
                    />
                  </div>
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
                  <div className="form-group">
                    <label className="form-label">Skill Name</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={skillsForm.name || ''}
                      onChange={e => setSkillsForm({ ...skillsForm, name: e.target.value })}
                      required
                    />
                  </div>
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
                  <div className="form-group">
                    <label className="form-label">Display Date Title</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. 05/2026 or 2025" 
                      value={eventsForm.date_string || ''}
                      onChange={e => setEventsForm({ ...eventsForm, date_string: e.target.value })}
                      required
                    />
                  </div>
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
                  <div className="form-group">
                    <label className="form-label">Category Title Label</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. Tournament or Music Performance" 
                      value={eventsForm.category || ''}
                      onChange={e => setEventsForm({ ...eventsForm, category: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Event/Award Title</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={eventsForm.title || ''}
                      onChange={e => setEventsForm({ ...eventsForm, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Highlight Summary (Single-sentence award tab highlight)</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Use **bold** highlights. Defaults to Title if empty."
                      value={eventsForm.highlight_summary || ''}
                      onChange={e => setEventsForm({ ...eventsForm, highlight_summary: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Description (Timeline body paragraph)</label>
                    <textarea 
                      className="form-control" 
                      value={eventsForm.description || ''}
                      onChange={e => setEventsForm({ ...eventsForm, description: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Location (Optional)</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. Kay Bailey Hutchison Convention Center..." 
                      value={eventsForm.location || ''}
                      onChange={e => setEventsForm({ ...eventsForm, location: e.target.value })}
                    />
                  </div>
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
                        <input type="file" accept="image/*" onChange={handleImageUpload} />
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
                    <label className="form-label">YouTube 11-char ID</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. dQw4w9WgXcQ"
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
    </div>
  );
}

export default App;
