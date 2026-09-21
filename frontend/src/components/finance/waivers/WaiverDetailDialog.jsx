// src/components/finance/waivers/WaiverDetailDialog.jsx
import {
    CheckCircle2, XCircle, Undo2, User, Calendar, FileText, MessageSquare,
} from 'lucide-react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MoneyDisplay, StatusBadge } from '@/components/finance';
import { useFinanceTheme } from '@/hooks/finance/useFinanceTheme';
import { useFinancePermissions } from '@/hooks/finance/useFinancePermissions';
import {
    getWaiverStatusLabel, getWaiverTypeLabel,
} from '@/lib/financeUtils';
import { formatDate, formatDateTime } from '@/lib/formaters';

/**
 * Props:
 *   waiver        — Waiver doc
 *   open / onOpenChange
 *   onApprove / onReject / onRevoke
 */
export default function WaiverDetailDialog({
    waiver, open, onOpenChange, onApprove, onReject, onRevoke,
}) {
    const theme = useFinanceTheme();
    const can = useFinancePermissions();

    if (!waiver) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={`max-w-2xl max-h-[90vh] overflow-y-auto ${theme.dialog}`}>
                <DialogHeader>
                    <DialogTitle className={theme.text}>Waiver Detail</DialogTitle>
                </DialogHeader>

                <div className="space-y-5 py-2">
                    {/* Status row */}
                    <div className="flex items-center justify-between">
                        <StatusBadge
                            domain="waiver"
                            status={waiver.status}
                            label={getWaiverStatusLabel(waiver.status)}
                            size="md"
                        />
                        <span className={`text-xs font-mono ${theme.textMuted}`}>
                            {waiver._id?.slice(-8)}
                        </span>
                    </div>

                    {/* Amount */}
                    <div className={`p-4 rounded-lg border ${theme.cardSolid} flex items-center justify-between`}>
                        <div>
                            <p className={`text-xs ${theme.textMuted}`}>
                                {getWaiverTypeLabel(waiver.type)}
                            </p>
                            <MoneyDisplay value={waiver.amount} size="xl" tone="positive" />
                        </div>
                        {waiver.percentage && (
                            <p className={`text-sm ${theme.textMuted}`}>
                                {waiver.percentage}% of total
                            </p>
                        )}
                    </div>

                    {/* Fee */}
                    <div className={`grid grid-cols-2 gap-3 pb-4 border-b ${theme.border}`}>
                        <Field theme={theme} label="Fee" value={waiver.feeInstance?.title || '—'} icon={FileText} />
                        <Field theme={theme} label="Student" value={waiver.student?.name || '—'} icon={User} />
                        <Field theme={theme} label="Requested" value={formatDate(waiver.requestDate)} icon={Calendar} />
                        {waiver.approvedDate && (
                            <Field theme={theme} label="Approved" value={formatDate(waiver.approvedDate)} icon={CheckCircle2} />
                        )}
                    </div>

                    {/* Reason */}
                    <div>
                        <p className={`text-xs font-medium ${theme.textMuted} mb-1`}>REASON</p>
                        <p className={`text-sm ${theme.textSoft}`}>{waiver.reason || '—'}</p>
                    </div>

                    {waiver.remarks && (
                        <div>
                            <p className={`text-xs font-medium ${theme.textMuted} mb-1`}>REMARKS</p>
                            <p className={`text-sm ${theme.textSoft}`}>{waiver.remarks}</p>
                        </div>
                    )}

                    {/* Revision history */}
                    {waiver.revisionHistory?.length > 0 && (
                        <div>
                            <p className={`text-xs font-medium ${theme.textMuted} mb-2`}>HISTORY</p>
                            <div className="space-y-2">
                                {waiver.revisionHistory.map((h, i) => (
                                    <div key={i} className={`p-3 rounded-lg border ${theme.cardSolid} flex items-start gap-3`}>
                                        <MessageSquare className={`w-4 h-4 mt-0.5 flex-shrink-0 ${theme.textMuted}`} />
                                        <div className="flex-1">
                                            <p className={`text-xs font-medium ${theme.text}`}>
                                                {h.changes?.status || 'Updated'}
                                            </p>
                                            {h.reason && (
                                                <p className={`text-xs mt-0.5 ${theme.textMuted}`}>{h.reason}</p>
                                            )}
                                            <p className={`text-xs mt-0.5 ${theme.textFaint}`}>
                                                {h.changedAt ? formatDateTime(h.changedAt) : ''}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    {waiver.status === 'pending' && (
                        <>
                            {can.canApproveWaiver && (
                                <>
                                    <Button
                                        variant="outline"
                                        onClick={() => onReject?.(waiver)}
                                        className={`${theme.outlineBtn} hover:text-red-500`}
                                    >
                                        <XCircle className="w-4 h-4 mr-2" />
                                        Reject
                                    </Button>
                                    <Button
                                        onClick={() => onApprove?.(waiver)}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                    >
                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                        Approve
                                    </Button>
                                </>
                            )}
                        </>
                    )}
                    {waiver.status === 'approved' && can.canRevokeWaiver && (
                        <Button
                            variant="outline"
                            onClick={() => onRevoke?.(waiver)}
                            className={`${theme.outlineBtn} hover:text-orange-500`}
                        >
                            <Undo2 className="w-4 h-4 mr-2" />
                            Revoke Waiver
                        </Button>
                    )}
                    {!can.canApproveWaiver && waiver.status === 'pending' && (
                        <p className={`text-xs ${theme.textMuted}`}>
                            Awaiting approval from an accountant or admin.
                        </p>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function Field({ theme, label, value, icon: Icon }) {
    return (
        <div>
            <div className={`flex items-center gap-1.5 ${theme.textMuted}`}>
                {Icon && <Icon className="w-3.5 h-3.5" />}
                <p className="text-xs">{label}</p>
            </div>
            <p className={`text-sm font-medium mt-0.5 ${theme.text}`}>{value}</p>
        </div>
    );
}