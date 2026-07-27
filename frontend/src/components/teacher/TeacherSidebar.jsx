// components/teacher/TeacherSidebar.jsx
import { Button } from "@/components/ui/button";
import { useLogOutMutation, useMeQuery } from "@/features/apis/authApi";
import { useAppSelector } from "@/features/store";
import {
  AlarmCheck,
  BarChart3,
  BookOpen,
  Calendar,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  Users
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logoImage from "../../assets/appayan-sm-2.png";

const menuItems = [
  { path: "/teacher", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/teacher/classes", icon: Users, label: "My Classes" },
  { path: "/teacher/routines", icon: Calendar, label: "My Schedule" },
  { path: "/teacher/assignments", icon: BookOpen, label: "Assignments" },
  { path: "/teacher/exams", icon: ClipboardList, label: "Exams" },
  { path: "/teacher/exam-duties", icon: AlarmCheck, label: "Exam Duties" },
  { path: "/teacher/attendance", icon: Users, label: "Attendance" },
  { path: "/teacher/results", icon: BarChart3, label: "Results" },
  // { path: "/teacher/reports", icon: FileText, label: "Reports" },
];

export default function TeacherSidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const isSidebarCollapsed = useAppSelector((state) => state.global.isSidebarCollapsed);
  const [logOutApiCall] = useLogOutMutation();
  const stateUser = useAppSelector((state) => state.user);
  const { data: meData } = useMeQuery();
  const user = meData?.user || {};

  // console.log("stateUser :", stateUser)
  // console.log("meData :", meData)

  const handleLogout = async () => {
    try {
      await logOutApiCall().unwrap();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className={`
      bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
      transition-all duration-300
      ${isSidebarCollapsed ? 'w-20' : 'w-64'}
      flex flex-col
    `}>
      {/* Header */}
      <div className="flex items-center gap-3 px-2 py-2 border-b border-gray-200 dark:border-gray-800 cursor-pointer"
        onClick={() => navigate("/teacher")}>
        <img className="h-14" src={logoImage} alt="logo" />

        {!isSidebarCollapsed && (
          <div className="h-[50%]">
            <p className="font-bold text-gray-900 dark:text-gray-200 leading-3 text-lg tracking-wide">
              Teacher Portal
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-3">{user.name || ""}</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Button
              key={item.path}
              variant={isActive ? "default" : "ghost"}
              className={`w-full justify-start ${isSidebarCollapsed ? 'px-3' : 'px-4'}`}
              asChild
            >
              <Link to={item.path}>
                <Icon className="w-4 h-4 mr-3" />
                {!isSidebarCollapsed && item.label}
              </Link>
            </Button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          variant="ghost"
          className={`w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 ${isSidebarCollapsed ? 'px-3' : 'px-4'}`}
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-3" />
          {!isSidebarCollapsed && "Logout"}
        </Button>
      </div>
    </div>
  );
}