// components/parent/ParentDashboard.jsx
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    useGetMyDashboardQuery,
    useGetChildrenAttendanceQuery,
    useGetChildrenResultsQuery,
} from "@/features/apis/parentPortalApi";
import { useAppSelector } from "@/features/store";
import {
    BookOpen, Calendar, TrendingUp, User, Users, Wallet,
} from "lucide-react";
import { Link } from "react-router-dom";
import { formatBDT, formatDate } from "@/utils/formatCurrency";

export default function ParentDashboard() {
    const { parent } = useAppSelector((s) => s.parentAuth);

    const {
        data: dashData,
        isLoading: dashLoading,
    } = useGetMyDashboardQuery();

    const {
        data: attData,
        isLoading: attLoading,
    } = useGetChildrenAttendanceQuery();

    const {
        data: resData,
        isLoading: resLoading,
    } = useGetChildrenResultsQuery();

    if (dashLoading) {
        return (
            <Card>
                <CardContent className="p-10 text-center text-gray-500">
                    Loading dashboard…
                </CardContent>
            </Card>
        );
    }

    const {
        children = [],
        summary = {},
        recentPayments = [],
    } = dashData || {};

    const attendanceStats = attData?.stats || {};
    const recentAttendance = attData?.records || [];
    const recentResults = resData?.results || [];
    const resultsStats = resData?.stats || {};

    const outstanding = Number(summary.totalOutstanding || 0);

    // Weighted average attendance across all children
    const overallAttendance = children.length > 0
        ? Math.round(
            children.reduce(
                (sum, c) => sum + (attendanceStats[String(c._id)]?.attendancePercentage || 0),
                0
            ) / children.length
        )
        : 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">
                        Welcome, {parent?.name || "Parent"}!
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Monitor your children's academic progress and payments
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-gray-500">Today</p>
                    <p className="font-semibold">{formatDate(new Date())}</p>
                </div>
            </div>

            {/* Outstanding alert */}
            {outstanding > 0 && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
                    <Wallet className="w-5 h-5 text-amber-600" />
                    <span className="font-medium text-amber-900">
                        Total Outstanding: {formatBDT(outstanding)}
                    </span>
                </div>
            )}

            {/* KPI row */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card>
                    <CardContent className="p-5 flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{children.length}</p>
                            <p className="text-sm text-gray-600">Children</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-5 flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">
                                {children.filter(c => c.class).length}
                            </p>
                            <p className="text-sm text-gray-600">In School</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-5 flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">
                                {attLoading ? "…" : `${overallAttendance}%`}
                            </p>
                            <p className="text-sm text-gray-600">Avg Attendance</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-5 flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <Calendar className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">
                                {attLoading ? "…" : recentAttendance.length}
                            </p>
                            <p className="text-sm text-gray-600">Records (30d)</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-5 flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <Wallet className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">
                                {summary.collectionRate || 0}%
                            </p>
                            <p className="text-sm text-gray-600">Payment Rate</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Payment summary */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Payment Summary</CardTitle>
                        <Badge variant={outstanding > 0 ? "destructive" : "default"}>
                            {outstanding > 0 ? "Pending" : "Cleared"}
                        </Badge>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3 mb-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Total Billed:</span>
                                <span className="font-semibold">{formatBDT(summary.totalFee)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Total Paid:</span>
                                <span className="font-semibold text-green-600">
                                    {formatBDT(summary.totalPaid)}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Outstanding:</span>
                                <span className={`font-semibold ${outstanding > 0 ? "text-rose-600" : "text-gray-600"}`}>
                                    {formatBDT(outstanding)}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm pt-2 border-t">
                                <span className="text-gray-600">Collection Rate:</span>
                                <span className="font-semibold">
                                    {summary.collectionRate || 0}%
                                </span>
                            </div>
                        </div>

                        {recentPayments.length > 0 && (
                            <div className="mt-4">
                                <h4 className="font-semibold mb-2 text-sm">Recent Payments</h4>
                                <div className="space-y-2">
                                    {recentPayments.slice(0, 3).map((p) => (
                                        <div key={p._id} className="flex justify-between items-center p-2 border rounded text-sm">
                                            <div className="min-w-0">
                                                <p className="font-medium truncate">{p.student}</p>
                                                <p className="text-xs text-gray-500">
                                                    {p.receiptNumber} • {formatDate(p.createdAt)}
                                                </p>
                                            </div>
                                            <Badge variant="outline" className="bg-green-50 text-green-700">
                                                {formatBDT(p.amount)}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <Button variant="outline" className="w-full mt-4" asChild>
                            <Link to="/parent/payments">View Payment Details</Link>
                        </Button>
                    </CardContent>
                </Card>

                {/* Children's attendance */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" />
                            Children's Attendance
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {attLoading ? (
                            <p className="text-center py-6 text-sm text-gray-500">Loading…</p>
                        ) : children.length === 0 ? (
                            <p className="text-center py-6 text-sm text-gray-500">
                                No children linked.
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {children.map((child) => {
                                    const s = attendanceStats[String(child._id)] || {};
                                    const pct = s.attendancePercentage || 0;
                                    const barColor =
                                        pct >= 90 ? "bg-green-500" :
                                        pct >= 75 ? "bg-yellow-500" :
                                        "bg-red-500";

                                    return (
                                        <div key={child._id} className="p-3 border rounded-lg">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="font-semibold text-sm">{child.name}</h4>
                                                <Badge variant="outline" className="text-xs">
                                                    {child.class?.name || "No class"}
                                                </Badge>
                                            </div>

                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span>Attendance:</span>
                                                    <span className="font-bold">{pct}%</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className={`h-2 rounded-full ${barColor}`}
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                                <div className="grid grid-cols-4 gap-1 text-xs">
                                                    <div className="text-center p-1 bg-green-50 rounded">
                                                        <div className="font-semibold text-green-600">
                                                            {s.presentRecords || 0}
                                                        </div>
                                                        <div className="text-gray-500">Present</div>
                                                    </div>
                                                    <div className="text-center p-1 bg-red-50 rounded">
                                                        <div className="font-semibold text-red-600">
                                                            {s.absentRecords || 0}
                                                        </div>
                                                        <div className="text-gray-500">Absent</div>
                                                    </div>
                                                    <div className="text-center p-1 bg-yellow-50 rounded">
                                                        <div className="font-semibold text-yellow-600">
                                                            {s.lateRecords || 0}
                                                        </div>
                                                        <div className="text-gray-500">Late</div>
                                                    </div>
                                                    <div className="text-center p-1 bg-orange-50 rounded">
                                                        <div className="font-semibold text-orange-600">
                                                            {s.halfDayRecords || 0}
                                                        </div>
                                                        <div className="text-gray-500">Half Day</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        <Button variant="outline" className="w-full mt-4" asChild>
                            <Link to="/parent/attendance">View All Attendance</Link>
                        </Button>
                    </CardContent>
                </Card>

                {/* Recent activity — results + attendance */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {/* Recent results */}
                            <div>
                                <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm">
                                    <BookOpen className="w-4 h-4" />
                                    Recent Results
                                </h4>
                                {resLoading ? (
                                    <p className="text-sm text-gray-500">Loading…</p>
                                ) : recentResults.length === 0 ? (
                                    <p className="text-sm text-gray-500">No results yet.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {recentResults.slice(0, 4).map((r) => (
                                            <div key={r._id} className="flex justify-between items-center text-sm p-2 border rounded">
                                                <div className="min-w-0">
                                                    <p className="font-medium truncate">
                                                        {r.student?.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500 truncate">
                                                        {r.exam?.title} • {r.subject?.name}
                                                    </p>
                                                </div>
                                                <Badge variant="outline">
                                                    {r.marksObtained}/{r.exam?.totalMarks}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Recent attendance */}
                            <div>
                                <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm">
                                    <Calendar className="w-4 h-4" />
                                    Recent Attendance
                                </h4>
                                {attLoading ? (
                                    <p className="text-sm text-gray-500">Loading…</p>
                                ) : recentAttendance.length === 0 ? (
                                    <p className="text-sm text-gray-500">No attendance yet.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {recentAttendance.slice(0, 4).map((rec) => (
                                            <div key={rec._id} className="flex justify-between items-center text-sm p-2 border rounded">
                                                <div className="min-w-0">
                                                    <p className="font-medium truncate">
                                                        {rec.student?.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500 truncate">
                                                        {formatDate(rec.date)}
                                                        {rec.subject?.name ? ` • ${rec.subject.name}` : ""}
                                                    </p>
                                                </div>
                                                <Badge
                                                    variant={
                                                        rec.status === "present" ? "default" :
                                                        rec.status === "absent" ? "destructive" :
                                                        "secondary"
                                                    }
                                                >
                                                    {rec.status}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Children list */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>My Children</CardTitle>
                    <Badge variant="outline">{children.length}</Badge>
                </CardHeader>
                <CardContent>
                    {children.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p>No children linked to your account.</p>
                            <p className="text-sm">Contact the school office.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {children.map((child) => {
                                const att = attendanceStats[String(child._id)] || {};
                                const res = resultsStats[String(child._id)] || {};
                                const s = child.summary || {};
                                return (
                                    <div key={child._id} className="flex items-center justify-between p-4 border rounded-lg">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                <User className="w-6 h-6 text-blue-600" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-medium truncate">{child.name}</p>
                                                <p className="text-sm text-gray-500 truncate">
                                                    Roll {child.rollNumber}
                                                    {child.class?.name ? ` • ${child.class.name}` : ""}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                    <Badge variant="outline" className="text-xs">
                                                        {att.attendancePercentage || 0}% Attendance
                                                    </Badge>
                                                    {res.totalExams > 0 && (
                                                        <Badge variant="outline" className="text-xs">
                                                            {res.percentage}% Avg
                                                        </Badge>
                                                    )}
                                                    {Number(s.dueBalance) > 0 && (
                                                        <Badge className="text-xs bg-rose-100 text-rose-800">
                                                            Due {formatBDT(s.dueBalance)}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2 flex-shrink-0">
                                            <Button variant="outline" size="sm" asChild>
                                                <Link to={`/parent/payments/${child._id}`}>
                                                    Payments
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

// // components/parent/ParentDashboard.jsx
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import {
//     useGetMyDashboardQuery,
// } from "@/features/apis/parentPortalApi";
// import { useAppSelector } from "@/features/store";
// import { BookOpen, TrendingUp, User, Users, Wallet } from "lucide-react";
// import { Link } from "react-router-dom";
// import { formatBDT, formatDate } from "@/utils/formatCurrency";

// export default function ParentDashboard() {
//     const { parent } = useAppSelector((s) => s.parentAuth);
//     const { data, isLoading, error } = useGetMyDashboardQuery();

//     if (isLoading) {
//         return (
//             <Card>
//                 <CardContent className="p-10 text-center text-gray-500">
//                     Loading dashboard…
//                 </CardContent>
//             </Card>
//         );
//     }
//     if (error) {
//         return (
//             <Card>
//                 <CardContent className="p-10 text-center text-red-500">
//                     Failed to load dashboard. Please try again.
//                 </CardContent>
//             </Card>
//         );
//     }

//     const {
//         children = [],
//         summary = {},
//         recentPayments = [],
//     } = data || {};

//     const outstanding = Number(summary.totalOutstanding || 0);

//     return (
//         <div className="space-y-6">
//             {/* Header */}
//             <div className="flex justify-between items-center">
//                 <div>
//                     <h1 className="text-3xl font-bold">
//                         Welcome, {parent?.name || "Parent"}!
//                     </h1>
//                     <p className="text-gray-600 mt-1">
//                         Monitor your children's fees and payments
//                     </p>
//                 </div>
//                 <div className="text-right">
//                     <p className="text-sm text-gray-500">Today</p>
//                     <p className="font-semibold">{formatDate(new Date())}</p>
//                 </div>
//             </div>

//             {/* Outstanding alert */}
//             {outstanding > 0 && (
//                 <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
//                     <Wallet className="w-5 h-5 text-amber-600" />
//                     <span className="font-medium text-amber-900">
//                         Total Outstanding: {formatBDT(outstanding)}
//                     </span>
//                 </div>
//             )}

//             {/* KPIs */}
//             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//                 <Card>
//                     <CardContent className="p-5 flex items-center gap-3">
//                         <div className="p-2 bg-blue-100 rounded-lg">
//                             <Users className="w-5 h-5 text-blue-600" />
//                         </div>
//                         <div>
//                             <p className="text-2xl font-bold">{children.length}</p>
//                             <p className="text-sm text-gray-600">Children</p>
//                         </div>
//                     </CardContent>
//                 </Card>
//                 <Card>
//                     <CardContent className="p-5 flex items-center gap-3">
//                         <div className="p-2 bg-indigo-100 rounded-lg">
//                             <BookOpen className="w-5 h-5 text-indigo-600" />
//                         </div>
//                         <div>
//                             <p className="text-2xl font-bold">
//                                 {formatBDT(summary.totalFee)}
//                             </p>
//                             <p className="text-sm text-gray-600">Total Billed</p>
//                         </div>
//                     </CardContent>
//                 </Card>
//                 <Card>
//                     <CardContent className="p-5 flex items-center gap-3">
//                         <div className="p-2 bg-green-100 rounded-lg">
//                             <TrendingUp className="w-5 h-5 text-green-600" />
//                         </div>
//                         <div>
//                             <p className="text-2xl font-bold">
//                                 {formatBDT(summary.totalPaid)}
//                             </p>
//                             <p className="text-sm text-gray-600">Total Paid</p>
//                         </div>
//                     </CardContent>
//                 </Card>
//                 <Card>
//                     <CardContent className="p-5 flex items-center gap-3">
//                         <div className="p-2 bg-rose-100 rounded-lg">
//                             <Wallet className="w-5 h-5 text-rose-600" />
//                         </div>
//                         <div>
//                             <p className={`text-2xl font-bold ${outstanding > 0 ? "text-rose-600" : "text-green-600"}`}>
//                                 {formatBDT(outstanding)}
//                             </p>
//                             <p className="text-sm text-gray-600">Outstanding</p>
//                         </div>
//                     </CardContent>
//                 </Card>
//             </div>

//             {/* Per-child snapshot + recent payments */}
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//                 <Card>
//                     <CardHeader>
//                         <CardTitle>Children</CardTitle>
//                     </CardHeader>
//                     <CardContent className="space-y-3">
//                         {children.length === 0 ? (
//                             <div className="text-center py-6 text-gray-500">
//                                 <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
//                                 <p className="text-sm">
//                                     No children linked yet. Contact the school office.
//                                 </p>
//                             </div>
//                         ) : (
//                             children.map((child) => {
//                                 const s = child.summary || {};
//                                 const due = Number(s.dueBalance || 0);
//                                 const statusColor =
//                                     s.status === "advanced" ? "bg-blue-100 text-blue-800" :
//                                     s.status === "clear" ? "bg-green-100 text-green-800" :
//                                     s.status === "due" ? "bg-amber-100 text-amber-800" :
//                                     "bg-gray-100 text-gray-800";

//                                 return (
//                                     <div
//                                         key={child._id}
//                                         className="p-3 border rounded-lg flex items-center justify-between"
//                                     >
//                                         <div className="flex items-center gap-3 min-w-0">
//                                             <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
//                                                 <User className="w-5 h-5 text-blue-600" />
//                                             </div>
//                                             <div className="min-w-0">
//                                                 <p className="font-semibold truncate">{child.name}</p>
//                                                 <p className="text-xs text-gray-500 truncate">
//                                                     Roll {child.rollNumber}
//                                                     {child.class?.name ? ` • ${child.class.name}` : ""}
//                                                 </p>
//                                                 <div className="flex items-center gap-2 mt-1 text-xs">
//                                                     <span>Paid {formatBDT(s.totalPaid)}</span>
//                                                     <span className="text-gray-400">•</span>
//                                                     <span className={due > 0 ? "text-rose-600 font-medium" : "text-green-600"}>
//                                                         Due {formatBDT(due)}
//                                                     </span>
//                                                 </div>
//                                             </div>
//                                         </div>
//                                         <div className="flex flex-col items-end gap-2 flex-shrink-0">
//                                             <Badge className={statusColor}>
//                                                 {(s.status || "clear").toUpperCase()}
//                                             </Badge>
//                                             <Button variant="outline" size="sm" asChild>
//                                                 <Link to={`/parent/payments/${child._id}`}>
//                                                     Details
//                                                 </Link>
//                                             </Button>
//                                         </div>
//                                     </div>
//                                 );
//                             })
//                         )}
//                     </CardContent>
//                 </Card>

//                 <Card>
//                     <CardHeader>
//                         <CardTitle>Recent Payments</CardTitle>
//                     </CardHeader>
//                     <CardContent>
//                         {recentPayments.length === 0 ? (
//                             <p className="text-center py-6 text-sm text-gray-500">
//                                 No payments recorded yet.
//                             </p>
//                         ) : (
//                             <div className="space-y-2">
//                                 {recentPayments.slice(0, 6).map((p) => (
//                                     <div
//                                         key={p._id}
//                                         className="flex items-center justify-between p-2 border rounded text-sm"
//                                     >
//                                         <div className="min-w-0">
//                                             <p className="font-medium truncate">{p.student}</p>
//                                             <p className="text-xs text-gray-500">
//                                                 {p.receiptNumber} • {formatDate(p.createdAt)}
//                                             </p>
//                                         </div>
//                                         <Badge variant="outline" className="bg-green-50 text-green-700">
//                                             {formatBDT(p.amount)}
//                                         </Badge>
//                                     </div>
//                                 ))}
//                             </div>
//                         )}
//                         <Button variant="outline" className="w-full mt-4" asChild>
//                             <Link to="/parent/payments">View All Payments</Link>
//                         </Button>
//                     </CardContent>
//                 </Card>
//             </div>
//         </div>
//     );
// }
