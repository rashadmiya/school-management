// components/Sidebar.jsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useLogOutMutation, useMeQuery } from "@/features/apis/authApi";
import { userLoggedOut } from "@/features/slices/authSlice";
import { useAppDispatch, useAppSelector } from "@/features/store";
import { cn } from "@/lib/utils";
import {
  AlarmClock,
  BarChart3,
  BookMarked,
  BookOpen,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  ClipboardPen,
  FileEdit,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  HandCoins,
  History,
  Home,
  Layers3,
  LayoutGrid,
  LogOut,
  Megaphone,
  Percent,
  Receipt,
  RotateCcw,
  School,
  Settings,
  Shield,
  Trophy,
  UserRound,
  UserRoundCheck,
  UserRoundCog,
  Users,
  Wallet
} from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import logoImage from "../../assets/appayan-sm-2.png";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const [logOutApiCall] = useLogOutMutation();
  const { data: meData } = useMeQuery();
  const user = meData?.user || {};
  const [expandedMenus, setExpandedMenus] = useState({});

  const isSidebarCollapsed = useAppSelector(
    (state) => state.global.isSidebarCollapsed
  );
  const roleName = (user?.role?.name || user?.role || "student").toString();

  const toggleMenu = (menuKey) => {
    if (isSidebarCollapsed) return;
    setExpandedMenus(prev => ({
      ...prev,
      [menuKey]: !prev[menuKey]
    }));
  };

