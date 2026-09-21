// src/components/finance/refunds/RefundApprovalTable.jsx
import { useMemo, useState } from 'react';
import { Search, RefreshCw, CheckCircle2, XCircle, Play, Eye, Receipt } from 'lucide-react';
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
import { useListRefundsQuery } from '@/features/apis/finance/refundApi';
import { getRefundStatusLabel, REFUND_STATUS_LABELS } from '@/lib/financeUtils';
import { formatDate } from '@/lib/formaters';

/**
 * Props:
 *   statusFilter    — string
 *   onApprove       — (refund) => void
 *   onReject        — (refund) => void
 *   onProcess       — (refund) => void
 *   onView          — (refund) => void
 */
export default function RefundApprovalTable({
    statusFilter = 'all',
    onApprove,
    onReject,
    onProcess,
    onView,
}) {
    const theme = useFinanceTheme();
    const can = useFinancePermissions();
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState(statusFilter);

    const { data, isLoading, isFetching, refetch } = useListRefundsQuery({
        status: status === 'all' ? undefined : status,
        limit: 100,
    });
    const refunds = data?.data || [];

    const filtered = useMemo(() => {
        if (!search) return refunds;
        const q = search.toLowerCase();
        return refunds.filter((r) =>
            (r.student?.name || '').toLowerCase().includes(q) ||
            (r.student?.rollNumber || '').toLowerCase().includes(q) ||
            (r.reason || '').toLowerCase().includes(q) ||
            (r.refundNumber || '').toLowerCase().includes(q)
        );
    }, [refunds, search]);

    return (
        <Card className={`border shadow-sm ${theme.card}`}>
            <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <CardTitle className={`text-lg ${theme.text}`}>
                        Refunds ({filtered.length})
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
                                {Object.entries(REFUND_STATUS_LABELS).map(([k, v]) => (
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
                        icon={Receipt}
                        title="No refunds"
                        description="Refunds requested against payments appear here."
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className={theme.tableHeader}>
                                <TableRow>
                                    <TableHead className={theme.textMuted}>Student</TableHead>
                                    <TableHead className={theme.textMuted}>Refund #</TableHead>
                                    <TableHead className={`text-right ${theme.textMuted}`}>Amount</TableHead>
                                    <TableHead className={theme.textMuted}>Reason</TableHead>
                                    <TableHead className={theme.textMuted}>Status</TableHead>
                                    <TableHead className={theme.textMuted}>Requested</TableHead>
                                    <TableHead className={`text-right ${theme.textMuted}`}>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map((r) => (
                                    <TableRow key={r._id} className={theme.row}>
                                        <TableCell>
                                            <div className="min-w-0">
                                                <p className={`text-sm font-medium truncate ${theme.text}`}>
                                                    {r.student?.name || '—'}
                                                </p>
                                                <p className={`text-xs ${theme.textMuted}`}>
                                                    Roll {r.student?.rollNumber || '—'}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell className={`text-xs font-mono ${theme.textSoft}`}>
                                            {r.refundNumber || '—'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <MoneyDisplay value={r.amount} size="sm" tone="negative" />
                                        </TableCell>
                                        <TableCell className={`text-sm max-w-[200px] truncate ${theme.textMuted}`}>
                                            {r.reason || '—'}
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge
                                                domain="refund"
                                                status={r.status}
                                                label={getRefundStatusLabel(r.status)}
                                            />
                                        </TableCell>
                                        <TableCell className={`text-xs ${theme.textMuted}`}>
                                            {formatDate(r.createdAt)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost" size="sm"
                                                    onClick={() => onView?.(r)}
                                                    className={theme.ghostBtn}
                                                    title="View"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>

                                                {r.status === 'pending' && can.canApproveRefund && (
                                                    <>
                                                        <Button
                                                            variant="ghost" size="sm"
                                                            onClick={() => onApprove?.(r)}
                                                            className={`${theme.ghostBtn} hover:text-emerald-500`}
                                                            title="Approve"
                                                        >
                                                            <CheckCircle2 className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost" size="sm"
                                                            onClick={() => onReject?.(r)}
                                                            className={`${theme.ghostBtn} hover:text-red-500`}
                                                            title="Reject"
                                                        >
                                                            <XCircle className="w-4 h-4" />
                                                        </Button>
                                                    </>
                                                )}

                                                {r.status === 'approved' && can.canProcessRefund && (
                                                    <Button
                                                        variant="ghost" size="sm"
                                                        onClick={() => onProcess?.(r)}
                                                        className={`${theme.ghostBtn} hover:text-blue-500`}
                                                        title="Process"
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