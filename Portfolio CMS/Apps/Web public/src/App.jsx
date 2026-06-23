import React, { useState, useEffect } from 'react';
import fallbackData from './fallbackData.json';
import './style.css';
import './events.css';

// Base API URL
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000'
  : '';

function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('home'); // 'home' | 'events'
  const [activeVideoId, setActiveVideoId] = useState(null); // YouTube ID for Modal
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('awards'); // 'awards' | 'arts' | 'science' | 'shows'

  // Router listener using hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#events' || hash === '#/events') {
        setView('events');
        window.scrollTo(0, 0);
      } else {
        setView('home');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Run once on load

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // Dynamically load Bootstrap stylesheet only on Events view
  useEffect(() => {
    if (view === 'events') {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css';
      link.id = 'bootstrap-cdn';
      document.head.appendChild(link);
      return () => {
        const el = document.getElementById('bootstrap-cdn');
        if (el) el.remove();
      };
    }
  }, [view]);

  // Fetch portfolio data from backend with local fallback
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${API_URL}/api/portfolio`);
        if (!response.ok) throw new Error('API server returned error status');
        const resJson = await response.json();
        
        // Sanitize API inputs in case database tables are returned empty
        const mergedData = {
          profile: { ...fallbackData.profile, ...(resJson.profile || {}) },
          timeline: resJson.timeline && resJson.timeline.length ? resJson.timeline : fallbackData.timeline,
          skills: resJson.skills && resJson.skills.length ? resJson.skills : fallbackData.skills,
          events: resJson.events && resJson.events.length ? resJson.events : fallbackData.events,
          gallery: resJson.gallery && resJson.gallery.length ? resJson.gallery : fallbackData.gallery,
        };
        setData(mergedData);
      } catch (err) {
        console.warn('Backend API is unreachable. Falling back to local offline details.', err);
        setData(fallbackData);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Update document title and meta properties dynamically based on database profile info
  useEffect(() => {
    if (data && data.profile) {
      document.title = data.profile.meta_title || 'Nguyen Tra My | Student Portfolio';
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', data.profile.meta_description || '');
      }
    }
  }, [data]);

  if (loading) {
    return (
      <div className="loader-container">
        <div className="loader-spinner"></div>
        <div className="loader-text">Loading Trà My's Portfolio...</div>
      </div>
    );
  }

  const { profile, timeline, skills, events, gallery } = data;

  // Helper function to safely render descriptions as unordered bullet lists if markdown/newlines are used
  const renderFormattedDescription = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    const bulletLines = lines.filter(line => line.trim().startsWith('*') || line.trim().startsWith('-'));

    if (bulletLines.length > 0) {
      return (
        <ul>
          {lines.map((line, idx) => {
            const cleanLine = line.replace(/^[*\-]\s*/, '').trim();
            if (!cleanLine) return null;
            return <li key={idx}>{cleanLine}</li>;
          })}
        </ul>
      );
    }
    return <p>{text}</p>;
  };

  // Group events by year dynamically for Awards & Activities tab
  const getTabContent = (category) => {
    // Filter events matching the selected tab category (supports comma separation e.g. "science,awards")
    const filteredEvents = events.filter(evt => {
      const cats = evt.tab_category.split(',').map(c => c.trim().toLowerCase());
      return cats.includes(category.toLowerCase());
    });

    // Group items by year
    const groups = {};
    filteredEvents.forEach(evt => {
      let year = 'Khác';
      // Try to extract year from date_string (e.g. "05/2026" -> "2026") or event_date (e.g. "2026-05" -> "2026")
      if (evt.event_date && evt.event_date.match(/^\d{4}/)) {
        year = evt.event_date.substring(0, 4);
      } else if (evt.date_string && evt.date_string.match(/\d{4}$/)) {
        const matches = evt.date_string.match(/\d{4}$/);
        year = matches[0];
      } else if (evt.date_string && evt.date_string.match(/^\d{4}/)) {
        const matches = evt.date_string.match(/^\d{4}/);
        year = matches[0];
      }
      
      const groupKey = `Năm ${year}`;
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(evt);
    });

    // Sort group keys descending (e.g., Năm 2026, Năm 2025, etc.)
    const sortedKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));

    if (sortedKeys.length === 0) {
      return <div className="no-events-tab">Chưa có thông tin hoạt động trong mục này.</div>;
    }

    return (
      <div className="activities-grid">
        {sortedKeys.map(groupKey => (
          <div className="glass-panel activity-card" key={groupKey}>
            <h4>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" className="tab-card-icon"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34"/><path d="M12 2a4 4 0 0 0-4 4v8a4 4 0 0 0 8 0V6a4 4 0 0 0-4-4Z"/></svg>
              {groupKey}
            </h4>
            <ul className="activity-list">
              {groups[groupKey].map(evt => {
                const bulletText = evt.highlight_summary || evt.title;
                return (
                  <li key={evt.id} dangerouslySetInnerHTML={{ __html: bulletText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    );
  };

  // Helper for background image loading (checks for URL vs local uploads path)
  const getFullAssetUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${API_URL}${url}`;
  };

  // --- RENDER PORTFOLIO HOME VIEW ---
  if (view === 'home') {
    return (
      <div className="home-theme">
        {/* Glow Blobs */}
        <div className="glow-blob blob-purple" style={{ top: '8%', left: '3%' }}></div>
        <div className="glow-blob blob-blue" style={{ top: '28%', right: '5%' }}></div>
        <div className="glow-blob blob-pink" style={{ bottom: '12%', left: '8%' }}></div>

        {/* Header */}
        <header id="header">
          <div className="nav-container">
            <a href="#" className="logo">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-crown"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7z"/><path d="M5 20h14"/></svg>
              {profile.hero_title || 'Nguyen Tra My'}
            </a>
            <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle Menu">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
            </button>
            <ul className={`nav-links ${mobileMenuOpen ? 'mobile-open' : ''}`} id="navLinks">
              <li><a href="#" className="active" onClick={() => setMobileMenuOpen(false)}>Home</a></li>
              <li><a href="#about" onClick={() => setMobileMenuOpen(false)}>About</a></li>
              <li><a href="#education" onClick={() => setMobileMenuOpen(false)}>Timeline</a></li>
              <li><a href="#skills" onClick={() => setMobileMenuOpen(false)}>Skills</a></li>
              <li><a href="#activities" onClick={() => setMobileMenuOpen(false)}>Activities</a></li>
              <li><a href="#gallery" onClick={() => setMobileMenuOpen(false)}>Gallery</a></li>
              <li><a href="#events" onClick={() => setMobileMenuOpen(false)}>Events</a></li>
              <li><a href="#contact" onClick={() => setMobileMenuOpen(false)}>Contact</a></li>
            </ul>
          </div>
        </header>

        {/* Hero Section */}
        <section id="hero">
          <div 
            className="hero-bg-graphic" 
            style={{ backgroundImage: `url('${getFullAssetUrl(profile.hero_bg_image)}')` }}
          ></div>
          <div className="hero-content">
            <span className="hero-subtitle">{profile.hero_subtitle}</span>
            <div className="hero-title-container">
              <h1 className="hero-title text-glow-purple">{profile.hero_title}</h1>
            </div>
            <p className="hero-desc">{profile.hero_description}</p>
            <a href="#about" className="hero-btn">
              Khám Phá Bản Thân Mình
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </a>
          </div>
          <div className="scroll-down" id="scrollIndicator">
            <span>Scroll</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="section-wrapper">
          <div className="about-grid">
            <div className="about-image-container">
              <div className="about-image-frame">
                <img src={getFullAssetUrl(profile.avatar || '/avatar.jpg')} alt="Portrait" />
              </div>
              <div className="about-image-glow"></div>
            </div>
            <div className="about-text">
              <div className="section-title-container left">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style={{ color: 'hsl(var(--color-pink))' }}><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z"/></svg>
                <h2 className="section-title">About Me</h2>
              </div>
              <p className="about-bio">{profile.about_bio_p1}</p>
              <p className="about-bio">{profile.about_bio_p2}</p>
              <div className="quote-card">
                <p className="quote-text">{profile.personal_quote}</p>
                <span className="quote-author">— {profile.hero_title}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Timeline Section */}
        <section id="education" className="section-wrapper">
          <div className="section-title-container">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style={{ color: 'hsl(var(--color-pink))' }}><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10"/><path d="M6 10h10"/></svg>
            <h2 className="section-title">Education & Experience</h2>
          </div>

          <div className="split-grid">
            {/* Left Column: Education & Certs */}
            <div className="glass-panel split-card">
              <h3>
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style={{ color: 'hsl(var(--color-pink))' }}><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>
                Hành trình Học tập
              </h3>
              <div className="timeline">
                {timeline.filter(t => t.type === 'education').map(item => (
                  <div className="timeline-item" key={item.id}>
                    <div className="timeline-marker"></div>
                    <div className="timeline-time">{item.time_period}</div>
                    <div className="timeline-title">{item.title}</div>
                    <div className="timeline-subtitle">{item.subtitle}</div>
                    <div className="timeline-desc">{renderFormattedDescription(item.description)}</div>
                  </div>
                ))}
              </div>

              <h3 style={{ marginTop: '36px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style={{ color: 'hsl(var(--color-pink))' }}><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
                Chứng chỉ Đạt được
              </h3>
              <div className="timeline" style={{ borderLeft: 'none', marginLeft: 0, paddingLeft: 0 }}>
                {timeline.filter(t => t.type === 'certification').map(item => (
                  <div className="timeline-item" style={{ marginBottom: 0 }} key={item.id}>
                    <div className="timeline-time" style={{ color: 'hsl(var(--color-cyan))' }}>{item.time_period}</div>
                    <div className="timeline-subtitle" style={{ marginBottom: '4px' }}>{item.title}</div>
                    <div className="timeline-desc">{renderFormattedDescription(item.description)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Experience */}
            <div className="glass-panel split-card">
              <h3>
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style={{ color: 'hsl(var(--color-pink))' }}><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                Kinh nghiệm thực tiễn
              </h3>
              <div className="timeline">
                {timeline.filter(t => t.type === 'experience').map(item => (
                  <div className="timeline-item" key={item.id}>
                    <div className="timeline-marker"></div>
                    <div className="timeline-time">{item.time_period}</div>
                    <div className="timeline-title">{item.title}</div>
                    <div className="timeline-subtitle">{item.subtitle}</div>
                    <div className="timeline-desc">{renderFormattedDescription(item.description)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Skills Section */}
        <section id="skills" class="section-wrapper">
          <div className="section-title-container">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style={{ color: 'hsl(var(--color-pink))' }}><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z"/></svg>
            <h2 className="section-title">Kỹ năng Thế mạnh</h2>
          </div>

          <div className="glass-panel" style={{ maxWidth: '800px', margin: '36px auto 0' }}>
            <div className="skills-container">
              {skills.map(skill => (
                <div className="skill-item" key={skill.id}>
                  <div className="skill-info">
                    <span>{skill.name}</span>
                    <span>{skill.percentage}%</span>
                  </div>
                  <div className="skill-bar-bg">
                    <div className="skill-bar-fill" style={{ width: `${skill.percentage}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Awards & Activities */}
        <section id="activities" className="section-wrapper">
          <div className="section-title-container">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style={{ color: 'hsl(var(--color-pink))' }}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34"/><path d="M12 2a4 4 0 0 0-4 4v8a4 4 0 0 0 8 0V6a4 4 0 0 0-4-4Z"/></svg>
            <h2 className="section-title">Awards & Activities</h2>
          </div>

          <div className="tabs-container">
            {/* Tabs Nav */}
            <div className="tabs-nav">
              <button className={`tab-btn ${activeTab === 'awards' ? 'active' : ''}`} onClick={() => setActiveTab('awards')}>🏆 Thành tích nổi bật</button>
              <button className={`tab-btn ${activeTab === 'arts' ? 'active' : ''}`} onClick={() => setActiveTab('arts')}>🎹 Hoạt động Nghệ thuật</button>
              <button className={`tab-btn ${activeTab === 'science' ? 'active' : ''}`} onClick={() => setActiveTab('science')}>🔬 Robot & Khoa học</button>
              <button className={`tab-btn ${activeTab === 'shows' ? 'active' : ''}`} onClick={() => setActiveTab('shows')}>📺 Truyền hình & Giải trí</button>
            </div>

            {/* Tab Content */}
            <div className="tab-content active">
              {getTabContent(activeTab)}
            </div>
          </div>
        </section>

        {/* Behind the Scenes Gallery */}
        <section id="gallery" className="section-wrapper">
          <div className="section-title-container">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style={{ color: 'hsl(var(--color-pink))' }}><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z"/></svg>
            <h2 className="section-title">Behind the Scenes 🎬</h2>
          </div>

          <div className="gallery-grid">
            {gallery.map(item => (
              <div className="gallery-card" key={item.id} onClick={() => setActiveVideoId(item.youtube_id)}>
                <div className="video-container">
                  <div 
                    className="video-placeholder" 
                    style={{ backgroundImage: `url('https://img.youtube.com/vi/${item.youtube_id}/hqdefault.jpg')` }}
                  >
                    <div className="play-btn">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    </div>
                  </div>
                </div>
                <h3>{item.title}</h3>
              </div>
            ))}
          </div>
        </section>

        {/* Contact Connect */}
        <section id="contact" className="section-wrapper">
          <div className="section-title-container">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style={{ color: 'hsl(var(--color-pink))' }}><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
            <h2 className="section-title">Let's Connect</h2>
          </div>

          <div className="glass-panel contact-card">
            <p className="contact-subtitle">Hành trình tiếp theo sẽ rất thú vị! Kết nối ngay để cùng nhau collab nhé! 📩</p>
            <p className="contact-text">Mình đang sống và học tập tại **TP. Hồ Chí Minh** và luôn sẵn sàng cho những ý tưởng nghệ thuật đột phá, những dự án khoa học công nghệ, hay những đợt cọ sát thi đấu robot VEX IQ mới! 💥</p>
            
            <div className="social-container">
              {profile.instagram_url && (
                <a href={profile.instagram_url} target="_blank" rel="noopener noreferrer" className="social-btn btn-instagram" aria-label="Instagram">
                  <i className="fa fa-instagram"></i>
                </a>
              )}
              {profile.facebook_url && (
                <a href={profile.facebook_url} target="_blank" rel="noopener noreferrer" className="social-btn btn-facebook" aria-label="Facebook">
                  <i className="fa fa-facebook"></i>
                </a>
              )}
              {profile.threads_url && (
                <a href={profile.threads_url} target="_blank" rel="noopener noreferrer" className="social-btn btn-threads" aria-label="Threads">
                  <i className="fa fa-at"></i>
                </a>
              )}
              {profile.tiktok_url && (
                <a href={profile.tiktok_url} target="_blank" rel="noopener noreferrer" className="social-btn btn-tiktok" aria-label="TikTok">
                  <i className="fa fa-music"></i>
                </a>
              )}
              {profile.youtube_url && (
                <a href={profile.youtube_url} target="_blank" rel="noopener noreferrer" className="social-btn btn-youtube" aria-label="YouTube">
                  <i className="fa fa-youtube-play"></i>
                </a>
              )}
              {profile.contact_email && (
                <a href={`mailto:${profile.contact_email}`} className="social-btn btn-instagram" style={{ borderColor: 'rgba(236,72,153,0.3)', background: 'rgba(236,72,153,0.05)' }} aria-label="Email">
                  <i className="fa fa-envelope-o"></i>
                </a>
              )}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer>
          <p>© 2026 {profile.hero_title}. My rules, My world 💜</p>
        </footer>

        {/* YouTube Video Modal Dialog */}
        {activeVideoId && (
          <div className="video-modal-overlay" onClick={() => setActiveVideoId(null)}>
            <div className="video-modal-content" onClick={e => e.stopPropagation()}>
              <button className="video-modal-close" onClick={() => setActiveVideoId(null)} aria-label="Close Modal">&times;</button>
              <div className="video-modal-iframe-wrapper">
                <iframe 
                  src={`https://www.youtube.com/embed/${activeVideoId}?autoplay=1`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- RENDER DETAILED EVENTS CHRONOLOGICAL VIEW ---
  return (
    <div className="events-theme">
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark fixed-top">
        <div className="container">
          <a className="navbar-brand" href="#">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" className="logo-icon"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7z"/><path d="M5 20h14"/></svg>
            {profile.hero_title}
          </a>
          <button className="navbar-toggler" type="button" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-controls="navbarResponsive" aria-expanded="false" aria-label="Toggle navigation">
            <i className="fa fa-bars"></i>
          </button>
          <div className={`collapse navbar-collapse ${mobileMenuOpen ? 'show' : ''}`} id="navbarResponsive">
            <ul className="navbar-nav ms-auto text-uppercase">
              <li className="nav-item"><a className="nav-link" href="#" onClick={() => setMobileMenuOpen(false)}>Home</a></li>
              <li className="nav-item"><a className="nav-link" href="#about" onClick={() => setMobileMenuOpen(false)}>About</a></li>
              <li className="nav-item"><a className="nav-link" href="#education" onClick={() => setMobileMenuOpen(false)}>Timeline</a></li>
              <li className="nav-item"><a className="nav-link" href="#skills" onClick={() => setMobileMenuOpen(false)}>Skills</a></li>
              <li className="nav-item"><a className="nav-link" href="#activities" onClick={() => setMobileMenuOpen(false)}>Activities</a></li>
              <li className="nav-item"><a className="nav-link" href="#gallery" onClick={() => setMobileMenuOpen(false)}>Gallery</a></li>
              <li className="nav-item"><a className="nav-link active" href="#events" onClick={() => setMobileMenuOpen(false)}>Events</a></li>
              <li className="nav-item"><a className="nav-link" href="#contact" onClick={() => setMobileMenuOpen(false)}>Contact</a></li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Header */}
      <header className="masthead" style={{ background: `url('${getFullAssetUrl(events.length && events[0].image_url ? events[0].image_url : '/events_hero_bg.png')}') center/cover no-repeat` }}>
        <div className="container">
          <div className="intro-text">
            <h1 className="tntn-title">EVENTS</h1>
            <div className="intro-lead-in">Robotics & Performing Arts Portfolio</div>
          </div>
        </div>
      </header>

      {/* Events List */}
      <section className="events-section">
        <div className="container">
          <div className="events-container">
            {events.map(item => (
              <div className="card" key={item.id}>
                <div className="card-date-badge">
                  <i className="fa fa-calendar-o"></i> {item.date_string}
                </div>
                {item.image_url && (
                  <img className="card-img" src={getFullAssetUrl(item.image_url)} alt={item.title} />
                )}
                <div className="card-body">
                  <p className="card-category">{item.category}</p>
                  <h2 className="card-title">{item.title}</h2>
                  <p className="card-text">{item.description}</p>
                  {item.location && (
                    <div className="card-location">
                      <i className="fa fa-map-marker"></i> {item.location}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Collaboration banner */}
      <section className="sponsors-section">
        <div className="container">
          <h2 className="section-title">Collaboration & Contact</h2>
          <p className="sponsors-desc">
            Bạn muốn cộng tác hoặc tài trợ cho các dự án VEX IQ Robotics hoặc các buổi biểu diễn nghệ thuật sắp tới? Hãy gửi email trực tiếp cho Trà My tại:
            <br />
            <a href={`mailto:${profile.contact_email}`}>{profile.contact_email}</a>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <div className="container">
          <div className="row align-items-center">
            <div className="col-md-4 copyright">
              <span>Copyright © {profile.hero_title} 2026</span>
            </div>
            <div className="col-md-4">
              <ul className="social-buttons">
                {profile.instagram_url && <li><a href={profile.instagram_url} target="_blank" aria-label="Instagram"><i className="fa fa-instagram"></i></a></li>}
                {profile.tiktok_url && <li><a href={profile.tiktok_url} target="_blank" aria-label="TikTok"><i className="fa fa-music"></i></a></li>}
                {profile.threads_url && <li><a href={profile.threads_url} target="_blank" aria-label="Threads"><i className="fa fa-at"></i></a></li>}
                {profile.facebook_url && <li><a href={profile.facebook_url} target="_blank" aria-label="Facebook"><i className="fa fa-facebook"></i></a></li>}
                {profile.youtube_url && <li><a href={profile.youtube_url} target="_blank" aria-label="YouTube"><i className="fa fa-youtube-play"></i></a></li>}
              </ul>
            </div>
            <div className="col-md-4 credits">
              <span>My rules, My world 💜</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
