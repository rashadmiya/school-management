// components/attendance/AttendanceDashboard.jsx - FIXED VERSION with Dark Mode
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useGetAttendanceOverviewQuery, useGetTodaysScheduleQuery } from "@/features/apis/attendanceApi";
import { useGetClassesQuery } from "@/features/apis/classesApi";
import { format, isToday } from "date-fns";
import { AlertCircle, ArrowRight, Calendar, CalendarDays, CheckCircle, Clock, TrendingUp, Users } from "lucide-react";
import { useState } from "react";

export default function AttendanceDashboard({ onTabChange, onClassSelect, selectedClassId, isDarkMode = false }) {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  const { data: classesData } = useGetClassesQuery();
  const { data: scheduleData, isLoading: scheduleLoading } = useGetTodaysScheduleQuery({ date: selectedDate });
  const { data: overviewData, isLoading: overviewLoading } = useGetAttendanceOverviewQuery({ date: selectedDate });

  const classes = classesData?.classes || classesData?.docs || [];
  const todaysSchedule = scheduleData?.todaysSchedule || [];
  const overview = overviewData?.overview || {};
  
  const dayOfWeek = format(new Date(selectedDate), 'EEEE');
  const isCurrentDay = isToday(new Date(selectedDate));

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
    badge: {
      default: isDarkMode ? "bg-blue-500/20 text-blue-400 border-blue-500/30" : "",
      outline: isDarkMode ? "border-gray-700 text-gray-300" : "",
      marked: isDarkMode ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "",
      pending: isDarkMode ? "border-gray-700 text-gray-300" : "",
    },
    stat: {
      blue: isDarkMode 
        ? "bg-blue-500/10 border-blue-500/20 text-blue-400" 
        : "bg-blue-50 text-blue-600",
      green: isDarkMode 
        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
        : "bg-green-50 text-green-600",
      purple: isDarkMode 
        ? "bg-purple-500/10 border-purple-500/20 text-purple-400" 
        : "bg-purple-50 text-purple-600",
      orange: isDarkMode 
        ? "bg-orange-500/10 border-orange-500/20 text-orange-400" 
        : "bg-orange-50 text-orange-600",
      red: isDarkMode 
        ? "bg-red-500/10 border-red-500/20 text-red-400" 
        : "bg-red-50 text-red-600",
      yellow: isDarkMode 
        ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400" 
        : "bg-yellow-50 text-yellow-600",
    },
    schedule: {
      marked: isDarkMode 
        ? "bg-emerald-500/10 border-emerald-500/20" 
        : "bg-green-50 border-green-200",
      pending: isDarkMode 
        ? "bg-gray-800/50 border-gray-700" 
        : "bg-gray-50 border-gray-200",
    },
    cardIcon: {
      blue: isDarkMode ? "bg-blue-500/20 text-blue-400" : "bg-blue-100 text-blue-600",
      green: isDarkMode ? "bg-emerald-500/20 text-emerald-400" : "bg-green-100 text-green-600",
      purple: isDarkMode ? "bg-purple-500/20 text-purple-400" : "bg-purple-100 text-purple-600",
      orange: isDarkMode ? "bg-orange-500/20 text-orange-400" : "bg-orange-100 text-orange-600",
      gray: isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600",
    },
    button: {
      default: isDarkMode 
        ? "bg-blue-600 hover:bg-blue-700 text-white" 
        : "bg-blue-600 hover:bg-blue-700 text-white",
      outline: isDarkMode 
        ? "border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white" 
        : "border-gray-200 text-gray-700 hover:bg-gray-50",
      ghost: isDarkMode 
        ? "text-gray-400 hover:text-white hover:bg-gray-800" 
        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
    },
    select: isDarkMode 
      ? "bg-gray-800 border-gray-700 text-white" 
      : "bg-white border-gray-200 text-gray-900",
  };

  // Calculate statistics
  const totalClasses = todaysSchedule.length;
  const totalMarked = todaysSchedule.filter(cls => cls.attendanceMarked).length;
  const totalStudents = classes.reduce((sum, cls) => sum + (cls.students?.length || 0), 0);
  
  const upcomingClass = todaysSchedule.find(cls => !cls.attendanceMarked && new Date(`${selectedDate}T${cls.endTime}`) > new Date());

  const handleMarkAttendance = (classId, periodNumber) => {
    const selectedClass = classes.find(c => c._id === classId);
    if (selectedClass) {
      onClassSelect(selectedClass, periodNumber);
      onTabChange("mark");
    }
  };

  const handleViewSummary = (classId) => {
    const selectedClass = classes.find(c => c._id === classId);
    if (selectedClass) {
      onClassSelect(selectedClass);
      onTabChange("summary");
    }
  };

  const getClassName = (classId) => {
    const cls = classes.find(c => c._id === classId);
    return cls ? `${cls.name} ${cls.section?.name ? `- ${cls.section.name}` : ''}` : 'Unknown Class';
  };

  if (scheduleLoading || overviewLoading) {
    return (
      <div className={`flex justify-center items-center h-64 ${isDarkMode ? "text-gray-400" : ""}`}>
        <div className="text-center">
          <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${isDarkMode ? "border-blue-400" : "border-primary"} mx-auto mb-4`}></div>
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${isDarkMode ? "text-white" : ""}`}>
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            Attendance Dashboard
          </h2>
          <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
            Overview of today's attendance activities
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className={`border rounded-md px-3 py-2 ${theme.select}`}
            max={format(new Date(), 'yyyy-MM-dd')}
          />
          <Badge variant={isCurrentDay ? "default" : "outline"} className={isDarkMode && !isCurrentDay ? "border-gray-700 text-gray-300" : ""}>
            {dayOfWeek}
            {isCurrentDay && " (Today)"}
          </Badge>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-sm`}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg border ${theme.cardIcon.blue}`}>
                <CalendarDays className="w-6 h-6" />
              </div>
              <div>
                <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {totalClasses}
                </p>
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Classes Today
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-sm`}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg border ${theme.cardIcon.green}`}>
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {totalMarked}
                </p>
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Attendance Marked
                </p>
                <div className={`w-full ${isDarkMode ? "bg-gray-700" : "bg-gray-200"} rounded-full h-2 mt-2`}>
                  <div 
                    className="bg-emerald-500 h-2 rounded-full"
                    style={{ width: `${totalClasses > 0 ? (totalMarked / totalClasses) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-sm`}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg border ${theme.cardIcon.purple}`}>
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {totalStudents}
                </p>
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Total Students
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-sm`}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg border ${theme.cardIcon.orange}`}>
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {overview.averageAttendance || 0}%
                </p>
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Average Attendance
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Schedule */}
      <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-sm`}>
        <CardContent className="p-6">
          <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
            <h3 className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              Today's Class Schedule ({dayOfWeek})
            </h3>
            {upcomingClass && (
              <Badge variant="outline" className={`flex items-center gap-2 ${isDarkMode ? "border-gray-700 text-gray-300" : ""}`}>
                <Clock className="w-3 h-3" />
                Next: {upcomingClass.subject.name} at {upcomingClass.startTime}
              </Badge>
            )}
          </div>

          {todaysSchedule.length > 0 ? (
            <div className="space-y-3">
              {todaysSchedule.map((classItem) => (
                <div
                  key={`${classItem.classId}-${classItem.periodNumber}`}
                  className={`flex flex-col lg:flex-row lg:items-center justify-between p-4 border rounded-lg gap-4 ${
                    classItem.attendanceMarked ? theme.schedule.marked : theme.schedule.pending
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      classItem.attendanceMarked 
                        ? isDarkMode ? "bg-emerald-500/20" : "bg-green-100"
                        : isDarkMode ? "bg-gray-700" : "bg-gray-100"
                    }`}>
                      {classItem.attendanceMarked ? (
                        <CheckCircle className={`w-6 h-6 ${isDarkMode ? "text-emerald-400" : "text-green-600"}`} />
                      ) : (
                        <Clock className={`w-6 h-6 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`} />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                        {getClassName(classItem.classId)}
                      </h4>
                      <div className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"} mt-1`}>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="flex items-center gap-1">
                            <Badge variant="outline" className={`text-xs px-2 ${isDarkMode ? "border-gray-700 text-gray-300" : ""}`}>
                              Period {classItem.periodNumber}
                            </Badge>
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {classItem.startTime} - {classItem.endTime}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {classItem.totalStudents} students
                          </span>
                        </div>
                        <div className={`mt-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                          <span className="font-medium">{classItem.subject.name}</span>
                          {classItem.roomNumber && (
                            <span className="ml-2">• Room: {classItem.roomNumber}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge 
                      variant={classItem.attendanceMarked ? "default" : "outline"}
                      className={`text-center whitespace-nowrap ${
                        classItem.attendanceMarked 
                          ? theme.badge.marked 
                          : theme.badge.pending
                      }`}
                    >
                      {classItem.attendanceMarked ? 'Marked' : 'Pending'}
                    </Badge>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={classItem.attendanceMarked ? "outline" : "default"}
                        onClick={() => handleMarkAttendance(classItem.classId, classItem.periodNumber)}
                        className={`flex items-center gap-1 whitespace-nowrap ${
                          classItem.attendanceMarked ? theme.button.outline : theme.button.default
                        }`}
                      >
                        {classItem.attendanceMarked ? 'Edit' : 'Mark'}
                        <ArrowRight className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleViewSummary(classItem.classId)}
                        className={theme.button.ghost}
                      >
                        View
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className={`w-12 h-12 ${isDarkMode ? "text-gray-600" : "text-gray-300"} mx-auto mb-4`} />
              <p className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
                No classes scheduled for {dayOfWeek}
              </p>
              <p className={`text-sm ${isDarkMode ? "text-gray-500" : "text-gray-400"} mt-2`}>
                Try selecting a different date or check if routines are set up
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-sm`}>
        <CardContent className="p-6">
          <h3 className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-gray-900"} mb-4`}>
            Quick Actions
          </h3>
          <div className="flex flex-wrap gap-3 items-center">
            <Button
              variant="outline"
              onClick={() => onTabChange("mark")}
              className={`flex items-center gap-2 ${theme.button.outline}`}
              disabled={classes.length === 0}
            >
              <Calendar className="w-4 h-4" />
              Mark Attendance
            </Button>
            <Button
              variant="outline"
              onClick={() => onTabChange("summary")}
              className={`flex items-center gap-2 ${theme.button.outline}`}
              disabled={classes.length === 0}
            >
              <TrendingUp className="w-4 h-4" />
              View Summary
            </Button>
            <Button
              variant="outline"
              onClick={() => setSelectedDate(format(new Date(), 'yyyy-MM-dd'))}
              className={`flex items-center gap-2 ${theme.button.outline}`}
            >
              <Clock className="w-4 h-4" />
              Jump to Today
            </Button>
            {classes.length === 0 && (
              <div className={`flex items-center gap-2 ${isDarkMode ? "text-yellow-400" : "text-amber-600"} text-sm mt-2`}>
                <AlertCircle className="w-4 h-4" />
                <span>No classes available. Please add classes first.</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Summary */}
      {todaysSchedule.length > 0 && (
        <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-sm`}>
          <CardContent className="p-6">
            <h3 className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-gray-900"} mb-4`}>
              Daily Summary
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className={`text-center p-4 rounded-lg border ${theme.stat.blue}`}>
                <div className={`text-2xl font-bold ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}>
                  {overview.present || 0}
                </div>
                <div className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Present Today
                </div>
              </div>
              <div className={`text-center p-4 rounded-lg border ${theme.stat.red}`}>
                <div className={`text-2xl font-bold ${isDarkMode ? "text-red-400" : "text-red-600"}`}>
                  {overview.absent || 0}
                </div>
                <div className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Absent Today
                </div>
              </div>
              <div className={`text-center p-4 rounded-lg border ${theme.stat.yellow}`}>
                <div className={`text-2xl font-bold ${isDarkMode ? "text-yellow-400" : "text-yellow-600"}`}>
                  {overview.late || 0}
                </div>
                <div className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Late Today
                </div>
              </div>
              <div className={`text-center p-4 rounded-lg border ${theme.stat.green}`}>
                <div className={`text-2xl font-bold ${isDarkMode ? "text-emerald-400" : "text-green-600"}`}>
                  {overview.markedClasses || 0}
                </div>
                <div className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Classes Marked
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}