// src/components/finance/shared/FinanceStatCard.jsx
import { Card, CardContent } from '@/components/ui/card';
import { useFinanceTheme } from '@/hooks/finance/useFinanceTheme';

/**
 * Props:
 *   label      — top text, e.g. "Total Collection"
 *   value      — main number/text
 *   subtitle   — supporting line
 *   icon       — lucide icon component
 *   accent     — 'blue' | 'green' | 'purple' | 'red' | 'yellow' | 'gray'
 *   progress   — 0..100 (optional bar)
 *   onClick    — makes card clickable
 *   trend      — { direction: 'up'|'down', value: string } (optional)
 */
export function FinanceStatCard({
    label,
    value,
    subtitle,
    icon: Icon,
    accent = 'blue',
    progress,
    onClick,
    trend,
}) {
    const theme = useFinanceTheme();

    const accents = {
        blue:   theme.isDarkMode ? 'bg-blue-500/10 text-blue-400'       : 'bg-blue-50 text-blue-600',
        green:  theme.isDarkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600',
        purple: theme.isDarkMode ? 'bg-purple-500/10 text-purple-400'   : 'bg-purple-50 text-purple-600',
        red:    theme.isDarkMode ? 'bg-red-500/10 text-red-400'         : 'bg-red-50 text-red-600',
        yellow: theme.isDarkMode ? 'bg-yellow-500/10 text-yellow-400'   : 'bg-yellow-50 text-yellow-600',
        gray:   theme.isDarkMode ? 'bg-gray-800 text-gray-400'          : 'bg-gray-100 text-gray-600',
    };

    const progressBarColor = {
        blue:   'bg-blue-500',
        green:  'bg-emerald-500',
        purple: 'bg-purple-500',
        red:    'bg-red-500',
        yellow: 'bg-yellow-500',
        gray:   'bg-gray-500',
    }[accent] || 'bg-blue-500';

    return (
        <Card
            onClick={onClick}
            className={`border shadow-sm transition-all ${theme.card} ${onClick ? `cursor-pointer ${theme.cardHover}` : ''}`}
        >
            <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                    <p className={`text-sm font-medium ${theme.textMuted}`}>{label}</p>
                    {Icon && (
                        <div className={`p-2 rounded-lg ${accents[accent]}`}>
                            <Icon className="w-4 h-4" />
                        </div>
                    )}
                </div>

                <p className={`text-2xl font-bold tracking-tight ${theme.text} tabular-nums`}>
                    {value}
                </p>

                {subtitle && (
                    <p className={`text-xs mt-1 ${theme.textMuted}`}>{subtitle}</p>
                )}

                {trend && (
                    <p className={`text-xs mt-1 ${
                        trend.direction === 'up'
                            ? (theme.isDarkMode ? 'text-emerald-400' : 'text-emerald-600')
                            : (theme.isDarkMode ? 'text-red-400' : 'text-red-600')
                    }`}>
                        {trend.direction === 'up' ? '↑' : '↓'} {trend.value}
                    </p>
                )}

                {progress !== undefined && (
                    <div className={`w-full h-1.5 rounded-full mt-3 ${theme.isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                        <div
                            className={`h-1.5 rounded-full transition-all ${progressBarColor}`}
                            style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
                        />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default FinanceStatCard;