// src/components/finance/bills/MonthlyBillCard.jsx
import { useState } from 'react';
import { ChevronDown, Calendar } from 'lucide-react';
import { MoneyDisplay, StatusBadge } from '@/components/finance';
import { useFinanceTheme } from '@/hooks/finance/useFinanceTheme';
import BillItemRow from './BillItemRow';

/**
 * Props:
 *   bill — { monthKey, monthLabel, items, total, paid, waived, advanceUsed, due, status }
 *   defaultOpen — boolean
 */
export default function MonthlyBillCard({ bill, defaultOpen = false }) {
    const theme = useFinanceTheme();
    const [open, setOpen] = useState(defaultOpen);

    const itemCount = bill.items?.length || 0;

    return (
        <div className={`rounded-lg border overflow-hidden ${theme.cardSolid}`}>
            {/* Header */}
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className={`w-full flex items-center justify-between gap-4 px-4 py-3 transition-colors ${theme.row}`}
            >
                <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-lg ${theme.iconBox} flex-shrink-0`}>
                        <Calendar className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 text-left">
                        <p className={`text-sm font-semibold ${theme.text} truncate`}>
                            {bill.monthLabel}
                        </p>
                        <p className={`text-xs ${theme.textMuted}`}>
                            {itemCount} fee{itemCount === 1 ? '' : 's'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                    <StatusBadge
                        domain="fee"
                        status={
                            bill.status === 'paid' ? 'paid'
                            : bill.status === 'overdue' ? 'overdue'
                            : bill.status === 'partial' ? 'partial'
                            : 'unpaid'
                        }
                        label={
                            bill.status === 'paid' ? 'Paid'
                            : bill.status === 'overdue' ? 'Overdue'
                            : bill.status === 'partial' ? 'Partial'
                            : 'Unpaid'
                        }
                    />
                    <MoneyDisplay
                        value={bill.due}
                        size="md"
                        tone={parseFloat(bill.due) > 0 ? 'negative' : 'muted'}
                    />
                    <ChevronDown
                        className={`w-4 h-4 transition-transform ${theme.textMuted} ${open ? 'rotate-180' : ''}`}
                    />
                </div>
            </button>

            {/* Body */}
            {open && (
                <>
                    <div className={`border-t ${theme.border}`}>
                        {bill.items.map((it) => (
                            <BillItemRow key={it._id} item={it} />
                        ))}
                    </div>

                    {/* Month totals */}
                    <div className={`px-4 py-3 border-t ${theme.border} ${theme.surface}`}>
                        <div className="grid grid-cols-3 gap-3 text-xs">
                            <div>
                                <p className={theme.textMuted}>Total</p>
                                <MoneyDisplay value={bill.total} size="sm" />
                            </div>
                            <div>
                                <p className={theme.textMuted}>Paid</p>
                                <MoneyDisplay value={bill.paid} size="sm" tone="positive" />
                            </div>
                            <div>
                                <p className={theme.textMuted}>Due</p>
                                <MoneyDisplay
                                    value={bill.due}
                                    size="sm"
                                    tone={parseFloat(bill.due) > 0 ? 'negative' : 'muted'}
                                />
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}