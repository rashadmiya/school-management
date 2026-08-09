// components/attendance/AttendanceSummary.jsx
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetAttendanceAnalyticsQuery, useGetClassAttendanceSummaryQuery } from "@/features/apis/attendanceApi";
import { useGetClassQuery } from "@/features/apis/classesApi";
import { useAppSelector } from "@/features/store";
import { BookOpen, Calendar, Download, Filter, TrendingUp, Users } from "lucide-react";
import { useState } from "react";

export default function AttendanceSummary({ classId, isDarkMode = false }) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [viewMode, setViewMode] = useState("student"); // "student" or "subject"

  const { data: classData } = useGetClassQuery(classId);
  const { data: summaryData, isLoading } = useGetClassAttendanceSummaryQuery({
    classId,
    month: selectedMonth,
    year: selectedYear,
    subjectId: selectedSubject === "all" ? undefined : selectedSubject
  });

  const { data: analyticsData } = useGetAttendanceAnalyticsQuery({
    classId,
    month: selectedMonth,
    year: selectedYear
  });

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  const subjects = classData?.class?.subjects || [];

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
    bgEven: isDarkMode ? "bg-gray-800/50" : "bg-gray-50",
    bgOdd: isDarkMode ? "bg-gray-900/30" : "bg-white",
    badge: {
      present: isDarkMode ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-green-100 text-green-800",
      absent: isDarkMode ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-red-100 text-red-800",
      late: isDarkMode ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" : "bg-yellow-100 text-yellow-800",
      half_day: isDarkMode ? "bg-orange-500/20 text-orange-400 border-orange-500/30" : "bg-orange-100 text-orange-800",
      excellent: isDarkMode ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-green-100 text-green-800",
      good: isDarkMode ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" : "bg-yellow-100 text-yellow-800",
      needsImprovement: isDarkMode ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-red-100 text-red-800",
    },
    stat: {
      blue: isDarkMode 
        ? "bg-blue-500/10 border-blue-500/20 text-blue-400" 
        : "bg-blue-50 text-blue-600",
      green: isDarkMode 
        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
        : "bg-green-50 text-green-600",
      orange: isDarkMode 
        ? "bg-orange-500/10 border-orange-500/20 text-orange-400" 
        : "bg-orange-50 text-orange-600",
      purple: isDarkMode 
        ? "bg-purple-500/10 border-purple-500/20 text-purple-400" 
        : "bg-purple-50 text-purple-600",
      red: isDarkMode 
        ? "bg-red-500/10 border-red-500/20 text-red-400" 
        : "bg-red-50 text-red-600",
    },
    select: isDarkMode 
      ? "bg-gray-800 border-gray-700 text-white" 
      : "bg-white border-gray-200 text-gray-900",
    button: {
      outline: isDarkMode 
        ? "border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white" 
        : "border-gray-200 text-gray-700 hover:bg-gray-50",
    }
  };

  // Calculate subject-wise statistics from analytics
  const getSubjectStats = () => {
    if (!analyticsData?.analytics?.subjectAnalysis) return [];
    
    return Object.entries(analyticsData.analytics.subjectAnalysis).map(([subjectName, stats]) => {
      const total = stats.present + stats.absent + stats.late + stats.half_day;
      const weightedPresent = stats.present + (stats.late * 0.5) + (stats.half_day * 0.5);
      const percentage = total > 0 ? (weightedPresent / total) * 100 : 0;
      
      return {
        subject: subjectName,
        ...stats,
        total,
        attendancePercentage: Math.round(percentage * 100) / 100
      };
    });
  };

  if (isLoading) {
    return (
      <div className={`text-center py-8 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
        Loading attendance summary...
      </div>
    );
  }

  const { summary, statistics, period } = summaryData || {};

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-sm`}>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <CardTitle className={`flex items-center gap-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              <TrendingUp className="w-5 h-5" />
              Attendance Summary - {classData?.class?.name} {classData?.class?.section ? `- ${classData?.class?.section.name}` : ''}
            </CardTitle>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Month Selector */}
              <div className="flex flex-col gap-2">
                <label className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Month</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className={`border rounded-md px-3 py-2 ${theme.select}`}
                >
                  {months.map((month, index) => (
                    <option key={month} value={index + 1} className={isDarkMode ? "bg-gray-800 text-white" : ""}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year Selector */}
              <div className="flex flex-col gap-2">
                <label className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className={`border rounded-md px-3 py-2 ${theme.select}`}
                >
                  {years.map(year => (
                    <option key={year} value={year} className={isDarkMode ? "bg-gray-800 text-white" : ""}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject Filter */}
              <div className="flex flex-col gap-2">
                <label className={`text-sm font-medium flex items-center gap-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                  <BookOpen className="w-4 h-4" />
                  Subject
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className={`border rounded-md px-3 py-2 ${theme.select}`}
                >
                  <option value="all" className={isDarkMode ? "bg-gray-800 text-white" : ""}>All Subjects</option>
                  {subjects.map(subject => (
                    <option key={subject._id} value={subject._id} className={isDarkMode ? "bg-gray-800 text-white" : ""}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* View Mode */}
              <div className="flex flex-col gap-2">
                <label className={`text-sm font-medium flex items-center gap-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                  <Filter className="w-4 h-4" />
                  View By
                </label>
                <select
                  value={viewMode}
                  onChange={(e) => setViewMode(e.target.value)}
                  className={`border rounded-md px-3 py-2 ${theme.select}`}
                >
                  <option value="student" className={isDarkMode ? "bg-gray-800 text-white" : ""}>Student View</option>
                  <option value="subject" className={isDarkMode ? "bg-gray-800 text-white" : ""}>Subject View</option>
                </select>
              </div>

              {/* Export Button */}
              <div className="flex flex-col gap-2">
                <label className={`text-sm font-medium invisible ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Actions</label>
                <Button variant="outline" className={`flex items-center gap-2 ${theme.button.outline}`}>
                  <Download className="w-4 h-4" />
                  Export
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        {/* Class Statistics */}
        {statistics && (
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className={`text-center p-4 rounded-lg border ${theme.stat.blue}`}>
                <Users className={`w-8 h-8 mx-auto mb-2 ${isDarkMode ? "text-blue-400" : "text-blue-600"}`} />
                <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {statistics.totalStudents || summary?.length || 0}
                </p>
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Total Students</p>
              </div>
              
              <div className={`text-center p-4 rounded-lg border ${theme.stat.green}`}>
                <TrendingUp className={`w-8 h-8 mx-auto mb-2 ${isDarkMode ? "text-emerald-400" : "text-green-600"}`} />
                <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {statistics.averagePercentage?.toFixed(1) || 0}%
                </p>
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Average Attendance</p>
              </div>
              
              <div className={`text-center p-4 rounded-lg border ${theme.stat.orange}`}>
                <Calendar className={`w-8 h-8 mx-auto mb-2 ${isDarkMode ? "text-orange-400" : "text-orange-600"}`} />
                <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {statistics.totalRecords || 0}
                </p>
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Total Records</p>
              </div>

              <div className={`text-center p-4 rounded-lg border ${theme.stat.purple}`}>
                <BookOpen className={`w-8 h-8 mx-auto mb-2 ${isDarkMode ? "text-purple-400" : "text-purple-600"}`} />
                <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {statistics.totalSubjects || subjects.length}
                </p>
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Subjects</p>
              </div>
              
              <div className={`text-center p-4 rounded-lg border ${theme.stat.red}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 ${isDarkMode ? "bg-red-500/20" : "bg-red-600"}`}>
                  <span className={`text-sm font-bold ${isDarkMode ? "text-red-400" : "text-white"}`}>!</span>
                </div>
                <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {summary?.filter(s => s.attendancePercentage < 75).length || 0}
                </p>
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Below 75%</p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Students Summary View */}
      {viewMode === "student" && (
        <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-sm overflow-hidden`}>
          <CardHeader>
            <CardTitle className={`text-lg ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              Student Attendance {selectedSubject !== "all" && `- ${subjects.find(s => s._id === selectedSubject)?.name}`}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`border-b ${isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"}`}>
                    <th className={`text-left p-4 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Student</th>
                    <th className={`text-center p-4 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Present</th>
                    <th className={`text-center p-4 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Absent</th>
                    <th className={`text-center p-4 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Late</th>
                    <th className={`text-center p-4 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Half Day</th>
                    <th className={`text-center p-4 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Total</th>
                    <th className={`text-center p-4 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Percentage</th>
                    <th className={`text-center p-4 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {summary?.map((studentSummary, index) => (
                    <tr key={studentSummary.student._id} className={`border-b ${isDarkMode ? "border-gray-800" : "border-gray-200"} ${index % 2 === 0 ? theme.bgEven : theme.bgOdd}`}>
                      <td className="p-4">
                        <div>
                          <p className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                            {studentSummary.student.name}
                          </p>
                          <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                            Roll: {studentSummary.student.rollNumber}
                            {studentSummary.subject && (
                              <> • Subject: <strong className={isDarkMode ? "text-white" : "text-gray-900"}>{studentSummary.subject.name}</strong></>
                            )}
                          </p>
                        </div>
                      </td>
                      <td className="text-center p-4">
                        <Badge variant="outline" className={theme.badge.present}>
                          {studentSummary.present}
                        </Badge>
                      </td>
                      <td className="text-center p-4">
                        <Badge variant="outline" className={theme.badge.absent}>
                          {studentSummary.absent}
                        </Badge>
                      </td>
                      <td className="text-center p-4">
                        <Badge variant="outline" className={theme.badge.late}>
                          {studentSummary.late}
                        </Badge>
                      </td>
                      <td className="text-center p-4">
                        <Badge variant="outline" className={theme.badge.half_day}>
                          {studentSummary.half_day}
                        </Badge>
                      </td>
                      <td className={`text-center p-4 font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                        {studentSummary.totalRecords}
                      </td>
                      <td className="text-center p-4">
                        <div className="flex items-center justify-center gap-2">
                          <div className={`w-16 ${isDarkMode ? "bg-gray-700" : "bg-gray-200"} rounded-full h-2`}>
                            <div 
                              className={`h-2 rounded-full ${
                                studentSummary.attendancePercentage >= 90 ? 'bg-emerald-500' :
                                studentSummary.attendancePercentage >= 75 ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(studentSummary.attendancePercentage, 100)}%` }}
                            ></div>
                          </div>
                          <span className={`font-medium ${
                            studentSummary.attendancePercentage >= 90 ? 'text-emerald-400' :
                            studentSummary.attendancePercentage >= 75 ? 'text-yellow-400' :
                            'text-red-400'
                          }`}>
                            {studentSummary.attendancePercentage}%
                          </span>
                        </div>
                      </td>
                      <td className="text-center p-4">
                        <Badge 
                          variant={
                            studentSummary.attendancePercentage >= 90 ? "default" :
                            studentSummary.attendancePercentage >= 75 ? "secondary" :
                            "destructive"
                          }
                          className={
                            studentSummary.attendancePercentage >= 90 ? theme.badge.excellent :
                            studentSummary.attendancePercentage >= 75 ? theme.badge.good :
                            theme.badge.needsImprovement
                          }
                        >
                          {studentSummary.attendancePercentage >= 90 ? 'Excellent' :
                           studentSummary.attendancePercentage >= 75 ? 'Good' :
                           'Needs Improvement'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subject Summary View */}
      {viewMode === "subject" && (
        <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-sm overflow-hidden`}>
          <CardHeader>
            <CardTitle className={`text-lg ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              Subject-wise Attendance Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`border-b ${isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"}`}>
                    <th className={`text-left p-4 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Subject</th>
                    <th className={`text-center p-4 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Present</th>
                    <th className={`text-center p-4 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Absent</th>
                    <th className={`text-center p-4 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Late</th>
                    <th className={`text-center p-4 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Half Day</th>
                    <th className={`text-center p-4 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Total Records</th>
                    <th className={`text-center p-4 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Attendance %</th>
                    <th className={`text-center p-4 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {getSubjectStats().map((subjectStat, index) => (
                    <tr key={index} className={`border-b ${isDarkMode ? "border-gray-800" : "border-gray-200"} ${index % 2 === 0 ? theme.bgEven : theme.bgOdd}`}>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDarkMode ? "bg-blue-500/20" : "bg-blue-100"}`}>
                            <BookOpen className={`w-4 h-4 ${isDarkMode ? "text-blue-400" : "text-blue-600"}`} />
                          </div>
                          <p className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                            {subjectStat.subject}
                          </p>
                        </div>
                      </td>
                      <td className="text-center p-4">
                        <Badge variant="outline" className={theme.badge.present}>
                          {subjectStat.present}
                        </Badge>
                      </td>
                      <td className="text-center p-4">
                        <Badge variant="outline" className={theme.badge.absent}>
                          {subjectStat.absent}
                        </Badge>
                      </td>
                      <td className="text-center p-4">
                        <Badge variant="outline" className={theme.badge.late}>
                          {subjectStat.late}
                        </Badge>
                      </td>
                      <td className="text-center p-4">
                        <Badge variant="outline" className={theme.badge.half_day}>
                          {subjectStat.half_day}
                        </Badge>
                      </td>
                      <td className={`text-center p-4 font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                        {subjectStat.total}
                      </td>
                      <td className="text-center p-4">
                        <div className="flex items-center justify-center gap-2">
                          <div className={`w-16 ${isDarkMode ? "bg-gray-700" : "bg-gray-200"} rounded-full h-2`}>
                            <div 
                              className={`h-2 rounded-full ${
                                subjectStat.attendancePercentage >= 90 ? 'bg-emerald-500' :
                                subjectStat.attendancePercentage >= 75 ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(subjectStat.attendancePercentage, 100)}%` }}
                            ></div>
                          </div>
                          <span className={`font-medium ${
                            subjectStat.attendancePercentage >= 90 ? 'text-emerald-400' :
                            subjectStat.attendancePercentage >= 75 ? 'text-yellow-400' :
                            'text-red-400'
                          }`}>
                            {subjectStat.attendancePercentage}%
                          </span>
                        </div>
                      </td>
                      <td className="text-center p-4">
                        <Badge 
                          variant={
                            subjectStat.attendancePercentage >= 90 ? "default" :
                            subjectStat.attendancePercentage >= 75 ? "secondary" :
                            "destructive"
                          }
                          className={
                            subjectStat.attendancePercentage >= 90 ? theme.badge.excellent :
                            subjectStat.attendancePercentage >= 75 ? theme.badge.good :
                            theme.badge.needsImprovement
                          }
                        >
                          {subjectStat.attendancePercentage >= 90 ? 'Excellent' :
                           subjectStat.attendancePercentage >= 75 ? 'Good' :
                           'Needs Improvement'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {(!summary || summary.length === 0) && (
        <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-sm`}>
          <CardContent className="p-8 text-center">
            <Calendar className={`w-12 h-12 ${isDarkMode ? "text-gray-600" : "text-gray-300"} mx-auto mb-4`} />
            <p className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
              No attendance records found for the selected period
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}