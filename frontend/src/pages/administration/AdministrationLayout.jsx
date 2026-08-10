// /src/pages/administration/AdministrationLayout.jsx
import { FileText, ImageIcon, Key, Megaphone, Settings, Shield, Users } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';


const AdministrationLayout = () => {
  const adminLinks = [
    {
      name: "Settings",
      icon: <Settings className="w-4 h-4" />,
      path: "/admin/settings",
      description: "Configure system settings and preferences"
    },
    {
      name: 'Announcements',
      path: '/admin/announcements',
      icon: <Megaphone className="w-4 h-4" />,
      description: 'Announcements'
    },
    {
      name: 'User Management',
      path: '/admin/user-management',
      icon: <Users className="w-4 h-4" />,
      description: 'Manage all system users'
    },
    {
      name: 'Roles & Permissions',
      path: '/admin/roles',
      icon: <Key className="w-4 h-4" />,
      description: 'Configure user roles and permissions'
    },
    {
      name: 'Public Pages',
      path: '/admin/pages',
      icon: <FileText className="w-4 h-4" />,
      description: 'Create and updates public pages'
    },
    {
      name: "Gallery",
      path: "/admin/gallery",
      icon: <ImageIcon className='w-4 h-4' />,
      description: 'Manage school gallery images, categories, and descriptions'
    },
    // Add more admin features here in the future
  ];


  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="w-6 h-6" />
              Administration
            </h1>
            <p className="text-gray-600 mt-2">
              Manage system settings, users, roles, and other administrative functions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {adminLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `block p-6 bg-white rounded-lg border hover:shadow-md transition-shadow ${isActive
                    ? 'border-blue-500 ring-2 ring-blue-500/10'
                    : 'border-gray-200 hover:border-blue-300'
                  }`
                }
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${link.name === 'User Management' ? 'bg-blue-100 text-blue-600' :
                    link.name === 'Roles & Permissions' ? 'bg-purple-100 text-purple-600' :
                      'bg-green-100 text-green-600'
                    }`}>
                    {link.icon}
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">{link.name}</h2>
                </div>
                <p className="text-gray-600 text-sm">{link.description}</p>
              </NavLink>
            ))}
          </div>

          {/* Nested Routes will render here */}
          <div className="mt-8">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdministrationLayout;