// src/components/finance/payments/ReceivePaymentForm.jsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, CheckCircle, Loader2, Receipt, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MoneyDisplay, StudentSearchInput, StatusBadge } from '@/components/finance';
import { useFinanceTheme } from '@/hooks/finance/useFinanceTheme';
import { useGetStudentFeesQuery } from '@/features/apis/finance/feeApi';
import { useReceivePaymentMutation } from '@/features/apis/finance/paymentApi';
import { useCurrentSession } from '@/hooks/useCurrentSession';
import { toMoneyNumber, formatCurrency } from '@/lib/formaters';
import { toast } from 'sonner';
import PaymentMethodPicker from './PaymentMethodPicker';
import FeeAllocationPreview from './FeeAllocationPreview';
import ReceiptPreview from './ReceiptPreview';

/**
 * Props:
 *   onSuccess — called with payment result
 *   onCancel
 */
export default function ReceivePaymentForm({ onSuccess, onCancel }) {
    const theme = useFinanceTheme();
    const { selectedSession } = useCurrentSession();
    const session = selectedSession || '';
    const amountInputRef = useRef(null);

    const [student, setStudent] = useState(null);
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState('cash');
    const [methodDetails, setMethodDetails] = useState({});
    const [reference, setReference] = useState('');
    const [notes, setNotes] = useState('');
    const [receipt, setReceipt] = useState(null);

    const numericAmount = useMemo(() => {
        const n = parseFloat(amount);
        return Number.isFinite(n) && n > 0 ? n : 0;
    }, [amount]);

    // Fetch outstanding fees for the selected student
    const { data: feesData, isLoading: loadingFees } = useGetStudentFeesQuery(
        { studentId: student?._id, session },
        { skip: !student?._id }
    );
    const fees = feesData?.data || [];

    const outstanding = useMemo(
        () => fees.filter((f) => toMoneyNumber(f.dueAmount) > 0),
        [fees]
    );

    const totalDue = useMemo(
        () => outstanding.reduce((sum, f) => sum + toMoneyNumber(f.dueAmount), 0),
        [outstanding]
    );

    const [receivePayment, { isLoading: submitting }] = useReceivePaymentMutation();

    // Focus amount input when student is chosen
    useEffect(() => {
        if (student && amountInputRef.current) {
            amountInputRef.current.focus();
        }
    }, [student]);

    // Keyboard: Cmd/Ctrl+Enter submits
    useEffect(() => {
        const handler = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                handleSubmit();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    });

    const reset = () => {
        setStudent(null);
        setAmount('');
        setMethod('cash');
        setMethodDetails({});
        setReference('');
        setNotes('');
    };

    const handleReset = () => {
        reset();
        setReceipt(null);
    };

    const handleSubmit = async () => {
        if (!student) {
            toast.error('Please select a student');
            return;
        }
        if (numericAmount <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        try {
            const payload = {
                studentId: student._id,
                amount: numericAmount,
                method,
                methodDetails,
                reference: reference?.trim() || undefined,
                notes: notes?.trim() || undefined,
                session,
            };

            const result = await receivePayment(payload).unwrap();
            setReceipt(result);

            toast.success(
                `Payment of ${formatCurrency(numericAmount)} recorded for ${student.name}`
            );

            // Let parent form know
            onSuccess?.(result);
        } catch (err) {
            toast.error(err?.data?.message || 'Failed to receive payment');
        }
    };

    // -------- Success view --------
    if (receipt) {
        return (
            <div className="space-y-5">
                <ReceiptPreview
                    payment={receipt.payment}
                    allocations={receipt.allocations || []}
                />
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={handleReset}
                        className={`flex-1 ${theme.outlineBtn}`}
                    >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        New Payment
                    </Button>
                    <Button
                        onClick={() => window.history.back()}
                        className={`flex-1 ${theme.primaryBtn}`}
                    >
                        Done
                    </Button>
                </div>
            </div>
        );
    }

    // -------- Form view --------
    return (
        <div className="space-y-6">
            {/* Student */}
            <div className="space-y-2">
                <Label className={`text-sm font-medium ${theme.textSoft}`}>
                    Student <span className="text-red-500">*</span>
                </Label>
                <StudentSearchInput
                    value={student}
                    onChange={(s) => {
                        setStudent(s);
                        setAmount('');
                    }}
                    session={session}
                    autoFocus
                />
            </div>

            {/* Student's outstanding summary */}
            {student && (
                <div className={`rounded-lg border p-4 ${theme.cardSolid}`}>
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div>
                            <p className={`text-xs ${theme.textMuted}`}>Outstanding balance</p>
                            <MoneyDisplay
                                value={totalDue}
                                size="xl"
                                tone={totalDue > 0 ? 'negative' : 'muted'}
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            {outstanding.length > 0 && (
                                <StatusBadge
                                    domain="fee"
                                    status={outstanding.some((f) => f.status === 'overdue') ? 'overdue' : 'unpaid'}
                                    label={`${outstanding.length} pending fee${outstanding.length === 1 ? '' : 's'}`}
                                />
                            )}
                            {outstanding.length === 0 && (
                                <StatusBadge
                                    domain="balance"
                                    status="clear"
                                    label="No outstanding fees"
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Amount */}
            {student && (
                <div className="space-y-2">
                    <Label className={`text-sm font-medium ${theme.textSoft}`}>
                        Amount (BDT) <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex gap-2">
                        <Input
                            ref={amountInputRef}
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className={`text-lg font-semibold ${theme.input}`}
                        />
                        {totalDue > 0 && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setAmount(String(totalDue.toFixed(2)))}
                                className={theme.outlineBtn}
                                title="Fill full outstanding amount"
                            >
                                Full Due
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {/* Live allocation preview */}
            {student && numericAmount > 0 && (
                <FeeAllocationPreview fees={fees} paymentAmount={numericAmount} />
            )}

            {/* Method */}
            {student && numericAmount > 0 && (
                <div className="space-y-3">
                    <Label className={`text-sm font-medium ${theme.textSoft}`}>
                        Payment Method <span className="text-red-500">*</span>
                    </Label>
                    <PaymentMethodPicker
                        method={method}
                        onMethodChange={setMethod}
                        details={methodDetails}
                        onDetailsChange={setMethodDetails}
                    />
                </div>
            )}

            {/* Reference + notes */}
            {student && numericAmount > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label className={`text-sm font-medium ${theme.textSoft}`}>
                            Reference (optional)
                        </Label>
                        <Input
                            placeholder="Slip no. / voucher / any reference"
                            value={reference}
                            onChange={(e) => setReference(e.target.value)}
                            className={theme.input}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className={`text-sm font-medium ${theme.textSoft}`}>
                            Notes (optional)
                        </Label>
                        <Input
                            placeholder="Any internal notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className={theme.input}
                        />
                    </div>
                </div>
            )}

            {/* Actions */}
            {student && (
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-dashed" style={{ borderColor: theme.isDarkMode ? '#374151' : '#e5e7eb' }}>
                    <p className={`text-xs ${theme.textMuted}`}>
                        Press <kbd className={`px-1.5 py-0.5 rounded border text-xs font-mono ${theme.border} ${theme.surfaceSolid}`}>⌘</kbd> + <kbd className={`px-1.5 py-0.5 rounded border text-xs font-mono ${theme.border} ${theme.surfaceSolid}`}>Enter</kbd> to submit
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleReset}
                            disabled={submitting}
                            className={theme.outlineBtn}
                        >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Reset
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={submitting || numericAmount <= 0}
                            className={theme.primaryBtn}
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Processing…
                                </>
                            ) : (
                                <>
                                    <Receipt className="w-4 h-4 mr-2" />
                                    Receive Payment
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}