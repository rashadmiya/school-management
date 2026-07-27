// components/teacher/TeacherLayout.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import TeacherSidebar from "./TeacherSidebar";
import { useAppSelector } from "@/features/store";

export default function TeacherLayout() {
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);

  return (
    <div className={`flex h-screen overflow-hidden ${isDarkMode ? "dark bg-gray-900" : "bg-gray-50"}`}>
      <TeacherSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 p-3 overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}