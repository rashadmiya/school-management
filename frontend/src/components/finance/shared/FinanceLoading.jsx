// src/components/finance/shared/FinanceLoading.jsx
import { Loader2 } from 'lucide-react';
import { useFinanceTheme } from '@/hooks/finance/useFinanceTheme';

/**
 * Props:
 *   label      — optional text below spinner
 *   fullPage   — centers on a full page (default: inline card-size)
 *   rows       — render skeleton rows instead of spinner
 */
export function FinanceLoading({ label, fullPage = false, rows = 0 }) {
    const theme = useFinanceTheme();

    if (rows > 0) {
        return (
            <div className="space-y-2 p-4">
                {Array.from({ length: rows }).map((_, i) => (
                    <div
                        key={i}
                        className={`h-12 rounded animate-pulse ${theme.surfaceSolid}`}
                    />
                ))}
            </div>
        );
    }

    return (
        <div className={`flex items-center justify-center ${fullPage ? 'min-h-[400px]' : 'h-64'}`}>
            <div className="text-center">
                <Loader2 className={`w-8 h-8 animate-spin mx-auto ${theme.isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                {label && <p className={`text-sm mt-3 ${theme.textMuted}`}>{label}</p>}
            </div>
        </div>
    );
}

export default FinanceLoading;