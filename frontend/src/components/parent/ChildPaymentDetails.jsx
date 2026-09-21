// components/parent/ChildPaymentDetails.jsx
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useGetChildFinanceQuery } from "@/features/apis/parentPortalApi";
import { ArrowLeft, Download, FileText, Wallet } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { formatBDT, formatDate } from "@/utils/formatCurrency";

export default function ChildPaymentDetails() {
    const { childId } = useParams();
    const { data, isLoading, error } = useGetChildFinanceQuery({ childId });

    if (isLoading) return <div className="p-6 text-gray-500">Loading…</div>;
    if (error) {
        return (
            <div className="p-6">
                <p className="text-red-500">
                    {error?.data?.message || "Failed to load payment details"}
                </p>
                <Button asChild variant="outline" className="mt-4">
                    <Link to="/parent/payments">Back</Link>
                </Button>
            </div>
        );
    }

    const {
        summary = {}, bills = [], payments = [], fees = [], advance = {}, session,
    } = data || {};

    const child = fees[0]
        ? null // we don't have student name in this response — fetch separately if needed
        : null;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" asChild>
                    <Link to="/parent/payments">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Payment Details</h1>
                    <p className="text-sm text-gray-500">Session {session}</p>
                </div>

                {Number(summary.dueBalance) > 0 && (
                    <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
                        <Link to={`/parent/payments/pay?child=${childId}`}>
                            <Wallet className="w-4 h-4 mr-2" />
                            Pay Online
                        </Link>
                    </Button>
                )}
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <p className="text-sm text-gray-500">Total Billed</p>
                        <p className="text-xl font-bold">{formatBDT(summary.totalFee)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <p className="text-sm text-gray-500">Total Paid</p>
                        <p className="text-xl font-bold text-green-600">
                            {formatBDT(summary.totalPaid)}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <p className="text-sm text-gray-500">Outstanding</p>
                        <p className="text-xl font-bold text-rose-600">
                            {formatBDT(summary.dueBalance)}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <p className="text-sm text-gray-500">Advance Balance</p>
                        <p className="text-xl font-bold text-blue-600">
                            {formatBDT(advance.amount)}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Monthly bills */}
            <Card>
                <CardHeader>
                    <CardTitle>Monthly Bills</CardTitle>
                </CardHeader>
                <CardContent>
                    {bills.length === 0 ? (
                        <p className="text-center py-6 text-gray-500 text-sm">
                            No bills yet.
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {bills.map((bill) => (
                                <div key={bill.monthKey} className="border rounded-lg overflow-hidden">
                                    <div className="flex items-center justify-between bg-gray-50 px-4 py-2">
                                        <div className="font-medium">{bill.monthLabel}</div>
                                        <div className="flex items-center gap-3">
                                            <Badge variant="outline">
                                                {bill.status.toUpperCase()}
                                            </Badge>
                                            <span className="text-sm">
                                                Total: <strong>{formatBDT(bill.total)}</strong>
                                                {" • "}
                                                Paid: <strong className="text-green-600">
                                                    {formatBDT(bill.paid)}
                                                </strong>
                                                {Number(bill.due) > 0 && (
                                                    <>
                                                        {" • "}
                                                        Due: <strong className="text-rose-600">
                                                            {formatBDT(bill.due)}
                                                        </strong>
                                                    </>
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Fee</TableHead>
                                                <TableHead>Due Date</TableHead>
                                                <TableHead className="text-right">Amount</TableHead>
                                                <TableHead className="text-right">Paid</TableHead>
                                                <TableHead className="text-right">Due</TableHead>
                                                <TableHead>Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {bill.items.map((item) => (
                                                <TableRow key={item._id}>
                                                    <TableCell className="font-medium">
                                                        {item.title}
                                                    </TableCell>
                                                    <TableCell>{formatDate(item.dueDate)}</TableCell>
                                                    <TableCell className="text-right">
                                                        {formatBDT(item.totalAmount)}
                                                    </TableCell>
                                                    <TableCell className="text-right text-green-600">
                                                        {formatBDT(item.paidAmount)}
                                                    </TableCell>
                                                    <TableCell className={`text-right ${Number(item.dueAmount) > 0 ? "text-rose-600 font-medium" : ""
                                                        }`}>
                                                        {formatBDT(item.dueAmount)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">
                                                            {item.status}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Payment history */}
            <Card>
                <CardHeader>
                    <CardTitle>Payment History</CardTitle>
                </CardHeader>
                <CardContent>
                    {payments.length === 0 ? (
                        <p className="text-center py-6 text-gray-500 text-sm">
                            No payments recorded.
                        </p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Receipt</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Method</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payments.map((p) => (
                                    <TableRow key={p._id}>
                                        <TableCell className="font-mono text-sm">
                                            {p.receiptNumber}
                                        </TableCell>
                                        <TableCell>{formatDate(p.createdAt)}</TableCell>
                                        <TableCell className="capitalize">{p.method}</TableCell>
                                        <TableCell className="text-right font-semibold">
                                            {formatBDT(p.amount)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{p.status}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            {p.status === "completed" && (
                                                <Button variant="outline" size="sm" asChild>
                                                    <a
                                                        href={`${import.meta.env.VITE_API_URL}/pdf/receipt/${p._id}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        <Download className="w-3 h-3 mr-1" />
                                                        Receipt
                                                    </a>
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}