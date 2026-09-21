// src/components/finance/shared/SessionSelector.jsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFinanceTheme } from '@/hooks/finance/useFinanceTheme';
import { getSessionOptions } from '@/lib/financeUtils';
import { SESSION_OPTIONS } from '@/utils/constants';

/**
 * Props:
 *   value      — string
 *   onChange   — (val) => void
 *   width      — optional tailwind width class (default w-[170px])
 *   includeAll — if true, adds an "All Sessions" option mapped to ''
 *   showIcon   — show calendar icon
 */
export function SessionSelector({
    value,
    onChange,
    width = 'w-[170px]',
    includeAll = false,
    showIcon = false,
}) {
    const theme = useFinanceTheme();

    // Prefer existing SESSION_OPTIONS from constants (project-wide)
    const options = Array.isArray(SESSION_OPTIONS) && SESSION_OPTIONS.length > 0
        ? SESSION_OPTIONS.map((o) => ({ value: o.value, label: o.label }))
        : getSessionOptions().map((s) => ({ value: s, label: s }));

    return (
        <div className="relative">
            {showIcon && (
                <svg
                    className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 z-10 ${theme.textMuted}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            )}
            <Select value={value || (includeAll ? 'all' : undefined)} onValueChange={(v) => onChange(v === 'all' ? '' : v)}>
                <SelectTrigger className={`${width} ${theme.select} ${showIcon ? 'pl-9' : ''}`}>
                    <SelectValue placeholder="Select session" />
                </SelectTrigger>
                <SelectContent className={theme.selectContent}>
                    {includeAll && (
                        <SelectItem value="all" className={theme.selectItem}>
                            All Sessions
                        </SelectItem>
                    )}
                    {options.map((o) => (
                        <SelectItem key={o.value} value={o.value} className={theme.selectItem}>
                            {o.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}

export default SessionSelector;