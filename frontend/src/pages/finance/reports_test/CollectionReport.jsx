// src/pages/finance/reports/CollectionReport.jsx
import { useMemo, useState } from 'react';
import {
    BarChart3, Download, TrendingUp, Receipt, CreditCard, Users, Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    FinancePageHeader, FinanceStatCard, FinanceEmptyState, FinanceLoading,
    MoneyDisplay, SessionSelector,
} from '@/components/finance';
import { useFinanceTheme } from '@/hooks/finance/useFinanceTheme';
import { useFinancePermissions } from '@/hooks/finance/useFinancePermissions';
import {
    useGetPaymentCollectionReportQuery,
    useGetFeeCollectionReportQuery,
} from '@/features/apis/finance/reportApi';
import { useCurrentSession } from '@/hooks/useCurrentSession';
import { formatDate, formatPercent, toMoneyNumber } from '@/lib/formaters';
import { getPaymentMethodLabel, PAYMENT_METHOD_LABELS } from '@/lib/financeUtils';
import { downloadAuthenticatedFile } from '@/lib/downloadFile';
import { useAppSelector } from '@/features/store';
import { toast } from 'sonner';

export default function CollectionReport() {
    const theme = useFinanceTheme();
    const can = useFinancePermissions();
    const token = useAppSelector((s) => s.auth?.token);
    const { selectedSession } = useCurrentSession();

    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const [session, setSession] = useState(selectedSession || '');
    const [startDate, setStartDate] = useState(firstDay.toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(lastDay.toISOString().split('T')[0]);
    const [method, setMethod] = useState('all');

    const {
        data: payRes,
        isLoading: loadingPay,
        refetch: refetchPay,
    } = useGetPaymentCollectionReportQuery({
        session,
        startDate,
        endDate,
        method: method === 'all' ? undefined : method,
    });

    const {
        data: feeRes,
        isLoading: loadingFee,
        refetch: refetchFee,
    } = useGetFeeCollectionReportQuery({
        session,
        startDate,
        endDate,
    });

    const pay = payRes?.data || {};
    const fee = feeRes?.data || {};
    const feeSummary = fee.summary || {};

    const handleExport = async () => {
        try {
            await downloadAuthenticatedFile(
                `/reports/collection/export?session=${session}&startDate=${startDate}&endDate=${endDate}`,
                `collection-${session}.csv`,
                token
            );
        } catch (err) {
            toast.error(err.message || 'Export failed');
        }
    };

    const handleRefetch = () => {
        refetchPay();
        refetchFee();
    };

    const isLoading = loadingPay || loadingFee;

    return (
        <div className={`space-y-6 ${theme.text}`}>
            <FinancePageHeader
                title="Collection Report"
                subtitle="Analyze payment and fee collection patterns."
                breadcrumb={[
                    { label: 'Finance', to: '/admin/finance' },
                    { label: 'Reports' },
                    { label: 'Collection' },
                ]}
                actions={
                    <>
                        <Button
                            variant="outline"
                            onClick={handleRefetch}
                            className={theme.outlineBtn}
                        >
                            <Filter className="w-4 h-4 mr-2" />
                            Refresh
                        </Button>
                        {can.canExportReports && (
                            <Button onClick={handleExport} className={theme.primaryBtn}>
                                <Download className="w-4 h-4 mr-2" />
                                Export CSV
                            </Button>
                        )}
                    </>
                }
            />

            {/* Filters */}
            <Card className={`border shadow-sm ${theme.card}`}>
                <CardContent className="pt-5">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                        <div className="space-y-1.5">
                            <label className={`text-xs font-medium ${theme.textMuted}`}>From</label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className={theme.input}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className={`text-xs font-medium ${theme.textMuted}`}>To</label>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className={theme.input}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className={`text-xs font-medium ${theme.textMuted}`}>Session</label>
                            <SessionSelector value={session} onChange={setSession} width="w-full" />
                        </div>
                        <div className="space-y-1.5">
                            <label className={`text-xs font-medium ${theme.textMuted}`}>Method</label>
                            <Select value={method} onValueChange={setMethod}>
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
                        <div className="flex items-end">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setStartDate(firstDay.toISOString().split('T')[0]);
                                    setEndDate(lastDay.toISOString().split('T')[0]);
                                    setMethod('all');
                                }}
                                className={`w-full ${theme.outlineBtn}`}
                            >
                                Reset
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <FinanceStatCard
                    label="Total Collected"
                    value={<MoneyDisplay value={pay.totalAmount || 0} size="xl" tone="positive" />}
                    subtitle={`${pay.totalTransactions || 0} transactions`}
                    icon={CreditCard}
                    accent="green"
                />
                <FinanceStatCard
                    label="Average Payment"
                    value={<MoneyDisplay value={pay.averageTransaction || 0} size="xl" />}
                    icon={TrendingUp}
                    accent="blue"
                />
                <FinanceStatCard
                    label="Collection Rate"
                    value={formatPercent(pay.collectionRate || feeSummary.collectionRate || 0)}
                    subtitle="of total billed"
                    icon={BarChart3}
                    accent="purple"
                    progress={Math.min(pay.collectionRate || feeSummary.collectionRate || 0, 100)}
                />
                <FinanceStatCard
                    label="Total Billed"
                    value={<MoneyDisplay value={feeSummary.totalGenerated || 0} size="xl" />}
                    subtitle={`${feeSummary.count || 0} fee instances`}
                    icon={Receipt}
                    accent="yellow"
                />
            </div>

            {/* Tabs */}
            <Tabs defaultValue="payments" className="space-y-4">
                <TabsList className={theme.isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}>
                    <TabsTrigger value="payments">Payments</TabsTrigger>
                    <TabsTrigger value="fees">Fees</TabsTrigger>
                    <TabsTrigger value="methods">By Method</TabsTrigger>
                    <TabsTrigger value="top">Top Students</TabsTrigger>
                </TabsList>

                {/* Payments */}
                <TabsContent value="payments">
                    <Card className={`border shadow-sm ${theme.card}`}>
                        <CardHeader className="pb-3">
                            <CardTitle className={`text-lg ${theme.text}`}>
                                Daily Collection
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {isLoading ? (
                                <FinanceLoading rows={5} />
                            ) : !pay.dailyCollection?.length ? (
                                <FinanceEmptyState
                                    icon={BarChart3}
                                    title="No daily collection data"
                                    description="Try adjusting the date range."
                                />
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader className={theme.tableHeader}>
                                            <TableRow>
                                                <TableHead className={theme.textMuted}>Date</TableHead>
                                                <TableHead className={`text-right ${theme.textMuted}`}>Amount</TableHead>
                                                <TableHead className={`text-right ${theme.textMuted}`}>Transactions</TableHead>
                                                <TableHead className={`text-right ${theme.textMuted}`}>Average</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {pay.dailyCollection.map((d, i) => (
                                                <TableRow key={i} className={theme.row}>
                                                    <TableCell className={`text-sm ${theme.text}`}>
                                                        {formatDate(d.date)}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <MoneyDisplay value={d.amount} size="sm" tone="positive" />
                                                    </TableCell>
                                                    <TableCell className={`text-right text-sm ${theme.textSoft}`}>
                                                        {d.transactions}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <MoneyDisplay
                                                            value={d.transactions > 0 ? d.amount / d.transactions : 0}
                                                            size="sm"
                                                            tone="muted"
                                                        />
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

                {/* Fees */}
                <TabsContent value="fees">
                    <div className="space-y-4">
                        {/* Status distribution */}
                        {fee.statusDistribution?.length > 0 && (
                            <Card className={`border shadow-sm ${theme.card}`}>
                                <CardHeader className="pb-3">
                                    <CardTitle className={`text-lg ${theme.text}`}>
                                        Fee Status Distribution
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {fee.statusDistribution.map((s, i) => (
                                            <div
                                                key={i}
                                                className={`p-4 rounded-lg border text-center ${theme.cardSolid}`}
                                            >
                                                <p className={`text-xs uppercase tracking-wider font-medium ${theme.textMuted}`}>
                                                    {s._id || 'Unknown'}
                                                </p>
                                                <p className={`text-xl font-bold mt-1 ${theme.text}`}>
                                                    {s.count || 0}
                                                </p>
                                                <div className="mt-2">
                                                    <MoneyDisplay value={s.totalAmount || 0} size="sm" tone="muted" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Class-wise */}
                        <Card className={`border shadow-sm ${theme.card}`}>
                            <CardHeader className="pb-3">
                                <CardTitle className={`text-lg ${theme.text}`}>
                                    Class-wise Collection
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                {!fee.classWise?.length ? (
                                    <FinanceEmptyState
                                        icon={Users}
                                        title="No class-wise data"
                                    />
                                ) : (
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
                                                {fee.classWise.map((c, i) => {
                                                    const billed = toMoneyNumber(c.totalFee);
                                                    const paid = toMoneyNumber(c.totalPaid);
                                                    const rate = billed > 0 ? (paid / billed) * 100 : 0;
                                                    return (
                                                        <TableRow key={i} className={theme.row}>
                                                            <TableCell className={`text-sm font-medium ${theme.text}`}>
                                                                {c.className || '—'}
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
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* By Method */}
                <TabsContent value="methods">
                    <Card className={`border shadow-sm ${theme.card}`}>
                        <CardHeader className="pb-3">
                            <CardTitle className={`text-lg ${theme.text}`}>
                                Collection by Method
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {!pay.byMethod?.length ? (
                                <FinanceEmptyState icon={CreditCard} title="No payment data" />
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                                    {pay.byMethod.map((m, i) => (
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
                                            <p className={`text-xs ${theme.textMuted} mt-1`}>
                                                {m.count || 0} trx • {m.percentage?.toFixed(1) || 0}%
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Top Students */}
                <TabsContent value="top">
                    <Card className={`border shadow-sm ${theme.card}`}>
                        <CardHeader className="pb-3">
                            <CardTitle className={`text-lg ${theme.text}`}>
                                Top Contributing Students
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {!pay.topStudents?.length ? (
                                <FinanceEmptyState icon={Users} title="No student data" />
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader className={theme.tableHeader}>
                                            <TableRow>
                                                <TableHead className={theme.textMuted}>#</TableHead>
                                                <TableHead className={theme.textMuted}>Student</TableHead>
                                                <TableHead className={theme.textMuted}>Class</TableHead>
                                                <TableHead className={`text-right ${theme.textMuted}`}>Total Paid</TableHead>
                                                <TableHead className={`text-right ${theme.textMuted}`}>Payments</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {pay.topStudents.map((s, i) => (
                                                <TableRow key={i} className={theme.row}>
                                                    <TableCell className={`text-xs font-semibold ${theme.textMuted}`}>
                                                        #{i + 1}
                                                    </TableCell>
                                                    <TableCell className={`text-sm font-medium ${theme.text}`}>
                                                        {s.name}
                                                    </TableCell>
                                                    <TableCell className={`text-sm ${theme.textSoft}`}>
                                                        {s.class || '—'}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <MoneyDisplay value={s.amount} size="sm" tone="positive" />
                                                    </TableCell>
                                                    <TableCell className={`text-right text-sm ${theme.textSoft}`}>
                                                        {s.payments}
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