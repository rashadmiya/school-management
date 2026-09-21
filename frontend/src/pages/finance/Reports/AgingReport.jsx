// src/pages/finance/reports/AgingReport.jsx
import { useState } from 'react';
import { AlertTriangle, Download, Users, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    FinancePageHeader, FinanceStatCard, FinanceEmptyState, FinanceLoading,
    MoneyDisplay, SessionSelector,
} from '@/components/finance';
import AgingBuckets from '@/components/finance/reports/AgingBuckets';
import { useFinanceTheme } from '@/hooks/finance/useFinanceTheme';
import { useFinancePermissions } from '@/hooks/finance/useFinancePermissions';
import { useGetAgingReportQuery } from '@/features/apis/finance/reconciliationApi';
import { useCurrentSession } from '@/hooks/useCurrentSession';
import { toMoneyNumber } from '@/lib/formaters';

export default function AgingReport() {
    const theme = useFinanceTheme();
    const can = useFinancePermissions();
    const { selectedSession } = useCurrentSession();

    const [session, setSession] = useState(selectedSession || '');
    const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);

    const { data, isLoading, refetch } = useGetAgingReportQuery({
        session,
        asOfDate,
    });

    const report = data?.data || {};
    const totals = report.totals || {};

    const grandTotal = ['0-30', '31-60', '61-90', '90+']
        .reduce((s, k) => s + toMoneyNumber(totals[k] || 0), 0);

    return (
        <div className={`space-y-6 ${theme.text}`}>
            <FinancePageHeader
                title="Aging Report"
                subtitle="How long students have been owing money."
                breadcrumb={[
                    { label: 'Finance', to: '/admin/finance' },
                    { label: 'Reports' },
                    { label: 'Aging' },
                ]}
                actions={
                    <>
                        <SessionSelector value={session} onChange={setSession} width="w-[160px]" />
                        <Button variant="outline" onClick={() => refetch()} className={theme.outlineBtn}>
                            <Filter className="w-4 h-4 mr-2" />
                            Refresh
                        </Button>
                    </>
                }
            />

            <Card className={`border shadow-sm ${theme.card}`}>
                <CardContent className="pt-5">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="space-y-1.5 md:col-span-2">
                            <label className={`text-xs font-medium ${theme.textMuted}`}>As Of</label>
                            <Input
                                type="date"
                                value={asOfDate}
                                onChange={(e) => setAsOfDate(e.target.value)}
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
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <FinanceStatCard
                            label="Total Outstanding"
                            value={<MoneyDisplay value={grandTotal} size="xl" tone="negative" />}
                            icon={AlertTriangle}
                            accent="red"
                        />
                        <FinanceStatCard
                            label="Students with Debt"
                            value={report.topDebtors?.length || 0}
                            subtitle="Top 20 shown"
                            icon={Users}
                            accent="blue"
                        />
                        <FinanceStatCard
                            label="90+ Days"
                            value={<MoneyDisplay value={totals['90+'] || 0} size="xl" tone="negative" />}
                            subtitle="Critical follow-up"
                            icon={AlertTriangle}
                            accent="red"
                        />
                    </div>

                    {/* Buckets */}
                    <Card className={`border shadow-sm ${theme.card}`}>
                        <CardHeader className="pb-3">
                            <CardTitle className={`text-lg ${theme.text}`}>Aging Buckets</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <AgingBuckets aging={totals} />
                            <p className={`text-xs mt-4 ${theme.textMuted}`}>
                                Buckets show how long fees have been outstanding. Older buckets need urgent follow-up.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Top debtors */}
                    <Card className={`border shadow-sm ${theme.card}`}>
                        <CardHeader className="pb-3">
                            <CardTitle className={`text-lg ${theme.text}`}>
                                Top Debtors
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {!report.topDebtors?.length ? (
                                <FinanceEmptyState
                                    icon={Users}
                                    title="No outstanding balances"
                                    description="No students have overdue fees as of this date."
                                />
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader className={theme.tableHeader}>
                                            <TableRow>
                                                <TableHead className={theme.textMuted}>#</TableHead>
                                                <TableHead className={theme.textMuted}>Student</TableHead>
                                                <TableHead className={`text-right ${theme.textMuted}`}>0–30</TableHead>
                                                <TableHead className={`text-right ${theme.textMuted}`}>31–60</TableHead>
                                                <TableHead className={`text-right ${theme.textMuted}`}>61–90</TableHead>
                                                <TableHead className={`text-right ${theme.textMuted}`}>90+</TableHead>
                                                <TableHead className={`text-right ${theme.textMuted}`}>Total</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {report.topDebtors.map((d, i) => (
                                                <TableRow key={d.studentId || i} className={theme.row}>
                                                    <TableCell className={`text-xs font-semibold ${theme.textMuted}`}>
                                                        #{i + 1}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="min-w-0">
                                                            <p className={`text-sm font-medium truncate ${theme.text}`}>
                                                                {d.student}
                                                            </p>
                                                            <p className={`text-xs ${theme.textMuted}`}>
                                                                Roll {d.rollNumber || '—'}
                                                            </p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <MoneyDisplay value={d.buckets?.['0-30'] || 0} size="sm" />
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <MoneyDisplay value={d.buckets?.['31-60'] || 0} size="sm" />
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <MoneyDisplay value={d.buckets?.['61-90'] || 0} size="sm" />
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <MoneyDisplay value={d.buckets?.['90+'] || 0} size="sm" tone="negative" />
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <MoneyDisplay value={d.total} size="sm" tone="negative" />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}