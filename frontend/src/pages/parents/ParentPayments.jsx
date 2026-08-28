// components/parent/ParentPayments.jsx
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useGetParentChildrenPaymentsQuery } from "@/features/apis/parentsApi";
import { Download, FileText, User } from "lucide-react";
import { Link } from "react-router-dom";

export default function ParentPayments() {
  const { data, isLoading } = useGetParentChildrenPaymentsQuery();
  
  const { children, summary } = data || {};

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'partial': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Payment Overview</h1>
          <p className="text-gray-600">Manage and track your children's fee payments</p>
        </div>
        <Button asChild>
          <Link to="/parent/payments/download">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Link>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-2xl font-bold">${summary?.totalDue || 0}</p>
            <p className="text-sm text-gray-600">Total Due</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-2xl font-bold text-green-600">${summary?.totalPaid || 0}</p>
            <p className="text-sm text-gray-600">Total Paid</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-2xl font-bold text-red-600">${summary?.totalOutstanding || 0}</p>
            <p className="text-sm text-gray-600">Outstanding</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-2xl font-bold">{summary?.collectionRate || 0}%</p>
            <p className="text-sm text-gray-600">Collection Rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Children Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Children Payment Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Child</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Total Due</TableHead>
                <TableHead>Total Paid</TableHead>
                <TableHead>Outstanding</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {children?.map((child) => (
                <TableRow key={child._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="font-medium">{child.name}</p>
                        <p className="text-sm text-gray-500">Roll: {child.rollNumber}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{child.class?.name || 'N/A'}</TableCell>
                  <TableCell>${child.totalDue}</TableCell>
                  <TableCell className="text-green-600">${child.totalPaid}</TableCell>
                  <TableCell className={
                    child.outstanding > 0 ? "text-red-600 font-semibold" : "text-gray-600"
                  }>
                    ${child.outstanding}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(child.paymentStatus)}>
                      {child.paymentStatus.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/parent/payments/${child._id}`}>
                        <FileText className="w-3 h-3 mr-1" />
                        Details
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}