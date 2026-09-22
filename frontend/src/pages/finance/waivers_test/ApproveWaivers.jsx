// src/pages/finance/waivers/ApproveWaivers.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gift, CheckCircle2, XCircle, Clock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FinancePageHeader, FinanceStatCard, FinanceEmptyState } from '@/components/finance';
import WaiverApprovalTable from '@/components/finance/waivers/WaiverApprovalTable';
import WaiverDetailDialog from '@/components/finance/waivers/WaiverDetailDialog';
import { useFinanceTheme } from '@/hooks/finance/useFinanceTheme';
import { useFinancePermissions } from '@/hooks/finance/useFinancePermissions';
import {
    useGetWaiverRequestsQuery,
    useApproveWaiverMutation,
    useRejectWaiverMutation,
} from '@/features/apis/finance/waiverApi';
import { toast } from 'sonner';
import { MoneyDisplay } from '@/components/finance';
import { toMoneyNumber } from '@/lib/formaters';

export default function ApproveWaivers() {
    const theme = useFinanceTheme();
    const can = useFinancePermissions();
    const navigate = useNavigate();

    const [selected, setSelected] = useState(null);
    const [confirmApprove, setConfirmApprove] = useState(null);
    const [confirmReject, setConfirmReject] = useState(null);

    const { data, refetch } = useGetWaiverRequestsQuery({ limit: 200 });
    const waivers = data?.data || [];
    const pending = waivers.filter((w) => w.status === 'pending');

    const [approveWaiver, { isLoading: approving }] = useApproveWaiverMutation();
    const [rejectWaiver, { isLoading: rejecting }] = useRejectWaiverMutation();

    const handleApprove = async () => {
        if (!confirmApprove) return;
        try {
            await approveWaiver({ id: confirmApprove._id, remarks: 'Approved' }).unwrap();
            toast.success('Waiver approved');
            setConfirmApprove(null);
            setSelected(null);
            refetch();
        } catch (err) {
            toast.error(err?.data?.message || 'Failed to approve');
        }
    };

    const handleReject = async () => {
        if (!confirmReject) return;
        const reason = window.prompt('Reason for rejection:');
        if (!reason) return;
        try {
            await rejectWaiver({ id: confirmReject._id, reason }).unwrap();
            toast.success('Waiver rejected');
            setConfirmReject(null);
            setSelected(null);
            refetch();
        } catch (err) {
            toast.error(err?.data?.message || 'Failed to reject');
        }
    };

    if (!can.canApproveWaiver) {
        return (
            <div className={`p-6 ${theme.text}`}>
                <Card className={`border shadow-sm ${theme.card}`}>
                    <FinanceEmptyState
                        icon={Gift}
                        title="Access denied"
                        description="You don't have permission to approve waivers."
                    />
                </Card>
            </div>
        );
    }

    return (
        <div className={`space-y-6 ${theme.text}`}>
            <FinancePageHeader
                title="Approve Waivers"
                subtitle="Review and approve pending waiver requests."
                breadcrumb={[
                    { label: 'Finance', to: '/admin/finance' },
                    { label: 'Waivers' },
                    { label: 'Approve' },
                ]}
                actions={
                    <Button
                        variant="outline"
                        onClick={() => navigate('/admin/finance/waivers')}
                        className={theme.outlineBtn}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        All Waivers
                    </Button>
                }
            />

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <FinanceStatCard label="Pending Approval" value={pending.length} icon={Clock} accent="yellow" />
                <FinanceStatCard
                    label="Total Pending Amount"
                    value={<MoneyDisplay value={pending.reduce((s, w) => s + toMoneyNumber(w.amount), 0)} size="xl" tone="positive" />}
                    icon={Gift}
                    accent="blue"
                />
                <FinanceStatCard
                    label="Avg. Request"
                    value={
                        <MoneyDisplay
                            value={pending.length > 0
                                ? pending.reduce((s, w) => s + toMoneyNumber(w.amount), 0) / pending.length
                                : 0}
                            size="xl"
                        />
                    }
                    icon={Gift}
                    accent="purple"
                />
            </div>

            <WaiverApprovalTable
                statusFilter="pending"
                onRowClick={setSelected}
                title="Pending Approval"
                emptyMessage={{
                    title: 'No pending waivers',
                    description: 'All waiver requests have been reviewed.',
                }}
            />

            <WaiverDetailDialog
                waiver={selected}
                open={!!selected}
                onOpenChange={(o) => !o && setSelected(null)}
                onApprove={(w) => { setConfirmApprove(w); }}
                onReject={(w) => { setConfirmReject(w); }}
            />

            {/* Approve confirm */}
            {confirmApprove && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <Card className={`max-w-md w-full ${theme.dialog}`}>
                        <CardContent className="p-6 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                </div>
                                <h3 className={`text-lg font-semibold ${theme.text}`}>Approve Waiver?</h3>
                            </div>
                            <p className={`text-sm ${theme.textMuted}`}>
                                This will apply <MoneyDisplay value={confirmApprove.amount} size="sm" tone="positive" className="inline" /> to{' '}
                                <strong>{confirmApprove.student?.name}</strong>'s fee.
                            </p>
                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setConfirmApprove(null)}
                                    disabled={approving}
                                    className={theme.outlineBtn}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleApprove}
                                    disabled={approving}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                    {approving ? 'Approving…' : 'Approve'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}