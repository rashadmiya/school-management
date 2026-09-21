// src/components/finance/bills/BillItemRow.jsx
import { MoneyDisplay, StatusBadge } from '@/components/finance';
import { useFinanceTheme } from '@/hooks/finance/useFinanceTheme';
import { getFeeStatusLabel } from '@/lib/financeUtils';
import { formatDate } from '@/lib/formaters';

/**
 * Props:
 *   item — { _id, title, dueAmount, totalAmount, paidAmount, waivedAmount, advanceUsed,
 *            status, dueDate, frequency }
 */
export default function BillItemRow({ item }) {
    const theme = useFinanceTheme();

    return (
        <div className={`flex items-center justify-between gap-4 px-4 py-3 border-b last:border-b-0 ${theme.border} ${theme.row}`}>
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                    <p className={`text-sm font-medium truncate ${theme.text}`}>{item.title}</p>
                    <StatusBadge
                        domain="fee"
                        status={item.status}
                        label={getFeeStatusLabel(item.status)}
                    />
                </div>
                <p className={`text-xs ${theme.textMuted} mt-0.5`}>
                    Due {formatDate(item.dueDate)}
                    {item.frequency && ` • ${item.frequency}`}
                </p>
            </div>

            <div className="text-right flex-shrink-0">
                <MoneyDisplay
                    value={item.dueAmount}
                    size="sm"
                    tone={parseFloat(item.dueAmount) > 0 ? 'default' : 'muted'}
                />
                {parseFloat(item.paidAmount) > 0 && parseFloat(item.dueAmount) > 0 && (
                    <p className={`text-xs ${theme.textMuted} mt-0.5`}>
                        Paid <MoneyDisplay value={item.paidAmount} size="sm" tone="positive" className="inline" />
                    </p>
                )}
            </div>
        </div>
    );
}