// src/pages/finance/students/StudentFees.jsx
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Search, FileText, ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    FinancePageHeader, FinanceEmptyState, FinanceLoading, FinanceStatCard,
    MoneyDisplay, SessionSelector, StudentSearchInput,
} from '@/components/finance';
import FeeInstanceCard from '@/components/finance/bills/FeeInstanceCard';
import { useFinanceTheme } from '@/hooks/finance/useFinanceTheme';
import { useGetStudentFeesQuery } from '@/features/apis/finance/feeApi';
import { useCurrentSession } from '@/hooks/useCurrentSession';
import { toMoneyNumber } from '@/lib/formaters';

export default function StudentFees() {
    const theme = useFinanceTheme();
    const navigate = useNavigate();
    const params = useParams();
    const { selectedSession } = useCurrentSession();

    const [studentId, setStudentId] = useState(params.studentId || '');
    const [session, setSession] = useState(selectedSession || '');
    const [status, setStatus] = useState('all');
    const [search, setSearch] = useState('');

    const { data, isLoading, isFetching, refetch } = useGetStudentFeesQuery(
        { studentId, session, status: status === 'all' ? undefined : status },
        { skip: !studentId }
    );
    const fees = data?.data || [];

    const filtered = fees.filter((f) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (f.title || f.feeTemplate?.title || '').toLowerCase().includes(q);
    });

    const totals = {
        total: fees.reduce((s, f) => s + toMoneyNumber(f.totalAmount), 0),
        paid: fees.reduce((s, f) => s + toMoneyNumber(f.paidAmount), 0),
        due: fees.reduce((s, f) => s + toMoneyNumber(f.dueAmount), 0),
    };

    if (!studentId) {
        return (
            <div className={`space-y-6 ${theme.text}`}>
                <FinancePageHeader
                    title="Student Fees"
                    subtitle="Search a student to view all applied fees."
                    breadcrumb={[
                        { label: 'Finance', to: '/admin/finance' },
                        { label: 'Students' },
                    ]}
                />
                <Card className={`border shadow-sm ${theme.card}`}>
                    <CardContent className="pt-6 max-w-2xl">
                        <StudentSearchInput
                            value={null}
                            onChange={(s) => s && setStudentId(s._id)}
                            session={session}
                            autoFocus
                        />
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className={`space-y-6 ${theme.text}`}>
            <FinancePageHeader
                title="Student Fees"
                subtitle="All fee instances for this student."
                breadcrumb={[
                    { label: 'Finance', to: '/finance' },
                    { label: 'Students' },
                    { label: studentId.slice(-6) },
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
                            onClick={() => navigate(`/admin/finance/students/${studentId}/statement`)}
                            className={theme.outlineBtn}
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Statement
                        </Button>
                    </>
                }
            />

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <FinanceStatCard label="Total Billed" value={<MoneyDisplay value={totals.total} size="xl" />} icon={FileText} accent="blue" />
                <FinanceStatCard label="Total Paid" value={<MoneyDisplay value={totals.paid} size="xl" tone="positive" />} icon={FileText} accent="green" />
                <FinanceStatCard label="Outstanding" value={<MoneyDisplay value={totals.due} size="xl" tone="negative" />} icon={FileText} accent="red" />
            </div>

            <Card className={`border shadow-sm ${theme.card}`}>
                <CardContent className="pt-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="relative md:col-span-2">
                            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${theme.textMuted}`} />
                            <Input
                                placeholder="Search fee title…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className={`pl-10 ${theme.input}`}
                            />
                        </div>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className={theme.select}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className={theme.selectContent}>
                                <SelectItem value="all" className={theme.selectItem}>All Status</SelectItem>
                                <SelectItem value="unpaid" className={theme.selectItem}>Unpaid</SelectItem>
                                <SelectItem value="partial" className={theme.selectItem}>Partial</SelectItem>
                                <SelectItem value="paid" className={theme.selectItem}>Paid</SelectItem>
                                <SelectItem value="overdue" className={theme.selectItem}>Overdue</SelectItem>
                                <SelectItem value="waived" className={theme.selectItem}>Waived</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {isLoading ? (
                <FinanceLoading fullPage />
            ) : filtered.length === 0 ? (
                <Card className={`border shadow-sm ${theme.card}`}>
                    <FinanceEmptyState
                        icon={FileText}
                        title="No fees"
                        description="No fee instances match the current filters."
                    />
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((f) => (
                        <FeeInstanceCard
                            key={f._id}
                            fee={f}
                            onClick={() => navigate(`/admin/finance/students/${studentId}/statement`)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}