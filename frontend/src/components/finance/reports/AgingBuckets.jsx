// src/components/finance/reports/AgingBuckets.jsx
import { useFinanceTheme } from '@/hooks/finance/useFinanceTheme';
import { MoneyDisplay } from '@/components/finance';
import { toMoneyNumber } from '@/lib/formaters';

const BUCKETS = [
    { key: '0-30',  label: '0–30 days',    tone: 'green',  desc: 'Current' },
    { key: '31-60', label: '31–60 days',   tone: 'yellow', desc: 'Watch' },
    { key: '61-90', label: '61–90 days',   tone: 'orange', desc: 'Follow up' },
    { key: '90+',   label: '90+ days',     tone: 'red',    desc: 'Urgent' },
];

/**
 * Props:
 *   aging      — { '0-30', '31-60', '61-90', '90+' } (string amounts)
 *   compact    — boolean
 */
export default function AgingBuckets({ aging = {}, compact = false }) {
    const theme = useFinanceTheme();

    const total = BUCKETS.reduce((s, b) => s + toMoneyNumber(aging[b.key] || 0), 0);

    const toneMap = {
        green:  theme.isDarkMode
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            : 'bg-emerald-50 border-emerald-200 text-emerald-700',
        yellow: theme.isDarkMode
            ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
            : 'bg-yellow-50 border-yellow-200 text-yellow-700',
        orange: theme.isDarkMode
            ? 'bg-orange-500/10 border-orange-500/20 text-orange-400'
            : 'bg-orange-50 border-orange-200 text-orange-700',
        red:    theme.isDarkMode
            ? 'bg-red-500/10 border-red-500/20 text-red-400'
            : 'bg-red-50 border-red-200 text-red-700',
    };

    return (
        <div className={`grid grid-cols-2 ${compact ? 'md:grid-cols-2' : 'md:grid-cols-4'} gap-3`}>
            {BUCKETS.map((b) => {
                const amount = toMoneyNumber(aging[b.key] || 0);
                const pct = total > 0 ? (amount / total) * 100 : 0;
                return (
                    <div
                        key={b.key}
                        className={`p-4 rounded-lg border text-center ${toneMap[b.tone]}`}
                    >
                        <p className="text-xs font-medium uppercase tracking-wider opacity-80">
                            {b.label}
                        </p>
                        <p className="text-xl font-bold mt-1">
                            <MoneyDisplay value={amount} size="lg" className="!text-inherit" />
                        </p>
                        <p className="text-xs opacity-70 mt-1">
                            {b.desc} • {pct.toFixed(0)}%
                        </p>
                    </div>
                );
            })}
        </div>
    );
}