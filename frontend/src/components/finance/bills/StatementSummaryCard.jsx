// src/components/finance/bills/StatementSummaryCard.jsx
import { Wallet, TrendingUp, TrendingDown, AlertCircle, PiggyBank } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { MoneyDisplay, StatusBadge } from '@/components/finance';
import { useFinanceTheme } from '@/hooks/finance/useFinanceTheme';
import { toMoneyNumber, formatPercent } from '@/lib/formaters';

/**
 * Props:
 *   summary — { totalFee, totalPaid, totalWaived, totalAdvanceUsed, totalRefunded,
 *               advanceBalance, dueBalance, status }
 */
export default function StatementSummaryCard({ summary }) {
    const theme = useFinanceTheme();
    const s = summary || {};

    const due = toMoneyNumber(s.dueBalance);
    const advance = toMoneyNumber(s.advanceBalance);
    const totalFee = toMoneyNumber(s.totalFee);
    const totalPaid = toMoneyNumber(s.totalPaid);
    const waived = toMoneyNumber(s.totalWaived);
    const rate = totalFee > 0 ? (totalPaid / totalFee) * 100 : 0;

    return (
        <Card className={`border shadow-sm ${theme.card}`}>
            <CardContent className="p-5">
                {/* Top row: Due + Status */}
                <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
                    <div>
                        <p className={`text-xs font-medium uppercase tracking-wider ${theme.textMuted}`}>
                            Amount Due
                        </p>
                        <div className="mt-1">
                            <MoneyDisplay
                                value={due}
                                size="xl"
                                weight="bold"
                                tone={due > 0 ? 'negative' : 'muted'}
                            />
                        </div>
                    </div>
                    <div className="text-right">
                        <StatusBadge
                            domain="balance"
                            status={s.status || 'clear'}
                            label={
                                s.status === 'clear' ? 'Clear'
                                : s.status === 'due' ? 'Payment Due'
                                : s.status === 'overdue' ? 'Overdue'
                                : s.status === 'advanced' ? 'Advance Available'
                                : '—'
                            }
                            size="md"
                        />
                        {advance > 0 && (
                            <div className="mt-2 flex items-center gap-1 justify-end">
                                <PiggyBank className={`w-3.5 h-3.5 ${theme.isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                                <span className={`text-xs ${theme.textMuted}`}>
                                    Advance: <MoneyDisplay value={advance} size="sm" tone="positive" />
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-2 mb-5">
                    <div className="flex items-center justify-between">
                        <span className={`text-xs ${theme.textMuted}`}>Paid progress</span>
                        <span className={`text-xs font-medium ${theme.text}`}>{formatPercent(rate)}</span>
                    </div>
                    <div className={`w-full h-2 rounded-full ${theme.isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                        <div
                            className={`h-2 rounded-full transition-all ${
                                rate >= 90 ? 'bg-emerald-500'
                                : rate >= 60 ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(rate, 100)}%` }}
                        />
                    </div>
                </div>

                {/* Breakdown grid */}
                <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t ${theme.border}`}>
                    <Stat theme={theme} label="Total Billed" value={s.totalFee} tone="default" icon={Wallet} />
                    <Stat theme={theme} label="Paid" value={s.totalPaid} tone="positive" icon={TrendingUp} />
                    <Stat theme={theme} label="Waived" value={s.totalWaived} tone="default" icon={AlertCircle} />
                    <Stat theme={theme} label="Refunded" value={s.totalRefunded} tone="negative" icon={TrendingDown} />
                </div>
            </CardContent>
        </Card>
    );
}

function Stat({ theme, label, value, tone, icon: Icon }) {
    return (
        <div>
            <div className={`flex items-center gap-1.5 ${theme.textMuted}`}>
                {Icon && <Icon className="w-3.5 h-3.5" />}
                <p className="text-xs">{label}</p>
            </div>
            <div className="mt-1">
                <MoneyDisplay value={value} size="md" tone={tone} weight="semibold" />
            </div>
        </div>
    );
}