// components/parent/ChildrenAttendance.jsx
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useGetChildrenAttendanceQuery } from "@/features/apis/parentPortalApi";
import { format } from "date-fns";
import {
    BookOpen, Calendar, CheckCircle, Clock, TrendingUp, XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];
const CURRENT_YEAR = new Date().getFullYear();

export default function ChildrenAttendance() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
    const [selectedChild, setSelectedChild] = useState(searchParams.get("child") || "all");
    const [selectedSubject, setSelectedSubject] = useState("all");

    // Compute month range
    const { startDate, endDate } = useMemo(() => {
        const start = new Date(selectedYear, selectedMonth - 1, 1);
        const end = new Date(selectedYear, selectedMonth, 0, 23, 59, 59, 999);
        return { startDate: start.toISOString(), endDate: end.toISOString() };
    }, [selectedMonth, selectedYear]);

    const { data, isLoading, error } = useGetChildrenAttendanceQuery({
        startDate,
        endDate,
        childId: selectedChild !== "all" ? selectedChild : undefined,
        subjectId: selectedSubject !== "all" ? selectedSubject : undefined,
    });

    // Everything from a single response
    const children = data?.children || [];
    const attendance = data?.records || [];
    const statistics = data?.stats || {};

    // Subjects present in the fetched records (client-side list)
    const subjects = useMemo(() => {
        const map = new Map();
        for (const r of attendance) {
            if (r.subject?._id) map.set(r.subject._id, r.subject);
        }
        return [...map.values()];
    }, [attendance]);

    const handleChildChange = (childId) => {
        setSelectedChild(childId);
        setSearchParams(childId !== "all" ? { child: childId } : {});
    };

    const getStatusIcon = (status) => ({
        present: <CheckCircle className="w-4 h-4 text-green-500" />,
        absent: <XCircle className="w-4 h-4 text-red-500" />,
        late: <Clock className="w-4 h-4 text-yellow-500" />,
        half_day: <Clock className="w-4 h-4 text-orange-500" />,
    }[status]);

    const getStatusColor = (status) => ({
        present: "bg-green-100 text-green-800",
        absent: "bg-red-100 text-red-800",
        late: "bg-yellow-100 text-yellow-800",
        half_day: "bg-orange-100 text-orange-800",
    }[status] || "bg-gray-100 text-gray-800");

    if (isLoading) {
        return (
            <Card>
                <CardContent className="p-6 text-center text-gray-500">
                    Loading attendance…
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardContent className="p-6 text-center text-red-500">
                    {error?.data?.message || "Failed to load attendance"}
                </CardContent>
            </Card>
        );
    }

    const visibleChildren = selectedChild === "all"
        ? children
        : children.filter((c) => c._id === selectedChild);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Children's Attendance</h1>
                    <p className="text-gray-600 mt-2">
                        Monitor your children's attendance records
                    </p>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Select Child</label>
                            <Select value={selectedChild} onValueChange={handleChildChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Children" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Children</SelectItem>
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
                                onValueChange={(v) => setSelectedMonth(parseInt(v))}
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
                                onValueChange={(v) => setSelectedYear(parseInt(v))}
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
                    </div>
                </CardContent>
            </Card>

            {/* Stat cards per child */}
            {visibleChildren.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {visibleChildren.map((child) => {
                        const s = statistics[String(child._id)] || {};
                        const pct = s.attendancePercentage || 0;
                        return (
                            <Card key={child._id}>
                                <CardContent className="p-5 text-center">
                                    <p className="font-medium text-sm mb-2">{child.name}</p>
                                    <div className="text-2xl font-bold text-blue-600 mb-1">
                                        {pct}%
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {s.presentRecords || 0} of {s.totalRecords || 0} classes
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                        <div
                                            className={`h-2 rounded-full ${
                                                pct >= 90 ? "bg-green-500" :
                                                pct >= 75 ? "bg-yellow-500" : "bg-red-500"
                                            }`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Records table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5" />
                        Attendance Records
                        {selectedChild !== "all" &&
                            ` — ${children.find((c) => c._id === selectedChild)?.name || ""}`}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {attendance.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-lg">No attendance records found</p>
                            <p className="text-sm">Try another month or filter</p>
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
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {attendance.map((record) => (
                                    <TableRow key={record._id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-gray-500" />
                                                {format(new Date(record.date), "MMM dd, yyyy")}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">{record.student?.name}</div>
                                            <div className="text-sm text-gray-500">
                                                Roll: {record.student?.rollNumber}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {record.class?.name || "—"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <BookOpen className="w-4 h-4 text-gray-500" />
                                                {record.subject?.name || "N/A"}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">Period {record.period}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={getStatusColor(record.status)}>
                                                <div className="flex items-center gap-1">
                                                    {getStatusIcon(record.status)}
                                                    {record.status?.charAt(0).toUpperCase() +
                                                        record.status?.slice(1)}
                                                </div>
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Summary */}
            {visibleChildren.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" />
                            Attendance Summary
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {visibleChildren.map((child) => {
                                const s = statistics[String(child._id)] || {};
                                const pct = s.attendancePercentage || 0;
                                const performance =
                                    pct >= 90 ? "Excellent" :
                                    pct >= 75 ? "Good" :
                                    pct >= 60 ? "Average" : "Needs Improvement";
                                return (
                                    <div key={child._id} className="p-4 border rounded-lg">
                                        <h4 className="font-semibold mb-2">{child.name}</h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span>Present:</span>
                                                <span className="font-medium">{s.presentRecords || 0}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Absent:</span>
                                                <span className="font-medium">{s.absentRecords || 0}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Late:</span>
                                                <span className="font-medium">{s.lateRecords || 0}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Half Day:</span>
                                                <span className="font-medium">{s.halfDayRecords || 0}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Total Classes:</span>
                                                <span className="font-medium">{s.totalRecords || 0}</span>
                                            </div>
                                            <div className="flex justify-between pt-2 border-t">
                                                <span>Performance:</span>
                                                <Badge
                                                    variant={
                                                        performance === "Excellent" ? "default" :
                                                        performance === "Good" ? "secondary" :
                                                        "outline"
                                                    }
                                                >
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
            )}
        </div>
    );
}