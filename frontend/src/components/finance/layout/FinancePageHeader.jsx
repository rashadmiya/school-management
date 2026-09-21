// src/components/finance/layout/FinancePageHeader.jsx
import { useFinanceTheme } from '@/hooks/finance/useFinanceTheme';

/**
 * Props:
 *   title        — page title
 *   subtitle     — short description
 *   actions      — React node (buttons, selectors) on the right
 *   breadcrumb   — optional array of { label, to }
 */
export function FinancePageHeader({ title, subtitle, actions, breadcrumb }) {
    const theme = useFinanceTheme();

    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="min-w-0">
                {breadcrumb && breadcrumb.length > 0 && (
                    <nav className={`flex items-center gap-1 text-xs mb-1 ${theme.textMuted}`}>
                        {breadcrumb.map((b, i) => (
                            <span key={i} className="flex items-center gap-1">
                                {b.to ? (
                                    <a href={b.to} className="hover:underline">{b.label}</a>
                                ) : (
                                    <span>{b.label}</span>
                                )}
                                {i < breadcrumb.length - 1 && <span>/</span>}
                            </span>
                        ))}
                    </nav>
                )}
                <h1 className={`text-3xl font-bold tracking-tight ${theme.text}`}>{title}</h1>
                {subtitle && (
                    <p className={`text-sm mt-1 ${theme.textMuted}`}>{subtitle}</p>
                )}
            </div>
            {actions && (
                <div className="flex items-center gap-2 flex-wrap">
                    {actions}
                </div>
            )}
        </div>
    );
}

export default FinancePageHeader;