// src/components/finance/adjustments/AdjustmentWorkflowTable.jsx
import { useMemo, useState } from 'react';
import {
    Search, RefreshCw, CheckCircle2, XCircle, Play, Eye, Sliders,
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
    FinanceEmptyState, FinanceLoading, MoneyDisplay, StatusBadge,
} from '@/components/finance';
import { useFinanceTheme } from '@/hooks/finance/useFinanceTheme';
import { useFinancePermissions } from '@/hooks/finance/useFinancePermissions';
import { useListAdjustmentsQuery } from '@/features/apis/finance/adjustmentApi';
import {
    getAdjustmentStatusLabel, getAdjustmentTypeLabel,
    getAdjustmentCategoryLabel, ADJUSTMENT_STATUS_LABELS,
} from '@/lib/financeUtils';
import { formatDate } from '@/lib/formaters';

/**
 * Props:
 *   statusFilter
 *   onApprove / onReject / onApply / onView
 */
export default function AdjustmentWorkflowTable({
    statusFilter = 'all',
    onApprove,
    onReject,
    onApply,
    onView,
}) {
    const theme = useFinanceTheme();
    const can = useFinancePermissions();
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState(statusFilter);

    const { data, isLoading, isFetching, refetch } = useListAdjustmentsQuery({
        status: status === 'all' ? undefined : status,
        limit: 100,
    });
    const adjustments = data?.data || [];

    const filtered = useMemo(() => {
        if (!search) return adjustments;
        const q = search.toLowerCase();
        return adjustments.filter((a) =>
            (a.student?.name || '').toLowerCase().includes(q) ||
            (a.reason || '').toLowerCase().includes(q) ||
            (a.adjustmentNumber || '').toLowerCase().includes(q)
        );
    }, [adjustments, search]);

    return (
        <Card className={`border shadow-sm ${theme.card}`}>
            <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <CardTitle className={`text-lg ${theme.text}`}>
                        Adjustments ({filtered.length})
                    </CardTitle>
                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="relative">
                            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${theme.textMuted}`} />
                            <Input
                                placeholder="Search…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className={`pl-10 w-[240px] ${theme.input}`}
                            />
                        </div>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className={`w-[150px] ${theme.select}`}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className={theme.selectContent}>
                                <SelectItem value="all" className={theme.selectItem}>All</SelectItem>
                                {Object.entries(ADJUSTMENT_STATUS_LABELS).map(([k, v]) => (
                                    <SelectItem key={k} value={k} className={theme.selectItem}>{v}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => refetch()}
                            className={theme.outlineBtn}
                        >
                            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                {isLoading ? (
                    <FinanceLoading rows={5} />
                ) : filtered.length === 0 ? (
                    <FinanceEmptyState
                        icon={Sliders}
                        title="No adjustments"
                        description="Adjustments requested against student balances appear here."
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className={theme.tableHeader}>
                                <TableRow>
                                    <TableHead className={theme.textMuted}>Student</TableHead>
                                    <TableHead className={theme.textMuted}>Type</TableHead>
                                    <TableHead className={theme.textMuted}>Category</TableHead>
                                    <TableHead className={`text-right ${theme.textMuted}`}>Amount</TableHead>
                                    <TableHead className={theme.textMuted}>Status</TableHead>
                                    <TableHead className={theme.textMuted}>Date</TableHead>
                                    <TableHead className={`text-right ${theme.textMuted}`}>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map((a) => (
                                    <TableRow key={a._id} className={theme.row}>
                                        <TableCell>
                                            <div className="min-w-0">
                                                <p className={`text-sm font-medium truncate ${theme.text}`}>
                                                    {a.student?.name || '—'}
                                                </p>
                                                <p className={`text-xs ${theme.textMuted}`}>
                                                    Roll {a.student?.rollNumber || '—'}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`text-xs font-medium ${
                                                a.type === 'credit'
                                                    ? theme.isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
                                                    : theme.isDarkMode ? 'text-red-400' : 'text-red-600'
                                            }`}>
                                                {getAdjustmentTypeLabel(a.type)}
                                            </span>
                                        </TableCell>
                                        <TableCell className={`text-sm ${theme.textSoft}`}>
                                            {getAdjustmentCategoryLabel(a.category)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <MoneyDisplay
                                                value={a.amount}
                                                size="sm"
                                                tone={a.type === 'credit' ? 'positive' : 'negative'}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge
                                                domain="adjustment"
                                                status={a.status}
                                                label={getAdjustmentStatusLabel(a.status)}
                                            />
                                        </TableCell>
                                        <TableCell className={`text-xs ${theme.textMuted}`}>
                                            {formatDate(a.createdAt)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost" size="sm"
                                                    onClick={() => onView?.(a)}
                                                    className={theme.ghostBtn}
                                                    title="View"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>

                                                {a.status === 'pending' && can.canApproveAdjustment && (
                                                    <>
                                                        <Button
                                                            variant="ghost" size="sm"
                                                            onClick={() => onApprove?.(a)}
                                                            className={`${theme.ghostBtn} hover:text-emerald-500`}
                                                            title="Approve"
                                                        >
                                                            <CheckCircle2 className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost" size="sm"
                                                            onClick={() => onReject?.(a)}
                                                            className={`${theme.ghostBtn} hover:text-red-500`}
                                                            title="Reject"
                                                        >
                                                            <XCircle className="w-4 h-4" />
                                                        </Button>
                                                    </>
                                                )}

                                                {a.status === 'approved' && can.canApplyAdjustment && (
                                                    <Button
                                                        variant="ghost" size="sm"
                                                        onClick={() => onApply?.(a)}
                                                        className={`${theme.ghostBtn} hover:text-blue-500`}
                                                        title="Apply"
                                                    >
                                                        <Play className="w-4 h-4" />
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
            </CardContent>
        </Card>
    );
}