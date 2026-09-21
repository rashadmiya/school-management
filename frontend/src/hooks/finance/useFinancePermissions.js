// src/hooks/finance/useFinancePermissions.js
import { useMemo } from 'react';
import { useAppSelector } from '@/features/store';

/**
 * Finance role capabilities. Aligned with backend `authorizeRoles(...)`.
 *
 * Usage:
 *   const can = useFinancePermissions();
 *   {can.receivePayment && <Button>Receive Payment</Button>}
 */
export function useFinancePermissions() {
    const role = useAppSelector((s) => s.user?.user?.role?.name || s.user?.user?.role);

    return useMemo(() => {
        const isAdmin      = role === 'admin';
        const isAccountant = role === 'accountant';
        const isCashier    = role === 'cashier';
        const isAuditor    = role === 'auditor';
        const isFinanceUser = isAdmin || isAccountant || isCashier || isAuditor;

        return {
            role,
            isAdmin,
            isAccountant,
            isCashier,
            isAuditor,
            isFinanceUser,

            // Read access
            canViewFinance:   isFinanceUser,

            // Fee templates
            canCreateTemplate: isAdmin || isAccountant,
            canEditTemplate:   isAdmin || isAccountant,
            canDeleteTemplate: isAdmin || isAccountant,
            canApplyFees:      isAdmin || isAccountant,

            // Payments
            canReceivePayment: isAdmin || isAccountant || isCashier,
            canVoidPayment:    isAdmin || isAccountant,

            // Refunds
            canRequestRefund:  isAdmin || isAccountant,
            canApproveRefund:  isAdmin,
            canProcessRefund:  isAdmin || isAccountant,

            // Waivers
            canRequestWaiver:  isAdmin || isAccountant,
            canApproveWaiver:  isAdmin || isAccountant,
            canRevokeWaiver:   isAdmin || isAccountant,

            // Adjustments
            canRequestAdjustment: isAdmin || isAccountant,
            canApproveAdjustment: isAdmin,
            canApplyAdjustment:   isAdmin || isAccountant,

            // Reports / Reconciliation
            canViewReports:        isAdmin || isAccountant || isAuditor,
            canViewReconciliation: isAdmin || isAccountant || isAuditor,
            canViewAudit:          isAdmin || isAuditor,

            // Notifications
            canManageNotifications: true,

            // Export
            canExportReports: isAdmin || isAccountant || isAuditor,
        };
    }, [role]);
}