const navItems = [
  {
    label: "Dashboard",
    icon: Home,
    path: "/admin/dashboard",
    roles: ["admin"],
  },

  {
    label: "Announcements",
    icon: Megaphone,
    path: "/admin/announcements",
    roles: ["admin", "teacher"],
  },

  // =========================
  // ADMIN / TEACHER
  // =========================

  {
    label: "Committee",
    icon: Users,
    path: "/admin/committee",
    roles: ["admin"],
  },

  {
    label: "Teachers",
    icon: GraduationCap,
    path: "/admin/teachers",
    roles: ["admin"],
  },

  {
    label: "Staffs",
    icon: UserRoundCog,
    path: "/admin/staff",
    roles: ["admin"],
  },

  {
    label: "Students",
    icon: GraduationCap,
    path: "/admin/students",
    roles: ["admin", "teacher"],
  },

  {
    label: "Cabinet",
    icon: School,
    path: "/admin/cabinet",
    roles: ["admin", "teacher"],
  },

  {
    label: "Classes",
    icon: Layers3,
    path: "/admin/classes",
    roles: ["admin", "teacher"],
  },

  {
    label: "Sections",
    icon: LayoutGrid,
    path: "/admin/sections",
    roles: ["admin", "teacher"],
  },

  {
    label: "Clubs",
    icon: Trophy,
    path: "/admin/clubs",
    roles: ["admin", "teacher"],
  },

  {
    label: "Subjects",
    icon: BookOpen,
    path: "/admin/subjects",
    roles: ["admin", "teacher"],
  },

  {
    label: "Routine",
    icon: CalendarDays,
    path: "/admin/routines",
    roles: ["admin", "teacher"],
  },

  {
    label: "Attendance",
    icon: UserRoundCheck,
    path: "/admin/attendances",
    roles: ["admin", "teacher"],
  },

  {
    label: "Exam Routine",
    icon: AlarmClock,
    path: "/admin/exam-routines",
    roles: ["admin", "teacher"],
  },

  {
    label: "Assignments",
    icon: ClipboardPen,
    path: "/admin/assignments",
    roles: ["admin", "teacher"],
  },

  {
    label: "Results",
    icon: FileSpreadsheet,
    path: "/admin/results",
    roles: ["admin", "teacher"],
  },

  {
    label: "Result Sheets",
    icon: FileSpreadsheet,
    path: "/admin/result-sheets",
    roles: ["admin", "teacher"],
  },

  // =========================
  // FINANCE
  // =========================

  {
    label: "Finance",
    icon: Wallet,
    roles: ["admin", "teacher"],
    children: [
      {
        label: "Finance Dashboard",
        path: "/admin/finance",
        icon: BarChart3,
      },
      {
        label: "Fee Templates",
        path: "/admin/finance/fees/templates",
        icon: FileText,
      },
      {
        label: "Student Fees",
        path: "/admin/finance/fees/students",
        icon: Receipt,
      },
      {
        label: "Apply Fees",
        path: "/admin/finance/fees/apply",
        icon: FileEdit,
      },
      {
        label: "Receive Payment",
        path: "/admin/finance/payments/receive",
        icon: HandCoins,
      },
      {
        label: "Payment History",
        path: "/admin/finance/payments/history",
        icon: History,
      },
      {
        label: "Advance Balance",
        path: "/admin/finance/payments/advance",
        icon: CircleDollarSign,
      },
      {
        label: "Refunds",
        path: "/admin/finance/refunds",
        icon: RotateCcw,
      },
      {
        label: "Request Waiver",
        path: "/admin/finance/waivers/request",
        icon: Percent,
      },
      {
        label: "Approve Waivers",
        path: "/admin/finance/waivers/approve",
        icon: ClipboardCheck,
      },
      {
        label: "Student Ledger",
        path: "/admin/finance/ledger",
        icon: BookMarked,
      },
      {
        label: "Collection Report",
        path: "/admin/finance/reports/collection",
        icon: BarChart3,
      },
      {
        label: "Outstanding Report",
        path: "/admin/finance/reports/outstanding",
        icon: CircleDollarSign,
      },
      {
        label: "Session Settings",
        path: "/admin/finance/settings/session",
        icon: Settings,
      },
    ],
  },

  // =========================
  // PORTALS
  // =========================

  {
    label: "Teacher Portal",
    icon: GraduationCap,
    path: "/teacher",
    roles: ["teacher"],
  },

  {
    label: "Student Portal",
    icon: UserRound,
    path: "/student",
    roles: ["student"],
  },

  {
    label: "Parent Portal",
    icon: UserRound,
    path: "/parent",
    roles: ["parent"],
  },

  // =========================
  // ADMINISTRATION
  // =========================

  {
    label: "Admin Panel",
    icon: Shield,
    path: "/admin/administration",
    roles: ["admin", "teacher"],
  },
];

  const handleLogout = async () => {
    try {
      await logOutApiCall().unwrap();
      dispatch(userLoggedOut());
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const renderNavItem = (item, depth = 0) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path || (item.children && item.children.some(child => location.pathname === child.path));
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMenus[item.label] || false;

    if (hasChildren) {
      // Filter children by role
      const visibleChildren = item.children.filter(child =>
        !child.roles || child.roles.includes(roleName)
      );

      if (visibleChildren.length === 0) return null;

      return (
        <div key={item.label} className="space-y-0.5">
          <button
            className={cn(
              "flex gap-3 rounded-none w-full px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
              isSidebarCollapsed && "justify-center px-0",
              isActive && "bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100"
            )}
            onClick={() => {
              if (isSidebarCollapsed) {
                // If collapsed, navigate to first child
                const firstChild = visibleChildren[0];
                if (firstChild) navigate(firstChild.path);
              } else {
                toggleMenu(item.label);
              }
            }}
          >
            <Icon size={18} />
            {!isSidebarCollapsed && (
              <>
                <span className="flex-1">{item.label}</span>
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </>
            )}
          </button>

          {!isSidebarCollapsed && isExpanded && (
            <div className="ml-6 space-y-0.5 border-l border-gray-200 dark:border-gray-700 pl-2">
              {visibleChildren.map((child) => {
                const ChildIcon = child.icon;
                const isChildActive = location.pathname === child.path;
                return (
                  <button
                    key={child.path}
                    className={cn(
                      "flex gap-3 rounded-none w-full px-4 py-2 text-left text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
                      isChildActive && "bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100"
                    )}
                    onClick={() => navigate(child.path)}
                  >
                    <ChildIcon size={16} />
                    <span>{child.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    // Regular item (no children)
    return (
      <button
        key={item.path}
        className={cn(
          "flex gap-3 rounded-none w-full px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
          isSidebarCollapsed && "justify-center px-0",
          isActive && "bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100"
        )}
        onClick={() => navigate(item.path)}
      >
        <Icon size={18} />
        {!isSidebarCollapsed && <span>{item.label}</span>}
      </button>
    );
  };

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 h-full flex flex-col bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 z-50",
        isSidebarCollapsed ? "w-20" : "w-56"
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-2 py-2 border-b border-gray-200 dark:border-gray-800 cursor-pointer"
        onClick={() => navigate("/admin/dashboard")}>
        <img className="h-14" src={logoImage} alt="logo" />

        {!isSidebarCollapsed && (
          <div className="h-[50%]">
            <p className="font-bold text-gray-900 dark:text-gray-200 leading-3 text-lg tracking-wide">
              AppayanSoft
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-3">School Management</p>
          </div>
        )}
      </div>

      {/* Scrollable Navigation */}
      <nav className="flex-1 overflow-y-auto mt-4 px-2 space-y-0.5">
        {navItems
          .filter((item) => {
            // For items with children, check if any child is accessible
            if (item.children) {
              return item.children.some(child => !child.roles || child.roles.includes(roleName));
            }
            return !item.roles || item.roles.includes(roleName);
          })
          .map((item) => renderNavItem(item))}
      </nav>

      {/* Footer (Logout) */}
      <div className="border-t border-gray-200 dark:border-gray-800 flex-shrink-0 px-2 py-4">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "flex items-center gap-3 w-full px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800",
                isSidebarCollapsed && "justify-center px-0"
              )}
            >
              <LogOut size={18} />
              {!isSidebarCollapsed && <span>Logout</span>}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to log out?</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleLogout}>Logout</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </aside>
  );
}


// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
//   AlertDialogTrigger,
// } from "@/components/ui/alert-dialog";
// import { Button } from "@/components/ui/button";
// import { useLogOutMutation, useMeQuery } from "@/features/apis/authApi";
// import { userLoggedOut } from "@/features/slices/authSlice";
// import { useAppDispatch, useAppSelector } from "@/features/store";
// import { cn } from "@/lib/utils";
// import {
//   AlarmClock,
//   BookOpen,
//   Calendar,
//   ClipboardList,
//   Currency,
//   Home,
//   LogOut,
//   LucideSquareArrowOutUpRight,
//   Shield,
//   Users
// } from "lucide-react";
// import { useNavigate } from "react-router-dom";

// import logoImage from "../../assets/appayan-sm-2.png";

// export default function Sidebar() {
//   const navigate = useNavigate();
//   const dispatch = useAppDispatch();
//   const [logOutApiCall] = useLogOutMutation();
//   const { data: meData } = useMeQuery();
//   const user = meData?.user || {};

//   // console.log("stateUser :", stateUser)
//   // console.log("meData :", meData)

//   const isSidebarCollapsed = useAppSelector(
//     (state) => state.global.isSidebarCollapsed
//   );
//   const roleName = (user?.role?.name || user?.role || "student").toString();

//   const navItems = [
//     { label: "Dashboard", icon: Home, path: "/admin/dashboard", roles: ["admin"] },

//     // Admin/Teacher specific routes
//     { label: "Teachers", icon: Users, path: "/admin/teachers", roles: ["admin"] },
//     { label: "Students", icon: Users, path: "/admin/students", roles: ["admin", "teacher"] },
//     { label: "Classes", icon: ClipboardList, path: "/admin/classes", roles: ["admin", "teacher"] },
//     { label: "Subjects", icon: BookOpen, path: "/admin/subjects", roles: ["admin", "teacher"] },
//     { label: "Routine", icon: Calendar, path: "/admin/routines", roles: ["admin", "teacher"] },
//     { label: "Attendance", icon: ClipboardList, path: "/admin/attendances", roles: ["admin", "teacher"] },
//     // { label: "Exams", icon: ClipboardList, path: "/admin/exams", roles: ["admin", "teacher"] },
//     { label: "Exam Routine", icon: AlarmClock, path: "/admin/exam-routines", roles: ["admin", "teacher"] },
//     { label: "Assignments", icon: ClipboardList, path: "/admin/assignments", roles: ["admin", "teacher"] },
//     { label: "Results", icon: ClipboardList, path: "/admin/results", roles: ["admin", "teacher"] },
//     { label: "Result Sheets", icon: LucideSquareArrowOutUpRight, path: "/admin/result-sheets", roles: ["admin", "teacher"] },
//     // { label: "Parents", icon: Users, path: "/admin/parents", roles: ["admin", "teacher"] },

//     // Finance routes
//     { label: "Finance", icon: Currency, path: "/finance", roles: ["admin", "teacher"] },

//     // Portal specific routes (keep these as absolute paths)
//     { label: "Teacher Portal", icon: Users, path: "/teacher", roles: ["teacher"] },
//     { label: "Student Portal", icon: Users, path: "/student", roles: ["student"] },
//     { label: "Parent Portal", icon: Users, path: "/parent", roles: ["parent"] },

//     // Admin only routes
//     // { label: "Pages", icon: FileText, path: "/admin/pages", roles: ["admin"] },
//     // { label: "Announcements", icon: Megaphone, path: "/admin/announcements", roles: ["admin", "teacher"] },
//     { label: "Admin Panel", icon: Shield, path: "/admin/administration", roles: ["admin", "teacher"] },
//     // { label: "Directory", icon: GamepadDirectional, path: "/admin/directory", roles: ["admin", "teacher"] },
//     // { label: "Settings", icon: Settings, path: "/admin/settings", roles: ["admin"] },
//   ];

//   const handleLogout = async () => {
//     try {
//       await logOutApiCall().unwrap();
//       dispatch(userLoggedOut());
//       navigate("/login");
//     } catch (error) {
//       console.error("Logout failed:", error);
//     }
//   };

//   return (
//     <aside
//       className={cn(
//         "fixed top-0 left-0 h-full flex flex-col bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 transition-all duration-300",
//         isSidebarCollapsed ? "w-20" : "w-56"
//       )}
//     >
//       {/* Header */}
//       <div className="flex items-center gap-3 px-2 py-2 border-b border-gray-200 dark:border-gray-800 cursor-pointer"
//         onClick={() => navigate("/admin/dashboard")}>
//         <img className="h-14" src={logoImage} alt="logo" />

//         {!isSidebarCollapsed && (
//           <div className="h-[50%]">
//             <p className="font-bold text-gray-900 dark:text-gray-200 leading-3 text-lg tracking-wide">
//               AppayanSoft
//             </p>
//             <p className="text-xs text-gray-500 dark:text-gray-400 leading-3">School Management</p>
//           </div>
//         )}
//       </div>


//       {/* Scrollable Navigation */}
//       <nav className="flex-1 overflow-y-auto mt-4 px-2 space-y-1">
//         {navItems
//           .filter((item) => item.roles.includes(roleName))
//           .map((item) => {
//             const Icon = item.icon;
//             const isActive = location.pathname === item.path;
//             return (
//               <button
//                 key={item.path}
//                 className={cn(
//                   "flex gap-3 rounded-none w-full px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
//                   isSidebarCollapsed && "justify-center px-0",
//                   isActive && "bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100"
//                 )}
//                 onClick={() => navigate(item.path)}
//               >
//                 <item.icon size={18} />
//                 {!isSidebarCollapsed && <span>{item.label}</span>}
//               </button>
//             )
//           })}
//       </nav>

//       {/* Footer (Logout) */}
//       <div className="border-t border-gray-200 dark:border-gray-800 flex-shrink-0 px-2 py-4">
//         <AlertDialog>
//           <AlertDialogTrigger asChild>
//             <Button
//               variant="ghost"
//               className={cn(
//                 "flex items-center gap-3 w-full px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800",
//                 isSidebarCollapsed && "justify-center px-0"
//               )}
//             >
//               <LogOut size={18} />
//               {!isSidebarCollapsed && <span>Logout</span>}
//             </Button>
//           </AlertDialogTrigger>
//           <AlertDialogContent>
//             <AlertDialogHeader>
//               <AlertDialogTitle>Are you sure you want to log out?</AlertDialogTitle>
//             </AlertDialogHeader>
//             <AlertDialogFooter>
//               <AlertDialogCancel>Cancel</AlertDialogCancel>
//               <AlertDialogAction onClick={handleLogout}>Logout</AlertDialogAction>
//             </AlertDialogFooter>
//           </AlertDialogContent>
//         </AlertDialog>
//       </div>
//     </aside>
//   );
// }
