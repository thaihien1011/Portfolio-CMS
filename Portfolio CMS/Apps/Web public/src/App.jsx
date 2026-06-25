import React, { useState, useEffect } from 'react';
import fallbackData from './fallbackData.json';
import './style.css';
import './events.css';

// Base API URL
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000'
  : '';

function parseVideoInput(input) {
  if (!input) return { type: 'unknown', id: '', embedUrl: '', thumbnailUrl: '' };
  const str = input.trim();

  // 1. TikTok URL
  const tiktokRegex = /tiktok\.com\/@[\w.-]+\/video\/(\d+)/;
  const tiktokMatch = str.match(tiktokRegex);
  if (tiktokMatch) {
    const videoId = tiktokMatch[1];
    return {
      type: 'tiktok',
      id: videoId,
      embedUrl: `https://www.tiktok.com/embed/v2/${videoId}`,
      thumbnailUrl: ''
    };
  }

  // 2. YouTube URL or 11-char ID
  let youtubeId = '';
  if (str.length === 11 && !str.includes('/') && !str.includes('.')) {
    youtubeId = str;
  } else {
    const ytRegexes = [
      /[?&]v=([^&\s]+)/,
      /youtu\.be\/([^?\s]+)/,
      /youtube\.com\/embed\/([^?\s]+)/,
      /youtube-nocookie\.com\/embed\/([^?\s]+)/
    ];
    for (const regex of ytRegexes) {
      const match = str.match(regex);
      if (match) {
        youtubeId = match[1];
        break;
      }
    }
  }

  if (youtubeId) {
    return {
      type: 'youtube',
      id: youtubeId,
      embedUrl: `https://www.youtube.com/embed/${youtubeId}?autoplay=1`,
      thumbnailUrl: `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`
    };
  }

  if (str.startsWith('http://') || str.startsWith('https://')) {
    return {
      type: 'general',
      id: str,
      embedUrl: str,
      thumbnailUrl: ''
    };
  }

  return {
    type: 'unknown',
    id: str,
    embedUrl: '',
    thumbnailUrl: ''
  };
}

