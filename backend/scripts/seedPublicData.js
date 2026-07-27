// // scripts/seedPublicData.js
// const mongoose = require('mongoose');
// const Page = require('../models/Page');
// const Setting = require('../models/Setting');

// const seedPages = [
//   {
//     title: 'Home',
//     slug: 'home',
//     content: '<h1>Welcome to Our School</h1><p>We provide quality education for all students.</p>',
//     excerpt: 'Welcome to our school community',
//     metaTitle: 'Home - NAKHS',
//     metaDescription: 'Welcome to NAKHS, providing quality education since 2000',
//     isPublished: true,
//     order: 1,
//     sections: [
//       {
//         type: 'hero',
//         title: 'Welcome to NAKHS',
//         subtitle: 'Excellence in Education Since 2000',
//         content: 'We are committed to providing a nurturing environment where students can thrive academically and personally.',
//         image: '../uploads/sm-hero-2.webp',
//         order: 1
//       },
//       {
//         type: 'stats',
//         title: 'Our Achievements',
//         subtitle: 'Proudly serving the community',
//         data: {
//           students: 1250,
//           teachers: 85,
//           classes: 45,
//           successRate: 98
//         },
//         order: 2
//       },
//       {
//         type: 'features',
//         title: 'Why Choose Us',
//         subtitle: 'We offer the best educational experience',
//         data: [
//           {
//             title: 'Qualified Teachers',
//             description: 'Our teachers are highly qualified and experienced'
//           },
//           {
//             title: 'Modern Facilities',
//             description: 'State-of-the-art classrooms and laboratories'
//           },
//           {
//             title: 'Holistic Development',
//             description: 'Focus on academic and personal growth'
//           }
//         ],
//         order: 3
//       }
//     ]
//   },
//   {
//     title: 'About Us',
//     slug: 'about',
//     content: '<h1>About NAKHS</h1><p>Learn about our history, mission, and values.</p>',
//     excerpt: 'Learn about NAKHS history and mission',
//     metaTitle: 'About Us - NAKHS',
//     metaDescription: 'Learn about NAKHS history, mission, and values',
//     isPublished: true,
//     order: 2,
//     sections: [
//       {
//         type: 'content',
//         title: 'Our History',
//         content: 'Founded in 2000, NAKHS has been serving the community for over two decades...',
//         order: 1
//       },
//       {
//         type: 'team',
//         title: 'Our Leadership',
//         data: [
//           {
//             name: 'Principal Name',
//             role: 'Principal',
//             description: 'Experienced educator with 20+ years in school administration'
//           }
//         ],
//         order: 2
//       }
//     ]
//   },
//   {
//     title: 'Contact Us',
//     slug: 'contact',
//     content: '<h1>Get in Touch</h1><p>We would love to hear from you.</p>',
//     excerpt: 'Get in touch with NAKHS',
//     metaTitle: 'Contact Us - NAKHS',
//     metaDescription: 'Contact NAKHS for admissions and inquiries',
//     isPublished: true,
//     order: 3,
//     sections: [
//       {
//         type: 'content',
//         title: 'Visit Our Campus',
//         content: 'We welcome visitors and prospective students to tour our campus.',
//         order: 1
//       }
//     ]
//   }
// ];

// const seedSettings = [
//   // General Settings
//   {
//     key: 'SCHOOL_NAME',
//     value: 'Nakhs School',
//     type: 'string',
//     category: 'general',
//     label: 'School Name',
//     description: 'The official name of the school',
//     isPublic: true
//   },
//   {
//     key: 'SCHOOL_TAGLINE',
//     value: 'Excellence in Education',
//     type: 'string',
//     category: 'general',
//     label: 'School Tagline',
//     description: 'Brief tagline or motto',
//     isPublic: true
//   },
//   {
//     key: 'SCHOOL_LOGO',
//     value: '../uploads/logo.png',
//     type: 'string',
//     category: 'general',
//     label: 'School Logo',
//     description: 'Path to the school logo image',
//     isPublic: true
//   },
//   {
//     key: 'SCHOOL_ESTABLISHED',
//     value: 2000,
//     type: 'number',
//     category: 'general',
//     label: 'Established Year',
//     description: 'Year the school was established',
//     isPublic: true
//   },

//   // Contact Settings
//   {
//     key: 'SCHOOL_ADDRESS',
//     value: '123 Education Street, Learning City, 12345',
//     type: 'string',
//     category: 'contact',
//     label: 'School Address',
//     description: 'Complete school address',
//     isPublic: true
//   },
//   {
//     key: 'SCHOOL_PHONE',
//     value: '+1 (555) 123-4567',
//     type: 'string',
//     category: 'contact',
//     label: 'Phone Number',
//     description: 'Main school phone number',
//     isPublic: true
//   },
//   {
//     key: 'SCHOOL_EMAIL',
//     value: 'info@school.edu',
//     type: 'string',
//     category: 'contact',
//     label: 'Email Address',
//     description: 'Main school email address',
//     isPublic: true
//   },

