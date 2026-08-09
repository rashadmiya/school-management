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
    const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
    const { data: dashboardData, isLoading, error } = useGetAdminDashboardQuery();

    // Theme-based classes
    const theme = {
        textPrimary: isDarkMode ? "text-white" : "text-gray-900",
        textSecondary: isDarkMode ? "text-gray-300" : "text-gray-700",
        textMuted: isDarkMode ? "text-gray-400" : "text-gray-500",
        textLight: isDarkMode ? "text-gray-500" : "text-gray-400",
        border: isDarkMode ? "border-gray-700" : "border-gray-200",
        bgCard: isDarkMode ? "bg-gray-900/50" : "bg-white",
        bgHover: isDarkMode ? "hover:bg-gray-800/50" : "hover:shadow-lg",
        bgInput: isDarkMode ? "bg-gray-800" : "bg-white",
        inputBorder: isDarkMode ? "border-gray-700" : "border-gray-200",
        cardIcon: {
            blue: isDarkMode ? "bg-blue-500/20 text-blue-400" : "bg-blue-100 text-blue-600",
            green: isDarkMode ? "bg-emerald-500/20 text-emerald-400" : "bg-green-100 text-green-600",
            purple: isDarkMode ? "bg-purple-500/20 text-purple-400" : "bg-purple-100 text-purple-600",
            orange: isDarkMode ? "bg-orange-500/20 text-orange-400" : "bg-orange-100 text-orange-600",
        },
        stat: {
            green: isDarkMode 
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                : "bg-green-50 text-green-800",
            red: isDarkMode 
                ? "bg-red-500/10 border-red-500/20 text-red-400" 
                : "bg-red-50 text-red-800",
        },
        alert: {
            yellow: isDarkMode 
                ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400" 
                : "bg-yellow-50 border-yellow-200 text-yellow-800",
            blue: isDarkMode 
                ? "bg-blue-500/10 border-blue-500/20 text-blue-400" 
                : "bg-blue-50 border-blue-200 text-blue-800",
            green: isDarkMode 
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                : "bg-green-50 border-green-200 text-green-800",
            gray: isDarkMode 
                ? "bg-gray-800/50 border-gray-700 text-gray-300" 
                : "bg-gray-50 border-gray-200 text-gray-800",
        },
        paymentItem: isDarkMode 
            ? "border-gray-700" 
            : "border-gray-200",
        progress: {
            bg: isDarkMode ? "bg-gray-700" : "bg-gray-200",
            green: "bg-emerald-500",
            red: "bg-red-500",
            yellow: "bg-yellow-500",
            orange: "bg-orange-500",
        },
        button: {
            outline: isDarkMode 
                ? "border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white" 
                : "border-gray-200 text-gray-700 hover:bg-gray-50",
            primary: isDarkMode 
                ? "bg-blue-600 hover:bg-blue-700 text-white" 
                : "bg-blue-600 hover:bg-blue-700 text-white",
        },
        portalCard: isDarkMode 
            ? "bg-gray-800/50 border-gray-700 hover:border-gray-600" 
            : "bg-white border-gray-200 hover:shadow-lg",
        loading: isDarkMode ? "border-blue-400" : "border-blue-600",
    };

    if (isLoading) {
        return (
            <div className={`flex items-center justify-center min-h-96 ${isDarkMode ? "text-gray-400" : ""}`}>
                <div className="text-center">
                    <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${theme.loading} mx-auto`}></div>
                    <p className={`mt-4 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`flex items-center justify-center min-h-96 ${isDarkMode ? "text-red-400" : "text-red-600"}`}>
                <div className="text-center">
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
        <div className={`space-y-6 ${isDarkMode ? "text-white" : ""}`}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className={`text-3xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                        School Overview
                    </h1>
                    <p className={`mt-2 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                        Welcome back, {user.user?.name}. Here's your school's performance summary.
                    </p>
                </div>
                <div className="text-right">
                    <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Today</p>
                    <p className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                        {new Date().toLocaleDateString()}
                    </p>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-sm`}>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-lg border ${theme.cardIcon.blue}`}>
                                <Users className="w-6 h-6" />
                            </div>
                            <div>
                                <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                                    {dashboard.totalStudents || 0}
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
                            <div className={`p-3 rounded-lg border ${theme.cardIcon.green}`}>
                                <GraduationCap className="w-6 h-6" />
                            </div>
                            <div>
                                <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                                    {dashboard.totalTeachers || 0}
                                </p>
                                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                                    Teachers
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-sm`}>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-lg border ${theme.cardIcon.purple}`}>
                                <BookOpen className="w-6 h-6" />
                            </div>
                            <div>
                                <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                                    {dashboard.totalClasses || 0}
                                </p>
                                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                                    Classes
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
                                    {dashboard.attendanceRate || 0}%
                                </p>
                                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                                    Attendance Rate
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Financial & Today's Attendance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Financial Overview */}
                <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-sm`}>
                    <CardHeader>
                        <CardTitle className={`flex items-center gap-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                            <DollarSign className="w-5 h-5" />
                            Financial Overview
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className={`flex justify-between items-center p-3 rounded-lg border ${theme.stat.green}`}>
                                <div>
                                    <p className={`font-semibold ${isDarkMode ? "text-emerald-400" : "text-green-800"}`}>
                                        Monthly Revenue
                                    </p>
                                    <p className={`text-sm ${isDarkMode ? "text-emerald-400/80" : "text-green-600"}`}>
                                        This month
                                    </p>
                                </div>
                                <p className={`text-2xl font-bold ${isDarkMode ? "text-emerald-400" : "text-green-800"}`}>
                                    ${(dashboard.financial?.monthlyRevenue || 0).toLocaleString()}
                                </p>
                            </div>

                            <div className={`flex justify-between items-center p-3 rounded-lg border ${theme.stat.red}`}>
                                <div>
                                    <p className={`font-semibold ${isDarkMode ? "text-red-400" : "text-red-800"}`}>
                                        Pending Fees
                                    </p>
                                    <p className={`text-sm ${isDarkMode ? "text-red-400/80" : "text-red-600"}`}>
                                        To be collected
                                    </p>
                                </div>
                                <p className={`text-2xl font-bold ${isDarkMode ? "text-red-400" : "text-red-800"}`}>
                                    ${(dashboard.financial?.pendingFees || 0).toLocaleString()}
                                </p>
                            </div>
                        </div>

                        {/* Recent Payments */}
                        {dashboard.recentPayments && dashboard.recentPayments.length > 0 && (
                            <div className="mt-6">
                                <h4 className={`font-semibold mb-3 text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                                    Recent Payments
                                </h4>
                                <div className="space-y-2">
                                    {dashboard.recentPayments.slice(0, 3).map((payment) => (
                                        <div key={payment._id} className={`flex justify-between items-center text-sm p-2 border rounded ${theme.paymentItem}`}>
                                            <div>
                                                <p className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                                                    {payment.student.name}
                                                </p>
                                                <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                                                    {payment.class.name}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className={`font-bold ${isDarkMode ? "text-emerald-400" : "text-green-600"}`}>
                                                    ${payment.paidAmount}
                                                </p>
                                                <Badge variant="outline" className={`text-xs ${isDarkMode ? "border-gray-700 text-gray-300" : ""}`}>
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
                <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-sm`}>
                    <CardHeader>
                        <CardTitle className={`flex items-center gap-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                            <Calendar className="w-5 h-5" />
                            Today's Attendance
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Present</span>
                                <div className="flex items-center gap-2">
                                    <span className={`font-bold ${isDarkMode ? "text-emerald-400" : "text-green-600"}`}>
                                        {dashboard.todayAttendance?.present || 0}
                                    </span>
                                    <div className={`w-20 ${theme.progress.bg} rounded-full h-2`}>
                                        <div 
                                            className={`${theme.progress.green} h-2 rounded-full transition-all duration-500`}
                                            style={{ width: `${getPercentage(dashboard.todayAttendance?.present || 0)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Absent</span>
                                <div className="flex items-center gap-2">
                                    <span className={`font-bold ${isDarkMode ? "text-red-400" : "text-red-600"}`}>
                                        {dashboard.todayAttendance?.absent || 0}
                                    </span>
                                    <div className={`w-20 ${theme.progress.bg} rounded-full h-2`}>
                                        <div 
                                            className={`${theme.progress.red} h-2 rounded-full transition-all duration-500`}
                                            style={{ width: `${getPercentage(dashboard.todayAttendance?.absent || 0)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Late</span>
                                <div className="flex items-center gap-2">
                                    <span className={`font-bold ${isDarkMode ? "text-yellow-400" : "text-yellow-600"}`}>
                                        {dashboard.todayAttendance?.late || 0}
                                    </span>
                                    <div className={`w-20 ${theme.progress.bg} rounded-full h-2`}>
                                        <div 
                                            className={`${theme.progress.yellow} h-2 rounded-full transition-all duration-500`}
                                            style={{ width: `${getPercentage(dashboard.todayAttendance?.late || 0)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Half Day</span>
                                <div className="flex items-center gap-2">
                                    <span className={`font-bold ${isDarkMode ? "text-orange-400" : "text-orange-600"}`}>
                                        {dashboard.todayAttendance?.half_day || 0}
                                    </span>
                                    <div className={`w-20 ${theme.progress.bg} rounded-full h-2`}>
                                        <div 
                                            className={`${theme.progress.orange} h-2 rounded-full transition-all duration-500`}
                                            style={{ width: `${getPercentage(dashboard.todayAttendance?.half_day || 0)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            {/* Total Summary */}
                            <div className={`pt-3 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                                <div className={`flex justify-between items-center text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                                    <span className="font-medium">Total Records Today:</span>
                                    <span className={`font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                                        {totalTodayAttendance}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Alerts & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Alerts */}
                <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-sm`}>
                    <CardHeader>
                        <CardTitle className={`flex items-center gap-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                            <AlertCircle className="w-5 h-5" />
                            Important Alerts
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {(dashboard.alerts?.lowAttendanceClasses || 0) > 0 && (
                                <div className={`p-3 border rounded-lg ${theme.alert.yellow}`}>
                                    <div className="flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4" />
                                        <span className="font-medium">
                                            {dashboard.alerts.lowAttendanceClasses} classes have low attendance (&lt;75%)
                                        </span>
                                    </div>
                                </div>
                            )}

                            {(dashboard.alerts?.upcomingEvents || 0) > 0 && (
                                <div className={`p-3 border rounded-lg ${theme.alert.blue}`}>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        <span className="font-medium">
                                            {dashboard.alerts.upcomingEvents} upcoming events this week
                                        </span>
                                    </div>
                                </div>
                            )}

                            {dashboard.alerts?.feeCollection && (
                                <div className={`p-3 border rounded-lg ${theme.alert.green}`}>
                                    <div className="flex items-center gap-2">
                                        <DollarSign className="w-4 h-4" />
                                        <span className="font-medium">
                                            ${(dashboard.financial?.pendingFees || 0).toLocaleString()} in pending fees
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Default alert if no specific alerts */}
                            {(!dashboard.alerts?.lowAttendanceClasses && !dashboard.alerts?.upcomingEvents && !dashboard.alerts?.feeCollection) && (
                                <div className={`p-3 border rounded-lg ${theme.alert.gray}`}>
                                    <div className="flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4" />
                                        <span className="font-medium">
                                            All systems operational. No critical alerts.
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-sm`}>
                    <CardHeader>
                        <CardTitle className={isDarkMode ? "text-white" : "text-gray-900"}>
                            Quick Actions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                            <Button variant="outline" className={`flex flex-col items-center gap-2 h-auto py-4 ${theme.button.outline}`}
                                onClick={() => navigate("/admin/students")}>
                                <Users className="w-6 h-6" />
                                <span>Manage Students</span>
                            </Button>

                            <Button variant="outline" className={`flex flex-col items-center gap-2 h-auto py-4 ${theme.button.outline}`}
                                onClick={() => navigate("/admin/teachers")}>
                                <GraduationCap className="w-6 h-6" />
                                <span>Manage Teachers</span>
                            </Button>

                            <Button variant="outline" className={`flex flex-col items-center gap-2 h-auto py-4 ${theme.button.outline}`}
                                onClick={() => navigate("/admin/attendances")}>
                                <BarChart3 className="w-6 h-6" />
                                <span>View Reports</span>
                            </Button>

                            <Button variant="outline" className={`flex flex-col items-center gap-2 h-auto py-4 ${theme.button.outline}`}
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
                <Card className={`cursor-pointer transition-all ${theme.portalCard}`}>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-lg border ${theme.cardIcon.blue}`}>
                                <Users className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                                    Teacher Portal
                                </h3>
                                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                                    Access your teaching dashboard
                                </p>
                            </div>
                        </div>
                        <Button className={`w-full mt-4 ${theme.button.primary}`} onClick={() => navigate("/teacher")}>
                            Go to Teacher Portal
                        </Button>
                    </CardContent>
                </Card>

                {/* Student Portal Card */}
                <Card className={`cursor-pointer transition-all ${theme.portalCard}`}>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-lg border ${theme.cardIcon.green}`}>
                                <GraduationCap className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                                    Student Portal
                                </h3>
                                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                                    View student dashboard
                                </p>
                            </div>
                        </div>
                        <Button className={`w-full mt-4 ${theme.button.primary}`} onClick={() => navigate("/student")}>
                            Go to Student Portal
                        </Button>
                    </CardContent>
                </Card>

                {/* Parent Portal Card */}
                <Card className={`cursor-pointer transition-all ${theme.portalCard}`}>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-lg border ${theme.cardIcon.purple}`}>
                                <Users className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                                    Parent Portal
                                </h3>
                                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                                    Monitor children's progress
                                </p>
                            </div>
                        </div>
                        <Button className={`w-full mt-4 ${theme.button.primary}`} onClick={() => navigate("/parent")}>
                            Go to Parent Portal
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default Dashboard