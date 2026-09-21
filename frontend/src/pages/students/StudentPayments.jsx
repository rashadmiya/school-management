// components/student/StudentPayments.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    useGetStudentFinanceQuery,
    useGetStudentWaiversQuery,
    useGetStudentAdvanceTransactionsQuery,
    studentStatementUrl,
} from "@/features/apis/studentsApi";
import {
    ArrowLeft, Download, Wallet, FileText, ArrowDownLeft, ArrowUpRight,
    CreditCard,
} from "lucide-react";
import { formatBDT, formatDate } from "@/utils/formatCurrency";

export default function StudentPayments() {
    const [session] = useState(undefined); // use server default

    const { data, isLoading, error } = useGetStudentFinanceQuery({ session });
    const { data: waiversData, isLoading: loadingWaivers } =
        useGetStudentWaiversQuery({ session });
    const { data: advanceData, isLoading: loadingAdvance } =
        useGetStudentAdvanceTransactionsQuery({ session });

    if (isLoading) {
        return <div className="flex justify-center py-8">Loading payments…</div>;
    }
    if (error) {
        return (
            <div className="text-center py-8 text-red-500">
                {error?.data?.message || "Failed to load payments"}
            </div>
        );
    }

    const {
        summary = {},
        bills = [],
        payments = [],
        advance = {},
        session: activeSession,
    } = data || {};

    const waivers = waiversData?.waivers || [];
    const advanceTxns = advanceData?.transactions || [];

    const dueBalance = Number(summary?.dueBalance || 0);
    const statusColor = (status) => ({
        clear: "bg-green-100 text-green-800",
        advanced: "bg-blue-100 text-blue-800",
        due: "bg-amber-100 text-amber-800",
        overdue: "bg-red-100 text-red-800",
        paid: "bg-green-100 text-green-800",
        partial: "bg-blue-100 text-blue-800",
        unpaid: "bg-gray-100 text-gray-800",
        revoked: "bg-red-100 text-red-800",
        approved: "bg-green-100 text-green-800",
    }[status] || "bg-gray-100 text-gray-800");

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" asChild>
                        <Link to="/student">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Dashboard
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">My Payments</h1>
                        <p className="text-gray-600">Session {activeSession}</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button asChild variant="outline">
                        <a
                            href={studentStatementUrl(activeSession)}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <FileText className="w-4 h-4 mr-2" />
                            Statement
                        </a>
                    </Button>
                    {dueBalance > 0 && (
                        <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
                            <Link to="/student/payments/pay">
                                <CreditCard className="w-4 h-4 mr-2" />
                                Pay Online
                            </Link>
                        </Button>
                    )}
                </div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-5 text-center">
                        <p className="text-sm text-gray-600">Total Billed</p>
                        <p className="text-2xl font-bold">{formatBDT(summary?.totalFee)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-5 text-center">
                        <p className="text-sm text-gray-600">Total Paid</p>
                        <p className="text-2xl font-bold text-green-600">
                            {formatBDT(summary?.totalPaid)}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-5 text-center">
                        <p className="text-sm text-gray-600">Outstanding</p>
                        <p className={`text-2xl font-bold ${dueBalance > 0 ? "text-rose-600" : "text-gray-700"}`}>
                            {formatBDT(dueBalance)}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-5 text-center">
                        <p className="text-sm text-gray-600">Advance Balance</p>
                        <p className="text-2xl font-bold text-blue-600">
                            {formatBDT(advance?.amount)}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="receipts">Receipts</TabsTrigger>
                    <TabsTrigger value="waivers">
                        Waivers {waivers.length > 0 && `(${waivers.length})`}
                    </TabsTrigger>
                    <TabsTrigger value="advance">Advance</TabsTrigger>
                </TabsList>

                {/* ---------------- OVERVIEW ---------------- */}
                <TabsContent value="overview" className="space-y-4">
                    {bills.length === 0 ? (
                        <Card>
                            <CardContent className="py-10 text-center text-gray-500 text-sm">
                                No bills for this session.
                            </CardContent>
                        </Card>
                    ) : (
                        bills.map((bill) => (
                            <Card key={bill.monthKey} className="overflow-hidden">
                                <div className="flex items-center justify-between bg-gray-50 px-4 py-3 border-b">
                                    <div className="font-medium">{bill.monthLabel}</div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <Badge className={statusColor(bill.status)}>
                                            {bill.status.toUpperCase()}
                                        </Badge>
                                        <span>
                                            Total <strong>{formatBDT(bill.total)}</strong>
                                            {" · "}
                                            Paid <strong className="text-green-600">{formatBDT(bill.paid)}</strong>
                                            {Number(bill.due) > 0 && (
                                                <>
                                                    {" · "}
                                                    Due <strong className="text-rose-600">{formatBDT(bill.due)}</strong>
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
                                            <TableHead className="text-right">Waived</TableHead>
                                            <TableHead className="text-right">Advance</TableHead>
                                            <TableHead className="text-right">Due</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {bill.items.map((item) => (
                                            <TableRow key={item._id}>
                                                <TableCell className="font-medium">
                                                    <Link
                                                        to={`/student/payments/fees/${item._id}`}
                                                        className="text-blue-600 hover:underline"
                                                    >
                                                        {item.title}
                                                    </Link>
                                                </TableCell>
                                                <TableCell>{formatDate(item.dueDate)}</TableCell>
                                                <TableCell className="text-right">
                                                    {formatBDT(item.totalAmount)}
                                                </TableCell>
                                                <TableCell className="text-right text-green-600">
                                                    {formatBDT(item.paidAmount)}
                                                </TableCell>
                                                <TableCell className="text-right text-purple-600">
                                                    {formatBDT(item.waivedAmount)}
                                                </TableCell>
                                                <TableCell className="text-right text-blue-600">
                                                    {formatBDT(item.advanceUsed)}
                                                </TableCell>
                                                <TableCell className={`text-right font-medium ${Number(item.dueAmount) > 0 ? "text-rose-600" : "text-gray-500"
                                                    }`}>
                                                    {formatBDT(item.dueAmount)}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{item.status}</Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Card>
                        ))
                    )}
                </TabsContent>

                {/* ---------------- RECEIPTS ---------------- */}
                <TabsContent value="receipts">
                    <Card>
                        <CardHeader>
                            <CardTitle>Payment History</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {payments.length === 0 ? (
                                <p className="text-center py-6 text-gray-500 text-sm">
                                    No payments recorded yet.
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
                                                <TableCell className="capitalize">
                                                    {String(p.method).replace("_", " ")}
                                                </TableCell>
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
                </TabsContent>

                {/* ---------------- WAIVERS ---------------- */}
                <TabsContent value="waivers">
                    <Card>
                        <CardHeader>
                            <CardTitle>Waivers & Scholarships</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loadingWaivers ? (
                                <p className="text-center py-6 text-gray-500 text-sm">Loading…</p>
                            ) : waivers.length === 0 ? (
                                <p className="text-center py-6 text-gray-500 text-sm">
                                    No waivers applied to your account.
                                </p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Applied To</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead className="text-right">Amount</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Approved</TableHead>
                                            <TableHead>Reason</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {waivers.map((w) => (
                                            <TableRow key={w._id}>
                                                <TableCell className="font-medium">
                                                    {w.feeInstance?.title || "—"}
                                                </TableCell>
                                                <TableCell className="capitalize">
                                                    {String(w.type).replace("_", " ")}
                                                </TableCell>
                                                <TableCell className="text-right text-purple-600 font-medium">
                                                    {formatBDT(w.amount)}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={statusColor(w.status)}>
                                                        {w.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{formatDate(w.approvedDate)}</TableCell>
                                                <TableCell className="max-w-xs truncate text-sm text-gray-600">
                                                    {w.reason}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ---------------- ADVANCE ---------------- */}
                <TabsContent value="advance">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Advance Balance</CardTitle>
                            <div className="text-right">
                                <p className="text-sm text-gray-500">Current balance</p>
                                <p className="text-xl font-bold text-blue-600">
                                    {formatBDT(advance.amount)}
                                </p>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loadingAdvance ? (
                                <p className="text-center py-6 text-gray-500 text-sm">Loading…</p>
                            ) : advanceTxns.length === 0 ? (
                                <p className="text-center py-6 text-gray-500 text-sm">
                                    No advance transactions yet.
                                </p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Description</TableHead>
                                            <TableHead className="text-right">Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {advanceTxns.map((t) => (
                                            <TableRow key={t._id}>
                                                <TableCell>{formatDate(t.createdAt)}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1.5">
                                                        {t.type === "credit" ? (
                                                            <ArrowDownLeft className="w-4 h-4 text-green-600" />
                                                        ) : (
                                                            <ArrowUpRight className="w-4 h-4 text-rose-600" />
                                                        )}
                                                        <span className="capitalize">{t.type}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm text-gray-600 max-w-md truncate">
                                                    {t.description || "—"}
                                                </TableCell>
                                                <TableCell className={`text-right font-medium ${t.type === "credit" ? "text-green-600" : "text-rose-600"
                                                    }`}>
                                                    {t.type === "credit" ? "+" : "−"}
                                                    {formatBDT(t.amount)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Persistent advance reminder */}
            {Number(advance.amount) > 0 && (
                <Card>
                    <CardContent className="p-5 flex items-center gap-3">
                        <Wallet className="w-5 h-5 text-blue-600" />
                        <div>
                            <p className="text-sm text-gray-600">Advance balance available</p>
                            <p className="font-semibold">
                                {formatBDT(advance.amount)} — will be auto-applied to future fees.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

// // components/student/StudentPayments.jsx
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { useGetStudentFinanceQuery } from "@/features/apis/studentsApi";
// import { ArrowLeft, Download, Wallet } from "lucide-react";
// import { Link } from "react-router-dom";
// import { formatBDT, formatDate } from "@/utils/formatCurrency";

// export default function StudentPayments() {
//     const { data, isLoading, error } = useGetStudentFinanceQuery({});

//     if (isLoading) {
//         return <div className="flex justify-center py-8">Loading payments…</div>;
//     }
//     if (error) {
//         return (
//             <div className="text-center py-8 text-red-500">
//                 {error?.data?.message || "Failed to load payments"}
//             </div>
//         );
//     }

//     const {
//         summary = {},
//         bills = [],
//         payments = [],
//         advance = {},
//         session,
//     } = data || {};

//     const dueBalance = Number(summary.dueBalance || 0);
//     const statusColor = (status) => ({
//         clear: "bg-green-100 text-green-800",
//         advanced: "bg-blue-100 text-blue-800",
//         due: "bg-amber-100 text-amber-800",
//         overdue: "bg-red-100 text-red-800",
//         paid: "bg-green-100 text-green-800",
//         partial: "bg-blue-100 text-blue-800",
//         unpaid: "bg-gray-100 text-gray-800",
//     }[status] || "bg-gray-100 text-gray-800");

//     return (
//         <div className="space-y-6">
//             {/* Header */}
//             <div className="flex items-center justify-between">
//                 <div className="flex items-center gap-4">
//                     <Button variant="outline" size="sm" asChild>
//                         <Link to="/student">
//                             <ArrowLeft className="w-4 h-4 mr-2" />
//                             Back to Dashboard
//                         </Link>
//                     </Button>
//                     <div>
//                         <h1 className="text-2xl font-bold">My Payments</h1>
//                         <p className="text-gray-600">Session {session}</p>
//                     </div>
//                 </div>
//             </div>

//             {/* Summary */}
//             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//                 <Card>
//                     <CardContent className="p-5 text-center">
//                         <p className="text-sm text-gray-600">Total Billed</p>
//                         <p className="text-2xl font-bold">{formatBDT(summary.totalFee)}</p>
//                     </CardContent>
//                 </Card>
//                 <Card>
//                     <CardContent className="p-5 text-center">
//                         <p className="text-sm text-gray-600">Total Paid</p>
//                         <p className="text-2xl font-bold text-green-600">
//                             {formatBDT(summary.totalPaid)}
//                         </p>
//                     </CardContent>
//                 </Card>
//                 <Card>
//                     <CardContent className="p-5 text-center">
//                         <p className="text-sm text-gray-600">Outstanding</p>
//                         <p className={`text-2xl font-bold ${dueBalance > 0 ? "text-rose-600" : "text-gray-700"}`}>
//                             {formatBDT(dueBalance)}
//                         </p>
//                     </CardContent>
//                 </Card>
//                 <Card>
//                     <CardContent className="p-5 text-center">
//                         <p className="text-sm text-gray-600">Advance Balance</p>
//                         <p className="text-2xl font-bold text-blue-600">
//                             {formatBDT(advance.amount)}
//                         </p>
//                     </CardContent>
//                 </Card>
//             </div>

//             {/* Monthly Bills */}
//             <Card>
//                 <CardHeader>
//                     <CardTitle>Monthly Bills</CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                     {bills.length === 0 ? (
//                         <p className="text-center py-6 text-gray-500 text-sm">
//                             No bills for this session.
//                         </p>
//                     ) : (
//                         <div className="space-y-4">
//                             {bills.map((bill) => (
//                                 <div key={bill.monthKey} className="border rounded-lg overflow-hidden">
//                                     <div className="flex items-center justify-between bg-gray-50 px-4 py-3">
//                                         <div className="font-medium">{bill.monthLabel}</div>
//                                         <div className="flex items-center gap-3 text-sm">
//                                             <Badge className={statusColor(bill.status)}>
//                                                 {bill.status.toUpperCase()}
//                                             </Badge>
//                                             <span>
//                                                 Total <strong>{formatBDT(bill.total)}</strong>
//                                                 {" · "}
//                                                 Paid <strong className="text-green-600">{formatBDT(bill.paid)}</strong>
//                                                 {Number(bill.due) > 0 && (
//                                                     <>
//                                                         {" · "}
//                                                         Due <strong className="text-rose-600">{formatBDT(bill.due)}</strong>
//                                                     </>
//                                                 )}
//                                             </span>
//                                         </div>
//                                     </div>
//                                     <Table>
//                                         <TableHeader>
//                                             <TableRow>
//                                                 <TableHead>Fee</TableHead>
//                                                 <TableHead>Due Date</TableHead>
//                                                 <TableHead className="text-right">Amount</TableHead>
//                                                 <TableHead className="text-right">Paid</TableHead>
//                                                 <TableHead className="text-right">Waived</TableHead>
//                                                 <TableHead className="text-right">Advance Used</TableHead>
//                                                 <TableHead className="text-right">Due</TableHead>
//                                                 <TableHead>Status</TableHead>
//                                             </TableRow>
//                                         </TableHeader>
//                                         <TableBody>
//                                             {bill.items.map((item) => (
//                                                 <TableRow key={item._id}>
//                                                     <TableCell className="font-medium">{item.title}</TableCell>
//                                                     <TableCell>{formatDate(item.dueDate)}</TableCell>
//                                                     <TableCell className="text-right">
//                                                         {formatBDT(item.totalAmount)}
//                                                     </TableCell>
//                                                     <TableCell className="text-right text-green-600">
//                                                         {formatBDT(item.paidAmount)}
//                                                     </TableCell>
//                                                     <TableCell className="text-right text-purple-600">
//                                                         {formatBDT(item.waivedAmount)}
//                                                     </TableCell>
//                                                     <TableCell className="text-right text-blue-600">
//                                                         {formatBDT(item.advanceUsed)}
//                                                     </TableCell>
//                                                     <TableCell className={`text-right font-medium ${
//                                                         Number(item.dueAmount) > 0 ? "text-rose-600" : "text-gray-500"
//                                                     }`}>
//                                                         {formatBDT(item.dueAmount)}
//                                                     </TableCell>
//                                                     <TableCell>
//                                                         <Badge variant="outline">{item.status}</Badge>
//                                                     </TableCell>
//                                                 </TableRow>
//                                             ))}
//                                         </TableBody>
//                                     </Table>
//                                 </div>
//                             ))}
//                         </div>
//                     )}
//                 </CardContent>
//             </Card>

//             {/* Payment History */}
//             <Card>
//                 <CardHeader>
//                     <CardTitle>Receipts</CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                     {payments.length === 0 ? (
//                         <p className="text-center py-6 text-gray-500 text-sm">
//                             No payments recorded yet.
//                         </p>
//                     ) : (
//                         <Table>
//                             <TableHeader>
//                                 <TableRow>
//                                     <TableHead>Receipt</TableHead>
//                                     <TableHead>Date</TableHead>
//                                     <TableHead>Method</TableHead>
//                                     <TableHead className="text-right">Amount</TableHead>
//                                     <TableHead>Status</TableHead>
//                                     <TableHead />
//                                 </TableRow>
//                             </TableHeader>
//                             <TableBody>
//                                 {payments.map((p) => (
//                                     <TableRow key={p._id}>
//                                         <TableCell className="font-mono text-sm">
//                                             {p.receiptNumber}
//                                         </TableCell>
//                                         <TableCell>{formatDate(p.createdAt)}</TableCell>
//                                         <TableCell className="capitalize">
//                                             {String(p.method).replace("_", " ")}
//                                         </TableCell>
//                                         <TableCell className="text-right font-semibold">
//                                             {formatBDT(p.amount)}
//                                         </TableCell>
//                                         <TableCell>
//                                             <Badge variant="outline">{p.status}</Badge>
//                                         </TableCell>
//                                         <TableCell>
//                                             {p.status === "completed" && (
//                                                 <Button variant="outline" size="sm" asChild>
//                                                     <a
//                                                         href={`${import.meta.env.VITE_API_URL}/pdf/receipt/${p._id}`}
//                                                         target="_blank"
//                                                         rel="noopener noreferrer"
//                                                     >
//                                                         <Download className="w-3 h-3 mr-1" />
//                                                         Receipt
//                                                     </a>
//                                                 </Button>
//                                             )}
//                                         </TableCell>
//                                     </TableRow>
//                                 ))}
//                             </TableBody>
//                         </Table>
//                     )}
//                 </CardContent>
//             </Card>

//             {/* Advance */}
//             {Number(advance.amount) > 0 && (
//                 <Card>
//                     <CardContent className="p-5 flex items-center gap-3">
//                         <Wallet className="w-5 h-5 text-blue-600" />
//                         <div>
//                             <p className="text-sm text-gray-600">Advance balance available</p>
//                             <p className="font-semibold">
//                                 {formatBDT(advance.amount)} — will be auto-applied to future fees.
//                             </p>
//                         </div>
//                     </CardContent>
//                 </Card>
//             )}
//         </div>
//     );
// }