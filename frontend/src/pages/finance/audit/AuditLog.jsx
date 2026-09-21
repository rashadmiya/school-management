// src/pages/finance/audit/AuditLog.jsx
import {
    FinanceEmptyState, FinanceLoading,
    FinancePageHeader,
    FinanceStatCard
} from '@/components/finance';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useGetAuditLogsQuery } from '@/features/apis/finance/auditApi';
import { useDebouncedValue } from '@/hooks/finance/useDebouncedValue';
import { useFinancePermissions } from '@/hooks/finance/useFinancePermissions';
import { useFinanceTheme } from '@/hooks/finance/useFinanceTheme';
import { formatDateTime } from '@/lib/formaters';
import { Calendar, FileText, RefreshCw, Search, Shield, User } from 'lucide-react';
import { useState } from 'react';

const ACTION_OPTIONS = [
    'payment.received', 'payment.voided', 'payment.refunded',
    'fee.created', 'fee.applied', 'fee.updated', 'fee.deleted',
    'waiver.requested', 'waiver.approved', 'waiver.rejected', 'waiver.revoked',
    'refund.requested', 'refund.approved', 'refund.rejected', 'refund.processed',
    'adjustment.created',
    'advance.credited', 'advance.debited',
    'intent.created', 'intent.confirmed', 'intent.failed',
];

export default function AuditLog() {
    const theme = useFinanceTheme();
    const can = useFinancePermissions();

    const [search, setSearch] = useState('');
    const [action, setAction] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const debounced = useDebouncedValue(search, 300);

    const { data, isLoading, isFetching, refetch } = useGetAuditLogsQuery({
        action: action === 'all' ? undefined : action,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        limit: 100,
    });
    const logs = data?.data || [];

    // Client-side search across description, actor, and student
    const filtered = debounced
        ? logs.filter((l) => {
            const q = debounced.toLowerCase();
            return (
                (l.description || '').toLowerCase().includes(q) ||
                (l.actor?.name || '').toLowerCase().includes(q) ||
                (l.student?.name || '').toLowerCase().includes(q) ||
                (l.action || '').toLowerCase().includes(q) ||
                (l.refNumber || '').toLowerCase().includes(q)
            );
        })
        : logs;

    if (!can.canViewAudit) {
        return (
            <div className={`p-6 ${theme.text}`}>
                <Card className={`border shadow-sm ${theme.card}`}>
                    <FinanceEmptyState
                        icon={Shield}
                        title="Access denied"
                        description="You don't have permission to view audit logs."
                    />
                </Card>
            </div>
        );
    };

    function describeLog(l) {
    if (l.reason) return l.reason;
    if (l.notes) return l.notes;
    if (l.refNumber) return l.refNumber;
    if (l.after?.title) return l.after.title;
    if (l.after?.amount) return `Amount: ${l.after.amount}`;
    return '—';
}

    const uniqueActors = new Set(logs.map((l) => l.actor?._id || l.actor)).size;

    return (
        <div className={`space-y-6 ${theme.text}`}>
            <FinancePageHeader
                title="Audit Log"
                subtitle="Every finance action, tracked with who, when, and what."
                breadcrumb={[
                    { label: 'Finance', to: '/admin/finance' },
                    { label: 'Audit Log' },
                ]}
                actions={
                    <Button variant="outline" onClick={() => refetch()} className={theme.outlineBtn}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                }
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <FinanceStatCard label="Total Entries" value={logs.length} icon={FileText} accent="blue" />
                <FinanceStatCard label="Active Actors" value={uniqueActors} icon={User} accent="purple" />
                <FinanceStatCard label="Action Types" value={new Set(logs.map((l) => l.action)).size} icon={Shield} accent="green" />
                <FinanceStatCard label="Period" value={startDate || endDate ? 'Custom' : 'Latest 100'} icon={Calendar} accent="yellow" />
            </div>

            {/* Filters */}
            <Card className={`border shadow-sm ${theme.card}`}>
                <CardContent className="pt-5">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="relative md:col-span-2">
                            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${theme.textMuted}`} />
                            <Input
                                placeholder="Search actor, description, student, ref number…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className={`pl-10 ${theme.input}`}
                            />
                        </div>
                        <Select value={action} onValueChange={setAction}>
                            <SelectTrigger className={theme.select}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className={theme.selectContent}>
                                <SelectItem value="all" className={theme.selectItem}>All Actions</SelectItem>
                                {ACTION_OPTIONS.map((a) => (
                                    <SelectItem key={a} value={a} className={theme.selectItem}>{a}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <div className="flex items-center gap-2">
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className={theme.input}
                                placeholder="From"
                            />
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className={theme.input}
                                placeholder="To"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card className={`border shadow-sm ${theme.card}`}>
                <CardHeader className="pb-3">
                    <CardTitle className={`text-lg ${theme.text}`}>
                        Entries ({filtered.length})
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <FinanceLoading rows={6} />
                    ) : filtered.length === 0 ? (
                        <FinanceEmptyState
                            icon={Shield}
                            title="No audit entries"
                            description="Try adjusting the filters."
                        />
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className={theme.tableHeader}>
                                    <TableRow>
                                        <TableHead className={theme.textMuted}>Time</TableHead>
                                        <TableHead className={theme.textMuted}>Action</TableHead>
                                        <TableHead className={theme.textMuted}>Actor</TableHead>
                                        <TableHead className={theme.textMuted}>Student / Ref</TableHead>
                                        <TableHead className={theme.textMuted}>Description</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filtered.map((l) => (
                                        <TableRow key={l._id} className={theme.row}>
                                            <TableCell className={`text-xs ${theme.textMuted}`}>
                                                {formatDateTime(l.createdAt)}
                                            </TableCell>
                                            <TableCell>
                                                <span className={`text-xs font-mono px-2 py-1 rounded ${
                                                    theme.isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                    {l.action}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="min-w-0">
                                                    <p className={`text-sm font-medium truncate ${theme.text}`}>
                                                        {l.actor?.name || '—'}
                                                    </p>
                                                    {l.actorRole && (
                                                        <p className={`text-xs ${theme.textMuted}`}>
                                                            {l.actorRole}
                                                        </p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="min-w-0">
                                                    {l.student && (
                                                        <p className={`text-sm truncate ${theme.text}`}>
                                                            {l.student.name}
                                                        </p>
                                                    )}
                                                    {l.refNumber && (
                                                        <p className={`text-xs font-mono ${theme.textMuted}`}>
                                                            {l.refNumber}
                                                        </p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className={`text-sm max-w-[300px] truncate ${theme.textMuted}`}>
                                                {describeLog(l)}
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