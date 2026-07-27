// components/public/PublicHeader.jsx
import { Button } from "@/components/ui/button";
import { useLogOutMutation, useMeQuery } from "@/features/apis/authApi";
import { useGetAllPagesQuery, useGetPublicSettingsQuery } from "@/features/apis/publicApi";
import { useAppDispatch } from "@/features/store";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import schoolLogo from "../../assets/school-logo.jpg"
import { userLoggedOut } from "@/features/slices/authSlice";

const PublicHeader = () => {
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const { data: settingsData } = useGetPublicSettingsQuery();
    const { data: pagesData } = useGetAllPagesQuery();

    const settings = settingsData?.settings || {};
    const pages = pagesData?.pages || [];

    const [logOutApiCall] = useLogOutMutation();
    const dispatch = useAppDispatch();
    const { data: meData } = useMeQuery();
    const user = meData?.user || {};

    const handleLogout = async () => {
        await logOutApiCall().unwrap();
        dispatch(userLoggedOut());
        navigate('/');
    };


    return (
        <header className="bg-white shadow-sm sticky top-0 z-50">
            <div className="container mx-auto px-4 py-4">
                <div className="flex justify-between items-center">
                    {/* Logo and School Name */}
                    <Link to="/" className="flex items-center space-x-3">
                        {settings.SCHOOL_LOGO && (
                            <img
                                src={schoolLogo}
                                alt="School Logo"
                                className="h-10 w-10 object-contain"
                            />
                        )}
                        <span className="text-xl font-bold text-gray-900">
                            {settings.SCHOOL_NAME || "School Name"}
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center space-x-6">
                        {pages.map((page) => (
                            <Link
                                key={page.slug}
                                to={`/${page.slug === 'home' ? '' : page.slug}`}
                                className="text-gray-700 hover:text-blue-600 transition-colors"
                            >
                                {page.title}
                            </Link>
                        ))}

                        <Link to="/announcements" className="text-gray-700 hover:text-blue-600 transition-colors">
                            Notices
                        </Link>
                        <Link to="/directory" className="text-gray-700 hover:text-blue-600 transition-colors">
                            Directory
                        </Link>
                        {user.name ? (
                            <div className="flex items-center space-x-4">
                                <Button variant="outline" onClick={handleLogout}>
                                    Logout
                                </Button>
                                <Button asChild>
                                    <Link to="/admin/dashboard">
                                        Dashboard
                                    </Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-4">
                                <Button variant="outline" asChild>
                                    <Link to="/login">
                                        Login
                                    </Link>
                                </Button>
                                <Button asChild>
                                    <Link to="/signup">
                                        Sign Up
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </nav>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>

                {/* Mobile Navigation */}
                {isMenuOpen && (
                    <nav className="md:hidden mt-4 pb-4 border-t pt-4">
                        <div className="flex flex-col space-y-3">
                            {pages.map((page) => (
                                <Link
                                    key={page.slug}
                                    to={`/${page.slug === 'home' ? '' : page.slug}`}
                                    className="text-gray-700 hover:text-blue-600 transition-colors py-2"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    {page.title}
                                </Link>
                            ))}

                            {user ? (
                                <div className="flex flex-col space-y-2 pt-2 border-t">
                                    <Button variant="outline" onClick={handleLogout} className="w-full">
                                        Logout
                                    </Button>
                                    <Button asChild className="w-full">
                                        <Link to="/dashboard">
                                            Dashboard
                                        </Link>
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex flex-col space-y-2 pt-2 border-t">
                                    <Button variant="outline" asChild className="w-full">
                                        <Link to="/login">
                                            Login
                                        </Link>
                                    </Button>
                                    <Button asChild className="w-full">
                                        <Link to="/signup">
                                            Sign Up
                                        </Link>
                                    </Button>
                                </div>
                            )}
                        </div>
                    </nav>
                )}
            </div>
        </header>
    );
};

export default PublicHeader;
// import { useLogOutMutation, useMeQuery } from "@/features/apis/authApi";
// import { userLoggedOut } from "@/features/slices/authSlice";
// import { useAppDispatch } from "@/features/store";
// import { Link, useNavigate } from "react-router-dom";


// const PublicHeader = () => {
//     const navigate = useNavigate();

//     const [logOutApiCall] = useLogOutMutation();
//     const dispatch = useAppDispatch();
//     const { data: meData } = useMeQuery();
//     const user = meData?.user || {};

//     const handleLogout = async () => {
//         await logOutApiCall().unwrap();
//         dispatch(userLoggedOut());
//         navigate('/');
//     };

//     console.log("user :", user)
//     return (
//         <header className="bg-white shadow-sm">
//             <div className="container mx-auto px-4 py-4 flex justify-between items-center">
//                 <div className="flex items-center space-x-2">
//                     <img src="/logo.png" alt="School Logo" className="h-10" />
//                     <span className="text-xl font-bold">NAKHS</span>
//                 </div>
//                 <nav>
//                     <ul className="flex space-x-6">
//                         <li><Link to="/" className="text-gray-700 hover:text-blue-600">Home</Link></li>
//                         <li><Link to="/about" className="text-gray-700 hover:text-blue-600">About</Link></li>
//                         <li><Link to="/contact" className="text-gray-700 hover:text-blue-600">Contact</Link></li>
//                         {user.name ? (
//                             <>
//                                 <li>
//                                     <button onClick={handleLogout} className="text-gray-700 hover:text-blue-600">
//                                         Logout
//                                     </button>
//                                 </li>
//                                 <li>
//                                     <Link to="/admin/dashboard" className="text-gray-700 hover:text-blue-600">
//                                         Dashboard
//                                     </Link>
//                                 </li>
//                             </>
//                         ) : (
//                             <>
//                                 <li><Link to="/login" className="text-gray-700 hover:text-blue-600">Login</Link></li>
//                                 <li><Link to="/signup" className="text-gray-700 hover:text-blue-600">Sign Up</Link></li>
//                             </>
//                         )}
//                     </ul>
//                 </nav>
//             </div>
//         </header>
//     );
// };

// export default PublicHeader;