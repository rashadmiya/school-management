// components/student/StudentPaymentReceipt.jsx
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Download, FileText } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useEffect } from "react";

export default function StudentPaymentReceipt() {
    const { paymentId } = useParams();
    const pdfUrl = `${import.meta.env.VITE_API_URL}/pdf/receipt/${paymentId}`;

    useEffect(() => {
        window.open(pdfUrl, "_blank");
    }, [pdfUrl]);

    return (
        <div className="space-y-6 max-w-xl">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" asChild>
                    <Link to="/student/payments">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Payments
                    </Link>
                </Button>
                <h1 className="text-2xl font-bold">Payment Receipt</h1>
            </div>

            <Card>
                <CardContent className="p-8 text-center space-y-4">
                    <FileText className="w-16 h-16 text-blue-500 mx-auto" />
                    <p className="text-gray-600">
                        Your receipt is opening in a new tab. If it didn't open,
                        click below.
                    </p>
                    <Button asChild>
                        <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                            <Download className="w-4 h-4 mr-2" />
                            Open Receipt PDF
                        </a>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}