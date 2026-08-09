// pages/AttendancePage.jsx - UPDATED with Dark Mode
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AttendanceMarker from "@/components/attendance/AttendanceMark";
import AttendanceSummary from "@/components/attendance/AttendanceSummary";
import AttendanceDashboard from "@/components/attendance/AttendanceDashboard";
import { useGetClassesQuery } from "@/features/apis/classesApi";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Users, TrendingUp, Home, BarChart3, BookMarked, Settings } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/features/store";

export default function AttendancePage() {
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "dashboard";

  const { data: classesData } = useGetClassesQuery();
  const classes = classesData?.classes || classesData?.docs || [];

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
    card: {
      empty: isDarkMode ? "text-gray-400" : "text-gray-500",
      icon: isDarkMode ? "text-gray-700" : "text-gray-300",
    },
    button: {
      outline: isDarkMode
        ? "border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
        : "border-gray-200 text-gray-700 hover:bg-gray-50",
    }
  };

  useEffect(() => {
    if (classes.length > 0 && !selectedClass) {
      setSelectedClass(classes[0]);
    }
  }, [classes, selectedClass]);

  const handleTabChange = (tab) => {
    setSearchParams({ tab });
  };

  const handleClassSelect = (classItem, periodNumber) => {
    setSelectedClass(classItem);
    setSelectedPeriod(periodNumber);
  };

  return (
    <div className={`container mx-auto p-6 space-y-6 ${isDarkMode ? "text-white" : ""}`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className={`text-3xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            Attendance Management
          </h1>
          <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
            Mark and monitor student attendance with detailed analytics
          </p>
        </div>
      </div>

      {/* Class Selector - Only show when needed */}
      {(activeTab === "mark" || activeTab === "summary" || activeTab === "reports") && (
        <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-sm`}>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <label className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                Select Class:
              </label>
              <select
                className={`border rounded-md px-3 py-2 flex-1 ${theme.select}`}
                value={selectedClass?._id || ""}
                onChange={(e) => setSelectedClass(classes.find(c => c._id === e.target.value))}
              >
                {classes.map(classItem => (
                  <option
                    key={classItem._id}
                    value={classItem._id}
                    className={theme.option}
                  >
                    {classItem.name} {classItem.section ? `- ${classItem.section.name}` : ''} ({classItem.students?.length || 0} students)
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className={`grid grid-cols-3 md:grid-cols-6 ${theme.tabs.list}`}>
          <TabsTrigger
            value="dashboard"
            className={`flex items-center gap-2 ${theme.tabs.trigger}`}
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger
            value="mark"
            className={`flex items-center gap-2 ${theme.tabs.trigger}`}
          >
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Mark</span>
          </TabsTrigger>
          <TabsTrigger
            value="summary"
            className={`flex items-center gap-2 ${theme.tabs.trigger}`}
          >
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">Summary</span>
          </TabsTrigger>

          {/* <TabsTrigger 
            value="reports" 
            className={`flex items-center gap-2 ${theme.tabs.trigger}`}
          >
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Reports</span>
          </TabsTrigger>

          <TabsTrigger 
            value="bulk" 
            className={`flex items-center gap-2 ${theme.tabs.trigger}`}
          >
            <BookMarked className="w-4 h-4" />
            <span className="hidden sm:inline">Bulk</span>
          </TabsTrigger>

          <TabsTrigger 
            value="settings" 
            className={`flex items-center gap-2 ${theme.tabs.trigger}`}
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Settings</span>
          </TabsTrigger> */}

        </TabsList>

        <TabsContent value="dashboard">
          <AttendanceDashboard
            onTabChange={handleTabChange}
            onClassSelect={handleClassSelect}
            selectedClassId={selectedClass?._id}
            isDarkMode={isDarkMode}
          />
        </TabsContent>

        <TabsContent value="mark">
          {selectedClass ? (
            <AttendanceMarker
              classId={selectedClass._id}
              periodNumber={selectedPeriod}
              isDarkMode={isDarkMode}
            />
          ) : (
            <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-sm`}>
              <CardContent className="p-6 text-center">
                <Users className={`w-12 h-12 ${theme.card.icon} mx-auto mb-4`} />
                <p className={`${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Please select a class to mark attendance
                </p>
                <Button
                  onClick={() => handleTabChange("dashboard")}
                  className={`mt-4 ${theme.button.outline}`}
                  variant="outline"
                >
                  Go to Dashboard
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="summary">
          {selectedClass ? (
            <AttendanceSummary
              classId={selectedClass._id}
              isDarkMode={isDarkMode}
            />
          ) : (
            <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-sm`}>
              <CardContent className="p-6 text-center">
                <Users className={`w-12 h-12 ${theme.card.icon} mx-auto mb-4`} />
                <p className={`${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Please select a class to view attendance summary
                </p>
                <Button
                  onClick={() => handleTabChange("dashboard")}
                  className={`mt-4 ${theme.button.outline}`}
                  variant="outline"
                >
                  Go to Dashboard
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="reports">
          <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-sm`}>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <BarChart3 className={`w-16 h-16 ${theme.card.icon} mx-auto mb-4`} />
                <h3 className={`text-lg font-medium ${isDarkMode ? "text-white" : "text-gray-900"} mb-2`}>
                  Attendance Reports
                </h3>
                <p className={`${isDarkMode ? "text-gray-400" : "text-gray-500"} mb-4`}>
                  Generate detailed attendance reports and analytics
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button variant="outline" className={theme.button.outline}>
                    Monthly Reports
                  </Button>
                  <Button variant="outline" className={theme.button.outline}>
                    Student-wise Reports
                  </Button>
                  <Button variant="outline" className={theme.button.outline}>
                    Export to Excel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk">
          <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-sm`}>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <BookMarked className={`w-16 h-16 ${theme.card.icon} mx-auto mb-4`} />
                <h3 className={`text-lg font-medium ${isDarkMode ? "text-white" : "text-gray-900"} mb-2`}>
                  Bulk Attendance Operations
                </h3>
                <p className={`${isDarkMode ? "text-gray-400" : "text-gray-500"} mb-4`}>
                  Mark attendance for multiple classes or periods at once
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button variant="outline" className={theme.button.outline}>
                    Bulk Mark by Date
                  </Button>
                  <Button variant="outline" className={theme.button.outline}>
                    Import from CSV
                  </Button>
                  <Button variant="outline" className={theme.button.outline}>
                    Copy Previous Day
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-sm`}>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <Settings className={`w-16 h-16 ${theme.card.icon} mx-auto mb-4`} />
                <h3 className={`text-lg font-medium ${isDarkMode ? "text-white" : "text-gray-900"} mb-2`}>
                  Attendance Settings
                </h3>
                <p className={`${isDarkMode ? "text-gray-400" : "text-gray-500"} mb-4`}>
                  Configure attendance rules, notifications, and preferences
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button variant="outline" className={theme.button.outline}>
                    Period Settings
                  </Button>
                  <Button variant="outline" className={theme.button.outline}>
                    Notification Settings
                  </Button>
                  <Button variant="outline" className={theme.button.outline}>
                    Holiday Settings
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}