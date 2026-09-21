// components/student/StudentLayout.jsx
import { Button } from "@/components/ui/button";
import { useLogOutMutation } from "@/features/apis/authApi";
import { useAppSelector } from "@/features/store";
import {
  AlarmCheck,
  BookOpen,
  Calendar,
  FileText,
  LayoutDashboard,
  LogOut,
  PenToolIcon,
  User,
  Users,
  Wallet,
} from "lucide-react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import logoImage from "../../assets/appayan-sm-2.png";
import { useState } from "react";

const studentMenu = [
    { path: "/student",                icon: LayoutDashboard, label: "Dashboard" },
    { path: "/student/schedule",       icon: Calendar,        label: "Schedule" },
    { path: "/student/assignments",    icon: BookOpen,        label: "Assignments" },
    { path: "/student/exams",          icon: PenToolIcon,     label: "Exams" },
    { path: "/student/exams/schedule", icon: AlarmCheck,      label: "Exam Routine" },
    { path: "/student/attendance",     icon: Users,           label: "Attendance" },
    { path: "/student/results",        icon: FileText,        label: "Results" },
    { path: "/student/payments",       icon: Wallet,          label: "Payments" },
    { path: "/student/profile",        icon: User,            label: "Profile" },
];

export default function StudentLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const [logOutApiCall] = useLogOutMutation();
    const [loggingOut, setLoggingOut] = useState(false)

    const isSidebarCollapsed = useAppSelector(
      (state) => state.global.isSidebarCollapsed
    );

    const handleLogout = async () => {
      try {
        setLoggingOut(true)
        await logOutApiCall().unwrap();
        navigate("/login");
      } catch (error) {
        console.error("Logout failed:", error);
      }finally{
        setLoggingOut(false)
      }
    };

    // const isSidebarCollapsed = useAppSelector(
    //     (state) => state.global.isSidebarCollapsed
    // );

    // const handleLogout = async () => {
    //     try {
    //         await studentLogout().unwrap();
    //         toast.success("Logged out");
    //     } catch (error) {
    //         console.error("Logout failed:", error);
    //         // Even if the API fails, kick the user out client-side
    //         toast.error("Session ended");
    //     } finally {
    //         navigate("/login", { replace: true });
    //     }
    // };

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <div className={`${isSidebarCollapsed ? "w-20" : "w-64"} flex flex-col bg-white shadow-lg h-screen overflow-y-auto transition-[width] duration-200`}>
                {/* Header */}
                <div
                    className="flex items-center gap-3 px-2 py-2 border-b border-gray-200 dark:border-gray-800 cursor-pointer"
                    onClick={() => navigate("/student")}
                >
                    <img className="h-14" src={logoImage} alt="logo" />
                    {!isSidebarCollapsed && (
                        <div className="h-[50%]">
                            <p className="font-bold text-gray-900 dark:text-gray-200 leading-3 text-lg tracking-wide">
                                Student Portal
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-3">
                                School Management
                            </p>
                        </div>
                    )}
                </div>

                {/* Nav */}
                <nav className="p-3 space-y-1 flex-1">
                    {studentMenu.map((item) => {
                        const Icon = item.icon;
                        // `end` for exact match on /student, prefix match otherwise
                        const isActive =
                            item.path === "/student"
                                ? location.pathname === "/student"
                                : location.pathname.startsWith(item.path);

                        return (
                            <Link key={item.path} to={item.path} title={item.label}>
                                <Button
                                    variant={isActive ? "default" : "ghost"}
                                    className={`w-full ${
                                        isSidebarCollapsed ? "justify-center px-2" : "justify-start gap-3"
                                    }`}
                                >
                                    <Icon className="w-4 h-4 flex-shrink-0" />
                                    {!isSidebarCollapsed && <span>{item.label}</span>}
                                </Button>
                            </Link>
                        );
                    })}
                </nav>

                {/* Logout */}
                <div className="p-3 border-t">
                    <Button
                        variant="outline"
                        disabled={loggingOut}
                        className={`w-full ${
                            isSidebarCollapsed ? "justify-center px-2" : "justify-start gap-3"
                        } text-red-600 hover:text-red-700`}
                        onClick={handleLogout}
                    >
                        <LogOut className="w-4 h-4 flex-shrink-0" />
                        {!isSidebarCollapsed && (
                            <span>{loggingOut ? "Logging out…" : "Logout"}</span>
                        )}
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                <div className="p-6">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}

// // components/student/StudentLayout.jsx
// import { Button } from "@/components/ui/button";
// import { useLogOutMutation } from "@/features/apis/authApi";
// import { useAppSelector } from "@/features/store";
// import {
//   AlarmCheck,
//   BookOpen,
//   Calendar,
//   FileText,
//   LayoutDashboard,
//   LogOut,
//   LucideBadgeEuro,
//   PenToolIcon,
//   User,
//   Users
// } from "lucide-react";
// import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
// import logoImage from "../../assets/appayan-sm-2.png";

// const studentMenu = [
//   { path: "/student", icon: LayoutDashboard, label: "Dashboard" },
//   { path: "/student/schedule", icon: Calendar, label: "Schedule" },
//   { path: "/student/assignments", icon: BookOpen, label: "Assignments" },
//   { path: "/student/exams", icon: PenToolIcon, label: "Exams" },
//   { path: "/student/exams-schedule", icon: AlarmCheck, label: "Exam Routine" },
//   { path: "/student/attendance", icon: Users, label: "Attendance" },
//   { path: "/student/results", icon: FileText, label: "Results" },
//   // { path: "/student/payments", icon: DollarSign, label: "Payments" },
//   { path: "/student/ledger", icon: LucideBadgeEuro, label: "Student Ledger" },
//   { path: "/student/profile", icon: User, label: "Profile" },
  
// ];


// export default function StudentLayout() {
//   const location = useLocation();
//   const navigate = useNavigate();
//   const [logOutApiCall] = useLogOutMutation();

//   const isSidebarCollapsed = useAppSelector(
//     (state) => state.global.isSidebarCollapsed
//   );

//   const handleLogout = async () => {
//     try {
//       await logOutApiCall().unwrap();
//       navigate("/login");
//     } catch (error) {
//       console.error("Logout failed:", error);
//     }
//   };
//   return (
//     <div className="flex h-screen bg-gray-50">
//       {/* Sidebar */}
//       <div className="w-64 flex flex-col bg-white shadow-lg h-screen overflow-y-auto">

//         {/* Header */}
//         <div className="flex items-center gap-3 px-2 py-2 border-b border-gray-200 dark:border-gray-800 cursor-pointer"
//           onClick={() => navigate("/student")}>
//           <img className="h-14" src={logoImage} alt="logo" />

//           {!isSidebarCollapsed && (
//             <div className="h-[50%]">
//               <p className="font-bold text-gray-900 dark:text-gray-200 leading-3 text-lg tracking-wide">
//                 Student Portal
//               </p>
//               <p className="text-xs text-gray-500 dark:text-gray-400 leading-3">School Management</p>
//             </div>
//           )}
//         </div>

//         <nav className="p-4 space-y-2 flex-1">
//           {studentMenu.map((item) => {
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

//         <div className="flex items-center">
//           <Button
//             variant="outline"
//             className="w-full mx-2 justify-center gap-3 text-red-600 hover:text-red-700"
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