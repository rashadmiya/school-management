// src/components/finance/templates/FeeTemplateForm.jsx
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
    useCreateFeeTemplateMutation,
    useUpdateFeeTemplateMutation,
} from '@/features/apis/finance/feeApi';
import { useFinanceTheme } from '@/hooks/finance/useFinanceTheme';
import { getSessionOptions } from '@/lib/financeUtils';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

const FREQUENCY_OPTIONS = [
    { value: 'one_time', label: 'One-time' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'yearly', label: 'Yearly' },
    { value: 'custom', label: 'Custom' },
];

const SCOPE_OPTIONS = [
    { value: 'all', label: 'All Students' },
    { value: 'class', label: 'By Class' },
    { value: 'section', label: 'By Section' },
    { value: 'individual', label: 'Individual Student' },
];

function getDefaultValues(template) {
    const currentYear = new Date().getFullYear();
    const defaultSession = `${currentYear}-${currentYear + 1}`;

    if (!template) {
        return {
            title: '',
            description: '',
            amount: '',
            frequency: 'monthly',
            session: defaultSession,
            dueDay: 1,
            taxPercentage: 0,
            isActive: true,
            appliesTo: {
                scope: 'all',
                class: '',
                section: '',
                individualStudent: '',
            },
        };
    }

    return {
        title: template.title || '',
        description: template.description || '',
        amount: template.amount?.toString?.() || '',
        frequency: template.frequency || 'monthly',
        session: template.session || defaultSession,
        dueDay: template.dueDay || 1,
        taxPercentage: template.taxPercentage || 0,
        isActive: template.isActive !== false,
        appliesTo: {
            scope: template.appliesTo?.scope || 'all',
            class:
                typeof template.appliesTo?.class === 'object'
                    ? template.appliesTo.class?._id || ''
                    : template.appliesTo?.class || '',
            section:
                typeof template.appliesTo?.section === 'object'
                    ? template.appliesTo.section?._id || ''
                    : template.appliesTo?.section || '',
            individualStudent:
                typeof template.appliesTo?.individualStudent === 'object'
                    ? template.appliesTo.individualStudent?._id || ''
                    : template.appliesTo?.individualStudent || '',
        },
    };
}

/**
 * Props:
 *   template    — existing template (edit mode) or null (create)
 *   classes     — array of Class docs (with _id, name, section)
 *   onSuccess   — called after save
 *   onCancel    — called on cancel
 */
