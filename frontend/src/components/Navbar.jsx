// components/Navbar.jsx
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Menu, Sun, Moon } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/features/store";
import { setIsSidebarCollapsed, setIsDarkMode } from "@/features/globalReducer";
import { useState, useEffect } from "react";

export default function Navbar() {
  const dispatch = useAppDispatch();
  const { isDarkMode, isSidebarCollapsed } = useAppSelector((state) => state.global);
  const user = useAppSelector((state) => state.user.user);

  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const controlNavbar = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down & past 100px - hide navbar
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up - show navbar
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', controlNavbar, { passive: true });
    return () => window.removeEventListener('scroll', controlNavbar);
  }, [lastScrollY]);

  return (
    <header
      className={`
        sticky top-0 z-40 
        bg-white/95 dark:bg-gray-800/95 
        backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50
        transition-transform duration-300 ease-in-out
        ${isVisible ? 'translate-y-0' : '-translate-y-full'} ml-0`}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => dispatch(setIsSidebarCollapsed(!isSidebarCollapsed))}
            className="transition-all duration-200 hover:scale-105 "
          >
            <Menu className="w-5 h-5" />
          </Button>
          <span className="text-lg font-semibold tracking-tight transition-opacity duration-300">
            Dashboard
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* <Button
            size="icon"
            variant="ghost"
            onClick={() => dispatch(setIsDarkMode(!isDarkMode))}
            className="transition-all duration-200 hover:scale-105"
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </Button> */}

          <div className="flex items-center gap-2 transition-opacity duration-300">
            <Avatar className="h-8 w-8 transition-all duration-200 hover:scale-105">
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                {user?.name?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <span className="hidden md:block text-sm font-medium">
              {user?.name || "User"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}