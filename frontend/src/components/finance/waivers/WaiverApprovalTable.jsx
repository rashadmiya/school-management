// src/components/finance/waivers/WaiverApprovalTable.jsx
import { useMemo, useState } from 'react';
import { Search, Gift, RefreshCw, Eye } from 'lucide-react';
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
import {
    useGetWaiverRequestsQuery,
} from '@/features/apis/finance/waiverApi';
import {
    getWaiverStatusLabel, getWaiverTypeLabel, WAIVER_STATUS_LABELS,
} from '@/lib/financeUtils';
import { formatDate } from '@/lib/formaters';

/**
 * Props:
 *   statusFilter    — string ('all' or specific status)
 *   onRowClick      — (waiver) => void
 *   title           — table title
 *   emptyMessage    — custom empty state
 */
export default function WaiverApprovalTable({
    statusFilter = 'all',
    onRowClick,
    title = 'Waivers',
    emptyMessage,
}) {
    const theme = useFinanceTheme();
    const [search, setSearch] = useState('');
    const [localStatus, setLocalStatus] = useState(statusFilter);

    const { data, isLoading, isFetching, refetch } = useGetWaiverRequestsQuery({
        status: localStatus === 'all' ? undefined : localStatus,
        limit: 100,
    });

    const waivers = data?.data || [];

    const filtered = useMemo(() => {
        if (!search) return waivers;
        const q = search.toLowerCase();
        return waivers.filter((w) =>
            (w.student?.name || '').toLowerCase().includes(q) ||
            (w.student?.rollNumber || '').toLowerCase().includes(q) ||
            (w.reason || '').toLowerCase().includes(q)
        );
    }, [waivers, search]);

    return (
        <Card className={`border shadow-sm ${theme.card}`}>
            <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <CardTitle className={`text-lg ${theme.text}`}>
                        {title} ({filtered.length})
                    </CardTitle>
                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="relative">
                            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${theme.textMuted}`} />
                            <Input
                                placeholder="Search student or reason…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className={`pl-10 w-[240px] ${theme.input}`}
                            />
                        </div>
                        <Select value={localStatus} onValueChange={setLocalStatus}>
                            <SelectTrigger className={`w-[150px] ${theme.select}`}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className={theme.selectContent}>
                                <SelectItem value="all" className={theme.selectItem}>All</SelectItem>
                                {Object.entries(WAIVER_STATUS_LABELS).map(([k, v]) => (
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
                        icon={Gift}
                        title={emptyMessage?.title || 'No waivers'}
                        description={emptyMessage?.description || 'Nothing to display.'}
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className={theme.tableHeader}>
                                <TableRow>
                                    <TableHead className={theme.textMuted}>Student</TableHead>
                                    <TableHead className={theme.textMuted}>Fee</TableHead>
                                    <TableHead className={theme.textMuted}>Type</TableHead>
                                    <TableHead className={`text-right ${theme.textMuted}`}>Amount</TableHead>
                                    <TableHead className={theme.textMuted}>Status</TableHead>
                                    <TableHead className={theme.textMuted}>Requested</TableHead>
                                    <TableHead className={`text-right ${theme.textMuted}`}></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map((w) => (
                                    <TableRow
                                        key={w._id}
                                        className={`${theme.row} cursor-pointer`}
                                        onClick={() => onRowClick?.(w)}
                                    >
                                        <TableCell>
                                            <div className="min-w-0">
                                                <p className={`text-sm font-medium truncate ${theme.text}`}>
                                                    {w.student?.name || '—'}
                                                </p>
                                                <p className={`text-xs ${theme.textMuted}`}>
                                                    Roll {w.student?.rollNumber || '—'}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell className={`text-sm ${theme.textSoft}`}>
                                            {w.feeInstance?.title || '—'}
                                        </TableCell>
                                        <TableCell className={`text-sm ${theme.textSoft}`}>
                                            {getWaiverTypeLabel(w.type)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <MoneyDisplay value={w.amount} size="sm" tone="positive" />
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge
                                                domain="waiver"
                                                status={w.status}
                                                label={getWaiverStatusLabel(w.status)}
                                            />
                                        </TableCell>
                                        <TableCell className={`text-xs ${theme.textMuted}`}>
                                            {formatDate(w.requestDate || w.createdAt)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost" size="sm"
                                                onClick={(e) => { e.stopPropagation(); onRowClick?.(w); }}
                                                className={theme.ghostBtn}
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Button>
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