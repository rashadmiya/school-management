// src/components/finance/shared/FinanceEmptyState.jsx
import { Button } from '@/components/ui/button';
import { useFinanceTheme } from '@/hooks/finance/useFinanceTheme';
import { Inbox } from 'lucide-react';

/**
 * Props:
 *   icon         — lucide icon (default Inbox)
 *   title        — big line
 *   description  — supporting line
 *   actionLabel  — button text
 *   onAction     — button handler
 *   className
 */
export function FinanceEmptyState({
    icon: Icon = Inbox,
    title = 'Nothing here yet',
    description,
    actionLabel,
    onAction,
    className = '',
}) {
    const theme = useFinanceTheme();

    return (
        <div className={`text-center py-16 px-6 ${className}`}>
            <div className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-4 ${theme.surfaceSolid}`}>
                <Icon className={`w-6 h-6 ${theme.textMuted}`} />
            </div>
            <h3 className={`text-base font-semibold ${theme.text}`}>{title}</h3>
            {description && (
                <p className={`text-sm mt-1 max-w-sm mx-auto ${theme.textMuted}`}>
                    {description}
                </p>
            )}
            {actionLabel && onAction && (
                <Button onClick={onAction} className={`mt-4 ${theme.primaryBtn}`}>
                    {actionLabel}
                </Button>
            )}
        </div>
    );
}

export default FinanceEmptyState;