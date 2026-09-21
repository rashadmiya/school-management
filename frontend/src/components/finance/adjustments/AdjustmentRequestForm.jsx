// src/components/finance/adjustments/AdjustmentRequestForm.jsx
import { useMemo, useState } from 'react';
import { AlertCircle, Loader2, TrendingDown, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { MoneyDisplay, StudentSearchInput } from '@/components/finance';
import { useFinanceTheme } from '@/hooks/finance/useFinanceTheme';
import { useRequestAdjustmentMutation } from '@/features/apis/finance/adjustmentApi';
import { useCurrentSession } from '@/hooks/useCurrentSession';
import { ADJUSTMENT_CATEGORY_LABELS } from '@/lib/financeUtils';
import { toast } from 'sonner';

/**
 * Props:
 *   initialStudent   — pre-selected student (optional)
 *   onSuccess
 *   onCancel
 */
export default function AdjustmentRequestForm({ initialStudent, onSuccess, onCancel }) {
    const theme = useFinanceTheme();
    const { selectedSession } = useCurrentSession();
    const session = selectedSession || '';

    const [student, setStudent] = useState(initialStudent || null);
    const [type, setType] = useState('credit');
    const [category, setCategory] = useState('correction');
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');

    const [requestAdjustment, { isLoading }] = useRequestAdjustmentMutation();

    const amountNum = parseFloat(amount) || 0;
    const valid = student && amountNum > 0 && reason.trim().length >= 5;

    const handleSubmit = async () => {
        if (!valid) return;
        try {
            await requestAdjustment({
                studentId: student._id,
                session,
                type,
                category,
                amount: amountNum,
                reason: reason.trim(),
            }).unwrap();
            toast.success('Adjustment request submitted');
            onSuccess?.();
            onCancel?.();
        } catch (err) {
            toast.error(err?.data?.message || 'Failed to submit adjustment');
        }
    };

    const inputCls = theme.input;
    const labelCls = `text-sm font-medium ${theme.textSoft}`;

    return (
        <div className="space-y-5">
            {/* Student */}
            <div className="space-y-1.5">
                <Label className={labelCls}>Student <span className="text-red-500">*</span></Label>
                <StudentSearchInput
                    value={student}
                    onChange={setStudent}
                    session={session}
                    autoFocus={!initialStudent}
                />
            </div>

            {/* Type toggle */}
            <div className="space-y-1.5">
                <Label className={labelCls}>Type <span className="text-red-500">*</span></Label>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setType('credit')}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                            type === 'credit'
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : `${theme.cardSolid} ${theme.textSoft} ${theme.cardHover}`
                        }`}
                    >
                        <TrendingUp className="w-4 h-4" />
                        Credit (reduce balance)
                    </button>
                    <button
                        type="button"
                        onClick={() => setType('debit')}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                            type === 'debit'
                                ? 'bg-red-600 border-red-600 text-white'
                                : `${theme.cardSolid} ${theme.textSoft} ${theme.cardHover}`
                        }`}
                    >
                        <TrendingDown className="w-4 h-4" />
                        Debit (increase balance)
                    </button>
                </div>
                <p className={`text-xs ${theme.textMuted}`}>
                    {type === 'credit'
                        ? 'Use this to reduce what a student owes — for corrections, write-offs, or scholarships.'
                        : 'Use this to add a fine, late fee, or other charge.'}
                </p>
            </div>

            {/* Category */}
            <div className="space-y-1.5">
                <Label className={labelCls}>Category <span className="text-red-500">*</span></Label>
                <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className={theme.select}>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className={theme.selectContent}>
                        {Object.entries(ADJUSTMENT_CATEGORY_LABELS).map(([k, v]) => (
                            <SelectItem key={k} value={k} className={theme.selectItem}>{v}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
                <Label className={labelCls}>Amount <span className="text-red-500">*</span></Label>
                <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className={inputCls}
                />
            </div>

            {/* Reason */}
            <div className="space-y-1.5">
                <Label className={labelCls}>Reason <span className="text-red-500">*</span></Label>
                <Textarea
                    rows={3}
                    placeholder="Explain the adjustment (this will be visible in the audit log)"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className={`${inputCls} resize-none`}
                />
            </div>

            {/* Notice */}
            <div className={`p-3 rounded-lg border flex gap-2 ${
                theme.isDarkMode
                    ? 'bg-yellow-500/5 border-yellow-500/20 text-yellow-400'
                    : 'bg-yellow-50 border-yellow-200 text-yellow-700'
            }`}>
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p className="text-xs">
                    Adjustments require approval before they affect the student's balance.
                </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={onCancel} className={theme.outlineBtn}>
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    disabled={!valid || isLoading}
                    className={theme.primaryBtn}
                >
                    {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Submit Adjustment
                </Button>
            </div>
        </div>
    );
}