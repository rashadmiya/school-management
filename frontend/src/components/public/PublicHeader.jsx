// components/public/PublicHeader.jsx
import { Button } from "@/components/ui/button";
import { useLogOutMutation, useMeQuery } from "@/features/apis/authApi";
import { useGetAllPagesQuery, useGetPublicSettingsQuery } from "@/features/apis/publicApi";
import { useAppDispatch } from "@/features/store";
import { Menu, X, User, LogOut, Home, Bell, Users, LayoutDashboard, ChevronDown, GraduationCap } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { userLoggedOut } from "@/features/slices/authSlice";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import schoolLogo from "../../assets/appayan-sm-2.png";

const PublicHeader = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const userMenuRef = useRef(null);
    const mobileMenuRef = useRef(null);

    const { data: settingsData } = useGetPublicSettingsQuery();
    const { data: pagesData } = useGetAllPagesQuery();

    const settings = settingsData?.settings || {};
    const pages = pagesData?.pages || [];

    const [logOutApiCall, { isLoading: isLoggingOut }] = useLogOutMutation();
    const dispatch = useAppDispatch();
    const { data: meData, isLoading: isAuthLoading } = useMeQuery();
    const user = meData?.user || {};

    // Close mobile menu on route change
    useEffect(() => {
        setIsMenuOpen(false);
        setIsUserMenuOpen(false);
    }, [location.pathname]);

    // Click outside user menu to close
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setIsUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isMenuOpen]);

    const handleLogout = async () => {
        try {
            await logOutApiCall().unwrap();
            dispatch(userLoggedOut());
            toast.success('Logged out successfully');
            navigate('/');
            setIsUserMenuOpen(false);
        } catch (error) {
            toast.error('Failed to logout. Please try again.');
        }
    };

    // Get initials for avatar
    const getInitials = (name) => {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    // Navigation items
    const navItems = [
        { path: '/announcements', label: 'Notices', icon: Bell },
        { path: '/directory', label: 'Directory', icon: Users },
        ...pages.map(page => ({
            path: `/${page.slug === 'home' ? '' : page.slug}`,
            label: page.title,
            icon: GraduationCap
        }))
    ];

    const isActivePath = (path) => {
        if (path === '') return location.pathname === '/';
        return location.pathname === path;
    };

    return (
        <header className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg sticky top-0 z-50">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center h-20">
                    {/* Logo and School Name */}
                    <Link 
                        to="/" 
                        className="flex items-center space-x-3 group transition-transform hover:scale-105"
                    >
                        <div className="relative">
                            <div className="absolute inset-0 bg-white/20 rounded-full blur-sm"></div>
                            <img
                                src={settings.SCHOOL_LOGO || schoolLogo}
                                alt="School Logo"
                                className="h-12 w-12 object-contain rounded-full bg-white/10 p-1 relative z-10 shadow-lg border-2 border-white/30"
                            />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl font-bold text-white drop-shadow-md">
                                {settings.SCHOOL_NAME || "Template School"}
                            </span>
                            <span className="text-xs text-blue-100 font-light">
                                Excellence in Education
                            </span>
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden lg:flex items-center space-x-1">
                        {navItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2
                                    ${isActivePath(item.path)
                                        ? 'bg-white/20 text-white shadow-lg'
                                        : 'text-blue-100 hover:bg-white/10 hover:text-white'
                                    }`}
                            >
                                <item.icon className="w-4 h-4" />
                                <span>{item.label}</span>
                            </Link>
                        ))}

                        {/* User Section */}
                        {isAuthLoading ? (
                            <div className="ml-4 w-8 h-8 bg-white/20 rounded-full animate-pulse"></div>
                        ) : user.name ? (
                            <div className="relative ml-4" ref={userMenuRef}>
                                <button
                                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                    className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200"
                                >
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-medium shadow-lg">
                                        {getInitials(user.name)}
                                    </div>
                                    <span className="text-white text-sm font-medium hidden xl:block">
                                        {user.name.split(' ')[0]}
                                    </span>
                                    <ChevronDown className={`w-4 h-4 text-white transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                                </button>

                                <AnimatePresence>
                                    {isUserMenuOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                            transition={{ duration: 0.15 }}
                                            className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl py-2 border border-gray-100"
                                        >
                                            <div className="px-4 py-3 border-b border-gray-100">
                                                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                                <p className="text-xs text-gray-500">{user.email}</p>
                                            </div>
                                            <Link
                                                to="/admin/dashboard"
                                                className="flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                                onClick={() => setIsUserMenuOpen(false)}
                                            >
                                                <LayoutDashboard className="w-4 h-4" />
                                                <span>Dashboard</span>
                                            </Link>
                                            <button
                                                onClick={handleLogout}
                                                disabled={isLoggingOut}
                                                className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-2 ml-4">
                                <Button 
                                    variant="outline" 
                                    asChild 
                                    className="text-white border-white/30 hover:bg-white/20 hover:text-white transition-all duration-200"
                                >
                                    <Link to="/login">Login</Link>
                                </Button>
                                <Button 
                                    asChild 
                                    className="bg-white text-blue-600 hover:bg-blue-50 hover:scale-105 transition-all duration-200 shadow-lg"
                                >
                                    <Link to="/signup">Sign Up</Link>
                                </Button>
                            </div>
                        )}
                    </nav>

                    {/* Mobile Menu Button */}
                    <button
                        className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors relative z-50"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        {isMenuOpen ? (
                            <X className="w-6 h-6 text-white" />
                        ) : (
                            <Menu className="w-6 h-6 text-white" />
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile Navigation - Full Screen Overlay */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        ref={mobileMenuRef}
                        initial={{ opacity: 0, x: '100%' }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed inset-0 top-20 bg-gradient-to-br from-blue-600 to-blue-800 z-40 lg:hidden"
                    >
                        <div className="container mx-auto px-4 py-6 h-full overflow-y-auto">
                            {/* User Profile Card (Mobile) */}
                            {user.name && (
                                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 mb-6">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                                            {getInitials(user.name)}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-white font-medium text-lg">{user.name}</p>
                                            <p className="text-blue-100 text-sm">{user.email}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Mobile Navigation Links */}
                            <div className="space-y-1">
                                {navItems.map((item) => (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-white transition-all duration-200
                                            ${isActivePath(item.path)
                                                ? 'bg-white/20 shadow-lg'
                                                : 'hover:bg-white/10'
                                            }`}
                                    >
                                        <item.icon className="w-5 h-5" />
                                        <span className="font-medium">{item.label}</span>
                                    </Link>
                                ))}
                            </div>

                            {/* Mobile Action Buttons */}
                            <div className="mt-6 pt-6 border-t border-white/20">
                                {user.name ? (
                                    <div className="space-y-2">
                                        <Link
                                            to="/admin/dashboard"
                                            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-white/20 backdrop-blur-sm rounded-xl text-white font-medium hover:bg-white/30 transition-all duration-200"
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            <LayoutDashboard className="w-5 h-5" />
                                            <span>Dashboard</span>
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            disabled={isLoggingOut}
                                            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-500/20 backdrop-blur-sm rounded-xl text-red-100 font-medium hover:bg-red-500/30 transition-all duration-200"
                                        >
                                            <LogOut className="w-5 h-5" />
                                            <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-3">
                                        <Button 
                                            variant="outline" 
                                            asChild 
                                            className="text-white border-white/30 hover:bg-white/20 hover:text-white"
                                        >
                                            <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                                                Login
                                            </Link>
                                        </Button>
                                        <Button 
                                            asChild 
                                            className="bg-white text-blue-600 hover:bg-blue-50"
                                        >
                                            <Link to="/signup" onClick={() => setIsMenuOpen(false)}>
                                                Sign Up
                                            </Link>
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Footer Info */}
                            <div className="mt-8 text-center text-blue-200 text-sm">
                                <p>© {new Date().getFullYear()} {settings.SCHOOL_NAME || "Template School"}</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
};

export default PublicHeader;