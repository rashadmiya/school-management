// components/parent/ParentPayments.jsx
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useGetMyDashboardQuery } from "@/features/apis/parentPortalApi";
import { FileText, User } from "lucide-react";
import { Link } from "react-router-dom";
import { formatBDT } from "@/utils/formatCurrency";

export default function ParentPayments() {
    const { data, isLoading } = useGetMyDashboardQuery();

    if (isLoading) return <div className="p-6 text-gray-500">Loading…</div>;

    const { children = [], summary = {} } = data || {};

    const statusColor = (status) => ({
        clear: "bg-green-100 text-green-800",
        advanced: "bg-blue-100 text-blue-800",
        due: "bg-amber-100 text-amber-800",
        overdue: "bg-red-100 text-red-800",
    }[status] || "bg-gray-100 text-gray-800");

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Payment Overview</h1>
                <p className="text-gray-600">Track your children's fees and payments</p>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-5 text-center">
                        <p className="text-2xl font-bold">{formatBDT(summary.totalFee)}</p>
                        <p className="text-sm text-gray-600">Total Billed</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-5 text-center">
                        <p className="text-2xl font-bold text-green-600">
                            {formatBDT(summary.totalPaid)}
                        </p>
                        <p className="text-sm text-gray-600">Total Paid</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-5 text-center">
                        <p className="text-2xl font-bold text-rose-600">
                            {formatBDT(summary.totalOutstanding)}
                        </p>
                        <p className="text-sm text-gray-600">Outstanding</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-5 text-center">
                        <p className="text-2xl font-bold">
                            {summary.collectionRate || 0}%
                        </p>
                        <p className="text-sm text-gray-600">Collection Rate</p>
                    </CardContent>
                </Card>
            </div>

            {/* Per-child table */}
            <Card>
                <CardHeader>
                    <CardTitle>Children Payment Status</CardTitle>
                </CardHeader>
                <CardContent>
                    {children.length === 0 ? (
                        <p className="text-center py-8 text-gray-500">
                            No children linked to your account.
                        </p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Child</TableHead>
                                    <TableHead>Class</TableHead>
                                    <TableHead className="text-right">Billed</TableHead>
                                    <TableHead className="text-right">Paid</TableHead>
                                    <TableHead className="text-right">Due</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {children.map((child) => {
                                    const s = child.summary || {};
                                    return (
                                        <TableRow key={child._id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <User className="w-4 h-4 text-gray-500" />
                                                    <div>
                                                        <p className="font-medium">{child.name}</p>
                                                        <p className="text-xs text-gray-500">
                                                            Roll {child.rollNumber}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>{child.class?.name || "—"}</TableCell>
                                            <TableCell className="text-right">
                                                {formatBDT(s.totalFee)}
                                            </TableCell>
                                            <TableCell className="text-right text-green-600">
                                                {formatBDT(s.totalPaid)}
                                            </TableCell>
                                            <TableCell className={`text-right font-semibold ${
                                                Number(s.dueBalance) > 0 ? "text-rose-600" : "text-gray-500"
                                            }`}>
                                                {formatBDT(s.dueBalance)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={statusColor(s.status)}>
                                                    {(s.status || "clear").toUpperCase()}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link to={`/parent/payments/${child._id}`}>
                                                        <FileText className="w-3 h-3 mr-1" />
                                                        Details
                                                    </Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}