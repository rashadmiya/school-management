// src/components/finance/refunds/RefundProcessDialog.jsx
import { useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { MoneyDisplay } from '@/components/finance';
import { useFinanceTheme } from '@/hooks/finance/useFinanceTheme';
import { useProcessRefundMutation } from '@/features/apis/finance/refundApi';
import { toast } from 'sonner';

const REFUND_METHODS = [
    { value: 'cash', label: 'Cash' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'check', label: 'Check' },
    { value: 'mobile_banking', label: 'Mobile Banking' },
    { value: 'adjustment', label: 'Adjustment (no cash out)' },
];

/**
 * Props:
 *   refund    — approved refund
 *   open / onOpenChange
 *   onSuccess
 */
export default function RefundProcessDialog({ refund, open, onOpenChange, onSuccess }) {
    const theme = useFinanceTheme();
    const [method, setMethod] = useState('cash');
    const [reference, setReference] = useState('');
    const [methodDetails, setMethodDetails] = useState({});

    const [processRefund, { isLoading }] = useProcessRefundMutation();

    const handleSubmit = async () => {
        try {
            await processRefund({
                id: refund._id,
                method,
                reference: reference.trim() || undefined,
                methodDetails,
            }).unwrap();
            toast.success('Refund processed');
            onSuccess?.();
            onOpenChange(false);
        } catch (err) {
            toast.error(err?.data?.message || 'Failed to process refund');
        }
    };

    if (!refund) return null;

    const inputCls = theme.input;
    const labelCls = `text-sm font-medium ${theme.textSoft}`;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={`max-w-lg ${theme.dialog}`}>
                <DialogHeader>
                    <DialogTitle className={theme.text}>Process Refund</DialogTitle>
                </DialogHeader>

                <div className="space-y-5 py-2">
                    <div className={`p-4 rounded-lg border ${theme.cardSolid}`}>
                        <p className={`text-xs ${theme.textMuted}`}>Refund Amount</p>
                        <MoneyDisplay value={refund.amount} size="xl" tone="negative" />
                        <p className={`text-xs mt-2 ${theme.textMuted}`}>
                            Student: <span className={theme.text}>{refund.student?.name || '—'}</span>
                        </p>
                        {refund.refundNumber && (
                            <p className={`text-xs mt-1 ${theme.textMuted}`}>
                                Refund No: <span className={`font-mono ${theme.text}`}>{refund.refundNumber}</span>
                            </p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label className={labelCls}>Refund Method <span className="text-red-500">*</span></Label>
                        <Select value={method} onValueChange={setMethod}>
                            <SelectTrigger className={theme.select}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className={theme.selectContent}>
                                {REFUND_METHODS.map((m) => (
                                    <SelectItem key={m.value} value={m.value} className={theme.selectItem}>
                                        {m.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {method === 'bank_transfer' && (
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className={labelCls}>Bank Name</Label>
                                <Input
                                    value={methodDetails.bankName || ''}
                                    onChange={(e) => setMethodDetails({ ...methodDetails, bankName: e.target.value })}
                                    className={inputCls}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className={labelCls}>Account Number</Label>
                                <Input
                                    value={methodDetails.accountNumber || ''}
                                    onChange={(e) => setMethodDetails({ ...methodDetails, accountNumber: e.target.value })}
                                    className={inputCls}
                                />
                            </div>
                        </div>
                    )}

                    {method === 'mobile_banking' && (
                        <div className="space-y-1.5">
                            <Label className={labelCls}>Mobile Number</Label>
                            <Input
                                value={methodDetails.mobileNumber || ''}
                                onChange={(e) => setMethodDetails({ ...methodDetails, mobileNumber: e.target.value })}
                                className={inputCls}
                            />
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <Label className={labelCls}>Reference (optional)</Label>
                        <Input
                            placeholder="Voucher / slip number"
                            value={reference}
                            onChange={(e) => setReference(e.target.value)}
                            className={inputCls}
                        />
                    </div>

                    <div className={`p-3 rounded-lg border flex gap-2 ${
                        theme.isDarkMode
                            ? 'bg-red-500/5 border-red-500/20 text-red-400'
                            : 'bg-red-50 border-red-200 text-red-700'
                    }`}>
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <p className="text-xs">
                            This will reverse allocations, restore the fee instance amounts, and record a compensating ledger entry.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} className={theme.outlineBtn}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Process Refund
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}