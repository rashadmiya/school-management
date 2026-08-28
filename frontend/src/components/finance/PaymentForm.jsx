// src/components/payments/PaymentForm.jsx - ENHANCED VERSION
import {
  useGetAdvanceBalanceQuery,
  useReceivePaymentMutation
} from '@/features/apis/finance/paymentApi'
import { paymentSchema } from '@/lib/validators'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { useGetStudentFeesQuery } from '@/features/apis/finance/feeApi'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency, formatDate } from '@/lib/formaters'
import {
  BANK_OPTIONS,
  MOBILE_OPERATORS,
  PAYMENT_METHODS,
  SESSION_OPTIONS
} from '@/utils/constants'
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  User
} from 'lucide-react'

// Components
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'

const PaymentForm = ({ student, onSuccess }) => {
  const [method, setMethod] = useState('cash')
  const [selectedStudent, setSelectedStudent] = useState(student || null)
  const [allocationMode, setAllocationMode] = useState('auto') // 'auto' or 'manual'
  const [showFeeDetails, setShowFeeDetails] = useState(false)
  const [selectedFees, setSelectedFees] = useState({}) // For manual allocation
  const [paymentAmount, setPaymentAmount] = useState('')

  const { toast } = useToast()

  // Get student's outstanding fees
  const { data: feesData, isLoading: feesLoading } = useGetStudentFeesQuery(
    selectedStudent ? { 
      studentId: selectedStudent._id, 
      status: 'unpaid,partial,overdue' 
    } : null,
    { skip: !selectedStudent }
  )

  // console.log("fees for the student:", feesData)

  const fees = feesData?.data || []
  const totalDue = fees.reduce((sum, fee) => sum + fee.dueAmount, 0)

  // Get advance balance
  const { data: advanceData } = useGetAdvanceBalanceQuery(
    selectedStudent?._id,
    { skip: !selectedStudent }
  )
  const advanceBalance = advanceData?.data?.amount || 0

  const [receivePayment, { isLoading: isProcessing }] = useReceivePaymentMutation()

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

  // Calculate allocation preview
  const calculateAllocationPreview = (paymentAmt) => {
    let remaining = parseFloat(paymentAmt) || 0
    const allocationPreview = []
    let totalAllocated = 0
    let advanceAdded = 0

    // Sort fees by due date (oldest first) - matching backend logic
    const sortedFees = [...fees].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))

    // Auto allocation logic (same as backend)
    if (allocationMode === 'auto') {
      for (const fee of sortedFees) {
        if (remaining <= 0) break

        const maxAllocatable = fee.dueAmount
        const allocateNow = Math.min(maxAllocatable, remaining)

        if (allocateNow <= 0) continue

        allocationPreview.push({
          feeId: fee._id,
          title: fee.feeTemplate?.title || 'Unknown Fee',
          dueDate: fee.dueDate,
          dueAmount: fee.dueAmount,
          allocated: allocateNow,
          status: 'auto'
        })

        remaining -= allocateNow
        totalAllocated += allocateNow
      }

      // Remaining goes to advance balance
      if (remaining > 0) {
        advanceAdded = remaining
      }
    } 
    // Manual allocation
    else {
      const selectedFeeIds = Object.keys(selectedFees).filter(id => selectedFees[id])
      
      for (const feeId of selectedFeeIds) {
        const fee = fees.find(f => f._id === feeId)
        if (!fee || remaining <= 0) continue

        const allocateNow = Math.min(fee.dueAmount, remaining)
        
        allocationPreview.push({
          feeId: fee._id,
          title: fee.feeTemplate?.title || 'Unknown Fee',
          dueDate: fee.dueDate,
          dueAmount: fee.dueAmount,
          allocated: allocateNow,
          status: 'manual'
        })

        remaining -= allocateNow
        totalAllocated += allocateNow
      }

      // Remaining goes to advance balance
      if (remaining > 0) {
        advanceAdded = remaining
      }
    }

    return {
      allocationPreview,
      totalAllocated,
      advanceAdded,
      remainingAfterAllocation: remaining
    }
  }

  const allocationPreview = calculateAllocationPreview(amount)
  const canPayAllFees = amount >= totalDue

  const handleFeeToggle = (feeId, checked) => {
    setSelectedFees(prev => ({
      ...prev,
      [feeId]: checked
    }))
  }

  const handleSelectAllFees = () => {
    const allSelected = fees.length > 0 && Object.keys(selectedFees).length === fees.length
    
    if (allSelected) {
      setSelectedFees({})
    } else {
      const newSelection = {}
      fees.forEach(fee => {
        newSelection[fee._id] = true
      })
      setSelectedFees(newSelection)
    }
  }

  const handleAllocationModeChange = (mode) => {
    setAllocationMode(mode)
    if (mode === 'auto') {
      setSelectedFees({})
    }
  }

  const onSubmit = async (data) => {
    if (!selectedStudent) {
      toast({
        title: 'Error',
        description: 'Please select a student',
        variant: 'destructive',
      })
      return
    }

    if (parseFloat(data.amount) <= 0) {
      toast({
        title: 'Error',
        description: 'Payment amount must be greater than 0',
        variant: 'destructive',
      })
      return
    }

    try {
      const paymentData = {
        ...data,
        studentId: selectedStudent._id,
        methodDetails: data.methodDetails || {},
      }

      // console.log('Submitting payment:', paymentData)
      const result = await receivePayment(paymentData).unwrap()
      
      toast({
        title: 'Success',
        description: `Payment of ${formatCurrency(data.amount)} received successfully`,
        variant: 'success',
      })
      
      onSuccess?.(result)
      reset()
      setSelectedStudent(null)
      setSelectedFees({})
      setPaymentAmount('')
    } catch (error) {
      console.error('Payment error:', error)
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
          {/* Student Info */}
          {selectedStudent && (
            <div className="p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-lg">{selectedStudent.name}</div>
                    <div className="text-sm text-gray-500">
                      Roll: {selectedStudent.rollNumber} | Class: {selectedStudent.class?.name}
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className="text-lg font-semibold">
                  Due: {formatCurrency(totalDue)}
                </Badge>
              </div>
              
              <input
                type="hidden"
                {...register('studentId')}
                value={selectedStudent._id}
              />
            </div>
          )}

          {/* Payment Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="amount">Payment Amount (BDT) *</Label>
                <div className="relative">
                  {/* <span className="w-8 h-8 text-muted-foreground text-lg">৳</span> */}
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    {...register('amount', { valueAsNumber: true })}
                    placeholder="0.00"
                    onChange={(e) => setPaymentAmount(e.target.value)}
                  />
                </div>
                {errors.amount && (
                  <p className="text-sm text-red-500">{errors.amount.message}</p>
                )}
                
                {/* Amount Suggestions */}
                {totalDue > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setValue('amount', totalDue)}
                    >
                      Pay All ({formatCurrency(totalDue)})
                    </Button>
                    {totalDue > 500 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setValue('amount', 500)}
                      >
                        500 BDT
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setValue('amount', 1000)}
                    >
                      1000 BDT
                    </Button>
                  </div>
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

          {/* Fee Allocation Section - ONLY SHOW IF STUDENT HAS FEES */}
          {selectedStudent && fees.length > 0 && amount > 0 && (
            <div className="border rounded-lg p-4 bg-blue-50/50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-800">Payment Allocation Preview</h3>
                </div>
                
                <Tabs value={allocationMode} onValueChange={handleAllocationModeChange} className="w-auto">
                  <TabsList className="grid grid-cols-2 w-64">
                    <TabsTrigger value="auto">Auto Allocate</TabsTrigger>
                    <TabsTrigger value="manual">Manual Select</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Allocation Mode Info */}
              <div className="mb-4">
                {allocationMode === 'auto' ? (
                  <div className="flex items-start space-x-2 p-3 bg-blue-100 rounded">
                    <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-700">
                      Payment will be automatically allocated to oldest due fees first.
                      Any remaining amount will be added to student's advance balance.
                    </p>
                  </div>
                ) : (
                  <div className="flex items-start space-x-2 p-3 bg-amber-100 rounded">
                    <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-700">
                      Select specific fees to allocate payment. Unselected fees will remain unpaid.
                    </p>
                  </div>
                )}
              </div>

              {/* Outstanding Fees Table */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">
                    {fees.length} outstanding fee(s) • Total Due: {formatCurrency(totalDue)}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFeeDetails(!showFeeDetails)}
                  >
                    {showFeeDetails ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-1" />
                        Hide Details
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-1" />
                        Show Details
                      </>
                    )}
                  </Button>
                </div>

                {showFeeDetails && (
                  <div className="overflow-x-auto border rounded">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {allocationMode === 'manual' && (
                            <TableHead className="w-12">
                              <Checkbox
                                checked={fees.length > 0 && Object.keys(selectedFees).length === fees.length}
                                onCheckedChange={handleSelectAllFees}
                              />
                            </TableHead>
                          )}
                          <TableHead>Fee Title</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead className="text-right">Due Amount</TableHead>
                          <TableHead className="text-right">Allocated</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fees
                          .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
                          .map((fee) => {
                            const allocated = allocationPreview.allocationPreview
                              .find(a => a.feeId === fee._id)?.allocated || 0
                            
                            return (
                              <TableRow key={fee._id}>
                                {allocationMode === 'manual' && (
                                  <TableCell>
                                    <Checkbox
                                      checked={!!selectedFees[fee._id]}
                                      onCheckedChange={(checked) => handleFeeToggle(fee._id, checked)}
                                    />
                                  </TableCell>
                                )}
                                <TableCell>
                                  <div className="font-medium">{fee.feeTemplate?.title}</div>
                                  {fee.feeTemplate?.description && (
                                    <div className="text-xs text-gray-500 truncate max-w-xs">
                                      {fee.feeTemplate.description}
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center">
                                    <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                                    <span className="text-sm">{formatDate(fee.dueDate)}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right font-medium text-red-600">
                                  {formatCurrency(fee.dueAmount)}
                                </TableCell>
                                <TableCell className="text-right">
                                  {allocated > 0 ? (
                                    <div className="font-semibold text-green-600">
                                      {formatCurrency(allocated)}
                                    </div>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Badge 
                                    variant="outline"
                                    className={allocated >= fee.dueAmount 
                                      ? "bg-green-100 text-green-800 border-green-200"
                                      : "bg-yellow-100 text-yellow-800 border-yellow-200"
                                    }
                                  >
                                    {allocated >= fee.dueAmount ? 'Will be paid' : 'Partial'}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* Allocation Summary */}
                <div className="p-4 bg-white border rounded-lg space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {formatCurrency(amount)}
                      </div>
                      <div className="text-xs text-gray-500">Payment Amount</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(allocationPreview.totalAllocated)}
                      </div>
                      <div className="text-xs text-gray-500">To Fees</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {formatCurrency(allocationPreview.advanceAdded)}
                      </div>
                      <div className="text-xs text-gray-500">To Advance</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${
                        allocationPreview.remainingAfterAllocation > 0 
                          ? 'text-amber-600' 
                          : 'text-gray-400'
                      }`}>
                        {formatCurrency(allocationPreview.remainingAfterAllocation)}
                      </div>
                      <div className="text-xs text-gray-500">Remaining</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Allocation Progress</span>
                      <span>
                        {((allocationPreview.totalAllocated / Math.max(amount, 1)) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <Progress 
                      value={(allocationPreview.totalAllocated / Math.max(amount, 1)) * 100}
                      className="h-2"
                    />
                  </div>

                  {/* Advance Balance Info */}
                  {allocationPreview.advanceAdded > 0 && (
                    <div className="flex items-start space-x-2 p-3 bg-blue-50 rounded border border-blue-100">
                      <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-800">
                          {formatCurrency(allocationPreview.advanceAdded)} will be added to advance balance
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          New advance balance: {formatCurrency(advanceBalance + allocationPreview.advanceAdded)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Payment Notes</Label>
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
              <div>
                <div className="text-lg font-semibold">Total Payment</div>
                <div className="text-sm text-gray-500">
                  {selectedStudent ? `For ${selectedStudent.name}` : 'Select a student first'}
                </div>
              </div>
              <div className="text-3xl font-bold text-green-600">
                {formatCurrency(amount)}
              </div>
            </div>
            
            {/* Validation Messages */}
            {amount > 0 && totalDue === 0 && (
              <div className="flex items-start space-x-2 p-3 bg-amber-50 rounded border border-amber-100 mb-4">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    Student has no outstanding fees
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    Entire amount will be added to advance balance
                  </p>
                </div>
              </div>
            )}

            {amount > totalDue && totalDue > 0 && (
              <div className="flex items-start space-x-2 p-3 bg-blue-50 rounded border border-blue-100 mb-4">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    Payment exceeds total due amount by {formatCurrency(amount - totalDue)}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Excess will be added to advance balance
                  </p>
                </div>
              </div>
            )}

            {amount < totalDue && totalDue > 0 && (
              <div className="flex items-start space-x-2 p-3 bg-amber-50 rounded border border-amber-100 mb-4">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    Partial payment - {formatCurrency(totalDue - amount)} remaining due
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    Payment will be allocated to selected/oldest fees
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  reset()
                  setSelectedStudent(null)
                  setSelectedFees({})
                  setPaymentAmount('')
                }}
              >
                Clear
              </Button>
              <Button 
                type="submit" 
                disabled={isProcessing || !selectedStudent || amount <= 0}
                className="min-w-[150px]"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Receive Payment
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default PaymentForm