// components/student/StudentDashboard.jsx
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetStudentDashboardQuery } from "@/features/apis/studentsApi";
import {
    AlertCircle,
    BookOpen,
    Calendar,
    Clock,
    FileText,
    TrendingUp,
    User,
    Wallet,
} from "lucide-react";
import { Link } from "react-router-dom";
import { formatBDT, formatDate } from "@/utils/formatCurrency";

export default function StudentDashboard() {
    const { data: dashboardData, isLoading, error } = useGetStudentDashboardQuery();

    if (isLoading) {
        return <div className="flex justify-center py-8">Loading dashboard…</div>;
    }

    if (error) {
        return (
            <div className="text-red-600 text-center py-8">
                {error?.data?.message || "Error loading dashboard"}
            </div>
        );
    }

    const { student, payments, attendance, assignments, results, session } =
        dashboardData?.dashboard || {};

    const paymentSummary = payments?.summary || {};
    const recentBills = payments?.recentBills || [];
    const recentPayments = payments?.recentPayments || [];
    // const attendanceStats = attendance?.stats || {};
    const recentAttendance = attendance?.recent || [];
    const attendanceStats = {
        totalRecords: recentAttendance.length,
        presentRecords: recentAttendance.filter(a => a.status === 'present').length,
        absentRecords: recentAttendance.filter(a => a.status === 'absent').length, // ← add
        lateRecords: recentAttendance.filter(a => a.status === 'late').length,
        halfDayRecords: recentAttendance.filter(a => a.status === 'half_day').length,
    };
    const todayAssignments = assignments?.today || [];
    const recentResults = results || [];

    const outstanding = Number(paymentSummary.totalOutstanding || 0);
    const advanceBalance = Number(paymentSummary.advanceBalance || 0);

    // Overdue assignments
    const overdueAssignments = todayAssignments.filter(
        (a) => new Date(a.dueDate) < new Date()
    );

    // Weighted attendance percentage
    const calculateWeightedAttendance = () => {
        const present = attendanceStats.presentRecords || 0;
        const late = attendanceStats.lateRecords || 0;
        const halfDay = attendanceStats.halfDayRecords || 0;
        const total = attendanceStats.totalRecords || 0;

        if (total === 0) return 0;

        const weightedScore = present + late * 0.5 + halfDay * 0.5;
        return Math.round((weightedScore / total) * 100);
    };

    const weightedAttendancePercentage = calculateWeightedAttendance();

    return (
        <div className="space-y-6">
            {/* Welcome Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">
                        Welcome back, {student?.name}!
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Roll Number: {student?.rollNumber} • Class:{" "}
                        {student?.class?.name || "Not assigned"}
                        {session ? ` • Session ${session}` : ""}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-gray-500">Today</p>
                    <p className="font-semibold">{formatDate(new Date())}</p>
                </div>
            </div>

            {outstanding > 0 && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-amber-600 font-bold">৳</span>
                        <span className="font-medium text-amber-800">
                            You have outstanding fees: {formatBDT(outstanding)}
                        </span>
                    </div>
                    <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                        <Link to="/student/payments/pay">Pay Now</Link>
                    </Button>
                </div>
            )}

            {/* Overdue assignments alert */}
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
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card>
                    <CardContent className="p-5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <BookOpen className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">
                                    {todayAssignments.length}
                                </p>
                                <p className="text-xs text-gray-600">
                                    Today's Assignments
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <Calendar className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">
                                    {recentBills.length}
                                </p>
                                <p className="text-xs text-gray-600">
                                    Recent Bills
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <TrendingUp className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">
                                    {weightedAttendancePercentage}%
                                </p>
                                <p className="text-xs text-gray-600">
                                    Attendance Rate
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <FileText className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">
                                    {attendanceStats.presentRecords || 0}/
                                    {attendanceStats.totalRecords || 0}
                                </p>
                                <p className="text-xs text-gray-600">
                                    Classes Attended
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 rounded-lg">
                                <span className="text-indigo-600 text-lg font-bold">
                                    ৳
                                </span>
                            </div>
                            <div>
                                <p className="text-2xl font-bold">
                                    {formatBDT(advanceBalance)}
                                </p>
                                <p className="text-xs text-gray-600">
                                    Advance Balance
                                </p>
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
                            <span className="text-lg font-bold">৳</span>
                            Payment Summary
                        </CardTitle>
                        <Badge variant={outstanding > 0 ? "destructive" : "outline"}>
                            {outstanding > 0 ? "Pending" : "Cleared"}
                        </Badge>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">
                                    Total Billed:
                                </span>
                                <span className="font-semibold">
                                    {formatBDT(paymentSummary.totalFee)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">
                                    Total Paid:
                                </span>
                                <span className="font-semibold text-green-600">
                                    {formatBDT(paymentSummary.totalPaid)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">
                                    Outstanding:
                                </span>
                                <span
                                    className={`font-semibold ${outstanding > 0
                                        ? "text-rose-600"
                                        : "text-gray-600"
                                        }`}
                                >
                                    {formatBDT(outstanding)}
                                </span>
                            </div>
                            <div className="flex justify-between pt-2 border-t">
                                <span className="text-sm text-gray-600">
                                    Advance:
                                </span>
                                <span className="font-semibold">
                                    {formatBDT(advanceBalance)}
                                </span>
                            </div>
                        </div>

                        {/* Recent Bills */}
                        {recentBills.length > 0 && (
                            <div className="mt-4">
                                <h4 className="font-semibold mb-2 text-sm">
                                    Recent Bills
                                </h4>
                                <div className="space-y-2">
                                    {recentBills.slice(0, 3).map((bill) => (
                                        <div
                                            key={bill.monthKey}
                                            className="flex justify-between items-center p-2 border rounded"
                                        >
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium truncate">
                                                    {bill.monthLabel}
                                                </p>
                                                <p className="text-xs text-gray-500 capitalize">
                                                    {bill.status}
                                                </p>
                                            </div>
                                            <Badge
                                                variant={
                                                    Number(bill.due) > 0
                                                        ? "destructive"
                                                        : "outline"
                                                }
                                            >
                                                {formatBDT(bill.due)}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Recent Payments */}
                        {recentPayments.length > 0 && (
                            <div className="mt-4">
                                <h4 className="font-semibold mb-2 text-sm">
                                    Recent Payments
                                </h4>
                                <div className="space-y-2">
                                    {recentPayments
                                        .slice(0, 3)
                                        .map((p) => (
                                            <div
                                                key={p._id}
                                                className="flex justify-between items-center p-2 border rounded text-sm"
                                            >
                                                <div className="min-w-0">
                                                    <p className="font-mono text-xs truncate">
                                                        {p.receiptNumber}
                                                    </p>
                                                    <p className="text-gray-500 text-xs">
                                                        {formatDate(p.createdAt)} •{" "}
                                                        {String(p.method).replace("_", " ")}
                                                    </p>
                                                </div>
                                                <Badge
                                                    variant="outline"
                                                    className="bg-green-50 text-green-700"
                                                >
                                                    {formatBDT(p.amount)}
                                                </Badge>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}

                        <Button variant="outline" className="w-full mt-4" asChild>
                            <Link to="/student/payments">
                                View Payment Details
                            </Link>
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
                                    <span className="font-semibold text-green-800">
                                        Present
                                    </span>
                                </div>
                                <p className="text-2xl font-bold text-green-600">
                                    {attendanceStats.presentRecords || 0}
                                </p>
                                <p className="text-sm text-gray-600">Classes</p>
                            </div>

                            <div className="text-center p-4 bg-red-50 rounded-lg">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <AlertCircle className="w-4 h-4 text-red-600" />
                                    <span className="font-semibold text-red-800">
                                        Absent
                                    </span>
                                </div>
                                <p className="text-2xl font-bold text-red-600">
                                    {attendanceStats.absentRecords || 0}
                                </p>
                                <p className="text-sm text-gray-600">Classes</p>
                            </div>

                            <div className="text-center p-4 bg-yellow-50 rounded-lg">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <Clock className="w-4 h-4 text-yellow-600" />
                                    <span className="font-semibold text-yellow-800">
                                        Late
                                    </span>
                                </div>
                                <p className="text-2xl font-bold text-yellow-600">
                                    {attendanceStats.lateRecords || 0}
                                </p>
                                <p className="text-sm text-gray-600">Classes</p>
                            </div>

                            <div className="text-center p-4 bg-orange-50 rounded-lg">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <Clock className="w-4 h-4 text-orange-600" />
                                    <span className="font-semibold text-orange-800">
                                        Half Day
                                    </span>
                                </div>
                                <p className="text-2xl font-bold text-orange-600">
                                    {attendanceStats.halfDayRecords || 0}
                                </p>
                                <p className="text-sm text-gray-600">Classes</p>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-4 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="font-medium">
                                    Overall Attendance Rate
                                </span>
                                <span className="font-bold">
                                    {weightedAttendancePercentage}%
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                                <div
                                    className={`h-3 rounded-full transition-all duration-500 ${weightedAttendancePercentage >= 90
                                        ? "bg-green-500"
                                        : weightedAttendancePercentage >= 75
                                            ? "bg-yellow-500"
                                            : "bg-red-500"
                                        }`}
                                    style={{ width: `${weightedAttendancePercentage}%` }}
                                ></div>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500">
                                <span>
                                    Total Classes:{" "}
                                    {attendanceStats.totalRecords || 0}
                                </span>
                                <span>
                                    {weightedAttendancePercentage >= 90
                                        ? "Excellent"
                                        : weightedAttendancePercentage >= 75
                                            ? "Good"
                                            : "Needs Improvement"}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Assignments + Results */}
                <div className="space-y-6">
                    {/* Today's Assignments */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <BookOpen className="w-5 h-5" />
                                Today's Assignments
                            </CardTitle>
                            <Badge variant="outline">
                                {todayAssignments.length}
                            </Badge>
                        </CardHeader>
                        <CardContent>
                            {todayAssignments.length === 0 ? (
                                <div className="text-center py-4 text-gray-500 text-sm">
                                    No assignments due today
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {todayAssignments.map((assignment) => {
                                        const isOverdue =
                                            new Date(assignment.dueDate) <
                                            new Date();
                                        return (
                                            <div
                                                key={assignment._id}
                                                className="flex items-center justify-between p-3 border rounded-lg"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-sm truncate">
                                                        {assignment.title}
                                                    </p>
                                                    <p className="text-xs text-gray-500 truncate">
                                                        {assignment.subject?.name}
                                                    </p>
                                                </div>
                                                <Badge
                                                    variant={
                                                        isOverdue
                                                            ? "destructive"
                                                            : "outline"
                                                    }
                                                >
                                                    {isOverdue
                                                        ? "Overdue"
                                                        : "Due Today"}
                                                </Badge>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            <Button
                                variant="outline"
                                className="w-full mt-4"
                                asChild
                            >
                                <Link to="/student/assignments">
                                    View All Assignments
                                </Link>
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
                                <div className="text-center py-4 text-gray-500 text-sm">
                                    No results available
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {recentResults.slice(0, 3).map((result) => (
                                        <div
                                            key={result._id}
                                            className="flex items-center justify-between p-3 border rounded-lg"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm truncate">
                                                    {result.exam?.title}
                                                </p>
                                                <p className="text-xs text-gray-500 truncate">
                                                    {result.subject?.name} •{" "}
                                                    {result.term} {result.year}
                                                </p>
                                            </div>
                                            <Badge variant="outline">
                                                {result.marksObtained}/
                                                {result.exam?.totalMarks}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <Button
                                variant="outline"
                                className="w-full mt-4"
                                asChild
                            >
                                <Link to="/student/results">
                                    View All Results
                                </Link>
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
                        <Button
                            variant="outline"
                            className="flex flex-col items-center gap-2 h-auto py-4"
                            asChild
                        >
                            <Link to="/student/schedule">
                                <Calendar className="w-6 h-6" />
                                <span>Today's Schedule</span>
                            </Link>
                        </Button>

                        <Button
                            variant="outline"
                            className="flex flex-col items-center gap-2 h-auto py-4"
                            asChild
                        >
                            <Link to="/student/attendance">
                                <TrendingUp className="w-6 h-6" />
                                <span>Attendance</span>
                            </Link>
                        </Button>

                        <Button
                            variant="outline"
                            className="flex flex-col items-center gap-2 h-auto py-4"
                            asChild
                        >
                            <Link to="/student/results">
                                <FileText className="w-6 h-6" />
                                <span>My Results</span>
                            </Link>
                        </Button>

                        <Button
                            variant="outline"
                            className="flex flex-col items-center gap-2 h-auto py-4"
                            asChild
                        >
                            <Link to="/student/payments/pay">
                                <Wallet className="w-6 h-6" />
                                <span>Pay Online</span>
                            </Link>
                        </Button>

                        <Button
                            variant="outline"
                            className="flex flex-col items-center gap-2 h-auto py-4"
                            asChild
                        >
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