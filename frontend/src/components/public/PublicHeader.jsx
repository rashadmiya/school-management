// components/public/PublicHeader.jsx
import { Button } from "@/components/ui/button";
import { useLogOutMutation, useMeQuery } from "@/features/apis/authApi";
import { useGetAllPagesQuery, useGetPublicSettingsQuery } from "@/features/apis/publicApi";
import { userLoggedOut } from "@/features/slices/authSlice";
import { useAppDispatch } from "@/features/store";
import { AnimatePresence, motion } from "framer-motion";
import {
    Bell,
    BookOpen,
    Briefcase,
    ChevronDown,
    ChevronRight,
    Club,
    FlaskConical,
    GitBranch,
    GraduationCap,
    Grid, // Gallery
    Info,
    LayoutDashboard,
    ListChecks,
    LogOut,
    Menu,
    Mic,
    Sparkles,
    UserRound,
    Users,
    UsersRound,
    X
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import schoolLogo from "../../assets/appayan-sm-2.png";
import { backend_url } from "@/utils/server";


const NAV_ITEMS = [
    {
        label: "Administration",
        icon: Users,
        children: [
            { label: "Governing Body", path: "/administration/governing-body", icon: UsersRound },
            { label: "Teachers List", path: "/administration/teachers", icon: UserRound },
            { label: "Staff Information", path: "/administration/staff", icon: Briefcase },
        ],
    },
    {
        label: "Classes",
        icon: BookOpen,
        children: [
            { label: "Class List", path: "/classes", icon: ListChecks },
        ],
    },
    {
        label: "Clubs",
        icon: Club,
        path: "/clubs"
        // children: [
        //     { label: "All Clubs", path: "/clubs", icon: Club },
        //     { label: "Cultural Clubs", path: "/clubs?type=cultural", icon: Sparkles },
        //     { label: "Science Club", path: "/clubs?type=science", icon: FlaskConical },
        //     { label: "Language Club", path: "/clubs?type=language", icon: Mic },
        //     { label: "Debate Club", path: "/clubs?type=debate", icon: GitBranch },
        // ],
    },
    {
        label: "Notices",
        path: "/announcements",
        icon: Bell,
    },
    {
        label: "Gallery",
        path: "/gallery",
        icon: Grid,
    },
    {
        label: "About Us",
        path: "/about",
        icon: Info,
    },
];

const PublicHeader = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [openDropdown, setOpenDropdown] = useState(null);
    const [openMobileSub, setOpenMobileSub] = useState(null);
    const userMenuRef = useRef(null);
    const mobileMenuRef = useRef(null);
    const dropdownTimeoutRef = useRef(null);

    const { data: settingsData } = useGetPublicSettingsQuery();
    const { data: pagesData } = useGetAllPagesQuery();

    const settings = settingsData?.settings || {};
    const pages = pagesData?.pages || [];

    const [logOutApiCall, { isLoading: isLoggingOut }] = useLogOutMutation();
    const dispatch = useAppDispatch();
    const { data: meData, isLoading: isAuthLoading } = useMeQuery();
    const user = meData?.user || {};

    // Close menus on route change
    useEffect(() => {
        setIsMenuOpen(false);
        setIsUserMenuOpen(false);
        setOpenDropdown(null);
        setOpenMobileSub(null);
    }, [location.pathname]);

    // Click outside user menu
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setIsUserMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Prevent body scroll on mobile
    useEffect(() => {
        document.body.style.overflow = isMenuOpen ? "hidden" : "unset";
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isMenuOpen]);

    useEffect(() => {
        return () => {
            if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
        };
    }, []);

    const handleLogout = async () => {
        try {
            await logOutApiCall().unwrap();
            dispatch(userLoggedOut());
            toast.success("Logged out successfully");
            navigate("/");
            setIsUserMenuOpen(false);
        } catch (error) {
            toast.error("Failed to logout. Please try again.");
        }
    };

    const getInitials = (name) =>
        name
            .split(" ")
            .map((word) => word[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);

    const isActive = (item) => {
        if (item.path && location.pathname === item.path) return true;
        if (item.children) {
            return item.children.some((child) => child.path && location.pathname === child.path);
        }
        return false;
    };

    const isParentActive = (item) => {
        if (item.path && location.pathname === item.path) return true;
        if (item.children) {
            return item.children.some((child) => child.path && location.pathname === child.path);
        }
        return false;
    };

    const handleMouseEnter = (index) => {
        if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
        setOpenDropdown(index);
    };

    const handleMouseLeave = () => {
        dropdownTimeoutRef.current = setTimeout(() => {
            setOpenDropdown(null);
        }, 150);
    };

    const toggleMobileSub = (index) => {
        setOpenMobileSub(openMobileSub === index ? null : index);
    };

    return (
        <header className="w-full px-10 bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
            <div className="w-full">
                <div className="flex justify-between items-center h-16">
                    {/* Logo and School Name */}
                    <Link
                        to="/"
                        className="flex items-center space-x-3 flex-shrink-0"
                    >
                        <img
                            src={`${backend_url}$settings.SCHOOL_LOGO` || schoolLogo}
                            alt="School Logo"
                            className="h-10 w-10 object-contain rounded-full border border-gray-200"
                        />
                        <div className="hidden sm:block">
                            <span className="text-lg font-semibold text-gray-800">
                                {settings.SCHOOL_NAME || "Template School"}
                            </span>
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden lg:flex items-center space-x-1">
                        {NAV_ITEMS.map((item, index) => {
                            const hasChildren = item.children && item.children.length > 0;
                            const isItemActive = isActive(item);

                            if (hasChildren) {
                                return (
                                    <div
                                        key={item.label}
                                        className="relative"
                                        onMouseEnter={() => handleMouseEnter(index)}
                                        onMouseLeave={handleMouseLeave}
                                    >
                                        <button
                                            className={`px-1 py-1.5 rounded-md text-sm font-medium transition-all duration-200 flex items-center space-x-1.5 ${isItemActive || isParentActive(item)
                                                ? "text-blue-600 bg-blue-50"
                                                : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                                                }`}
                                        >
                                            <item.icon className="w-4 h-4" />
                                            <span>{item.label}</span>
                                            <ChevronDown
                                                className={`w-3.5 h-3.5 transition-transform duration-200 ${openDropdown === index ? "rotate-180" : ""
                                                    }`}
                                            />
                                        </button>
                                        <AnimatePresence>
                                            {openDropdown === index && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -4 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -4 }}
                                                    transition={{ duration: 0.15 }}
                                                    className="absolute left-0 mt-1 w-52 bg-white rounded-lg shadow-lg border border-gray-100 py-1.5"
                                                >
                                                    {item.children.map((child) => (
                                                        <Link
                                                            key={child.path}
                                                            to={child.path}
                                                            className={`flex items-center space-x-2.5 px-4 py-2 text-sm transition-colors ${location.pathname === child.path
                                                                ? "text-blue-600 bg-blue-50"
                                                                : "text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                                                                }`}
                                                        >
                                                            {child.icon && <child.icon className="w-4 h-4" />}
                                                            <span>{child.label}</span>
                                                        </Link>
                                                    ))}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                );
                            } else {
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 flex items-center space-x-1.5 ${isItemActive
                                            ? "text-blue-600 bg-blue-50"
                                            : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                                            }`}
                                    >
                                        <item.icon className="w-4 h-4" />
                                        <span>{item.label}</span>
                                    </Link>
                                );
                            }
                        })}

                        {/* User Section */}
                        <div className="ml-3 pl-3 border-l border-gray-200">
                            {isAuthLoading ? (
                                <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                            ) : user.name ? (
                                <div className="relative" ref={userMenuRef}>
                                    <button
                                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                        className="flex items-center space-x-2 px-2 py-1.5 rounded-md hover:bg-gray-100 transition-colors"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-sm font-medium">
                                            {getInitials(user.name)}
                                        </div>
                                        <ChevronDown
                                            className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${isUserMenuOpen ? "rotate-180" : ""
                                                }`}
                                        />
                                    </button>

                                    <AnimatePresence>
                                        {isUserMenuOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -4 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -4 }}
                                                transition={{ duration: 0.15 }}
                                                className="absolute right-0 mt-1.5 w-56 bg-white rounded-lg shadow-lg border border-gray-100 py-1.5"
                                            >
                                                <div className="px-4 py-2.5 border-b border-gray-100">
                                                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                                </div>
                                                <Link
                                                    to="/admin/dashboard"
                                                    className="flex items-center space-x-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors"
                                                    onClick={() => setIsUserMenuOpen(false)}
                                                >
                                                    <LayoutDashboard className="w-4 h-4" />
                                                    <span>Dashboard</span>
                                                </Link>
                                                <button
                                                    onClick={handleLogout}
                                                    disabled={isLoggingOut}
                                                    className="w-full flex items-center space-x-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                                >
                                                    <LogOut className="w-4 h-4" />
                                                    <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ) : (
                                <div className="flex items-center space-x-2">
                                    <Button
                                        variant="ghost"
                                        asChild
                                        size="sm"
                                        className="text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                                    >
                                        <Link to="/login">Login</Link>
                                    </Button>
                                    <Button
                                        asChild
                                        size="sm"
                                        className="bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                                    >
                                        <Link to="/signup">Sign Up</Link>
                                    </Button>
                                </div>
                            )}
                        </div>
                    </nav>

                    {/* Mobile Menu Button */}
                    <button
                        className="lg:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        {isMenuOpen ? (
                            <X className="w-5 h-5 text-gray-600" />
                        ) : (
                            <Menu className="w-5 h-5 text-gray-600" />
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile Navigation */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        ref={mobileMenuRef}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="lg:hidden bg-white border-t border-gray-200 overflow-hidden"
                    >
                        <div className="container mx-auto px-4 py-4">
                            {/* User Profile Card (Mobile) */}
                            {user.name && (
                                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-medium">
                                            {getInitials(user.name)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                            <p className="text-xs text-gray-500">{user.email}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Mobile Navigation Links */}
                            <div className="space-y-0.5">
                                {NAV_ITEMS.map((item, index) => {
                                    const hasChildren = item.children && item.children.length > 0;
                                    const isItemActive = isActive(item);

                                    if (hasChildren) {
                                        return (
                                            <div key={item.label} className="border-b border-gray-100 last:border-0">
                                                <button
                                                    onClick={() => toggleMobileSub(index)}
                                                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md transition-colors ${isItemActive || isParentActive(item)
                                                        ? "text-blue-600 bg-blue-50"
                                                        : "text-gray-700 hover:bg-gray-50"
                                                        }`}
                                                >
                                                    <div className="flex items-center space-x-2.5">
                                                        <item.icon className="w-4 h-4" />
                                                        <span className="text-sm font-medium">{item.label}</span>
                                                    </div>
                                                    <ChevronRight
                                                        className={`w-4 h-4 transition-transform duration-200 ${openMobileSub === index ? "rotate-90" : ""
                                                            }`}
                                                    />
                                                </button>
                                                <AnimatePresence>
                                                    {openMobileSub === index && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: "auto", opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            transition={{ duration: 0.2 }}
                                                            className="overflow-hidden"
                                                        >
                                                            <div className="ml-6 pl-3 border-l-2 border-gray-200 space-y-0.5 py-1.5">
                                                                {item.children.map((child) => (
                                                                    <Link
                                                                        key={child.path}
                                                                        to={child.path}
                                                                        className={`flex items-center space-x-2.5 px-3 py-2 rounded-md text-sm transition-colors ${location.pathname === child.path
                                                                            ? "text-blue-600 bg-blue-50"
                                                                            : "text-gray-600 hover:bg-gray-50 hover:text-blue-600"
                                                                            }`}
                                                                        onClick={() => setIsMenuOpen(false)}
                                                                    >
                                                                        {child.icon && <child.icon className="w-4 h-4" />}
                                                                        <span>{child.label}</span>
                                                                    </Link>
                                                                ))}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        );
                                    } else {
                                        return (
                                            <Link
                                                key={item.path}
                                                to={item.path}
                                                className={`flex items-center space-x-2.5 px-3 py-2.5 rounded-md transition-colors ${isItemActive
                                                    ? "text-blue-600 bg-blue-50"
                                                    : "text-gray-700 hover:bg-gray-50"
                                                    }`}
                                                onClick={() => setIsMenuOpen(false)}
                                            >
                                                <item.icon className="w-4 h-4" />
                                                <span className="text-sm font-medium">{item.label}</span>
                                            </Link>
                                        );
                                    }
                                })}
                            </div>

                            {/* Mobile Action Buttons */}
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                {user.name ? (
                                    <div className="space-y-2">
                                        <Link
                                            to="/admin/dashboard"
                                            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-gray-50 rounded-md text-gray-700 font-medium hover:bg-gray-100 transition-colors"
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            <LayoutDashboard className="w-4 h-4" />
                                            <span>Dashboard</span>
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            disabled={isLoggingOut}
                                            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-red-50 text-red-600 rounded-md font-medium hover:bg-red-100 transition-colors"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button
                                            variant="outline"
                                            asChild
                                            className="text-gray-600 border-gray-300 hover:bg-gray-50"
                                        >
                                            <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                                                Login
                                            </Link>
                                        </Button>
                                        <Button
                                            asChild
                                            className="bg-blue-600 text-white hover:bg-blue-700"
                                        >
                                            <Link to="/signup" onClick={() => setIsMenuOpen(false)}>
                                                Sign Up
                                            </Link>
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
};

export default PublicHeader;