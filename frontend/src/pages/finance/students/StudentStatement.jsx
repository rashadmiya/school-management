// src/pages/finance/students/StudentStatement.jsx
import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
    ArrowLeft, Download, FileText, Receipt, Gift, RefreshCw,
    ExternalLink, Wallet, CreditCard, AlertCircle, RefreshCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    FinancePageHeader, FinanceEmptyState, FinanceLoading, FinanceStatCard,
    MoneyDisplay, StatusBadge, SessionSelector, StudentSearchInput,
} from '@/components/finance';
import StatementSummaryCard from '@/components/finance/bills/StatementSummaryCard';
import MonthlyBillCard from '@/components/finance/bills/MonthlyBillCard';
import { useFinanceTheme } from '@/hooks/finance/useFinanceTheme';
import { useFinancePermissions } from '@/hooks/finance/useFinancePermissions';
import { useGetStudentStatementQuery } from '@/features/apis/finance/billApi';
import { useGetStudentFeesQuery } from '@/features/apis/finance/feeApi';
import { useCurrentSession } from '@/hooks/useCurrentSession';
import {
    getWaiverStatusLabel, getWaiverTypeLabel,
    getRefundStatusLabel, getPaymentMethodLabel, getPaymentStatusLabel,
} from '@/lib/financeUtils';
import { formatDate, formatDateTime, toMoneyNumber } from '@/lib/formaters';
import { downloadAuthenticatedFile } from '@/lib/downloadFile';
import { useAppSelector } from '@/features/store';
import { toast } from 'sonner';

