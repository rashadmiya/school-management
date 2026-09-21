{/* <Route path="finance" element={<FinanceProtectedRoute />}>
    <Route index element={<FinanceDashboard />} />
    <Route path="fees/templates" element={<FeeTemplates />} />
</Route> */}

// hooks/FinanceProtectedRoute.jsx
import { Outlet, Navigate } from 'react-router-dom';
import { useAppSelector } from '@/features/store';

export default function FinanceProtectedRoute() {
    const user = useAppSelector((s) => s.user?.user);
    const role = user?.role?.name || user?.role;
    const allowed = ['admin', 'accountant', 'cashier', 'auditor'];

    if (!allowed.includes(role)) {
        return <Navigate to="/admin/dashboard" replace />;
    }
    return <Outlet />;
}