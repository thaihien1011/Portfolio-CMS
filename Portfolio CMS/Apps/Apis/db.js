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

// Password Hashing Helper (Matching server.js parity)
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

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
        hero_title: {
          vi: 'Nguyễn Trà My',
          en: 'Nguyen Tra My'
        },
        hero_subtitle: {
          vi: 'Nghệ thuật Biểu diễn & Piano • VEX IQ Robotics • Thủ lĩnh Hướng ngoại',
          en: 'Performing Art & Piano • VEX IQ Robotics • Extroverted Leader'
        },
        hero_description: {
          vi: 'Chào mừng bạn đến với không gian cá tính của mình! Mình sinh năm 2013, là một người cực kỳ hướng ngoại, tự tin và tràn đầy năng lượng. Mình luôn sẵn sàng bứt phá mọi giới hạn, chinh phục từ phím đàn Piano cổ điển đến đấu trường công nghệ VEX IQ Robotics toàn cầu!',
          en: 'Welcome to my personal space! Born in 2013, I am an extremely extroverted, confident, and energetic person. I am always ready to break all limits, conquering everything from classical piano to the global VEX IQ Robotics arena!'
        },
        hero_bg_image: 'https://mgx-backend-cdn.metadl.com/generate/images/1313419/2026-06-04/p4c57jycahva/hero-background-kawaii-dark.png',
        about_bio_p1: {
          vi: 'Mình tự định vị bản thân là một người hướng ngoại (extrovert) với đam mê khám phá những điều mới mẻ và kết nối với những người bạn tài năng. Mình luôn nỗ lực tìm kiếm môi trường thử thách để học hỏi, nâng cao học thuật và khẳng định bản lĩnh cá nhân.',
          en: 'I define myself as an extroverted individual with a passion for exploring new things and connecting with talented friends. I always strive to find challenging environments to learn, improve my academic performance, and assert my personal capabilities.'
        },
        about_bio_p2: {
          vi: 'Thay vì đi theo khuôn mẫu, mình thích tự tay định hình phong cách sống của mình. Sự kiên trì đệm đàn organ tại thánh lễ hay tập trung cao độ lập trình robot VEX IQ chính là minh chứng cho một cá tính mạnh mẽ, kiên định và dám nghĩ dám làm.',
          en: 'Instead of following templates, I like to shape my own lifestyle. The perseverance of playing organ at church mass or the deep concentration of coding VEX IQ robots is the proof of a strong, steadfast, and proactive personality.'
        },
        personal_quote: {
          vi: '“Mình là một người hướng ngoại thích khám phá cái mới và kết bạn mới. Mình đang tìm kiếm một môi trường mới để phát triển bản thân và nâng cao kết quả học tập.”',
          en: '“I am an extrovert who enjoys exploring new things and making new friends. I am looking for a new environment where I can develop myself and improve my academic performance.”'
        },
        contact_email: 'camelia.nguyen2013@gmail.com',
        instagram_url: 'https://instagram.com/cera_nguyen',
        facebook_url: 'https://www.facebook.com/search/top/?q=Cera%20Nguyen',
        threads_url: 'https://www.threads.net/@cera_nguyen',
        tiktok_url: 'https://tiktok.com/@tumlumnghethuat',
        youtube_url: 'https://youtube.com/@tramy',
        meta_title: {
          vi: 'Nguyễn Trà My | Trang cá nhân học sinh',
          en: 'Nguyen Tra My | Student Portfolio'
        },
        meta_description: {
          vi: 'Khám phá trang cá nhân đầy năng động của Nguyễn Trà My (Sinh năm: 2013) - Học sinh trường Quốc tế Tây Úc (WASS). Đam mê VEX IQ Robotics, Piano cổ điển ABRSM, nghệ thuật biểu diễn và thời trang cá tính.',
          en: 'Explore the dynamic personal website of Nguyen Tra My (born 2013) - Student at the Western Australian International School System (WASS). Passionate about VEX IQ Robotics, ABRSM Classical Piano, performing arts, and fashion.'
        }
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
        {
          id: crypto.randomUUID(),
          type: 'education',
          time_period: { vi: '2024 - Hiện tại', en: '2024 - Present' },
          title: { vi: 'Học sinh Trung học Cơ sở', en: 'Junior High School Student' },
          subtitle: { vi: 'Trường Quốc tế Tây Úc (WASS)', en: 'Western Australian International School System (WASS)' },
          description: {
            vi: 'Phát triển tư duy phân tích khoa học, tích cực tham gia các dự án nghiên cứu khoa học và cộng đồng VEX IQ Robotics.',
            en: 'Develop scientific analytical thinking, actively participate in scientific research projects and the VEX IQ Robotics community.'
          },
          order_index: 0
        },
        {
          id: crypto.randomUUID(),
          type: 'education',
          time_period: { vi: '2019 - 2024', en: '2019 - 2024' },
          title: { vi: 'Học sinh Tiểu học', en: 'Elementary School Student' },
          subtitle: { vi: 'Trường Quốc tế Tây Úc (WASS)', en: 'Western Australian International School System (WASS)' },
          description: {
            vi: 'Xây dựng nền tảng học thuật vững chắc, đạt nhiều giải thưởng học sinh giỏi cấp trường và rèn luyện kỹ năng hoạt động nhóm.',
            en: 'Build a solid academic foundation, achieve many school-level excellent student awards, and practice team-building skills.'
          },
          order_index: 1
        },
        {
          id: crypto.randomUUID(),
          type: 'certification',
          time_period: { vi: 'Grade 3 Piano ABRSM', en: 'Grade 3 Piano ABRSM' },
          title: { vi: 'Associated Board of the Royal Schools of Music', en: 'Associated Board of the Royal Schools of Music' },
          subtitle: { vi: '', en: '' },
          description: {
            vi: 'Chứng nhận quốc tế chính thức về năng lực nhạc lý và kỹ thuật diễn tấu Piano cổ điển cấp độ 3.',
            en: 'Official international certification of music theory and classical piano performance competency at level 3.'
          },
          order_index: 2
        },
        {
          id: crypto.randomUUID(),
          type: 'experience',
          time_period: { vi: 'Tháng 07/2025 - Tháng 08/2025', en: 'Jul 2025 - Aug 2025' },
          title: { vi: 'Trợ giảng Piano cho Trẻ em (Kid Piano TA)', en: 'Kid Piano Teaching Assistant (Kid Piano TA)' },
          subtitle: { vi: 'Amazing Music Center', en: 'Amazing Music Center' },
          description: {
            vi: '* Hỗ trợ giáo viên đứng lớp quản lý lớp, kiểm tra chỉnh sửa bài tập kỹ thuật ngón tay cho các bé học viên.\n* Thực hiện biểu diễn piano mẫu để minh họa trực quan phương pháp bấm phím và nhạc lý thực hành cho học sinh.',
            en: '* Support class teachers in managing classes, checking and correcting finger technique exercises for young students.\n* Perform model piano plays to visually demonstrate keyboard methods and practical music theory for students.'
          },
          order_index: 3
        }
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
        {
          id: crypto.randomUUID(),
          name: {
            vi: 'Biểu diễn Nghệ thuật & Piano (Performing Art & Piano)',
            en: 'Performing Arts & Piano (ABRSM)'
          },
          percentage: 95,
          order_index: 0
        },
        {
          id: crypto.randomUUID(),
          name: {
            vi: 'Kỹ năng Giao tiếp (Communication)',
            en: 'Communication Skills'
          },
          percentage: 85,
          order_index: 1
        },
        {
          id: crypto.randomUUID(),
          name: {
            vi: 'Kỹ năng Lập kế hoạch (Planning)',
            en: 'Planning Skills'
          },
          percentage: 85,
          order_index: 2
        },
        {
          id: crypto.randomUUID(),
          name: {
            vi: 'Kỹ năng Tin học (ICT)',
            en: 'ICT Skills'
          },
          percentage: 80,
          order_index: 3
        },
        {
          id: crypto.randomUUID(),
          name: {
            vi: 'Thuyết trình trước đám đông (Public speaking)',
            en: 'Public Speaking'
          },
          percentage: 70,
          order_index: 4
        }
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
          date_string: { vi: '05/2026', en: '05/2026' },
          category: { vi: 'Giải đấu & Tình nguyện', en: 'Tournament & Volunteering' },
          title: { vi: 'VEX IQ MS World Championship 2026', en: 'VEX IQ MS World Championship 2026' },
          description: {
            vi: 'Nguyễn Trà My vinh dự đại diện Việt Nam tham gia tranh tài tại đấu trường robot lớn nhất thế giới VEX IQ MS World Championship 2026 tổ chức ở Dallas, Texas. Tại đây, Trà My cũng tích cực tham gia với vai trò tình nguyện viên (Volunteer) hỗ trợ công tác trọng tài, quản lý sân đấu.',
            en: 'Nguyen Tra My was honored to represent Vietnam to compete at the world\'s largest robot arena, the VEX IQ MS World Championship 2026 held in Dallas, Texas. Here, Tra My also actively participated as a volunteer supporting referee work and field management.'
          },
          highlight_summary: {
            vi: 'Đại diện Việt Nam tham gia thi đấu tại Giải vô địch thế giới VEX IQ MS World Championship tổ chức tại Hoa Kỳ.',
            en: 'Represented Vietnam to compete at the VEX IQ MS World Championship in the USA.'
          },
          location: { vi: 'Kay Bailey Hutchison Convention Center, Dallas, Texas, USA', en: 'Kay Bailey Hutchison Convention Center, Dallas, Texas, USA' },
          image_url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80',
          tab_category: 'science',
          order_index: 0
        },
        {
          id: crypto.randomUUID(),
          event_date: '2026-01',
          date_string: { vi: '01/2026', en: '01/2026' },
          category: { vi: 'Giải đấu', en: 'Tournament' },
          title: { vi: 'VEX IQ National Championship 2026', en: 'VEX IQ National Championship 2026' },
          description: {
            vi: 'Xuất sắc giành giải Quán quân đồng đội (Teamwork Champion) tại Giải vô địch Robotics VEX IQ Quốc gia 2026. Bên cạnh đó, Trà My còn nhận thêm giải thưởng thiết kế ấn tượng Amaze Award tại Vòng loại miền Bắc VEX IQ Northern Qualifying.',
            en: 'Excellently won the Teamwork Champion at the National VEX IQ Robotics Championship 2026. In addition, Tra My received the Amaze Award for impressive design at the VEX IQ Northern Qualifying.'
          },
          highlight_summary: {
            vi: 'Đoạt giải quán quân đồng đội **Teamwork Champion** giải vô địch robot quốc gia VEX IQ National Championship 2026 và giải **Amaze Award** thiết kế ấn tượng.',
            en: 'Won the **Teamwork Champion** at the VEX IQ National Championship 2026 and the **Amaze Award** for impressive design.'
          },
          location: { vi: 'Vietnam National Tournament Arena', en: 'Vietnam National Tournament Arena' },
          image_url: 'https://images.unsplash.com/photo-1561557944-6e7860d1a7eb?auto=format&fit=crop&w=800&q=80',
          tab_category: 'science,awards',
          order_index: 1
        },
        {
          id: crypto.randomUUID(),
          event_date: '2026-04',
          date_string: { vi: '04/2026', en: '04/2026' },
          category: { vi: 'Biểu diễn Âm nhạc', en: 'Music Performance' },
          title: { vi: 'Easter Vigil Mass Organist', en: 'Easter Vigil Mass Organist' },
          description: {
            vi: 'Đảm nhận vai trò nhạc công chơi đàn Organ chính phục vụ Thánh lễ Vọng Phục Sinh (Easter Vigil Mass) tại giáo xứ Mai Khôi. Đây là cột mốc ý nghĩa chứng minh cho sự kiên trì luyện tập, tập trung cao độ và tài năng âm nhạc phục vụ cộng đồng.',
            en: 'Took on the role of playing primary Organ to serve the Easter Vigil Mass at Mai Khoi Parish. This is a significant milestone demonstrating perseverance in practicing, high concentration, and musical talent serving the community.'
          },
          highlight_summary: {
            vi: 'Nhạc công Organ phục vụ Thánh lễ Vọng Phục Sinh (Easter Vigil Mass) tại giáo xứ Mai Khôi.',
            en: 'Organist serving the Easter Vigil Mass at Mai Khoi Parish.'
          },
          location: { vi: 'Giáo xứ Mai Khôi, Quận 3, TP. Hồ Chí Minh', en: 'Mai Khoi Parish, District 3, Ho Chi Minh City' },
          image_url: 'https://images.unsplash.com/photo-1552422535-c45813c61732?auto=format&fit=crop&w=800&q=80',
          tab_category: 'arts',
          order_index: 2
        },
        {
          id: crypto.randomUUID(),
          event_date: '2025-07',
          date_string: { vi: '07/2025', en: '07/2025' },
          category: { vi: 'Âm nhạc & Biểu diễn', en: 'Music & Performance' },
          title: { vi: 'Art Talent Extravaganza Champion', en: 'Art Talent Extravaganza Champion' },
          description: {
            vi: 'Bùng nổ tài năng nghệ thuật và đạt giải Nhất cuộc thi tìm kiếm tài năng âm nhạc nghệ thuật Art Talent Extravaganza tại Trại hè WASS Summer Camp 2025 với màn trình diễn đầy tự tin, khẳng định cá tính hướng ngoại mạnh mẽ.',
            en: 'Exploded artistic talent and won first place in the Art Talent Extravaganza music and art talent search contest at WASS Summer Camp 2025 with a confident performance, affirming a strong extroverted personality.'
          },
          highlight_summary: {
            vi: 'Giải Nhất cuộc thi tìm kiếm tài năng âm nhạc nghệ thuật Art Talent Extravaganza 2025.',
            en: 'Won **First Place** in the Art Talent Extravaganza 2025 music and art talent search.'
          },
          location: { vi: 'Western Australian International School System, TP. HCM', en: 'Western Australian International School System, HCMC' },
          image_url: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=800&q=80',
          tab_category: 'arts,awards',
          order_index: 3
        },
        {
          id: crypto.randomUUID(),
          event_date: '2025-07',
          date_string: { vi: '07/2025', en: '07/2025' },
          category: { vi: 'Công việc & Lãnh đạo', en: 'Work & Leadership' },
          title: { vi: 'Trợ giảng Piano cho trẻ nhỏ (Teaching Assistant)', en: 'Kid Piano Teaching Assistant' },
          description: {
            vi: 'Hoạt động trợ giảng lớp học đàn Piano dành cho trẻ nhỏ tại Amazing Music Center. Trà My hỗ trợ giáo viên đứng lớp quản lý các học viên nhỏ, trực tiếp hướng dẫn tư thế ngón tay và thị phạm chơi đàn piano mẫu cho các bé.',
            en: 'Worked as a piano teaching assistant for young children at Amazing Music Center. Tra My supported the class teacher in managing small students, directly guiding hand posture, and performing model piano playing for the kids.'
          },
          highlight_summary: {
            vi: 'Hỗ trợ giáo viên, thị phạm và trợ giảng Piano cho trẻ nhỏ tại Amazing Music Center.',
            en: 'Supported teachers, modeled performances, and assistant-taught piano for small children at Amazing Music Center.'
          },
          location: { vi: 'Amazing Music Center, TP. Hồ Chí Minh', en: 'Amazing Music Center, Ho Chi Minh City' },
          image_url: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?auto=format&fit=crop&w=800&q=80',
          tab_category: 'arts',
          order_index: 4
        },
        {
          id: crypto.randomUUID(),
          event_date: '2025-05',
          date_string: { vi: '2025', en: '2025' },
          category: { vi: 'Hòa nhạc Âm nhạc', en: 'Music Concert' },
          title: { vi: 'Twinkle Twinkle & Daydream Concert', en: 'Twinkle Twinkle & Daydream Concert' },
          description: {
            vi: 'Trình diễn xuất sắc hai tác phẩm piano cổ điển "Twinkle Twinkle" và "Daydream" trước khán giả tại đêm nhạc báo cáo tài năng của Amazing Music Center, thể hiện vững vàng năng lực từ chứng chỉ Grade 3 Piano ABRSM.',
            en: 'Excellently performed two classical piano pieces "Twinkle Twinkle" and "Daydream" before the audience at the Amazing Music Center student recital concert, strongly showing competence from the ABRSM Grade 3 Piano certificate.'
          },
          highlight_summary: {
            vi: 'Trình diễn báo cáo nhạc hội "Twinkle Twinkle" và "Daydream" tại Amazing Music Center.',
            en: 'Performed "Twinkle Twinkle" and "Daydream" recital at Amazing Music Center.'
          },
          location: { vi: 'Amazing Concert Hall, TP. Hồ Chí Minh', en: 'Amazing Concert Hall, Ho Chi Minh City' },
          image_url: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=800&q=80',
          tab_category: 'arts',
          order_index: 5
        },
        {
          id: crypto.randomUUID(),
          event_date: '2019-10',
          date_string: { vi: '2019', en: '2019' },
          category: { vi: 'Xuất hiện trên TV', en: 'TV Appearance' },
          title: { vi: 'Flash Kid & Happy Thursday TV Shows', en: 'Flash Kid & Happy Thursday TV Shows' },
          description: {
            vi: 'Bộc lộ tính cách năng động, hướng ngoại từ rất sớm khi tham gia chương trình thử thách vượt khó thực tế Flash Kid TV Show cùng với chương trình đào tạo kỹ năng sống Happy Thursday TV Show với vai trò khách mời.',
            en: 'Revealed a dynamic and extroverted personality early on when participating in the Flash Kid challenge reality TV show along with the Happy Thursday life skills training show as a guest.'
          },
          highlight_summary: {
            vi: 'Là người chơi, khách mời tham gia các chương trình ghi hình thực tế Flash Kid và Happy Thursday TV Show.',
            en: 'Featured player and guest participant on reality TV shows Flash Kid and Happy Thursday TV Show.'
          },
          location: { vi: 'HTV / VTV Film Studios, TP. Hồ Chí Minh', en: 'HTV / VTV Film Studios, Ho Chi Minh City' },
          image_url: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&w=800&q=80',
          tab_category: 'shows',
          order_index: 6
        },
        {
          id: crypto.randomUUID(),
          event_date: '2025-06',
          date_string: { vi: '2025', en: '2025' },
          category: { vi: 'Cuộc thi Khoa học', en: 'Science Competition' },
          title: { vi: 'Innovation Technology Competition 2025', en: 'Innovation Technology Competition 2025' },
          description: {
            vi: 'Nghiên cứu mô hình khoa học và tranh tài tại ngày hội Sáng tạo công nghệ, đạt giải Nhì cấp trường.',
            en: 'Researched scientific models and competed at the school Innovation Technology day, winning Second Place.'
          },
          highlight_summary: {
            vi: 'Giải Nhì cuộc thi sáng tạo công nghệ Innovation Technology Competition 2025.',
            en: 'Won **Second Place** in the Innovation Technology Competition 2025.'
          },
          location: { vi: 'Trường Quốc tế Tây Úc (WASS)', en: 'Western Australian International School System (WASS)' },
          image_url: '',
          tab_category: 'science,awards',
          order_index: 7
        },
        {
          id: crypto.randomUUID(),
          event_date: '2025-03',
          date_string: { vi: '2025', en: '2025' },
          category: { vi: 'Thử thách Ẩm thực', en: 'Culinary Challenge' },
          title: { vi: 'Gourmet Delight 2025', en: 'Gourmet Delight 2025' },
          description: {
            vi: 'Tham gia thử thách làm bánh ngọt sáng tạo và trình bày ẩm thực, đạt giải Ba.',
            en: 'Participated in the creative pastry making and culinary presentation challenge, winning Third Place.'
          },
          highlight_summary: {
            vi: 'Giải Ba hội thi ẩm thực sáng tạo Gourmet Delight 2025.',
            en: 'Won **Third Place** in the Gourmet Delight 2025 creative culinary competition.'
          },
          location: { vi: 'Amazing Music Center', en: 'Amazing Music Center' },
          image_url: '',
          tab_category: 'shows,awards',
          order_index: 8
        },
        {
          id: crypto.randomUUID(),
          event_date: '2025-04',
          date_string: { vi: '2025', en: '2025' },
          category: { vi: 'Giải đấu Thể thao', en: 'Sport Tournament' },
          title: { vi: 'Badminton Girls Singles 6-7', en: 'Badminton Girls Singles 6-7' },
          description: {
            vi: 'Thi đấu môn cầu lông đơn nữ khối lớp 6-7 và đoạt giải ba cấp trường.',
            en: 'Competed in girls\' singles badminton for grades 6-7 and won third place school-wide.'
          },
          highlight_summary: {
            vi: 'Giải Ba môn Cầu lông đơn nữ khối lớp 6-7 cấp trường.',
            en: 'Won **Third Place** in girls\' singles badminton grades 6-7.'
          },
          location: { vi: 'WASS Sports Hall', en: 'WASS Sports Hall' },
          image_url: '',
          tab_category: 'awards',
          order_index: 9
        },
        {
          id: crypto.randomUUID(),
          event_date: '2024-02',
          date_string: { vi: '2024', en: '2024' },
          category: { vi: 'Giải đấu', en: 'Tournament' },
          title: { vi: 'VEX IQ ES National Championship 2024', en: 'VEX IQ ES National Championship 2024' },
          description: {
            vi: 'Tham gia giải vô địch quốc gia bảng tiểu học và đoạt giải thưởng thiết kế ấn tượng Create Award.',
            en: 'Participated in the elementary national championship and won the Create Award for impressive design.'
          },
          highlight_summary: {
            vi: 'Đoạt giải thưởng sáng tạo thiết kế Create Award VEX IQ National Championship 2024.',
            en: 'Won the **Create Award** for creative design at the VEX IQ National Championship 2024.'
          },
          location: { vi: 'Vietnam National Arena', en: 'Vietnam National Arena' },
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

    // 6. Seed Default Admin User
    const usersRef = db.collection('users');
    const usersSnap = await usersRef.limit(1).get();
    if (usersSnap.empty) {
      console.log('Seeding default administrator user to Firestore...');
      const id = crypto.randomUUID();
      const password_hash = hashPassword('password123');
      await usersRef.doc(id).set({
        id,
        username: 'admin',
        password_hash,
        created_at: new Date().toISOString()
      });
    }

    // Run automatic migration to upgrade existing documents in the database
    await migrateToLocales();

    console.log('Firestore seed checking complete.');
  } catch (error) {
    console.error('Error seeding Firestore database:', error);
  }
}

