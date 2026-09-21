// src/components/finance/bills/FeeInstanceCard.jsx
import { Calendar, FileText, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { MoneyDisplay, StatusBadge } from '@/components/finance';
import { useFinanceTheme } from '@/hooks/finance/useFinanceTheme';
import { getFeeStatusLabel, getFrequencyLabel } from '@/lib/financeUtils';
import { formatDate, toMoneyNumber } from '@/lib/formaters';

/**
 * Props:
 *   fee   — FeeInstance
 *   onClick
 */
export default function FeeInstanceCard({ fee, onClick }) {
    const theme = useFinanceTheme();
    const due = toMoneyNumber(fee.dueAmount);
    const total = toMoneyNumber(fee.totalAmount);
    const paid = toMoneyNumber(fee.paidAmount);
    const waived = toMoneyNumber(fee.waivedAmount);
    const used = toMoneyNumber(fee.advanceUsed);

    const progress = total > 0
        ? Math.min(((paid + waived + used) / total) * 100, 100)
        : 0;

    const isOverdue =
        due > 0 &&
        new Date(fee.dueDate) < new Date() &&
        fee.status !== 'paid' &&
        fee.status !== 'waived';

    return (
        <Card
            onClick={onClick}
            className={`border shadow-sm transition-all ${theme.card} ${onClick ? `cursor-pointer ${theme.cardHover}` : ''}`}
        >
            <CardContent className="p-4 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className={`p-2 rounded-lg flex-shrink-0 ${theme.iconBox}`}>
                            <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                            <p className={`text-sm font-semibold truncate ${theme.text}`}>
                                {fee.title || fee.feeTemplate?.title || 'Fee'}
                            </p>
                            <p className={`text-xs ${theme.textMuted}`}>
                                {getFrequencyLabel(fee.frequency) || '—'}
                            </p>
                        </div>
                    </div>
                    <StatusBadge
                        domain="fee"
                        status={fee.status}
                        label={getFeeStatusLabel(fee.status)}
                    />
                </div>

                {/* Due date */}
                <div className={`flex items-center gap-1.5 text-xs ${theme.textMuted}`}>
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                        Due {formatDate(fee.dueDate)}
                        {isOverdue && (
                            <span className={`ml-2 ${theme.isDarkMode ? 'text-red-400' : 'text-red-600'} font-medium`}>
                                · Overdue
                            </span>
                        )}
                    </span>
                </div>

                {/* Amounts */}
                <div className="flex items-baseline justify-between">
                    <span className={`text-xs ${theme.textMuted}`}>Outstanding</span>
                    <MoneyDisplay
                        value={due}
                        size="lg"
                        tone={due > 0 ? 'negative' : 'positive'}
                    />
                </div>

                {/* Progress */}
                <div className="space-y-1.5">
                    <div className={`w-full h-1.5 rounded-full ${theme.isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                        <div
                            className={`h-1.5 rounded-full transition-all ${
                                progress >= 100 ? 'bg-emerald-500'
                                : progress >= 50 ? 'bg-blue-500'
                                : 'bg-yellow-500'
                            }`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                        <span className={theme.textMuted}>
                            Paid <MoneyDisplay value={paid + waived + used} size="sm" tone="positive" className="inline" />
                        </span>
                        <span className={theme.textMuted}>
                            Total <MoneyDisplay value={total} size="sm" className="inline" />
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}