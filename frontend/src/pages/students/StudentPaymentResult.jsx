// pages/student/StudentPaymentResult.jsx
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    useGetStudentPaymentIntentQuery,
} from "@/features/apis/studentsApi";
import {
    CheckCircle2, XCircle, Clock, Loader2, ArrowLeft, Download,
} from "lucide-react";
import { formatBDT } from "@/utils/formatCurrency";

export default function StudentPaymentResult() {
    const [params] = useSearchParams();
    const intentId = params.get("intentId");
    const gatewayStatus = params.get("status"); // "success" | "cancel" | null

    // Poll every 2s until the intent reaches a terminal state
    const {
        data,
        isLoading,
        isFetching,
        error,
    } = useGetStudentPaymentIntentQuery(intentId, {
        skip: !intentId,
        pollingInterval: 2000,
    });

    const intent = data?.data;
    const status = intent?.status || "pending";
    const isTerminal = ["succeeded", "failed", "expired", "cancelled"].includes(status);

    if (!intentId) {
        return (
            <div className="max-w-xl mx-auto py-12">
                <Card>
                    <CardContent className="p-8 text-center space-y-4">
                        <XCircle className="w-12 h-12 text-rose-500 mx-auto" />
                        <p className="text-gray-700">No payment reference provided.</p>
                        <Button asChild>
                            <Link to="/student/payments">Back to Payments</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="max-w-xl mx-auto py-12 text-center text-gray-500">
                <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin" />
                Loading payment status…
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-xl mx-auto py-12">
                <Card>
                    <CardContent className="p-8 text-center space-y-4">
                        <XCircle className="w-12 h-12 text-rose-500 mx-auto" />
                        <p className="text-gray-700">
                            {error?.data?.message || "Could not load payment status."}
                        </p>
                        <Button asChild>
                            <Link to="/student/payments">Back to Payments</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Determine display
    let icon, color, headline, description;
    if (status === "succeeded") {
        icon = <CheckCircle2 className="w-16 h-16 text-green-500" />;
        color = "text-green-700";
        headline = "Payment Successful";
        description = "Your fee account has been updated.";
    } else if (status === "failed" || status === "expired" || status === "cancelled") {
        icon = <XCircle className="w-16 h-16 text-rose-500" />;
        color = "text-rose-700";
        headline = status === "cancelled" ? "Payment Cancelled" : "Payment Failed";
        description =
            intent?.failureReason ||
            (status === "expired"
                ? "The payment window expired before it was completed."
                : "The gateway did not complete the payment.");
    } else {
        // pending or processing
        icon = (
            <div className="relative">
                <Clock className="w-16 h-16 text-amber-500" />
                {isFetching && (
                    <Loader2 className="w-5 h-5 absolute -right-1 -bottom-1 animate-spin text-amber-600" />
                )}
            </div>
        );
        color = "text-amber-700";
        headline = "Waiting for confirmation";
        description =
            "If you just completed the payment, this page will update automatically within a few seconds. Don't close this tab.";
    }

    return (
        <div className="max-w-xl mx-auto py-10 space-y-6">
            <Card>
                <CardContent className="p-8 text-center space-y-4">
                    <div className="flex justify-center">{icon}</div>
                    <h1 className={`text-2xl font-bold ${color}`}>{headline}</h1>
                    <p className="text-gray-600 text-sm">{description}</p>

                    {intent?.amount && (
                        <div className="pt-4 border-t space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Amount</span>
                                <span className="font-semibold">
                                    {formatBDT(intent.amount)}
                                </span>
                            </div>
                            {intent.gatewayReference && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Reference</span>
                                    <span className="font-mono text-xs">
                                        {intent.gatewayReference}
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-gray-600">Intent ID</span>
                                <span className="font-mono text-xs">{intent._id}</span>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-2 pt-4">
                        {status === "succeeded" && intent?.payment && (
                            <Button asChild className="flex-1">
                                <a
                                    href={`${import.meta.env.VITE_API_URL}/pdf/receipt/${intent.payment}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    Download Receipt
                                </a>
                            </Button>
                        )}
                        <Button variant="outline" asChild className="flex-1">
                            <Link to="/student/payments">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Payments
                            </Link>
                        </Button>
                    </div>

                    {!isTerminal && (
                        <p className="text-xs text-gray-400 pt-2">
                            This page checks every 2 seconds.
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}