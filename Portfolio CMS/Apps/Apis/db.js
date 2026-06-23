const admin = require('firebase-admin');
const crypto = require('crypto');

// Load environment variables if not loaded
require('dotenv').config();

// Initialize Firebase Admin SDK
if (admin.apps.length === 0) {
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'portfolio-cms-fd55d'
  });
}

const db = admin.firestore();

// Export the db reference for query handlers
module.exports = {
  db,
  seedDatabase
};

// Seed function to initialize Firestore collections if empty
async function seedDatabase() {
  console.log('Verifying and seeding Firestore database...');

  try {
    // 1. Seed Profile Info
    const profileRef = db.collection('profile_info');
    const profileSnap = await profileRef.limit(1).get();
    if (profileSnap.empty) {
      console.log('Seeding initial profile details to Firestore...');
      const seedProfile = {
        hero_title: 'Nguyen Tra My',
        hero_subtitle: 'Performing Art & Piano • VEX IQ Robotics • Extroverted Leader',
        hero_description: 'Chào mừng bạn đến với không gian cá tính của mình! Mình sinh năm 2013, là một người cực kỳ hướng ngoại, tự tin và tràn đầy năng lượng. Mình luôn sẵn sàng bứt phá mọi giới hạn, chinh phục từ phím đàn Piano cổ điển đến đấu trường công nghệ VEX IQ Robotics toàn cầu!',
        hero_bg_image: 'https://mgx-backend-cdn.metadl.com/generate/images/1313419/2026-06-04/p4c57jycahva/hero-background-kawaii-dark.png',
        about_bio_p1: 'Mình tự định vị bản thân là một người hướng ngoại (extrovert) với đam mê khám phá những điều mới mẻ và kết nối với những người bạn tài năng. Mình luôn nỗ lực tìm kiếm môi trường thử thách để học hỏi, nâng cao học thuật và khẳng định bản lĩnh cá nhân.',
        about_bio_p2: 'Thay vì đi theo khuôn mẫu, mình thích tự tay định hình phong cách sống của mình. Sự kiên trì đệm đàn organ tại thánh lễ hay tập trung cao độ lập trình robot VEX IQ chính là minh chứng cho một cá tính mạnh mẽ, kiên định và dám nghĩ dám làm.',
        personal_quote: '“I am an extrovert who enjoys exploring new things and making new friends. I am looking for a new environment where I can develop myself and improve my academic performance.”',
        contact_email: 'camelia.nguyen2013@gmail.com',
        instagram_url: 'https://instagram.com/cera_nguyen',
        facebook_url: 'https://www.facebook.com/search/top/?q=Cera%20Nguyen',
        threads_url: 'https://www.threads.net/@cera_nguyen',
        tiktok_url: 'https://tiktok.com/@tumlumnghethuat',
        youtube_url: 'https://youtube.com/@tramy',
        meta_title: 'Nguyen Tra My | Student Portfolio',
        meta_description: 'Khám phá trang cá nhân đầy năng động của Nguyễn Trà My (Year of birth: 2013) - Học sinh trường Quốc tế Tây Úc (WASS). Đam mê VEX IQ Robotics, Piano cổ điển ABRSM, nghệ thuật biểu diễn và thời trang cá tính.'
      };

      // Store as individual docs where document ID = profile key
      for (const [key, value] of Object.entries(seedProfile)) {
        await profileRef.doc(key).set({ value });
      }
    }

    // 2. Seed Timeline
    const timelineRef = db.collection('timeline');
    const timelineSnap = await timelineRef.limit(1).get();
    if (timelineSnap.empty) {
      console.log('Seeding initial timeline details to Firestore...');
      const seedTimeline = [
        { id: crypto.randomUUID(), type: 'education', time_period: '2024 - Hiện tại', title: 'Học sinh Trung học Cơ sở', subtitle: 'Trường Quốc tế Tây Úc (WASS)', description: 'Phát triển tư duy phân tích khoa học, tích cực tham gia các dự án nghiên cứu khoa học và cộng đồng VEX IQ Robotics.', order_index: 0 },
        { id: crypto.randomUUID(), type: 'education', time_period: '2019 - 2024', title: 'Học sinh Tiểu học', subtitle: 'Trường Quốc tế Tây Úc (WASS)', description: 'Xây dựng nền tảng học thuật vững chắc, đạt nhiều giải thưởng học sinh giỏi cấp trường và rèn luyện kỹ năng hoạt động nhóm.', order_index: 1 },
        { id: crypto.randomUUID(), type: 'certification', time_period: 'Grade 3 Piano ABRSM', title: 'Associated Board of the Royal Schools of Music', subtitle: '', description: 'Chứng nhận quốc tế chính thức về năng lực nhạc lý và kỹ thuật diễn tấu Piano cổ điển cấp độ 3.', order_index: 2 },
        { id: crypto.randomUUID(), type: 'experience', time_period: 'Tháng 07/2025 - Tháng 08/2025', title: 'Trợ giảng Piano cho Trẻ em (Kid Piano TA)', subtitle: 'Amazing Music Center', description: '* Hỗ trợ giáo viên đứng lớp quản lý lớp, kiểm tra chỉnh sửa bài tập kỹ thuật ngón tay cho các bé học viên.\n* Thực hiện biểu diễn piano mẫu để minh họa trực quan phương pháp bấm phím và nhạc lý thực hành cho học sinh.', order_index: 3 }
      ];

      for (const item of seedTimeline) {
        await timelineRef.doc(item.id).set(item);
      }
    }

    // 3. Seed Skills
    const skillsRef = db.collection('skills');
    const skillsSnap = await skillsRef.limit(1).get();
    if (skillsSnap.empty) {
      console.log('Seeding initial skills details to Firestore...');
      const seedSkills = [
        { id: crypto.randomUUID(), name: 'Biểu diễn Nghệ thuật & Piano (Performing Art & Piano)', percentage: 95, order_index: 0 },
        { id: crypto.randomUUID(), name: 'Kỹ năng Giao tiếp (Communication)', percentage: 85, order_index: 1 },
        { id: crypto.randomUUID(), name: 'Kỹ năng Lập kế hoạch (Planning)', percentage: 85, order_index: 2 },
        { id: crypto.randomUUID(), name: 'Kỹ năng Tin học (ICT)', percentage: 80, order_index: 3 },
        { id: crypto.randomUUID(), name: 'Thuyết trình trước đám đông (Public speaking)', percentage: 70, order_index: 4 }
      ];

      for (const item of seedSkills) {
        await skillsRef.doc(item.id).set(item);
      }
    }

    // 4. Seed Events
    const eventsRef = db.collection('events');
    const eventsSnap = await eventsRef.limit(1).get();
    if (eventsSnap.empty) {
      console.log('Seeding initial events details to Firestore...');
      const seedEvents = [
        {
          id: crypto.randomUUID(),
          event_date: '2026-05',
          date_string: '05/2026',
          category: 'Tournament & Volunteering',
          title: 'VEX IQ MS World Championship 2026',
          description: 'Nguyễn Trà My vinh dự đại diện Việt Nam tham gia tranh tài tại đấu trường robot lớn nhất thế giới VEX IQ MS World Championship 2026 tổ chức ở Dallas, Texas. Tại đây, Trà My cũng tích cực tham gia với vai trò tình nguyện viên (Volunteer) hỗ trợ công tác trọng tài, quản lý sân đấu.',
          highlight_summary: 'Đại diện Việt Nam tham gia thi đấu tại Giải vô địch thế giới VEX IQ MS World Championship tổ chức tại Hoa Kỳ.',
          location: 'Kay Bailey Hutchison Convention Center, Dallas, Texas, USA',
          image_url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80',
          tab_category: 'science',
          order_index: 0
        },
        {
          id: crypto.randomUUID(),
          event_date: '2026-01',
          date_string: '01/2026',
          category: 'Tournament',
          title: 'VEX IQ National Championship 2026',
          description: 'Xuất sắc giành giải Quán quân đồng đội (Teamwork Champion) tại Giải vô địch Robotics VEX IQ Quốc gia 2026. Bên cạnh đó, Trà My còn nhận thêm giải thưởng thiết kế ấn tượng Amaze Award tại Vòng loại miền Bắc VEX IQ Northern Qualifying.',
          highlight_summary: 'Đoạt giải quán quân đồng đội **Teamwork Champion** giải vô địch robot quốc gia VEX IQ National Championship 2026 và giải **Amaze Award** thiết kế ấn tượng.',
          location: 'Vietnam National Tournament Arena',
          image_url: 'https://images.unsplash.com/photo-1561557944-6e7860d1a7eb?auto=format&fit=crop&w=800&q=80',
          tab_category: 'science,awards',
          order_index: 1
        },
        {
          id: crypto.randomUUID(),
          event_date: '2026-04',
          date_string: '04/2026',
          category: 'Music Performance',
          title: 'Easter Vigil Mass Organist',
          description: 'Đảm nhận vai trò nhạc công chơi đàn Organ chính phục vụ Thánh lễ Vọng Phục Sinh (Easter Vigil Mass) tại giáo xứ Mai Khôi. Đây là cột mốc ý nghĩa chứng minh cho sự kiên trì luyện tập, tập trung cao độ và tài năng âm nhạc phục vụ cộng đồng.',
          highlight_summary: 'Nhạc công Organ phục vụ Thánh lễ Vọng Phục Sinh (Easter Vigil Mass) tại giáo xứ Mai Khôi.',
          location: 'Giáo xứ Mai Khôi, Quận 3, TP. Hồ Chí Minh',
          image_url: 'https://images.unsplash.com/photo-1552422535-c45813c61732?auto=format&fit=crop&w=800&q=80',
          tab_category: 'arts',
          order_index: 2
        },
        {
          id: crypto.randomUUID(),
          event_date: '2025-07',
          date_string: '07/2025',
          category: 'Music & Performance',
          title: 'Art Talent Extravaganza Champion',
          description: 'Bùng nổ tài năng nghệ thuật và đạt giải Nhất cuộc thi tìm kiếm tài năng âm nhạc nghệ thuật Art Talent Extravaganza tại Trại hè WASS Summer Camp 2025 với màn trình diễn đầy tự tin, khẳng định cá tính hướng ngoại mạnh mẽ.',
          highlight_summary: '**Giải Nhất** cuộc thi tìm kiếm tài năng âm nhạc nghệ thuật Art Talent Extravaganza 2025.',
          location: 'Western Australian International School System, TP. HCM',
          image_url: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=800&q=80',
          tab_category: 'arts,awards',
          order_index: 3
        },
        {
          id: crypto.randomUUID(),
          event_date: '2025-07',
          date_string: '07/2025',
          category: 'Work & Leadership',
          title: 'Kid Piano Teaching Assistant',
          description: 'Hoạt động trợ giảng lớp học đàn Piano dành cho trẻ nhỏ tại Amazing Music Center. Trà My hỗ trợ giáo viên đứng lớp quản lý các học viên nhỏ, trực tiếp hướng dẫn tư thế ngón tay và thị phạm chơi đàn piano mẫu cho các bé.',
          highlight_summary: 'Hỗ trợ giáo viên, thị phạm và trợ giảng Piano cho trẻ nhỏ tại Amazing Music Center.',
          location: 'Amazing Music Center, TP. Hồ Chí Minh',
          image_url: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?auto=format&fit=crop&w=800&q=80',
          tab_category: 'arts',
          order_index: 4
        },
        {
          id: crypto.randomUUID(),
          event_date: '2025-05',
          date_string: '2025',
          category: 'Music Concert',
          title: 'Twinkle Twinkle & Daydream Concert',
          description: 'Trình diễn xuất sắc hai tác phẩm piano cổ điển "Twinkle Twinkle" và "Daydream" trước khán giả tại đêm nhạc báo cáo tài năng của Amazing Music Center, thể hiện vững vàng năng lực từ chứng chỉ Grade 3 Piano ABRSM.',
          highlight_summary: 'Trình diễn báo cáo nhạc hội **"Twinkle Twinkle"** và **"Daydream"** tại Amazing Music Center.',
          location: 'Amazing Concert Hall, TP. Hồ Chí Minh',
          image_url: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=800&q=80',
          tab_category: 'arts',
          order_index: 5
        },
        {
          id: crypto.randomUUID(),
          event_date: '2019-10',
          date_string: '2019',
          category: 'TV Appearance',
          title: 'Flash Kid & Happy Thursday TV Shows',
          description: 'Bộc lộ tính cách năng động, hướng ngoại từ rất sớm khi tham gia chương trình thử thách vượt khó thực tế Flash Kid TV Show cùng với chương trình đào tạo kỹ năng sống Happy Thursday TV Show với vai trò khách mời.',
          highlight_summary: 'Là người chơi, khách mời tham gia các chương trình ghi hình thực tế **Flash Kid** và **Happy Thursday TV Show**.',
          location: 'HTV / VTV Film Studios, TP. Hồ Chí Minh',
          image_url: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&w=800&q=80',
          tab_category: 'shows',
          order_index: 6
        },
        {
          id: crypto.randomUUID(),
          event_date: '2025-06',
          date_string: '2025',
          category: 'Science Competition',
          title: 'Innovation Technology Competition 2025',
          description: 'Nghiên cứu mô hình khoa học và tranh tài tại ngày hội Sáng tạo công nghệ, đạt giải Nhì cấp trường.',
          highlight_summary: '**Giải Nhì** cuộc thi sáng tạo công nghệ Innovation Technology Competition 2025.',
          location: 'Trường Quốc tế Tây Úc (WASS)',
          image_url: '',
          tab_category: 'science,awards',
          order_index: 7
        },
        {
          id: crypto.randomUUID(),
          event_date: '2025-03',
          date_string: '2025',
          category: 'Culinary Challenge',
          title: 'Gourmet Delight 2025',
          description: 'Tham gia thử thách làm bánh ngọt sáng tạo và trình bày ẩm thực, đạt giải Ba.',
          highlight_summary: '**Giải Ba** hội thi ẩm thực sáng tạo Gourmet Delight 2025.',
          location: 'Amazing Music Center',
          image_url: '',
          tab_category: 'shows,awards',
          order_index: 8
        },
        {
          id: crypto.randomUUID(),
          event_date: '2025-04',
          date_string: '2025',
          category: 'Sport Tournament',
          title: 'Badminton Girls Singles 6-7',
          description: 'Thi đấu môn cầu lông đơn nữ khối lớp 6-7 và đoạt giải ba cấp trường.',
          highlight_summary: '**Giải Ba** môn Cầu lông đơn nữ khối lớp 6-7 cấp trường.',
          location: 'WASS Sports Hall',
          image_url: '',
          tab_category: 'awards',
          order_index: 9
        },
        {
          id: crypto.randomUUID(),
          event_date: '2024-02',
          date_string: '2024',
          category: 'Tournament',
          title: 'VEX IQ ES National Championship 2024',
          description: 'Tham gia giải vô địch quốc gia bảng tiểu học và đoạt giải thưởng thiết kế ấn tượng Create Award.',
          highlight_summary: 'Đoạt giải thưởng sáng tạo thiết kế **Create Award** VEX IQ National Championship 2024.',
          location: 'Vietnam National Arena',
          image_url: '',
          tab_category: 'science,awards',
          order_index: 10
        }
      ];

      for (const item of seedEvents) {
        await eventsRef.doc(item.id).set(item);
      }
    }

    // 5. Seed Gallery
    const galleryRef = db.collection('gallery');
    const gallerySnap = await galleryRef.limit(1).get();
    if (gallerySnap.empty) {
      console.log('Seeding initial gallery details to Firestore...');
      const seedGallery = [
        { id: crypto.randomUUID(), youtube_id: 'dQw4w9WgXcQ', title: 'Dance Cover ✨', order_index: 0 },
        { id: crypto.randomUUID(), youtube_id: 'dQw4w9WgXcQ', title: 'Piano Performance 🎹', order_index: 1 },
        { id: crypto.randomUUID(), youtube_id: 'dQw4w9WgXcQ', title: 'Behind the Scenes 🎬', order_index: 2 }
      ];

      for (const item of seedGallery) {
        await galleryRef.doc(item.id).set(item);
      }
    }

    console.log('Firestore seed checking complete.');
  } catch (error) {
    console.error('Error seeding Firestore database:', error);
  }
}

// Automatically check seed check if run directly (node db.js)
if (require.main === module) {
  seedDatabase().then(() => process.exit(0));
}
