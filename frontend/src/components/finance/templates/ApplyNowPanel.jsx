// src/components/finance/templates/ApplyNowPanel.jsx
import { Button } from '@/components/ui/button';
import {
    useApplyFeeTemplateMutation,
    useGetEligibleStudentsQuery,
} from '@/features/apis/finance/feeApi';
import { useFinanceTheme } from '@/hooks/finance/useFinanceTheme';
import {
    BookOpen, CheckCircle, ChevronDown, ChevronUp,
    Loader2, SkipForward, Sparkles, User, Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

const SCOPE_LABEL = {
    all: 'All Students',
    class: 'By Class',
    section: 'By Section',
    individual: 'Individual Student',
};

function describeScope(appliesTo) {
    if (!appliesTo) return '—';
    const { scope, class: cls, section, individualStudent } = appliesTo;
    const className = cls?.name || cls?.title || '—';

    switch (scope) {
        case 'all':
            return 'Every active student in this session';
        case 'class':
            return `Class: ${className}`;
        case 'section':
            return `Class: ${className} • Section: ${section?.name || '—'}`;
        case 'individual':
            return `Student: ${individualStudent?.name || '—'}`;
        default:
            return '—';
    }
}

export default function ApplyNowPanel({ template, onSkip, onApplied }) {
    const theme = useFinanceTheme();
    const [showBreakdown, setShowBreakdown] = useState(false);

    const {
        data: eligibleData,
        isLoading: loadingEligible,
    } = useGetEligibleStudentsQuery(template._id, { skip: !template?._id });

    const [applyTemplate, { isLoading: applying }] = useApplyFeeTemplateMutation();

    const templateInfo = eligibleData?.data?.template;
    const students = eligibleData?.data?.eligibleStudents || [];
    const counts = eligibleData?.data?.counts || {};

    const totalEligible = counts.total ?? 0;
    const alreadyHasFee = counts.alreadyHasFee ?? 0;
    const willBeApplied = counts.willBeApplied ?? 0;
    const nothingToDo = !loadingEligible && willBeApplied === 0;

    // Class breakdown (only useful for "all" scope, but harmless everywhere)
    const byClass = useMemo(() => {
        const map = new Map();
        for (const s of students) {
            const key = s.class?._id || 'unassigned';
            const name = s.class?.name || 'Unassigned';
            if (!map.has(key)) map.set(key, { name, count: 0 });
            map.get(key).count += 1;
        }
        return [...map.values()].sort((a, b) => b.count - a.count);
    }, [students]);

    const showBreakdownToggle =
        !loadingEligible &&
        (templateInfo?.scope === 'all' || byClass.length > 1);

    const handleApply = async () => {
        try {
            await applyTemplate({ id: template._id, force: false }).unwrap();
            toast.success(
                willBeApplied > 0
                    ? `Fee applied to ${willBeApplied} student${willBeApplied === 1 ? '' : 's'}`
                    : 'No new students to apply to'
            );
            onApplied?.();
        } catch (err) {
            toast.error(err?.data?.message || 'Failed to apply fee');
        }
    };

    return (
        <div className="space-y-5">
            {/* Success header */}
            <div className="text-center space-y-2">
                <div
                    className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center ${
                        theme.isDarkMode ? 'bg-emerald-500/20' : 'bg-emerald-100'
                    }`}
                >
                    <CheckCircle
                        className={`w-8 h-8 ${
                            theme.isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
                        }`}
                    />
                </div>
                <h3 className={`text-lg font-semibold ${theme.text}`}>
                    Template created
                </h3>
                <p className={`text-sm ${theme.textMuted}`}>
                    <strong className={theme.text}>{template.title}</strong>{' '}
                    is saved. Apply it now, or apply later from the templates list.
                </p>
            </div>

            {/* Scope summary — reflects what was chosen in the form */}
            <div className={`rounded-lg border p-3 space-y-2 ${theme.cardSolid}`}>
                <div className="flex items-center justify-between">
                    <span className={`text-xs uppercase tracking-wide ${theme.textMuted}`}>
                        Applies To
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                        theme.isDarkMode
                            ? 'bg-blue-500/20 text-blue-300'
                            : 'bg-blue-100 text-blue-700'
                    }`}>
                        {SCOPE_LABEL[templateInfo?.scope] || '—'}
                    </span>
                </div>
                <p className={`text-sm ${theme.textSoft}`}>
                    {describeScope(templateInfo?.appliesTo)}
                </p>
            </div>

            {/* Eligible counts */}
            <div className={`rounded-lg border p-4 space-y-2 ${theme.cardSolid}`}>
                {loadingEligible ? (
                    <div
                        className={`flex items-center justify-center gap-2 py-3 text-sm ${theme.textMuted}`}
                    >
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Checking eligible students…
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between text-sm">
                            <span className={`flex items-center gap-2 ${theme.textSoft}`}>
                                <Users className="w-4 h-4" />
                                Eligible students
                            </span>
                            <span className={`font-semibold ${theme.text}`}>
                                {totalEligible}
                            </span>
                        </div>

                        <div
                            className={`flex items-center justify-between text-sm ${theme.textMuted}`}
                        >
                            <span>Already has this fee</span>
                            <span className="font-medium">{alreadyHasFee}</span>
                        </div>

                        <div
                            className={`flex items-center justify-between text-sm border-t pt-2 ${
                                theme.isDarkMode ? 'border-gray-700' : 'border-gray-200'
                            }`}
                        >
                            <span
                                className={`font-medium ${
                                    nothingToDo
                                        ? theme.textMuted
                                        : theme.isDarkMode
                                        ? 'text-emerald-400'
                                        : 'text-emerald-700'
                                }`}
                            >
                                Will be applied to
                            </span>
                            <span
                                className={`font-semibold ${
                                    nothingToDo
                                        ? theme.textMuted
                                        : theme.isDarkMode
                                        ? 'text-emerald-400'
                                        : 'text-emerald-700'
                                }`}
                            >
                                {willBeApplied}
                            </span>
                        </div>

                        {/* Class breakdown toggle */}
                        {showBreakdownToggle && (
                            <button
                                type="button"
                                onClick={() => setShowBreakdown((v) => !v)}
                                className={`flex items-center gap-1 text-xs mt-2 ${
                                    theme.isDarkMode
                                        ? 'text-blue-400 hover:text-blue-300'
                                        : 'text-blue-600 hover:text-blue-700'
                                }`}
                            >
                                {showBreakdown ? (
                                    <ChevronUp className="w-3 h-3" />
                                ) : (
                                    <ChevronDown className="w-3 h-3" />
                                )}
                                {showBreakdown ? 'Hide' : 'View'} class breakdown
                            </button>
                        )}

                        {showBreakdown && (
                            <div
                                className={`mt-2 pt-2 border-t space-y-1.5 ${
                                    theme.isDarkMode ? 'border-gray-700' : 'border-gray-200'
                                }`}
                            >
                                {byClass.map((c, i) => (
                                    <div
                                        key={i}
                                        className={`flex items-center justify-between text-xs ${theme.textSoft}`}
                                    >
                                        <span className="flex items-center gap-1.5">
                                            <BookOpen className="w-3 h-3" />
                                            {c.name}
                                        </span>
                                        <span className="font-medium">{c.count}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {nothingToDo && (
                <p className={`text-xs text-center ${theme.textMuted}`}>
                    Every eligible student already has this fee. You can still apply
                    later if enrolment changes.
                </p>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-1">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onSkip}
                    disabled={applying}
                    className={`flex-1 ${theme.outlineBtn}`}
                >
                    <SkipForward className="w-4 h-4 mr-2" />
                    Apply Later
                </Button>
                <Button
                    type="button"
                    onClick={handleApply}
                    disabled={applying || loadingEligible || nothingToDo}
                    className={`flex-1 ${theme.primaryBtn}`}
                >
                    {applying ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                        <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    Apply Now
                </Button>
            </div>
        </div>
    );
}

// // src/components/finance/templates/ApplyNowPanel.jsx
// import { Button } from '@/components/ui/button';
// import {
//     useApplyFeeTemplateMutation,
//     useGetEligibleStudentsQuery,
// } from '@/features/apis/finance/feeApi';
// import { useFinanceTheme } from '@/hooks/finance/useFinanceTheme';
// import { CheckCircle, Loader2, SkipForward, Sparkles, Users } from 'lucide-react';
// import { toast } from 'sonner';

// /**
//  * Props:
//  *   template    — the freshly created template (must have _id, title, amount)
//  *   onSkip      — user chose "Apply Later"
//  *   onApplied   — apply succeeded
//  */
// export default function ApplyNowPanel({ template, onSkip, onApplied }) {
//     const theme = useFinanceTheme();

//     const {
//         data: eligibleData,
//         isLoading: loadingEligible,
//     } = useGetEligibleStudentsQuery(template._id, { skip: !template?._id });

//     const [applyTemplate, { isLoading: applying }] = useApplyFeeTemplateMutation();

//     const counts = eligibleData?.data?.counts || {};
//     const totalEligible = counts.total ?? 0;
//     const alreadyHasFee = counts.alreadyHasFee ?? 0;
//     const willBeApplied = counts.willBeApplied ?? 0;
//     const nothingToDo = !loadingEligible && willBeApplied === 0;

//     const handleApply = async () => {
//         try {
//             await applyTemplate({ id: template._id, force: false }).unwrap();
//             toast.success(
//                 willBeApplied > 0
//                     ? `Fee applied to ${willBeApplied} student${willBeApplied === 1 ? '' : 's'}`
//                     : 'No new students to apply to'
//             );
//             onApplied?.();
//         } catch (err) {
//             toast.error(err?.data?.message || 'Failed to apply fee');
//         }
//     };

//     return (
//         <div className="space-y-5">
//             {/* Success header */}
//             <div className="text-center space-y-2">
//                 <div className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center ${
//                     theme.isDarkMode ? 'bg-emerald-500/20' : 'bg-emerald-100'
//                 }`}>
//                     <CheckCircle className={`w-8 h-8 ${
//                         theme.isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
//                     }`} />
//                 </div>
//                 <h3 className={`text-lg font-semibold ${theme.text}`}>
//                     Template created
//                 </h3>
//                 <p className={`text-sm ${theme.textMuted}`}>
//                     <strong className={theme.text}>{template.title}</strong>{' '}
//                     is saved. Apply it now, or apply later from the templates list.
//                 </p>
//             </div>

//             {/* Eligible counts */}
//             <div className={`rounded-lg border p-4 space-y-2 ${theme.cardSolid}`}>
//                 {loadingEligible ? (
//                     <div className={`flex items-center justify-center gap-2 py-3 text-sm ${theme.textMuted}`}>
//                         <Loader2 className="w-4 h-4 animate-spin" />
//                         Checking eligible students…
//                     </div>
//                 ) : (
//                     <>
//                         <div className="flex items-center justify-between text-sm">
//                             <span className={`flex items-center gap-2 ${theme.textSoft}`}>
//                                 <Users className="w-4 h-4" />
//                                 Eligible students
//                             </span>
//                             <span className={`font-semibold ${theme.text}`}>{totalEligible}</span>
//                         </div>
//                         <div className={`flex items-center justify-between text-sm ${theme.textMuted}`}>
//                             <span>Already has this fee</span>
//                             <span className="font-medium">{alreadyHasFee}</span>
//                         </div>
//                         <div className={`flex items-center justify-between text-sm border-t pt-2 ${
//                             theme.isDarkMode ? 'border-gray-700' : 'border-gray-200'
//                         }`}>
//                             <span className={`font-medium ${
//                                 nothingToDo
//                                     ? theme.textMuted
//                                     : theme.isDarkMode ? 'text-emerald-400' : 'text-emerald-700'
//                             }`}>
//                                 Will be applied to
//                             </span>
//                             <span className={`font-semibold ${
//                                 nothingToDo
//                                     ? theme.textMuted
//                                     : theme.isDarkMode ? 'text-emerald-400' : 'text-emerald-700'
//                             }`}>
//                                 {willBeApplied}
//                             </span>
//                         </div>
//                     </>
//                 )}
//             </div>

//             {nothingToDo && (
//                 <p className={`text-xs text-center ${theme.textMuted}`}>
//                     Every eligible student already has this fee. You can still apply
//                     later if enrolment changes.
//                 </p>
//             )}

//             {/* Actions */}
//             <div className="flex gap-2 pt-1">
//                 <Button
//                     type="button"
//                     variant="outline"
//                     onClick={onSkip}
//                     disabled={applying}
//                     className={`flex-1 ${theme.outlineBtn}`}
//                 >
//                     <SkipForward className="w-4 h-4 mr-2" />
//                     Apply Later
//                 </Button>
//                 <Button
//                     type="button"
//                     onClick={handleApply}
//                     disabled={applying || loadingEligible || nothingToDo}
//                     className={`flex-1 ${theme.primaryBtn}`}
//                 >
//                     {applying ? (
//                         <Loader2 className="w-4 h-4 mr-2 animate-spin" />
//                     ) : (
//                         <Sparkles className="w-4 h-4 mr-2" />
//                     )}
//                     Apply Now
//                 </Button>
//             </div>
//         </div>
//     );
// }