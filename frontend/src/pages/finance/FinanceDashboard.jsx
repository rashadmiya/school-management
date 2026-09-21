// src/pages/finance/FinanceDashboard.jsx
import {
    FinanceEmptyState, FinanceLoading,
    FinancePageHeader, FinanceStatCard,
    MoneyDisplay, SessionSelector
} from '@/components/finance';
import AgingBuckets from '@/components/finance/reports/AgingBuckets';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useGetFinanceDashboardQuery } from '@/features/apis/finance/reportApi';
import { useFinancePermissions } from '@/hooks/finance/useFinancePermissions';
import { useFinanceTheme } from '@/hooks/finance/useFinanceTheme';
import { useCurrentSession } from '@/hooks/useCurrentSession';
import { formatPercent, formatRelativeTime, toMoneyNumber } from '@/lib/formaters';
import {
    AlertCircle, ArrowUpRight, Banknote,
    BarChart3,
    Calendar, Clock,
    CreditCard,
    Eye,
    Receipt,
    RefreshCw,
    Sparkles,
    TrendingUp,
    Trophy,
    Users, Wallet
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function FinanceDashboard() {
    const theme = useFinanceTheme();
    const can = useFinancePermissions();
    const navigate = useNavigate();
    const { selectedSession } = useCurrentSession();

    const [session, setSession] = useState(selectedSession || '');

    const { data, isLoading, isFetching, refetch } = useGetFinanceDashboardQuery(
        { session },
        { refetchOnMountOrArgChange: true }
    );

    const dash = data?.data || {};
    const k = dash.kpis || {};

    if (isLoading) {
        return (
            <div className={`space-y-6 ${theme.text}`}>
                <FinancePageHeader title="Finance Dashboard" />
                <FinanceLoading fullPage />
            </div>
        );
    }

    return (
        <div className={`space-y-6 ${theme.text}`}>
            <FinancePageHeader
                title="Finance Dashboard"
                subtitle={
                    <>
                        Session {dash.session || session}
                        {dash.generatedAt && (
                            <> • Updated {formatRelativeTime(dash.generatedAt)}</>
                        )}
                    </>
                }
                actions={
                    <>
                        <SessionSelector value={session} onChange={setSession} width="w-[170px]" />
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => refetch()}
                            className={theme.outlineBtn}
                            title="Refresh"
                        >
                            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                        </Button>
                        {can.canReceivePayment && (
                            <Button
                                onClick={() => navigate('/admin/finance/payments/receive')}
                                className={theme.primaryBtn}
                            >
                                <CreditCard className="h-4 w-4 mr-2" />
                                Receive Payment
                            </Button>
                        )}
                    </>
                }
            />

            {/* Alerts */}
            {dash.alerts?.length > 0 && (
                <div className="space-y-2">
                    {dash.alerts.map((a, i) => {
                        const cls = a.type === 'error'
                            ? (theme.isDarkMode ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-800')
                            : a.type === 'warning'
                                ? (theme.isDarkMode ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' : 'bg-yellow-50 border-yellow-200 text-yellow-800')
                                : (theme.isDarkMode ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-800');
                        return (
                            <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${cls}`}>
                                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                    <p className="font-medium text-sm">{a.title}</p>
                                    <p className="text-xs opacity-80 mt-0.5">{a.message}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Primary KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <FinanceStatCard
                    label="Total Collection"
                    value={<MoneyDisplay value={k.totalCollection || 0} size="xl" tone="positive" />}
                    subtitle={`${k.totalTransactions || 0} transactions`}
                    icon={Banknote}
                    accent="green"
                    onClick={() => navigate('/admin/finance/payments/history')}
                />
                <FinanceStatCard
                    label="Outstanding"
                    value={<MoneyDisplay value={k.outstandingAmount || 0} size="xl" tone="negative" />}
                    subtitle={`${k.overdueCount || 0} overdue`}
                    icon={AlertCircle}
                    accent={k.overdueCount > 0 ? 'red' : 'green'}
                    onClick={() => navigate('/admin/finance/reports/aging')}
                />
                <FinanceStatCard
                    label="Collection Rate"
                    value={formatPercent(k.collectionRate || 0)}
                    subtitle="of total billed"
                    icon={TrendingUp}
                    accent="purple"
                    progress={Math.min(k.collectionRate || 0, 100)}
                />
                <FinanceStatCard
                    label="Total Students"
                    value={(k.totalStudents || 0).toLocaleString()}
                    subtitle={`${k.activeStudents || 0} active`}
                    icon={Users}
                    accent="blue"
                    onClick={() => navigate('/admin/finance/statement')}
                />
            </div>

            {/* Secondary KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MiniKpi theme={theme} label="Today" value={k.todayCollection} icon={Clock} accent="blue" />
                <MiniKpi theme={theme} label="This Month" value={k.monthCollection} icon={Calendar} accent="green" />
                <MiniKpi theme={theme} label="This Year" value={k.yearCollection} icon={BarChart3} accent="purple" />
                <MiniKpi theme={theme} label="Advance Held" value={k.advanceBalanceTotal} icon={Wallet} accent="yellow" />
            </div>

            {/* Aging + Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className={`lg:col-span-2 border shadow-sm ${theme.card}`}>
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                        <CardTitle className={`text-lg ${theme.text}`}>Receivables Aging</CardTitle>
                        <Button
                            variant="ghost" size="sm"
                            onClick={() => navigate('/admin/finance/reports/aging')}
                            className={theme.ghostBtn}
                        >
                            View report <ArrowUpRight className="w-4 h-4 ml-1" />
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <AgingBuckets aging={dash.aging || {}} />
                        <p className={`text-xs mt-4 ${theme.textMuted}`}>
                            Aging shows how long fees have been outstanding. Older buckets need urgent follow-up.
                        </p>
                    </CardContent>
                </Card>

                <Card className={`border shadow-sm ${theme.card}`}>
                    <CardHeader className="pb-3">
                        <CardTitle className={`text-lg ${theme.text}`}>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {can.canReceivePayment && (
                            <QuickAction
                                theme={theme}
                                label="Receive Payment"
                                description="Record a new payment"
                                icon={CreditCard}
                                onClick={() => navigate('/admin/finance/payments/receive')}
                            />
                        )}
                        {can.canApplyFees && (
                            <QuickAction
                                theme={theme}
                                label="Apply Fees"
                                description="Bulk-assign a fee template"
                                icon={Sparkles}
                                onClick={() => navigate('/admin/finance/fees/apply')}
                            />
                        )}
                        {can.canProcessRefund && (
                            <QuickAction
                                theme={theme}
                                label="Process Refund"
                                description="Approve or process refunds"
                                icon={RefreshCw}
                                onClick={() => navigate('/admin/finance/refunds')}
                            />
                        )}
                        {can.canApproveWaiver && (
                            <QuickAction
                                theme={theme}
                                label="Approve Waivers"
                                description="Review pending waivers"
                                icon={Trophy}
                                onClick={() => navigate('/admin/finance/waivers/approve')}
                            />
                        )}
                        <QuickAction
                            theme={theme}
                            label="View Reconciliation"
                            description="Close the day's cash"
                            icon={Eye}
                            onClick={() => navigate('/admin/finance/reconciliation')}
                        />
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className={`lg:col-span-2 border shadow-sm ${theme.card}`}>
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                        <CardTitle className={`text-lg ${theme.text}`}>Recent Payments</CardTitle>
                        <Button
                            variant="ghost" size="sm"
                            onClick={() => navigate('/admin/finance/payments/history')}
                            className={theme.ghostBtn}
                        >
                            View all <ArrowUpRight className="w-4 h-4 ml-1" />
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        {!dash.recentPayments?.length ? (
                            <FinanceEmptyState icon={Receipt} title="No recent payments" />
                        ) : (
                            <div className={`divide-y ${theme.divider}`}>
                                {dash.recentPayments.slice(0, 6).map((p) => (
                                    <div
                                        key={p._id}
                                        onClick={() => navigate(`/admin/finance/payments/history`)}
                                        className={`flex items-center justify-between px-6 py-3 cursor-pointer transition-colors ${theme.row}`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
                                                theme.isDarkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'
                                            }`}>
                                                {p.student?.name?.charAt(0) || '?'}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className={`text-sm font-medium truncate ${theme.text}`}>
                                                    {p.student?.name || 'Unknown'}
                                                </p>
                                                <p className={`text-xs truncate ${theme.textMuted}`}>
                                                    {p.student?.class || '—'}
                                                    {p.student?.rollNumber ? ` • Roll ${p.student.rollNumber}` : ''}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right flex-shrink-0 ml-3">
                                            <MoneyDisplay value={p.amount} size="sm" tone="positive" />
                                            <p className={`text-xs ${theme.textMuted}`}>
                                                {p.createdAt ? formatRelativeTime(p.createdAt) : ''}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className={`border shadow-sm ${theme.card}`}>
                    <CardHeader className="pb-3">
                        <CardTitle className={`text-lg ${theme.text}`}>Top Outstanding</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {!dash.topDebtors?.length ? (
                            <FinanceEmptyState icon={Users} title="No outstanding balances" />
                        ) : (
                            <div className={`divide-y ${theme.divider}`}>
                                {dash.topDebtors.slice(0, 6).map((d, idx) => (
                                    <div
                                        key={d.studentId || idx}
                                        onClick={() => navigate(`/admin/finance/students/${d.studentId}/statement`)}
                                        className={`flex items-center justify-between px-6 py-3 cursor-pointer transition-colors ${theme.row}`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <span className={`w-6 text-xs font-semibold ${theme.textMuted}`}>#{idx + 1}</span>
                                            <div className="min-w-0">
                                                <p className={`text-sm font-medium truncate ${theme.text}`}>{d.name}</p>
                                                <p className={`text-xs ${theme.textMuted}`}>Roll {d.rollNumber || '—'}</p>
                                            </div>
                                        </div>
                                        <MoneyDisplay value={d.total} size="sm" tone="negative" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Class-wise Collection */}
            {dash.classWise?.length > 0 && (
                <Card className={`border shadow-sm ${theme.card}`}>
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                        <CardTitle className={`text-lg ${theme.text}`}>Collection by Class</CardTitle>
                        <Button
                            variant="ghost" size="sm"
                            onClick={() => navigate('/admin/finance/reports/collection')}
                            className={theme.ghostBtn}
                        >
                            Full report <ArrowUpRight className="w-4 h-4 ml-1" />
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className={theme.tableHeader}>
                                    <TableRow>
                                        <TableHead className={theme.textMuted}>Class</TableHead>
                                        <TableHead className={`text-right ${theme.textMuted}`}>Billed</TableHead>
                                        <TableHead className={`text-right ${theme.textMuted}`}>Collected</TableHead>
                                        <TableHead className={`text-right ${theme.textMuted}`}>Outstanding</TableHead>
                                        <TableHead className={`text-right ${theme.textMuted}`}>Rate</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {dash.classWise.map((c) => {
                                        const rate = c.collectionRate || 0;
                                        return (
                                            <TableRow key={c.classId} className={theme.row}>
                                                <TableCell className={`text-sm font-medium ${theme.text}`}>
                                                    {c.className}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <MoneyDisplay value={c.totalFee} size="sm" />
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <MoneyDisplay value={c.totalPaid} size="sm" tone="positive" />
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <MoneyDisplay
                                                        value={c.totalDue}
                                                        size="sm"
                                                        tone={toMoneyNumber(c.totalDue) > 0 ? 'negative' : 'muted'}
                                                    />
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <div className={`w-20 h-1.5 rounded-full ${theme.isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                                            <div
                                                                className={`h-1.5 rounded-full ${
                                                                    rate >= 90 ? 'bg-emerald-500'
                                                                    : rate >= 60 ? 'bg-yellow-500'
                                                                    : 'bg-red-500'
                                                                }`}
                                                                style={{ width: `${Math.min(rate, 100)}%` }}
                                                            />
                                                        </div>
                                                        <span className={`text-xs font-medium w-12 text-right ${theme.text}`}>
                                                            {rate.toFixed(1)}%
                                                        </span>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

function MiniKpi({ theme, label, value, icon: Icon, accent }) {
    const accents = {
        blue:   isDarkModeColor(theme, 'blue'),
        green:  isDarkModeColor(theme, 'green'),
        purple: isDarkModeColor(theme, 'purple'),
        yellow: isDarkModeColor(theme, 'yellow'),
    };
    return (
        <div className={`border rounded-lg p-3 ${theme.card}`}>
            <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-3.5 h-3.5 ${accents[accent] || accents.blue}`} />
                <span className={`text-xs font-medium ${theme.textMuted}`}>{label}</span>
            </div>
            <MoneyDisplay value={value || 0} size="lg" />
        </div>
    );
}

function isDarkModeColor(theme, color) {
    const map = {
        blue:   theme.isDarkMode ? 'text-blue-400'    : 'text-blue-600',
        green:  theme.isDarkMode ? 'text-emerald-400' : 'text-emerald-600',
        purple: theme.isDarkMode ? 'text-purple-400'  : 'text-purple-600',
        yellow: theme.isDarkMode ? 'text-yellow-400'  : 'text-yellow-600',
    };
    return map[color] || map.blue;
}

function QuickAction({ theme, label, description, icon: Icon, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${theme.cardHover} ${theme.border}`}
        >
            <div className={`p-2 rounded-lg ${theme.isDarkMode ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
                <Icon className="w-4 h-4 text-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${theme.text}`}>{label}</p>
                <p className={`text-xs ${theme.textMuted}`}>{description}</p>
            </div>
            <ArrowUpRight className={`w-4 h-4 ${theme.textMuted}`} />
        </button>
    );
}