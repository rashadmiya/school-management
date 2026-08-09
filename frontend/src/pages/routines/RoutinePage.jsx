// pages/RoutinesPage.jsx
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RoutineList from "@/components/routine/RoutineList";
import TodaysRoutine from "@/components/routine/TodaysRoutine";
import { useGetClassesQuery } from "@/features/apis/classesApi";
import { useGetSubjectsQuery } from "@/features/apis/subjectsApi";
import { useGetTeachersQuery } from "@/features/apis/teachersApi";
import WeeklyTimetable from "@/components/routine/WeeklyTimetable";
import Loader from "@/components/common/Loader";
import { useAppSelector } from "@/features/store";

export default function RoutinesPage() {
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
  const [selectedClass, setSelectedClass] = useState(null);

  const { data: classesData, isLoading: isClassLoading } = useGetClassesQuery();
  const { data: subjectsData, isLoading: isSubjectsLoading } = useGetSubjectsQuery();
  const { data: teachersData, isLoading: isTeachersLoading } = useGetTeachersQuery();

  const classes = classesData?.classes || classesData?.docs || [];
  const subjects = subjectsData?.subjects || subjectsData?.docs || [];
  const teachers = teachersData?.teachers || teachersData?.docs || [];

  useEffect(() => {
    if (classes.length > 0 && !selectedClass) {
      setSelectedClass(classes[0]);
    }
  }, [classes, selectedClass]);

  if (isClassLoading || isSubjectsLoading || isTeachersLoading) {
    return <Loader />;
  }

  console.log("classes :", classes);

  // Theme-based classes
  const theme = {
    textPrimary: isDarkMode ? "text-white" : "text-gray-900",
    textSecondary: isDarkMode ? "text-gray-300" : "text-gray-700",
    textMuted: isDarkMode ? "text-gray-400" : "text-gray-500",
    textLight: isDarkMode ? "text-gray-500" : "text-gray-400",
    border: isDarkMode ? "border-gray-700" : "border-gray-200",
    bgCard: isDarkMode ? "bg-gray-900/50" : "bg-white",
    bgHover: isDarkMode ? "hover:bg-gray-800/50" : "hover:bg-gray-50",
    bgInput: isDarkMode ? "bg-gray-800" : "bg-white",
    inputBorder: isDarkMode ? "border-gray-700" : "border-gray-200",
    tabs: {
      list: isDarkMode ? "bg-gray-800" : "bg-gray-100",
      trigger: isDarkMode 
        ? "text-gray-400 data-[state=active]:bg-gray-700 data-[state=active]:text-white" 
        : "text-gray-600 data-[state=active]:bg-white data-[state=active]:text-gray-900",
    },
    select: isDarkMode 
      ? "bg-gray-800 border-gray-700 text-white" 
      : "bg-white border-gray-200 text-gray-900",
    option: isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900",
  };

  return (
    <div className={`container space-y-6 ${isDarkMode ? "text-white" : ""}`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className={`text-3xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            Class Routine Management
          </h1>
          <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
            Manage and view class schedules, timetables, and daily routines
          </p>
        </div>
      </div>

      {/* Class Selector */}
      {classes.length > 0 && (
        <div className="flex flex-wrap items-center gap-4 p-4 rounded-lg bg-opacity-50 backdrop-blur-sm">
          <label className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            Select Class:
          </label>
          <select
            className={`border rounded-md px-3 py-2 ${theme.select}`}
            value={selectedClass?._id || ""}
            onChange={(e) => setSelectedClass(classes.find(c => c._id === e.target.value))}
          >
            {classes.map(classItem => (
              <option 
                key={classItem._id} 
                value={classItem._id}
                className={theme.option}
              >
                {classItem.name || ""} ({classItem?.section?.name || ""})
              </option>
            ))}
          </select>
        </div>
      )}

      <Tabs defaultValue="timetable" className="space-y-6">
        <TabsList className={theme.tabs.list}>
          <TabsTrigger 
            value="timetable" 
            className={theme.tabs.trigger}
          >
            Weekly Timetable
          </TabsTrigger>
          <TabsTrigger 
            value="manage" 
            className={theme.tabs.trigger}
          >
            Manage Routines
          </TabsTrigger>
          <TabsTrigger 
            value="today" 
            className={theme.tabs.trigger}
          >
            Today's Schedule
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timetable">
          <WeeklyTimetable
            classId={selectedClass?._id}
            className={selectedClass?.name}
            classes={classes}
            subjects={subjects}
            teachers={teachers}
            isDarkMode={isDarkMode}
          />
        </TabsContent>

        <TabsContent value="manage">
          <RoutineList
            classes={classes}
            subjects={subjects}
            teachers={teachers}
            isDarkMode={isDarkMode}
          />
        </TabsContent>

        <TabsContent value="today">
          {selectedClass ? (
            <TodaysRoutine 
              classId={selectedClass._id} 
              isDarkMode={isDarkMode}
            />
          ) : (
            <div className={`text-center py-8 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              Please select a class to view today's schedule
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}