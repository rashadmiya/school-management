// src/pages/finance/fees/EligibleStudents.jsx
import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Search, Users, CheckCircle, XCircle, Sparkles, UserCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    FinancePageHeader, FinanceStatCard, FinanceEmptyState, FinanceLoading,
    StatusBadge,
} from '@/components/finance';
import { useFinanceTheme } from '@/hooks/finance/useFinanceTheme';
import { useFinancePermissions } from '@/hooks/finance/useFinancePermissions';
import { useGetEligibleStudentsQuery } from '@/features/apis/finance/feeApi';
import { getScopeLabel } from '@/lib/financeUtils';

export default function EligibleStudents() {
    const { id } = useParams();
    const navigate = useNavigate();
    const theme = useFinanceTheme();
    const can = useFinancePermissions();

    const [search, setSearch] = useState('');

    const { data, isLoading } = useGetEligibleStudentsQuery(id);
    const payload = data?.data || {};
    const template = payload.template || {};
    const students = payload.eligibleStudents || [];
    const counts = payload.counts || {};

    const filtered = useMemo(() => {
        if (!search) return students;
        const q = search.toLowerCase();
        return students.filter(
            (s) =>
                s.name?.toLowerCase().includes(q) ||
                s.rollNumber?.toLowerCase().includes(q)
        );
    }, [students, search]);

    if (isLoading) {
        return (
            <div className={`space-y-6 ${theme.text}`}>
                <FinancePageHeader title="Eligible Students" subtitle="Loading…" />
                <FinanceLoading fullPage />
            </div>
        );
    }

    return (
        <div className={`space-y-6 ${theme.text}`}>
            <FinancePageHeader
                title={`Eligible Students`}
                subtitle={
                    <>
                        Template <strong className={theme.text}>{template.title}</strong>
                        {template.scope ? ` • Scope: ${getScopeLabel(template.scope)}` : ''}
                    </>
                }
                breadcrumb={[
                    { label: 'Fee Templates', to: '/admin/finance/fees/templates' },
                    { label: 'Eligible Students' },
                ]}
                actions={
                    <>
                        <Button
                            variant="outline"
                            onClick={() => navigate('/admin/finance/fees/templates')}
                            className={theme.outlineBtn}
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Button>
                        {can.canApplyFees && counts.willBeApplied > 0 && (
                            <Button
                                onClick={() => navigate(`/admin/finance/fees/apply?templateId=${id}`)}
                                className={theme.primaryBtn}
                            >
                                <Sparkles className="w-4 h-4 mr-2" />
                                Apply to {counts.willBeApplied} Student{counts.willBeApplied === 1 ? '' : 's'}
                            </Button>
                        )}
                    </>
                }
            />

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <FinanceStatCard
                    label="Total Eligible"
                    value={counts.total || 0}
                    icon={Users}
                    accent="blue"
                />
                <FinanceStatCard
                    label="Already Have Fee"
                    value={counts.alreadyHasFee || 0}
                    icon={CheckCircle}
                    accent="green"
                    subtitle="Will be skipped"
                />
                <FinanceStatCard
                    label="Will Be Applied"
                    value={counts.willBeApplied || 0}
                    icon={UserCheck}
                    accent="purple"
                    subtitle="New fee instances"
                />
            </div>

            {/* Search */}
            <Card className={`border shadow-sm ${theme.card}`}>
                <CardContent className="pt-5">
                    <div className="relative">
                        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${theme.textMuted}`} />
                        <Input
                            placeholder="Search eligible students..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className={`pl-10 ${theme.input}`}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card className={`border shadow-sm ${theme.card}`}>
                <CardHeader className="pb-3">
                    <CardTitle className={`text-lg ${theme.text}`}>
                        Students ({filtered.length})
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {filtered.length === 0 ? (
                        <FinanceEmptyState
                            icon={Users}
                            title="No eligible students"
                            description="No students match this template's scope in the current session."
                        />
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className={theme.tableHeader}>
                                    <TableRow>
                                        <TableHead className={theme.textMuted}>Student</TableHead>
                                        <TableHead className={theme.textMuted}>Roll</TableHead>
                                        <TableHead className={theme.textMuted}>Class</TableHead>
                                        <TableHead className={theme.textMuted}>Fee Category</TableHead>
                                        <TableHead className={`text-right ${theme.textMuted}`}>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filtered.map((s) => (
                                        <TableRow key={s._id} className={theme.row}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                                                        theme.isDarkMode
                                                            ? 'bg-blue-500/20 text-blue-400'
                                                            : 'bg-blue-100 text-blue-700'
                                                    }`}>
                                                        {s.name?.charAt(0)?.toUpperCase()}
                                                    </div>
                                                    <span className={`text-sm font-medium ${theme.text}`}>
                                                        {s.name}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className={`text-sm ${theme.textSoft}`}>
                                                {s.rollNumber || '—'}
                                            </TableCell>
                                            <TableCell className={`text-sm ${theme.textSoft}`}>
                                                {s.class?.name || '—'}
                                                {s.class?.section?.name ? ` - ${s.class.section.name}` : ''}
                                            </TableCell>
                                            <TableCell className={`text-sm ${theme.textSoft}`}>
                                                {s.feeCategory || '—'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {s.alreadyHasFee ? (
                                                    <StatusBadge
                                                        domain="fee"
                                                        status="paid"
                                                        label="Already has fee"
                                                        icon={CheckCircle}
                                                    />
                                                ) : (
                                                    <StatusBadge
                                                        domain="fee"
                                                        status="unpaid"
                                                        label="Will be applied"
                                                        icon={XCircle}
                                                    />
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}