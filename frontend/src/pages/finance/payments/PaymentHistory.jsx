// src/pages/finance/payments/PaymentHistory.jsx
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Download, Search, CreditCard, Ban, Receipt, TrendingUp,
    Calendar, RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    FinancePageHeader, FinanceStatCard, FinanceEmptyState, FinanceLoading,
    StatusBadge, SessionSelector, MoneyDisplay, StudentSearchInput,
} from '@/components/finance';
import { useFinanceTheme } from '@/hooks/finance/useFinanceTheme';
import { useFinancePermissions } from '@/hooks/finance/useFinancePermissions';
import { useSearchPaymentsQuery } from '@/features/apis/finance/paymentApi';
import { getPaymentMethodLabel, getPaymentStatusLabel, PAYMENT_METHOD_LABELS } from '@/lib/financeUtils';
import { formatDateTime } from '@/lib/formaters';
import { useCurrentSession } from '@/hooks/useCurrentSession';
import PaymentDetailDrawer from '@/components/finance/payments/PaymentDetailDrawer';
import VoidPaymentDialog from '@/components/finance/payments/VoidPaymentDialog';

export default function PaymentHistory() {
    const theme = useFinanceTheme();
    const can = useFinancePermissions();
    const navigate = useNavigate();
    const { selectedSession } = useCurrentSession();

    const [session, setSession] = useState(selectedSession || '');
    const [method, setMethod] = useState('all');
    const [status, setStatus] = useState('completed');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [limit] = useState(20);

    const [selected, setSelected] = useState(null);
    const [voidTarget, setVoidTarget] = useState(null);

    const { data, isLoading, isFetching, refetch } = useSearchPaymentsQuery({
        search,
        session,
        method: method === 'all' ? undefined : method,
        status,
        page,
        limit,
    });

    const payments = data?.data || [];
    const pagination = data?.pagination || {};

    // Stats from the current page
    const pageTotal = useMemo(
        () => payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0),
        [payments]
    );

    return (
        <div className={`space-y-6 ${theme.text}`}>
            <FinancePageHeader
                title="Payment History"
                subtitle="Browse, search, and manage all fee payments."
                breadcrumb={[
                    { label: 'Finance', to: '/admin/finance' },
                    { label: 'Payments', to: '/admin/finance/payments/history' },
                ]}
                actions={
                    <>
                        {can.canReceivePayment && (
                            <Button
                                onClick={() => navigate('/admin/finance/payments/receive')}
                                className={theme.primaryBtn}
                            >
                                <CreditCard className="w-4 h-4 mr-2" />
                                Receive Payment
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            onClick={() => refetch()}
                            className={theme.outlineBtn}
                        >
                            <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                    </>
                }
            />

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <FinanceStatCard
                    label="Payments on this page"
                    value={payments.length}
                    subtitle={`Page ${pagination.page || 1} of ${pagination.pages || 1}`}
                    icon={Receipt}
                    accent="blue"
                />
                <FinanceStatCard
                    label="Page total"
                    value={<MoneyDisplay value={pageTotal} size="xl" />}
                    subtitle="Sum of visible payments"
                    icon={TrendingUp}
                    accent="green"
                />
                <FinanceStatCard
                    label="Total records"
                    value={pagination.total || 0}
                    icon={Calendar}
                    accent="purple"
                />
            </div>

            {/* Filters */}
            <Card className={`border shadow-sm ${theme.card}`}>
                <CardContent className="pt-5">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="relative md:col-span-2">
                            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${theme.textMuted}`} />
                            <Input
                                placeholder="Search by student name or roll number…"
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                className={`pl-10 ${theme.input}`}
                            />
                        </div>

                        <SessionSelector
                            value={session}
                            onChange={(v) => { setSession(v); setPage(1); }}
                            includeAll
                            width="w-full"
                        />

                        <Select value={method} onValueChange={(v) => { setMethod(v); setPage(1); }}>
                            <SelectTrigger className={theme.select}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className={theme.selectContent}>
                                <SelectItem value="all" className={theme.selectItem}>All Methods</SelectItem>
                                {Object.entries(PAYMENT_METHOD_LABELS).map(([k, v]) => (
                                    <SelectItem key={k} value={k} className={theme.selectItem}>{v}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3">
                        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
                            <SelectTrigger className={theme.select}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className={theme.selectContent}>
                                <SelectItem value="completed" className={theme.selectItem}>Completed</SelectItem>
                                <SelectItem value="voided" className={theme.selectItem}>Voided</SelectItem>
                                <SelectItem value="reversed" className={theme.selectItem}>Reversed</SelectItem>
                                <SelectItem value="failed" className={theme.selectItem}>Failed</SelectItem>
                            </SelectContent>
                        </Select>
                        <div className="md:col-span-3" />
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card className={`border shadow-sm ${theme.card}`}>
                <CardHeader className="pb-3">
                    <CardTitle className={`text-lg ${theme.text}`}>
                        Payments ({pagination.total || 0})
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <FinanceLoading rows={6} />
                    ) : payments.length === 0 ? (
                        <FinanceEmptyState
                            icon={Receipt}
                            title="No payments found"
                            description={
                                search || session || method !== 'all'
                                    ? 'Try adjusting your filters.'
                                    : 'Once payments are received, they appear here.'
                            }
                        />
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className={theme.tableHeader}>
                                    <TableRow>
                                        <TableHead className={theme.textMuted}>Receipt</TableHead>
                                        <TableHead className={theme.textMuted}>Student</TableHead>
                                        <TableHead className={theme.textMuted}>Method</TableHead>
                                        <TableHead className={`text-right ${theme.textMuted}`}>Amount</TableHead>
                                        <TableHead className={theme.textMuted}>Status</TableHead>
                                        <TableHead className={theme.textMuted}>Date</TableHead>
                                        <TableHead className={`text-right ${theme.textMuted}`}>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {payments.map((p) => (
                                        <TableRow
                                            key={p._id}
                                            className={`${theme.row} cursor-pointer transition-colors`}
                                            onClick={() => setSelected(p)}
                                        >
                                            <TableCell className={`text-xs font-mono ${theme.textSoft}`}>
                                                {p.receiptNumber}
                                            </TableCell>
                                            <TableCell>
                                                <div className="min-w-0">
                                                    <p className={`text-sm font-medium truncate ${theme.text}`}>
                                                        {p.student?.name || '—'}
                                                    </p>
                                                    <p className={`text-xs ${theme.textMuted}`}>
                                                        Roll {p.student?.rollNumber || '—'}
                                                        {p.student?.class?.name ? ` • ${p.student.class.name}` : ''}
                                                    </p>
                                                </div>
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
                                                    status={p.status || 'completed'}
                                                    label={getPaymentStatusLabel(p.status || 'completed')}
                                                />
                                            </TableCell>
                                            <TableCell className={`text-xs ${theme.textMuted}`}>
                                                {formatDateTime(p.createdAt)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div
                                                    className="flex items-center justify-end gap-1"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <Button
                                                        variant="ghost" size="sm"
                                                        onClick={() => setSelected(p)}
                                                        className={theme.ghostBtn}
                                                        title="View details"
                                                    >
                                                        <Receipt className="w-4 h-4" />
                                                    </Button>
                                                    {can.canVoidPayment && p.status === 'completed' && (
                                                        <Button
                                                            variant="ghost" size="sm"
                                                            onClick={() => setVoidTarget(p)}
                                                            className={`${theme.ghostBtn} hover:text-red-500`}
                                                            title="Void"
                                                        >
                                                            <Ban className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination.pages > 1 && (
                        <div className={`flex items-center justify-between px-6 py-4 border-t ${theme.border}`}>
                            <span className={`text-sm ${theme.textMuted}`}>
                                Page {pagination.page} of {pagination.pages}
                            </span>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline" size="sm"
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page <= 1}
                                    className={theme.outlineBtn}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline" size="sm"
                                    onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                                    disabled={page >= pagination.pages}
                                    className={theme.outlineBtn}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Detail drawer */}
            <PaymentDetailDrawer
                payment={selected}
                open={!!selected}
                onOpenChange={(o) => !o && setSelected(null)}
                onVoidClick={(p) => { setSelected(null); setVoidTarget(p); }}
            />

            {/* Void dialog */}
            <VoidPaymentDialog
                open={!!voidTarget}
                onOpenChange={(o) => !o && setVoidTarget(null)}
                payment={voidTarget}
                onVoided={() => { setVoidTarget(null); refetch(); }}
            />
        </div>
    );
}