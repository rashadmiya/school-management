// components/student/StudentPayments.jsx
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useGetStudentPaymentsQuery } from "@/features/apis/studentsApi";
import { ArrowLeft, Calendar, Download, FileText, Filter } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

export default function StudentPayments() {
  const [academicYear, setAcademicYear] = useState(new Date().getFullYear().toString());
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  
  const { data, isLoading } = useGetStudentPaymentsQuery({ 
    academicYear, 
    page, 
    limit: 10 
  });

  if (isLoading) return <div className="flex justify-center py-8">Loading payments...</div>;

  const { payments, summary, pagination, student } = data || {};

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

  // Filter payments by status
  const filteredPayments = statusFilter === "all" 
    ? payments 
    : payments?.filter(payment => payment.status === statusFilter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link to="/student">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">My Payments</h1>
            <p className="text-gray-600">View and manage your fee payments</p>
          </div>
        </div>
        <Button asChild>
          <Link to="/student/payments/export">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Academic Year</Label>
              <Input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="e.g., 2024"
              />
            </div>

            <div className="space-y-2">
              <Label>Payment Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Actions</Label>
              <Button variant="outline" className="w-full flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <span className="mr-2 mx-auto text-blue-600 m-8 h-8 text-muted-foreground text-lg">৳</span>
            <p className="text-2xl font-bold">{formatCurrency(summary?.totalDue)}</p>
            <p className="text-sm text-gray-600">Total Due</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <span className="mr-2 mx-auto text-green-600 m-8 h-8 text-muted-foreground text-lg">৳</span>
            <p className="text-2xl font-bold">{formatCurrency(summary?.totalPaid)}</p>
            <p className="text-sm text-gray-600">Total Paid</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <span className="mr-2 mx-auto text-red-600 m-8 h-8 text-muted-foreground text-lg">৳</span>
            <p className="text-2xl font-bold">{formatCurrency(summary?.outstanding)}</p>
            <p className="text-sm text-gray-600">Outstanding</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <FileText className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">{summary?.collectionRate || 0}%</p>
            <p className="text-sm text-gray-600">Collection Rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Badge className="bg-green-100 text-green-800 w-full justify-center">
              Paid: {summary?.statusCounts?.paid || 0}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Badge className="bg-yellow-100 text-yellow-800 w-full justify-center">
              Pending: {summary?.statusCounts?.pending || 0}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Badge className="bg-red-100 text-red-800 w-full justify-center">
              Overdue: {summary?.statusCounts?.overdue || 0}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Badge className="bg-blue-100 text-blue-800 w-full justify-center">
              Partial: {summary?.statusCounts?.partial || 0}
            </Badge>
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
              {filteredPayments?.map((payment) => (
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
                        <Link to={`/student/payments/receipt/${payment._id}`}>
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

          {(!filteredPayments || filteredPayments.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p>No payment records found</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-600">
                Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, pagination.totalPayments)} of {pagination.totalPayments} payments
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasPrev}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasNext}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}