export default function StudentStatement() {
    const theme = useFinanceTheme();
    const can = useFinancePermissions();
    const navigate = useNavigate();
    const params = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const token = useAppSelector((s) => s.auth?.token);

    const { selectedSession } = useCurrentSession();
    const [studentId, setStudentId] = useState(params.studentId || '');
    const [session, setSession] = useState(searchParams.get('session') || selectedSession || '');

    // Whether to show the student picker (when studentId missing)
    const showPicker = !studentId;

    const {
        data: statementRes,
        isLoading,
        isFetching,
        refetch,
    } = useGetStudentStatementQuery(
        { studentId, session },
        { skip: !studentId }
    );
    const statement = statementRes?.data || {};
    const student = statement.student || null;
    const summary = statement.summary || null;
    const bills = statement.bills || [];
    const payments = statement.payments || [];
    const waivers = statement.waivers || [];
    const advance = statement.advance || { amount: '0', currency: 'BDT' };

    // Separate fetch for fee instances (used by a "Fees" tab)
    const { data: feesRes, isLoading: loadingFees } = useGetStudentFeesQuery(
        { studentId, session },
        { skip: !studentId }
    );
    const fees = feesRes?.data || [];

    const handleStudentPick = (s) => {
        if (!s) {
            setStudentId('');
            setSearchParams({});
            return;
        }
        setStudentId(s._id);
        setSearchParams({ session });
    };

    const handleDownloadStatement = async () => {
        try {
            await downloadAuthenticatedFile(
                `/pdf/statement/${studentId}?session=${session}`,
                `statement-${studentId}.pdf`,
                token
            );
        } catch (err) {
            toast.error(err.message || 'Failed to download statement');
        }
    };

    const handleViewStatement = async () => {
        try {
            await downloadAuthenticatedFile(
                `/pdf/statement/${studentId}?session=${session}`,
                `statement-${studentId}.pdf`,
                token,
                { openInNewTab: true }
            );
        } catch (err) {
            toast.error(err.message || 'Failed to open statement');
        }
    };

    // ------- Picker view -------
    if (showPicker) {
        return (
            <div className={`space-y-6 ${theme.text}`}>
                <FinancePageHeader
                    title="Student Statement"
                    subtitle="Search a student to view their full financial statement."
                    breadcrumb={[
                        { label: 'Finance', to: '/admin/finance' },
                        { label: 'Students' },
                    ]}
                />
                <Card className={`border shadow-sm ${theme.card}`}>
                    <CardContent className="pt-6 max-w-2xl">
                        <StudentSearchInput
                            value={null}
                            onChange={handleStudentPick}
                            session={session}
                            autoFocus
                            placeholder="Search by name or roll number…"
                        />
                        <p className={`text-xs ${theme.textMuted} mt-3`}>
                            You can also open a student statement from the payment screen or from a fee instance.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // ------- Loading -------
    if (isLoading) {
        return (
            <div className={`space-y-6 ${theme.text}`}>
                <FinancePageHeader title="Student Statement" subtitle="Loading…" />
                <FinanceLoading fullPage />
            </div>
        );
    }

    // ------- Full page -------
    return (
        <div className={`space-y-6 ${theme.text}`}>
            <FinancePageHeader
                title={student?.name ? `${student.name} — Statement` : 'Student Statement'}
                subtitle={
                    student ? (
                        <>
                            Roll {student.rollNumber || '—'}
                            {student.class ? ` • ${student.class}` : ''}
                            {student.section ? ` - ${student.section}` : ''}
                            {` • Session ${statement.session || session}`}
                        </>
                    ) : ''
                }
                breadcrumb={[
                    { label: 'Finance', to: '/admin/finance' },
                    { label: 'Students' },
                    { label: student?.name || 'Statement' },
                ]}
                actions={
                    <>
                        <SessionSelector
                            value={session}
                            onChange={setSession}
                            width="w-[160px]"
                        />
                        <Button
                            variant="outline"
                            onClick={() => refetch()}
                            className={theme.outlineBtn}
                        >
                            <RefreshCcw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleViewStatement}
                            className={theme.outlineBtn}
                        >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View PDF
                        </Button>
                        <Button
                            onClick={handleDownloadStatement}
                            className={theme.primaryBtn}
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                        </Button>
                    </>
                }
            />

            {/* Summary */}
            {summary && <StatementSummaryCard summary={summary} />}

            {/* Quick stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <FinanceStatCard
                    label="Fees"
                    value={bills.reduce((n, b) => n + (b.items?.length || 0), 0)}
                    subtitle={`${bills.length} month${bills.length === 1 ? '' : 's'}`}
                    icon={FileText}
                    accent="blue"
                />
                <FinanceStatCard
                    label="Payments"
                    value={payments.length}
                    subtitle={`${payments.filter(p => p.status === 'completed').length} completed`}
                    icon={CreditCard}
                    accent="green"
                />
                <FinanceStatCard
                    label="Waivers"
                    value={waivers.length}
                    icon={Gift}
                    accent="purple"
                />
                <FinanceStatCard
                    label="Advance"
                    value={<MoneyDisplay value={advance.amount} size="xl" tone="positive" />}
                    icon={Wallet}
                    accent="yellow"
                />
            </div>

            {/* Tabs */}
            <Tabs defaultValue="bills" className="space-y-4">
                <TabsList className={theme.isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}>
                    <TabsTrigger value="bills">Bills</TabsTrigger>
                    <TabsTrigger value="fees">Fees</TabsTrigger>
                    <TabsTrigger value="payments">Payments</TabsTrigger>
                    <TabsTrigger value="waivers">Waivers</TabsTrigger>
                </TabsList>

                {/* Bills */}
                <TabsContent value="bills">
                    {bills.length === 0 ? (
                        <Card className={`border shadow-sm ${theme.card}`}>
                            <FinanceEmptyState
                                icon={FileText}
                                title="No monthly bills"
                                description="Fees applied to this student appear here, grouped by month."
                            />
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {bills.map((bill, idx) => (
                                <MonthlyBillCard
                                    key={bill.monthKey || idx}
                                    bill={bill}
                                    defaultOpen={idx === 0}
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* Fees */}
                <TabsContent value="fees">
                    <Card className={`border shadow-sm ${theme.card}`}>
                        <CardHeader className="pb-3">
                            <CardTitle className={`text-lg ${theme.text}`}>
                                All Fee Instances ({fees.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {loadingFees ? (
                                <FinanceLoading rows={4} />
                            ) : fees.length === 0 ? (
                                <FinanceEmptyState icon={FileText} title="No fees" />
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader className={theme.tableHeader}>
                                            <TableRow>
                                                <TableHead className={theme.textMuted}>Fee</TableHead>
                                                <TableHead className={theme.textMuted}>Due Date</TableHead>
                                                <TableHead className={`text-right ${theme.textMuted}`}>Total</TableHead>
                                                <TableHead className={`text-right ${theme.textMuted}`}>Paid</TableHead>
                                                <TableHead className={`text-right ${theme.textMuted}`}>Due</TableHead>
                                                <TableHead className={theme.textMuted}>Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {fees.map((f) => (
                                                <TableRow key={f._id} className={theme.row}>
                                                    <TableCell className={`text-sm font-medium ${theme.text}`}>
                                                        {f.title || f.feeTemplate?.title || '—'}
                                                    </TableCell>
                                                    <TableCell className={`text-xs ${theme.textMuted}`}>
                                                        {formatDate(f.dueDate)}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <MoneyDisplay value={f.totalAmount} size="sm" />
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <MoneyDisplay value={f.paidAmount} size="sm" tone="positive" />
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <MoneyDisplay
                                                            value={f.dueAmount}
                                                            size="sm"
                                                            tone={toMoneyNumber(f.dueAmount) > 0 ? 'negative' : 'muted'}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <StatusBadge domain="fee" status={f.status} />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Payments */}
                <TabsContent value="payments">
                    <Card className={`border shadow-sm ${theme.card}`}>
                        <CardHeader className="pb-3">
                            <CardTitle className={`text-lg ${theme.text}`}>
                                Payment History ({payments.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {payments.length === 0 ? (
                                <FinanceEmptyState
                                    icon={Receipt}
                                    title="No payments yet"
                                    description="Payments recorded for this student appear here."
                                />
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader className={theme.tableHeader}>
                                            <TableRow>
                                                <TableHead className={theme.textMuted}>Receipt</TableHead>
                                                <TableHead className={theme.textMuted}>Method</TableHead>
                                                <TableHead className={`text-right ${theme.textMuted}`}>Amount</TableHead>
                                                <TableHead className={theme.textMuted}>Status</TableHead>
                                                <TableHead className={theme.textMuted}>Date</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {payments.map((p) => (
                                                <TableRow key={p._id || p.receiptNumber} className={theme.row}>
                                                    <TableCell className={`text-xs font-mono ${theme.textSoft}`}>
                                                        {p.receiptNumber}
                                                    </TableCell>
                                                    <TableCell className={`text-sm ${theme.textSoft}`}>
                                                        {getPaymentMethodLabel(p.method)}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <MoneyDisplay value={p.amount} size="sm" />
                                                    </TableCell>
                                                    <TableCell>
                                                        <StatusBadge
                                                            domain="payment"
                                                            status={p.status}
                                                            label={getPaymentStatusLabel(p.status)}
                                                        />
                                                    </TableCell>
                                                    <TableCell className={`text-xs ${theme.textMuted}`}>
                                                        {formatDateTime(p.createdAt)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Waivers */}
                <TabsContent value="waivers">
                    <Card className={`border shadow-sm ${theme.card}`}>
                        <CardHeader className="pb-3">
                            <CardTitle className={`text-lg ${theme.text}`}>
                                Waivers ({waivers.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {waivers.length === 0 ? (
                                <FinanceEmptyState
                                    icon={Gift}
                                    title="No waivers"
                                    description="Approved waivers for this student appear here."
                                />
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader className={theme.tableHeader}>
                                            <TableRow>
                                                <TableHead className={theme.textMuted}>Fee</TableHead>
                                                <TableHead className={theme.textMuted}>Type</TableHead>
                                                <TableHead className={`text-right ${theme.textMuted}`}>Amount</TableHead>
                                                <TableHead className={theme.textMuted}>Status</TableHead>
                                                <TableHead className={theme.textMuted}>Approved</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {waivers.map((w) => (
                                                <TableRow key={w._id} className={theme.row}>
                                                    <TableCell className={`text-sm ${theme.text}`}>
                                                        {w.feeTitle || 'Fee'}
                                                    </TableCell>
                                                    <TableCell className={`text-sm ${theme.textSoft}`}>
                                                        {getWaiverTypeLabel(w.type)}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <MoneyDisplay value={w.amount} size="sm" tone="positive" />
                                                    </TableCell>
                                                    <TableCell>
                                                        <StatusBadge
                                                            domain="waiver"
                                                            status={w.status || 'approved'}
                                                            label={getWaiverStatusLabel(w.status || 'approved')}
                                                        />
                                                    </TableCell>
                                                    <TableCell className={`text-xs ${theme.textMuted}`}>
                                                        {w.approvedDate ? formatDate(w.approvedDate) : '—'}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}