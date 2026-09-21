// src/pages/finance/reports/Reconciliation.jsx
import { useState } from 'react';
import {
    Banknote, CreditCard, TrendingDown, Sliders, RefreshCw, Printer, Landmark, Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    FinancePageHeader, FinanceStatCard, FinanceEmptyState, FinanceLoading,
    MoneyDisplay, SessionSelector, StatusBadge,
} from '@/components/finance';
import { useFinanceTheme } from '@/hooks/finance/useFinanceTheme';
import { useFinancePermissions } from '@/hooks/finance/useFinancePermissions';
import { useGetDailyReconciliationQuery } from '@/features/apis/finance/reconciliationApi';
import { useCurrentSession } from '@/hooks/useCurrentSession';
import { formatDateTime, toMoneyNumber } from '@/lib/formaters';
import { getPaymentMethodLabel, getAdjustmentCategoryLabel } from '@/lib/financeUtils';

export default function Reconciliation() {
    const theme = useFinanceTheme();
    const can = useFinancePermissions();
    const { selectedSession } = useCurrentSession();

    const [session, setSession] = useState(selectedSession || '');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const { data, isLoading, isFetching, refetch } = useGetDailyReconciliationQuery({
        date,
        session,
    });

    const report = data?.data || {};
    const totals = report.totals || {};
    const byMethod = report.byMethod || [];
    const payments = report.payments || [];
    const refunds = report.refunds || [];
    const adjustments = report.adjustments || [];

    const cashTotal = byMethod.find((m) => m.method === 'cash')?.amount || 0;

    return (
        <div className={`space-y-6 ${theme.text}`}>
            <FinancePageHeader
                title="Daily Reconciliation"
                subtitle="Close the day — verify cash in the drawer matches the system."
                breadcrumb={[
                    { label: 'Finance', to: '/admin/finance' },
                    { label: 'Reconciliation' },
                ]}
                actions={
                    <>
                        <SessionSelector value={session} onChange={setSession} width="w-[160px]" />
                        <Button variant="outline" onClick={() => refetch()} className={theme.outlineBtn}>
                            <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => window.print()}
                            className={theme.outlineBtn}
                        >
                            <Printer className="w-4 h-4 mr-2" />
                            Print
                        </Button>
                    </>
                }
            />

            {/* Date picker */}
            <Card className={`border shadow-sm ${theme.card}`}>
                <CardContent className="pt-5">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="space-y-1.5 md:col-span-2">
                            <label className={`text-xs font-medium ${theme.textMuted}`}>Reconciliation Date</label>
                            <Input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className={theme.input}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {isLoading ? (
                <FinanceLoading fullPage />
            ) : (
                <>
                    {/* Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <FinanceStatCard
                            label="Total Collected"
                            value={<MoneyDisplay value={totals.totalCollected || 0} size="xl" tone="positive" />}
                            icon={CreditCard}
                            accent="green"
                        />
                        <FinanceStatCard
                            label="Cash In Drawer"
                            value={<MoneyDisplay value={cashTotal} size="xl" />}
                            subtitle="Cash method only"
                            icon={Banknote}
                            accent="blue"
                        />
                        <FinanceStatCard
                            label="Total Refunded"
                            value={<MoneyDisplay value={totals.totalRefunded || 0} size="xl" tone="negative" />}
                            icon={TrendingDown}
                            accent="red"
                        />
                        <FinanceStatCard
                            label="Net Cash"
                            value={<MoneyDisplay value={totals.netCash || 0} size="xl" />}
                            subtitle="Collected − refunds + adjustments"
                            icon={Wallet}
                            accent="purple"
                        />
                    </div>

                    {/* By Method */}
                    <Card className={`border shadow-sm ${theme.card}`}>
                        <CardHeader className="pb-3">
                            <CardTitle className={`text-lg ${theme.text}`}>Collection by Method</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {byMethod.length === 0 ? (
                                <FinanceEmptyState icon={Landmark} title="No collections" />
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {byMethod.map((m, i) => (
                                        <div
                                            key={i}
                                            className={`p-4 rounded-lg border text-center ${theme.cardSolid}`}
                                        >
                                            <p className={`text-xs uppercase tracking-wider font-medium ${theme.textMuted}`}>
                                                {getPaymentMethodLabel(m.method)}
                                            </p>
                                            <p className="text-lg font-bold mt-1">
                                                <MoneyDisplay value={m.amount} size="md" />
                                            </p>
                                            <p className={`text-xs ${theme.textMuted} mt-1`}>{m.count} trx</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Payments */}
                    <Card className={`border shadow-sm ${theme.card}`}>
                        <CardHeader className="pb-3">
                            <CardTitle className={`text-lg ${theme.text}`}>
                                Payments ({payments.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {payments.length === 0 ? (
                                <FinanceEmptyState icon={CreditCard} title="No payments on this date" />
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader className={theme.tableHeader}>
                                            <TableRow>
                                                <TableHead className={theme.textMuted}>Time</TableHead>
                                                <TableHead className={theme.textMuted}>Receipt</TableHead>
                                                <TableHead className={theme.textMuted}>Student</TableHead>
                                                <TableHead className={theme.textMuted}>Method</TableHead>
                                                <TableHead className={`text-right ${theme.textMuted}`}>Amount</TableHead>
                                                <TableHead className={theme.textMuted}>Received By</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {payments.map((p, i) => (
                                                <TableRow key={i} className={theme.row}>
                                                    <TableCell className={`text-xs ${theme.textMuted}`}>
                                                        {formatDateTime(p.time).split(',')[1] || '—'}
                                                    </TableCell>
                                                    <TableCell className={`text-xs font-mono ${theme.textSoft}`}>
                                                        {p.receiptNumber}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="min-w-0">
                                                            <p className={`text-sm ${theme.text}`}>{p.student}</p>
                                                            <p className={`text-xs ${theme.textMuted}`}>Roll {p.rollNumber}</p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className={`text-sm ${theme.textSoft}`}>
                                                        {getPaymentMethodLabel(p.method)}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <MoneyDisplay value={p.amount} size="sm" tone="positive" />
                                                    </TableCell>
                                                    <TableCell className={`text-xs ${theme.textMuted}`}>
                                                        {p.receivedBy || '—'}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Refunds + Adjustments side by side */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className={`border shadow-sm ${theme.card}`}>
                            <CardHeader className="pb-3">
                                <CardTitle className={`text-lg ${theme.text}`}>
                                    Refunds ({refunds.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                {refunds.length === 0 ? (
                                    <div className={`px-6 py-8 text-sm text-center ${theme.textMuted}`}>
                                        No refunds on this date
                                    </div>
                                ) : (
                                    <div className="divide-y">
                                        {refunds.map((r, i) => (
                                            <div key={i} className={`flex items-center justify-between gap-3 px-6 py-3 ${theme.row}`}>
                                                <div className="min-w-0">
                                                    <p className={`text-sm font-medium truncate ${theme.text}`}>
                                                        {r.student}
                                                    </p>
                                                    <p className={`text-xs font-mono ${theme.textMuted}`}>
                                                        {r.refundNumber || '—'}
                                                    </p>
                                                </div>
                                                <MoneyDisplay value={r.amount} size="sm" tone="negative" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className={`border shadow-sm ${theme.card}`}>
                            <CardHeader className="pb-3">
                                <CardTitle className={`text-lg ${theme.text}`}>
                                    Adjustments ({adjustments.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                {adjustments.length === 0 ? (
                                    <div className={`px-6 py-8 text-sm text-center ${theme.textMuted}`}>
                                        No adjustments on this date
                                    </div>
                                ) : (
                                    <div className="divide-y">
                                        {adjustments.map((a, i) => (
                                            <div key={i} className={`flex items-center justify-between gap-3 px-6 py-3 ${theme.row}`}>
                                                <div className="min-w-0">
                                                    <p className={`text-sm font-medium truncate ${theme.text}`}>
                                                        {a.student}
                                                    </p>
                                                    <p className={`text-xs ${theme.textMuted}`}>
                                                        {getAdjustmentCategoryLabel(a.category)}
                                                    </p>
                                                </div>
                                                <MoneyDisplay
                                                    value={a.amount}
                                                    size="sm"
                                                    tone={a.type === 'credit' ? 'positive' : 'negative'}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}
        </div>
    );
}