// src/pages/finance/fees/ApplyFeeWizard.jsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    ArrowLeft, ArrowRight, CheckCircle, FileText, Sparkles, Users, UserCheck, AlertCircle, Loader2,
    XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    FinancePageHeader, FinanceStatCard, FinanceLoading, FinanceEmptyState,
    MoneyDisplay, StatusBadge, ConfirmDialog,
} from '@/components/finance';
import { useFinanceTheme } from '@/hooks/finance/useFinanceTheme';
import { useFinancePermissions } from '@/hooks/finance/useFinancePermissions';
import {
    useGetFeeTemplatesQuery,
    useGetEligibleStudentsQuery,
    useApplyFeeTemplateMutation,
} from '@/features/apis/finance/feeApi';
import { getScopeLabel, getFrequencyLabel } from '@/lib/financeUtils';
import { toast } from 'sonner';

const STEPS = [
    { id: 1, key: 'select', label: 'Select Template', icon: FileText },
    { id: 2, key: 'preview', label: 'Preview Students', icon: Users },
    { id: 3, key: 'confirm', label: 'Confirm & Apply', icon: Sparkles },
];

export default function ApplyFeeWizard() {
    const theme = useFinanceTheme();
    const can = useFinancePermissions();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const templateIdFromUrl = searchParams.get('templateId');

    const [step, setStep] = useState(templateIdFromUrl ? 2 : 1);
    const [templateId, setTemplateId] = useState(templateIdFromUrl || '');
    const [force, setForce] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);

    // Load templates for step 1
    const { data: templatesData, isLoading: loadingTemplates } = useGetFeeTemplatesQuery({ isActive: true });
    const templates = templatesData?.data || [];

    // Load eligible students for step 2
    const {
        data: eligibleData,
        isLoading: loadingEligible,
        refetch: refetchEligible,
    } = useGetEligibleStudentsQuery(templateId, { skip: !templateId });

    const [applyFee, { isLoading: isApplying }] = useApplyFeeTemplateMutation();

    const selectedTemplate = useMemo(
        () => templates.find((t) => t._id === templateId) || null,
        [templates, templateId]
    );

    const payload = eligibleData?.data || {};
    const students = payload.eligibleStudents || [];
    const counts = payload.counts || {};

    const willApply = useMemo(
        () => students.filter((s) => !s.alreadyHasFee || force),
        [students, force]
    );

    // Sync URL when template changes
    useEffect(() => {
        if (templateId) {
            setSearchParams({ templateId });
        } else {
            setSearchParams({});
        }
    }, [templateId, setSearchParams]);

    // const goNext = () => {
    //     if (step === 1 && !templateId) {
    //         toast.error('Please select a template');
    //         return;
    //     }
    //     setStep((s) => Math.min(s + 1, 3));
    // };

    const goNext = () => {
        if (step === 1 && !templateId) {
            toast.error('Please select a template');
            return;
        }
        if (step === 1 && loadingEligible) {
            // stay on step 1, spinner already shown by the query
            return;
        }
        setStep((s) => Math.min(s + 1, 3));
    };

    const goBack = () => setStep((s) => Math.max(s - 1, 1));

    const handleApply = async () => {
        if (!templateId) return;
        try {
            const result = await applyFee({ id: templateId, force }).unwrap();
            toast.success(
                `Fee applied to ${result?.appliedTo || result?.feeInstances?.length || 0} students`
            );
            setConfirmOpen(false);
            navigate('/admin/finance/fees/templates');
        } catch (err) {
            toast.error(err?.data?.message || 'Failed to apply fee');
        }
    };

    return (
        <div className={`space-y-6 ${theme.text}`}>
            <FinancePageHeader
                title="Apply Fee"
                subtitle="Assign a fee template to a group of students in three steps."
                breadcrumb={[
                    { label: 'Fee Templates', to: '/admin/finance/fees/templates' },
                    { label: 'Apply Fee' },
                ]}
                actions={
                    <Button
                        variant="outline"
                        onClick={() => navigate('/admin/finance/fees/templates')}
                        className={theme.outlineBtn}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Cancel
                    </Button>
                }
            />

            {/* Stepper */}
            <Card className={`border shadow-sm ${theme.card}`}>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between max-w-2xl mx-auto">
                        {STEPS.map((s, idx) => {
                            const Icon = s.icon;
                            const isActive = step === s.id;
                            const isDone = step > s.id;
                            return (
                                <div key={s.id} className="flex items-center flex-1">
                                    <div className="flex flex-col items-center">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${isDone
                                            ? 'bg-emerald-500 border-emerald-500 text-white'
                                            : isActive
                                                ? 'bg-blue-600 border-blue-600 text-white'
                                                : `${theme.surfaceSolid} ${theme.borderSoft} ${theme.textMuted}`
                                            }`}>
                                            {isDone ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                                        </div>
                                        <span className={`text-xs mt-1.5 font-medium ${isActive || isDone ? theme.text : theme.textMuted
                                            }`}>
                                            {s.label}
                                        </span>
                                    </div>
                                    {idx < STEPS.length - 1 && (
                                        <div className={`flex-1 h-0.5 mx-2 ${step > s.id ? 'bg-emerald-500' : (theme.isDarkMode ? 'bg-gray-700' : 'bg-gray-200')
                                            }`} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Step content */}
            {step === 1 && (
                <Card className={`border shadow-sm ${theme.card}`}>
                    <CardHeader>
                        <CardTitle className={theme.text}>Select a Fee Template</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {loadingTemplates ? (
                            <FinanceLoading />
                        ) : templates.length === 0 ? (
                            <FinanceEmptyState
                                icon={FileText}
                                title="No active templates"
                                description="Create a template first, then return to apply it."
                                actionLabel="Go to Templates"
                                onAction={() => navigate('/admin/finance/fees/templates')}
                            />
                        ) : (
                            <div className="space-y-2">
                                {templates.map((t) => (
                                    <button
                                        key={t._id}
                                        type="button"
                                        onClick={() => setTemplateId(t._id)}
                                        className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${templateId === t._id
                                            ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-500/5'
                                            : `${theme.cardSolid} ${theme.cardHover}`
                                            }`}
                                    >
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={`p-2 rounded-lg ${theme.iconBox}`}>
                                                    <FileText className="w-4 h-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className={`text-sm font-medium truncate ${theme.text}`}>
                                                        {t.title}
                                                    </p>
                                                    <p className={`text-xs truncate ${theme.textMuted}`}>
                                                        {getFrequencyLabel(t.frequency)} • {getScopeLabel(t.appliesTo?.scope)} • {t.session}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <MoneyDisplay value={t.amount} />
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {step === 2 && (
                <>
                    {loadingEligible ? (
                        <FinanceLoading fullPage />
                    ) : !selectedTemplate ? (
                        <FinanceEmptyState
                            icon={AlertCircle}
                            title="Template not found"
                            description="The selected template could not be loaded."
                        />
                    ) : (
                        <>
                            {/* Template summary */}
                            <Card className={`border shadow-sm ${theme.card}`}>
                                <CardContent className="pt-5 flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`p-2.5 rounded-lg ${theme.iconBox}`}>
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className={`text-base font-semibold ${theme.text}`}>
                                                {selectedTemplate.title}
                                            </p>
                                            <p className={`text-xs ${theme.textMuted}`}>
                                                {getFrequencyLabel(selectedTemplate.frequency)} • {getScopeLabel(selectedTemplate.appliesTo?.scope)}
                                            </p>
                                        </div>
                                    </div>
                                    <MoneyDisplay value={selectedTemplate.amount} size="lg" />
                                </CardContent>
                            </Card>

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-4">
                                <FinanceStatCard label="Eligible" value={counts.total || 0} icon={Users} accent="blue" />
                                <FinanceStatCard label="Skip (Has Fee)" value={counts.alreadyHasFee || 0} icon={XCircle} accent="yellow" />
                                <FinanceStatCard label="Will Be Applied" value={willApply.length} icon={UserCheck} accent="green" />
                            </div>

                            {/* Force re-apply toggle */}
                            {counts.alreadyHasFee > 0 && (
                                <Card className={`border shadow-sm ${theme.card}`}>
                                    <CardContent className="pt-5 flex items-center justify-between gap-4">
                                        <div>
                                            <Label className={`text-sm font-medium ${theme.text}`}>
                                                Re-apply to students who already have this fee
                                            </Label>
                                            <p className={`text-xs ${theme.textMuted} mt-0.5`}>
                                                By default, students with an existing fee instance are skipped.
                                            </p>
                                        </div>
                                        <Switch checked={force} onCheckedChange={setForce} />
                                    </CardContent>
                                </Card>
                            )}

                            {/* Students table */}
                            <Card className={`border shadow-sm ${theme.card}`}>
                                <CardHeader className="pb-3">
                                    <CardTitle className={`text-lg ${theme.text}`}>
                                        Eligible Students ({students.length})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {students.length === 0 ? (
                                        <FinanceEmptyState icon={Users} title="No eligible students" />
                                    ) : (
                                        <div className="overflow-x-auto max-h-[420px]">
                                            <Table>
                                                <TableHeader className={theme.tableHeader}>
                                                    <TableRow>
                                                        <TableHead className={theme.textMuted}>Student</TableHead>
                                                        <TableHead className={theme.textMuted}>Roll</TableHead>
                                                        <TableHead className={theme.textMuted}>Class</TableHead>
                                                        <TableHead className={`text-right ${theme.textMuted}`}>Status</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {students.map((s) => {
                                                        const willApplyThis = !s.alreadyHasFee || force;
                                                        return (
                                                            <TableRow key={s._id} className={theme.row}>
                                                                <TableCell className={`text-sm font-medium ${theme.text}`}>
                                                                    {s.name}
                                                                </TableCell>
                                                                <TableCell className={`text-sm ${theme.textSoft}`}>
                                                                    {s.rollNumber || '—'}
                                                                </TableCell>
                                                                <TableCell className={`text-sm ${theme.textSoft}`}>
                                                                    {s.class?.name || '—'}
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    {willApplyThis ? (
                                                                        <StatusBadge domain="fee" status="unpaid" label="Will apply" />
                                                                    ) : (
                                                                        <StatusBadge domain="fee" status="paid" label="Skip" />
                                                                    )}
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </>
                    )}
                </>
            )}

            {step === 3 && selectedTemplate && (
                <Card className={`border shadow-sm ${theme.card}`}>
                    <CardHeader>
                        <CardTitle className={theme.text}>Confirm & Apply</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className={`p-4 rounded-lg border ${theme.cardSolid}`}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <SummaryRow theme={theme} label="Template" value={selectedTemplate.title} />
                                <SummaryRow theme={theme} label="Amount" value={<MoneyDisplay value={selectedTemplate.amount} />} />
                                <SummaryRow theme={theme} label="Frequency" value={getFrequencyLabel(selectedTemplate.frequency)} />
                                <SummaryRow theme={theme} label="Scope" value={getScopeLabel(selectedTemplate.appliesTo?.scope)} />
                                <SummaryRow theme={theme} label="Session" value={selectedTemplate.session} />
                                <SummaryRow theme={theme} label="Force Re-apply" value={force ? 'Yes' : 'No'} />
                            </div>
                        </div>

                        <div className={`p-4 rounded-lg border ${theme.isDarkMode
                            ? 'bg-blue-500/10 border-blue-500/20'
                            : 'bg-blue-50 border-blue-200'
                            }`}>
                            <div className="flex items-start gap-3">
                                <Sparkles className={`w-5 h-5 mt-0.5 flex-shrink-0 ${theme.isDarkMode ? 'text-blue-400' : 'text-blue-600'
                                    }`} />
                                <div>
                                    <p className={`text-sm font-medium ${theme.isDarkMode ? 'text-blue-400' : 'text-blue-700'
                                        }`}>
                                        {willApply.length} fee instance{willApply.length === 1 ? '' : 's'} will be created
                                    </p>
                                    <p className={`text-xs mt-0.5 ${theme.isDarkMode ? 'text-blue-400/80' : 'text-blue-600'
                                        }`}>
                                        Each instance records the fee against the student's ledger for the current session.
                                        This action cannot be undone directly, but instances can be adjusted or waived.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Footer actions */}
            <div className="flex items-center justify-between pt-2">
                <Button
                    variant="outline"
                    onClick={goBack}
                    disabled={step === 1}
                    className={theme.outlineBtn}
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                </Button>

                {step < 3 ? (
                    <Button
                        onClick={goNext}
                        disabled={step === 1 && !templateId}
                        className={theme.primaryBtn}
                    >
                        Next
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                ) : (
                    <Button
                        onClick={() => setConfirmOpen(true)}
                        disabled={!can.canApplyFees || willApply.length === 0}
                        className={theme.primaryBtn}
                    >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Apply Fee
                    </Button>
                )}
            </div>

            {/* Confirm dialog */}
            <ConfirmDialog
                open={confirmOpen}
                onOpenChange={setConfirmOpen}
                title="Apply fee?"
                description={`This will create ${willApply.length} fee instance${willApply.length === 1 ? '' : 's'} for "${selectedTemplate?.title}". Continue?`}
                confirmLabel="Apply Now"
                loading={isApplying}
                onConfirm={handleApply}
            />
        </div>
    );
}

// ===== Helpers =====

function SummaryRow({ theme, label, value }) {
    return (
        <div className="flex items-center justify-between gap-3">
            <span className={`text-sm ${theme.textMuted}`}>{label}</span>
            <span className={`text-sm font-medium ${theme.text}`}>{value}</span>
        </div>
    );
}