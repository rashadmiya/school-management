// components/parent/PaymentReceipt.jsx
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Download, FileText } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useEffect } from "react";

export default function PaymentReceipt() {
    const { paymentId } = useParams();
    const pdfUrl = `${import.meta.env.VITE_API_URL}/pdf/receipt/${paymentId}`;

    // Auto-open the PDF in a new tab on mount
    useEffect(() => {
        const w = window.open(pdfUrl, "_blank");
        if (!w) {
            // popup blocked — user can click the button below
        }
    }, [pdfUrl]);

    return (
        <div className="space-y-6 max-w-xl">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" asChild>
                    <Link to="/parent/payments">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
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

// // components/parent/PaymentReceipt.jsx
// import React from "react";
// import { useParams, Link } from "react-router-dom";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { ArrowLeft, Download, Printer } from "lucide-react";
// import { useGetPaymentReceiptQuery } from "@/features/apis/parentsApi";

// export default function PaymentReceipt() {
//   const { paymentId } = useParams();
//   const { data, isLoading } = useGetPaymentReceiptQuery(paymentId);

//   if (isLoading) return <div>Loading receipt...</div>;

//   const { receipt } = data || {};

//   const handlePrint = () => {
//     window.print();
//   };

//   return (
//     <div className="space-y-6">
//       <div className="flex items-center justify-between">
//         <div className="flex items-center gap-4">
//           <Button variant="outline" asChild>
//             <Link to="/parent/payments">
//               <ArrowLeft className="w-4 h-4 mr-2" />
//               Back to Payments
//             </Link>
//           </Button>
//           <div>
//             <h1 className="text-2xl font-bold">Payment Receipt</h1>
//             <p className="text-gray-600">Receipt #{receipt?.receiptNumber}</p>
//           </div>
//         </div>
//         <div className="flex gap-2">
//           <Button onClick={handlePrint}>
//             <Printer className="w-4 h-4 mr-2" />
//             Print
//           </Button>
//           <Button variant="outline">
//             <Download className="w-4 h-4 mr-2" />
//             Download
//           </Button>
//         </div>
//       </div>

//       <Card className="print:shadow-none">
//         <CardHeader>
//           <CardTitle>Payment Receipt #{receipt?.receiptNumber}</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <div className="grid grid-cols-2 gap-6">
//             <div>
//               <h3 className="font-semibold mb-2">Student Information</h3>
//               <p><strong>Name:</strong> {receipt?.student?.name}</p>
//               <p><strong>Roll Number:</strong> {receipt?.student?.rollNumber}</p>
//               <p><strong>Class:</strong> {receipt?.student?.class?.name}</p>
//             </div>
//             <div>
//               <h3 className="font-semibold mb-2">Payment Details</h3>
//               <p><strong>Fee Type:</strong> {receipt?.feeType}</p>
//               <p><strong>Amount:</strong> ${receipt?.amount}</p>
//               <p><strong>Paid Amount:</strong> ${receipt?.paidAmount}</p>
//               <p><strong>Paid Date:</strong> {receipt?.paidDate ? new Date(receipt.paidDate).toLocaleDateString() : 'N/A'}</p>
//               <p><strong>Payment Method:</strong> {receipt?.paymentMethod}</p>
//               {receipt?.transactionId && (
//                 <p><strong>Transaction ID:</strong> {receipt.transactionId}</p>
//               )}
//             </div>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }