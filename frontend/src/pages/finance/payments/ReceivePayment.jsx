// src/pages/finance/payments/ReceivePayment.jsx
import { ArrowLeft, Receipt } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FinancePageHeader } from '@/components/finance';
import { useFinanceTheme } from '@/hooks/finance/useFinanceTheme';
import { useFinancePermissions } from '@/hooks/finance/useFinancePermissions';
import ReceivePaymentForm from '@/components/finance/payments/ReceivePaymentForm';

export default function ReceivePayment() {
    const theme = useFinanceTheme();
    const can = useFinancePermissions();
    const navigate = useNavigate();

    if (!can.canReceivePayment) {
        return (
            <div className={`p-6 ${theme.text}`}>
                <Card className={`border shadow-sm ${theme.card}`}>
                    <CardContent className="py-12 text-center">
                        <p className={theme.textMuted}>
                            You don't have permission to receive payments.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className={`space-y-6 ${theme.text}`}>
            <FinancePageHeader
                title="Receive Payment"
                subtitle="Record a fee payment against a student's outstanding balance."
                breadcrumb={[
                    { label: 'Finance', to: '/admin/finance' },
                    { label: 'Payments' },
                    { label: 'Receive' },
                ]}
                actions={
                    <Button
                        variant="outline"
                        onClick={() => navigate('/admin/finance/payments/history')}
                        className={theme.outlineBtn}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        View History
                    </Button>
                }
            />

            <Card className={`border shadow-sm ${theme.card}`}>
                <CardHeader className="pb-3">
                    <CardTitle className={`text-lg flex items-center gap-2 ${theme.text}`}>
                        <Receipt className="w-5 h-5" />
                        New Payment
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ReceivePaymentForm
                        onSuccess={() => {}}
                        onCancel={() => navigate('/finance/payments/history')}
                    />
                </CardContent>
            </Card>
        </div>
    );
}