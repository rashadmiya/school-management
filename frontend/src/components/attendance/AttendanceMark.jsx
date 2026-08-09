// components/attendance/AttendanceMarker.jsx - ALIGNED VERSION with Dark Mode
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useGetClassRoutineQuery,
  useGetTodayAttendanceQuery,
  useMarkAttendanceWithRoutineMutation
} from "@/features/apis/attendanceApi";
import { useGetClassQuery } from "@/features/apis/classesApi";
import { useAppSelector } from "@/features/store";
import { format } from "date-fns";
import { AlertCircle, BookOpen, Calendar, CheckCircle, Clock, Save, Users, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

const STATUS_OPTIONS = [
  { value: 'present', label: 'Present', color: 'bg-green-100 text-green-800', darkColor: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle },
  { value: 'absent', label: 'Absent', color: 'bg-red-100 text-red-800', darkColor: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle },
  { value: 'late', label: 'Late', color: 'bg-yellow-100 text-yellow-800', darkColor: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Clock },
  { value: 'half_day', label: 'Half Day', color: 'bg-orange-100 text-orange-800', darkColor: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: Clock },
  { value: 'excused', label: 'Excused', color: 'bg-purple-100 text-purple-800', darkColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: AlertCircle },
];

export default function AttendanceMarker({ classId, periodNumber, isDarkMode = false }) {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedPeriod, setSelectedPeriod] = useState(periodNumber || null);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get day from selected date
  const selectedDay = format(new Date(selectedDate), 'EEEE');

  const { data: classData } = useGetClassQuery(classId);
  const { data: routineData } = useGetClassRoutineQuery({
    classId,
    day: selectedDay
  });

  const { data: todayAttendance, refetch: refetchToday } = useGetTodayAttendanceQuery({
    classId,
    date: selectedDate,
    period: selectedPeriod
  }, { skip: !selectedPeriod });
  
  const [markAttendanceWithRoutine] = useMarkAttendanceWithRoutineMutation();

  const students = classData?.class?.students || [];
  const scheduledPeriods = routineData?.scheduledPeriods || [];

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
    bgDisplay: isDarkMode ? "bg-gray-800" : "bg-gray-50",
    bgEven: isDarkMode ? "bg-gray-800/50" : "bg-gray-50",
    bgOdd: isDarkMode ? "bg-gray-900/30" : "bg-white",
    badge: {
      outline: isDarkMode ? "border-gray-700 text-gray-300" : "",
      present: isDarkMode ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-green-100 text-green-800",
      absent: isDarkMode ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-red-100 text-red-800",
      late: isDarkMode ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" : "bg-yellow-100 text-yellow-800",
      half_day: isDarkMode ? "bg-orange-500/20 text-orange-400 border-orange-500/30" : "bg-orange-100 text-orange-800",
    },
    alert: {
      warning: isDarkMode ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400" : "bg-yellow-50 border-yellow-200 text-yellow-800",
    },
    button: {
      default: isDarkMode 
        ? "bg-blue-600 hover:bg-blue-700 text-white" 
        : "bg-blue-600 hover:bg-blue-700 text-white",
      outline: isDarkMode 
        ? "border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white" 
        : "border-gray-200 text-gray-700 hover:bg-gray-50",
      status: (isSelected, option) => {
        if (isSelected) {
          return isDarkMode ? option.darkColor : option.color;
        }
        return isDarkMode ? "border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white" : "";
      }
    },
    input: isDarkMode 
      ? "bg-gray-800 border-gray-700 text-white placeholder:text-gray-500" 
      : "bg-white border-gray-200 text-gray-900",
    select: isDarkMode 
      ? "bg-gray-800 border-gray-700 text-white" 
      : "bg-white border-gray-200 text-gray-900",
    icon: {
      muted: isDarkMode ? "text-gray-600" : "text-gray-300",
    }
  };

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
      
      const periodInfo = scheduledPeriods.find(p => p.periodNumber === selectedPeriod);
      
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
      const periodInfo = scheduledPeriods.find(p => p.periodNumber === selectedPeriod);
      
      if (!periodInfo) {
        toast.error('No subject scheduled for this period');
        return;
      }

      const records = Object.entries(attendanceRecords).map(([studentId, data]) => ({
        studentId,
        status: data.status,
        remarks: data.remarks,
        period: selectedPeriod
      }));

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

  const getStatusBadgeColor = (status) => {
    const colors = {
      present: theme.badge.present,
      absent: theme.badge.absent,
      late: theme.badge.late,
      half_day: theme.badge.half_day,
      excused: isDarkMode ? "bg-purple-500/20 text-purple-400 border-purple-500/30" : "bg-purple-100 text-purple-800",
    };
    return colors[status] || (isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-800");
  };

  if (!classData) {
    return (
      <div className={`text-center py-8 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
        Loading class information...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Period Selection */}
      <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-sm`}>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <CardTitle className={`flex items-center gap-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              <Users className="w-5 h-5" />
              Mark Attendance - {classData?.class?.name || ""} {classData?.class?.section ? `- ${classData.class.section.name}` : ''}
            </CardTitle>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Day Display */}
              <div className="flex flex-col gap-2">
                <label className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Day</label>
                <div className={`border rounded-md px-3 py-2 ${isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-gray-50 border-gray-200"}`}>
                  {selectedDay}
                </div>
              </div>

              {/* Date Picker */}
              <div className="flex flex-col gap-2">
                <label className={`text-sm font-medium flex items-center gap-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                  <Calendar className="w-4 h-4" />
                  Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedPeriod(null);
                  }}
                  className={`border rounded-md px-3 py-2 ${theme.input}`}
                  max={format(new Date(), 'yyyy-MM-dd')}
                />
              </div>

              {/* Period Selector */}
              <div className="flex flex-col gap-2">
                <label className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Period</label>
                <select
                  value={selectedPeriod || ""}
                  onChange={(e) => setSelectedPeriod(parseInt(e.target.value))}
                  className={`border rounded-md px-3 py-2 ${theme.select}`}
                  disabled={scheduledPeriods.length === 0}
                >
                  <option value="">Select Period</option>
                  {scheduledPeriods.map(period => (
                    <option key={period.periodNumber} value={period.periodNumber} className={isDarkMode ? "bg-gray-800 text-white" : ""}>
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
                <label className={`text-sm font-medium flex items-center gap-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                  <BookOpen className="w-4 h-4" />
                  Subject
                </label>
                <div className={`border rounded-md px-3 py-2 ${isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-gray-50 border-gray-200"}`}>
                  {getSelectedPeriodInfo()?.subject.name || "Select a period"}
                </div>
              </div>

              {/* Status Summary */}
              <div className="flex flex-col gap-2">
                <label className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Summary</label>
                <div className="flex gap-1 flex-wrap">
                  <Badge variant="outline" className={getStatusBadgeColor('present')}>
                    P: {getStatusCount('present')}
                  </Badge>
                  <Badge variant="outline" className={getStatusBadgeColor('absent')}>
                    A: {getStatusCount('absent')}
                  </Badge>
                  <Badge variant="outline" className={getStatusBadgeColor('late')}>
                    L: {getStatusCount('late')}
                  </Badge>
                  <Badge variant="outline" className={getStatusBadgeColor('half_day')}>
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
        <div className={`p-4 border rounded-lg ${theme.alert.warning}`}>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">
              No classes scheduled for {selectedDay}. You can mark attendance as "Holiday" or check another date.
            </span>
          </div>
        </div>
      )}

      {/* Students List - Only show if period is selected */}
      {selectedPeriod ? (
        <>
          <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-sm overflow-hidden`}>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                {students.map((student, index) => (
                  <div
                    key={student._id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 ${
                      index % 2 === 0 ? theme.bgEven : theme.bgOdd
                    } border-b ${isDarkMode ? "border-gray-800" : "border-gray-100"}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 ${isDarkMode ? "bg-blue-500/20" : "bg-blue-100"} rounded-full flex items-center justify-center`}>
                        <span className={`text-sm font-medium ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}>
                          {student.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>{student.name}</p>
                        <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Roll: {student.rollNumber}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {/* Remarks Input */}
                      <input
                        type="text"
                        placeholder="Remarks..."
                        value={attendanceRecords[student._id]?.remarks || ''}
                        onChange={(e) => handleRemarksChange(student._id, e.target.value)}
                        className={`border rounded-md px-3 py-1 text-sm w-32 ${theme.input}`}
                      />

                      {/* Status Buttons */}
                      <div className="flex gap-1 flex-wrap">
                        {STATUS_OPTIONS.map((option) => {
                          const Icon = option.icon;
                          const isSelected = attendanceRecords[student._id]?.status === option.value;
                          
                          return (
                            <Button
                              key={option.value}
                              variant={isSelected ? "default" : "outline"}
                              size="sm"
                              className={`flex items-center gap-1 text-xs px-2 py-1 h-8 ${theme.button.status(isSelected, option)}`}
                              onClick={() => handleStatusChange(student._id, option.value)}
                            >
                              <Icon className="w-3 h-3" />
                              <span className="hidden sm:inline">{option.label}</span>
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
          <div className="flex flex-wrap gap-2">
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
              className={theme.button.outline}
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
              className={theme.button.outline}
            >
              Mark All Absent
            </Button>
          </div>
        </>
      ) : (
        <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-sm`}>
          <CardContent className="p-8 text-center">
            <BookOpen className={`w-12 h-12 ${theme.icon.muted} mx-auto mb-4`} />
            <p className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
              {scheduledPeriods.length > 0 
                ? "Please select a period from the schedule above" 
                : "No classes scheduled for the selected day"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
          {selectedPeriod && (
            <>
              Day: <strong className={isDarkMode ? "text-white" : "text-gray-900"}>{selectedDay}</strong> • 
              Subject: <strong className={isDarkMode ? "text-white" : "text-gray-900"}>{getSelectedPeriodInfo()?.subject.name}</strong> • 
              Period: <strong className={isDarkMode ? "text-white" : "text-gray-900"}>{selectedPeriod}</strong> ({getSelectedPeriodInfo()?.startTime}-{getSelectedPeriodInfo()?.endTime}) • 
              Students: <strong className={isDarkMode ? "text-white" : "text-gray-900"}>{students.length}</strong>
            </>
          )}
        </div>
        
        <Button 
          onClick={handleSubmit}
          disabled={isSubmitting || students.length === 0 || !selectedPeriod}
          className={`flex items-center gap-2 ${theme.button.default}`}
        >
          <Save className="w-4 h-4" />
          {isSubmitting ? 'Marking Attendance...' : `Mark Attendance (${getSelectedPeriodInfo()?.subject.name || 'Period'})`}
        </Button>
      </div>
    </div>
  );
}