function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('home'); // 'home' | 'events'
  const [activeVideoId, setActiveVideoId] = useState(null); // YouTube ID for Modal
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('awards'); // 'awards' | 'arts' | 'science' | 'shows'
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('portfolio_lang') || 'vi';
  });

  useEffect(() => {
    localStorage.setItem('portfolio_lang', language);
  }, [language]);

  const uiTranslations = {
    vi: {
      navHome: 'Home',
      navAbout: 'About',
      navTimeline: 'Timeline',
      navSkills: 'Skills',
      navActivities: 'Activities',
      navGallery: 'Gallery',
      navEvents: 'Events',
      navContact: 'Contact',
      exploreBtn: 'Khám Phá Bản Thân Mình',
      aboutTitle: 'About Me',
      educationTitle: 'Education & Experience',
      eduSectionTitle: 'Hành trình Học tập',
      certSectionTitle: 'Chứng chỉ Đạt được',
      expSectionTitle: 'Kinh nghiệm thực tiễn',
      skillsTitle: 'Kỹ năng Thế mạnh',
      activitiesTitle: 'Awards & Activities',
      tabAwards: '🏆 Thành tích nổi bật',
      tabArts: '🎹 Hoạt động Nghệ thuật',
      tabScience: '🔬 Robot & Khoa học',
      tabShows: '📺 Truyền hình & Giải trí',
      galleryTitle: 'Behind the Scenes 🎬',
      contactTitle: 'Let\'s Connect',
      contactSubtitle: 'Hành trình tiếp theo sẽ rất thú vị! Kết nối ngay để cùng nhau collab nhé! 📩',
      contactText: 'Mình đang sống và học tập tại **TP. Hồ Chí Minh** và luôn sẵn sàng cho những ý tưởng nghệ thuật đột phá, những dự án khoa học công nghệ, hay những đợt cọ sát thi đấu robot VEX IQ mới! 💥',
      collabTitle: 'Collaboration & Contact',
      collabDesc: 'Bạn muốn cộng tác hoặc tài trợ cho các dự án VEX IQ Robotics hoặc các buổi biểu diễn nghệ thuật sắp tới? Hãy gửi email trực tiếp cho Trà My tại:',
      footerRules: 'My rules, My world 💜',
      noEvents: 'Chưa có thông tin hoạt động trong mục này.',
      eventSubtitle: 'Hồ sơ Robotics & Nghệ thuật biểu diễn',
      scroll: 'Scroll'
    },
    en: {
      navHome: 'Home',
      navAbout: 'About',
      navTimeline: 'Timeline',
      navSkills: 'Skills',
      navActivities: 'Activities',
      navGallery: 'Gallery',
      navEvents: 'Events',
      navContact: 'Contact',
      exploreBtn: 'Explore My World',
      aboutTitle: 'About Me',
      educationTitle: 'Education & Experience',
      eduSectionTitle: 'Educational Journey',
      certSectionTitle: 'Certifications',
      expSectionTitle: 'Practical Experience',
      skillsTitle: 'Core Strengths & Skills',
      activitiesTitle: 'Awards & Activities',
      tabAwards: '🏆 Outstanding Achievements',
      tabArts: '🎹 Performing Arts',
      tabScience: '🔬 Robotics & Science',
      tabShows: '📺 Media & Entertainment',
      galleryTitle: 'Behind the Scenes 🎬',
      contactTitle: 'Let\'s Connect',
      contactSubtitle: 'The next journey will be exciting! Connect now to collaborate! 📩',
      contactText: 'I live and study in **Ho Chi Minh City** and am always ready for groundbreaking artistic ideas, scientific projects, or new VEX IQ Robotics competitions! 💥',
      collabTitle: 'Collaboration & Contact',
      collabDesc: 'Want to collaborate or sponsor upcoming VEX IQ Robotics projects or art performances? Send an email directly to Tra My at:',
      footerRules: 'My rules, My world 💜',
      noEvents: 'No activities found in this category.',
      eventSubtitle: 'Robotics & Performing Arts Portfolio',
      scroll: 'Scroll'
    }
  };

  const tUI = (key) => {
    return uiTranslations[language]?.[key] || uiTranslations['vi']?.[key] || '';
  };

  const t = (field) => {
    if (!field) return '';
    if (typeof field === 'object') {
      return field[language] || field.vi || field.en || '';
    }
    return String(field);
  };


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
          theme: resJson.theme || null,
        };
        setData(mergedData);
      } catch (err) {
        console.warn('Backend API is unreachable. Falling back to local offline details.', err);
        setData({ ...fallbackData, theme: null });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Apply theme settings dynamically when loaded from API
  useEffect(() => {
    if (!data) return;
    
    // Helper to determine if a color is light
    const isColorLight = (hexColor) => {
      if (!hexColor || !hexColor.startsWith('#')) return false;
      const hex = hexColor.replace('#', '');
      if (hex.length !== 6) return false;
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness > 150; // true if light
    };

    // Current theme or fallback default
    const theme = data.theme || {
      colors: {
        primary_accent: '325, 100%, 58%',
        secondary_accent: '180, 100%, 48%',
        background: '#0c071d',
        text_primary: '#ffffff',
        text_secondary: '#c8bde0'
      },
      typography: { display_font: 'Outfit', body_font: 'Inter' },
      effects: { glass_intensity: 'medium', show_glow_blobs: true, show_particles: true, card_border_radius: 24 }
    };

    const root = document.documentElement;

    // 1. Apply Colors
    if (theme.colors) {
      if (theme.colors.background) root.style.setProperty('--bg-color', theme.colors.background);
      if (theme.colors.text_primary) root.style.setProperty('--text-primary', theme.colors.text_primary);
      if (theme.colors.text_secondary) root.style.setProperty('--text-secondary', theme.colors.text_secondary);
      
      // Accents
      if (theme.colors.primary_accent) {
        root.style.setProperty('--color-pink', theme.colors.primary_accent);
        root.style.setProperty('--color-purple', theme.colors.primary_accent);
      }
      if (theme.colors.secondary_accent) root.style.setProperty('--color-cyan', theme.colors.secondary_accent);
      
      // Muted / Glass variables based on brightness
      const isLight = isColorLight(theme.colors.background);
      if (isLight) {
        root.style.setProperty('--text-muted', '#6a6a8a');
        root.style.setProperty('--glass-border', 'rgba(0, 0, 0, 0.08)');
        if (theme.effects?.glass_intensity === 'low') {
          root.style.setProperty('--glass-bg', 'rgba(255, 255, 255, 0.3)');
          root.style.setProperty('--glass-blur', '4px');
        } else if (theme.effects?.glass_intensity === 'high') {
          root.style.setProperty('--glass-bg', 'rgba(255, 255, 255, 0.85)');
          root.style.setProperty('--glass-blur', '32px');
        } else {
          root.style.setProperty('--glass-bg', 'rgba(255, 255, 255, 0.65)');
          root.style.setProperty('--glass-blur', '16px');
        }
      } else {
        root.style.setProperty('--text-muted', '#8a7c9f');
        root.style.setProperty('--glass-border', 'rgba(167, 139, 250, 0.12)');
        if (theme.effects?.glass_intensity === 'low') {
          root.style.setProperty('--glass-bg', 'rgba(22, 11, 41, 0.25)');
          root.style.setProperty('--glass-blur', '4px');
        } else if (theme.effects?.glass_intensity === 'high') {
          root.style.setProperty('--glass-bg', 'rgba(22, 11, 41, 0.75)');
          root.style.setProperty('--glass-blur', '32px');
        } else {
          root.style.setProperty('--glass-bg', 'rgba(22, 11, 41, 0.45)');
          root.style.setProperty('--glass-blur', '16px');
        }
      }
    }

    // 2. Apply Typography
    if (theme.typography) {
      const displayFont = theme.typography.display_font || 'Outfit';
      const bodyFont = theme.typography.body_font || 'Inter';

      root.style.setProperty('--font-display', `'${displayFont}', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`);
      root.style.setProperty('--font-body', `'${bodyFont}', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`);

      // Dynamic Font Loading from Google Fonts
      const fontId = 'dynamic-google-fonts';
      let fontLink = document.getElementById(fontId);
      if (!fontLink) {
        fontLink = document.createElement('link');
        fontLink.id = fontId;
        fontLink.rel = 'stylesheet';
        document.head.appendChild(fontLink);
      }
      fontLink.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(displayFont)}:wght@300;400;500;600;700;800&family=${encodeURIComponent(bodyFont)}:wght@300;400;500;600;700&display=swap`;
    }

    // 3. Apply Card Border Radius
    if (theme.effects && theme.effects.card_border_radius !== undefined) {
      root.style.setProperty('--card-border-radius', `${theme.effects.card_border_radius}px`);
    }
  }, [data]);

  // Update document title and meta properties dynamically based on database profile info
  useEffect(() => {
    if (data && data.profile) {
      document.title = t(data.profile.meta_title) || 'Nguyen Tra My | Student Portfolio';
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', t(data.profile.meta_description) || '');
      }
    }
  }, [data, language]);

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
      let year = language === 'vi' ? 'Khác' : 'Other';
      const ds = t(evt.date_string);
      // Try to extract year from date_string (e.g. "05/2026" -> "2026") or event_date (e.g. "2026-05" -> "2026")
      if (evt.event_date && evt.event_date.match(/^\d{4}/)) {
        year = evt.event_date.substring(0, 4);
      } else if (ds && ds.match(/\d{4}$/)) {
        const matches = ds.match(/\d{4}$/);
        year = matches[0];
      } else if (ds && ds.match(/^\d{4}/)) {
        const matches = ds.match(/^\d{4}/);
        year = matches[0];
      }
      
      const groupKey = year === 'Khác' || year === 'Other' ? year : (language === 'vi' ? `Năm ${year}` : `Year ${year}`);
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(evt);
    });

    // Sort group keys descending (e.g., Năm 2026, Năm 2025, etc.)
    const sortedKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));

    if (sortedKeys.length === 0) {
      return <div className="no-events-tab">{tUI('noEvents')}</div>;
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
                const bulletText = t(evt.highlight_summary) || t(evt.title);
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
        {(!data?.theme || data.theme.effects?.show_glow_blobs !== false) && (
          <>
            <div className="glow-blob blob-purple" style={{ top: '8%', left: '3%' }}></div>
            <div className="glow-blob blob-blue" style={{ top: '28%', right: '5%' }}></div>
            <div className="glow-blob blob-pink" style={{ bottom: '12%', left: '8%' }}></div>
          </>
        )}

        {/* Ambient Particles */}
        {data?.theme?.effects?.show_particles && (
          <div className="particles-container" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1, overflow: 'hidden' }}>
            {Array.from({ length: 15 }).map((_, i) => {
              const delay = i * 0.8;
              const left = (i * 7) % 100;
              const top = (i * 9) % 100;
              const size = (i * 3) % 8 + 4;
              return (
                <div
                  key={i}
                  className="floating-particle"
                  style={{
                    left: `${left}%`,
                    top: `${top}%`,
                    width: `${size}px`,
                    height: `${size}px`,
                    backgroundColor: 'rgba(255, 255, 255, 0.4)',
                    borderRadius: '50%',
                    boxShadow: '0 0 10px rgba(255, 255, 255, 0.3)',
                    animationDelay: `${delay}s`,
                    animationDuration: `${6 + (i % 4)}s`
                  }}
                ></div>
              );
            })}
          </div>
        )}

        {/* Header */}
        <header id="header">
          <div className="nav-container">
            <a href="#" className="logo">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-crown"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7z"/><path d="M5 20h14"/></svg>
              {t(profile.hero_title) || 'Nguyen Tra My'}
            </a>
            <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle Menu">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
            </button>
            <ul className={`nav-links ${mobileMenuOpen ? 'mobile-open' : ''}`} id="navLinks">
              <li><a href="#" className="active" onClick={() => setMobileMenuOpen(false)}>{tUI('navHome')}</a></li>
              <li><a href="#about" onClick={() => setMobileMenuOpen(false)}>{tUI('navAbout')}</a></li>
              <li><a href="#education" onClick={() => setMobileMenuOpen(false)}>{tUI('navTimeline')}</a></li>
              <li><a href="#skills" onClick={() => setMobileMenuOpen(false)}>{tUI('navSkills')}</a></li>
              <li><a href="#activities" onClick={() => setMobileMenuOpen(false)}>{tUI('navActivities')}</a></li>
              <li><a href="#gallery" onClick={() => setMobileMenuOpen(false)}>{tUI('navGallery')}</a></li>
              <li><a href="#events" onClick={() => setMobileMenuOpen(false)}>{tUI('navEvents')}</a></li>
              <li><a href="#contact" onClick={() => setMobileMenuOpen(false)}>{tUI('navContact')}</a></li>
              <li className="nav-lang-item" style={{ display: 'flex', alignItems: 'center', marginLeft: '8px' }}>
                <div className="lang-switcher">
                  <button className={`lang-btn ${language === 'vi' ? 'active' : ''}`} onClick={() => setLanguage('vi')}>VI</button>
                  <span className="lang-divider">|</span>
                  <button className={`lang-btn ${language === 'en' ? 'active' : ''}`} onClick={() => setLanguage('en')}>EN</button>
                </div>
              </li>
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
            <span className="hero-subtitle">{t(profile.hero_subtitle)}</span>
            <div className="hero-title-container">
              <h1 className="hero-title text-glow-purple">{t(profile.hero_title)}</h1>
            </div>
            <p className="hero-desc">{t(profile.hero_description)}</p>
            <a href="#about" className="hero-btn">
              {tUI('exploreBtn')}
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </a>
          </div>
          <div className="scroll-down" id="scrollIndicator">
            <span>{tUI('scroll')}</span>
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
                <h2 className="section-title">{tUI('aboutTitle')}</h2>
              </div>
              <p className="about-bio">{t(profile.about_bio_p1)}</p>
              <p className="about-bio">{t(profile.about_bio_p2)}</p>
              <div className="quote-card">
                <p className="quote-text">{t(profile.personal_quote)}</p>
                <span className="quote-author">— {t(profile.hero_title)}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Timeline Section */}
        <section id="education" className="section-wrapper">
          <div className="section-title-container">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style={{ color: 'hsl(var(--color-pink))' }}><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10"/><path d="M6 10h10"/></svg>
            <h2 className="section-title">{tUI('educationTitle')}</h2>
          </div>

          <div className="split-grid">
            {/* Left Column: Education & Certs */}
            <div className="glass-panel split-card">
              <h3>
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style={{ color: 'hsl(var(--color-pink))' }}><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>
                {tUI('eduSectionTitle')}
              </h3>
              <div className="timeline">
                {timeline.filter(t => t.type === 'education').map(item => (
                  <div className="timeline-item" key={item.id}>
                    <div className="timeline-marker"></div>
                    <div className="timeline-time">{t(item.time_period)}</div>
                    <div className="timeline-title">{t(item.title)}</div>
                    <div className="timeline-subtitle">{t(item.subtitle)}</div>
                    <div className="timeline-desc">{renderFormattedDescription(t(item.description))}</div>
                  </div>
                ))}
              </div>

              <h3 style={{ marginTop: '36px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style={{ color: 'hsl(var(--color-pink))' }}><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
                {tUI('certSectionTitle')}
              </h3>
              <div className="timeline" style={{ borderLeft: 'none', marginLeft: 0, paddingLeft: 0 }}>
                {timeline.filter(t => t.type === 'certification').map(item => (
                  <div className="timeline-item" style={{ marginBottom: 0 }} key={item.id}>
                    <div className="timeline-time" style={{ color: 'hsl(var(--color-cyan))' }}>{t(item.time_period)}</div>
                    <div className="timeline-subtitle" style={{ marginBottom: '4px' }}>{t(item.title)}</div>
                    <div className="timeline-desc">{renderFormattedDescription(t(item.description))}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Experience */}
            <div className="glass-panel split-card">
              <h3>
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style={{ color: 'hsl(var(--color-pink))' }}><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                {tUI('expSectionTitle')}
              </h3>
              <div className="timeline">
                {timeline.filter(t => t.type === 'experience').map(item => (
                  <div className="timeline-item" key={item.id}>
                    <div className="timeline-marker"></div>
                    <div className="timeline-time">{t(item.time_period)}</div>
                    <div className="timeline-title">{t(item.title)}</div>
                    <div className="timeline-subtitle">{t(item.subtitle)}</div>
                    <div className="timeline-desc">{renderFormattedDescription(t(item.description))}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Skills Section */}
        <section id="skills" className="section-wrapper">
          <div className="section-title-container">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style={{ color: 'hsl(var(--color-pink))' }}><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z"/></svg>
            <h2 className="section-title">{tUI('skillsTitle')}</h2>
          </div>

          <div className="glass-panel" style={{ maxWidth: '800px', margin: '36px auto 0' }}>
            <div className="skills-container">
              {skills.map(skill => (
                <div className="skill-item" key={skill.id}>
                  <div className="skill-info">
                    <span>{t(skill.name)}</span>
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
            <h2 className="section-title">{tUI('activitiesTitle')}</h2>
          </div>

          <div className="tabs-container">
            {/* Tabs Nav */}
            <div className="tabs-nav">
              <button className={`tab-btn ${activeTab === 'awards' ? 'active' : ''}`} onClick={() => setActiveTab('awards')}>{tUI('tabAwards')}</button>
              <button className={`tab-btn ${activeTab === 'arts' ? 'active' : ''}`} onClick={() => setActiveTab('arts')}>{tUI('tabArts')}</button>
              <button className={`tab-btn ${activeTab === 'science' ? 'active' : ''}`} onClick={() => setActiveTab('science')}>{tUI('tabScience')}</button>
              <button className={`tab-btn ${activeTab === 'shows' ? 'active' : ''}`} onClick={() => setActiveTab('shows')}>{tUI('tabShows')}</button>
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
            <h2 className="section-title">{tUI('galleryTitle')}</h2>
          </div>

          <div className="gallery-grid">
            {gallery.map(item => {
              const videoInfo = parseVideoInput(item.youtube_id);
              const hasThumbnail = videoInfo.thumbnailUrl !== '';
              return (
                <div className="gallery-card" key={item.id} onClick={() => setActiveVideoId(item.youtube_id)}>
                  <div className="video-container">
                    <div 
                      className={`video-placeholder ${videoInfo.type}`}
                      style={hasThumbnail ? { backgroundImage: `url('${videoInfo.thumbnailUrl}')` } : {}}
                    >
                      {!hasThumbnail && (
                        <div className="video-placeholder-fallback">
                          {videoInfo.type === 'tiktok' ? (
                            <svg viewBox="0 0 24 24" fill="currentColor" width="36" height="36" style={{ color: '#fff', marginBottom: '8px' }}>
                              <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.02 1.59 4.23.86 1.08 2.06 1.81 3.42 2.06v4.02a8.046 8.046 0 0 1-5.18-1.89c-.19-.16-.38-.34-.55-.53V15c0 1.63-.4 3.23-1.18 4.65A9.01 9.01 0 0 1 6.55 24a8.91 8.91 0 0 1-6.19-2.91 8.9 8.9 0 0 1-1.74-7.46A9.03 9.03 0 0 1 7.21 6.8c.04.81.25 1.61.62 2.33.37.72.9 1.34 1.54 1.83.64.49 1.39.82 2.19.98.79.15 1.61.12 2.4-.09V.02z"/>
                            </svg>
                          ) : (
                            <i className="fa fa-video-camera" style={{ fontSize: '2.25rem', color: '#fff', marginBottom: '8px' }}></i>
                          )}
                        </div>
                      )}
                      <div className="play-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                      </div>
                    </div>
                  </div>
                  <h3>{t(item.title)}</h3>
                </div>
              );
            })}
          </div>
        </section>

        {/* Contact Connect */}
        <section id="contact" className="section-wrapper">
          <div className="section-title-container">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style={{ color: 'hsl(var(--color-pink))' }}><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
            <h2 className="section-title">{tUI('contactTitle')}</h2>
          </div>

          <div className="glass-panel contact-card">
            <p className="contact-subtitle">{tUI('contactSubtitle')}</p>
            <p className="contact-text" dangerouslySetInnerHTML={{ __html: tUI('contactText').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}></p>
            
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
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.02 1.59 4.23.94 1.15 2.25 1.95 3.68 2.27v3.91a8.94 8.94 0 0 1-5.18-1.74v7.41c.08 2.02-.75 4.02-2.18 5.43-1.6 1.63-3.95 2.53-6.26 2.45-2.27-.03-4.51-.97-5.99-2.7a9.23 9.23 0 0 1-2.09-6c-.03-2.61.99-5.18 2.87-7a9.14 9.14 0 0 1 6.84-2.73c.01 1.9-.02 3.8.01 5.7-.7-.25-1.46-.22-2.13.09-.72.32-1.31.9-1.62 1.62-.51 1.05-.18 2.41.77 3.09.73.55 1.69.66 2.51.3.93-.38 1.55-1.32 1.57-2.33v-10.5c.02-2.58.01-5.16.02-7.74z"/>
                  </svg>
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
          <p>© 2026 {t(profile.hero_title)}. {tUI('footerRules')}</p>
        </footer>

        {/* YouTube & TikTok Video Modal Dialog */}
        {activeVideoId && (() => {
          const videoInfo = parseVideoInput(activeVideoId);
          return (
            <div className="video-modal-overlay" onClick={() => setActiveVideoId(null)}>
              <div className={`video-modal-content ${videoInfo.type}`} onClick={e => e.stopPropagation()}>
                <button className="video-modal-close" onClick={() => setActiveVideoId(null)} aria-label="Close Modal">&times;</button>
                <div className={`video-modal-iframe-wrapper ${videoInfo.type}`}>
                  <iframe 
                    src={videoInfo.embedUrl}
                    title="Video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    );
  }

  // --- RENDER DETAILED EVENTS CHRONOLOGICAL VIEW ---
  return (
    <div className="events-theme">
      {/* Glow Blobs */}
      {(!data?.theme || data.theme.effects?.show_glow_blobs !== false) && (
        <>
          <div className="glow-blob blob-purple" style={{ top: '8%', left: '3%' }}></div>
          <div className="glow-blob blob-blue" style={{ top: '28%', right: '5%' }}></div>
          <div className="glow-blob blob-pink" style={{ bottom: '12%', left: '8%' }}></div>
        </>
      )}

      {/* Ambient Particles */}
      {data?.theme?.effects?.show_particles && (
        <div className="particles-container" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1, overflow: 'hidden' }}>
          {Array.from({ length: 15 }).map((_, i) => {
            const delay = i * 0.8;
            const left = (i * 7) % 100;
            const top = (i * 9) % 100;
            const size = (i * 3) % 8 + 4;
            return (
              <div
                key={i}
                className="floating-particle"
                style={{
                  left: `${left}%`,
                  top: `${top}%`,
                  width: `${size}px`,
                  height: `${size}px`,
                  backgroundColor: 'rgba(255, 255, 255, 0.4)',
                  borderRadius: '50%',
                  boxShadow: '0 0 10px rgba(255, 255, 255, 0.3)',
                  animationDelay: `${delay}s`,
                  animationDuration: `${6 + (i % 4)}s`
                }}
              ></div>
            );
          })}
        </div>
      )}
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark fixed-top">
        <div className="container">
          <a className="navbar-brand" href="#">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" className="logo-icon"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7z"/><path d="M5 20h14"/></svg>
            {t(profile.hero_title)}
          </a>
          <button className="navbar-toggler" type="button" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-controls="navbarResponsive" aria-expanded="false" aria-label="Toggle navigation">
            <i className="fa fa-bars"></i>
          </button>
          <div className={`collapse navbar-collapse ${mobileMenuOpen ? 'show' : ''}`} id="navbarResponsive">
            <ul className="navbar-nav ms-auto text-uppercase">
              <li className="nav-item"><a className="nav-link" href="#" onClick={() => setMobileMenuOpen(false)}>{tUI('navHome')}</a></li>
              <li className="nav-item"><a className="nav-link" href="#about" onClick={() => setMobileMenuOpen(false)}>{tUI('navAbout')}</a></li>
              <li className="nav-item"><a className="nav-link" href="#education" onClick={() => setMobileMenuOpen(false)}>{tUI('navTimeline')}</a></li>
              <li className="nav-item"><a className="nav-link" href="#skills" onClick={() => setMobileMenuOpen(false)}>{tUI('navSkills')}</a></li>
              <li className="nav-item"><a className="nav-link" href="#activities" onClick={() => setMobileMenuOpen(false)}>{tUI('navActivities')}</a></li>
              <li className="nav-item"><a className="nav-link" href="#gallery" onClick={() => setMobileMenuOpen(false)}>{tUI('navGallery')}</a></li>
              <li className="nav-item"><a className="nav-link active" href="#events" onClick={() => setMobileMenuOpen(false)}>{tUI('navEvents')}</a></li>
              <li className="nav-item"><a className="nav-link" href="#contact" onClick={() => setMobileMenuOpen(false)}>{tUI('navContact')}</a></li>
              <li className="nav-item" style={{ display: 'flex', alignItems: 'center', marginLeft: '12px' }}>
                <div className="lang-switcher">
                  <button className={`lang-btn ${language === 'vi' ? 'active' : ''}`} onClick={() => setLanguage('vi')}>VI</button>
                  <span className="lang-divider">|</span>
                  <button className={`lang-btn ${language === 'en' ? 'active' : ''}`} onClick={() => setLanguage('en')}>EN</button>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Header */}
      <header className="masthead" style={{ background: `url('${getFullAssetUrl(events.length && events[0].image_url ? events[0].image_url : '/events_hero_bg.png')}') center/cover no-repeat` }}>
        <div className="container">
          <div className="intro-text">
            <h1 className="tntn-title">{tUI('navEvents')}</h1>
            <div className="intro-lead-in">{tUI('eventSubtitle')}</div>
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
                  <i className="fa fa-calendar-o"></i> {t(item.date_string)}
                </div>
                {item.image_url && (
                  <img className="card-img" src={getFullAssetUrl(item.image_url)} alt={t(item.title)} />
                )}
                <div className="card-body">
                  <p className="card-category">{t(item.category)}</p>
                  <h2 className="card-title">{t(item.title)}</h2>
                  <p className="card-text">{t(item.description)}</p>
                  {item.location && (
                    <div className="card-location">
                      <i className="fa fa-map-marker"></i> {t(item.location)}
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
          <h2 className="section-title">{tUI('collabTitle')}</h2>
          <p className="sponsors-desc">
            {tUI('collabDesc')}
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
              <span>Copyright © {t(profile.hero_title)} 2026</span>
            </div>
            <div className="col-md-4">
              <ul className="social-buttons">
                {profile.instagram_url && <li><a href={profile.instagram_url} target="_blank" aria-label="Instagram"><i className="fa fa-instagram"></i></a></li>}
                {profile.tiktok_url && (
                  <li>
                    <a href={profile.tiktok_url} target="_blank" aria-label="TikTok">
                      <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '16px', height: '16px' }}>
                        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.02 1.59 4.23.94 1.15 2.25 1.95 3.68 2.27v3.91a8.94 8.94 0 0 1-5.18-1.74v7.41c.08 2.02-.75 4.02-2.18 5.43-1.6 1.63-3.95 2.53-6.26 2.45-2.27-.03-4.51-.97-5.99-2.7a9.23 9.23 0 0 1-2.09-6c-.03-2.61.99-5.18 2.87-7a9.14 9.14 0 0 1 6.84-2.73c.01 1.9-.02 3.8.01 5.7-.7-.25-1.46-.22-2.13.09-.72.32-1.31.9-1.62 1.62-.51 1.05-.18 2.41.77 3.09.73.55 1.69.66 2.51.3.93-.38 1.55-1.32 1.57-2.33v-10.5c.02-2.58.01-5.16.02-7.74z"/>
                      </svg>
                    </a>
                  </li>
                )}
                {profile.threads_url && <li><a href={profile.threads_url} target="_blank" aria-label="Threads"><i className="fa fa-at"></i></a></li>}
                {profile.facebook_url && <li><a href={profile.facebook_url} target="_blank" aria-label="Facebook"><i className="fa fa-facebook"></i></a></li>}
                {profile.youtube_url && <li><a href={profile.youtube_url} target="_blank" aria-label="YouTube"><i className="fa fa-youtube-play"></i></a></li>}
              </ul>
            </div>
            <div className="col-md-4 credits">
              <span>{tUI('footerRules')}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
