// src/pages/Payments/AdvanceBalance.jsx - SIMPLE WORKING VERSION
import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  useGetStudentFeesQuery,
  useGetCurrentSessionQuery
} from '@/features/apis/finance/feeApi'
import {
  useAutoApplyAdvanceMutation,
  useGetAdvanceBalanceQuery,
  useUseAdvanceBalanceMutation
} from '@/features/apis/finance/paymentApi'
import { useLazySearchStudentsLazyQuery } from '@/features/apis/studentsApi' // Changed this
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
  User,
  AlertCircle,
  Loader2,
  CheckCircle,
  Info
} from 'lucide-react'

const AdvanceBalance = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [showTransactions, setShowTransactions] = useState(false)
  const [showUseAdvance, setShowUseAdvance] = useState(false)
  const [selectedFee, setSelectedFee] = useState(null)
  const [useAmount, setUseAmount] = useState('')

  const { toast } = useToast()

  // Get current session
  const { data: sessionData } = useGetCurrentSessionQuery()

  // SIMPLE STUDENT SEARCH - using lazy query
  const [searchStudents, { data: searchData, isLoading: searchLoading }] = useLazySearchStudentsLazyQuery()

  // console.log("searchStudents:", searchData)
  // Auto-search when typing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.length >= 2) {
        searchStudents({
          search: searchTerm,
          limit: 10,
          fields: 'name,rollNumber,class,session'
        })
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm, searchStudents])

  const searchResults = searchData?.students || []

  // Advance balance
  const {
    data: advanceBalanceData,
    isLoading: balanceLoading,
    refetch: refetchAdvance,
    error: balanceError
  } = useGetAdvanceBalanceQuery(
    selectedStudent?._id,
    {
      skip: !selectedStudent,
      refetchOnMountOrArgChange: true
    }
  )

  // Student fees
  const {
    data: studentFeesData,
    isLoading: feesLoading,
    refetch: refetchFees
  } = useGetStudentFeesQuery(
    selectedStudent ? {
      studentId: selectedStudent._id,
      session: sessionData?.data?.currentSession
    } : null,
    { skip: !selectedStudent }
  )

  // Mutations
  const [autoApplyAdvance, { isLoading: isAutoApplying }] = useAutoApplyAdvanceMutation()
  const [useAdvanceBalance, { isLoading: isUsingAdvance }] = useUseAdvanceBalanceMutation()

  // Process data
  const advanceBalance = advanceBalanceData?.data || {
    amount: 0,
    currency: 'BDT',
    lastUpdated: new Date(),
    transactions: []
  }

  const studentFees = studentFeesData?.data || []
  const outstandingFees = studentFees.filter(fee => fee.dueAmount > 0)
  const totalDueAmount = outstandingFees.reduce((sum, fee) => sum + fee.dueAmount, 0)
  const canAutoApply = advanceBalance.amount > 0 && totalDueAmount > 0

  const handleStudentSelect = (student) => {
    console.log('Selected student:', student)
    setSelectedStudent(student)
    setSearchTerm('')
  }

  const handleAutoApply = async () => {
    if (!selectedStudent) return

    const confirmed = window.confirm(
      `Apply ${formatCurrency(advanceBalance.amount)} advance balance to ${outstandingFees.length} outstanding fees?`
    )

    if (!confirmed) return

    try {
      const result = await autoApplyAdvance({
        studentId: selectedStudent._id,
      }).unwrap()

      toast({
        title: 'Success',
        description: `Advance balance applied to ${result.appliedFees?.length || 0} fees. Total: ${formatCurrency(result.totalApplied || 0)}`,
        variant: 'success',
      })

      refetchAdvance()
      refetchFees()
    } catch (error) {
      console.error('Auto apply error:', error)
      toast({
        title: 'Error',
        description: error.data?.message || 'Failed to apply advance balance',
        variant: 'destructive',
      })
    }
  }

  const handleUseAdvance = async () => {
    if (!selectedStudent || !selectedFee || !useAmount) return

    const amount = parseFloat(useAmount)
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Error',
        description: 'Please enter a valid amount',
        variant: 'destructive',
      })
      return
    }

    if (amount > advanceBalance.amount) {
      toast({
        title: 'Error',
        description: `Insufficient advance balance. Available: ${formatCurrency(advanceBalance.amount)}`,
        variant: 'destructive',
      })
      return
    }

    if (amount > selectedFee.dueAmount) {
      toast({
        title: 'Error',
        description: `Amount exceeds fee due amount of ${formatCurrency(selectedFee.dueAmount)}`,
        variant: 'destructive',
      })
      return
    }

    const confirmed = window.confirm(
      `Use ${formatCurrency(amount)} from advance balance for "${selectedFee.feeTemplate?.title}" fee?`
    )

    if (!confirmed) return

    try {
      const result = await useAdvanceBalance({
        studentId: selectedStudent._id,
        feeInstanceId: selectedFee._id,
        amount: amount,
      }).unwrap()

      toast({
        title: 'Success',
        description: `Used ${formatCurrency(amount)} from advance balance successfully`,
        variant: 'success',
      })

      // Refresh data
      refetchAdvance()
      refetchFees()

      // Reset
      setShowUseAdvance(false)
      setSelectedFee(null)
      setUseAmount('')
    } catch (error) {
      console.error('Use advance error:', error)
      toast({
        title: 'Error',
        description: error.data?.message || 'Failed to use advance balance',
        variant: 'destructive',
      })
    }
  }

  const openUseAdvanceDialog = (fee) => {
    setSelectedFee(fee)
    setUseAmount(Math.min(fee.dueAmount, advanceBalance.amount).toString())
    setShowUseAdvance(true)
  }

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

      {/* DEBUG: Show current state */}
      {/* <div className="p-3 bg-gray-100 rounded text-xs font-mono">
        <div>Search Term: "{searchTerm}"</div>
        <div>Selected Student: {selectedStudent ? `${selectedStudent.name} (${selectedStudent._id})` : 'null'}</div>
        <div>Search Results Count: {searchResults.length}</div>
        <div>Advance Balance: {formatCurrency(advanceBalance.amount)}</div>
        <div>Outstanding Fees: {outstandingFees.length}</div>
      </div> */}

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
              />
            </div>

            {searchLoading && (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            )}

            {searchResults.length > 0 && searchTerm.length >= 2 && (
              <div className="border rounded-md max-h-60 overflow-auto">
                {searchResults.map((student) => (
                  <div
                    key={student._id}
                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 transition-colors"
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

            {searchResults.length === 0 && searchTerm.length >= 2 && !searchLoading && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  No students found matching "{searchTerm}"
                </AlertDescription>
              </Alert>
            )}

            {selectedStudent && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  Selected: <strong>{selectedStudent.name}</strong> (Roll: {selectedStudent.rollNumber})
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2 h-6 px-2"
                    onClick={() => setSelectedStudent(null)}
                  >
                    Change
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Selected Student Section */}
      {selectedStudent ? (
        <>
          {/* Loading States */}
          {(balanceLoading || feesLoading) && (
            <Card>
              <CardContent className="py-12">
                <div className="flex flex-col items-center justify-center">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                  <p className="text-gray-500">Loading student data...</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error State */}
          {balanceError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to load advance balance: {balanceError.data?.message || 'Unknown error'}
              </AlertDescription>
            </Alert>
          )}

          {/* Stats Cards */}
          {!balanceLoading && !feesLoading && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Advance Balance</CardTitle>
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${advanceBalance.amount > 0 ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                      <DollarSign className={`h-5 w-5 ${advanceBalance.amount > 0 ? 'text-green-600' : 'text-gray-400'
                        }`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-3xl font-bold ${advanceBalance.amount > 0 ? 'text-green-600' : 'text-gray-400'
                      }`}>
                      {formatCurrency(advanceBalance.amount)}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {advanceBalance.amount > 0
                        ? 'Available for fee payments'
                        : 'No advance balance'
                      }
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2"
                      onClick={() => setShowTransactions(true)}
                    >
                      <History className="h-3 w-3 mr-1" />
                      View Transactions ({advanceBalance.transactions?.length || 0})
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Due</CardTitle>
                    <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                      <TrendingDown className="h-5 w-5 text-red-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-red-600">
                      {formatCurrency(totalDueAmount)}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Across {outstandingFees.length} outstanding fee(s)
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Can Cover</CardTitle>
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600">
                      {formatCurrency(Math.min(advanceBalance.amount, totalDueAmount))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {totalDueAmount > 0 ? (
                        <span>
                          {Math.round((Math.min(advanceBalance.amount, totalDueAmount) / totalDueAmount) * 100)}% of due amount
                        </span>
                      ) : (
                        'No due fees'
                      )}
                    </p>
                    {canAutoApply && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={handleAutoApply}
                        disabled={isAutoApplying}
                      >
                        {isAutoApplying ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Applying...
                          </>
                        ) : (
                          <>
                            <ArrowRightLeft className="h-3 w-3 mr-1" />
                            Auto Apply
                          </>
                        )}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Outstanding Fees */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Outstanding Fees</CardTitle>
                    <div className="text-sm text-gray-500">
                      {outstandingFees.length} fees with due amount
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {outstandingFees.length > 0 ? (
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
                          {outstandingFees.map((fee) => (
                            <TableRow key={fee._id} className="hover:bg-gray-50">
                              <TableCell>
                                <div className="font-medium">{fee.feeTemplate?.title || 'Unknown Fee'}</div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  {formatDate(fee.dueDate)}
                                  {new Date(fee.dueDate) < new Date() && (
                                    <Badge className="ml-2 bg-red-100 text-red-800 text-xs">
                                      Overdue
                                    </Badge>
                                  )}
                                </div>
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
                                <Badge className={
                                  fee.status === 'overdue'
                                    ? 'bg-red-100 text-red-800'
                                    : fee.status === 'partial'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-blue-100 text-blue-800'
                                }>
                                  {fee.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openUseAdvanceDialog(fee)}
                                    disabled={advanceBalance.amount <= 0}
                                    className="min-w-[120px]"
                                  >
                                    {advanceBalance.amount <= 0 ? (
                                      'No Advance'
                                    ) : (
                                      <>
                                        Use Advance
                                        <Badge className="ml-2 bg-green-100 text-green-800">
                                          Max: {formatCurrency(Math.min(fee.dueAmount, advanceBalance.amount))}
                                        </Badge>
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <CheckCircle className="mx-auto h-12 w-12 text-green-400" />
                      <h3 className="mt-4 text-lg font-semibold">No outstanding fees</h3>
                      <p className="text-gray-500">All fees are paid or waived</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </>
      ) : (
        /* No Student Selected State */
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <User className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-semibold">No student selected</h3>
              <p className="text-gray-500">
                Search for a student above to view their advance balance and fees
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Use Advance Dialog */}
      <Dialog open={showUseAdvance} onOpenChange={setShowUseAdvance}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Use Advance Balance</DialogTitle>
          </DialogHeader>
          {selectedFee && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="font-medium">{selectedFee.feeTemplate?.title}</div>
                <div className="text-sm text-gray-500">
                  Due: {formatDate(selectedFee.dueDate)} • Amount: {formatCurrency(selectedFee.dueAmount)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Amount to Use (Max: {formatCurrency(Math.min(selectedFee.dueAmount, advanceBalance.amount))})
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={useAmount}
                  onChange={(e) => setUseAmount(e.target.value)}
                  placeholder="Enter amount"
                />
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Available Advance:</span>
                  <span className="font-semibold">{formatCurrency(advanceBalance.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Fee Due Amount:</span>
                  <span className="font-semibold">{formatCurrency(selectedFee.dueAmount)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span>Remaining After Use:</span>
                  <span className="font-semibold">
                    {formatCurrency(advanceBalance.amount - parseFloat(useAmount || 0))}
                  </span>
                </div>
              </div>

              <div className="border-t pt-4 flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowUseAdvance(false)
                    setSelectedFee(null)
                    setUseAmount('')
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUseAdvance}
                  disabled={isUsingAdvance || !useAmount || parseFloat(useAmount) <= 0}
                >
                  {isUsingAdvance ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Use Advance'
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Transactions Dialog */}
      <Dialog open={showTransactions} onOpenChange={setShowTransactions}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Advance Balance Transactions</DialogTitle>
          </DialogHeader>
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
                  {advanceBalance.lastUpdated ? formatDate(advanceBalance.lastUpdated) : 'Never'}
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
                      {[...(advanceBalance.transactions || [])]
                        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                        .map((transaction, index) => (
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
                              <div className="text-sm max-w-xs truncate">
                                {transaction.description}
                              </div>
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
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AdvanceBalance

// // src/pages/Payments/AdvanceBalance.jsx
// import { Badge } from '@/components/ui/badge'
// import { Button } from '@/components/ui/button'
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
// import { Input } from '@/components/ui/input'
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
// import { useGetStudentFeesQuery } from '@/features/apis/finance/feeApi'
// import { useAutoApplyAdvanceMutation, useGetAdvanceBalanceQuery, useUseAdvanceBalanceMutation } from '@/features/apis/finance/paymentApi'
// import { useGetStudentsByIdQuery, useAdvancedStudentSearchQuery } from '@/features/apis/studentsApi'
// import { useToast } from '@/hooks/use-toast'
// import { formatCurrency, formatDate } from '@/lib/formaters'
// import {
//   ArrowRightLeft,
//   DollarSign,
//   Download,
//   History,
//   Search,
//   TrendingDown,
//   TrendingUp,
//   User
// } from 'lucide-react'
// import { useState } from 'react'

// const AdvanceBalance = () => {
//   const [searchTerm, setSearchTerm] = useState('')
//   const [selectedStudent, setSelectedStudent] = useState(null)
//   const [showTransactions, setShowTransactions] = useState(false)
//   const [showUseAdvance, setShowUseAdvance] = useState(false)
//   const [useAmount, setUseAmount] = useState('')

//   const { toast } = useToast()

//   const { data: searchResults } = useAdvancedStudentSearchQuery(searchTerm, {
//     skip: searchTerm.length < 2,
//   })

//   const { data: student } = useGetStudentsByIdQuery(selectedStudent?._id, {
//     skip: !selectedStudent,
//   })

//   const { data: advanceBalance, refetch: refetchAdvance } = useGetAdvanceBalanceQuery(
//     selectedStudent?._id,
//     { skip: !selectedStudent }
//   )

//   const { data: studentFees } = useGetStudentFeesQuery(
//     selectedStudent ? { studentId: selectedStudent._id } : null,
//     { skip: !selectedStudent }
//   )

//   console.log('advanceBalance', advanceBalance);
//   console.log('studentFees', studentFees);
//   console.log('search reasult', searchResults);
//   const [autoApplyAdvance, { isLoading: isAutoApplying }] = useAutoApplyAdvanceMutation()

//   // Inside component:
//   const [useAdvanceBalance, { isLoading: isUsingAdvance }] = useUseAdvanceBalanceMutation();

//   const handleStudentSelect = (student) => {
//     setSelectedStudent(student)
//   }

//   const handleAutoApply = async () => {
//     if (!selectedStudent) return

//     try {
//       const result = await autoApplyAdvance({
//         studentId: selectedStudent._id,
//       }).unwrap()

//       toast({
//         title: 'Success',
//         description: `Advance balance applied to ${result.appliedFees.length} fees`,
//         variant: 'success',
//       })

//       refetchAdvance()
//     } catch (error) {
//       toast({
//         title: 'Error',
//         description: error.data?.message || 'Failed to apply advance balance',
//         variant: 'destructive',
//       })
//     }
//   }

//   const totalDueAmount = studentFees?.reduce((sum, fee) => sum + fee.dueAmount, 0) || 0
//   const canAutoApply = advanceBalance?.amount > 0 && totalDueAmount > 0

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-3xl font-bold tracking-tight">Advance Balance</h1>
//           <p className="text-muted-foreground">
//             Manage student advance/credit balances
//           </p>
//         </div>
//         <div className="flex items-center space-x-2">
//           <Button variant="outline">
//             <Download className="mr-2 h-4 w-4" />
//             Export Report
//           </Button>
//         </div>
//       </div>

//       {/* Student Search */}
//       <Card>
//         <CardHeader>
//           <CardTitle>Search Student</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <div className="space-y-4">
//             <div className="relative">
//               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
//               <Input
//                 placeholder="Search by name or roll number..."
//                 className="pl-10"
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 onFocus={() => {
//                   if (searchTerm.length >= 2 && searchResults) {
//                     // Show search results
//                   }
//                 }}
//               />
//             </div>

//             {searchResults && searchResults.length > 0 && searchTerm.length >= 2 && (
//               <div className="border rounded-md max-h-60 overflow-auto">
//                 {searchResults.map((student) => (
//                   <div
//                     key={student._id}
//                     className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
//                     onClick={() => handleStudentSelect(student)}
//                   >
//                     <div className="font-medium">{student.name}</div>
//                     <div className="text-sm text-gray-500">
//                       Roll: {student.rollNumber} | Class: {student.class?.name}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>
//         </CardContent>
//       </Card>

//       {/* Selected Student Info */}
//       {selectedStudent && (
//         <>
//           <Card>
//             <CardContent className="pt-6">
//               <div className="flex items-center justify-between">
//                 <div className="flex items-center space-x-4">
//                   <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
//                     <User className="h-6 w-6 text-primary" />
//                   </div>
//                   <div>
//                     <h3 className="text-lg font-semibold">{selectedStudent.name}</h3>
//                     <p className="text-gray-500">
//                       Roll: {selectedStudent.rollNumber} | Class: {selectedStudent.class?.name} | Session: {selectedStudent.session}
//                     </p>
//                   </div>
//                 </div>
//                 <div className="flex items-center space-x-3">
//                   <Button
//                     variant="outline"
//                     onClick={() => setShowTransactions(true)}
//                   >
//                     <History className="mr-2 h-4 w-4" />
//                     View Transactions
//                   </Button>
//                   {canAutoApply && (
//                     <Button
//                       variant="outline"
//                       onClick={handleAutoApply}
//                       disabled={isAutoApplying}
//                     >
//                       {isAutoApplying ? (
//                         <>
//                           <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
//                           Applying...
//                         </>
//                       ) : (
//                         <>
//                           <ArrowRightLeft className="mr-2 h-4 w-4" />
//                           Auto Apply
//                         </>
//                       )}
//                     </Button>
//                   )}
//                 </div>
//               </div>
//             </CardContent>
//           </Card>

//           {/* Advance Balance Overview */}
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//             <Card>
//               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                 <CardTitle className="text-sm font-medium">Advance Balance</CardTitle>
//                 <DollarSign className="h-4 w-4 text-green-600" />
//               </CardHeader>
//               <CardContent>
//                 <div className="text-3xl font-bold text-green-600">
//                   {formatCurrency(advanceBalance?.amount || 0)}
//                 </div>
//                 <p className="text-xs text-gray-500">
//                   Available for fee payments
//                 </p>
//               </CardContent>
//             </Card>

//             <Card>
//               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                 <CardTitle className="text-sm font-medium">Total Due</CardTitle>
//                 <TrendingDown className="h-4 w-4 text-red-600" />
//               </CardHeader>
//               <CardContent>
//                 <div className="text-3xl font-bold text-red-600">
//                   {formatCurrency(totalDueAmount)}
//                 </div>
//                 <p className="text-xs text-gray-500">
//                   Across {studentFees?.length || 0} fee(s)
//                 </p>
//               </CardContent>
//             </Card>

//             <Card>
//               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                 <CardTitle className="text-sm font-medium">Can Cover</CardTitle>
//                 <TrendingUp className="h-4 w-4 text-blue-600" />
//               </CardHeader>
//               <CardContent>
//                 <div className="text-3xl font-bold text-blue-600">
//                   {formatCurrency(Math.min(advanceBalance?.amount || 0, totalDueAmount))}
//                 </div>
//                 <p className="text-xs text-gray-500">
//                   {totalDueAmount > 0 ? (
//                     <span>
//                       {Math.round((Math.min(advanceBalance?.amount || 0, totalDueAmount) / totalDueAmount) * 100)}% of due amount
//                     </span>
//                   ) : (
//                     'No due fees'
//                   )}
//                 </p>
//               </CardContent>
//             </Card>
//           </div>

//           {/* Outstanding Fees */}
//           <Card>
//             <CardHeader>
//               <div className="flex items-center justify-between">
//                 <CardTitle>Outstanding Fees</CardTitle>
//                 <div className="text-sm text-gray-500">
//                   {studentFees?.filter(f => f.dueAmount > 0).length || 0} fees with due amount
//                 </div>
//               </div>
//             </CardHeader>
//             <CardContent>
//               {studentFees?.length > 0 ? (
//                 <div className="overflow-x-auto">
//                   <Table>
//                     <TableHeader>
//                       <TableRow>
//                         <TableHead>Fee Title</TableHead>
//                         <TableHead>Due Date</TableHead>
//                         <TableHead>Total Amount</TableHead>
//                         <TableHead>Paid</TableHead>
//                         <TableHead>Due Amount</TableHead>
//                         <TableHead>Status</TableHead>
//                         <TableHead className="text-right">Actions</TableHead>
//                       </TableRow>
//                     </TableHeader>
//                     <TableBody>
//                       {studentFees
//                         .filter(fee => fee.dueAmount > 0)
//                         .map((fee) => (
//                           <TableRow key={fee._id}>
//                             <TableCell>
//                               <div className="font-medium">{fee.feeTemplate?.title}</div>
//                             </TableCell>
//                             <TableCell>
//                               <div className="text-sm">{formatDate(fee.dueDate)}</div>
//                             </TableCell>
//                             <TableCell className="font-medium">
//                               {formatCurrency(fee.totalAmount)}
//                             </TableCell>
//                             <TableCell>
//                               <div className="text-green-600">
//                                 {formatCurrency(fee.paidAmount)}
//                               </div>
//                             </TableCell>
//                             <TableCell>
//                               <div className="font-semibold text-red-600">
//                                 {formatCurrency(fee.dueAmount)}
//                               </div>
//                             </TableCell>
//                             <TableCell>
//                               <Badge className="bg-yellow-100 text-yellow-800">
//                                 Due
//                               </Badge>
//                             </TableCell>
//                             <TableCell className="text-right">
//                               <div className="flex items-center justify-end space-x-2">
//                                 <Button
//                                   variant="outline"
//                                   size="sm"
//                                   onClick={() => {
//                                     setShowUseAdvance(true)
//                                     setUseAmount(Math.min(fee.dueAmount, advanceBalance?.amount || 0).toString())
//                                   }}
//                                   disabled={(advanceBalance?.amount || 0) <= 0}
//                                 >
//                                   Use Advance
//                                 </Button>
//                               </div>
//                             </TableCell>
//                           </TableRow>
//                         ))}
//                     </TableBody>
//                   </Table>
//                 </div>
//               ) : (
//                 <div className="text-center py-8">
//                   <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
//                   <h3 className="mt-4 text-lg font-semibold">No outstanding fees</h3>
//                   <p className="text-gray-500">All fees are paid or waived</p>
//                 </div>
//               )}
//             </CardContent>
//           </Card>
//         </>
//       )}

//       {/* Transaction History Dialog */}
//       <Dialog open={showTransactions} onOpenChange={setShowTransactions}>
//         <DialogContent className="max-w-4xl">
//           <DialogHeader>
//             <DialogTitle>Advance Balance Transactions</DialogTitle>
//           </DialogHeader>
//           {advanceBalance && (
//             <div className="space-y-4">
//               <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
//                 <div>
//                   <div className="text-2xl font-bold text-green-600">
//                     {formatCurrency(advanceBalance.amount)}
//                   </div>
//                   <div className="text-sm text-gray-500">Current Balance</div>
//                 </div>
//                 <div className="text-right">
//                   <div className="text-sm font-medium">Last Updated</div>
//                   <div className="text-sm text-gray-500">
//                     {formatDate(advanceBalance.lastUpdated)}
//                   </div>
//                 </div>
//               </div>

//               <div className="space-y-3">
//                 <h4 className="font-medium">Transaction History</h4>
//                 {advanceBalance.transactions?.length > 0 ? (
//                   <div className="max-h-96 overflow-auto">
//                     <Table>
//                       <TableHeader>
//                         <TableRow>
//                           <TableHead>Date</TableHead>
//                           <TableHead>Type</TableHead>
//                           <TableHead>Description</TableHead>
//                           <TableHead className="text-right">Amount</TableHead>
//                           <TableHead className="text-right">Balance</TableHead>
//                         </TableRow>
//                       </TableHeader>
//                       <TableBody>
//                         {advanceBalance.transactions.map((transaction, index) => (
//                           <TableRow key={index}>
//                             <TableCell>
//                               <div className="text-sm">
//                                 {formatDate(transaction.createdAt)}
//                               </div>
//                             </TableCell>
//                             <TableCell>
//                               <Badge className={
//                                 transaction.type === 'credit'
//                                   ? 'bg-green-100 text-green-800'
//                                   : 'bg-red-100 text-red-800'
//                               }>
//                                 {transaction.type}
//                               </Badge>
//                             </TableCell>
//                             <TableCell>
//                               <div className="text-sm">{transaction.description}</div>
//                             </TableCell>
//                             <TableCell className="text-right">
//                               <div className={
//                                 transaction.type === 'credit'
//                                   ? 'text-green-600 font-medium'
//                                   : 'text-red-600 font-medium'
//                               }>
//                                 {transaction.type === 'credit' ? '+' : '-'}
//                                 {formatCurrency(transaction.amount)}
//                               </div>
//                             </TableCell>
//                             <TableCell className="text-right">
//                               <div className="font-medium">
//                                 {formatCurrency(transaction.newBalance)}
//                               </div>
//                             </TableCell>
//                           </TableRow>
//                         ))}
//                       </TableBody>
//                     </Table>
//                   </div>
//                 ) : (
//                   <div className="text-center py-8">
//                     <History className="mx-auto h-12 w-12 text-gray-400" />
//                     <h3 className="mt-4 text-lg font-semibold">No transactions</h3>
//                     <p className="text-gray-500">No advance balance transactions found</p>
//                   </div>
//                 )}
//               </div>
//             </div>
//           )}
//         </DialogContent>
//       </Dialog>
//     </div>
//   )
// }

// export default AdvanceBalance