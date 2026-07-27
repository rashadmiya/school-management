// components/parent/ParentLayout.jsx
import React from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  Calendar,
  BookOpen,
  User,
  LogOut,
  Home,
  DollarSign
} from "lucide-react";

import { useLogOutMutation, useMeQuery } from "@/features/apis/authApi";
import { useAppSelector } from "@/features/store";
import logoImage from "../../assets/appayan-sm-2.png";

const parentMenu = [
  { path: "/parent", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/parent/children", icon: Users, label: "My Children" },
  { path: "/parent/attendance", icon: Calendar, label: "Attendance" },
  { path: "/parent/results", icon: BookOpen, label: "Results" },
  { path: "/parent/payments", icon: DollarSign, label: "Payments" }, // Add this
  { path: "/parent/profile", icon: User, label: "Profile" },
];

export default function ParentLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const isSidebarCollapsed = useAppSelector((state) => state.global.isSidebarCollapsed);
  // const user = useAppSelector((state) => state.user);
  const { data: meData } = useMeQuery();
  const user = meData?.user || {};

  const [logOutApiCall] = useLogOutMutation();

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

      <div className={`
      bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
      transition-all duration-300
      ${isSidebarCollapsed ? 'w-20' : 'w-64'}
      flex flex-col
    `}>
        {/* Header */}
        <div className="flex items-center gap-3 px-2 py-2 border-b border-gray-200 dark:border-gray-800 cursor-pointer"
          onClick={() => navigate("/parent")}>
          <img className="h-14" src={logoImage} alt="logo" />

          {!isSidebarCollapsed && (
            <div className="h-[50%]">
              <p className="font-bold text-gray-900 dark:text-gray-200 leading-3 text-lg tracking-wide">
                Parent Portal
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-3">{user.name || ""}</p>
            </div>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {parentMenu.map((item) => {
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

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            className="w-full justify-start gap-3"
            asChild
          >
            <Link to="/">
              <Home className="w-4 h-4" />
              Back to Home
            </Link>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start gap-3 text-red-600 hover:text-red-700"
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