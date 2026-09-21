// src/components/finance/payments/FeeAllocationPreview.jsx
import { useMemo } from 'react';
import { AlertCircle, CheckCircle, Clock, Info } from 'lucide-react';
import { MoneyDisplay, StatusBadge } from '@/components/finance';
import { useFinanceTheme } from '@/hooks/finance/useFinanceTheme';
import { toMoneyNumber, formatDate } from '@/lib/formaters';

/**
 * Props:
 *   fees         — array of FeeInstance docs (from useGetStudentFeesQuery)
 *   paymentAmount — number (what's being paid)
 */
export default function FeeAllocationPreview({ fees = [], paymentAmount = 0 }) {
    const theme = useFinanceTheme();

    // Sort oldest first — matches backend allocation order
    const sortedFees = useMemo(
        () => [...fees]
            .filter((f) => toMoneyNumber(f.dueAmount) > 0 && f.isActive !== false)
            .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)),
        [fees]
    );

    // Simulate allocation
    const allocation = useMemo(() => {
        let remaining = toMoneyNumber(paymentAmount);
        const rows = [];
        for (const f of sortedFees) {
            const due = toMoneyNumber(f.dueAmount);
            if (remaining <= 0) {
                rows.push({ fee: f, applied: 0, after: due, willPay: false });
                continue;
            }
            const applied = Math.min(due, remaining);
            rows.push({
                fee: f,
                applied,
                after: due - applied,
                willPay: applied > 0,
            });
            remaining -= applied;
        }
        return { rows, leftover: remaining };
    }, [sortedFees, paymentAmount]);

    if (sortedFees.length === 0) {
        return (
            <div className={`flex items-center gap-3 p-4 rounded-lg border ${
                theme.isDarkMode
                    ? 'bg-blue-500/5 border-blue-500/20 text-blue-400'
                    : 'bg-blue-50 border-blue-200 text-blue-700'
            }`}>
                <Info className="w-4 h-4 flex-shrink-0" />
                <div className="text-sm">
                    No outstanding fees. Any payment will be credited as <strong>advance balance</strong>.
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <p className={`text-sm font-medium ${theme.text}`}>
                    Outstanding Fees ({sortedFees.length})
                </p>
                <p className={`text-xs ${theme.textMuted}`}>
                    Oldest first — auto-allocated
                </p>
            </div>

            {/* Rows */}
            <div className={`rounded-lg border overflow-hidden ${theme.border}`}>
                {allocation.rows.map((row) => {
                    const isOverdue = new Date(row.fee.dueDate) < new Date()
                        && row.fee.status !== 'paid';

                    return (
                        <div
                            key={row.fee._id}
                            className={`flex items-center justify-between gap-3 px-4 py-3 border-b last:border-b-0 ${theme.border} ${
                                row.willPay
                                    ? theme.isDarkMode ? 'bg-emerald-500/5' : 'bg-emerald-50/40'
                                    : theme.rowEven
                            }`}
                        >
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <p className={`text-sm font-medium truncate ${theme.text}`}>
                                        {row.fee.title || row.fee.feeTemplate?.title || 'Fee'}
                                    </p>
                                    {isOverdue && (
                                        <StatusBadge domain="fee" status="overdue" label="Overdue" />
                                    )}
                                </div>
                                <p className={`text-xs ${theme.textMuted} mt-0.5`}>
                                    Due {formatDate(row.fee.dueDate)}
                                </p>
                            </div>

                            <div className="flex items-center gap-4 flex-shrink-0">
                                {/* Amount due */}
                                <div className="text-right">
                                    <p className={`text-xs ${theme.textMuted}`}>Due</p>
                                    <MoneyDisplay value={row.fee.dueAmount} size="sm" />
                                </div>

                                {/* Applied */}
                                {row.willPay && (
                                    <div className="text-right">
                                        <p className={`text-xs ${theme.textMuted}`}>Apply</p>
                                        <MoneyDisplay
                                            value={row.applied}
                                            size="sm"
                                            tone="positive"
                                            showSign
                                        />
                                    </div>
                                )}

                                {/* Icon */}
                                {row.willPay && row.after <= 0 && (
                                    <CheckCircle className={`w-4 h-4 ${theme.isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                                )}
                                {row.willPay && row.after > 0 && (
                                    <Clock className={`w-4 h-4 ${theme.isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Summary line */}
            <div className={`flex items-center justify-between px-4 py-2.5 rounded-lg ${theme.surface}`}>
                <span className={`text-sm ${theme.textMuted}`}>
                    {allocation.leftover > 0 ? 'Leftover (→ advance)' : 'All applied'}
                </span>
                <MoneyDisplay
                    value={allocation.leftover}
                    size="sm"
                    tone={allocation.leftover > 0 ? 'positive' : 'muted'}
                />
            </div>
        </div>
    );
}