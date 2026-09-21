// src/pages/finance/waivers/RequestWaiver.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gift, Plus, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { FinancePageHeader, FinanceStatCard, FinanceLoading } from '@/components/finance';
import WaiverApprovalTable from '@/components/finance/waivers/WaiverApprovalTable';
import WaiverDetailDialog from '@/components/finance/waivers/WaiverDetailDialog';
import { useFinanceTheme } from '@/hooks/finance/useFinanceTheme';
import { useFinancePermissions } from '@/hooks/finance/useFinancePermissions';
import {
    useApproveWaiverMutation,
    useRejectWaiverMutation,
    useRevokeWaiverMutation,
} from '@/features/apis/finance/waiverApi';
import { useGetWaiverRequestsQuery } from '@/features/apis/finance/waiverApi';
import { toast } from 'sonner';
import { MoneyDisplay } from '@/components/finance';
import { toMoneyNumber } from '@/lib/formaters';
// import WaiverRequestDialog from '@/components/finance/waivers/WaiverRequestDialog';

export default function RequestWaiver() {
    const theme = useFinanceTheme();
    const can = useFinancePermissions();
    const navigate = useNavigate();

    const [selected, setSelected] = useState(null);
    const [approveTarget, setApproveTarget] = useState(null);
    const [rejectTarget, setRejectTarget] = useState(null);
    const [createOpen, setCreateOpen] = useState(false);

    const { data } = useGetWaiverRequestsQuery({ limit: 200 });
    const waivers = data?.data || [];

    const [approveWaiver, { isLoading: approving }] = useApproveWaiverMutation();
    const [rejectWaiver, { isLoading: rejecting }] = useRejectWaiverMutation();
    const [revokeWaiver, { isLoading: revoking }] = useRevokeWaiverMutation();

    const stats = {
        total: waivers.length,
        pending: waivers.filter((w) => w.status === 'pending').length,
        approved: waivers.filter((w) => w.status === 'approved').length,
        totalApprovedAmount: waivers
            .filter((w) => w.status === 'approved')
            .reduce((s, w) => s + toMoneyNumber(w.amount), 0),
    };

    const handleApprove = async () => {
        if (!approveTarget) return;
        try {
            await approveWaiver({ id: approveTarget._id, remarks: 'Approved' }).unwrap();
            toast.success('Waiver approved');
            setApproveTarget(null);
        } catch (err) {
            toast.error(err?.data?.message || 'Failed to approve');
        }
    };

    const handleReject = async () => {
        if (!rejectTarget) return;
        const reason = window.prompt('Reason for rejection:');
        if (!reason) return;
        try {
            await rejectWaiver({ id: rejectTarget._id, reason }).unwrap();
            toast.success('Waiver rejected');
            setRejectTarget(null);
        } catch (err) {
            toast.error(err?.data?.message || 'Failed to reject');
        }
    };

    const handleRevoke = async () => {
        if (!selected) return;
        const reason = window.prompt('Reason for revocation:');
        if (!reason) return;
        try {
            await revokeWaiver({ id: selected._id, reason }).unwrap();
            toast.success('Waiver revoked');
            setSelected(null);
        } catch (err) {
            toast.error(err?.data?.message || 'Failed to revoke');
        }
    };

    return (
        <div className={`space-y-6 ${theme.text}`}>
            <FinancePageHeader
                title="Waivers"
                subtitle="Manage fee waivers, scholarships, and discounts."
                breadcrumb={[
                    { label: 'Finance', to: '/admin/finance' },
                    { label: 'Waivers' },
                ]}
                actions={
                    <>
                        <Button onClick={() => setCreateOpen(true)} className={theme.primaryBtn}>
                            <Plus className="w-4 h-4 mr-2" />
                            New Waiver
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => navigate('/admin/finance/waivers/approve')}
                            className={theme.outlineBtn}
                        >
                            <ArrowLeft className="w-4 h-4 mr-2 rotate-180" />
                            Approval Queue
                        </Button>
                    </>
                }
            />

            {/* <WaiverRequestDialog
                open={createOpen}
                onOpenChange={setCreateOpen}
                onSuccess={refetchWaivers}
            /> */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <FinanceStatCard label="Total Requests" value={stats.total} icon={Gift} accent="blue" />
                <FinanceStatCard label="Pending" value={stats.pending} icon={Gift} accent="yellow" />
                <FinanceStatCard label="Approved" value={stats.approved} icon={Gift} accent="green" />
                <FinanceStatCard
                    label="Total Waived"
                    value={<MoneyDisplay value={stats.totalApprovedAmount} size="xl" tone="positive" />}
                    icon={Gift}
                    accent="purple"
                />
            </div>

            <WaiverApprovalTable
                statusFilter="all"
                onRowClick={setSelected}
                title="All Waivers"
            />

            {/* Detail dialog */}
            <WaiverDetailDialog
                waiver={selected}
                open={!!selected}
                onOpenChange={(o) => !o && setSelected(null)}
                onApprove={(w) => { setApproveTarget(w); }}
                onReject={(w) => { setRejectTarget(w); }}
                onRevoke={handleRevoke}
            />
        </div>
    );
}