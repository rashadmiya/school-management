// components/student/StudentLayout.jsx
import { Button } from "@/components/ui/button";
import { useLogOutMutation } from "@/features/apis/authApi";
import {
  AlarmCheck,
  BookOpen,
  Calendar,
  Clock,
  CreditCard,
  DollarSign,
  FileText,
  FileTextIcon,
  History,
  LayoutDashboard,
  LogOut,
  LucideBadgeEuro,
  PenToolIcon,
  Receipt,
  User,
  Users
} from "lucide-react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import logoImage from "../../assets/appayan-sm-2.png";
import { useAppSelector } from "@/features/store";

const studentMenu = [
  { path: "/student", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/student/schedule", icon: Calendar, label: "Schedule" },
  { path: "/student/assignments", icon: BookOpen, label: "Assignments" },
  { path: "/student/exams", icon: PenToolIcon, label: "Exams" },
  { path: "/student/exams-schedule", icon: AlarmCheck, label: "Exam Routine" },
  { path: "/student/attendance", icon: Users, label: "Attendance" },
  { path: "/student/results", icon: FileText, label: "Results" },
  // { path: "/student/payments", icon: DollarSign, label: "Payments" },
  { path: "/student/ledger", icon: LucideBadgeEuro, label: "Student Ledger" },
  { path: "/student/profile", icon: User, label: "Profile" },
  // {
  //     name: 'Dashboard',
  //     href: '/student/finance-dashboard',
  //     icon: LayoutDashboard,
  //     current: location.pathname === '/student/finance-dashboard',
  //   },
  // {
  //   name: 'My Fees',
  //   href: '/student/fees',
  //   icon: CreditCard,
  //   current: location.pathname.includes('/fees'),
  // },
  // {
  //   name: 'Payment History',
  //   href: '/student/payments',
  //   icon: History,
  //   current: location.pathname.includes('/payments'),
  // },
  // {
  //   name: 'Transaction Ledger',
  //   href: '/student/ledger',
  //   icon: FileTextIcon,
  //   current: location.pathname.includes('/ledger'),
  // },
  // {
  //   name: 'Receipts',
  //   href: '/student/receipts',
  //   icon: Receipt,
  //   current: location.pathname.includes('/receipts'),
  // },
];


export default function StudentLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [logOutApiCall] = useLogOutMutation();

  const isSidebarCollapsed = useAppSelector(
    (state) => state.global.isSidebarCollapsed
  );

  const handleLogout = async () => {
    try {
      await logOutApiCall().unwrap();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 flex flex-col bg-white shadow-lg h-screen overflow-y-auto">

        {/* Header */}
        <div className="flex items-center gap-3 px-2 py-2 border-b border-gray-200 dark:border-gray-800 cursor-pointer"
          onClick={() => navigate("/student")}>
          <img className="h-14" src={logoImage} alt="logo" />

          {!isSidebarCollapsed && (
            <div className="h-[50%]">
              <p className="font-bold text-gray-900 dark:text-gray-200 leading-3 text-lg tracking-wide">
                Student Portal
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-3">School Management</p>
            </div>
          )}
        </div>

        <nav className="p-4 space-y-2 flex-1">
          {studentMenu.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className="w-full justify-start gap-3"
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center">
          <Button
            variant="outline"
            className="w-full mx-2 justify-center gap-3 text-red-600 hover:text-red-700"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            Logout
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