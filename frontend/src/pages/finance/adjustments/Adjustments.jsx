// src/pages/finance/adjustments/Adjustments.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sliders, Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { FinancePageHeader, FinanceStatCard, MoneyDisplay } from '@/components/finance';
import AdjustmentWorkflowTable from '@/components/finance/adjustments/AdjustmentWorkflowTable';
import AdjustmentRequestForm from '@/components/finance/adjustments/AdjustmentRequestForm';
import { useFinanceTheme } from '@/hooks/finance/useFinanceTheme';
import { useFinancePermissions } from '@/hooks/finance/useFinancePermissions';
import {
    useListAdjustmentsQuery,
    useApproveAdjustmentMutation,
    useRejectAdjustmentMutation,
    useApplyAdjustmentMutation,
} from '@/features/apis/finance/adjustmentApi';
import { toMoneyNumber } from '@/lib/formaters';
import { toast } from 'sonner';

export default function Adjustments() {
    const theme = useFinanceTheme();
    const can = useFinancePermissions();
    const navigate = useNavigate();

    const [showForm, setShowForm] = useState(false);
    const { data, refetch, isFetching } = useListAdjustmentsQuery({ limit: 200 });
    const adjustments = data?.data || [];

    const [approve] = useApproveAdjustmentMutation();
    const [reject] = useRejectAdjustmentMutation();
    const [apply] = useApplyAdjustmentMutation();

    const stats = {
        total: adjustments.length,
        pending: adjustments.filter((a) => a.status === 'pending').length,
        approved: adjustments.filter((a) => a.status === 'approved').length,
        applied: adjustments.filter((a) => a.status === 'applied').length,
        netImpact: adjustments
            .filter((a) => a.status === 'applied')
            .reduce((s, a) => s + (a.type === 'credit' ? -toMoneyNumber(a.amount) : toMoneyNumber(a.amount)), 0),
    };

    const handleApprove = async (a) => {
        try {
            await approve({ id: a._id, remarks: 'Approved' }).unwrap();
            toast.success('Adjustment approved');
            refetch();
        } catch (err) {
            toast.error(err?.data?.message || 'Failed to approve');
        }
    };

    const handleReject = async (a) => {
        const reason = window.prompt('Reason for rejection:');
        if (!reason) return;
        try {
            await reject({ id: a._id, reason }).unwrap();
            toast.success('Adjustment rejected');
            refetch();
        } catch (err) {
            toast.error(err?.data?.message || 'Failed to reject');
        }
    };

    const handleApply = async (a) => {
        if (!window.confirm(`Apply this adjustment? It will ${a.type === 'credit' ? 'reduce' : 'increase'} the student's balance.`)) return;
        try {
            await apply(a._id).unwrap();
            toast.success('Adjustment applied');
            refetch();
        } catch (err) {
            toast.error(err?.data?.message || 'Failed to apply');
        }
    };

    return (
        <div className={`space-y-6 ${theme.text}`}>
            <FinancePageHeader
                title="Adjustments"
                subtitle="Manual corrections to student balances with full audit trail."
                breadcrumb={[
                    { label: 'Finance', to: '/admin/finance' },
                    { label: 'Adjustments' },
                ]}
                actions={
                    <>
                        <Button
                            variant="outline"
                            onClick={() => refetch()}
                            className={theme.outlineBtn}
                        >
                            <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                        {can.canRequestAdjustment && (
                            <Button onClick={() => setShowForm(true)} className={theme.primaryBtn}>
                                <Plus className="w-4 h-4 mr-2" />
                                New Adjustment
                            </Button>
                        )}
                    </>
                }
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <FinanceStatCard label="Pending" value={stats.pending} icon={Sliders} accent="yellow" />
                <FinanceStatCard label="Awaiting Apply" value={stats.approved} icon={Sliders} accent="blue" />
                <FinanceStatCard label="Applied" value={stats.applied} icon={Sliders} accent="green" />
                <FinanceStatCard
                    label="Net Impact"
                    value={<MoneyDisplay value={stats.netImpact} size="xl" tone={stats.netImpact > 0 ? 'negative' : 'positive'} />}
                    icon={Sliders}
                    accent="purple"
                />
            </div>

            <AdjustmentWorkflowTable
                statusFilter="all"
                onApprove={can.canApproveAdjustment ? handleApprove : undefined}
                onReject={can.canApproveAdjustment ? handleReject : undefined}
                onApply={can.canApplyAdjustment ? handleApply : undefined}
            />

            {/* New adjustment dialog */}
            <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogContent className={`max-w-xl max-h-[90vh] overflow-y-auto ${theme.dialog}`}>
                    <DialogHeader>
                        <DialogTitle className={theme.text}>New Adjustment</DialogTitle>
                    </DialogHeader>
                    <AdjustmentRequestForm
                        onSuccess={() => { setShowForm(false); refetch(); }}
                        onCancel={() => setShowForm(false)}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}