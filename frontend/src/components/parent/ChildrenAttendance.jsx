// components/parent/ChildrenAttendance.jsx
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useGetChildrenAttendanceQuery } from "@/features/apis/attendanceApi";
import { useGetParentChildrenQuery } from "@/features/apis/parentsApi";
import { format } from "date-fns";
import { BookOpen, Calendar, CheckCircle, Clock, Download, TrendingUp, XCircle } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const CURRENT_YEAR = new Date().getFullYear();

export default function ChildrenAttendance() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [selectedChild, setSelectedChild] = useState(searchParams.get("child") || "");
  const [selectedSubject, setSelectedSubject] = useState("all");

  const { data: childrenData } = useGetParentChildrenQuery();
  const { data: attendanceData, isLoading } = useGetChildrenAttendanceQuery({
    month: selectedMonth,
    year: selectedYear,
    childId: selectedChild || undefined,
    subjectId: selectedSubject !== "all" ? selectedSubject : undefined
  });

  const children = childrenData?.children || [];
  const attendance = attendanceData?.attendance || [];
  const statistics = attendanceData?.statistics || {};

  // Get unique subjects from attendance records
  const subjects = [...new Set(attendance.map(a => a.subject?._id).filter(Boolean))].map(subjectId => {
    const record = attendance.find(a => a.subject?._id === subjectId);
    return { _id: subjectId, name: record?.subject?.name };
  });

  const handleChildChange = (childId) => {
    setSelectedChild(childId);
    setSearchParams(childId !== 'all' ? { child: childId } : {});
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'absent': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'late': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'half_day': return <Clock className="w-4 h-4 text-orange-500" />;
      default: return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800';
      case 'absent': return 'bg-red-100 text-red-800';
      case 'late': return 'bg-yellow-100 text-yellow-800';
      case 'half_day': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Group attendance by child
  const attendanceByChild = children.reduce((acc, child) => {
    acc[child._id] = attendance.filter(a => a.student._id === child._id);
    return acc;
  }, {});

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading attendance...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Children's Attendance</h1>
          <p className="text-gray-600 mt-2">Monitor your children's attendance records by subject</p>
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export Report
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Child</label>
              <Select value={selectedChild} onValueChange={handleChildChange}>
                <SelectTrigger>
                  <SelectValue placeholder="All Children" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aa">All Children</SelectItem>
                  {children.map((child) => (
                    <SelectItem key={child._id} value={child._id}>
                      {child.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Subject</label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
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
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Month</label>
              <Select 
                value={selectedMonth.toString()} 
                onValueChange={(value) => setSelectedMonth(parseInt(value))}
              >
                <SelectTrigger>
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
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Year</label>
              <Select 
                value={selectedYear.toString()} 
                onValueChange={(value) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger>
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

            <div className="space-y-2">
              <label className="text-sm font-medium">Period</label>
              <div className="text-sm text-gray-600 pt-2">
                {MONTHS[selectedMonth - 1]} {selectedYear}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      {children.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {children.map((child) => {
            const childStats = statistics[child._id] || {};
            const childAttendance = attendanceByChild[child._id] || [];
            
            return (
              <Card key={child._id}>
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="font-medium text-sm mb-2">{child.name}</p>
                    <div className="text-2xl font-bold text-blue-600 mb-1">
                      {childStats.attendancePercentage || 0}%
                    </div>
                    <div className="text-xs text-gray-500">
                      {childStats.presentRecords || 0} of {childStats.totalRecords || 0} classes
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${childStats.attendancePercentage || 0}%` }}
                      ></div>
                    </div>
                    {selectedSubject !== "all" && (
                      <div className="text-xs text-gray-500 mt-1">
                        {subjects.find(s => s._id === selectedSubject)?.name}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Attendance Records */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Attendance Records {selectedChild && `- ${children.find(c => c._id === selectedChild)?.name}`}
            {selectedSubject !== "all" && ` - ${subjects.find(s => s._id === selectedSubject)?.name}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {attendance.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-lg">No attendance records found</p>
              <p className="text-sm">No attendance data for the selected period and filters</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Child</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Recorded By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendance.map((record) => (
                  <TableRow key={record._id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        {format(new Date(record.date), 'MMM dd, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{record.student.name}</div>
                      <div className="text-sm text-gray-500">
                        Roll: {record.student.rollNumber}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {record.class?.name}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-gray-500" />
                        {record.subject?.name || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">Period {record.period}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(record.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(record.status)}
                          {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600">
                        {record.recordedBy?.name || 'System'}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Attendance Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {children.map((child) => {
              const childStats = statistics[child._id] || {};
              const performance = childStats.attendancePercentage >= 90 ? 'Excellent' :
                                childStats.attendancePercentage >= 75 ? 'Good' :
                                childStats.attendancePercentage >= 60 ? 'Average' : 'Needs Improvement';
              
              return (
                <div key={child._id} className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">{child.name}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Present:</span>
                      <span className="font-medium">{childStats.presentRecords || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Absent:</span>
                      <span className="font-medium">{childStats.absentRecords || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Late:</span>
                      <span className="font-medium">{childStats.lateRecords || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Half Day:</span>
                      <span className="font-medium">{childStats.halfDayRecords || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Classes:</span>
                      <span className="font-medium">{childStats.totalRecords || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Performance:</span>
                      <Badge variant={
                        performance === 'Excellent' ? 'default' :
                        performance === 'Good' ? 'secondary' : 'outline'
                      }>
                        {performance}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}