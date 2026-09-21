// src/components/finance/payments/ReceiptPreview.jsx
import { MoneyDisplay } from '@/components/finance';
import { Button } from '@/components/ui/button';
import { useAppSelector } from '@/features/store';
import { useFinanceTheme } from '@/hooks/finance/useFinanceTheme';
import { downloadAuthenticatedFile } from '@/lib/downloadFile';
import { getPaymentMethodLabel } from '@/lib/financeUtils';
import { formatDateTime } from '@/lib/formaters';
import { CheckCircle, Download, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

/**
 * Props:
 *   payment     — the created Payment object from the API response
 *   allocations — array of allocations (optional)
 */
export default function ReceiptPreview({ payment, allocations = [] }) {
    const theme = useFinanceTheme();
    const token = useAppSelector((s) => s.auth?.token);
    const [downloading, setDownloading] = useState(false);

    const handleDownload = async () => {
        try {
            setDownloading(true);
            await downloadAuthenticatedFile(
                `/pdf/receipt/${payment._id}`,
                `receipt-${payment.receiptNumber || payment._id}.pdf`,
                token
            );
        } catch (err) {
            toast.error(err.message || 'Failed to download receipt');
        } finally {
            setDownloading(false);
        }
    };

    const handlePreview = async () => {
        try {
            setDownloading(true);
            await downloadAuthenticatedFile(
                `/pdf/receipt/${payment._id}`,
                `receipt-${payment.receiptNumber || payment._id}.pdf`,
                token,
                { openInNewTab: true }
            );
        } catch (err) {
            toast.error(err.message || 'Failed to open receipt');
        } finally {
            setDownloading(false);
        }
    };

    if (!payment) {
    return (
        <div className={`rounded-lg border p-6 text-center ${theme.cardSolid}`}>
            <p className="text-sm text-rose-600">
                Payment data is missing — the payment may not have been created.
                Please retry.
            </p>
        </div>
    );
}

    return (
        <div className={`rounded-lg border overflow-hidden ${theme.cardSolid}`}>
            {/* Success banner */}
            <div className={`px-6 py-5 flex items-center gap-3 ${
                theme.isDarkMode
                    ? 'bg-emerald-500/10 border-b border-emerald-500/20'
                    : 'bg-emerald-50 border-b border-emerald-200'
            }`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    theme.isDarkMode ? 'bg-emerald-500/20' : 'bg-emerald-100'
                }`}>
                    <CheckCircle className={`w-6 h-6 ${theme.isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                </div>
                <div>
                    <p className={`text-sm font-semibold ${theme.isDarkMode ? 'text-emerald-400' : 'text-emerald-800'}`}>
                        Payment received
                    </p>
                    <p className={`text-xs ${theme.isDarkMode ? 'text-emerald-400/80' : 'text-emerald-700'}`}>
                        Receipt {payment?.receiptNumber}
                    </p>
                </div>
            </div>

            {/* Receipt body */}
            <div className="p-6 space-y-4">
                <div className="flex items-baseline justify-between">
                    <span className={`text-sm ${theme.textMuted}`}>Amount</span>
                    <MoneyDisplay value={payment?.amount} size="xl" tone="positive" />
                </div>

                <div className={`grid grid-cols-2 gap-y-3 gap-x-4 pt-3 border-t ${theme.border}`}>
                    <DetailRow theme={theme} label="Method" value={getPaymentMethodLabel(payment.method)} />
                    <DetailRow theme={theme} label="Date" value={formatDateTime(payment.createdAt)} />
                    {payment?.receivedBy?.name && (
                        <DetailRow theme={theme} label="Received By" value={payment.receivedBy.name} />
                    )}
                    {payment?.reference && (
                        <DetailRow theme={theme} label="Reference" value={payment.reference} />
                    )}
                </div>

                {/* Allocations */}
                {allocations.length > 0 && (
                    <div className={`pt-3 border-t ${theme.border}`}>
                        <p className={`text-xs font-medium ${theme.textMuted} mb-2`}>
                            APPLIED TO
                        </p>
                        <div className="space-y-1.5">
                            {allocations.map((a, i) => (
                                <div key={i} className="flex items-center justify-between text-sm">
                                    <span className={theme.textSoft}>
                                        {a.feeInstance?.title || 'Fee'}
                                    </span>
                                    <MoneyDisplay value={a.amount} size="sm" />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Advance */}
                {parseFloat(payment?.advanceAmount || 0) > 0 && (
                    <div className={`pt-3 border-t ${theme.border} flex items-center justify-between`}>
                        <span className={`text-sm ${theme.textMuted}`}>Added to advance balance</span>
                        <MoneyDisplay value={payment?.advanceAmount} size="sm" tone="positive" />
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4">
                    <Button
                        variant="outline"
                        onClick={handlePreview}
                        disabled={downloading}
                        className={`flex-1 ${theme.outlineBtn}`}
                    >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View PDF
                    </Button>
                    <Button
                        onClick={handleDownload}
                        disabled={downloading}
                        className={`flex-1 ${theme.primaryBtn}`}
                    >
                        <Download className="w-4 h-4 mr-2" />
                        {downloading ? 'Preparing…' : 'Download'}
                    </Button>
                </div>
            </div>
        </div>
    );
}

function DetailRow({ theme, label, value }) {
    return (
        <div>
            <p className={`text-xs ${theme.textMuted}`}>{label}</p>
            <p className={`text-sm font-medium ${theme.text} mt-0.5`}>{value}</p>
        </div>
    );
}