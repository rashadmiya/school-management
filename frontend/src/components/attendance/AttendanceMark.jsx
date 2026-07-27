// components/attendance/AttendanceMarker.jsx - ALIGNED VERSION
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, CheckCircle, XCircle, Clock, Save, BookOpen, AlertCircle } from "lucide-react";
import { useGetClassQuery } from "@/features/apis/classesApi";
import { 
  useGetTodayAttendanceQuery, 
  useMarkAttendanceWithRoutineMutation, // UPDATED
  useGetClassRoutineQuery // UPDATED
} from "@/features/apis/attendanceApi";
import { format } from "date-fns";
import { toast } from "react-toastify";

const STATUS_OPTIONS = [
  { value: 'present', label: 'Present', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  { value: 'absent', label: 'Absent', color: 'bg-red-100 text-red-800', icon: XCircle },
  { value: 'late', label: 'Late', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  { value: 'half_day', label: 'Half Day', color: 'bg-orange-100 text-orange-800', icon: Clock },
  { value: 'excused', label: 'Excused', color: 'bg-purple-100 text-purple-800', icon: AlertCircle },
];

export default function AttendanceMarker({ classId, periodNumber }) {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedPeriod, setSelectedPeriod] = useState(periodNumber || null);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get day from selected date
  const selectedDay = format(new Date(selectedDate), 'EEEE'); // 'Monday', 'Tuesday', etc.

  const { data: classData } = useGetClassQuery(classId);
  const { data: routineData } = useGetClassRoutineQuery({
    classId,
    day: selectedDay
  });

  const { data: todayAttendance, refetch: refetchToday } = useGetTodayAttendanceQuery({
    classId,
    date: selectedDate,
    period: selectedPeriod
  },{skip: !selectedPeriod}); // Skip if no period selected
  
  const [markAttendanceWithRoutine] = useMarkAttendanceWithRoutineMutation(); // UPDATED

  const students = classData?.class?.students || [];
  const scheduledPeriods = routineData?.scheduledPeriods || [];
  
  // Auto-select first scheduled period
  useEffect(() => {
    if (scheduledPeriods.length > 0 && !selectedPeriod) {
      setSelectedPeriod(scheduledPeriods[0].periodNumber);
    }
  }, [scheduledPeriods, selectedPeriod]);

  // Initialize attendance records when period changes
  useEffect(() => {
    if (students.length > 0 && selectedPeriod) {
      const initialRecords = {};
      
      // Find the subject for selected period from routine
      const periodInfo = scheduledPeriods.find(p => p.periodNumber === selectedPeriod);
      
      // If we have today's attendance for this period, use it
      if (todayAttendance?.attendance) {
        todayAttendance.attendance.forEach(record => {
          if (record.period === selectedPeriod) {
            initialRecords[record.student._id] = {
              status: record.status,
              remarks: record.remarks || ''
            };
          }
        });
      }
      
      // For students without records, default to 'present'
      students.forEach(student => {
        if (!initialRecords[student._id]) {
          initialRecords[student._id] = {
            status: 'present',
            remarks: ''
          };
        }
      });
      
      setAttendanceRecords(initialRecords);
    }
  }, [students, todayAttendance, selectedPeriod, selectedDate, scheduledPeriods]);

  const handleStatusChange = (studentId, status) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status: status
      }
    }));
  };

  const handleRemarksChange = (studentId, remarks) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remarks: remarks
      }
    }));
  };

  const handleSubmit = async () => {
    if (!classId || !selectedDate || !selectedPeriod) {
      toast.error('Please select date and period');
      return;
    }

    setIsSubmitting(true);
    try {
      // Get period info from routine
      const periodInfo = scheduledPeriods.find(p => p.periodNumber === selectedPeriod);
      
      if (!periodInfo) {
        toast.error('No subject scheduled for this period');
        return;
      }

      // Prepare records in backend format
      const records = Object.entries(attendanceRecords).map(([studentId, data]) => ({
        studentId,
        status: data.status,
        remarks: data.remarks,
        period: selectedPeriod
      }));

      // Use the new endpoint with routine validation
      const result = await markAttendanceWithRoutine({
        classId,
        date: selectedDate,
        attendanceRecords: records
      }).unwrap();

      if (result.success) {
        toast.success(`Attendance marked for ${records.length} students in ${periodInfo.subject.name} (Period ${selectedPeriod})!`);
        refetchToday();
      } else {
        toast.error(result.message || 'Failed to mark attendance');
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast.error(error?.data?.message || 'Failed to mark attendance');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusCount = (status) => {
    return Object.values(attendanceRecords).filter(s => s.status === status).length;
  };

  const getSelectedPeriodInfo = () => {
    return scheduledPeriods.find(p => p.periodNumber === selectedPeriod);
  };

  if (!classData) {
    return <div>Loading class information...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with Period Selection */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Mark Attendance - {classData?.class?.name || ""} {classData?.class?.section ? `- ${classData.class.section.name}` : ''}
            </CardTitle>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Day Display */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Day</label>
                <div className="border rounded-md px-3 py-2 bg-gray-50">
                  {selectedDay}
                </div>
              </div>

              {/* Date Picker */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedPeriod(null); // Reset period when date changes
                  }}
                  className="border rounded-md px-3 py-2"
                  max={format(new Date(), 'yyyy-MM-dd')}
                />
              </div>

              {/* Period Selector */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Period</label>
                <select
                  value={selectedPeriod || ""}
                  onChange={(e) => setSelectedPeriod(parseInt(e.target.value))}
                  className="border rounded-md px-3 py-2"
                  disabled={scheduledPeriods.length === 0}
                >
                  <option value="">Select Period</option>
                  {scheduledPeriods.map(period => (
                    <option key={period.periodNumber} value={period.periodNumber}>
                      Period {period.periodNumber}: {period.subject.name} ({period.startTime}-{period.endTime})
                    </option>
                  ))}
                </select>
                {scheduledPeriods.length === 0 && (
                  <p className="text-xs text-red-500">No classes scheduled for {selectedDay}</p>
                )}
              </div>

              {/* Subject Display */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Subject
                </label>
                <div className="border rounded-md px-3 py-2 bg-gray-50">
                  {getSelectedPeriodInfo()?.subject.name || "Select a period"}
                </div>
              </div>

              {/* Status Summary */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Summary</label>
                <div className="flex gap-1 flex-wrap">
                  <Badge variant="outline" className="bg-green-100 text-green-800">
                    P: {getStatusCount('present')}
                  </Badge>
                  <Badge variant="outline" className="bg-red-100 text-red-800">
                    A: {getStatusCount('absent')}
                  </Badge>
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                    L: {getStatusCount('late')}
                  </Badge>
                  <Badge variant="outline" className="bg-orange-100 text-orange-800">
                    H: {getStatusCount('half_day')}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* No Schedule Alert */}
      {scheduledPeriods.length === 0 && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <span className="font-medium text-yellow-800">
              No classes scheduled for {selectedDay}. You can mark attendance as "Holiday" or check another date.
            </span>
          </div>
        </div>
      )}

      {/* Students List - Only show if period is selected */}
      {selectedPeriod ? (
        <>
          <Card>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                {students.map((student, index) => (
                  <div
                    key={student._id}
                    className={`flex items-center justify-between p-4 ${
                      index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                    } border-b`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {student.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-sm text-gray-500">Roll: {student.rollNumber}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Remarks Input */}
                      <input
                        type="text"
                        placeholder="Remarks..."
                        value={attendanceRecords[student._id]?.remarks || ''}
                        onChange={(e) => handleRemarksChange(student._id, e.target.value)}
                        className="border rounded-md px-3 py-1 text-sm w-32"
                      />

                      {/* Status Buttons */}
                      <div className="flex gap-2 flex-wrap">
                        {STATUS_OPTIONS.map((option) => {
                          const Icon = option.icon;
                          const isSelected = attendanceRecords[student._id]?.status === option.value;
                          
                          return (
                            <Button
                              key={option.value}
                              variant={isSelected ? "default" : "outline"}
                              size="sm"
                              className={`flex items-center gap-1 ${
                                isSelected ? option.color : ''
                              }`}
                              onClick={() => handleStatusChange(student._id, option.value)}
                            >
                              <Icon className="w-3 h-3" />
                              {option.label}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Bulk Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const updated = { ...attendanceRecords };
                Object.keys(updated).forEach(studentId => {
                  updated[studentId].status = 'present';
                });
                setAttendanceRecords(updated);
                toast.info('All students marked as Present');
              }}
            >
              Mark All Present
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const updated = { ...attendanceRecords };
                Object.keys(updated).forEach(studentId => {
                  updated[studentId].status = 'absent';
                });
                setAttendanceRecords(updated);
                toast.info('All students marked as Absent');
              }}
            >
              Mark All Absent
            </Button>
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {scheduledPeriods.length > 0 
                ? "Please select a period from the schedule above" 
                : "No classes scheduled for the selected day"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">
          {selectedPeriod && (
            <>
              Day: <strong>{selectedDay}</strong> • 
              Subject: <strong>{getSelectedPeriodInfo()?.subject.name}</strong> • 
              Period: <strong>{selectedPeriod}</strong> ({getSelectedPeriodInfo()?.startTime}-{getSelectedPeriodInfo()?.endTime}) • 
              Students: <strong>{students.length}</strong>
            </>
          )}
        </div>
        
        <Button 
          onClick={handleSubmit}
          disabled={isSubmitting || students.length === 0 || !selectedPeriod}
          className="flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {isSubmitting ? 'Marking Attendance...' : `Mark Attendance (${getSelectedPeriodInfo()?.subject.name || 'Period'})`}
        </Button>
      </div>
    </div>
  );
}

// // components/attendance/AttendanceMarker.jsx - UPDATED VERSION
// import React, { useState, useEffect } from "react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { Calendar, Users, CheckCircle, XCircle, Clock, Save, BookOpen, AlertCircle } from "lucide-react";
// import { useGetClassQuery } from "@/features/apis/classesApi";
// import { 
//   useGetTodayAttendanceQuery, 
//   useMarkAttendanceMutation,
//   useGetClassRoutineQuery 
// } from "@/features/apis/attendanceApi";
// import { format } from "date-fns";
// import { toast } from "react-toastify";

// const STATUS_OPTIONS = [
//   { value: 'present', label: 'Present', color: 'bg-green-100 text-green-800', icon: CheckCircle },
//   { value: 'absent', label: 'Absent', color: 'bg-red-100 text-red-800', icon: XCircle },
//   { value: 'late', label: 'Late', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
//   { value: 'half_day', label: 'Half Day', color: 'bg-orange-100 text-orange-800', icon: Clock },
//   { value: 'holiday', label: 'Holiday', color: 'bg-purple-100 text-purple-800', icon: AlertCircle },
// ];

// export default function AttendanceMarker({ classId }) {
//   const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
//   const [selectedPeriod, setSelectedPeriod] = useState(null);
//   const [attendanceRecords, setAttendanceRecords] = useState({});
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   // Get day from selected date
//   const selectedDay = format(new Date(selectedDate), 'EEEE'); // 'Monday', 'Tuesday', etc.

//   const { data: classData } = useGetClassQuery(classId);
//   const { data: routineData } = useGetClassRoutineQuery({
//     classId,
//     day: selectedDay
//   });
//   const { data: todayAttendance, refetch: refetchToday } = useGetTodayAttendanceQuery({
//     classId,
//     date: selectedDate,
//     period: selectedPeriod
//   });
//   const [markAttendance] = useMarkAttendanceMutation();

//   const students = classData?.class?.students || [];
//   const scheduledPeriods = routineData?.scheduledPeriods || [];
  
//   // Auto-select first scheduled period
//   useEffect(() => {
//     if (scheduledPeriods.length > 0 && !selectedPeriod) {
//       setSelectedPeriod(scheduledPeriods[0].periodNumber);
//     }
//   }, [scheduledPeriods, selectedPeriod]);

//   // Initialize attendance records when period changes
//   useEffect(() => {
//     if (students.length > 0 && selectedPeriod) {
//       const initialRecords = {};
      
//       // Find the subject for selected period from routine
//       const periodInfo = scheduledPeriods.find(p => p.periodNumber === selectedPeriod);
      
//       // If we have today's attendance for this period, use it
//       if (todayAttendance?.attendance) {
//         todayAttendance.attendance.forEach(record => {
//           initialRecords[record.student._id] = {
//             status: record.status,
//             remarks: record.remarks || ''
//           };
//         });
//       }
      
//       // For students without records, default to 'present'
//       students.forEach(student => {
//         if (!initialRecords[student._id]) {
//           initialRecords[student._id] = {
//             status: 'present',
//             remarks: ''
//           };
//         }
//       });
      
//       setAttendanceRecords(initialRecords);
//     }
//   }, [students, todayAttendance, selectedPeriod, selectedDate, scheduledPeriods]);

//   const handleStatusChange = (studentId, status) => {
//     setAttendanceRecords(prev => ({
//       ...prev,
//       [studentId]: {
//         ...prev[studentId],
//         status: status
//       }
//     }));
//   };

//   const handleRemarksChange = (studentId, remarks) => {
//     setAttendanceRecords(prev => ({
//       ...prev,
//       [studentId]: {
//         ...prev[studentId],
//         remarks: remarks
//       }
//     }));
//   };

//   const handleSubmit = async () => {
//     if (!classId || !selectedDate || !selectedPeriod) {
//       toast.error('Please select date and period');
//       return;
//     }

//     setIsSubmitting(true);
//     try {
//       // Get period info from routine
//       const periodInfo = scheduledPeriods.find(p => p.periodNumber === selectedPeriod);
      
//       if (!periodInfo) {
//         toast.error('No subject scheduled for this period');
//         return;
//       }

//       const records = Object.entries(attendanceRecords).map(([studentId, data]) => ({
//         studentId,
//         status: data.status,
//         remarks: data.remarks,
//         period: selectedPeriod,
//         subjectId: periodInfo.subject._id,
//         periodTimeRange: {
//           start: periodInfo.startTime,
//           end: periodInfo.endTime
//         }
//       }));

//       await markAttendance({
//         classId,
//         date: selectedDate,
//         attendanceRecords: records
//       }).unwrap();

//       toast.success(`Attendance marked for ${records.length} students in ${periodInfo.subject.name} (Period ${selectedPeriod})!`);
//       refetchToday();
//     } catch (error) {
//       console.error('Error marking attendance:', error);
//       toast.error(error?.data?.message || 'Failed to mark attendance');
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const getStatusCount = (status) => {
//     return Object.values(attendanceRecords).filter(s => s.status === status).length;
//   };

//   const getSelectedPeriodInfo = () => {
//     return scheduledPeriods.find(p => p.periodNumber === selectedPeriod);
//   };

//   if (!classData) {
//     return <div>Loading class information...</div>;
//   }

//   return (
//     <div className="space-y-6">
//       {/* Header with Period Selection */}
//       <Card>
//         <CardHeader>
//           <div className="flex flex-col gap-4">
//             <CardTitle className="flex items-center gap-2">
//               <Users className="w-5 h-5" />
//               Mark Attendance - {classData?.class?.name || ""} {classData?.class?.section ? `- ${classData.class.section.name}` : ''}
//             </CardTitle>
            
//             <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
//               {/* Day Display */}
//               <div className="flex flex-col gap-2">
//                 <label className="text-sm font-medium">Day</label>
//                 <div className="border rounded-md px-3 py-2 bg-gray-50">
//                   {selectedDay}
//                 </div>
//               </div>

//               {/* Date Picker */}
//               <div className="flex flex-col gap-2">
//                 <label className="text-sm font-medium flex items-center gap-2">
//                   <Calendar className="w-4 h-4" />
//                   Date
//                 </label>
//                 <input
//                   type="date"
//                   value={selectedDate}
//                   onChange={(e) => {
//                     setSelectedDate(e.target.value);
//                     setSelectedPeriod(null); // Reset period when date changes
//                   }}
//                   className="border rounded-md px-3 py-2"
//                   max={format(new Date(), 'yyyy-MM-dd')}
//                 />
//               </div>

//               {/* Period Selector */}
//               <div className="flex flex-col gap-2">
//                 <label className="text-sm font-medium">Period</label>
//                 <select
//                   value={selectedPeriod || ""}
//                   onChange={(e) => setSelectedPeriod(parseInt(e.target.value))}
//                   className="border rounded-md px-3 py-2"
//                   disabled={scheduledPeriods.length === 0}
//                 >
//                   <option value="">Select Period</option>
//                   {scheduledPeriods.map(period => (
//                     <option key={period.periodNumber} value={period.periodNumber}>
//                       Period {period.periodNumber}: {period.subject.name} ({period.startTime}-{period.endTime})
//                     </option>
//                   ))}
//                 </select>
//                 {scheduledPeriods.length === 0 && (
//                   <p className="text-xs text-red-500">No classes scheduled for {selectedDay}</p>
//                 )}
//               </div>

//               {/* Subject Display */}
//               <div className="flex flex-col gap-2">
//                 <label className="text-sm font-medium flex items-center gap-2">
//                   <BookOpen className="w-4 h-4" />
//                   Subject
//                 </label>
//                 <div className="border rounded-md px-3 py-2 bg-gray-50">
//                   {getSelectedPeriodInfo()?.subject.name || "Select a period"}
//                 </div>
//               </div>

//               {/* Status Summary */}
//               <div className="flex flex-col gap-2">
//                 <label className="text-sm font-medium">Summary</label>
//                 <div className="flex gap-1 flex-wrap">
//                   <Badge variant="outline" className="bg-green-100 text-green-800">
//                     P: {getStatusCount('present')}
//                   </Badge>
//                   <Badge variant="outline" className="bg-red-100 text-red-800">
//                     A: {getStatusCount('absent')}
//                   </Badge>
//                   <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
//                     L: {getStatusCount('late')}
//                   </Badge>
//                   <Badge variant="outline" className="bg-orange-100 text-orange-800">
//                     H: {getStatusCount('half_day')}
//                   </Badge>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </CardHeader>
//       </Card>

//       {/* No Schedule Alert */}
//       {scheduledPeriods.length === 0 && (
//         <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
//           <div className="flex items-center gap-2">
//             <AlertCircle className="w-5 h-5 text-yellow-600" />
//             <span className="font-medium text-yellow-800">
//               No classes scheduled for {selectedDay}. You can mark attendance as "Holiday" or check another date.
//             </span>
//           </div>
//         </div>
//       )}

//       {/* Attendance Already Marked Alert */}
//       {todayAttendance?.isTodayMarked && selectedDate === format(new Date(), 'yyyy-MM-dd') && (
//         <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center gap-2">
//               <CheckCircle className="w-5 h-5 text-blue-600" />
//               <span className="font-medium text-blue-800">
//                 Attendance already marked for {getSelectedPeriodInfo()?.subject.name} (Period {selectedPeriod})
//               </span>
//             </div>
//             <Button variant="outline" size="sm" onClick={refetchToday}>
//               Refresh
//             </Button>
//           </div>
//         </div>
//       )}

//       {/* Students List - Only show if period is selected */}
//       {selectedPeriod ? (
//         <>
//           <Card>
//             <CardContent className="p-0">
//               <div className="max-h-96 overflow-y-auto">
//                 {students.map((student, index) => (
//                   <div
//                     key={student._id}
//                     className={`flex items-center justify-between p-4 ${
//                       index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
//                     } border-b`}
//                   >
//                     <div className="flex items-center gap-4">
//                       <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
//                         <span className="text-sm font-medium text-blue-600">
//                           {student.name.charAt(0)}
//                         </span>
//                       </div>
//                       <div>
//                         <p className="font-medium">{student.name}</p>
//                         <p className="text-sm text-gray-500">Roll: {student.rollNumber}</p>
//                       </div>
//                     </div>

//                     <div className="flex items-center gap-4">
//                       {/* Remarks Input */}
//                       <input
//                         type="text"
//                         placeholder="Remarks..."
//                         value={attendanceRecords[student._id]?.remarks || ''}
//                         onChange={(e) => handleRemarksChange(student._id, e.target.value)}
//                         className="border rounded-md px-3 py-1 text-sm w-32"
//                       />

//                       {/* Status Buttons */}
//                       <div className="flex gap-2 flex-wrap">
//                         {STATUS_OPTIONS.map((option) => {
//                           const Icon = option.icon;
//                           const isSelected = attendanceRecords[student._id]?.status === option.value;
                          
//                           return (
//                             <Button
//                               key={option.value}
//                               variant={isSelected ? "default" : "outline"}
//                               size="sm"
//                               className={`flex items-center gap-1 ${
//                                 isSelected ? option.color : ''
//                               }`}
//                               onClick={() => handleStatusChange(student._id, option.value)}
//                             >
//                               <Icon className="w-3 h-3" />
//                               {option.label}
//                             </Button>
//                           );
//                         })}
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </CardContent>
//           </Card>

//           {/* Bulk Actions */}
//           <div className="flex gap-2">
//             <Button
//               variant="outline"
//               size="sm"
//               onClick={() => {
//                 const updated = { ...attendanceRecords };
//                 Object.keys(updated).forEach(studentId => {
//                   updated[studentId].status = 'present';
//                 });
//                 setAttendanceRecords(updated);
//                 toast.info('All students marked as Present');
//               }}
//             >
//               Mark All Present
//             </Button>
//             <Button
//               variant="outline"
//               size="sm"
//               onClick={() => {
//                 const updated = { ...attendanceRecords };
//                 Object.keys(updated).forEach(studentId => {
//                   updated[studentId].status = 'absent';
//                 });
//                 setAttendanceRecords(updated);
//                 toast.info('All students marked as Absent');
//               }}
//             >
//               Mark All Absent
//             </Button>
//           </div>
//         </>
//       ) : (
//         <Card>
//           <CardContent className="p-8 text-center">
//             <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
//             <p className="text-gray-500">
//               {scheduledPeriods.length > 0 
//                 ? "Please select a period from the schedule above" 
//                 : "No classes scheduled for the selected day"}
//             </p>
//           </CardContent>
//         </Card>
//       )}

//       {/* Action Buttons */}
//       <div className="flex justify-between items-center">
//         <div className="text-sm text-gray-500">
//           {selectedPeriod && (
//             <>
//               Day: <strong>{selectedDay}</strong> • 
//               Subject: <strong>{getSelectedPeriodInfo()?.subject.name}</strong> • 
//               Period: <strong>{selectedPeriod}</strong> ({getSelectedPeriodInfo()?.startTime}-{getSelectedPeriodInfo()?.endTime}) • 
//               Students: <strong>{students.length}</strong>
//             </>
//           )}
//         </div>
        
//         <Button 
//           onClick={handleSubmit}
//           disabled={isSubmitting || students.length === 0 || !selectedPeriod}
//           className="flex items-center gap-2"
//         >
//           <Save className="w-4 h-4" />
//           {isSubmitting ? 'Marking Attendance...' : `Mark Attendance (${getSelectedPeriodInfo()?.subject.name || 'Period'})`}
//         </Button>
//       </div>
//     </div>
//   );
// }
// // components/attendance/AttendanceMarker.jsx
// import React, { useState, useEffect } from "react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { Calendar, Users, CheckCircle, XCircle, Clock, Save, BookOpen } from "lucide-react";
// import { useGetClassQuery } from "@/features/apis/classesApi";
// import { useGetTodayAttendanceQuery, useMarkAttendanceMutation } from "@/features/apis/attendanceApi";
// import { format } from "date-fns";
// import { toast } from "react-toastify";

// const STATUS_OPTIONS = [
//   { value: 'present', label: 'Present', color: 'bg-green-100 text-green-800', icon: CheckCircle },
//   { value: 'absent', label: 'Absent', color: 'bg-red-100 text-red-800', icon: XCircle },
//   { value: 'late', label: 'Late', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
//   { value: 'half_day', label: 'Half Day', color: 'bg-orange-100 text-orange-800', icon: Clock },
// ];

// export default function AttendanceMarker({ classId }) {
//   const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
//   const [selectedSubject, setSelectedSubject] = useState("");
//   const [selectedPeriod, setSelectedPeriod] = useState(1);
//   const [attendanceRecords, setAttendanceRecords] = useState({});
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   const { data: classData } = useGetClassQuery(classId);
//   const { data: todayAttendance, refetch: refetchToday } = useGetTodayAttendanceQuery({
//     classId,
//     subjectId: selectedSubject,
//     period: selectedPeriod
//   });
//   const [markAttendance] = useMarkAttendanceMutation();

//   const students = classData?.class?.students || [];
//   const subjects = classData?.class?.subjects || [];

//   // Initialize attendance records when subject/period/date changes
//   useEffect(() => {
//     if (students.length > 0 && selectedSubject) {
//       const initialRecords = {};
      
//       // If we have today's attendance for this subject/period, use it
//       if (todayAttendance?.attendance) {
//         todayAttendance.attendance.forEach(record => {
//           initialRecords[record.student._id] = record.status;
//         });
//       }
      
//       // For students without records, default to 'present'
//       students.forEach(student => {
//         if (!initialRecords[student._id]) {
//           initialRecords[student._id] = 'present';
//         }
//       });
      
//       setAttendanceRecords(initialRecords);
//     }
//   }, [students, todayAttendance, selectedSubject, selectedPeriod, selectedDate]);

//   // Auto-select first subject
//   useEffect(() => {
//     if (subjects.length > 0 && !selectedSubject) {
//       setSelectedSubject(subjects[0]._id);
//     }
//   }, [subjects, selectedSubject]);

//   const handleStatusChange = (studentId, status) => {
//     setAttendanceRecords(prev => ({
//       ...prev,
//       [studentId]: status
//     }));
//   };

//   const handleSubmit = async () => {
//     if (!classId || !selectedDate || !selectedSubject) {
//       toast.error('Please select class, subject, and date');
//       return;
//     }

//     setIsSubmitting(true);
//     try {
//       const records = Object.entries(attendanceRecords).map(([studentId, status]) => ({
//         studentId,
//         status
//       }));

//       await markAttendance({
//         classId,
//         subjectId: selectedSubject,
//         date: selectedDate,
//         period: selectedPeriod,
//         attendanceRecords: records
//       }).unwrap();

//       toast.success(`Attendance marked for ${records.length} students in period ${selectedPeriod}!`);
//       refetchToday();
//     } catch (error) {
//       console.error('Error marking attendance:', error);
//       toast.error(error?.data?.message || 'Failed to mark attendance');
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const getStatusCount = (status) => {
//     return Object.values(attendanceRecords).filter(s => s === status).length;
//   };

//   const getSubjectName = (subjectId) => {
//     return subjects.find(s => s._id === subjectId)?.name || "Unknown Subject";
//   };

//   if (!classData) {
//     return <div>Loading class information...</div>;
//   }

//   return (
//     <div className="space-y-6">
//       {/* Header with Subject & Period Selection */}
//       <Card>
//         <CardHeader>
//           <div className="flex flex-col gap-4">
//             <CardTitle className="flex items-center gap-2">
//               <Users className="w-5 h-5" />
//               {/* Mark Attendance - {classData?.class?.name || ""} */}
//               Mark Attendance - {classData?.class?.name || ""} {classData?.class?.section ? `- ${classData.class.section.name}` : ''}
//             </CardTitle>
            
//             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//               {/* Subject Selector */}
//               <div className="flex flex-col gap-2">
//                 <label className="text-sm font-medium flex items-center gap-2">
//                   <BookOpen className="w-4 h-4" />
//                   Subject
//                 </label>
//                 <select
//                   value={selectedSubject}
//                   onChange={(e) => setSelectedSubject(e.target.value)}
//                   className="border rounded-md px-3 py-2"
//                 >
//                   <option value="">Select Subject</option>
//                   {subjects.map(subject => (
//                     <option key={subject._id} value={subject._id}>
//                       {subject.name}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               {/* Period Selector */}
//               <div className="flex flex-col gap-2">
//                 <label className="text-sm font-medium">Period</label>
//                 <select
//                   value={selectedPeriod}
//                   onChange={(e) => setSelectedPeriod(parseInt(e.target.value))}
//                   className="border rounded-md px-3 py-2"
//                 >
//                   {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(period => (
//                     <option key={period} value={period}>
//                       Period {period}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               {/* Date Picker */}
//               <div className="flex flex-col gap-2">
//                 <label className="text-sm font-medium flex items-center gap-2">
//                   <Calendar className="w-4 h-4" />
//                   Date
//                 </label>
//                 <input
//                   type="date"
//                   value={selectedDate}
//                   onChange={(e) => setSelectedDate(e.target.value)}
//                   className="border rounded-md px-3 py-2"
//                   max={format(new Date(), 'yyyy-MM-dd')}
//                 />
//               </div>

//               {/* Status Summary */}
//               <div className="flex flex-col gap-2">
//                 <label className="text-sm font-medium">Summary</label>
//                 <div className="flex gap-1 flex-wrap">
//                   <Badge variant="outline" className="bg-green-100 text-green-800">
//                     P: {getStatusCount('present')}
//                   </Badge>
//                   <Badge variant="outline" className="bg-red-100 text-red-800">
//                     A: {getStatusCount('absent')}
//                   </Badge>
//                   <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
//                     L: {getStatusCount('late')}
//                   </Badge>
//                   <Badge variant="outline" className="bg-orange-100 text-orange-800">
//                     H: {getStatusCount('half_day')}
//                   </Badge>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </CardHeader>
//       </Card>

//       {/* Attendance Status Alert */}
//       {todayAttendance?.isTodayMarked && selectedDate === format(new Date(), 'yyyy-MM-dd') && (
//         <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center gap-2">
//               <CheckCircle className="w-5 h-5 text-blue-600" />
//               <span className="font-medium text-blue-800">
//                 Attendance already marked for {getSubjectName(selectedSubject)} (Period {selectedPeriod})
//               </span>
//             </div>
//             <Button variant="outline" size="sm" onClick={refetchToday}>
//               Refresh
//             </Button>
//           </div>
//         </div>
//       )}

//       {/* Students List */}
//       {selectedSubject ? (
//         <Card>
//           <CardContent className="p-0">
//             <div className="max-h-96 overflow-y-auto">
//               {students.map((student, index) => (
//                 <div
//                   key={student._id}
//                   className={`flex items-center justify-between p-4 ${
//                     index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
//                   } border-b`}
//                 >
//                   <div className="flex items-center gap-4">
//                     <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
//                       <span className="text-sm font-medium text-blue-600">
//                         {student.name.charAt(0)}
//                       </span>
//                     </div>
//                     <div>
//                       <p className="font-medium">{student.name}</p>
//                       <p className="text-sm text-gray-500">Roll: {student.rollNumber}</p>
//                     </div>
//                   </div>

//                   <div className="flex gap-2 flex-wrap">
//                     {STATUS_OPTIONS.map((option) => {
//                       const Icon = option.icon;
//                       const isSelected = attendanceRecords[student._id] === option.value;
                      
//                       return (
//                         <Button
//                           key={option.value}
//                           variant={isSelected ? "default" : "outline"}
//                           size="sm"
//                           className={`flex items-center gap-1 ${
//                             isSelected ? option.color : ''
//                           }`}
//                           onClick={() => handleStatusChange(student._id, option.value)}
//                         >
//                           <Icon className="w-3 h-3" />
//                           {option.label}
//                         </Button>
//                       );
//                     })}
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </CardContent>
//         </Card>
//       ) : (
//         <Card>
//           <CardContent className="p-8 text-center">
//             <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
//             <p className="text-gray-500">Please select a subject to mark attendance</p>
//           </CardContent>
//         </Card>
//       )}

//       {/* Action Buttons */}
//       <div className="flex justify-between items-center">
//         <div className="text-sm text-gray-500">
//           {selectedSubject && (
//             <>
//               Subject: <strong>{getSubjectName(selectedSubject)}</strong> • 
//               Period: <strong>{selectedPeriod}</strong> • 
//               Students: <strong>{students.length}</strong>
//             </>
//           )}
//         </div>
        
//         <Button 
//           onClick={handleSubmit}
//           disabled={isSubmitting || students.length === 0 || !selectedSubject}
//           className="flex items-center gap-2"
//         >
//           <Save className="w-4 h-4" />
//           {isSubmitting ? 'Marking Attendance...' : `Mark Attendance (Period ${selectedPeriod})`}
//         </Button>
//       </div>
//     </div>
//   );
// }