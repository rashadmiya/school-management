// components/Dashboard.jsx
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAppSelector } from '@/features/store'
import { Users, BookOpen, GraduationCap, TrendingUp, Calendar, DollarSign, AlertCircle, BarChart3 } from 'lucide-react'
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useGetAdminDashboardQuery } from '@/features/apis/api'

const Dashboard = () => {
    const navigate = useNavigate();
    const user = useAppSelector((state) => state.user);
    const { data: dashboardData, isLoading, error } = useGetAdminDashboardQuery();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <div className="text-center text-red-600">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4" />
                    <p>Failed to load dashboard data</p>
                </div>
            </div>
        );
    }

    const dashboard = dashboardData?.dashboard || {};

    // Calculate percentages for today's attendance progress bars
    const totalTodayAttendance = Object.values(dashboard.todayAttendance || {}).reduce((sum, count) => sum + count, 0);
    const getPercentage = (count) => totalTodayAttendance > 0 ? (count / totalTodayAttendance) * 100 : 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">School Overview</h1>
                    <p className="text-gray-600 mt-2">Welcome back, {user.user?.name}. Here's your school's performance summary.</p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-gray-500">Today</p>
                    <p className="font-semibold">{new Date().toLocaleDateString()}</p>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <Users className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{dashboard.totalStudents || 0}</p>
                                <p className="text-sm text-gray-600">Total Students</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <GraduationCap className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{dashboard.totalTeachers || 0}</p>
                                <p className="text-sm text-gray-600">Teachers</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <BookOpen className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{dashboard.totalClasses || 0}</p>
                                <p className="text-sm text-gray-600">Classes</p>
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
                                <p className="text-2xl font-bold">{dashboard.attendanceRate || 0}%</p>
                                <p className="text-sm text-gray-600">Attendance Rate</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Financial & Today's Attendance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Financial Overview */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <DollarSign className="w-5 h-5" />
                            Financial Overview
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                                <div>
                                    <p className="font-semibold text-green-800">Monthly Revenue</p>
                                    <p className="text-sm text-green-600">This month</p>
                                </div>
                                <p className="text-2xl font-bold text-green-800">
                                    ${(dashboard.financial?.monthlyRevenue || 0).toLocaleString()}
                                </p>
                            </div>

                            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                                <div>
                                    <p className="font-semibold text-red-800">Pending Fees</p>
                                    <p className="text-sm text-red-600">To be collected</p>
                                </div>
                                <p className="text-2xl font-bold text-red-800">
                                    ${(dashboard.financial?.pendingFees || 0).toLocaleString()}
                                </p>
                            </div>
                        </div>

                        {/* Recent Payments */}
                        {dashboard.recentPayments && dashboard.recentPayments.length > 0 && (
                            <div className="mt-6">
                                <h4 className="font-semibold mb-3 text-sm text-gray-700">Recent Payments</h4>
                                <div className="space-y-2">
                                    {dashboard.recentPayments.slice(0, 3).map((payment) => (
                                        <div key={payment._id} className="flex justify-between items-center text-sm p-2 border rounded">
                                            <div>
                                                <p className="font-medium">{payment.student.name}</p>
                                                <p className="text-gray-500 text-xs">{payment.class.name}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-green-600">${payment.paidAmount}</p>
                                                <Badge variant="outline" className="text-xs">
                                                    {payment.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Today's Attendance */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="w-5 h-5" />
                            Today's Attendance
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm">Present</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-green-600">
                                        {dashboard.todayAttendance?.present || 0}
                                    </span>
                                    <div className="w-20 bg-gray-200 rounded-full h-2">
                                        <div 
                                            className="bg-green-500 h-2 rounded-full transition-all duration-500"
                                            style={{ width: `${getPercentage(dashboard.todayAttendance?.present || 0)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-sm">Absent</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-red-600">
                                        {dashboard.todayAttendance?.absent || 0}
                                    </span>
                                    <div className="w-20 bg-gray-200 rounded-full h-2">
                                        <div 
                                            className="bg-red-500 h-2 rounded-full transition-all duration-500"
                                            style={{ width: `${getPercentage(dashboard.todayAttendance?.absent || 0)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-sm">Late</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-yellow-600">
                                        {dashboard.todayAttendance?.late || 0}
                                    </span>
                                    <div className="w-20 bg-gray-200 rounded-full h-2">
                                        <div 
                                            className="bg-yellow-500 h-2 rounded-full transition-all duration-500"
                                            style={{ width: `${getPercentage(dashboard.todayAttendance?.late || 0)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-sm">Half Day</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-orange-600">
                                        {dashboard.todayAttendance?.half_day || 0}
                                    </span>
                                    <div className="w-20 bg-gray-200 rounded-full h-2">
                                        <div 
                                            className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                                            style={{ width: `${getPercentage(dashboard.todayAttendance?.half_day || 0)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            {/* Total Summary */}
                            <div className="pt-3 border-t">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-medium">Total Records Today:</span>
                                    <span className="font-bold">{totalTodayAttendance}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Alerts & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Alerts */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" />
                            Important Alerts
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {(dashboard.alerts?.lowAttendanceClasses || 0) > 0 && (
                                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 text-yellow-600" />
                                        <span className="font-medium text-yellow-800">
                                            {dashboard.alerts.lowAttendanceClasses} classes have low attendance (&lt;75%)
                                        </span>
                                    </div>
                                </div>
                            )}

                            {(dashboard.alerts?.upcomingEvents || 0) > 0 && (
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-blue-600" />
                                        <span className="font-medium text-blue-800">
                                            {dashboard.alerts.upcomingEvents} upcoming events this week
                                        </span>
                                    </div>
                                </div>
                            )}

                            {dashboard.alerts?.feeCollection && (
                                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <DollarSign className="w-4 h-4 text-green-600" />
                                        <span className="font-medium text-green-800">
                                            ${(dashboard.financial?.pendingFees || 0).toLocaleString()} in pending fees
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Default alert if no specific alerts */}
                            {(!dashboard.alerts?.lowAttendanceClasses && !dashboard.alerts?.upcomingEvents && !dashboard.alerts?.feeCollection) && (
                                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 text-gray-600" />
                                        <span className="font-medium text-gray-800">
                                            All systems operational. No critical alerts.
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                            <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4"
                                onClick={() => navigate("/admin/students")}>
                                <Users className="w-6 h-6" />
                                <span>Manage Students</span>
                            </Button>

                            <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4"
                                onClick={() => navigate("/admin/teachers")}>
                                <GraduationCap className="w-6 h-6" />
                                <span>Manage Teachers</span>
                            </Button>

                            <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4"
                                onClick={() => navigate("/admin/attendances")}>
                                <BarChart3 className="w-6 h-6" />
                                <span>View Reports</span>
                            </Button>

                            <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4"
                                onClick={() => navigate("/finance")}>
                                <DollarSign className="w-6 h-6" />
                                <span>Finance</span>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Portal Access Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Teacher Portal Card */}
                <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <Users className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Teacher Portal</h3>
                                <p className="text-sm text-gray-600">Access your teaching dashboard</p>
                            </div>
                        </div>
                        <Button className="w-full mt-4" onClick={() => navigate("/teacher")}>
                            Go to Teacher Portal
                        </Button>
                    </CardContent>
                </Card>

                {/* Student Portal Card */}
                <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <GraduationCap className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Student Portal</h3>
                                <p className="text-sm text-gray-600">View student dashboard</p>
                            </div>
                        </div>
                        <Button className="w-full mt-4" onClick={() => navigate("/student")}>
                            Go to Student Portal
                        </Button>
                    </CardContent>
                </Card>

                {/* Parent Portal Card */}
                <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <Users className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Parent Portal</h3>
                                <p className="text-sm text-gray-600">Monitor children's progress</p>
                            </div>
                        </div>
                        <Button className="w-full mt-4" onClick={() => navigate("/parent")}>
                            Go to Parent Portal
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default Dashboard

// import { Button } from '@/components/ui/button'
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
// import { useAppSelector } from '@/features/store'
// import { Users, BookOpen, GraduationCap, TrendingUp, Calendar, DollarSign, AlertCircle, BarChart3 } from 'lucide-react'
// import React from 'react'
// import { useNavigate } from 'react-router-dom'
// // In your main Dashboard component, add finance cards:
// // import { useGetPaymentsSummaryQuery } from "@/features/apis/financeApi";

// const Dashboard = () => {
//     const navigate = useNavigate();
//     const user = useAppSelector((state) => state.user);

//     // Inside your Dashboard component:
//     // const { data: financeData } = useGetPaymentsSummaryQuery();
//     let financeData = null; // Placeholder
    
//     // Mock data - replace with actual API calls
//     const dashboardData = {
//         totalStudents: 1247,
//         totalTeachers: 48,
//         totalClasses: 36,
//         totalSubjects: 12,
//         monthlyRevenue: 125000,
//         attendanceRate: 94.2,
//         pendingFees: 23450,
//         upcomingEvents: 3,
//         lowAttendanceClasses: 2,
//         todayAttendance: {
//             present: 1150,
//             absent: 67,
//             late: 25,
//             halfDay: 5
//         }
//     };

//     return (
//         <div className="space-y-6">
//             {/* Header */}
//             <div className="flex justify-between items-center">
//                 <div>
//                     <h1 className="text-3xl font-bold">School Overview</h1>
//                     <p className="text-gray-600 mt-2">Welcome back, {user.user?.name}. Here's your school's performance summary.</p>
//                 </div>
//                 <div className="text-right">
//                     <p className="text-sm text-gray-500">Today</p>
//                     <p className="font-semibold">{new Date().toLocaleDateString()}</p>
//                 </div>
//             </div>

//             {/* Key Metrics */}
//             <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
//                 <Card>
//                     <CardContent className="p-6">
//                         <div className="flex items-center gap-4">
//                             <div className="p-3 bg-blue-100 rounded-lg">
//                                 <Users className="w-6 h-6 text-blue-600" />
//                             </div>
//                             <div>
//                                 <p className="text-2xl font-bold">{dashboardData.totalStudents}</p>
//                                 <p className="text-sm text-gray-600">Total Students</p>
//                             </div>
//                         </div>
//                     </CardContent>
//                 </Card>

//                 <Card>
//                     <CardContent className="p-6">
//                         <div className="flex items-center gap-4">
//                             <div className="p-3 bg-green-100 rounded-lg">
//                                 <GraduationCap className="w-6 h-6 text-green-600" />
//                             </div>
//                             <div>
//                                 <p className="text-2xl font-bold">{dashboardData.totalTeachers}</p>
//                                 <p className="text-sm text-gray-600">Teachers</p>
//                             </div>
//                         </div>
//                     </CardContent>
//                 </Card>

//                 <Card>
//                     <CardContent className="p-6">
//                         <div className="flex items-center gap-4">
//                             <div className="p-3 bg-purple-100 rounded-lg">
//                                 <BookOpen className="w-6 h-6 text-purple-600" />
//                             </div>
//                             <div>
//                                 <p className="text-2xl font-bold">{dashboardData.totalClasses}</p>
//                                 <p className="text-sm text-gray-600">Classes</p>
//                             </div>
//                         </div>
//                     </CardContent>
//                 </Card>

//                 <Card>
//                     <CardContent className="p-6">
//                         <div className="flex items-center gap-4">
//                             <div className="p-3 bg-orange-100 rounded-lg">
//                                 <TrendingUp className="w-6 h-6 text-orange-600" />
//                             </div>
//                             <div>
//                                 <p className="text-2xl font-bold">{dashboardData.attendanceRate}%</p>
//                                 <p className="text-sm text-gray-600">Attendance Rate</p>
//                             </div>
//                         </div>
//                     </CardContent>
//                 </Card>
//             </div>

//             {/* Financial & Today's Attendance */}
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//                 {/* Financial Overview */}
//                 <Card>
//                     <CardHeader>
//                         <CardTitle className="flex items-center gap-2">
//                             <DollarSign className="w-5 h-5" />
//                             Financial Overview
//                         </CardTitle>
//                     </CardHeader>
//                     <CardContent>
//                         <div className="space-y-4">
//                             <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
//                                 <div>
//                                     <p className="font-semibold text-green-800">Monthly Revenue</p>
//                                     <p className="text-sm text-green-600">This month</p>
//                                 </div>
//                                 <p className="text-2xl font-bold text-green-800">
//                                     ${financeData?.summary?.monthlyRevenue?.toLocaleString() || 0}
//                                 </p>
//                             </div>

//                             <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
//                                 <div>
//                                     <p className="font-semibold text-red-800">Pending Fees</p>
//                                     <p className="text-sm text-red-600">To be collected</p>
//                                 </div>
//                                 <p className="text-2xl font-bold text-red-800">
//                                     ${financeData?.summary?.pendingFees?.toLocaleString() || 0}
//                                 </p>
//                             </div>
//                         </div>
//                     </CardContent>

//                     {/* <CardContent className="p-6">
//                         <div className="flex items-center gap-4">
//                             <div className="p-3 bg-green-100 rounded-lg">
//                                 <DollarSign className="w-6 h-6 text-green-600" />
//                             </div>
//                             <div>
//                                 <p className="text-2xl font-bold">
//                                     ${financeData?.summary?.monthlyRevenue?.toLocaleString() || 0}
//                                 </p>
//                                 <p className="text-sm text-gray-600">Monthly Revenue</p>
//                             </div>
//                         </div>
//                     </CardContent> */}

//                 </Card>

//                 {/* Today's Attendance */}
//                 <Card>
//                     <CardHeader>
//                         <CardTitle className="flex items-center gap-2">
//                             <Calendar className="w-5 h-5" />
//                             Today's Attendance
//                         </CardTitle>
//                     </CardHeader>
//                     <CardContent>
//                         <div className="space-y-3">
//                             <div className="flex justify-between items-center">
//                                 <span className="text-sm">Present</span>
//                                 <div className="flex items-center gap-2">
//                                     <span className="font-bold text-green-600">{dashboardData.todayAttendance.present}</span>
//                                     <div className="w-20 bg-gray-200 rounded-full h-2">
//                                         <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }}></div>
//                                     </div>
//                                 </div>
//                             </div>

//                             <div className="flex justify-between items-center">
//                                 <span className="text-sm">Absent</span>
//                                 <div className="flex items-center gap-2">
//                                     <span className="font-bold text-red-600">{dashboardData.todayAttendance.absent}</span>
//                                     <div className="w-20 bg-gray-200 rounded-full h-2">
//                                         <div className="bg-red-500 h-2 rounded-full" style={{ width: '5%' }}></div>
//                                     </div>
//                                 </div>
//                             </div>

//                             <div className="flex justify-between items-center">
//                                 <span className="text-sm">Late</span>
//                                 <div className="flex items-center gap-2">
//                                     <span className="font-bold text-yellow-600">{dashboardData.todayAttendance.late}</span>
//                                     <div className="w-20 bg-gray-200 rounded-full h-2">
//                                         <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '2%' }}></div>
//                                     </div>
//                                 </div>
//                             </div>

//                             <div className="flex justify-between items-center">
//                                 <span className="text-sm">Half Day</span>
//                                 <div className="flex items-center gap-2">
//                                     <span className="font-bold text-orange-600">{dashboardData.todayAttendance.halfDay}</span>
//                                     <div className="w-20 bg-gray-200 rounded-full h-2">
//                                         <div className="bg-orange-500 h-2 rounded-full" style={{ width: '0.5%' }}></div>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
//                     </CardContent>
//                 </Card>
//             </div>

//             {/* Alerts & Quick Actions */}
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//                 {/* Alerts */}
//                 <Card>
//                     <CardHeader>
//                         <CardTitle className="flex items-center gap-2">
//                             <AlertCircle className="w-5 h-5" />
//                             Important Alerts
//                         </CardTitle>
//                     </CardHeader>
//                     <CardContent>
//                         <div className="space-y-3">
//                             {dashboardData.lowAttendanceClasses > 0 && (
//                                 <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
//                                     <div className="flex items-center gap-2">
//                                         <AlertCircle className="w-4 h-4 text-yellow-600" />
//                                         <span className="font-medium text-yellow-800">
//                                             {dashboardData.lowAttendanceClasses} classes have low attendance
//                                         </span>
//                                     </div>
//                                 </div>
//                             )}

//                             <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
//                                 <div className="flex items-center gap-2">
//                                     <Calendar className="w-4 h-4 text-blue-600" />
//                                     <span className="font-medium text-blue-800">
//                                         {dashboardData.upcomingEvents} upcoming events this week
//                                     </span>
//                                 </div>
//                             </div>

//                             <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
//                                 <div className="flex items-center gap-2">
//                                     <DollarSign className="w-4 h-4 text-green-600" />
//                                     <span className="font-medium text-green-800">
//                                         Fee collection drive starts next week
//                                     </span>
//                                 </div>
//                             </div>
//                         </div>
//                     </CardContent>
//                 </Card>

//                 {/* Quick Actions */}
//                 <Card>
//                     <CardHeader>
//                         <CardTitle>Quick Actions</CardTitle>
//                     </CardHeader>
//                     <CardContent>
//                         <div className="grid grid-cols-2 gap-4">
//                             <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4"
//                                 onClick={() => navigate("/students")}>
//                                 <Users className="w-6 h-6" />
//                                 <span>Manage Students</span>
//                             </Button>

//                             <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4"
//                                 onClick={() => navigate("/teachers")}>
//                                 <GraduationCap className="w-6 h-6" />
//                                 <span>Manage Teachers</span>
//                             </Button>

//                             <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4"
//                                 onClick={() => navigate("/attendances")}>
//                                 <BarChart3 className="w-6 h-6" />
//                                 <span>View Reports</span>
//                             </Button>

//                             <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4"
//                                 onClick={() => navigate("/finance")}>
//                                 <DollarSign className="w-6 h-6" />
//                                 <span>Finance</span>
//                             </Button>
//                         </div>
//                     </CardContent>
//                 </Card>
//             </div>

//             {/* Portal Access Cards */}
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//                 {/* Teacher Portal Card */}
//                 <Card className="cursor-pointer hover:shadow-lg transition-shadow">
//                     <CardContent className="p-6">
//                         <div className="flex items-center gap-4">
//                             <div className="p-3 bg-blue-100 rounded-lg">
//                                 <Users className="w-6 h-6 text-blue-600" />
//                             </div>
//                             <div>
//                                 <h3 className="font-semibold">Teacher Portal</h3>
//                                 <p className="text-sm text-gray-600">Access your teaching dashboard</p>
//                             </div>
//                         </div>
//                         <Button className="w-full mt-4" onClick={() => navigate("/teacher")}>
//                             Go to Teacher Portal
//                         </Button>
//                     </CardContent>
//                 </Card>

//                 {/* Student Portal Card */}
//                 <Card className="cursor-pointer hover:shadow-lg transition-shadow">
//                     <CardContent className="p-6">
//                         <div className="flex items-center gap-4">
//                             <div className="p-3 bg-green-100 rounded-lg">
//                                 <GraduationCap className="w-6 h-6 text-green-600" />
//                             </div>
//                             <div>
//                                 <h3 className="font-semibold">Student Portal</h3>
//                                 <p className="text-sm text-gray-600">View student dashboard</p>
//                             </div>
//                         </div>
//                         <Button className="w-full mt-4" onClick={() => navigate("/student")}>
//                             Go to Student Portal
//                         </Button>
//                     </CardContent>
//                 </Card>

//                 {/* Parent Portal Card */}
//                 <Card className="cursor-pointer hover:shadow-lg transition-shadow">
//                     <CardContent className="p-6">
//                         <div className="flex items-center gap-4">
//                             <div className="p-3 bg-purple-100 rounded-lg">
//                                 <Users className="w-6 h-6 text-purple-600" />
//                             </div>
//                             <div>
//                                 <h3 className="font-semibold">Parent Portal</h3>
//                                 <p className="text-sm text-gray-600">Monitor children's progress</p>
//                             </div>
//                         </div>
//                         <Button className="w-full mt-4" onClick={() => navigate("/parent")}>
//                             Go to Parent Portal
//                         </Button>
//                     </CardContent>
//                 </Card>
//             </div>
//         </div>
//     )
// }

// export default Dashboard