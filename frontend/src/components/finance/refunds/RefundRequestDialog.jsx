// src/components/finance/refunds/RefundRequestDialog.jsx
import { useEffect, useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MoneyDisplay } from '@/components/finance';
import { useFinanceTheme } from '@/hooks/finance/useFinanceTheme';
import { useRequestRefundMutation } from '@/features/apis/finance/refundApi';
import { getPaymentMethodLabel } from '@/lib/financeUtils';
import { toMoneyNumber, formatCurrency, formatDateTime } from '@/lib/formaters';
import { toast } from 'sonner';

/**
 * Props:
 *   payment    — Payment to refund
 *   open / onOpenChange
 *   onSuccess
 */
export default function RefundRequestDialog({ payment, open, onOpenChange, onSuccess }) {
    const theme = useFinanceTheme();
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');
    const [description, setDescription] = useState('');

    const [requestRefund, { isLoading }] = useRequestRefundMutation();

    useEffect(() => {
        if (payment && open) {
            const refundable = toMoneyNumber(payment.amount) - toMoneyNumber(payment.refundedAmount);
            setAmount(refundable.toFixed(2));
            setReason('');
            setDescription('');
        }
    }, [payment, open]);

    const refundable = payment
        ? toMoneyNumber(payment.amount) - toMoneyNumber(payment.refundedAmount)
        : 0;
    const amountNum = parseFloat(amount) || 0;
    const valid = amountNum > 0 && amountNum <= refundable && reason.trim().length >= 5;

    const handleSubmit = async () => {
        if (!valid) return;
        try {
            await requestRefund({
                paymentId: payment._id,
                amount: amountNum,
                reason: reason.trim(),
                description: description.trim() || undefined,
            }).unwrap();
            toast.success('Refund request submitted');
            onSuccess?.();
            onOpenChange(false);
        } catch (err) {
            toast.error(err?.data?.message || 'Failed to submit refund');
        }
    };

    if (!payment) return null;

    const inputCls = theme.input;
    const labelCls = `text-sm font-medium ${theme.textSoft}`;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={`max-w-lg ${theme.dialog}`}>
                <DialogHeader>
                    <DialogTitle className={theme.text}>Request Refund</DialogTitle>
                </DialogHeader>

                <div className="space-y-5 py-2">
                    {/* Payment summary */}
                    <div className={`p-4 rounded-lg border ${theme.cardSolid}`}>
                        <div className="flex items-center justify-between mb-2">
                            <span className={`text-xs ${theme.textMuted}`}>Receipt</span>
                            <span className={`text-xs font-mono ${theme.text}`}>
                                {payment.receiptNumber}
                            </span>
                        </div>
                        <div className="flex items-center justify-between mb-2">
                            <span className={`text-xs ${theme.textMuted}`}>Original Amount</span>
                            <MoneyDisplay value={payment.amount} size="sm" />
                        </div>
                        {toMoneyNumber(payment.refundedAmount) > 0 && (
                            <div className="flex items-center justify-between mb-2">
                                <span className={`text-xs ${theme.textMuted}`}>Already Refunded</span>
                                <MoneyDisplay value={payment.refundedAmount} size="sm" tone="negative" />
                            </div>
                        )}
                        <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: theme.isDarkMode ? '#374151' : '#e5e7eb' }}>
                            <span className={`text-xs font-medium ${theme.textSoft}`}>Refundable</span>
                            <MoneyDisplay value={refundable} size="md" tone="positive" />
                        </div>
                        <div className="flex items-center justify-between mt-2">
                            <span className={`text-xs ${theme.textMuted}`}>Method</span>
                            <span className={`text-xs ${theme.text}`}>
                                {getPaymentMethodLabel(payment.method)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                            <span className={`text-xs ${theme.textMuted}`}>Date</span>
                            <span className={`text-xs ${theme.text}`}>
                                {formatDateTime(payment.createdAt)}
                            </span>
                        </div>
                    </div>

                    {/* Amount */}
                    <div className="space-y-1.5">
                        <Label className={labelCls}>Refund Amount <span className="text-red-500">*</span></Label>
                        <Input
                            type="number"
                            step="0.01"
                            min="0"
                            max={refundable}
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className={inputCls}
                        />
                        <div className="flex items-center justify-between">
                            <button
                                type="button"
                                onClick={() => setAmount(refundable.toFixed(2))}
                                className={`text-xs ${theme.isDarkMode ? 'text-blue-400' : 'text-blue-600'} hover:underline`}
                            >
                                Fill full amount ({formatCurrency(refundable)})
                            </button>
                            {amountNum > refundable && (
                                <span className="text-xs text-red-500">Exceeds refundable</span>
                            )}
                        </div>
                    </div>

                    {/* Reason */}
                    <div className="space-y-1.5">
                        <Label className={labelCls}>Reason <span className="text-red-500">*</span></Label>
                        <Input
                            placeholder="e.g., Duplicate payment, correction"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className={inputCls}
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                        <Label className={labelCls}>Description (optional)</Label>
                        <Textarea
                            rows={2}
                            placeholder="Add any additional details"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
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
                            Refund requests require approval. Once approved, an accountant will process the payment.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} className={theme.outlineBtn}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!valid || isLoading}
                        className={theme.primaryBtn}
                    >
                        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Submit Request
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}