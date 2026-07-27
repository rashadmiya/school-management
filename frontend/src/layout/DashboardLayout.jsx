import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAppSelector } from "@/features/store";
import Sidebar from "@/components/sidebar/Sidebar";
import Navbar from "@/components/Navbar";

const DashboardLayout = ({ children }) => {
  const { pathname } = useLocation();
  const hideLayout = ["/login", "/signup"].includes(pathname);

  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
  const isSidebarCollapsed = useAppSelector((state) => state.global.isSidebarCollapsed);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  if (hideLayout) return <div className="min-h-screen bg-gray-50">{children}</div>;

  return (
    <div className={`flex h-screen overflow-hidden ${isDarkMode ? "dark bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}`}>
      <Sidebar />
      <div
        className={`flex flex-col flex-1 transition-all duration-300 ${
          isSidebarCollapsed ? "md:pl-20" : "md:pl-56"
        }`}
      >
        <Navbar />
        {/* className="flex-1 overflow-y-auto px-4 md:px-6 py-4 mt-[64px]" */}
        <main className="flex-1 overflow-y-auto px-4 md:px-6 py-4">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

