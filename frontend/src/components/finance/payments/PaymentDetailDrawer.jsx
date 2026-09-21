// src/components/finance/payments/PaymentDetailDrawer.jsx
import { X, Download, ExternalLink, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MoneyDisplay, StatusBadge } from '@/components/finance';
import { useFinanceTheme } from '@/hooks/finance/useFinanceTheme';
import { useFinancePermissions } from '@/hooks/finance/useFinancePermissions';
import { useGetPaymentAllocationsQuery } from '@/features/apis/finance/paymentApi';
import {
    getPaymentMethodLabel,
    getPaymentStatusLabel,
} from '@/lib/financeUtils';
import { formatDateTime, formatDate } from '@/lib/formaters';
import { downloadAuthenticatedFile } from '@/lib/downloadFile';
import { useAppSelector } from '@/features/store';
import { toast } from 'sonner';

/**
 * Props:
 *   payment         — the payment object
 *   open / onOpenChange
 *   onVoidClick     — called when user clicks Void
 */
export default function PaymentDetailDrawer({ payment, open, onOpenChange, onVoidClick }) {
    const theme = useFinanceTheme();
    const can = useFinancePermissions();
    const token = useAppSelector((s) => s.auth?.token);

    const { data: allocData, isLoading: loadingAllocs } = useGetPaymentAllocationsQuery(
        payment?._id,
        { skip: !payment?._id || !open }
    );
    const allocations = allocData?.data || [];

    if (!payment || !open) return null;

    const handleDownload = async () => {
        try {
            await downloadAuthenticatedFile(
                `/pdf/receipt/${payment._id}`,
                `receipt-${payment.receiptNumber || payment._id}.pdf`,
                token
            );
        } catch (err) {
            toast.error(err.message || 'Failed to download');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div
                className="flex-1 bg-black/40"
                onClick={() => onOpenChange(false)}
            />

            {/* Panel */}
            <div className={`w-full max-w-lg h-full overflow-y-auto border-l ${theme.cardSolid}`}>
                {/* Header */}
                <div className={`sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b ${theme.border} ${theme.cardSolid}`}>
                    <div>
                        <h2 className={`text-lg font-semibold ${theme.text}`}>Payment Detail</h2>
                        <p className={`text-xs font-mono ${theme.textMuted}`}>{payment.receiptNumber}</p>
                    </div>
                    <button
                        onClick={() => onOpenChange(false)}
                        className={`p-2 rounded-md ${theme.ghostBtn}`}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="px-6 py-5 space-y-5">
                    {/* Status + amount */}
                    <div className={`p-4 rounded-lg border ${theme.cardSolid}`}>
                        <div className="flex items-center justify-between mb-3">
                            <StatusBadge
                                domain="payment"
                                status={payment.status || 'completed'}
                                label={getPaymentStatusLabel(payment.status || 'completed')}
                                size="md"
                            />
                            {payment.method && (
                                <span className={`text-xs ${theme.textMuted}`}>
                                    {getPaymentMethodLabel(payment.method)}
                                </span>
                            )}
                        </div>
                        <MoneyDisplay value={payment.amount} size="xl" />
                    </div>

                    {/* Meta */}
                    <div className={`grid grid-cols-2 gap-y-4 gap-x-4 pb-4 border-b ${theme.border}`}>
                        <Field theme={theme} label="Date" value={formatDateTime(payment.createdAt)} />
                        <Field theme={theme} label="Student" value={payment.student?.name || '—'} />
                        <Field theme={theme} label="Roll" value={payment.student?.rollNumber || '—'} />
                        <Field theme={theme} label="Class" value={payment.student?.class?.name || '—'} />
                        {payment.receivedBy?.name && (
                            <Field theme={theme} label="Received By" value={payment.receivedBy.name} />
                        )}
                        {payment.reference && (
                            <Field theme={theme} label="Reference" value={payment.reference} />
                        )}
                    </div>

                    {/* Allocations */}
                    <div>
                        <h3 className={`text-sm font-semibold ${theme.text} mb-3`}>
                            Allocations
                        </h3>
                        {loadingAllocs ? (
                            <div className={`text-sm ${theme.textMuted}`}>Loading…</div>
                        ) : allocations.length === 0 ? (
                            <div className={`text-sm ${theme.textMuted}`}>
                                No fee allocations. Full amount credited as advance.
                            </div>
                        ) : (
                            <div className={`rounded-lg border overflow-hidden ${theme.border}`}>
                                {allocations.map((a) => (
                                    <div
                                        key={a._id}
                                        className={`flex items-center justify-between px-4 py-3 border-b last:border-b-0 ${theme.border}`}
                                    >
                                        <div className="min-w-0">
                                            <p className={`text-sm font-medium truncate ${theme.text}`}>
                                                {a.feeInstance?.title || 'Fee'}
                                            </p>
                                            <p className={`text-xs ${theme.textMuted}`}>
                                                {a.feeInstance?.status || '—'}
                                            </p>
                                        </div>
                                        <MoneyDisplay value={a.amount} size="sm" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Advance amount */}
                    {parseFloat(payment.advanceAmount || 0) > 0 && (
                        <div className={`p-3 rounded-lg border ${theme.surfaceSolid}`}>
                            <div className="flex items-center justify-between">
                                <span className={`text-sm ${theme.textMuted}`}>
                                    Credited as advance
                                </span>
                                <MoneyDisplay value={payment.advanceAmount} size="sm" tone="positive" />
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2">
                        <Button
                            variant="outline"
                            onClick={handleDownload}
                            className={`flex-1 ${theme.outlineBtn}`}
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Receipt PDF
                        </Button>
                        {can.canVoidPayment && payment.status === 'completed' && (
                            <Button
                                onClick={() => onVoidClick?.(payment)}
                                className={`flex-1 ${theme.destructiveBtn}`}
                            >
                                <Ban className="w-4 h-4 mr-2" />
                                Void
                            </Button>
                        )}
                    </div>

                    {payment.status === 'voided' && payment.voidReason && (
                        <div className={`p-3 rounded-lg border ${
                            theme.isDarkMode
                                ? 'bg-red-500/5 border-red-500/20'
                                : 'bg-red-50 border-red-200'
                        }`}>
                            <p className={`text-xs font-medium ${theme.isDarkMode ? 'text-red-400' : 'text-red-700'}`}>
                                Voided
                            </p>
                            <p className={`text-xs mt-1 ${theme.isDarkMode ? 'text-red-400/80' : 'text-red-600'}`}>
                                {payment.voidReason}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function Field({ theme, label, value }) {
    return (
        <div>
            <p className={`text-xs ${theme.textMuted}`}>{label}</p>
            <p className={`text-sm font-medium mt-0.5 ${theme.text}`}>{value}</p>
        </div>
    );
}