// components/student/StudentFeeDetail.jsx
import { Link, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useGetStudentFeeDetailQuery } from "@/features/apis/studentsApi";
import {
    ArrowLeft, Calendar, CheckCircle2, FileText, Gift, Wallet,
} from "lucide-react";
import { formatBDT, formatDate } from "@/utils/formatCurrency";

const TIMELINE_META = {
    fee_created:     { icon: FileText,     color: "text-gray-600",  bg: "bg-gray-100" },
    waiver_applied:  { icon: Gift,         color: "text-purple-600", bg: "bg-purple-100" },
    payment_allocated: { icon: CheckCircle2, color: "text-green-600", bg: "bg-green-100" },
    advance_applied: { icon: Wallet,       color: "text-blue-600",  bg: "bg-blue-100" },
};

export default function StudentFeeDetail() {
    const { feeId } = useParams();
    const { data, isLoading, error } = useGetStudentFeeDetailQuery(feeId);

    if (isLoading) {
        return <div className="p-6 text-gray-500">Loading fee details…</div>;
    }
    if (error) {
        return (
            <div className="p-6">
                <p className="text-red-500">
                    {error?.data?.message || "Failed to load fee details"}
                </p>
                <Button asChild variant="outline" className="mt-4">
                    <Link to="/student/payments">Back to Payments</Link>
                </Button>
            </div>
        );
    }

    const { fee, waiver, allocations, timeline } = data || {};

    const statusColor = (status) => ({
        paid: "bg-green-100 text-green-800",
        partial: "bg-blue-100 text-blue-800",
        unpaid: "bg-amber-100 text-amber-800",
        overdue: "bg-red-100 text-red-800",
        waived: "bg-purple-100 text-purple-800",
        cancelled: "bg-gray-100 text-gray-800",
        pending: "bg-gray-100 text-gray-800",
    }[status] || "bg-gray-100 text-gray-800");

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" asChild>
                    <Link to="/student/payments">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">{fee?.title}</h1>
                    <p className="text-sm text-gray-500">
                        {fee?.frequency} • Due {formatDate(fee?.dueDate)}
                    </p>
                </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <p className="text-sm text-gray-500">Total Amount</p>
                        <p className="text-xl font-bold">{formatBDT(fee?.totalAmount)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <p className="text-sm text-gray-500">Paid</p>
                        <p className="text-xl font-bold text-green-600">
                            {formatBDT(fee?.paidAmount)}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <p className="text-sm text-gray-500">Waived</p>
                        <p className="text-xl font-bold text-purple-600">
                            {formatBDT(fee?.waivedAmount)}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <p className="text-sm text-gray-500">Due</p>
                        <p className={`text-xl font-bold ${
                            Number(fee?.dueAmount) > 0 ? "text-rose-600" : "text-gray-700"
                        }`}>
                            {formatBDT(fee?.dueAmount)}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Current status + meta */}
            <Card>
                <CardHeader>
                    <CardTitle>Fee Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Status:</span>
                                <Badge className={statusColor(fee?.status)}>
                                    {String(fee?.status || "").toUpperCase()}
                                </Badge>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Original Amount:</span>
                                <span className="font-medium">{formatBDT(fee?.originalAmount)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Tax:</span>
                                <span className="font-medium">{formatBDT(fee?.taxAmount)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Late Fee:</span>
                                <span className="font-medium">{formatBDT(fee?.lateFeeAmount)}</span>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Issue Date:</span>
                                <span className="font-medium">{formatDate(fee?.issueDate)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Due Date:</span>
                                <span className="font-medium">{formatDate(fee?.dueDate)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Advance Used:</span>
                                <span className="font-medium">{formatBDT(fee?.advanceUsed)}</span>
                            </div>
                            {fee?.paidDate && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Paid Date:</span>
                                    <span className="font-medium">{formatDate(fee?.paidDate)}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {waiver && (
                        <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                            <div className="flex items-start gap-3">
                                <Gift className="w-5 h-5 text-purple-600 mt-0.5" />
                                <div className="flex-1">
                                    <p className="font-medium text-purple-900">
                                        Waiver applied — {formatBDT(waiver.amount)}
                                    </p>
                                    <p className="text-sm text-purple-800 mt-1">
                                        {waiver.reason || String(waiver.type).replace("_", " ")}
                                        {waiver.approvedDate ? ` • ${formatDate(waiver.approvedDate)}` : ""}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
                <CardHeader>
                    <CardTitle>Activity Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                    {timeline?.length === 0 ? (
                        <p className="text-center py-6 text-gray-500 text-sm">
                            No activity yet.
                        </p>
                    ) : (
                        <ol className="relative border-l border-gray-200 ml-3 space-y-6">
                            {timeline.map((event, idx) => {
                                const meta = TIMELINE_META[event.type] || TIMELINE_META.fee_created;
                                const Icon = meta.icon;
                                return (
                                    <li key={idx} className="ml-6">
                                        <span className={`absolute -left-3 flex items-center justify-center w-6 h-6 rounded-full ring-4 ring-white ${meta.bg}`}>
                                            <Icon className={`w-3.5 h-3.5 ${meta.color}`} />
                                        </span>
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <p className="font-medium text-sm">
                                                    {event.description}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    <Calendar className="w-3 h-3 inline mr-1" />
                                                    {formatDate(event.at)}
                                                </p>
                                            </div>
                                            <p className={`font-semibold ${
                                                event.type === "payment_allocated" || event.type === "waiver_applied"
                                                    ? "text-green-600"
                                                    : "text-gray-700"
                                            }`}>
                                                {formatBDT(event.amount)}
                                            </p>
                                        </div>
                                    </li>
                                );
                            })}
                        </ol>
                    )}
                </CardContent>
            </Card>

            {/* Allocations table */}
            {allocations?.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Payment Allocations</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Receipt</TableHead>
                                    <TableHead>Method</TableHead>
                                    <TableHead>Allocated At</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {allocations.map((a) => (
                                    <TableRow key={a._id}>
                                        <TableCell className="font-mono text-sm">
                                            {a.receiptNumber || "—"}
                                        </TableCell>
                                        <TableCell className="capitalize">
                                            {String(a.method || "").replace("_", " ")}
                                        </TableCell>
                                        <TableCell>{formatDate(a.allocatedAt)}</TableCell>
                                        <TableCell className="text-right font-medium text-green-600">
                                            {formatBDT(a.amount)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}