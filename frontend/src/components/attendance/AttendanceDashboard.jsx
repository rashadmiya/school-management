// components/attendance/AttendanceDashboard.jsx - FIXED VERSION
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, CheckCircle, XCircle, Users, TrendingUp, ArrowRight, CalendarDays, AlertCircle } from "lucide-react";
import { useGetClassesQuery } from "@/features/apis/classesApi";
import { useGetTodaysScheduleQuery, useGetAttendanceOverviewQuery } from "@/features/apis/attendanceApi";
import { format, isToday, parseISO } from "date-fns";

export default function AttendanceDashboard({ onTabChange, onClassSelect, selectedClassId }) {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  const { data: classesData } = useGetClassesQuery();
  const { data: scheduleData, isLoading: scheduleLoading } = useGetTodaysScheduleQuery({ date: selectedDate });
  const { data: overviewData, isLoading: overviewLoading } = useGetAttendanceOverviewQuery({ date: selectedDate });

  const classes = classesData?.classes || classesData?.docs || [];
  const todaysSchedule = scheduleData?.todaysSchedule || [];
  const overview = overviewData?.overview || {};
  
  const dayOfWeek = format(new Date(selectedDate), 'EEEE');
  const isCurrentDay = isToday(new Date(selectedDate));

  // Calculate statistics
  const totalClasses = todaysSchedule.length;
  const totalMarked = todaysSchedule.filter(cls => cls.attendanceMarked).length;
  const totalStudents = classes.reduce((sum, cls) => sum + (cls.students?.length || 0), 0);
  
  const upcomingClass = todaysSchedule.find(cls => !cls.attendanceMarked && new Date(`${selectedDate}T${cls.endTime}`) > new Date());

  const handleMarkAttendance = (classId, periodNumber) => {
    // Find the class object
    const selectedClass = classes.find(c => c._id === classId);
    if (selectedClass) {
      // Select the class
      onClassSelect(selectedClass, periodNumber);
      // Switch to mark attendance tab
      onTabChange("mark");
      
      // You could also pass additional data like period number
      // This would require additional state management in the parent
    }
  };

  const handleViewSummary = (classId) => {
    const selectedClass = classes.find(c => c._id === classId);
    if (selectedClass) {
      onClassSelect(selectedClass);
      onTabChange("summary");
    }
  };

  // Get class name by ID
  const getClassName = (classId) => {
    const cls = classes.find(c => c._id === classId);
    return cls ? `${cls.name} ${cls.section?.name ? `- ${cls.section.name}` : ''}` : 'Unknown Class';
  };

  if (scheduleLoading || overviewLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Attendance Dashboard</h2>
          <p className="text-gray-600">Overview of today's attendance activities</p>
        </div>
        
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border rounded-md px-3 py-2"
            max={format(new Date(), 'yyyy-MM-dd')}
          />
          <Badge variant={isCurrentDay ? "default" : "outline"}>
            {dayOfWeek}
            {isCurrentDay && " (Today)"}
          </Badge>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <CalendarDays className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalClasses}</p>
                <p className="text-sm text-gray-600">Classes Today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalMarked}</p>
                <p className="text-sm text-gray-600">Attendance Marked</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${totalClasses > 0 ? (totalMarked / totalClasses) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalStudents}</p>
                <p className="text-sm text-gray-600">Total Students</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{overview.averageAttendance || 0}%</p>
                <p className="text-sm text-gray-600">Average Attendance</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Schedule */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Today's Class Schedule ({dayOfWeek})</h3>
            {upcomingClass && (
              <Badge variant="outline" className="flex items-center gap-2">
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
                  className={`flex items-center justify-between p-4 border rounded-lg ${
                    classItem.attendanceMarked ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      classItem.attendanceMarked ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      {classItem.attendanceMarked ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : (
                        <Clock className="w-6 h-6 text-gray-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{getClassName(classItem.classId)}</h4>
                      <div className="text-sm text-gray-600 mt-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="flex items-center gap-1">
                            <Badge variant="outline" className="text-xs px-2">
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
                        <div className="mt-1 text-gray-700">
                          <span className="font-medium">{classItem.subject.name}</span>
                          {classItem.roomNumber && (
                            <span className="ml-2">• Room: {classItem.roomNumber}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Badge 
                      variant={classItem.attendanceMarked ? "default" : "outline"}
                      className="text-center"
                    >
                      {classItem.attendanceMarked ? 'Marked' : 'Pending'}
                    </Badge>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={classItem.attendanceMarked ? "outline" : "default"}
                        onClick={() => handleMarkAttendance(classItem.classId, classItem.periodNumber)}
                        className="flex items-center gap-1 whitespace-nowrap"
                      >
                        {classItem.attendanceMarked ? 'Edit' : 'Mark'}
                        <ArrowRight className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleViewSummary(classItem.classId)}
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
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No classes scheduled for {dayOfWeek}</p>
              <p className="text-sm text-gray-400 mt-2">
                Try selecting a different date or check if routines are set up
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
          <div className="flex gap-3 flex-wrap">
            <Button
              variant="outline"
              onClick={() => onTabChange("mark")}
              className="flex items-center gap-2"
              disabled={classes.length === 0}
            >
              <Calendar className="w-4 h-4" />
              Mark Attendance
            </Button>
            <Button
              variant="outline"
              onClick={() => onTabChange("summary")}
              className="flex items-center gap-2"
              disabled={classes.length === 0}
            >
              <TrendingUp className="w-4 h-4" />
              View Summary
            </Button>
            <Button
              variant="outline"
              onClick={() => setSelectedDate(format(new Date(), 'yyyy-MM-dd'))}
              className="flex items-center gap-2"
            >
              <Clock className="w-4 h-4" />
              Jump to Today
            </Button>
            {classes.length === 0 && (
              <div className="flex items-center gap-2 text-amber-600 text-sm mt-2">
                <AlertCircle className="w-4 h-4" />
                <span>No classes available. Please add classes first.</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Summary */}
      {todaysSchedule.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-bold mb-4">Daily Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{overview.present || 0}</div>
                <div className="text-sm text-gray-600">Present Today</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{overview.absent || 0}</div>
                <div className="text-sm text-gray-600">Absent Today</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{overview.late || 0}</div>
                <div className="text-sm text-gray-600">Late Today</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{overview.markedClasses || 0}</div>
                <div className="text-sm text-gray-600">Classes Marked</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// // components/attendance/AttendanceDashboard.jsx - NEW COMPONENT
// import React, { useState, useEffect } from "react";
// import { Card, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { Calendar, Clock, CheckCircle, XCircle, Users, TrendingUp, ArrowRight, CalendarDays } from "lucide-react";
// import { useGetClassesQuery } from "@/features/apis/classesApi";
// import { useGetTodaysScheduleQuery, useGetAttendanceOverviewQuery } from "@/features/apis/attendanceApi";
// import { format, isToday } from "date-fns";
// import { useNavigate } from "react-router-dom";

// export default function AttendanceDashboard() {
//   const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
//   const navigate = useNavigate();

//   const { data: classesData } = useGetClassesQuery();
//   const { data: scheduleData } = useGetTodaysScheduleQuery({ date: selectedDate });
//   const { data: overviewData } = useGetAttendanceOverviewQuery({ date: selectedDate });

//   const classes = classesData?.classes || classesData?.docs || [];
//   const todaysSchedule = scheduleData?.todaysSchedule || [];
//   const overview = overviewData?.overview || {};
  
//   const dayOfWeek = format(new Date(selectedDate), 'EEEE');
//   const isCurrentDay = isToday(new Date(selectedDate));

//   // Calculate statistics
//   const totalClasses = todaysSchedule.length;
//   const totalMarked = todaysSchedule.filter(cls => cls.attendanceMarked).length;
//   const totalStudents = classes.reduce((sum, cls) => sum + (cls.students?.length || 0), 0);
  
//   const upcomingClass = todaysSchedule.find(cls => !cls.attendanceMarked && new Date(`${selectedDate}T${cls.endTime}`) > new Date());

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex justify-between items-center">
//         <div>
//           <h2 className="text-2xl font-bold">Attendance Dashboard</h2>
//           <p className="text-gray-600">Overview of today's attendance activities</p>
//         </div>
        
//         <div className="flex items-center gap-3">
//           <input
//             type="date"
//             value={selectedDate}
//             onChange={(e) => setSelectedDate(e.target.value)}
//             className="border rounded-md px-3 py-2"
//             max={format(new Date(), 'yyyy-MM-dd')}
//           />
//           <Badge variant={isCurrentDay ? "default" : "outline"}>
//             {dayOfWeek}
//             {isCurrentDay && " (Today)"}
//           </Badge>
//         </div>
//       </div>

//       {/* Statistics Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//         <Card>
//           <CardContent className="p-6">
//             <div className="flex items-center gap-4">
//               <div className="p-3 bg-blue-100 rounded-lg">
//                 <CalendarDays className="w-6 h-6 text-blue-600" />
//               </div>
//               <div>
//                 <p className="text-2xl font-bold">{totalClasses}</p>
//                 <p className="text-sm text-gray-600">Classes Today</p>
//               </div>
//             </div>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardContent className="p-6">
//             <div className="flex items-center gap-4">
//               <div className="p-3 bg-green-100 rounded-lg">
//                 <CheckCircle className="w-6 h-6 text-green-600" />
//               </div>
//               <div>
//                 <p className="text-2xl font-bold">{totalMarked}</p>
//                 <p className="text-sm text-gray-600">Attendance Marked</p>
//                 <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
//                   <div 
//                     className="bg-green-500 h-2 rounded-full"
//                     style={{ width: `${totalClasses > 0 ? (totalMarked / totalClasses) * 100 : 0}%` }}
//                   ></div>
//                 </div>
//               </div>
//             </div>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardContent className="p-6">
//             <div className="flex items-center gap-4">
//               <div className="p-3 bg-purple-100 rounded-lg">
//                 <Users className="w-6 h-6 text-purple-600" />
//               </div>
//               <div>
//                 <p className="text-2xl font-bold">{totalStudents}</p>
//                 <p className="text-sm text-gray-600">Total Students</p>
//               </div>
//             </div>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardContent className="p-6">
//             <div className="flex items-center gap-4">
//               <div className="p-3 bg-orange-100 rounded-lg">
//                 <TrendingUp className="w-6 h-6 text-orange-600" />
//               </div>
//               <div>
//                 <p className="text-2xl font-bold">{overview.averageAttendance || 0}%</p>
//                 <p className="text-sm text-gray-600">Average Attendance</p>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Today's Schedule */}
//       <Card>
//         <CardContent className="p-6">
//           <div className="flex justify-between items-center mb-4">
//             <h3 className="text-lg font-bold">Today's Class Schedule ({dayOfWeek})</h3>
//             {upcomingClass && (
//               <Badge variant="outline" className="flex items-center gap-2">
//                 <Clock className="w-3 h-3" />
//                 Next: {upcomingClass.subject.name} at {upcomingClass.startTime}
//               </Badge>
//             )}
//           </div>

//           {todaysSchedule.length > 0 ? (
//             <div className="space-y-3">
//               {todaysSchedule.map((classItem) => (
//                 <div
//                   key={`${classItem.classId}-${classItem.periodNumber}`}
//                   className={`flex items-center justify-between p-4 border rounded-lg ${
//                     classItem.attendanceMarked ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
//                   }`}
//                 >
//                   <div className="flex items-center gap-4">
//                     <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
//                       classItem.attendanceMarked ? 'bg-green-100' : 'bg-gray-100'
//                     }`}>
//                       {classItem.attendanceMarked ? (
//                         <CheckCircle className="w-6 h-6 text-green-600" />
//                       ) : (
//                         <Clock className="w-6 h-6 text-gray-600" />
//                       )}
//                     </div>
//                     <div>
//                       <h4 className="font-medium">{classItem.className}</h4>
//                       <div className="text-sm text-gray-600 flex items-center gap-3 mt-1">
//                         <span>Period {classItem.periodNumber}</span>
//                         <span>•</span>
//                         <span>{classItem.subject.name}</span>
//                         <span>•</span>
//                         <span>{classItem.startTime} - {classItem.endTime}</span>
//                         <span>•</span>
//                         <span>{classItem.totalStudents} students</span>
//                       </div>
//                     </div>
//                   </div>

//                   <div className="flex items-center gap-3">
//                     <Badge variant={classItem.attendanceMarked ? "default" : "outline"}>
//                       {classItem.attendanceMarked ? 'Marked' : 'Pending'}
//                     </Badge>
//                     <Button
//                       size="sm"
//                       variant={classItem.attendanceMarked ? "outline" : "default"}
//                       onClick={() => {
//                         // Navigate to mark attendance for this class/period
//                         navigate(`?class=${classItem.classId}&period=${classItem.periodNumber}&date=${selectedDate}`);
//                       }}
//                       className="flex items-center gap-2"
//                     >
//                       {classItem.attendanceMarked ? 'View/Edit' : 'Mark Now'}
//                       <ArrowRight className="w-3 h-3" />
//                     </Button>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <div className="text-center py-8">
//               <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
//               <p className="text-gray-500">No classes scheduled for {dayOfWeek}</p>
//             </div>
//           )}
//         </CardContent>
//       </Card>

//       {/* Quick Actions */}
//       <Card>
//         <CardContent className="p-6">
//           <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
//           <div className="flex gap-3 flex-wrap">
//             <Button
//               variant="outline"
//               onClick={() => navigate('/admin/attendances?tab=mark')}
//               className="flex items-center gap-2"
//             >
//               <Calendar className="w-4 h-4" />
//               Mark Attendance
//             </Button>
//             <Button
//               variant="outline"
//               onClick={() => navigate('/admin/attendances?tab=summary')}
//               className="flex items-center gap-2"
//             >
//               <TrendingUp className="w-4 h-4" />
//               View Summary
//             </Button>
//             <Button
//               variant="outline"
//               onClick={() => {
//                 const today = format(new Date(), 'yyyy-MM-dd');
//                 setSelectedDate(today);
//               }}
//               className="flex items-center gap-2"
//             >
//               <Clock className="w-4 h-4" />
//               Jump to Today
//             </Button>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }