// components/student/StudentDashboard.jsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Calendar, Clock, TrendingUp, Users, FileText, AlertCircle, User, DollarSign } from "lucide-react";
import { useGetStudentDashboardQuery } from "@/features/apis/studentsApi";
import { Link } from "react-router-dom";

export default function StudentDashboard() {
    const { data: dashboardData, isLoading, error } = useGetStudentDashboardQuery();
    
    if (isLoading) {
        return <div className="flex justify-center py-8">Loading dashboard...</div>;
    }
    
    if (error) {
        return <div className="text-red-600 text-center py-8">Error loading dashboard</div>;
    }

    const { 
        student, 
        payments, 
        attendance, 
        assignments, 
        results 
    } = dashboardData?.dashboard || {};

    const paymentSummary = payments?.summary || {};
    const upcomingPayments = payments?.upcoming || [];
    const recentPayments = payments?.recent || [];
    const attendanceStats = attendance?.stats || {};
    const recentAttendance = attendance?.recent || [];
    const todayAssignments = assignments?.today || [];
    const recentResults = results || [];

    // Calculate overdue assignments
    const overdueAssignments = todayAssignments.filter(
        assignment => new Date(assignment.dueDate) < new Date()
    );

    // Calculate weighted attendance percentage
    const calculateWeightedAttendance = () => {
        const present = attendanceStats.presentRecords || 0;
        const late = attendanceStats.lateRecords || 0;
        const halfDay = attendanceStats.halfDayRecords || 0;
        const total = attendanceStats.totalRecords || 0;
        
        if (total === 0) return 0;
        
        const weightedScore = present + (late * 0.5) + (halfDay * 0.5);
        return Math.round((weightedScore / total) * 100);
    };

    const weightedAttendancePercentage = calculateWeightedAttendance();

    return (
        <div className="space-y-6">
            {/* Welcome Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Welcome back, {student?.name}!</h1>
                    <p className="text-gray-600 mt-2">Roll Number: {student?.rollNumber} • Class: {student?.class?.name || 'Not assigned'}</p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-gray-500">Today</p>
                    <p className="font-semibold">{new Date().toLocaleDateString()}</p>
                </div>
            </div>

            {/* Payment Alert */}
            {paymentSummary.totalOutstanding > 0 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-yellow-600" />
                        <span className="font-medium text-yellow-800">
                            You have outstanding fees: ${paymentSummary.totalOutstanding}
                        </span>
                    </div>
                </div>
            )}

            {/* Alert for overdue assignments */}
            {overdueAssignments.length > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        <span className="font-medium text-red-800">
                            You have {overdueAssignments.length} overdue assignment(s)
                        </span>
                    </div>
                </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <BookOpen className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{todayAssignments.length}</p>
                                <p className="text-sm text-gray-600">Today's Assignments</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-orange-100 rounded-lg">
                                <Calendar className="w-6 h-6 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{upcomingPayments.length}</p>
                                <p className="text-sm text-gray-600">Upcoming Payments</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <TrendingUp className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{weightedAttendancePercentage}%</p>
                                <p className="text-sm text-gray-600">Attendance Rate</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <FileText className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">
                                    {attendanceStats.presentRecords || 0}/{attendanceStats.totalRecords || 0}
                                </p>
                                <p className="text-sm text-gray-600">Classes Attended</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-indigo-100 rounded-lg">
                                <DollarSign className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{paymentSummary.collectionRate || 0}%</p>
                                <p className="text-sm text-gray-600">Payment Rate</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Payment Summary */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <DollarSign className="w-5 h-5" />
                            Payment Summary
                        </CardTitle>
                        <Badge variant="outline">
                            {paymentSummary.totalOutstanding > 0 ? "Pending" : "Cleared"}
                        </Badge>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Total Due:</span>
                                <span className="font-semibold">${paymentSummary.totalDue || 0}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Total Paid:</span>
                                <span className="font-semibold text-green-600">${paymentSummary.totalPaid || 0}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Outstanding:</span>
                                <span className={`font-semibold ${
                                    paymentSummary.totalOutstanding > 0 ? "text-red-600" : "text-gray-600"
                                }`}>
                                    ${paymentSummary.totalOutstanding || 0}
                                </span>
                            </div>
                            <div className="flex justify-between pt-2 border-t">
                                <span className="text-sm text-gray-600">Collection Rate:</span>
                                <span className="font-semibold">{paymentSummary.collectionRate || 0}%</span>
                            </div>
                        </div>

                        {/* Upcoming Payments */}
                        {upcomingPayments.length > 0 && (
                            <div className="mt-4">
                                <h4 className="font-semibold mb-2">Upcoming Payments</h4>
                                <div className="space-y-2">
                                    {upcomingPayments.map((payment) => (
                                        <div key={payment._id} className="flex justify-between items-center p-2 border rounded">
                                            <div>
                                                <p className="text-sm font-medium capitalize">{payment.feeType}</p>
                                                <p className="text-xs text-gray-500">
                                                    Due: {new Date(payment.dueDate).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <Badge variant={payment.status === 'overdue' ? "destructive" : "outline"}>
                                                ${payment.amount}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <Button variant="outline" className="w-full mt-4" asChild>
                            <Link to="/student/payments">View Payment Details</Link>
                        </Button>
                    </CardContent>
                </Card>

                {/* Attendance Breakdown */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" />
                            Attendance Breakdown
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-4 bg-green-50 rounded-lg">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <BookOpen className="w-4 h-4 text-green-600" />
                                    <span className="font-semibold text-green-800">Present</span>
                                </div>
                                <p className="text-2xl font-bold text-green-600">{attendanceStats.presentRecords || 0}</p>
                                <p className="text-sm text-gray-600">Classes</p>
                            </div>
                            
                            <div className="text-center p-4 bg-red-50 rounded-lg">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <AlertCircle className="w-4 h-4 text-red-600" />
                                    <span className="font-semibold text-red-800">Absent</span>
                                </div>
                                <p className="text-2xl font-bold text-red-600">{attendanceStats.absentRecords || 0}</p>
                                <p className="text-sm text-gray-600">Classes</p>
                            </div>
                            
                            <div className="text-center p-4 bg-yellow-50 rounded-lg">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <Clock className="w-4 h-4 text-yellow-600" />
                                    <span className="font-semibold text-yellow-800">Late</span>
                                </div>
                                <p className="text-2xl font-bold text-yellow-600">{attendanceStats.lateRecords || 0}</p>
                                <p className="text-sm text-gray-600">Classes</p>
                            </div>
                            
                            <div className="text-center p-4 bg-orange-50 rounded-lg">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <Clock className="w-4 h-4 text-orange-600" />
                                    <span className="font-semibold text-orange-800">Half Day</span>
                                </div>
                                <p className="text-2xl font-bold text-orange-600">{attendanceStats.halfDayRecords || 0}</p>
                                <p className="text-sm text-gray-600">Classes</p>
                            </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="mt-4 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="font-medium">Overall Attendance Rate</span>
                                <span className="font-bold">{weightedAttendancePercentage}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                                <div
                                    className={`h-3 rounded-full transition-all duration-500 ${
                                        weightedAttendancePercentage >= 90 ? 'bg-green-500' :
                                        weightedAttendancePercentage >= 75 ? 'bg-yellow-500' :
                                        'bg-red-500'
                                    }`}
                                    style={{ width: `${weightedAttendancePercentage}%` }}
                                ></div>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500">
                                <span>Total Classes: {attendanceStats.totalRecords || 0}</span>
                                <span>
                                    {weightedAttendancePercentage >= 90 ? 'Excellent' :
                                     weightedAttendancePercentage >= 75 ? 'Good' :
                                     'Needs Improvement'}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Today's Assignments & Recent Results */}
                <div className="space-y-6">
                    {/* Today's Assignments */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <BookOpen className="w-5 h-5" />
                                Today's Assignments
                            </CardTitle>
                            <Badge variant="outline">{todayAssignments.length}</Badge>
                        </CardHeader>
                        <CardContent>
                            {todayAssignments.length === 0 ? (
                                <div className="text-center py-4 text-gray-500">
                                    No assignments due today
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {todayAssignments.map((assignment) => {
                                        const isOverdue = new Date(assignment.dueDate) < new Date();

                                        return (
                                            <div key={assignment._id} className="flex items-center justify-between p-3 border rounded-lg">
                                                <div className="flex-1">
                                                    <p className="font-medium text-sm">{assignment.title}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {assignment.subject?.name}
                                                    </p>
                                                </div>
                                                <Badge variant={isOverdue ? "destructive" : "outline"}>
                                                    {isOverdue ? "Overdue" : "Due Today"}
                                                </Badge>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            <Button variant="outline" className="w-full mt-4" asChild>
                                <Link to="/student/assignments">View All Assignments</Link>
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Recent Results */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                Recent Results
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {recentResults.length === 0 ? (
                                <div className="text-center py-4 text-gray-500">
                                    No results available
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {recentResults.slice(0, 3).map((result) => (
                                        <div key={result._id} className="flex items-center justify-between p-3 border rounded-lg">
                                            <div className="flex-1">
                                                <p className="font-medium text-sm">{result.exam?.title}</p>
                                                <p className="text-xs text-gray-500">
                                                    {result.subject?.name} • {result.term} {result.year}
                                                </p>
                                            </div>
                                            <Badge variant="outline">
                                                {result.marksObtained}/{result.exam?.totalMarks}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <Button variant="outline" className="w-full mt-4" asChild>
                                <Link to="/student/results">View All Results</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4" asChild>
                            <Link to="/student/schedule">
                                <Calendar className="w-6 h-6" />
                                <span>Today's Schedule</span>
                            </Link>
                        </Button>

                        <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4" asChild>
                            <Link to="/student/attendance">
                                <TrendingUp className="w-6 h-6" />
                                <span>Attendance</span>
                            </Link>
                        </Button>

                        <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4" asChild>
                            <Link to="/student/results">
                                <FileText className="w-6 h-6" />
                                <span>My Results</span>
                            </Link>
                        </Button>

                        <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4" asChild>
                            <Link to="/student/payments">
                                <DollarSign className="w-6 h-6" />
                                <span>Payments</span>
                            </Link>
                        </Button>

                        <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4" asChild>
                            <Link to="/student/profile">
                                <User className="w-6 h-6" />
                                <span>Profile</span>
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}


// // components/student/StudentDashboard.jsx
// import React from "react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { BookOpen, Calendar, Clock, TrendingUp, Users, FileText, AlertCircle, User } from "lucide-react";
// import { useGetStudentProfileQuery, useGetStudentAssignmentsQuery, useGetStudentExamsQuery } from "@/features/apis/studentsApi";
// import { Link } from "react-router-dom";
// import { useGetMyAttendanceQuery } from "@/features/apis/attendanceApi";

// export default function StudentDashboard() {
//     const { data: profile } = useGetStudentProfileQuery();
//     const { data: assignments } = useGetStudentAssignmentsQuery();
//     const { data: exams } = useGetStudentExamsQuery();
//     const { data: attendance } = useGetMyAttendanceQuery({
//         month: new Date().getMonth() + 1,
//         year: new Date().getFullYear()
//     });

//     const student = profile?.user || {};
//     const upcomingAssignments = assignments?.assignments || [];
//     const upcomingExams = exams?.exams || [];
//     const attendanceStats = attendance?.statistics || {};

//     // Calculate overdue assignments
//     const overdueAssignments = upcomingAssignments.filter(
//         assignment => new Date(assignment.dueDate) < new Date()
//     );

//     // Calculate weighted attendance percentage based on new status types
//     const calculateWeightedAttendance = () => {
//         const present = attendanceStats.presentRecords || 0;
//         const late = attendanceStats.lateRecords || 0;
//         const halfDay = attendanceStats.halfDayRecords || 0;
//         const total = attendanceStats.totalRecords || 0;
        
//         if (total === 0) return 0;
        
//         // Weighted calculation: present=1, late=0.5, half_day=0.5, absent=0
//         const weightedScore = present + (late * 0.5) + (halfDay * 0.5);
//         return Math.round((weightedScore / total) * 100);
//     };

//     const weightedAttendancePercentage = calculateWeightedAttendance();

//     return (
//         <div className="space-y-6">
//             {/* Welcome Header */}
//             <div className="flex justify-between items-center">
//                 <div>
//                     <h1 className="text-3xl font-bold">Welcome back, {student?.name}!</h1>
//                     <p className="text-gray-600 mt-2">Roll Number: {student?.rollNumber} • Class: {student?.class?.name || 'Not assigned'}</p>
//                 </div>
//                 <div className="text-right">
//                     <p className="text-sm text-gray-500">Today</p>
//                     <p className="font-semibold">{new Date().toLocaleDateString()}</p>
//                 </div>
//             </div>

//             {/* Alert for overdue assignments */}
//             {overdueAssignments.length > 0 && (
//                 <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
//                     <div className="flex items-center gap-2">
//                         <AlertCircle className="w-5 h-5 text-red-600" />
//                         <span className="font-medium text-red-800">
//                             You have {overdueAssignments.length} overdue assignment(s)
//                         </span>
//                     </div>
//                 </div>
//             )}

//             {/* Quick Stats */}
//             <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
//                 <Card>
//                     <CardContent className="p-6">
//                         <div className="flex items-center gap-4">
//                             <div className="p-3 bg-blue-100 rounded-lg">
//                                 <BookOpen className="w-6 h-6 text-blue-600" />
//                             </div>
//                             <div>
//                                 <p className="text-2xl font-bold">{upcomingAssignments.length}</p>
//                                 <p className="text-sm text-gray-600">Pending Assignments</p>
//                             </div>
//                         </div>
//                     </CardContent>
//                 </Card>

//                 <Card>
//                     <CardContent className="p-6">
//                         <div className="flex items-center gap-4">
//                             <div className="p-3 bg-orange-100 rounded-lg">
//                                 <Calendar className="w-6 h-6 text-orange-600" />
//                             </div>
//                             <div>
//                                 <p className="text-2xl font-bold">{upcomingExams.length}</p>
//                                 <p className="text-sm text-gray-600">Upcoming Exams</p>
//                             </div>
//                         </div>
//                     </CardContent>
//                 </Card>

//                 <Card>
//                     <CardContent className="p-6">
//                         <div className="flex items-center gap-4">
//                             <div className="p-3 bg-green-100 rounded-lg">
//                                 <TrendingUp className="w-6 h-6 text-green-600" />
//                             </div>
//                             <div>
//                                 <p className="text-2xl font-bold">{weightedAttendancePercentage}%</p>
//                                 <p className="text-sm text-gray-600">Attendance Rate</p>
//                             </div>
//                         </div>
//                     </CardContent>
//                 </Card>

//                 <Card>
//                     <CardContent className="p-6">
//                         <div className="flex items-center gap-4">
//                             <div className="p-3 bg-purple-100 rounded-lg">
//                                 <FileText className="w-6 h-6 text-purple-600" />
//                             </div>
//                             <div>
//                                 <p className="text-2xl font-bold">
//                                     {attendanceStats.presentRecords || 0}/{attendanceStats.totalRecords || 0}
//                                 </p>
//                                 <p className="text-sm text-gray-600">Classes Attended</p>
//                             </div>
//                         </div>
//                     </CardContent>
//                 </Card>
//             </div>

//             {/* Attendance Breakdown */}
//             <Card>
//                 <CardHeader>
//                     <CardTitle className="flex items-center gap-2">
//                         <TrendingUp className="w-5 h-5" />
//                         Attendance Breakdown
//                     </CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//                         <div className="text-center p-4 bg-green-50 rounded-lg">
//                             <div className="flex items-center justify-center gap-2 mb-2">
//                                 <BookOpen className="w-4 h-4 text-green-600" />
//                                 <span className="font-semibold text-green-800">Present</span>
//                             </div>
//                             <p className="text-2xl font-bold text-green-600">{attendanceStats.presentRecords || 0}</p>
//                             <p className="text-sm text-gray-600">Classes</p>
//                         </div>
                        
//                         <div className="text-center p-4 bg-red-50 rounded-lg">
//                             <div className="flex items-center justify-center gap-2 mb-2">
//                                 <AlertCircle className="w-4 h-4 text-red-600" />
//                                 <span className="font-semibold text-red-800">Absent</span>
//                             </div>
//                             <p className="text-2xl font-bold text-red-600">{attendanceStats.absentRecords || 0}</p>
//                             <p className="text-sm text-gray-600">Classes</p>
//                         </div>
                        
//                         <div className="text-center p-4 bg-yellow-50 rounded-lg">
//                             <div className="flex items-center justify-center gap-2 mb-2">
//                                 <Clock className="w-4 h-4 text-yellow-600" />
//                                 <span className="font-semibold text-yellow-800">Late</span>
//                             </div>
//                             <p className="text-2xl font-bold text-yellow-600">{attendanceStats.lateRecords || 0}</p>
//                             <p className="text-sm text-gray-600">Classes</p>
//                         </div>
                        
//                         <div className="text-center p-4 bg-orange-50 rounded-lg">
//                             <div className="flex items-center justify-center gap-2 mb-2">
//                                 <Clock className="w-4 h-4 text-orange-600" />
//                                 <span className="font-semibold text-orange-800">Half Day</span>
//                             </div>
//                             <p className="text-2xl font-bold text-orange-600">{attendanceStats.halfDayRecords || 0}</p>
//                             <p className="text-sm text-gray-600">Classes</p>
//                         </div>
//                     </div>
                    
//                     {/* Progress Bar */}
//                     <div className="mt-4 space-y-2">
//                         <div className="flex justify-between text-sm">
//                             <span className="font-medium">Overall Attendance Rate</span>
//                             <span className="font-bold">{weightedAttendancePercentage}%</span>
//                         </div>
//                         <div className="w-full bg-gray-200 rounded-full h-3">
//                             <div
//                                 className={`h-3 rounded-full transition-all duration-500 ${
//                                     weightedAttendancePercentage >= 90 ? 'bg-green-500' :
//                                     weightedAttendancePercentage >= 75 ? 'bg-yellow-500' :
//                                     'bg-red-500'
//                                 }`}
//                                 style={{ width: `${weightedAttendancePercentage}%` }}
//                             ></div>
//                         </div>
//                         <div className="flex justify-between text-xs text-gray-500">
//                             <span>Total Classes: {attendanceStats.totalRecords || 0}</span>
//                             <span>
//                                 {weightedAttendancePercentage >= 90 ? 'Excellent' :
//                                  weightedAttendancePercentage >= 75 ? 'Good' :
//                                  'Needs Improvement'}
//                             </span>
//                         </div>
//                     </div>
//                 </CardContent>
//             </Card>

//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//                 {/* Upcoming Assignments */}
//                 <Card>
//                     <CardHeader className="flex flex-row items-center justify-between">
//                         <CardTitle className="flex items-center gap-2">
//                             <BookOpen className="w-5 h-5" />
//                             Upcoming Assignments
//                         </CardTitle>
//                         <Badge variant="outline">{upcomingAssignments.length}</Badge>
//                     </CardHeader>
//                     <CardContent>
//                         {upcomingAssignments.length === 0 ? (
//                             <div className="text-center py-4 text-gray-500">
//                                 No upcoming assignments
//                             </div>
//                         ) : (
//                             <div className="space-y-3">
//                                 {upcomingAssignments.slice(0, 5).map((assignment) => {
//                                     const isOverdue = new Date(assignment.dueDate) < new Date();

//                                     return (
//                                         <div key={assignment._id} className="flex items-center justify-between p-3 border rounded-lg">
//                                             <div className="flex-1">
//                                                 <p className="font-medium">{assignment.title}</p>
//                                                 <p className="text-sm text-gray-500">
//                                                     {assignment.subject?.name} • {assignment.class?.name}
//                                                 </p>
//                                             </div>
//                                             <Badge variant={isOverdue ? "destructive" : "outline"}>
//                                                 {isOverdue ? "Overdue" : `Due: ${new Date(assignment.dueDate).toLocaleDateString()}`}
//                                             </Badge>
//                                         </div>
//                                     );
//                                 })}
//                             </div>
//                         )}
//                         <Button variant="outline" className="w-full mt-4" asChild>
//                             <Link to="/student/assignments">View All Assignments</Link>
//                         </Button>
//                     </CardContent>
//                 </Card>

//                 {/* Upcoming Exams */}
//                 <Card>
//                     <CardHeader className="flex flex-row items-center justify-between">
//                         <CardTitle className="flex items-center gap-2">
//                             <Calendar className="w-5 h-5" />
//                             Upcoming Exams
//                         </CardTitle>
//                         <Badge variant="outline">{upcomingExams.length}</Badge>
//                     </CardHeader>
//                     <CardContent>
//                         {upcomingExams.length === 0 ? (
//                             <div className="text-center py-4 text-gray-500">
//                                 No upcoming exams
//                             </div>
//                         ) : (
//                             <div className="space-y-3">
//                                 {upcomingExams.slice(0, 5).map((exam) => {
//                                     const examDate = new Date(exam.date);
//                                     const isToday = examDate.toDateString() === new Date().toDateString();

//                                     return (
//                                         <div key={exam._id} className="flex items-center justify-between p-3 border rounded-lg">
//                                             <div className="flex-1">
//                                                 <p className="font-medium">{exam.title}</p>
//                                                 <p className="text-sm text-gray-500">
//                                                     {exam.subject?.name} • {exam.startTime} - {exam.endTime}
//                                                 </p>
//                                             </div>
//                                             <Badge variant={isToday ? "default" : "outline"}>
//                                                 {isToday ? "Today" : examDate.toLocaleDateString()}
//                                             </Badge>
//                                         </div>
//                                     );
//                                 })}
//                             </div>
//                         )}
//                         <Button variant="outline" className="w-full mt-4" asChild>
//                             <Link to="/student/exams">View All Exams</Link>
//                         </Button>
//                     </CardContent>
//                 </Card>
//             </div>

//             {/* Quick Actions */}
//             <Card>
//                 <CardHeader>
//                     <CardTitle>Quick Actions</CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//                         <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4" asChild>
//                             <Link to="/student/schedule">
//                                 <Calendar className="w-6 h-6" />
//                                 <span>Today's Schedule</span>
//                             </Link>
//                         </Button>

//                         <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4" asChild>
//                             <Link to="/student/attendance">
//                                 <TrendingUp className="w-6 h-6" />
//                                 <span>Attendance</span>
//                             </Link>
//                         </Button>

//                         <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4" asChild>
//                             <Link to="/student/results">
//                                 <FileText className="w-6 h-6" />
//                                 <span>My Results</span>
//                             </Link>
//                         </Button>

//                         <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4" asChild>
//                             <Link to="/student/profile">
//                                 <User className="w-6 h-6" />
//                                 <span>Profile</span>
//                             </Link>
//                         </Button>
//                     </div>
//                 </CardContent>
//             </Card>
//         </div>
//     );
// }