// Migration function to upgrade legacy single-string data in Firestore to the dual-language schema { vi, en }
async function migrateToLocales() {
  console.log('Checking and migrating existing Firestore data to locale structure...');

  const translatableProfileKeys = [
    'hero_title', 'hero_subtitle', 'hero_description',
    'about_bio_p1', 'about_bio_p2', 'personal_quote',
    'meta_title', 'meta_description'
  ];

  // 1. Profile Info Migration
  const profileRef = db.collection('profile_info');
  const profileSnap = await profileRef.get();
  for (const doc of profileSnap.docs) {
    const data = doc.data();
    if (translatableProfileKeys.includes(doc.id) && typeof data.value === 'string') {
      console.log(`Migrating profile key to dual locales: ${doc.id}`);
      let enVal = data.value;
      if (doc.id === 'hero_title') enVal = 'Nguyen Tra My';
      else if (doc.id === 'hero_subtitle') enVal = 'Performing Art & Piano • VEX IQ Robotics • Extroverted Leader';
      else if (doc.id === 'hero_description') enVal = 'Welcome to my personal space! Born in 2013, I am an extremely extroverted, confident, and energetic person. I am always ready to break all limits, conquering everything from classical piano to the global VEX IQ Robotics arena!';
      else if (doc.id === 'about_bio_p1') enVal = 'I define myself as an extroverted individual with a passion for exploring new things and connecting with talented friends. I always strive to find challenging environments to learn, improve my academic performance, and assert my personal capabilities.';
      else if (doc.id === 'about_bio_p2') enVal = 'Instead of following templates, I like to shape my own lifestyle. The perseverance of playing organ at church mass or the deep concentration of coding VEX IQ robots is the proof of a strong, steadfast, and proactive personality.';
      else if (doc.id === 'personal_quote') enVal = '“I am an extrovert who enjoys exploring new things and making new friends. I am looking for a new environment where I can develop myself and improve my academic performance.”';
      else if (doc.id === 'meta_title') enVal = 'Nguyen Tra My | Student Portfolio';
      else if (doc.id === 'meta_description') enVal = 'Explore the dynamic personal website of Nguyen Tra My (born 2013) - Student at the Western Australian International School System (WASS). Passionate about VEX IQ Robotics, ABRSM Classical Piano, performing arts, and fashion.';

      await profileRef.doc(doc.id).set({
        value: {
          vi: data.value,
          en: enVal
        }
      });
    }
  }

  // 2. Timeline Migration
  const timelineRef = db.collection('timeline');
  const timelineSnap = await timelineRef.get();
  for (const doc of timelineSnap.docs) {
    const data = doc.data();
    let updated = false;
    const updatePayload = {};

    ['time_period', 'title', 'subtitle', 'description'].forEach(field => {
      if (data[field] !== undefined && typeof data[field] === 'string') {
        updated = true;
        let enVal = data[field];
        if (data[field] === '2024 - Hiện tại') enVal = '2024 - Present';
        else if (data[field] === 'Học sinh Trung học Cơ sở') enVal = 'Junior High School Student';
        else if (data[field] === 'Trường Quốc tế Tây Úc (WASS)') enVal = 'Western Australian International School System (WASS)';
        else if (data[field] === 'Phát triển tư duy phân tích khoa học, tích cực tham gia các dự án nghiên cứu khoa học và cộng đồng VEX IQ Robotics.') enVal = 'Develop scientific analytical thinking, actively participate in scientific research projects and the VEX IQ Robotics community.';
        else if (data[field] === '2019 - 2024') enVal = '2019 - 2024';
        else if (data[field] === 'Học sinh Tiểu học') enVal = 'Elementary School Student';
        else if (data[field] === 'Xây dựng nền tảng học thuật vững chắc, đạt nhiều giải thưởng học sinh giỏi cấp trường và rèn luyện kỹ năng hoạt động nhóm.') enVal = 'Build a solid academic foundation, achieve many school-level excellent student awards, and practice team-building skills.';
        else if (data[field] === 'Grade 3 Piano ABRSM') enVal = 'Grade 3 Piano ABRSM';
        else if (data[field] === 'Associated Board of the Royal Schools of Music') enVal = 'Associated Board of the Royal Schools of Music';
        else if (data[field] === 'Chứng nhận quốc tế chính thức về năng lực nhạc lý và kỹ thuật diễn tấu Piano cổ điển cấp độ 3.') enVal = 'Official international certification of music theory and classical piano performance competency at level 3.';
        else if (data[field] === 'Tháng 07/2025 - Tháng 08/2025') enVal = 'Jul 2025 - Aug 2025';
        else if (data[field] === 'Trợ giảng Piano cho Trẻ em (Kid Piano TA)') enVal = 'Kid Piano Teaching Assistant (Kid Piano TA)';
        else if (data[field] === 'Amazing Music Center') enVal = 'Amazing Music Center';
        else if (data[field] === '* Hỗ trợ giáo viên đứng lớp quản lý lớp, kiểm tra chỉnh sửa bài tập kỹ thuật ngón tay cho các bé học viên.\n* Thực hiện biểu diễn piano mẫu để minh họa trực quan phương pháp bấm phím và nhạc lý thực hành cho học sinh.') {
          enVal = '* Support class teachers in managing classes, checking and correcting finger technique exercises for young students.\n* Perform model piano plays to visually demonstrate keyboard methods and practical music theory for students.';
        }
        updatePayload[field] = { vi: data[field], en: enVal };
      }
    });

    if (updated) {
      console.log(`Migrating timeline item to locales: ${doc.id}`);
      await timelineRef.doc(doc.id).update(updatePayload);
    }
  }

  // 3. Skills Migration
  const skillsRef = db.collection('skills');
  const skillsSnap = await skillsRef.get();
  for (const doc of skillsSnap.docs) {
    const data = doc.data();
    if (data.name !== undefined && typeof data.name === 'string') {
      console.log(`Migrating skill name to locales: ${doc.id}`);
      let enVal = data.name;
      if (data.name.includes('Biểu diễn Nghệ thuật & Piano')) enVal = 'Performing Arts & Piano (ABRSM)';
      else if (data.name.includes('Kỹ năng Giao tiếp')) enVal = 'Communication Skills';
      else if (data.name.includes('Kỹ năng Lập kế hoạch')) enVal = 'Planning Skills';
      else if (data.name.includes('Kỹ năng Tin học')) enVal = 'ICT Skills';
      else if (data.name.includes('Thuyết trình trước đám đông')) enVal = 'Public Speaking';

      await skillsRef.doc(doc.id).update({
        name: { vi: data.name, en: enVal }
      });
    }
  }

  // 4. Events Migration
  const eventsRef = db.collection('events');
  const eventsSnap = await eventsRef.get();
  for (const doc of eventsSnap.docs) {
    const data = doc.data();
    let updated = false;
    const updatePayload = {};

    ['category', 'title', 'description', 'highlight_summary', 'location', 'date_string'].forEach(field => {
      if (data[field] !== undefined && typeof data[field] === 'string') {
        updated = true;
        let enVal = data[field];
        if (data[field] === 'Tournament & Volunteering') enVal = 'Tournament & Volunteering';
        else if (data[field] === 'VEX IQ MS World Championship 2026') enVal = 'VEX IQ MS World Championship 2026';
        else if (data[field] === 'Nguyễn Trà My vinh dự đại diện Việt Nam tham gia tranh tài tại đấu trường robot lớn nhất thế giới VEX IQ MS World Championship 2026 tổ chức ở Dallas, Texas. Tại đây, Trà My cũng tích cực tham gia với vai trò tình nguyện viên (Volunteer) hỗ trợ công tác trọng tài, quản lý sân đấu.') {
          enVal = 'Nguyen Tra My was honored to represent Vietnam to compete at the world\'s largest robot arena, the VEX IQ MS World Championship 2026 held in Dallas, Texas. Here, Tra My also actively participated as a volunteer supporting referee work and field management.';
        } else if (data[field] === 'Đại diện Việt Nam tham gia thi đấu tại Giải vô địch thế giới VEX IQ MS World Championship tổ chức tại Hoa Kỳ.') {
          enVal = 'Represented Vietnam to compete at the VEX IQ MS World Championship in the USA.';
        } else if (data[field] === 'Kay Bailey Hutchison Convention Center, Dallas, Texas, USA') enVal = 'Kay Bailey Hutchison Convention Center, Dallas, Texas, USA';
        else if (data[field] === 'Tournament') enVal = 'Tournament';
        else if (data[field] === 'VEX IQ National Championship 2026') enVal = 'VEX IQ National Championship 2026';
        else if (data[field] === 'Xuất sắc giành giải Quán quân đồng đội (Teamwork Champion) tại Giải vô địch Robotics VEX IQ Quốc gia 2026. Bên cạnh đó, Trà My còn nhận thêm giải thưởng thiết kế ấn tượng Amaze Award tại Vòng loại miền Bắc VEX IQ Northern Qualifying.') {
          enVal = 'Excellently won the Teamwork Champion at the National VEX IQ Robotics Championship 2026. In addition, Tra My received the Amaze Award for impressive design at the VEX IQ Northern Qualifying.';
        } else if (data[field] === 'Đoạt giải quán quân đồng đội **Teamwork Champion** giải vô địch robot quốc gia VEX IQ National Championship 2026 và giải **Amaze Award** thiết kế ấn tượng.') {
          enVal = 'Won the **Teamwork Champion** at the VEX IQ National Championship 2026 and the **Amaze Award** for impressive design.';
        } else if (data[field] === 'Vietnam National Tournament Arena') enVal = 'Vietnam National Tournament Arena';
        else if (data[field] === 'Music Performance') enVal = 'Music Performance';
        else if (data[field] === 'Easter Vigil Mass Organist') enVal = 'Easter Vigil Mass Organist';
        else if (data[field] === 'Đảm nhận vai trò nhạc công chơi đàn Organ chính phục vụ Thánh lễ Vọng Phục Sinh (Easter Vigil Mass) tại giáo xứ Mai Khôi. Đây là cột mốc ý nghĩa chứng minh cho sự kiên trì luyện tập, tập trung cao độ và tài năng âm nhạc phục vụ cộng đồng.') {
          enVal = 'Took on the role of playing primary Organ to serve the Easter Vigil Mass at Mai Khoi Parish. This is a significant milestone demonstrating perseverance in practicing, high concentration, and musical talent serving the community.';
        } else if (data[field] === 'Nhạc công Organ phục vụ Thánh lễ Vọng Phục Sinh (Easter Vigil Mass) tại giáo xứ Mai Khôi.') {
          enVal = 'Organist serving the Easter Vigil Mass at Mai Khoi Parish.';
        } else if (data[field] === 'Giáo xứ Mai Khôi, Quận 3, TP. Hồ Chí Minh') enVal = 'Mai Khoi Parish, District 3, Ho Chi Minh City';
        else if (data[field] === 'Music & Performance') enVal = 'Music & Performance';
        else if (data[field] === 'Art Talent Extravaganza Champion') enVal = 'Art Talent Extravaganza Champion';
        else if (data[field] === 'Bùng nổ tài năng nghệ thuật và đạt giải Nhất cuộc thi tìm kiếm tài năng âm nhạc nghệ thuật Art Talent Extravaganza tại Trại hè WASS Summer Camp 2025 với màn trình diễn đầy tự tin, khẳng định cá tính hướng ngoại mạnh mẽ.') {
          enVal = 'Exploded artistic talent and won first place in the Art Talent Extravaganza music and art talent search contest at WASS Summer Camp 2025 with a confident performance, affirming a strong extroverted personality.';
        } else if (data[field] === 'Giải Nhất cuộc thi tìm kiếm tài năng âm nhạc nghệ thuật Art Talent Extravaganza 2025.') {
          enVal = 'Won **First Place** in the Art Talent Extravaganza 2025 music and art talent search.';
        } else if (data[field] === 'Western Australian International School System, TP. HCM') enVal = 'Western Australian International School System, HCMC';
        else if (data[field] === 'Work & Leadership') enVal = 'Work & Leadership';
        else if (data[field] === 'Kid Piano Teaching Assistant') enVal = 'Kid Piano Teaching Assistant';
        else if (data[field] === 'Hoạt động trợ giảng lớp học đàn Piano dành cho trẻ nhỏ tại Amazing Music Center. Trà My hỗ trợ giáo viên đứng lớp quản lý các học viên nhỏ, trực tiếp hướng dẫn tư thế ngón tay và thị phạm chơi đàn piano mẫu cho các bé.') {
          enVal = 'Worked as a piano teaching assistant for young children at Amazing Music Center. Tra My supported the class teacher in managing small students, directly guiding hand posture, and performing model piano playing for the kids.';
        } else if (data[field] === 'Hỗ trợ giáo viên, thị phạm và trợ giảng Piano cho trẻ nhỏ tại Amazing Music Center.') {
          enVal = 'Supported teachers, modeled performances, and assistant-taught piano for small children at Amazing Music Center.';
        } else if (data[field] === 'Amazing Music Center, TP. Hồ Chí Minh') enVal = 'Amazing Music Center, Ho Chi Minh City';
        else if (data[field] === 'Music Concert') enVal = 'Music Concert';
        else if (data[field] === 'Twinkle Twinkle & Daydream Concert') enVal = 'Twinkle Twinkle & Daydream Concert';
        else if (data[field] === 'Trình diễn xuất sắc hai tác phẩm piano cổ điển "Twinkle Twinkle" và "Daydream" trước khán giả tại đêm nhạc báo cáo tài năng của Amazing Music Center, thể hiện vững vàng năng lực từ chứng chỉ Grade 3 Piano ABRSM.') {
          enVal = 'Excellently performed two classical piano pieces "Twinkle Twinkle" and "Daydream" before the audience at the Amazing Music Center student recital concert, strongly showing competence from the ABRSM Grade 3 Piano certificate.';
        } else if (data[field] === 'Trình diễn báo cáo nhạc hội "Twinkle Twinkle" và "Daydream" tại Amazing Music Center.') {
          enVal = 'Performed "Twinkle Twinkle" and "Daydream" recital at Amazing Music Center.';
        } else if (data[field] === 'Amazing Concert Hall, TP. Hồ Chí Minh') enVal = 'Amazing Concert Hall, Ho Chi Minh City';
        else if (data[field] === 'TV Appearance') enVal = 'TV Appearance';
        else if (data[field] === 'Flash Kid & Happy Thursday TV Shows') enVal = 'Flash Kid & Happy Thursday TV Shows';
        else if (data[field] === 'Bộc lộ tính cách năng động, hướng ngoại từ rất sớm khi tham gia chương trình thử thách vượt khó thực tế Flash Kid TV Show cùng với chương trình đào tạo kỹ năng sống Happy Thursday TV Show với vai trò khách mời.') {
          enVal = 'Revealed a dynamic and extroverted personality early on when participating in the Flash Kid challenge reality TV show along with the Happy Thursday life skills training show as a guest.';
        } else if (data[field] === 'Là người chơi, khách mời tham gia các chương trình ghi hình thực tế Flash Kid và Happy Thursday TV Show.') {
          enVal = 'Featured player and guest participant on reality TV shows Flash Kid and Happy Thursday TV Show.';
        } else if (data[field] === 'HTV / VTV Film Studios, TP. Hồ Chí Minh') enVal = 'HTV / VTV Film Studios, Ho Chi Minh City';
        else if (data[field] === 'Science Competition') enVal = 'Science Competition';
        else if (data[field] === 'Innovation Technology Competition 2025') enVal = 'Innovation Technology Competition 2025';
        else if (data[field] === 'Nghiên cứu mô hình khoa học và tranh tài tại ngày hội Sáng tạo công nghệ, đạt giải Nhì cấp trường.') {
          enVal = 'Researched scientific models and competed at the school Innovation Technology day, winning Second Place.';
        } else if (data[field] === 'Giải Nhì cuộc thi sáng tạo công nghệ Innovation Technology Competition 2025.') {
          enVal = 'Won **Second Place** in the Innovation Technology Competition 2025.';
        } else if (data[field] === 'Trường Quốc tế Tây Úc (WASS)') enVal = 'Western Australian International School System (WASS)';
        else if (data[field] === 'Culinary Challenge') enVal = 'Culinary Challenge';
        else if (data[field] === 'Gourmet Delight 2025') enVal = 'Gourmet Delight 2025';
        else if (data[field] === 'Tham gia thử thách làm bánh ngọt sáng tạo và trình bày ẩm thực, đạt giải Ba.') {
          enVal = 'Participated in the creative pastry making and culinary presentation challenge, winning Third Place.';
        } else if (data[field] === 'Giải Ba hội thi ẩm thực sáng tạo Gourmet Delight 2025.') {
          enVal = 'Won **Third Place** in the Gourmet Delight 2025 creative culinary competition.';
        } else if (data[field] === 'Amazing Music Center') enVal = 'Amazing Music Center';
        else if (data[field] === 'Sport Tournament') enVal = 'Sport Tournament';
        else if (data[field] === 'Badminton Girls Singles 6-7') enVal = 'Badminton Girls Singles 6-7';
        else if (data[field] === 'Thi đấu môn cầu lông đơn nữ khối lớp 6-7 và đoạt giải ba cấp trường.') {
          enVal = 'Competed in girls\' singles badminton for grades 6-7 and won third place school-wide.';
        } else if (data[field] === 'Giải Ba môn Cầu lông đơn nữ khối lớp 6-7 cấp trường.') {
          enVal = 'Won **Third Place** in girls\' singles badminton grades 6-7.';
        } else if (data[field] === 'WASS Sports Hall') enVal = 'WASS Sports Hall';
        else if (data[field] === 'VEX IQ ES National Championship 2024') enVal = 'VEX IQ ES National Championship 2024';
        else if (data[field] === 'Tham gia giải vô địch quốc gia bảng tiểu học và đoạt giải thưởng thiết kế ấn tượng Create Award.') {
          enVal = 'Participated in the elementary national championship and won the Create Award for impressive design.';
        } else if (data[field] === 'Đoạt giải thưởng sáng tạo thiết kế Create Award VEX IQ National Championship 2024.') {
          enVal = 'Won the **Create Award** for creative design at the VEX IQ National Championship 2024.';
        } else if (data[field] === 'Vietnam National Arena') enVal = 'Vietnam National Arena';

        updatePayload[field] = { vi: data[field], en: enVal };
      }
    });

    if (updated) {
      console.log(`Migrating event doc to locales: ${doc.id}`);
      await eventsRef.doc(doc.id).update(updatePayload);
    }
  }
}

// Export the db reference for query handlers
module.exports = {
  db,
  seedDatabase,
  migrateToLocales
};

// Automatically check seed check if run directly (node db.js)
if (require.main === module) {
  seedDatabase().then(() => process.exit(0));
}
