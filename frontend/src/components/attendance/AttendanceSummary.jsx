// components/attendance/AttendanceSummary.jsx
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Download, Users, TrendingUp, BookOpen, Filter } from "lucide-react";
import { useGetClassQuery } from "@/features/apis/classesApi";
import { useGetClassAttendanceSummaryQuery, useGetAttendanceAnalyticsQuery } from "@/features/apis/attendanceApi";

export default function AttendanceSummary({ classId }) {
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
    return <div>Loading attendance summary...</div>;
  }

  const { summary, statistics, period } = summaryData || {};

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              {/* Attendance Summary - {classData?.class?.name || ""} */}
                Attendance Summary - {classData?.class?.name} {`- ${classData?.class?.section.name}` || ''}

            </CardTitle>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Month Selector */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Month</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="border rounded-md px-3 py-2"
                >
                  {months.map((month, index) => (
                    <option key={month} value={index + 1}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year Selector */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="border rounded-md px-3 py-2"
                >
                  {years.map(year => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject Filter */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Subject
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="border rounded-md px-3 py-2"
                >
                  <option value="all">All Subjects</option>
                  {subjects.map(subject => (
                    <option key={subject._id} value={subject._id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* View Mode */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  View By
                </label>
                <select
                  value={viewMode}
                  onChange={(e) => setViewMode(e.target.value)}
                  className="border rounded-md px-3 py-2"
                >
                  <option value="student">Student View</option>
                  <option value="subject">Subject View</option>
                </select>
              </div>

              {/* Export Button */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium invisible">Actions</label>
                <Button variant="outline" className="flex items-center gap-2">
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
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">{statistics.totalStudents || summary?.length || 0}</p>
                <p className="text-sm text-gray-600">Total Students</p>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">{statistics.averagePercentage?.toFixed(1) || 0}%</p>
                <p className="text-sm text-gray-600">Average Attendance</p>
              </div>
              
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <Calendar className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">{statistics.totalRecords || 0}</p>
                <p className="text-sm text-gray-600">Total Records</p>
              </div>

              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <BookOpen className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">{statistics.totalSubjects || subjects.length}</p>
                <p className="text-sm text-gray-600">Subjects</p>
              </div>
              
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-white text-sm font-bold">!</span>
                </div>
                <p className="text-2xl font-bold">
                  {summary?.filter(s => s.attendancePercentage < 75).length || 0}
                </p>
                <p className="text-sm text-gray-600">Below 75%</p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Students Summary View */}
      {viewMode === "student" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Student Attendance {selectedSubject !== "all" && `- ${subjects.find(s => s._id === selectedSubject)?.name}`}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-4 font-medium">Student</th>
                    <th className="text-center p-4 font-medium">Present</th>
                    <th className="text-center p-4 font-medium">Absent</th>
                    <th className="text-center p-4 font-medium">Late</th>
                    <th className="text-center p-4 font-medium">Half Day</th>
                    <th className="text-center p-4 font-medium">Total</th>
                    <th className="text-center p-4 font-medium">Percentage</th>
                    <th className="text-center p-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {summary?.map((studentSummary) => (
                    <tr key={studentSummary.student._id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{studentSummary.student.name}</p>
                          <p className="text-sm text-gray-500">
                            Roll: {studentSummary.student.rollNumber}
                            {studentSummary.subject && (
                              <> • Subject: <strong>{studentSummary.subject.name}</strong></>
                            )}
                          </p>
                        </div>
                      </td>
                      <td className="text-center p-4">
                        <Badge variant="outline" className="bg-green-100 text-green-800">
                          {studentSummary.present}
                        </Badge>
                      </td>
                      <td className="text-center p-4">
                        <Badge variant="outline" className="bg-red-100 text-red-800">
                          {studentSummary.absent}
                        </Badge>
                      </td>
                      <td className="text-center p-4">
                        <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                          {studentSummary.late}
                        </Badge>
                      </td>
                      <td className="text-center p-4">
                        <Badge variant="outline" className="bg-orange-100 text-orange-800">
                          {studentSummary.half_day}
                        </Badge>
                      </td>
                      <td className="text-center p-4 font-medium">
                        {studentSummary.totalRecords}
                      </td>
                      <td className="text-center p-4">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                studentSummary.attendancePercentage >= 90 ? 'bg-green-500' :
                                studentSummary.attendancePercentage >= 75 ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(studentSummary.attendancePercentage, 100)}%` }}
                            ></div>
                          </div>
                          <span className={`font-medium ${
                            studentSummary.attendancePercentage >= 90 ? 'text-green-600' :
                            studentSummary.attendancePercentage >= 75 ? 'text-yellow-600' :
                            'text-red-600'
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
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Subject-wise Attendance Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-4 font-medium">Subject</th>
                    <th className="text-center p-4 font-medium">Present</th>
                    <th className="text-center p-4 font-medium">Absent</th>
                    <th className="text-center p-4 font-medium">Late</th>
                    <th className="text-center p-4 font-medium">Half Day</th>
                    <th className="text-center p-4 font-medium">Total Records</th>
                    <th className="text-center p-4 font-medium">Attendance %</th>
                    <th className="text-center p-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {getSubjectStats().map((subjectStat, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <BookOpen className="w-4 h-4 text-blue-600" />
                          </div>
                          <p className="font-medium">{subjectStat.subject}</p>
                        </div>
                      </td>
                      <td className="text-center p-4">
                        <Badge variant="outline" className="bg-green-100 text-green-800">
                          {subjectStat.present}
                        </Badge>
                      </td>
                      <td className="text-center p-4">
                        <Badge variant="outline" className="bg-red-100 text-red-800">
                          {subjectStat.absent}
                        </Badge>
                      </td>
                      <td className="text-center p-4">
                        <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                          {subjectStat.late}
                        </Badge>
                      </td>
                      <td className="text-center p-4">
                        <Badge variant="outline" className="bg-orange-100 text-orange-800">
                          {subjectStat.half_day}
                        </Badge>
                      </td>
                      <td className="text-center p-4 font-medium">
                        {subjectStat.total}
                      </td>
                      <td className="text-center p-4">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                subjectStat.attendancePercentage >= 90 ? 'bg-green-500' :
                                subjectStat.attendancePercentage >= 75 ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(subjectStat.attendancePercentage, 100)}%` }}
                            ></div>
                          </div>
                          <span className={`font-medium ${
                            subjectStat.attendancePercentage >= 90 ? 'text-green-600' :
                            subjectStat.attendancePercentage >= 75 ? 'text-yellow-600' :
                            'text-red-600'
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
        <Card>
          <CardContent className="p-8 text-center">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No attendance records found for the selected period</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}