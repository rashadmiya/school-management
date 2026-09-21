// src/components/finance/ledger/LedgerEntryRow.jsx
import {
    Receipt, TrendingUp, TrendingDown, Gift, PiggyBank, Wallet, Sliders, Clock,
    Sparkles,
} from 'lucide-react';
import { MoneyDisplay, StatusBadge } from '@/components/finance';
import { useFinanceTheme } from '@/hooks/finance/useFinanceTheme';
import { getLedgerTypeLabel } from '@/lib/financeUtils';
import { formatDateTime, toMoneyNumber } from '@/lib/formaters';
import { Button } from '@/components/ui/button';

const ICONS = {
    fee: TrendingDown,
    payment: TrendingUp,
    refund: TrendingDown,
    waiver: Gift,
    advance_credit: PiggyBank,
    advance_debit: Wallet,
    adjustment: Sliders,
    late_fee: Clock,
};

/**
 * Props:
 *   entry — LedgerEntry doc
 */
export default function LedgerEntryRow({ entry, onWaive }) {
    const theme = useFinanceTheme();
    const Icon = ICONS[entry.type] || Receipt;

    // const debit = parseFloat(entry.debit || 0);
    // const credit = parseFloat(entry.credit || 0);
    // const isDebit = debit > 0;
    const debit = toMoneyNumber(entry.debit);
    const credit = toMoneyNumber(entry.credit);
    const isDebit = debit > 0;

    const canWaive =
        typeof onWaive === 'function' &&
        entry.type === 'fee' &&
        entry.refModel === 'FeeInstance' &&
        isDebit;

    return (
        <div className={`flex items-start gap-3 px-4 py-3 border-b last:border-b-0 ${theme.border} ${theme.row}`}>
            {/* Icon */}
            <div className={`p-2 rounded-lg flex-shrink-0 ${isDebit
                ? theme.isDarkMode ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600'
                : theme.isDarkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
                }`}>
                <Icon className="w-4 h-4" />
            </div>

            {/* Body */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge domain="ledger" status={entry.type} label={getLedgerTypeLabel(entry.type)} />
                    {entry.refId && (
                        <span className={`text-xs font-mono ${theme.textMuted}`}>
                            #{String(entry.refId).slice(-6)}
                        </span>
                    )}
                </div>
                <p className={`text-sm mt-1 ${theme.textSoft}`}>
                    {entry.description || '—'}
                </p>
                <p className={`text-xs ${theme.textMuted} mt-0.5`}>
                    {formatDateTime(entry.createdAt)}
                </p>
            </div>

            {/* Amount */}
            <div className="text-right flex-shrink-0">
                <MoneyDisplay
                    value={isDebit ? debit : credit}
                    size="sm"
                    tone={isDebit ? 'negative' : 'positive'}
                    showSign={false}
                />
                <p className={`text-xs ${theme.textMuted} mt-0.5`}>
                    Bal: <MoneyDisplay value={entry.balanceAfter} size="sm" tone="muted" className="inline" />
                </p>
            </div>

            {/* Optional Waive action */}
            {canWaive && (
                <div className="flex-shrink-0 self-center">
                    <Button
                        variant="ghost"
                        size="sm"
                        title="Request waiver for this fee"
                        className={`${theme.ghostBtn} ${theme.isDarkMode ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700'
                            }`}
                        onClick={() => onWaive(entry)}
                    >
                        <Sparkles className="w-4 h-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}

// export default function LedgerEntryRow({ entry }) {
//     const theme = useFinanceTheme();
//     const Icon = ICONS[entry.type] || Receipt;

//     const debit = parseFloat(entry.debit || 0);
//     const credit = parseFloat(entry.credit || 0);
//     const isDebit = debit > 0;

//     const canWaive =
//         typeof onWaive === 'function' &&
//         entry.type === 'fee' &&
//         entry.refModel === 'FeeInstance' &&
//         isDebit;

//     return (
//         <div className={`flex items-start gap-3 px-4 py-3 border-b last:border-b-0 ${theme.border} ${theme.row}`}>
//             {/* Icon */}
//             <div className={`p-2 rounded-lg flex-shrink-0 ${isDebit
//                 ? theme.isDarkMode ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600'
//                 : theme.isDarkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
//                 }`}>
//                 <Icon className="w-4 h-4" />
//             </div>

//             {/* Body */}
//             <div className="flex-1 min-w-0">
//                 <div className="flex items-center gap-2 flex-wrap">
//                     <StatusBadge
//                         domain="ledger"
//                         status={entry.type}
//                         label={getLedgerTypeLabel(entry.type)}
//                     />
//                     {entry.refId && (
//                         <span className={`text-xs font-mono ${theme.textMuted}`}>
//                             #{String(entry.refId).slice(-6)}
//                         </span>
//                     )}
//                 </div>
//                 <p className={`text-sm mt-1 ${theme.textSoft}`}>
//                     {entry.description || '—'}
//                 </p>
//                 <p className={`text-xs ${theme.textMuted} mt-0.5`}>
//                     {formatDateTime(entry.createdAt)}
//                 </p>
//             </div>

//             {/* Amount + balance */}
//             <div className="text-right flex-shrink-0">
//                 <MoneyDisplay
//                     value={isDebit ? debit : credit}
//                     size="sm"
//                     tone={isDebit ? 'negative' : 'positive'}
//                     showSign={false}
//                 />
//                 <p className={`text-xs ${theme.textMuted} mt-0.5`}>
//                     Bal: <MoneyDisplay value={entry.balanceAfter} size="sm" tone="muted" className="inline" />
//                 </p>
//             </div>
//         </div>
//     );
// }