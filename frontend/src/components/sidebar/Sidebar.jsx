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
  BookOpen,
  Calendar,
  ClipboardList,
  Currency,
  Home,
  LogOut,
  LucideSquareArrowOutUpRight,
  Shield,
  Users
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import logoImage from "../../assets/appayan-sm-2.png";

export default function Sidebar() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [logOutApiCall] = useLogOutMutation();
  const { data: meData } = useMeQuery();
  const user = meData?.user || {};

  // console.log("stateUser :", stateUser)
  // console.log("meData :", meData)

  const isSidebarCollapsed = useAppSelector(
    (state) => state.global.isSidebarCollapsed
  );
  const roleName = (user?.role?.name || user?.role || "student").toString();

  const navItems = [
    { label: "Dashboard", icon: Home, path: "/admin/dashboard", roles: ["admin"] },

    // Admin/Teacher specific routes
    { label: "Teachers", icon: Users, path: "/admin/teachers", roles: ["admin"] },
    { label: "Students", icon: Users, path: "/admin/students", roles: ["admin", "teacher"] },
    { label: "Classes", icon: ClipboardList, path: "/admin/classes", roles: ["admin", "teacher"] },
    { label: "Subjects", icon: BookOpen, path: "/admin/subjects", roles: ["admin", "teacher"] },
    { label: "Routine", icon: Calendar, path: "/admin/routines", roles: ["admin", "teacher"] },
    { label: "Attendance", icon: ClipboardList, path: "/admin/attendances", roles: ["admin", "teacher"] },
    // { label: "Exams", icon: ClipboardList, path: "/admin/exams", roles: ["admin", "teacher"] },
    { label: "Exam Routine", icon: AlarmClock, path: "/admin/exam-routines", roles: ["admin", "teacher"] },
    { label: "Assignments", icon: ClipboardList, path: "/admin/assignments", roles: ["admin", "teacher"] },
    { label: "Results", icon: ClipboardList, path: "/admin/results", roles: ["admin", "teacher"] },
    { label: "Result Sheets", icon: LucideSquareArrowOutUpRight, path: "/admin/result-sheets", roles: ["admin", "teacher"] },
    // { label: "Parents", icon: Users, path: "/admin/parents", roles: ["admin", "teacher"] },

    // Finance routes
    { label: "Finance", icon: Currency, path: "/finance", roles: ["admin", "teacher"] },

    // Portal specific routes (keep these as absolute paths)
    { label: "Teacher Portal", icon: Users, path: "/teacher", roles: ["teacher"] },
    { label: "Student Portal", icon: Users, path: "/student", roles: ["student"] },
    { label: "Parent Portal", icon: Users, path: "/parent", roles: ["parent"] },

    // Admin only routes
    // { label: "Pages", icon: FileText, path: "/admin/pages", roles: ["admin"] },
    // { label: "Announcements", icon: Megaphone, path: "/admin/announcements", roles: ["admin", "teacher"] },
    { label: "Administration", icon: Shield, path: "/admin/administration", roles: ["admin", "teacher"] },
    // { label: "Directory", icon: GamepadDirectional, path: "/admin/directory", roles: ["admin", "teacher"] },
    // { label: "Settings", icon: Settings, path: "/admin/settings", roles: ["admin"] },
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

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 h-full flex flex-col bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 transition-all duration-300",
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
      <nav className="flex-1 overflow-y-auto mt-4 px-2 space-y-1">
        {navItems
          .filter((item) => item.roles.includes(roleName))
          .map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
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
                <item.icon size={18} />
                {!isSidebarCollapsed && <span>{item.label}</span>}
              </button>
            )
          })}
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