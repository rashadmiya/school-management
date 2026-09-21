// src/components/finance/waivers/WaiverRequestForm.jsx
import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Loader2, Percent, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { MoneyDisplay } from '@/components/finance';
import { useFinanceTheme } from '@/hooks/finance/useFinanceTheme';
import {
    useRequestWaiverMutation,
    useGetEligibleWaiverQuery,
} from '@/features/apis/finance/waiverApi';
import { WAIVER_TYPE_LABELS } from '@/lib/financeUtils';
import { toMoneyNumber, formatCurrency } from '@/lib/formaters';
import { toast } from 'sonner';

/**
 * Props:
 *   feeInstance   — FeeInstance to waive
 *   onSuccess
 *   onCancel
 */
export default function WaiverRequestForm({ feeInstance, onSuccess, onCancel }) {
    const theme = useFinanceTheme();

    const [type, setType] = useState('partial');
    const [mode, setMode] = useState('amount'); // 'amount' | 'percentage'
    const [amount, setAmount] = useState('');
    const [percentage, setPercentage] = useState('');
    const [reason, setReason] = useState('');
    const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().split('T')[0]);
    const [effectiveUntil, setEffectiveUntil] = useState('');

    const { data: eligibleRes, isLoading: loadingEligibility } = useGetEligibleWaiverQuery(
        feeInstance?._id,
        { skip: !feeInstance?._id }
    );
    const eligibility = eligibleRes?.data || {};
    const maxWaivable = toMoneyNumber(eligibility.maxWaivable || 0);

    const [requestWaiver, { isLoading }] = useRequestWaiverMutation();

    // Auto-fill on type change
    useEffect(() => {
        if (type === 'full') {
            setMode('amount');
            setAmount(maxWaivable.toFixed(2));
            setPercentage('100');
        } else if (type === 'partial' && mode === 'amount') {
            // keep existing
        }
    }, [type, maxWaivable, mode]);

    // Live-computed amount from percentage
    const computedAmount = useMemo(() => {
        if (mode === 'amount') {
            const n = parseFloat(amount);
            return Number.isFinite(n) ? Math.min(n, maxWaivable) : 0;
        }
        const p = parseFloat(percentage);
        if (!Number.isFinite(p)) return 0;
        return Math.min((maxWaivable * p) / 100, maxWaivable);
    }, [amount, percentage, mode, maxWaivable]);

    const handleSubmit = async () => {
        if (!feeInstance?._id) {
            toast.error('No fee selected');
            return;
        }
        if (computedAmount <= 0) {
            toast.error('Waiver amount must be greater than 0');
            return;
        }
        if (!reason || reason.trim().length < 5) {
            toast.error('Please provide a reason (min 5 characters)');
            return;
        }

        const payload = {
            feeInstanceId: feeInstance._id,
            type,
            reason: reason.trim(),
            effectiveFrom,
            effectiveUntil: effectiveUntil || undefined,
        };

        if (mode === 'amount') payload.amount = computedAmount;
        else payload.percentage = parseFloat(percentage);

        try {
            await requestWaiver(payload).unwrap();
            toast.success('Waiver request submitted');
            onSuccess?.();
        } catch (err) {
            toast.error(err?.data?.message || 'Failed to submit waiver');
        }
    };

    const inputCls = theme.input;
    const labelCls = `text-sm font-medium ${theme.textSoft}`;

    if (loadingEligibility) {
        return (
            <div className="py-12 text-center">
                <Loader2 className={`w-6 h-6 animate-spin mx-auto ${theme.isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                <p className={`text-sm mt-2 ${theme.textMuted}`}>Checking eligibility…</p>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Fee summary */}
            <div className={`p-4 rounded-lg border ${theme.cardSolid}`}>
                <p className={`text-xs ${theme.textMuted}`}>Fee Instance</p>
                <p className={`text-sm font-semibold mt-0.5 ${theme.text}`}>
                    {feeInstance?.title || feeInstance?.feeTemplate?.title || 'Fee'}
                </p>
                <div className="grid grid-cols-3 gap-3 mt-3">
                    <div>
                        <p className={`text-xs ${theme.textMuted}`}>Total</p>
                        <MoneyDisplay value={eligibility.totalAmount || 0} size="sm" />
                    </div>
                    <div>
                        <p className={`text-xs ${theme.textMuted}`}>Already Waived</p>
                        <MoneyDisplay value={eligibility.alreadyWaived || 0} size="sm" />
                    </div>
                    <div>
                        <p className={`text-xs ${theme.textMuted}`}>Max Waivable</p>
                        <MoneyDisplay value={maxWaivable} size="sm" tone="positive" />
                    </div>
                </div>
            </div>

            {/* Type */}
            <div className="space-y-1.5">
                <Label className={labelCls}>Waiver Type <span className="text-red-500">*</span></Label>
                <Select value={type} onValueChange={setType}>
                    <SelectTrigger className={theme.select}>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className={theme.selectContent}>
                        {Object.entries(WAIVER_TYPE_LABELS).map(([k, v]) => (
                            <SelectItem key={k} value={k} className={theme.selectItem}>{v}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Mode toggle */}
            {type !== 'full' && (
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setMode('amount')}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                            mode === 'amount'
                                ? 'bg-blue-600 border-blue-600 text-white'
                                : `${theme.cardSolid} ${theme.textSoft} ${theme.cardHover}`
                        }`}
                    >
                        <DollarSign className="w-4 h-4" /> Amount
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('percentage')}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                            mode === 'percentage'
                                ? 'bg-blue-600 border-blue-600 text-white'
                                : `${theme.cardSolid} ${theme.textSoft} ${theme.cardHover}`
                        }`}
                    >
                        <Percent className="w-4 h-4" /> Percentage
                    </button>
                </div>
            )}

            {/* Amount / Percentage */}
            <div className="space-y-1.5">
                <Label className={labelCls}>
                    {mode === 'amount' ? 'Waiver Amount' : 'Waiver Percentage'}{' '}
                    <span className="text-red-500">*</span>
                </Label>
                {mode === 'amount' ? (
                    <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max={maxWaivable}
                        placeholder={`Max ${formatCurrency(maxWaivable)}`}
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        disabled={type === 'full'}
                        className={inputCls}
                    />
                ) : (
                    <Input
                        type="number"
                        step="1"
                        min="0"
                        max="100"
                        placeholder="0 - 100"
                        value={percentage}
                        onChange={(e) => setPercentage(e.target.value)}
                        className={inputCls}
                    />
                )}
                {computedAmount > 0 && mode === 'percentage' && (
                    <p className={`text-xs ${theme.textMuted}`}>
                        = {formatCurrency(computedAmount)} of {formatCurrency(maxWaivable)}
                    </p>
                )}
            </div>

            {/* Reason */}
            <div className="space-y-1.5">
                <Label className={labelCls}>Reason <span className="text-red-500">*</span></Label>
                <Textarea
                    rows={3}
                    placeholder="Why is this waiver being requested?"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className={`${inputCls} resize-none`}
                />
            </div>

            {/* Effective dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <Label className={labelCls}>Effective From</Label>
                    <Input
                        type="date"
                        value={effectiveFrom}
                        onChange={(e) => setEffectiveFrom(e.target.value)}
                        className={inputCls}
                    />
                </div>
                <div className="space-y-1.5">
                    <Label className={labelCls}>Effective Until (optional)</Label>
                    <Input
                        type="date"
                        value={effectiveUntil}
                        onChange={(e) => setEffectiveUntil(e.target.value)}
                        className={inputCls}
                    />
                </div>
            </div>

            {/* Notice */}
            <div className={`p-3 rounded-lg border flex gap-2 ${
                theme.isDarkMode
                    ? 'bg-yellow-500/5 border-yellow-500/20 text-yellow-400'
                    : 'bg-yellow-50 border-yellow-200 text-yellow-700'
            }`}>
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p className="text-xs">
                    Waiver requests require approval. Once approved, the fee's amount will be reduced accordingly.
                </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={onCancel} className={theme.outlineBtn}>
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    disabled={isLoading || computedAmount <= 0 || reason.trim().length < 5}
                    className={theme.primaryBtn}
                >
                    {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Submit Request
                </Button>
            </div>
        </div>
    );
}