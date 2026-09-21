// src/components/finance/shared/StatusBadge.jsx
import { Badge } from '@/components/ui/badge';
import { useFinanceTheme } from '@/hooks/finance/useFinanceTheme';
import { getBadgeClass } from '@/lib/financeUtils';

/**
 * Props:
 *   domain   — 'fee' | 'payment' | 'refund' | 'waiver' | 'adjustment' | 'intent' | 'ledger' | 'balance'
 *   status   — the raw status string from the backend
 *   label    — optional override text
 *   size     — 'sm' | 'md' (default 'sm')
 *   icon     — optional lucide icon component
 */
export function StatusBadge({ domain, status, label, size = 'sm', icon: Icon }) {
    const theme = useFinanceTheme();
    const cls = getBadgeClass(domain, status, theme.isDarkMode);

    const sizeClass = size === 'md' ? 'text-sm px-3 py-1' : 'text-xs px-2 py-0.5';

    return (
        <Badge
            variant="outline"
            className={`inline-flex items-center gap-1 border rounded-full font-medium ${cls} ${sizeClass}`}
        >
            {Icon && <Icon className="w-3 h-3" />}
            {label || status}
        </Badge>
    );
}

export default StatusBadge;