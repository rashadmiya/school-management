// src/components/finance/shared/StudentSearchInput.jsx
import { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useFinanceTheme } from '@/hooks/finance/useFinanceTheme';
import { useDebouncedValue } from '@/hooks/finance/useDebouncedValue';
import { useGetStudentsQuery } from '@/features/apis/studentsApi';
import { formatCurrency } from '@/lib/formaters';

/**
 * Async student picker.
 *
 * Props:
 *   value      — selected student object | null
 *   onChange   — (student | null) => void
 *   session    — academic session string
 *   placeholder
 *   autoFocus
 *
 * Emits: { _id, name, rollNumber, class, section, session, summary? }
 */
export function StudentSearchInput({
    value,
    onChange,
    session,
    placeholder = 'Search by name or roll number…',
    autoFocus = false,
}) {
    const theme = useFinanceTheme();
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef(null);

    const debounced = useDebouncedValue(query, 300);

    const { data, isFetching } = useGetStudentsQuery(
        { search: debounced, session, limit: 8 },
        { skip: !debounced || debounced.length < 2 }
    );

    const students = data?.students || data?.docs || [];

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    if (value) {
        return (
            <div className={`flex items-center justify-between gap-3 px-3 py-2 rounded-lg border ${theme.cardSolid}`}>
                <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
                        theme.isDarkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'
                    }`}>
                        {value.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0">
                        <p className={`text-sm font-medium truncate ${theme.text}`}>{value.name}</p>
                        <p className={`text-xs truncate ${theme.textMuted}`}>
                            Roll {value.rollNumber || '—'}
                            {value.class ? ` • ${value.class.name || value.class}` : ''}
                            {value.section ? ` - ${value.section}` : ''}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => { onChange(null); setQuery(''); }}
                    className={`p-1.5 rounded-md ${theme.ghostBtn}`}
                    title="Change student"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        );
    }

    return (
        <div className="relative" ref={wrapperRef}>
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${theme.textMuted}`} />
            <Input
                autoFocus={autoFocus}
                placeholder={placeholder}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
                onFocus={() => setOpen(true)}
                className={`pl-10 ${theme.input}`}
            />

            {open && query.length >= 2 && (
                <div className={`absolute z-50 mt-1 w-full max-h-72 overflow-y-auto rounded-lg border shadow-lg ${theme.cardSolid}`}>
                    {isFetching && (
                        <div className={`px-4 py-3 text-sm ${theme.textMuted}`}>Searching…</div>
                    )}

                    {!isFetching && students.length === 0 && (
                        <div className={`px-4 py-3 text-sm ${theme.textMuted}`}>No students found</div>
                    )}

                    {!isFetching && students.map((s) => (
                        <button
                            key={s._id}
                            type="button"
                            onClick={() => {
                                onChange(s);
                                setOpen(false);
                            }}
                            className={`w-full text-left px-4 py-3 flex items-center justify-between gap-3 transition-colors ${theme.row}`}
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
                                    theme.isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                                }`}>
                                    {s.name?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                                <div className="min-w-0">
                                    <p className={`text-sm font-medium truncate ${theme.text}`}>{s.name}</p>
                                    <p className={`text-xs truncate ${theme.textMuted}`}>
                                        Roll {s.rollNumber || '—'}
                                        {s.class?.name ? ` • ${s.class.name}` : ''}
                                    </p>
                                </div>
                            </div>
                            {s.summary?.dueBalance !== undefined && (
                                <span className={`text-xs font-medium ${
                                    parseFloat(s.summary.dueBalance) > 0
                                        ? (theme.isDarkMode ? 'text-red-400' : 'text-red-600')
                                        : (theme.isDarkMode ? 'text-emerald-400' : 'text-emerald-600')
                                }`}>
                                    {formatCurrency(s.summary.dueBalance)}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default StudentSearchInput;