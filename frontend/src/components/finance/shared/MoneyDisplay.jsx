// src/components/finance/shared/MoneyDisplay.jsx
import { formatCurrency, toMoneyNumber } from '@/lib/formaters';
import { useFinanceTheme } from '@/hooks/finance/useFinanceTheme';

/**
 * Renders any money value (Decimal128, string, number) safely.
 *
 * Props:
 *   value        — Decimal128 | string | number
 *   size         — 'sm' | 'md' | 'lg' | 'xl' (default 'md')
 *   weight       — 'normal' | 'medium' | 'semibold' | 'bold' (default 'semibold')
 *   tone         — 'default' | 'positive' | 'negative' | 'muted' | 'auto'
 *                  'auto' uses sign of the value.
 *   currency     — default 'BDT'
 *   showSign     — prefix '+' for positive values
 *   className    — extra classes
 */
export function MoneyDisplay({
    value,
    size = 'md',
    weight = 'semibold',
    tone = 'default',
    currency = 'BDT',
    showSign = false,
    className = '',
}) {
    const theme = useFinanceTheme();
    const num = toMoneyNumber(value);

    const sizeClass = {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
        xl: 'text-2xl',
    }[size] || 'text-base';

    const weightClass = {
        normal: 'font-normal',
        medium: 'font-medium',
        semibold: 'font-semibold',
        bold: 'font-bold',
    }[weight] || 'font-semibold';

    const resolvedTone = tone === 'auto'
        ? (num > 0 ? 'positive' : num < 0 ? 'negative' : 'muted')
        : tone;

    const toneClass = {
        default:  theme.text,
        positive: theme.isDarkMode ? 'text-emerald-400' : 'text-emerald-600',
        negative: theme.isDarkMode ? 'text-red-400' : 'text-red-600',
        muted:    theme.textMuted,
    }[resolvedTone] || theme.text;

    const sign = showSign && num > 0 ? '+' : '';

    return (
        <span className={`${sizeClass} ${weightClass} ${toneClass} tabular-nums ${className}`}>
            {sign}{formatCurrency(value, { currency })}
        </span>
    );
}

export default MoneyDisplay;