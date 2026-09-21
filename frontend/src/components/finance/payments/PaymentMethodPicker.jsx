// src/components/finance/payments/PaymentMethodPicker.jsx
import { Banknote, CreditCard, Landmark, Smartphone, FileCheck, Globe } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFinanceTheme } from '@/hooks/finance/useFinanceTheme';

const METHODS = [
    { value: 'cash',           label: 'Cash',           icon: Banknote },
    { value: 'bank_transfer',  label: 'Bank Transfer',  icon: Landmark },
    { value: 'check',          label: 'Check',          icon: FileCheck },
    { value: 'mobile_banking', label: 'Mobile Banking', icon: Smartphone },
    { value: 'card',           label: 'Card',           icon: CreditCard },
    { value: 'online',         label: 'Online',         icon: Globe },
];

/**
 * Props:
 *   method           — string
 *   onMethodChange   — (method) => void
 *   details          — object (methodDetails)
 *   onDetailsChange  — (details) => void
 */
export default function PaymentMethodPicker({
    method,
    onMethodChange,
    details,
    onDetailsChange,
}) {
    const theme = useFinanceTheme();
    const set = (key, value) => onDetailsChange({ ...details, [key]: value });
    const inputCls = theme.input;
    const labelCls = `text-sm font-medium ${theme.textSoft}`;

    return (
        <div className="space-y-4">
            {/* Method grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {METHODS.map((m) => {
                    const Icon = m.icon;
                    const active = method === m.value;
                    return (
                        <button
                            key={m.value}
                            type="button"
                            onClick={() => onMethodChange(m.value)}
                            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                                active
                                    ? 'bg-blue-600 border-blue-600 text-white'
                                    : `${theme.cardSolid} ${theme.textSoft} ${theme.cardHover}`
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            <span className="truncate">{m.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Method-specific fields */}
            {method === 'bank_transfer' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    <div className="space-y-1.5">
                        <Label className={labelCls}>Bank Name</Label>
                        <Input
                            placeholder="e.g., BRAC Bank"
                            value={details?.bankName || ''}
                            onChange={(e) => set('bankName', e.target.value)}
                            className={inputCls}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className={labelCls}>Account / Reference</Label>
                        <Input
                            placeholder="Account number or transaction ref"
                            value={details?.accountNumber || ''}
                            onChange={(e) => set('accountNumber', e.target.value)}
                            className={inputCls}
                        />
                    </div>
                </div>
            )}

            {method === 'check' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    <div className="space-y-1.5">
                        <Label className={labelCls}>Check Number</Label>
                        <Input
                            placeholder="e.g., 001234"
                            value={details?.checkNumber || ''}
                            onChange={(e) => set('checkNumber', e.target.value)}
                            className={inputCls}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className={labelCls}>Bank Name</Label>
                        <Input
                            placeholder="e.g., City Bank"
                            value={details?.bankName || ''}
                            onChange={(e) => set('bankName', e.target.value)}
                            className={inputCls}
                        />
                    </div>
                </div>
            )}

            {method === 'mobile_banking' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    <div className="space-y-1.5">
                        <Label className={labelCls}>Operator</Label>
                        <Input
                            placeholder="e.g., bKash / Nagad / Rocket"
                            value={details?.mobileOperator || ''}
                            onChange={(e) => set('mobileOperator', e.target.value)}
                            className={inputCls}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className={labelCls}>Transaction ID</Label>
                        <Input
                            placeholder="TrxID"
                            value={details?.transactionId || ''}
                            onChange={(e) => set('transactionId', e.target.value)}
                            className={inputCls}
                        />
                    </div>
                </div>
            )}

            {method === 'card' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    <div className="space-y-1.5">
                        <Label className={labelCls}>Card Last 4 Digits</Label>
                        <Input
                            placeholder="1234"
                            maxLength={4}
                            value={details?.cardLastFour || ''}
                            onChange={(e) => set('cardLastFour', e.target.value.replace(/\D/g, '').slice(0, 4))}
                            className={inputCls}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className={labelCls}>Transaction ID</Label>
                        <Input
                            placeholder="Gateway ref"
                            value={details?.transactionId || ''}
                            onChange={(e) => set('transactionId', e.target.value)}
                            className={inputCls}
                        />
                    </div>
                </div>
            )}

            {method === 'online' && (
                <div className="space-y-1.5 pt-2">
                    <Label className={labelCls}>Transaction ID</Label>
                    <Input
                        placeholder="Gateway transaction reference"
                        value={details?.transactionId || ''}
                        onChange={(e) => set('transactionId', e.target.value)}
                        className={inputCls}
                    />
                </div>
            )}
        </div>
    );
}