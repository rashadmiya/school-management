// components/student/StudentAttendance.jsx
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGetMyAttendanceQuery } from "@/features/apis/attendanceApi";
import { eachDayOfInterval, endOfMonth, format, isSameDay, startOfMonth } from "date-fns";
import { BookOpen, Calendar, CheckCircle, Clock, Download, TrendingUp, XCircle } from "lucide-react";
import { useState } from "react";

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const CURRENT_YEAR = new Date().getFullYear();

export default function StudentAttendance() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [selectedSubject, setSelectedSubject] = useState("all");

  const { data, isLoading } = useGetMyAttendanceQuery({
    month: selectedMonth,
    year: selectedYear,
    subjectId: selectedSubject !== "all" ? selectedSubject : undefined
  });

  const attendance = data?.attendance || [];
  const stats = data?.statistics || {};

  // Get unique subjects from attendance records
  const subjects = [...new Set(attendance.map(a => a.subject?._id).filter(Boolean))].map(subjectId => {
    const record = attendance.find(a => a.subject?._id === subjectId);
    return { _id: subjectId, name: record?.subject?.name };
  });

  // Generate calendar days for the selected month
  const monthStart = startOfMonth(new Date(selectedYear, selectedMonth - 1));
  const monthEnd = endOfMonth(new Date(selectedYear, selectedMonth - 1));
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getAttendanceForDate = (date) => {
    return attendance.filter(a => isSameDay(new Date(a.date), date));
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'absent':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'late':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'half_day':
        return <Clock className="w-4 h-4 text-orange-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      case 'late':
        return 'bg-yellow-100 text-yellow-800';
      case 'half_day':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading attendance records...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">My Attendance</h1>
        <p className="text-gray-600 mt-2">Track your attendance records and statistics by subject</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.presentRecords || 0}</p>
                <p className="text-sm text-gray-600">Present</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.absentRecords || 0}</p>
                <p className="text-sm text-gray-600">Absent</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.lateRecords || 0}</p>
                <p className="text-sm text-gray-600">Late</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.halfDayRecords || 0}</p>
                <p className="text-sm text-gray-600">Half Day</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.attendancePercentage || 0}%</p>
                <p className="text-sm text-gray-600">Overall</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex gap-4">
              <Select
                value={selectedSubject}
                onValueChange={setSelectedSubject}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjects.map((subject) => (
                    <SelectItem key={subject._id} value={subject._id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedMonth.toString()}
                onValueChange={(value) => setSelectedMonth(parseInt(value))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((month, index) => (
                    <SelectItem key={month} value={(index + 1).toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[CURRENT_YEAR, CURRENT_YEAR - 1].map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export Report
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Calendar */}
        <Card>
          <CardHeader>
            <CardTitle>
              Attendance Calendar - {MONTHS[selectedMonth - 1]} {selectedYear}
              {selectedSubject !== "all" && ` - ${subjects.find(s => s._id === selectedSubject)?.name}`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1">
              {/* Day headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-sm font-medium text-gray-500 p-2">
                  {day}
                </div>
              ))}

              {/* Calendar days */}
              {calendarDays.map(day => {
                const dayAttendance = getAttendanceForDate(day);
                const isToday = isSameDay(day, new Date());
                const hasMultiple = dayAttendance.length > 1;

                return (
                  <div
                    key={day.toISOString()}
                    className={`
                      relative p-2 text-center border rounded text-sm min-h-16
                      ${isToday ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
                    `}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span className={isToday ? 'font-bold text-blue-600' : ''}>
                        {format(day, 'd')}
                      </span>
                      {dayAttendance.length > 0 && (
                        <div className="flex flex-wrap gap-1 justify-center">
                          {dayAttendance.slice(0, 2).map((record, idx) => (
                            <div key={idx} className="text-xs">
                              {getStatusIcon(record.status)}
                            </div>
                          ))}
                          {hasMultiple && (
                            <Badge variant="outline" className="text-xs">+{dayAttendance.length - 2}</Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm">Present</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm">Absent</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-500" />
                <span className="text-sm">Late</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-500" />
                <span className="text-sm">Half Day</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-500 rounded"></div>
                <span className="text-sm">Today</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Details */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance Details</CardTitle>
          </CardHeader>
          <CardContent>
            {attendance.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p>No attendance records found for this period</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {attendance.map((record) => (
                  <div key={record._id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(record.status)}
                      <div>
                        <p className="font-medium">
                          {format(new Date(record.date), 'MMMM dd, yyyy')}
                        </p>
                        <div className="text-sm text-gray-500 flex items-center gap-2">
                          <BookOpen className="w-3 h-3" />
                          {record.subject?.name} • Period {record.period}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(record.status)}>
                        {record.status?.charAt(0).toUpperCase() + record.status?.slice(1)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Overall Attendance Rate</span>
              <span className="text-lg font-bold">{stats.attendancePercentage || 0}%</span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-green-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${stats.attendancePercentage || 0}%` }}
              ></div>
            </div>

            <div className="grid grid-cols-4 gap-4 text-center text-sm">
              <div>
                <div className="font-semibold text-green-600">{stats.presentRecords || 0}</div>
                <div className="text-gray-500">Present</div>
              </div>
              <div>
                <div className="font-semibold text-red-600">{stats.absentRecords || 0}</div>
                <div className="text-gray-500">Absent</div>
              </div>
              <div>
                <div className="font-semibold text-yellow-600">{stats.lateRecords || 0}</div>
                <div className="text-gray-500">Late</div>
              </div>
              <div>
                <div className="font-semibold text-orange-600">{stats.halfDayRecords || 0}</div>
                <div className="text-gray-500">Half Day</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}