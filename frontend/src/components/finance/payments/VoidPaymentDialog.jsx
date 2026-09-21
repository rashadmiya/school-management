// src/components/finance/payments/VoidPaymentDialog.jsx
import { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MoneyDisplay } from '@/components/finance';
import { useFinanceTheme } from '@/hooks/finance/useFinanceTheme';
import { useVoidPaymentMutation } from '@/features/apis/finance/paymentApi';
import { getPaymentMethodLabel } from '@/lib/financeUtils';
import { formatDateTime } from '@/lib/formaters';
import { toast } from 'sonner';

/**
 * Props:
 *   open / onOpenChange
 *   payment    — the payment to void
 *   onVoided   — callback after successful void
 */
export default function VoidPaymentDialog({ open, onOpenChange, payment, onVoided }) {
    const theme = useFinanceTheme();
    const [reason, setReason] = useState('');
    const [voidPayment, { isLoading }] = useVoidPaymentMutation();

    const handleConfirm = async () => {
        if (!reason.trim() || reason.trim().length < 5) {
            toast.error('Please provide a reason (min 5 characters)');
            return;
        }
        try {
            await voidPayment({ id: payment._id, reason: reason.trim() }).unwrap();
            toast.success('Payment voided');
            onVoided?.();
            onOpenChange(false);
            setReason('');
        } catch (err) {
            toast.error(err?.data?.message || 'Failed to void payment');
        }
    };

    const handleClose = (o) => {
        if (!o) setReason('');
        onOpenChange(o);
    };

    if (!payment) return null;

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className={`max-w-lg ${theme.dialog}`}>
                <DialogHeader>
                    <DialogTitle className={`flex items-center gap-2 ${theme.text}`}>
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        Void Payment
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* Warning */}
                    <div className={`p-3 rounded-lg border ${
                        theme.isDarkMode
                            ? 'bg-red-500/10 border-red-500/20 text-red-400'
                            : 'bg-red-50 border-red-200 text-red-700'
                    }`}>
                        <p className="text-sm">
                            Voiding this payment will reverse all allocations, restore any advance balance,
                            and record a compensating ledger entry. This action is auditable but cannot be undone directly.
                        </p>
                    </div>

                    {/* Payment summary */}
                    <div className={`p-4 rounded-lg border ${theme.cardSolid}`}>
                        <div className="flex items-center justify-between mb-3">
                            <span className={`text-xs ${theme.textMuted}`}>Receipt</span>
                            <span className={`text-xs font-mono ${theme.text}`}>
                                {payment.receiptNumber}
                            </span>
                        </div>
                        <div className="flex items-center justify-between mb-2">
                            <span className={`text-xs ${theme.textMuted}`}>Amount</span>
                            <MoneyDisplay value={payment.amount} size="sm" />
                        </div>
                        <div className="flex items-center justify-between mb-2">
                            <span className={`text-xs ${theme.textMuted}`}>Method</span>
                            <span className={`text-xs ${theme.text}`}>
                                {getPaymentMethodLabel(payment.method)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className={`text-xs ${theme.textMuted}`}>Date</span>
                            <span className={`text-xs ${theme.text}`}>
                                {formatDateTime(payment.createdAt)}
                            </span>
                        </div>
                    </div>

                    {/* Reason */}
                    <div className="space-y-2">
                        <Label className={`text-sm font-medium ${theme.textSoft}`}>
                            Reason <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                            rows={3}
                            placeholder="e.g., Duplicate entry, wrong student, incorrect amount"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className={`${theme.input} resize-none`}
                            autoFocus
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => handleClose(false)}
                        disabled={isLoading}
                        className={theme.outlineBtn}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={isLoading || reason.trim().length < 5}
                        className={theme.destructiveBtn}
                    >
                        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Void Payment
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}