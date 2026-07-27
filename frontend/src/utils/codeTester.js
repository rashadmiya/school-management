// src/pages/Payments/AdvanceBalance.jsx
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useGetStudentFeesQuery } from '@/features/apis/finance/feeApi'
import { useAutoApplyAdvanceMutation, useGetAdvanceBalanceQuery } from '@/features/apis/finance/paymentApi'
import { useGetStudentsByIdQuery, useAdvancedStudentSearchQuery } from '@/features/apis/studentsApi'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency, formatDate } from '@/lib/formaters'
import {
    ArrowRightLeft,
    DollarSign,
    Download,
    History,
    Search,
    TrendingDown,
    TrendingUp,
    User
} from 'lucide-react'
import { useState } from 'react'

const AdvanceBalance = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [showTransactions, setShowTransactions] = useState(false)
  const [showUseAdvance, setShowUseAdvance] = useState(false)
  const [useAmount, setUseAmount] = useState('')

  const { toast } = useToast()
  
  const { data: searchResults } = useAdvancedStudentSearchQuery(searchTerm, {
    skip: searchTerm.length < 2,
  })

  const { data: student } = useGetStudentsByIdQuery(selectedStudent?._id, {
    skip: !selectedStudent,
  })

  const { data: advanceBalance, refetch: refetchAdvance } = useGetAdvanceBalanceQuery(
    selectedStudent?._id,
    { skip: !selectedStudent }
  )

  const { data: studentFees } = useGetStudentFeesQuery(
    selectedStudent ? { studentId: selectedStudent._id } : null,
    { skip: !selectedStudent }
  )

  const [autoApplyAdvance, { isLoading: isAutoApplying }] = useAutoApplyAdvanceMutation()

  const handleStudentSelect = (student) => {
    setSelectedStudent(student)
  }

  const handleAutoApply = async () => {
    if (!selectedStudent) return

    try {
      const result = await autoApplyAdvance({
        studentId: selectedStudent._id,
      }).unwrap()

      toast({
        title: 'Success',
        description: `Advance balance applied to ${result.appliedFees.length} fees`,
        variant: 'success',
      })

      refetchAdvance()
    } catch (error) {
      toast({
        title: 'Error',
        description: error.data?.message || 'Failed to apply advance balance',
        variant: 'destructive',
      })
    }
  }

  const totalDueAmount = studentFees?.reduce((sum, fee) => sum + fee.dueAmount, 0) || 0
  const canAutoApply = advanceBalance?.amount > 0 && totalDueAmount > 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Advance Balance</h1>
          <p className="text-muted-foreground">
            Manage student advance/credit balances
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Student Search */}
      <Card>
        <CardHeader>
          <CardTitle>Search Student</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name or roll number..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => {
                  if (searchTerm.length >= 2 && searchResults) {
                    // Show search results
                  }
                }}
              />
            </div>

            {searchResults && searchResults.length > 0 && searchTerm.length >= 2 && (
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
          </div>
        </CardContent>
      </Card>

      {/* Selected Student Info */}
      {selectedStudent && (
        <>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{selectedStudent.name}</h3>
                    <p className="text-gray-500">
                      Roll: {selectedStudent.rollNumber} | Class: {selectedStudent.class?.name} | Session: {selectedStudent.session}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowTransactions(true)}
                  >
                    <History className="mr-2 h-4 w-4" />
                    View Transactions
                  </Button>
                  {canAutoApply && (
                    <Button
                      variant="outline"
                      onClick={handleAutoApply}
                      disabled={isAutoApplying}
                    >
                      {isAutoApplying ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                          Applying...
                        </>
                      ) : (
                        <>
                          <ArrowRightLeft className="mr-2 h-4 w-4" />
                          Auto Apply
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Advance Balance Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Advance Balance</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {formatCurrency(advanceBalance?.amount || 0)}
                </div>
                <p className="text-xs text-gray-500">
                  Available for fee payments
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Due</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  {formatCurrency(totalDueAmount)}
                </div>
                <p className="text-xs text-gray-500">
                  Across {studentFees?.length || 0} fee(s)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Can Cover</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {formatCurrency(Math.min(advanceBalance?.amount || 0, totalDueAmount))}
                </div>
                <p className="text-xs text-gray-500">
                  {totalDueAmount > 0 ? (
                    <span>
                      {Math.round((Math.min(advanceBalance?.amount || 0, totalDueAmount) / totalDueAmount) * 100)}% of due amount
                    </span>
                  ) : (
                    'No due fees'
                  )}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Outstanding Fees */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Outstanding Fees</CardTitle>
                <div className="text-sm text-gray-500">
                  {studentFees?.filter(f => f.dueAmount > 0).length || 0} fees with due amount
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {studentFees?.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fee Title</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Total Amount</TableHead>
                        <TableHead>Paid</TableHead>
                        <TableHead>Due Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {studentFees
                        .filter(fee => fee.dueAmount > 0)
                        .map((fee) => (
                          <TableRow key={fee._id}>
                            <TableCell>
                              <div className="font-medium">{fee.feeTemplate?.title}</div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">{formatDate(fee.dueDate)}</div>
                            </TableCell>
                            <TableCell className="font-medium">
                              {formatCurrency(fee.totalAmount)}
                            </TableCell>
                            <TableCell>
                              <div className="text-green-600">
                                {formatCurrency(fee.paidAmount)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-semibold text-red-600">
                                {formatCurrency(fee.dueAmount)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-yellow-100 text-yellow-800">
                                Due
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setShowUseAdvance(true)
                                    setUseAmount(Math.min(fee.dueAmount, advanceBalance?.amount || 0).toString())
                                  }}
                                  disabled={(advanceBalance?.amount || 0) <= 0}
                                >
                                  Use Advance
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-4 text-lg font-semibold">No outstanding fees</h3>
                  <p className="text-gray-500">All fees are paid or waived</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Transaction History Dialog */}
      <Dialog open={showTransactions} onOpenChange={setShowTransactions}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Advance Balance Transactions</DialogTitle>
          </DialogHeader>
          {advanceBalance && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(advanceBalance.amount)}
                  </div>
                  <div className="text-sm text-gray-500">Current Balance</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">Last Updated</div>
                  <div className="text-sm text-gray-500">
                    {formatDate(advanceBalance.lastUpdated)}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Transaction History</h4>
                {advanceBalance.transactions?.length > 0 ? (
                  <div className="max-h-96 overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="text-right">Balance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {advanceBalance.transactions.map((transaction, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <div className="text-sm">
                                {formatDate(transaction.createdAt)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={
                                transaction.type === 'credit' 
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }>
                                {transaction.type}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">{transaction.description}</div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className={
                                transaction.type === 'credit' 
                                  ? 'text-green-600 font-medium'
                                  : 'text-red-600 font-medium'
                              }>
                                {transaction.type === 'credit' ? '+' : '-'}
                                {formatCurrency(transaction.amount)}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="font-medium">
                                {formatCurrency(transaction.newBalance)}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <History className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-4 text-lg font-semibold">No transactions</h3>
                    <p className="text-gray-500">No advance balance transactions found</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AdvanceBalance

// src/pages/Payments/PaymentHistory.jsx
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useGetPaymentAllocationsQuery, useGetPaymentsQuery } from '@/features/apis/finance/paymentApi'
import { formatCurrency, formatDateTime, getStatusColor } from '@/lib/formaters'
import { PAYMENT_METHODS, PAYMENT_STATUS, SESSION_OPTIONS } from '@/utils/constants'
import {
    Calendar,
    CreditCard,
    Download,
    Eye,
    Filter,
    Receipt,
    Search,
    User
} from 'lucide-react'
import { useState } from 'react'

const PaymentHistory = () => {
    const [search, setSearch] = useState('')
    const [session, setSession] = useState(SESSION_OPTIONS[1].value)
    const [method, setMethod] = useState('')
    const [status, setStatus] = useState('')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [selectedPayment, setSelectedPayment] = useState(null)
    const [showDetails, setShowDetails] = useState(false)

    const { data: payments, isLoading } = useGetPaymentsQuery({
        session,
        method: method || undefined,
        status: status || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        studentId: search || undefined,
    })

    const { data: allocations } = useGetPaymentAllocationsQuery(selectedPayment?._id, {
        skip: !selectedPayment,
    })

    const handleViewDetails = (payment) => {
        setSelectedPayment(payment)
        setShowDetails(true)
    }

    const filteredPayments = payments || []

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Payment History</h1>
                    <p className="text-muted-foreground">
                        View and track all payment transactions
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search by student..."
                                className="pl-10"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
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
                        <Select value={method ?? 'all'}
                            onValueChange={(value) => setMethod(value === 'all' ? '' : value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Payment Method" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Methods</SelectItem>
                                {PAYMENT_METHODS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={status ?? 'all'}
                            onValueChange={(value) => setStatus(value === 'all' ? '' : value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                {PAYMENT_STATUS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <div className="flex space-x-2">
                            <Button variant="outline" className="flex-1" onClick={() => {
                                setSearch('')
                                setMethod('')
                                setStatus('')
                                setStartDate('')
                                setEndDate('')
                            }}>
                                <Filter className="mr-2 h-4 w-4" />
                                Clear
                            </Button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div>
                            <Label htmlFor="startDate">From Date</Label>
                            <Input
                                id="startDate"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div>
                            <Label htmlFor="endDate">To Date</Label>
                            <Input
                                id="endDate"
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                        <div className="flex items-end">
                            <Button className="w-full">
                                Apply Filters
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Payments Table */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Payments ({filteredPayments.length})</CardTitle>
                        <div className="text-sm text-gray-500">
                            Total: {formatCurrency(filteredPayments.reduce((sum, p) => sum + p.amount, 0))}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        </div>
                    ) : filteredPayments.length === 0 ? (
                        <div className="text-center py-12">
                            <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-4 text-lg font-semibold">No payments found</h3>
                            <p className="text-gray-500">Try adjusting your filters</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Student</TableHead>
                                        <TableHead>Date & Time</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Method</TableHead>
                                        <TableHead>Reference</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredPayments.map((payment) => (
                                        <TableRow key={payment._id}>
                                            <TableCell>
                                                <div className="flex items-center space-x-3">
                                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                        <User className="h-5 w-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">{payment.student?.name}</div>
                                                        <div className="text-sm text-gray-500">
                                                            Roll: {payment.student?.rollNumber}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center">
                                                    <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                                                    {formatDateTime(payment.createdAt)}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-semibold">
                                                {formatCurrency(payment.amount)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">
                                                    {PAYMENT_METHODS.find(m => m.value === payment.method)?.label || payment.method}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm text-gray-500">
                                                    {payment.reference || 'N/A'}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={getStatusColor(payment.status, 'payment')}>
                                                    {payment.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleViewDetails(payment)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => {
                                                            // Print receipt
                                                        }}
                                                    >
                                                        <Receipt className="h-4 w-4" />
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

            {/* Payment Details Dialog */}
            <Dialog open={showDetails} onOpenChange={setShowDetails}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Payment Details</DialogTitle>
                    </DialogHeader>
                    {selectedPayment && (
                        <div className="space-y-6">
                            {/* Payment Header */}
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <div className="text-2xl font-bold text-green-600">
                                        {formatCurrency(selectedPayment.amount)}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        Payment #{selectedPayment._id}
                                    </div>
                                </div>
                                <Badge className={getStatusColor(selectedPayment.status, 'payment')}>
                                    {selectedPayment.status}
                                </Badge>
                            </div>

                            {/* Payment Details */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-gray-500">Student</label>
                                    <p className="font-medium">{selectedPayment.student?.name}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500">Payment Method</label>
                                    <p className="font-medium">
                                        {PAYMENT_METHODS.find(m => m.value === selectedPayment.method)?.label || selectedPayment.method}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500">Date & Time</label>
                                    <p className="font-medium">{formatDateTime(selectedPayment.createdAt)}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500">Received By</label>
                                    <p className="font-medium">{selectedPayment.receivedBy?.name}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500">Reference</label>
                                    <p className="font-medium">{selectedPayment.reference || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500">Session</label>
                                    <p className="font-medium">{selectedPayment.session}</p>
                                </div>
                            </div>

                            {/* Method Details */}
                            {selectedPayment.methodDetails && (
                                <div className="border-t pt-4">
                                    <h4 className="font-medium mb-2">Payment Method Details</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        {selectedPayment.methodDetails.bankName && (
                                            <div>
                                                <label className="text-sm text-gray-500">Bank Name</label>
                                                <p className="font-medium">{selectedPayment.methodDetails.bankName}</p>
                                            </div>
                                        )}
                                        {selectedPayment.methodDetails.accountNumber && (
                                            <div>
                                                <label className="text-sm text-gray-500">Account Number</label>
                                                <p className="font-medium">{selectedPayment.methodDetails.accountNumber}</p>
                                            </div>
                                        )}
                                        {selectedPayment.methodDetails.transactionId && (
                                            <div>
                                                <label className="text-sm text-gray-500">Transaction ID</label>
                                                <p className="font-medium">{selectedPayment.methodDetails.transactionId}</p>
                                            </div>
                                        )}
                                        {selectedPayment.methodDetails.mobileOperator && (
                                            <div>
                                                <label className="text-sm text-gray-500">Mobile Operator</label>
                                                <p className="font-medium">{selectedPayment.methodDetails.mobileOperator}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Allocations */}
                            {allocations && allocations.length > 0 && (
                                <div className="border-t pt-4">
                                    <h4 className="font-medium mb-2">Payment Allocations</h4>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b">
                                                    <th className="text-left py-2">Fee Title</th>
                                                    <th className="text-right py-2">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {allocations.map((allocation) => (
                                                    <tr key={allocation._id} className="border-b">
                                                        <td className="py-2">{allocation.feeInstance?.feeTemplate?.title}</td>
                                                        <td className="text-right py-2">{formatCurrency(allocation.amount)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Notes */}
                            {selectedPayment.notes && (
                                <div className="border-t pt-4">
                                    <h4 className="font-medium mb-2">Notes</h4>
                                    <p className="text-gray-600">{selectedPayment.notes}</p>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="border-t pt-4 flex justify-end space-x-2">
                                <Button variant="outline">Print Receipt</Button>
                                {selectedPayment.status === 'completed' && (
                                    <Button variant="outline">Process Refund</Button>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default PaymentHistory

// src/pages/Payments/ReceivePayment.jsx
import PaymentForm from '@/components/finance/PaymentForm'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useGetPaymentHistoryQuery, useReceivePaymentMutation } from '@/features/apis/finance/paymentApi'
import { useAdvancedStudentSearchQuery } from '@/features/apis/studentsApi'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency, formatDate } from '@/lib/formaters'
import { PAYMENT_METHODS, SESSION_OPTIONS } from '@/utils/constants'
import {
    AlertCircle,
    Calendar,
    CheckCircle,
    CreditCard,
    DollarSign,
    History,
    Search,
    User
} from 'lucide-react'
import { useState } from 'react'

const ReceivePayment = () => {
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedStudent, setSelectedStudent] = useState(null)
    const [activeTab, setActiveTab] = useState('receive')
    const [quickPayment, setQuickPayment] = useState({
        amount: '',
        method: 'cash',
        reference: '',
        notes: '',
    })

    const { toast } = useToast()

    const { data: searchResults } = useAdvancedStudentSearchQuery(searchTerm, {
        skip: searchTerm.length < 2,
    })

    const { data: recentPayments, refetch: refetchPayments } = useGetPaymentHistoryQuery(
        selectedStudent ? { studentId: selectedStudent._id, limit: 5 } : null,
        { skip: !selectedStudent }
    )

    const [receivePayment, { isLoading: isProcessing }] = useReceivePaymentMutation()

    const handleStudentSelect = (student) => {
        setSelectedStudent(student)
        setActiveTab('receive')
    }

    const handleQuickPayment = async () => {
        if (!selectedStudent || !quickPayment.amount || parseFloat(quickPayment.amount) <= 0) {
            toast({
                title: 'Error',
                description: 'Please select a student and enter a valid amount',
                variant: 'destructive',
            })
            return
        }

        try {
            const paymentData = {
                studentId: selectedStudent._id,
                amount: parseFloat(quickPayment.amount),
                method: quickPayment.method,
                reference: quickPayment.reference,
                notes: quickPayment.notes,
                session: SESSION_OPTIONS[1].value,
            }

            const result = await receivePayment(paymentData).unwrap()

            toast({
                title: 'Success',
                description: `Payment of ${formatCurrency(quickPayment.amount)} received successfully`,
                variant: 'success',
            })

            // Reset quick payment form
            setQuickPayment({
                amount: '',
                method: 'cash',
                reference: '',
                notes: '',
            })

            // Refresh payment history
            refetchPayments()
        } catch (error) {
            toast({
                title: 'Error',
                description: error.data?.message || 'Failed to receive payment',
                variant: 'destructive',
            })
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Receive Payment</h1>
                    <p className="text-muted-foreground">
                        Record payments from students
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline">
                        <History className="mr-2 h-4 w-4" />
                        View All Payments
                    </Button>
                </div>
            </div>

            {/* Student Search */}
            <Card>
                <CardHeader>
                    <CardTitle>Select Student</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search student by name or roll number..."
                                className="pl-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {searchResults && searchResults.length > 0 && searchTerm.length >= 2 && (
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

                        {selectedStudent && (
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
                                        onClick={() => setSelectedStudent(null)}
                                    >
                                        Change
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {selectedStudent && (
                <>
                    {/* Tabs for Payment Options */}
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid grid-cols-2 w-full max-w-md">
                            <TabsTrigger value="quick">Quick Payment</TabsTrigger>
                            <TabsTrigger value="receive">Detailed Payment</TabsTrigger>
                        </TabsList>

                        <TabsContent value="quick" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Quick Payment</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium mb-2">
                                                    Amount (BDT) *
                                                </label>
                                                <div className="relative">
                                                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        className="pl-10"
                                                        placeholder="0.00"
                                                        value={quickPayment.amount}
                                                        onChange={(e) => setQuickPayment({ ...quickPayment, amount: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-2">
                                                    Payment Method *
                                                </label>
                                                <Select
                                                    value={quickPayment.method}
                                                    onValueChange={(value) => setQuickPayment({ ...quickPayment, method: value })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select method" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {PAYMENT_METHODS.map((option) => (
                                                            <SelectItem key={option.value} value={option.value}>
                                                                {option.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-2">
                                                    Reference
                                                </label>
                                                <Input
                                                    placeholder="Optional reference"
                                                    value={quickPayment.reference}
                                                    onChange={(e) => setQuickPayment({ ...quickPayment, reference: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2">
                                                Notes
                                            </label>
                                            <Textarea
                                                placeholder="Additional notes..."
                                                rows={2}
                                                value={quickPayment.notes}
                                                onChange={(e) => setQuickPayment({ ...quickPayment, notes: e.target.value })}
                                            />
                                        </div>
                                        <div className="border-t pt-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="text-lg font-semibold">Total Amount</div>
                                                    <div className="text-2xl font-bold text-green-600">
                                                        {formatCurrency(parseFloat(quickPayment.amount) || 0)}
                                                    </div>
                                                </div>
                                                <Button
                                                    onClick={handleQuickPayment}
                                                    disabled={isProcessing || !quickPayment.amount}
                                                    size="lg"
                                                >
                                                    {isProcessing ? (
                                                        <>
                                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                            Processing...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <CreditCard className="mr-2 h-4 w-4" />
                                                            Receive Payment
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="receive">
                            <PaymentForm
                                studentId={selectedStudent._id}
                                onSuccess={(result) => {
                                    toast({
                                        title: 'Success',
                                        description: 'Payment received successfully',
                                        variant: 'success',
                                    })
                                    refetchPayments()
                                }}
                            />
                        </TabsContent>
                    </Tabs>

                    {/* Recent Payments */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Recent Payments</CardTitle>
                                <Button variant="ghost" size="sm" onClick={refetchPayments}>
                                    <History className="mr-2 h-4 w-4" />
                                    Refresh
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {recentPayments?.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Method</TableHead>
                                                <TableHead>Amount</TableHead>
                                                <TableHead>Reference</TableHead>
                                                <TableHead>Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {recentPayments.map((payment) => (
                                                <TableRow key={payment._id}>
                                                    <TableCell>
                                                        <div className="flex items-center">
                                                            <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                                                            {formatDate(payment.createdAt)}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">
                                                            {payment.method}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="font-semibold text-green-600">
                                                        {formatCurrency(payment.amount)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="text-sm text-gray-500">
                                                            {payment.reference || 'N/A'}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge className="bg-green-100 text-green-800">
                                                            <CheckCircle className="mr-1 h-3 w-3" />
                                                            {payment.status}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-4 text-lg font-semibold">No recent payments</h3>
                                    <p className="text-gray-500">No payment history found for this student</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-green-600">
                                        {formatCurrency(
                                            recentPayments?.reduce((sum, p) => sum + p.amount, 0) || 0
                                        )}
                                    </div>
                                    <div className="text-sm text-gray-500">Total Paid (Recent)</div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-600">
                                        {recentPayments?.length || 0}
                                    </div>
                                    <div className="text-sm text-gray-500">Total Transactions</div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-purple-600">
                                        {recentPayments?.length > 0
                                            ? formatCurrency(
                                                recentPayments.reduce((sum, p) => sum + p.amount, 0) / recentPayments.length
                                            )
                                            : formatCurrency(0)
                                        }
                                    </div>
                                    <div className="text-sm text-gray-500">Average Payment</div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}

            {/* Help/Info Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <AlertCircle className="mr-2 h-5 w-5 text-blue-600" />
                        Payment Guidelines
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <div className="flex items-start space-x-3">
                            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <div className="font-medium">Always verify student identity</div>
                                <div className="text-sm text-gray-600">
                                    Confirm student details before accepting payment
                                </div>
                            </div>
                        </div>
                        <div className="flex items-start space-x-3">
                            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <div className="font-medium">Provide receipt for every payment</div>
                                <div className="text-sm text-gray-600">
                                    Ensure students receive payment confirmation
                                </div>
                            </div>
                        </div>
                        <div className="flex items-start space-x-3">
                            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <div className="font-medium">Record all payment details</div>
                                <div className="text-sm text-gray-600">
                                    Include reference numbers and notes for tracking
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default ReceivePayment

// src/components/payments/PaymentForm.jsx

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useReceivePaymentMutation } from '@/features/apis/finance/paymentApi'
import { useAdvancedStudentSearchQuery } from '@/features/apis/studentsApi'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency } from '@/lib/formaters'
import { paymentSchema } from '@/lib/validators'
import { BANK_OPTIONS, MOBILE_OPERATORS, PAYMENT_METHODS, SESSION_OPTIONS } from '@/utils/constants'
import { zodResolver } from '@hookform/resolvers/zod'
import { Search, User, X } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Label } from '../ui/label'

const PaymentForm = ({ studentId: propStudentId, onSuccess }) => {
  const [method, setMethod] = useState('cash')
  const [studentSearch, setStudentSearch] = useState('')
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [showStudentSearch, setShowStudentSearch] = useState(false)

  const { data: searchResults } = useAdvancedStudentSearchQuery(studentSearch, {
    skip: studentSearch.length < 2,
  })

  const [receivePayment, { isLoading }] = useReceivePaymentMutation()
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      session: SESSION_OPTIONS[1].value,
      method: 'cash',
    },
  })

  const amount = watch('amount') || 0

  const handleStudentSelect = (student) => {
    setSelectedStudent(student)
    setValue('studentId', student._id)
    setShowStudentSearch(false)
    setStudentSearch('')
  }

  const onSubmit = async (data) => {
    try {
      const result = await receivePayment(data).unwrap()
      toast({
        title: 'Success',
        description: 'Payment received successfully',
        variant: 'success',
      })
      onSuccess?.(result)
      reset()
      setSelectedStudent(null)
    } catch (error) {
      toast({
        title: 'Error',
        description: error.data?.message || 'Failed to receive payment',
        variant: 'destructive',
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Receive Payment</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Student Selection */}
          <div>
            <Label htmlFor="student">Student *</Label>
            {selectedStudent ? (
              <div className="flex items-center justify-between p-3 border rounded-md bg-gray-50">
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
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSelectedStudent(null)
                    setValue('studentId', '')
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="relative">
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search student by name or roll number..."
                      className="pl-10"
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      onFocus={() => setShowStudentSearch(true)}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowStudentSearch(true)}
                  >
                    Browse
                  </Button>
                </div>
                
                {showStudentSearch && searchResults && (
                  <div className="absolute z-50 mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
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
              </div>
            )}
            {errors.studentId && (
              <p className="text-sm text-red-500 mt-1">{errors.studentId.message}</p>
            )}
          </div>

          {/* Payment Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="amount">Amount (BDT) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  {...register('amount', { valueAsNumber: true })}
                  placeholder="0.00"
                />
                {errors.amount && (
                  <p className="text-sm text-red-500">{errors.amount.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="method">Payment Method *</Label>
                <Select
                  onValueChange={(value) => {
                    setMethod(value)
                    setValue('method', value)
                  }}
                  defaultValue="cash"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="session">Academic Session</Label>
                <Select
                  onValueChange={(value) => setValue('session', value)}
                  defaultValue={SESSION_OPTIONS[1].value}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select session" />
                  </SelectTrigger>
                  <SelectContent>
                    {SESSION_OPTIONS.map((session) => (
                      <SelectItem key={session.value} value={session.value}>
                        {session.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Method-specific details */}
            <div className="space-y-4">
              {method === 'bank_transfer' && (
                <>
                  <div>
                    <Label htmlFor="bankName">Bank Name</Label>
                    <Select
                      onValueChange={(value) => setValue('methodDetails.bankName', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select bank" />
                      </SelectTrigger>
                      <SelectContent>
                        {BANK_OPTIONS.map((bank) => (
                          <SelectItem key={bank.value} value={bank.value}>
                            {bank.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="accountNumber">Account Number</Label>
                    <Input
                      id="accountNumber"
                      {...register('methodDetails.accountNumber')}
                      placeholder="Account number"
                    />
                  </div>
                </>
              )}

              {method === 'check' && (
                <div>
                  <Label htmlFor="checkNumber">Check Number</Label>
                  <Input
                    id="checkNumber"
                    {...register('methodDetails.checkNumber')}
                    placeholder="Check number"
                  />
                </div>
              )}

              {method === 'mobile_banking' && (
                <>
                  <div>
                    <Label htmlFor="mobileOperator">Mobile Operator</Label>
                    <Select
                      onValueChange={(value) => setValue('methodDetails.mobileOperator', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select operator" />
                      </SelectTrigger>
                      <SelectContent>
                        {MOBILE_OPERATORS.map((operator) => (
                          <SelectItem key={operator.value} value={operator.value}>
                            {operator.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="transactionId">Transaction ID</Label>
                    <Input
                      id="transactionId"
                      {...register('methodDetails.transactionId')}
                      placeholder="Transaction ID"
                    />
                  </div>
                </>
              )}

              {method === 'card' && (
                <div>
                  <Label htmlFor="cardLastFour">Card Last 4 Digits</Label>
                  <Input
                    id="cardLastFour"
                    {...register('methodDetails.cardLastFour')}
                    placeholder="Last 4 digits"
                    maxLength={4}
                  />
                </div>
              )}

              <div>
                <Label htmlFor="reference">Reference Number</Label>
                <Input
                  id="reference"
                  {...register('reference')}
                  placeholder="Optional reference"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Additional notes about this payment..."
              rows={2}
            />
          </div>

          {/* Summary and Submit */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-6">
              <div className="text-lg font-semibold">Total Amount</div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(amount)}
              </div>
            </div>
            
            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={() => {
                reset()
                setSelectedStudent(null)
              }}>
                Clear
              </Button>
              <Button type="submit" disabled={isLoading || !selectedStudent}>
                {isLoading ? 'Processing...' : 'Receive Payment'}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default PaymentForm