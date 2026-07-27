// src/pages/Refunds/RefundHistory.jsx
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useGetRefundHistoryQuery, useGetRefundsQuery } from '@/features/apis/finance/refundApi'
import { useToast } from '@/hooks/use-toast'
import { useStudentSearch } from '@/hooks/useStudentSearch'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/formaters'
import { SESSION_OPTIONS } from '@/utils/constants'
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Download,
  Eye,
  Filter,
  RefreshCw,
  Search,
  TrendingDown,
  User,
  XCircle
} from 'lucide-react'
import { useState } from 'react'

const RefundHistory = () => {
  const [search, setSearch] = useState('')
  const [session, setSession] = useState(SESSION_OPTIONS[1].value)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [selectedRefund, setSelectedRefund] = useState(null)
  const [showDetails, setShowDetails] = useState(false)
  const [viewMode, setViewMode] = useState('all') // all, student

  const { toast } = useToast()

  const { data: refunds, isLoading, refetch } = useGetRefundsQuery({
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    studentId: viewMode === 'student' && selectedStudent ? selectedStudent._id : undefined,
  })

  const { data: studentRefunds } = useGetRefundHistoryQuery(
    selectedStudent ? { studentId: selectedStudent._id, session } : null,
    { skip: !selectedStudent || viewMode !== 'student' }
  )

  const {
    results: searchResults,
    isLoading: searchLoading
  } = useStudentSearch(searchTerm, {
    fields: 'name,rollNumber,religion',
    limit: 10,
  })


  const handleStudentSelect = (student) => {
    setSelectedStudent(student)
    setViewMode('student')
  }

  const handleViewDetails = (refund) => {
    setSelectedRefund(refund)
    setShowDetails(true)
  }

  const handleExport = () => {
    // Export functionality
    toast({
      title: 'Export Started',
      description: 'Refund history export initiated',
      variant: 'default',
    })
  }

  const getRefundStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'processed':
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'rejected':
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getRefundStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'processed':
      case 'completed':
        return <CheckCircle className="h-4 w-4 mr-1" />
      case 'pending':
        return <AlertCircle className="h-4 w-4 mr-1" />
      case 'rejected':
      case 'cancelled':
        return <XCircle className="h-4 w-4 mr-1" />
      default:
        return <AlertCircle className="h-4 w-4 mr-1" />
    }
  }

  const displayRefunds = viewMode === 'student' ? studentRefunds : refunds

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Refund History</h1>
          <p className="text-muted-foreground">
            View and track all refund transactions
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" onClick={refetch}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* View Mode Toggle */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Button
                  variant={viewMode === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setViewMode('all')
                    setSelectedStudent(null)
                  }}
                >
                  All Refunds
                </Button>
                <Button
                  variant={viewMode === 'student' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('student')}
                >
                  By Student
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {viewMode === 'all' ? (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by student..."
                    className="pl-10"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium mb-2">Student</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search student..."
                      className="pl-10"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      onFocus={() => {
                        if (search.length >= 2 && searchResults) {
                          // Show search results
                        }
                      }}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">From Date</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">To Date</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Session</label>
                <Select value={session} onValueChange={setSession}>
                  <SelectTrigger>
                    <SelectValue placeholder="Session" />
                  </SelectTrigger>
                  <SelectContent>
                    {SESSION_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {viewMode === 'student' && searchResults && searchResults.length > 0 && search.length >= 2 && (
              <div className="border rounded-md max-h-60 overflow-auto">
                {searchResults.map((student) => (
                  <div
                    key={student._id}
                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                    onClick={() => handleStudentSelect(student)}
                  >
                    <div className="font-medium">{student.name}</div>
                    <div className="text-sm text-gray-500">
                      Roll: {student.rollNumber} | Class: {student.class?.name}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {viewMode === 'student' && selectedStudent && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">{selectedStudent.name}</div>
                      <div className="text-sm text-gray-500">
                        Roll: {selectedStudent.rollNumber} | Class: {selectedStudent.class?.name}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedStudent(null)
                      setSearch('')
                    }}
                  >
                    Change
                  </Button>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={refetch}>
                <Filter className="mr-2 h-4 w-4" />
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Refunds</CardTitle>
            <RefreshCw className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {displayRefunds?.length || 0}
            </div>
            <p className="text-xs text-gray-500">
              Total refund transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {formatCurrency(
                displayRefunds?.reduce((sum, refund) => sum + refund.amount, 0) || 0
              )}
            </div>
            <p className="text-xs text-gray-500">
              Total refunded amount
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Refund</CardTitle>
            <AlertCircle className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {formatCurrency(
                displayRefunds?.length > 0
                  ? displayRefunds.reduce((sum, refund) => sum + refund.amount, 0) / displayRefunds.length
                  : 0
              )}
            </div>
            <p className="text-xs text-gray-500">
              Average refund amount
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {displayRefunds?.filter(r => r.status === 'pending').length || 0}
            </div>
            <p className="text-xs text-gray-500">
              Pending refund requests
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Refunds Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {viewMode === 'student' && selectedStudent
                ? `${selectedStudent.name}'s Refunds`
                : 'All Refunds'
              } ({displayRefunds?.length || 0})
            </CardTitle>
            <div className="text-sm text-gray-500">
              Total: {formatCurrency(
                displayRefunds?.reduce((sum, refund) => sum + refund.amount, 0) || 0
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : displayRefunds?.length === 0 ? (
            <div className="text-center py-12">
              <RefreshCw className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-semibold">No refunds found</h3>
              <p className="text-gray-500">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Payment Reference</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayRefunds.map((refund) => (
                    <TableRow key={refund._id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{refund.student?.name}</div>
                            <div className="text-sm text-gray-500">
                              Roll: {refund.student?.rollNumber}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                          {formatDateTime(refund.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">Payment: {refund.payment?.reference || 'N/A'}</div>
                          <div className="text-gray-500">
                            {formatCurrency(refund.payment?.amount || 0)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-red-600">
                        {formatCurrency(refund.amount)}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate">{refund.reason}</div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRefundStatusColor(refund.status)}>
                          {getRefundStatusIcon(refund.status)}
                          {refund.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewDetails(refund)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Refund Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Refund Details</DialogTitle>
          </DialogHeader>
          {selectedRefund && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {formatCurrency(selectedRefund.amount)}
                  </div>
                  <div className="text-sm text-gray-500">
                    Refund #{selectedRefund._id}
                  </div>
                </div>
                <Badge className={getRefundStatusColor(selectedRefund.status)}>
                  {getRefundStatusIcon(selectedRefund.status)}
                  {selectedRefund.status}
                </Badge>
              </div>

              {/* Student and Payment Info */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Student Information</h4>
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{selectedRefund.student?.name}</div>
                        <div className="text-sm text-gray-500">
                          Roll: {selectedRefund.student?.rollNumber} |
                          Class: {selectedRefund.student?.class?.name}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Refund Information</h4>
                    <div className="space-y-2">
                      <div>
                        <div className="text-sm text-gray-500">Processed By</div>
                        <div className="font-medium">{selectedRefund.refundedBy?.name}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Date & Time</div>
                        <div className="font-medium">{formatDateTime(selectedRefund.createdAt)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Session</div>
                        <div className="font-medium">{selectedRefund.session}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Payment Information</h4>
                    <div className="space-y-2">
                      <div>
                        <div className="text-sm text-gray-500">Payment Amount</div>
                        <div className="font-medium text-green-600">
                          {formatCurrency(selectedRefund.payment?.amount)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Payment Method</div>
                        <div className="font-medium">{selectedRefund.payment?.method}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Payment Date</div>
                        <div className="font-medium">{formatDate(selectedRefund.payment?.createdAt)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Payment Reference</div>
                        <div className="font-medium">{selectedRefund.payment?.reference || 'N/A'}</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Refund Reason</h4>
                    <p className="text-gray-600">{selectedRefund.reason}</p>
                  </div>
                </div>
              </div>

              {/* Additional Details */}
              {selectedRefund.description && (
                <div>
                  <h4 className="font-medium mb-2">Additional Details</h4>
                  <p className="text-gray-600">{selectedRefund.description}</p>
                </div>
              )}

              {/* Audit Trail */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Audit Trail</h4>
                <div className="text-sm text-gray-600">
                  <div>Created: {formatDateTime(selectedRefund.createdAt)}</div>
                  {selectedRefund.updatedAt && selectedRefund.updatedAt !== selectedRefund.createdAt && (
                    <div>Last Updated: {formatDateTime(selectedRefund.updatedAt)}</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default RefundHistory