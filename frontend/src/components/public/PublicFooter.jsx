// components/public/PublicFooter.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useGetPublicSettingsQuery } from '@/features/apis/publicApi';
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from 'lucide-react';

const PublicFooter = () => {
  const { data: settingsData } = useGetPublicSettingsQuery();
  const settings = settingsData?.settings || {};

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* School Info */}
          <div>
            <h3 className="text-lg font-bold mb-4">
              {settings.SCHOOL_NAME || "School Name"}
            </h3>
            <div className="space-y-2 text-gray-300">
              {settings.SCHOOL_ADDRESS && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
                  <span>{settings.SCHOOL_ADDRESS}</span>
                </div>
              )}
              {settings.SCHOOL_PHONE && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>{settings.SCHOOL_PHONE}</span>
                </div>
              )}
              {settings.SCHOOL_EMAIL && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>{settings.SCHOOL_EMAIL}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/about" className="text-gray-300 hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="text-gray-300 hover:text-white transition-colors">Contact</Link></li>
              <li><Link to="/login" className="text-gray-300 hover:text-white transition-colors">Login</Link></li>
              <li><Link to="/signup" className="text-gray-300 hover:text-white transition-colors">Sign Up</Link></li>
            </ul>
          </div>

          {/* Academics */}
          <div>
            <h3 className="text-lg font-bold mb-4">Academics</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Programs</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Admissions</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Calendar</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Resources</a></li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="text-lg font-bold mb-4">Follow Us</h3>
            <div className="flex space-x-4">
              {settings.FACEBOOK_URL && (
                <a 
                  href={settings.FACEBOOK_URL} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  <Facebook className="w-5 h-5" />
                </a>
              )}
              {settings.TWITTER_URL && (
                <a 
                  href={settings.TWITTER_URL} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  <Twitter className="w-5 h-5" />
                </a>
              )}
              {settings.INSTAGRAM_URL && (
                <a 
                  href={settings.INSTAGRAM_URL} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  <Instagram className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p className="text-gray-300">
            &copy; {currentYear} {settings.SCHOOL_NAME || "School Name"}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;

// import React from 'react'

// const PublicFooter = () => {
//   return (
//     <footer className="bg-gray-800 text-white py-8">
//       <div className="container mx-auto px-4">
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
//           <div>
//             <h3 className="text-lg font-bold mb-4">School Name</h3>
//             <p>Address line 1</p>
//             <p>Address line 2</p>
//             <p>Phone: (123) 456-7890</p>
//             <p>Email: info@school.edu</p>
//           </div>
//           <div>
//             <h3 className="text-lg font-bold mb-4">Quick Links</h3>
//             <ul className="space-y-2">
//               <li><a href="/about" className="hover:text-blue-300">About Us</a></li>
//               <li><a href="/contact" className="hover:text-blue-300">Contact</a></li>
//               <li><a href="/login" className="hover:text-blue-300">Login</a></li>
//             </ul>
//           </div>
//           <div>
//             <h3 className="text-lg font-bold mb-4">Follow Us</h3>
//             <div className="flex space-x-4">
//               <a href="#" className="hover:text-blue-300">Facebook</a>
//               <a href="#" className="hover:text-blue-300">Twitter</a>
//               <a href="#" className="hover:text-blue-300">Instagram</a>
//             </div>
//           </div>
//         </div>
//         <div className="border-t border-gray-700 mt-8 pt-4 text-center">
//           <p>&copy; {new Date().getFullYear()} School Name. All rights reserved.</p>
//         </div>
//       </div>
//     </footer>
//   );
// };

// export default PublicFooter;