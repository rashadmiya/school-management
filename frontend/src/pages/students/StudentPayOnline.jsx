// pages/student/StudentPayOnline.jsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    useCreateStudentPaymentIntentMutation,
    useGetStudentFinanceSummaryQuery,
} from "@/features/apis/studentsApi";
import { formatBDT } from "@/utils/formatCurrency";
import { ArrowLeft, Loader2, ShieldCheck, Wallet } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const MAX_ADVANCE_TOPUP = 50000;
const GATEWAYS = [
    { value: "sslcommerz", label: "SSLCommerz (bKash, Card, Bank)" },
    { value: "bkash", label: "bKash" },
    { value: "stripe", label: "Card (Stripe)" },
];

export default function StudentPayOnline() {
    const navigate = useNavigate();

    const { data, isLoading: loadingSummary } = useGetStudentFinanceSummaryQuery({});
    const [createIntent, { isLoading: creating }] = useCreateStudentPaymentIntentMutation();

    const summary = data?.summary || {};
    const due = Number(summary.dueBalance || 0);
    const advance = Number(summary.advanceBalance || 0);

    const maxAllowed = useMemo(
        () => (due > 0 ? due + MAX_ADVANCE_TOPUP : MAX_ADVANCE_TOPUP),
        [due]
    );

    // Default amount: exact outstanding, or a round number if the student
    // has no dues and is just topping up their advance.
    const [amount, setAmount] = useState("");
    const [gateway, setGateway] = useState("sslcommerz");

    useEffect(() => {
        if (loadingSummary) return;
        if (!amount) {
            setAmount(due > 0 ? String(due) : "500");
        }
    }, [loadingSummary, due, amount]);

    const numericAmount = Number(amount);
    const amountError =
        !amount || isNaN(numericAmount) || numericAmount <= 0
            ? "Enter a valid amount"
            : numericAmount > maxAllowed
                ? `Maximum allowed is ${formatBDT(maxAllowed)}`
                : null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (amountError) return;

        try {
            const res = await createIntent({
                amount: numericAmount,
                gateway,
                method: "online",
            }).unwrap();

            const { _id, redirectUrl } = res.data;

            if (redirectUrl) {
                // Gateway handles payment; browser returns to /student/payments/result
                window.location.href = redirectUrl;
            } else {
                // Cash/manual intent — route to result page which will poll
                navigate(`/student/payments/result?intentId=${_id}&status=pending`);
            }
        } catch (err) {
            toast.error(err?.data?.message || "Failed to start payment");
        }
    };

    if (loadingSummary) {
        return <div className="p-6 text-gray-500">Loading…</div>;
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" asChild>
                    <Link to="/student/payments">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Pay Online</h1>
                    <p className="text-sm text-gray-500">
                        Pay fees or top up your advance balance
                    </p>
                </div>
            </div>

            {/* Current balance */}
            <Card>
                <CardContent className="p-5 grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-gray-500">Outstanding</p>
                        <p className={`text-2xl font-bold ${due > 0 ? "text-rose-600" : "text-green-600"}`}>
                            {formatBDT(due)}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Advance Balance</p>
                        <p className="text-2xl font-bold text-blue-600">
                            {formatBDT(advance)}
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Form */}
            <Card>
                <CardHeader>
                    <CardTitle>Payment Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Amount */}
                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount (BDT)</Label>
                            <Input
                                id="amount"
                                type="number"
                                inputMode="decimal"
                                min="1"
                                step="0.01"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="h-12 text-lg"
                                placeholder="0.00"
                            />
                            {amountError ? (
                                <p className="text-sm text-rose-600">{amountError}</p>
                            ) : (
                                <p className="text-xs text-gray-500">
                                    Payments are allocated to your oldest unpaid fees first.
                                    Any excess becomes advance balance for future fees.
                                </p>
                            )}

                            {due > 0 && (
                                <div className="flex gap-2 pt-1">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setAmount(String(due))}
                                    >
                                        Pay full due ({formatBDT(due)})
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Gateway */}
                        <div className="space-y-2">
                            <Label>Payment Method</Label>
                            <Select value={gateway} onValueChange={setGateway}>
                                <SelectTrigger className="h-11">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {GATEWAYS.map((g) => (
                                        <SelectItem key={g.value} value={g.value}>
                                            {g.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Summary */}
                        <div className="p-4 bg-gray-50 rounded-lg space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Amount</span>
                                <span className="font-semibold">
                                    {amountError ? "—" : formatBDT(numericAmount)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Applied to outstanding</span>
                                <span>
                                    {amountError ? "—" : formatBDT(Math.min(numericAmount, due))}
                                </span>
                            </div>
                            {!amountError && numericAmount > due && (
                                <div className="flex justify-between text-blue-600">
                                    <span>To advance balance</span>
                                    <span>{formatBDT(numericAmount - due)}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-start gap-2 text-xs text-gray-500 bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <ShieldCheck className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <span>
                                You'll be redirected to the payment gateway. Your fee account
                                updates automatically once the payment is confirmed.
                            </span>
                        </div>

                        <Button
                            type="submit"
                            disabled={!!amountError || creating}
                            className="w-full h-12 text-base"
                        >
                            {creating ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Starting payment…
                                </>
                            ) : (
                                <>
                                    <Wallet className="mr-2 h-4 w-4" />
                                    Pay {amountError ? "" : formatBDT(numericAmount)}
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}