export default function FeeTemplateForm({ template, classes = [], onSuccess, onCancel }) {
    const theme = useFinanceTheme();
    const isEdit = !!template;

    const {
        register,
        handleSubmit,
        reset,
        control,
        watch,
        formState: { errors, isSubmitting },
    } = useForm({
        defaultValues: getDefaultValues(template),
    });

    const [createTemplate] = useCreateFeeTemplateMutation();
    const [updateTemplate] = useUpdateFeeTemplateMutation();

    useEffect(() => {
        reset(getDefaultValues(template));
    }, [template, reset]);

    const scope = watch('appliesTo.scope');
    const selectedClassId = watch('appliesTo.class');

    const sessions = useMemo(() => getSessionOptions(), []);

    // Sections available for the selected class (if class has `sections`)
    const sectionsForClass = useMemo(() => {
        if (!selectedClassId) return [];
        const cls = classes.find((c) => c._id === selectedClassId);
        return cls?.sections || [];
    }, [classes, selectedClassId]);

    // Students available for the selected class (for individual scope)
    const studentsForClass = useMemo(() => {
        if (!selectedClassId || scope !== 'individual') return [];
        const cls = classes.find((c) => c._id === selectedClassId);
        return cls?.students || [];
    }, [classes, selectedClassId, scope]);

    const onSubmit = async (form) => {
        // Build payload exactly as backend expects
        const amountNum = parseFloat(form.amount);
        if (!Number.isFinite(amountNum) || amountNum <= 0) {
            toast.error('Amount must be a positive number');
            return;
        }

        const payload = {
            title: form.title.trim(),
            description: form.description?.trim() || '',
            amount: amountNum,
            frequency: form.frequency,
            session: form.session,
            dueDay: Number(form.dueDay) || 1,
            taxPercentage: Number(form.taxPercentage) || 0,
            isActive: !!form.isActive,
            appliesTo: {
                scope: form.appliesTo.scope,
                class:
                    ['class', 'section', 'individual'].includes(form.appliesTo.scope)
                        ? form.appliesTo.class || null
                        : null,
                section:
                    form.appliesTo.scope === 'section'
                        ? form.appliesTo.section || null
                        : null,
                individualStudent:
                    form.appliesTo.scope === 'individual'
                        ? form.appliesTo.individualStudent || null
                        : null,
            },
        };

        // Client-side validation of scope requirements
        if (['class', 'section', 'individual'].includes(payload.appliesTo.scope) && !payload.appliesTo.class) {
            toast.error('Please select a class');
            return;
        }
        if (payload.appliesTo.scope === 'section' && !payload.appliesTo.section) {
            toast.error('Please select a section');
            return;
        }
        if (payload.appliesTo.scope === 'individual' && !payload.appliesTo.individualStudent) {
            toast.error('Please select a student');
            return;
        }

        try {
            if (isEdit) {
                await updateTemplate({ id: template._id, ...payload }).unwrap();
                toast.success('Fee template updated');
            } else {
                const res = await createTemplate(payload).unwrap();
                toast.success('Fee template created');
                onSuccess?.(res?.data);   // ← pass the created template up
                return;
            }
            onSuccess?.();
        } catch (err) {
            toast.error(err?.data?.message || 'Failed to save fee template');
        }
    };

    const inputCls = theme.input;
    const labelCls = `text-sm font-medium ${theme.textSoft}`;
    const errCls = 'text-xs text-red-500 mt-1 flex items-center gap-1';

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Row 1: Title + Amount */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label className={labelCls}>Title <span className="text-red-500">*</span></Label>
                    <Input
                        placeholder="e.g., Monthly Tuition Fee"
                        {...register('title', { required: 'Title is required', minLength: { value: 3, message: 'Too short' } })}
                        className={`${inputCls} ${errors.title ? 'border-red-500' : ''}`}
                    />
                    {errors.title && (
                        <p className={errCls}><AlertCircle className="w-3 h-3" />{errors.title.message}</p>
                    )}
                </div>

                <div className="space-y-1.5">
                    <Label className={labelCls}>Amount (BDT) <span className="text-red-500">*</span></Label>
                    <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="e.g., 5000"
                        {...register('amount', {
                            required: 'Amount is required',
                            validate: (v) => parseFloat(v) > 0 || 'Must be greater than 0',
                        })}
                        className={`${inputCls} ${errors.amount ? 'border-red-500' : ''}`}
                    />
                    {errors.amount && (
                        <p className={errCls}><AlertCircle className="w-3 h-3" />{errors.amount.message}</p>
                    )}
                </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
                <Label className={labelCls}>Description</Label>
                <Textarea
                    rows={2}
                    placeholder="Optional notes about this fee (max 500 characters)"
                    maxLength={500}
                    {...register('description')}
                    className={`${inputCls} resize-none`}
                />
            </div>

            {/* Row 2: Frequency, Session, Due Day, Tax */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                    <Label className={labelCls}>Frequency</Label>
                    <Controller
                        name="frequency"
                        control={control}
                        render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger className={theme.select}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className={theme.selectContent}>
                                    {FREQUENCY_OPTIONS.map((f) => (
                                        <SelectItem key={f.value} value={f.value} className={theme.selectItem}>
                                            {f.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    />
                </div>

                <div className="space-y-1.5">
                    <Label className={labelCls}>Session</Label>
                    <Controller
                        name="session"
                        control={control}
                        render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger className={theme.select}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className={theme.selectContent}>
                                    {sessions.map((s) => (
                                        <SelectItem key={s} value={s} className={theme.selectItem}>
                                            {s}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    />
                </div>

                <div className="space-y-1.5">
                    <Label className={labelCls}>Due Day</Label>
                    <Input
                        type="number"
                        min="1"
                        max="31"
                        {...register('dueDay', { min: 1, max: 31 })}
                        className={inputCls}
                    />
                </div>

                <div className="space-y-1.5">
                    <Label className={labelCls}>Tax %</Label>
                    <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        {...register('taxPercentage', { min: 0, max: 100 })}
                        className={inputCls}
                    />
                </div>
            </div>

            {/* Scope */}
            <div className="space-y-3 pt-2 border-t border-dashed" style={{ borderColor: theme.isDarkMode ? '#374151' : '#e5e7eb' }}>
                <div>
                    <Label className={labelCls}>Applies To <span className="text-red-500">*</span></Label>
                    <p className={`text-xs ${theme.textMuted} mt-0.5`}>
                        Choose who this fee will be applied to.
                    </p>
                </div>

                <Controller
                    name="appliesTo.scope"
                    control={control}
                    render={({ field }) => (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {SCOPE_OPTIONS.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => field.onChange(opt.value)}
                                    className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${field.value === opt.value
                                        ? 'bg-blue-600 border-blue-600 text-white'
                                        : `${theme.cardSolid} ${theme.textSoft} ${theme.cardHover}`
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    )}
                />

                {['class', 'section', 'individual'].includes(scope) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className={labelCls}>Class <span className="text-red-500">*</span></Label>
                            <Controller
                                name="appliesTo.class"
                                control={control}
                                render={({ field }) => (
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <SelectTrigger className={theme.select}>
                                            <SelectValue placeholder="Select class" />
                                        </SelectTrigger>
                                        <SelectContent className={theme.selectContent}>
                                            {classes.map((c) => (
                                                <SelectItem key={c._id} value={c._id} className={theme.selectItem}>
                                                    {c.name}
                                                    {c.section?.name ? ` - ${c.section.name}` : ''}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>

                        {scope === 'section' && (
                            <div className="space-y-1.5">
                                <Label className={labelCls}>Section <span className="text-red-500">*</span></Label>
                                <Controller
                                    name="appliesTo.section"
                                    control={control}
                                    render={({ field }) => (
                                        <Select value={field.value} onValueChange={field.onChange}>
                                            <SelectTrigger className={theme.select}>
                                                <SelectValue placeholder="Select section" />
                                            </SelectTrigger>
                                            <SelectContent className={theme.selectContent}>
                                                {sectionsForClass.length === 0 && (
                                                    <div className={`px-3 py-2 text-sm ${theme.textMuted}`}>
                                                        No sections available
                                                    </div>
                                                )}
                                                {sectionsForClass.map((s) => (
                                                    <SelectItem key={s._id} value={s._id} className={theme.selectItem}>
                                                        {s.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>
                        )}

                        {scope === 'individual' && (
                            <div className="space-y-1.5 md:col-span-2">
                                <Label className={labelCls}>Student <span className="text-red-500">*</span></Label>
                                <Controller
                                    name="appliesTo.individualStudent"
                                    control={control}
                                    render={({ field }) => (
                                        <Select value={field.value} onValueChange={field.onChange}>
                                            <SelectTrigger className={theme.select}>
                                                <SelectValue placeholder="Select student" />
                                            </SelectTrigger>
                                            <SelectContent className={theme.selectContent}>
                                                {studentsForClass.length === 0 && (
                                                    <div className={`px-3 py-2 text-sm ${theme.textMuted}`}>
                                                        No students in this class
                                                    </div>
                                                )}
                                                {studentsForClass.map((s) => (
                                                    <SelectItem key={s._id} value={s._id} className={theme.selectItem}>
                                                        {s.name} — Roll {s.rollNumber}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Active toggle */}
            <div className={`flex items-center justify-between p-3 rounded-lg border ${theme.cardSolid}`}>
                <div>
                    <Label className={`text-sm font-medium ${theme.text}`}>Active</Label>
                    <p className={`text-xs ${theme.textMuted}`}>
                        Inactive templates are hidden from the apply workflow.
                    </p>
                </div>
                <Controller
                    name="isActive"
                    control={control}
                    render={({ field }) => (
                        <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                    )}
                />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={onCancel} className={theme.outlineBtn}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className={theme.primaryBtn}>
                    {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {isEdit ? 'Update Template' : 'Create Template'}
                </Button>
            </div>
        </form>
    );
}

