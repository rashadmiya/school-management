// components/parent/ChildPaymentDetails.jsx
import React from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Download, DollarSign, Calendar, FileText } from "lucide-react";
import { useGetChildPaymentDetailsQuery } from "@/features/apis/parentsApi";

export default function ChildPaymentDetails() {
  const { childId } = useParams();
  const { data, isLoading } = useGetChildPaymentDetailsQuery({ 
    childId, 
    page: 1, 
    limit: 20 
  });

  if (isLoading) return <div>Loading payment details...</div>;

  const { child, payments, summary, pagination } = data || {};

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'partial': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link to="/parent/payments">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Payments
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Payment Details</h1>
            <p className="text-gray-600">
              {child?.name} • Roll: {child?.rollNumber} • {child?.class?.name}
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-lg font-bold">{formatCurrency(summary?.totalDue)}</p>
            <p className="text-sm text-gray-600">Total Due</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-lg font-bold">{formatCurrency(summary?.totalPaid)}</p>
            <p className="text-sm text-gray-600">Total Paid</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <p className="text-lg font-bold">{formatCurrency(summary?.outstanding)}</p>
            <p className="text-sm text-gray-600">Outstanding</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <FileText className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-lg font-bold">{summary?.collectionRate || 0}%</p>
            <p className="text-sm text-gray-600">Collection Rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fee Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Paid Amount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Paid Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Receipt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments?.map((payment) => (
                <TableRow key={payment._id}>
                  <TableCell className="capitalize">{payment.feeType}</TableCell>
                  <TableCell>{formatCurrency(payment.amount)}</TableCell>
                  <TableCell className={
                    payment.paidAmount > 0 ? "text-green-600 font-semibold" : ""
                  }>
                    {formatCurrency(payment.paidAmount)}
                  </TableCell>
                  <TableCell>
                    {payment.dueDate ? new Date(payment.dueDate).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {payment.paidDate ? new Date(payment.paidDate).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(payment.status)}>
                      {payment.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {payment.paidAmount > 0 && (
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/parent/payments/receipt/${payment._id}`}>
                          <Download className="w-3 h-3 mr-1" />
                          Receipt
                        </Link>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {(!payments || payments.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p>No payment records found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}