//   // Social Media
//   {
//     key: 'FACEBOOK_URL',
//     value: 'https://facebook.com/school',
//     type: 'string',
//     category: 'social',
//     label: 'Facebook URL',
//     description: 'School Facebook page URL',
//     isPublic: true
//   },
//   {
//     key: 'TWITTER_URL',
//     value: 'https://twitter.com/school',
//     type: 'string',
//     category: 'social',
//     label: 'Twitter URL',
//     description: 'School Twitter handle URL',
//     isPublic: true
//   },
//   {
//     key: 'INSTAGRAM_URL',
//     value: 'https://instagram.com/school',
//     type: 'string',
//     category: 'social',
//     label: 'Instagram URL',
//     description: 'School Instagram profile URL',
//     isPublic: true
//   },

//   // SEO Settings
//   {
//     key: 'META_DESCRIPTION',
//     value: 'Quality education for all students in a nurturing environment',
//     type: 'string',
//     category: 'seo',
//     label: 'Default Meta Description',
//     description: 'Default meta description for SEO',
//     isPublic: true
//   },
//   {
//     key: 'META_KEYWORDS',
//     value: 'school, education, learning, students, teachers',
//     type: 'string',
//     category: 'seo',
//     label: 'Meta Keywords',
//     description: 'Default meta keywords for SEO',
//     isPublic: true
//   }
// ];

// const seedDatabase = async () => {
//   try {
//     // Connect to MongoDB
//     await mongoose.connect('mongodb+srv://rashadmiya_db_user:anything6464736373464@cluster0.e7sa98w.mongodb.net/sm?appName=Cluster0');
//     console.log('Connected to MongoDB');

//     // Clear existing data (optional - comment out if you don't want to clear)
//     // await Page.deleteMany({});
//     // await Setting.deleteMany({});
//     // console.log('Cleared existing data');

//     // Seed Pages
//     for (const pageData of seedPages) {
//       const existingPage = await Page.findOne({ slug: pageData.slug });
//       if (!existingPage) {
//         await Page.create(pageData);
//         console.log(`Created page: ${pageData.title}`);
//       } else {
//         console.log(`Page already exists: ${pageData.title}`);
//       }
//     }

//     // Seed Settings
//     for (const settingData of seedSettings) {
//       await Setting.findOneAndUpdate(
//         { key: settingData.key },
//         settingData,
//         { upsert: true, new: true }
//       );
//       console.log(`Upserted setting: ${settingData.key}`);
//     }

//     console.log('Database seeding completed successfully!');
//     process.exit(0);

//   } catch (error) {
//     console.error('Seeding error:', error);
//     process.exit(1);
//   }
// };

// // Run if called directly
// if (require.main === module) {
//   seedDatabase();
// }

// module.exports = { seedPages, seedSettings, seedDatabase };

// scripts/seedPublicData.js
const mongoose = require('mongoose');

// ---------------------------
// 1. CONNECT TO DATABASE
// ---------------------------
async function connectDB() {
  try {
    await mongoose.connect('mongodb+srv://rashadmiya_db_user:anything6464736373464@cluster0.e7sa98w.mongodb.net/sm?appName=Cluster0', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✓ MongoDB connected");
  } catch (error) {
    console.error("✗ MongoDB connection failed:");
    console.error(error);
    process.exit(1);
  }
}

// ---------------------------
// 2. LOAD MODELS
// ---------------------------
const Announcement = require('../models/Announcement');
const User = require('../models/User');

// ---------------------------
// 3. SEED DATA
// ---------------------------
const seedAnnouncements = [
  {
    title: 'Welcome to New Academic Year',
    content: 'We are excited to welcome all students and parents to the new academic year. Classes will begin on September 1st.',
    excerpt: 'New academic year starting soon',
    category: 'academic',
    priority: 'high',
    isPublished: true,
    isPinned: true,
    startDate: new Date(),
    targetAudience: ['students', 'parents', 'teachers']
  },
  {
    title: 'Sports Day Announcement',
    content: 'Annual sports day will be held on October 15th. All students are encouraged to participate.',
    excerpt: 'Annual sports day coming up',
    category: 'sports',
    priority: 'medium',
    isPublished: true,
    startDate: new Date(),
    targetAudience: ['students', 'parents']
  },
  {
    title: 'Parent-Teacher Meeting',
    content: 'Quarterly parent-teacher meeting scheduled for next week. Please check the schedule.',
    excerpt: 'Parent-teacher meeting announcement',
    category: 'general',
    priority: 'medium',
    isPublished: true,
    startDate: new Date(),
    targetAudience: ['parents', 'teachers']
  }
];

// ---------------------------
// 4. SEED FUNCTION
// ---------------------------
async function seedDatabase() {
  await connectDB();

  try {
    console.log("\n--- Seeding Announcements ---");

    const defaultUser = await User.findOne().select('_id');
    if (!defaultUser) {
      console.error("✗ No user found in DB. Please create at least one user first.");
      process.exit(1);
    }

    for (const announcementData of seedAnnouncements) {
      const exists = await Announcement.findOne({ title: announcementData.title });

      if (exists) {
        console.log(`• Skipped (already exists): ${announcementData.title}`);
        continue;
      }

      announcementData.createdBy = defaultUser._id;

      await Announcement.create(announcementData);
      console.log(`✓ Created announcement: ${announcementData.title}`);
    }

    console.log("\n✓ Seeding completed successfully.");
  } catch (err) {
    console.error("✗ Error seeding database:");
    console.error(err);
  }

  mongoose.connection.close();
  console.log("\n✓ MongoDB connection closed.");
}

// ---------------------------
// 5. RUN SCRIPT
// ---------------------------
seedDatabase();
