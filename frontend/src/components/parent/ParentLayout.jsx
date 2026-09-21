// components/parent/ParentLayout.jsx
import { NavLink, Outlet, useNavigate, Navigate } from "react-router-dom";
import {
    LayoutDashboard,
    Users,
    Calendar,
    BookOpen,
    DollarSign,
    User as UserIcon,
    LogOut,
    Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetParentMeQuery, useParentLogoutMutation } from "@/features/apis/parentAuthApi";
import { useAppSelector } from "@/features/store";

const NAV = [
    { to: "/parent",              label: "Dashboard",   icon: LayoutDashboard, end: true },
    { to: "/parent/children",     label: "My Children", icon: Users },
    { to: "/parent/attendance",   label: "Attendance",  icon: Calendar },
    { to: "/parent/results",      label: "Results",     icon: BookOpen },
    { to: "/parent/payments",     label: "Payments",    icon: DollarSign },
    { to: "/parent/profile",      label: "Profile",     icon: UserIcon },
];

export default function ParentLayout() {
    const navigate = useNavigate();

    // This query rehydrates the session on every mount (RTK Query dedupes it).
    // The parentAuthSlice in Redux is the fast path; the query is the source of truth.
    const { data, isLoading, error } = useGetParentMeQuery();

    const { parent, isAuthenticated } = useAppSelector((s) => s.parentAuth);
    const [logout] = useParentLogoutMutation();

    // 1) While checking the cookie, don't flash the layout
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-gray-500">
                Loading…
            </div>
        );
    }

    // 2) No valid cookie → login
    if (error || !data?.parent) {
        return <Navigate to="/parent/login" replace />;
    }

    // 3) Temp PIN → force change before entering
    if (data.parent.pinIsTemp) {
        return <Navigate to="/parent/change-pin" replace />;
    }

    const activeParent = parent || data.parent;

    const handleLogout = async () => {
        try {
            await logout().unwrap();
        } catch {
            // Even if the API call fails, still redirect the user out
        }
        navigate("/parent/login", { replace: true });
    };

    return (
        <div className="min-h-screen flex bg-gray-50">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r flex flex-col">
                {/* Brand */}
                <div className="h-16 flex items-center gap-2 px-5 border-b">
                    <div className="w-9 h-9 bg-emerald-100 rounded-full flex items-center justify-center">
                        <span className="text-lg">👪</span>
                    </div>
                    <div>
                        <p className="font-semibold text-sm">Parent Portal</p>
                        <p className="text-xs text-gray-500 truncate max-w-[140px]">
                            {activeParent?.name}
                        </p>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
                    {NAV.map(({ to, label, icon: Icon, end }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={end}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                                    isActive
                                        ? "bg-emerald-50 text-emerald-700 font-medium"
                                        : "text-gray-600 hover:bg-gray-100"
                                }`
                            }
                        >
                            <Icon className="w-4 h-4" />
                            {label}
                        </NavLink>
                    ))}
                </nav>

                {/* Footer actions */}
                <div className="p-3 border-t space-y-1">
                    <Button
                        variant="ghost"
                        className="w-full justify-start gap-2 text-gray-600 hover:bg-gray-100"
                        asChild
                    >
                        <NavLink to="/">
                            <Home className="w-4 h-4" />
                            Back to Home
                        </NavLink>
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={handleLogout}
                        className="w-full justify-start gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </Button>
                </div>
            </aside>

            {/* Main */}
            <main className="flex-1 min-w-0 overflow-x-hidden">
                <div className="p-6 max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

// // components/parent/ParentLayout.jsx
// import { Button } from "@/components/ui/button";
// import {
//   BookOpen,
//   Calendar,
//   DollarSign,
//   Home,
//   LayoutDashboard,
//   LogOut,
//   User,
//   Users
// } from "lucide-react";
// import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";

// import { useGetParentMeQuery, useParentLogoutMutation } from "@/features/apis/parentAuthApi";
// import { useAppSelector } from "@/features/store";
// import logoImage from "../../assets/appayan-sm-2.png";

// const parentMenu = [
//   { path: "/parent", icon: LayoutDashboard, label: "Dashboard" },
//   { path: "/parent/children", icon: Users, label: "My Children" },
//   { path: "/parent/attendance", icon: Calendar, label: "Attendance" },
//   { path: "/parent/results", icon: BookOpen, label: "Results" },
//   { path: "/parent/payments", icon: DollarSign, label: "Payments" }, // Add this
//   { path: "/parent/profile", icon: User, label: "Profile" },
// ];

// export default function ParentLayout() {
//   const location = useLocation();
//   const navigate = useNavigate();

//   const isSidebarCollapsed = useAppSelector((state) => state.global.isSidebarCollapsed);
//   // const user = useAppSelector((state) => state.user);
//   const { data: meData } = useGetParentMeQuery();
//   const user = meData?.user || {};

// const [logout] = useParentLogoutMutation();

// const handleLogout = async () => {
//     await logout().unwrap();
//     navigate("/parent/login", { replace: true });
// };

//   return (
//     <div className="flex h-screen bg-gray-50">
//       {/* Sidebar */}

//       <div className={`
//       bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
//       transition-all duration-300
//       ${isSidebarCollapsed ? 'w-20' : 'w-64'}
//       flex flex-col
//     `}>
//         {/* Header */}
//         <div className="flex items-center gap-3 px-2 py-2 border-b border-gray-200 dark:border-gray-800 cursor-pointer"
//           onClick={() => navigate("/parent")}>
//           <img className="h-14" src={logoImage} alt="logo" />

//           {!isSidebarCollapsed && (
//             <div className="h-[50%]">
//               <p className="font-bold text-gray-900 dark:text-gray-200 leading-3 text-lg tracking-wide">
//                 Parent Portal
//               </p>
//               <p className="text-xs text-gray-500 dark:text-gray-400 leading-3">{user.name || ""}</p>
//             </div>
//           )}
//         </div>

//         <nav className="flex-1 p-4 space-y-2">
//           {parentMenu.map((item) => {
//             const Icon = item.icon;
//             const isActive = location.pathname === item.path;

//             return (
//               <Link key={item.path} to={item.path}>
//                 <Button
//                   variant={isActive ? "default" : "ghost"}
//                   className="w-full justify-start gap-3"
//                 >
//                   <Icon className="w-4 h-4" />
//                   {item.label}
//                 </Button>
//               </Link>
//             );
//           })}
//         </nav>

//         <div className="p-4 border-t border-gray-200 dark:border-gray-700">
//           <Button
//             variant="outline"
//             className="w-full justify-start gap-3"
//             asChild
//           >
//             <Link to="/">
//               <Home className="w-4 h-4" />
//               Back to Home
//             </Link>
//           </Button>

//           <Button
//             variant="outline"
//             className="w-full justify-start gap-3 text-red-600 hover:text-red-700"
//             onClick={handleLogout}
//           >
//             <LogOut className="w-4 h-4" />
//             Logout
//           </Button>
//         </div>
//       </div>

//       {/* Main Content */}
//       <div className="flex-1 overflow-auto">
//         <div className="p-6">
//           <Outlet />
//         </div>
//       </div>
//     </div>
//   );
// }