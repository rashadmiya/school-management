// components/student/StudentPaymentReceipt.jsx
import React from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Printer, Calendar, User, CreditCard } from "lucide-react";
import { useGetStudentPaymentReceiptQuery } from "@/features/apis/studentsApi";

export default function StudentPaymentReceipt() {
  const { paymentId } = useParams();
  const { data, isLoading } = useGetStudentPaymentReceiptQuery(paymentId);

  if (isLoading) return <div className="flex justify-center py-8">Loading receipt...</div>;

  const { receipt } = data || {};

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'partial': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" asChild>
            <Link to="/student/payments">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Payments
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Payment Receipt</h1>
            <p className="text-gray-600">Receipt #{receipt?.receiptNumber}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Receipt Card */}
      <Card className="print:shadow-none border-2">
        <CardHeader className="border-b">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">Payment Receipt</CardTitle>
              <p className="text-gray-600 mt-1">Receipt #{receipt?.receiptNumber}</p>
            </div>
            <Badge className={getStatusColor(receipt?.status)}>
              {receipt?.status?.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Student Information */}
            <div>
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Student Information
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium">Name:</span>
                  <span>{receipt?.student?.name}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium">Roll Number:</span>
                  <span>{receipt?.student?.rollNumber}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium">Class:</span>
                  <span>{receipt?.student?.class?.name}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium">Section:</span>
                  <span>{receipt?.student?.class?.section}</span>
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div>
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Details
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium">Fee Type:</span>
                  <span className="capitalize">{receipt?.feeType}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium">Amount Due:</span>
                  <span>{formatCurrency(receipt?.amount)}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium">Amount Paid:</span>
                  <span className="text-green-600 font-semibold">{formatCurrency(receipt?.paidAmount)}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium">Due Date:</span>
                  <span>{receipt?.dueDate ? new Date(receipt.dueDate).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium">Paid Date:</span>
                  <span>{receipt?.paidDate ? new Date(receipt.paidDate).toLocaleDateString() : '-'}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium">Payment Method:</span>
                  <span className="capitalize">{receipt?.paymentMethod?.replace('_', ' ')}</span>
                </div>
                {receipt?.transactionId && (
                  <div className="flex justify-between border-b pb-2">
                    <span className="font-medium">Transaction ID:</span>
                    <span className="font-mono text-sm">{receipt.transactionId}</span>
                  </div>
                )}
                {receipt?.recordedBy && (
                  <div className="flex justify-between border-b pb-2">
                    <span className="font-medium">Recorded By:</span>
                    <span>{receipt.recordedBy.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold">Total Amount</p>
                <p className="text-sm text-gray-600">Including all charges</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">{formatCurrency(receipt?.paidAmount)}</p>
                <p className="text-sm text-gray-600">Paid on {receipt?.paidDate ? new Date(receipt.paidDate).toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>This is an official receipt for payment made. Please keep this receipt for your records.</p>
            <p className="mt-2">Generated on {new Date().toLocaleDateString()}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}