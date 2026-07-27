// src/pages/Refunds/ProcessRefund.jsx
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { useGetPaymentHistoryQuery } from '@/features/apis/finance/paymentApi'
import { useProcessRefundMutation, useValidateRefundQuery } from '@/features/apis/finance/refundApi'
import { useToast } from '@/hooks/use-toast'
import { useStudentSearch } from '@/hooks/useStudentSearch'
import { formatCurrency, formatDate } from '@/lib/formaters'
import {
  AlertCircle,
  ArrowLeftRight,
  Calendar,
  CheckCircle,
  CreditCard,
  Download,
  Eye,
  Search,
  User
} from 'lucide-react'
import { useState } from 'react'
const ProcessRefund = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [refundAmount, setRefundAmount] = useState('')
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [showPaymentDetails, setShowPaymentDetails] = useState(false)

  const { toast } = useToast()

  // const { data: searchResults } = useAdvancedStudentSearchQuery(searchTerm, {
  //   skip: searchTerm.length < 2,
  // })

  const {
    results: searchResults,
    isLoading: searchLoading
  } = useStudentSearch(searchTerm, {
    fields: 'name,rollNumber,religion',
    limit: 10,
  })

  const { data: payments } = useGetPaymentHistoryQuery(
    selectedStudent ? { studentId: selectedStudent._id } : null,
    { skip: !selectedStudent }
  )

  const { data: validation } = useValidateRefundQuery(
    selectedPayment ? { paymentId: selectedPayment._id, amount: parseFloat(refundAmount) || 0 } : null,
    { skip: !selectedPayment || !refundAmount }
  )

  const [processRefund, { isLoading: isProcessing }] = useProcessRefundMutation()

  const handleStudentSelect = (student) => {
    setSelectedStudent(student)
    setSelectedPayment(null)
    setRefundAmount('')
    setReason('')
    setDescription('')
  }

  const handlePaymentSelect = (payment) => {
    setSelectedPayment(payment)
    setRefundAmount('')
  }

  const handleProcessRefund = async () => {
    if (!selectedPayment || !refundAmount || !reason) {
      toast({
        title: 'Error',
        description: 'Please fill all required fields',
        variant: 'destructive',
      })
      return
    }

    try {
      const result = await processRefund({
        paymentId: selectedPayment._id,
        amount: parseFloat(refundAmount),
        reason,
        description,
      }).unwrap()

      toast({
        title: 'Success',
        description: 'Refund processed successfully',
        variant: 'success',
      })

      // Reset form
      setSelectedPayment(null)
      setRefundAmount('')
      setReason('')
      setDescription('')
    } catch (error) {
      toast({
        title: 'Error',
        description: error.data?.message || 'Failed to process refund',
        variant: 'destructive',
      })
    }
  }

  const maxRefundable = selectedPayment ? selectedPayment.amount - (selectedPayment.refundedAmount || 0) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Process Refund</h1>
          <p className="text-muted-foreground">
            Process refunds for student payments
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Student Selection */}
      <Card>
        <CardHeader>
          <CardTitle>1. Select Student</CardTitle>
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
                    onClick={() => {
                      setSelectedStudent(null)
                      setSelectedPayment(null)
                    }}
                  >
                    Change
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment Selection */}
      {selectedStudent && (
        <Card>
          <CardHeader>
            <CardTitle>2. Select Payment to Refund</CardTitle>
          </CardHeader>
          <CardContent>
            {payments?.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Refunded</TableHead>
                      <TableHead>Refundable</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow
                        key={payment._id}
                        className={`cursor-pointer ${selectedPayment?._id === payment._id
                          ? 'bg-primary/5'
                          : 'hover:bg-gray-50'
                          }`}
                        onClick={() => handlePaymentSelect(payment)}
                      >
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
                        <TableCell className="font-semibold">
                          {formatCurrency(payment.amount)}
                        </TableCell>
                        <TableCell>
                          <div className="text-red-600">
                            {formatCurrency(payment.refundedAmount || 0)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-green-600 font-medium">
                            {formatCurrency(payment.amount - (payment.refundedAmount || 0))}
                          </div>
                        </TableCell>
                        <TableCell>
                          {payment.status === 'reversed' ? (
                            <Badge className="bg-gray-100 text-gray-800">
                              Reversed
                            </Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-800">
                              {payment.status}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation()
                                setShowPaymentDetails(true)
                              }}
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
            ) : (
              <div className="text-center py-8">
                <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-semibold">No payments found</h3>
                <p className="text-gray-500">This student has no payment history</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Refund Details */}
      {selectedPayment && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>3. Refund Details</CardTitle>
              <div className="text-sm text-gray-500">
                Max refundable: {formatCurrency(maxRefundable)}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Selected Payment Info */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Payment Date</div>
                    <div className="font-medium">{formatDate(selectedPayment.createdAt)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Amount</div>
                    <div className="font-medium text-green-600">
                      {formatCurrency(selectedPayment.amount)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Method</div>
                    <div className="font-medium">{selectedPayment.method}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Already Refunded</div>
                    <div className="font-medium text-red-600">
                      {formatCurrency(selectedPayment.refundedAmount || 0)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Refund Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Refund Amount (BDT) *
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Enter amount to refund"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      max={maxRefundable}
                    />
                    <div className="flex justify-between mt-1">
                      <div className="text-xs text-gray-500">
                        Enter amount between 0 and {formatCurrency(maxRefundable)}
                      </div>
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        onClick={() => setRefundAmount(maxRefundable.toString())}
                      >
                        Full amount
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Reason for Refund *
                    </label>
                    <Select value={reason} onValueChange={setReason}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select reason" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="duplicate_payment">Duplicate Payment</SelectItem>
                        <SelectItem value="overpayment">Overpayment</SelectItem>
                        <SelectItem value="cancelled_admission">Cancelled Admission</SelectItem>
                        <SelectItem value="fee_reduction">Fee Reduction</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Description (Optional)
                    </label>
                    <Textarea
                      placeholder="Additional details about this refund..."
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  {/* Validation Messages */}
                  {validation && (
                    <div className={`p-3 rounded-lg ${validation.valid
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-red-50 border border-red-200'
                      }`}>
                      <div className="flex items-center">
                        {validation.valid ? (
                          <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                        )}
                        <div>
                          <div className={`font-medium ${validation.valid ? 'text-green-800' : 'text-red-800'
                            }`}>
                            {validation.valid ? 'Refund Valid' : 'Refund Invalid'}
                          </div>
                          <div className={`text-sm ${validation.valid ? 'text-green-600' : 'text-red-600'
                            }`}>
                            {validation.valid
                              ? `You can refund up to ${formatCurrency(validation.refundableAmount)}`
                              : validation.reason
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-between">
                  <div className="text-lg font-semibold">
                    Refund Amount: {formatCurrency(parseFloat(refundAmount) || 0)}
                  </div>
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedPayment(null)
                        setRefundAmount('')
                        setReason('')
                        setDescription('')
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleProcessRefund}
                      disabled={isProcessing || !validation?.valid || !refundAmount || !reason}
                    >
                      {isProcessing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <ArrowLeftRight className="mr-2 h-4 w-4" />
                          Process Refund
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Details Dialog */}
      <Dialog open={showPaymentDetails} onOpenChange={setShowPaymentDetails}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(selectedPayment.amount)}
                </div>
                <div className="text-sm text-gray-500">
                  Payment #{selectedPayment._id}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Student</label>
                  <p className="font-medium">{selectedStudent?.name}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Date & Time</label>
                  <p className="font-medium">{formatDate(selectedPayment.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Payment Method</label>
                  <p className="font-medium">{selectedPayment.method}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Status</label>
                  <Badge className={
                    selectedPayment.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }>
                    {selectedPayment.status}
                  </Badge>
                </div>
              </div>

              {selectedPayment.reference && (
                <div>
                  <label className="text-sm text-gray-500">Reference</label>
                  <p className="font-medium">{selectedPayment.reference}</p>
                </div>
              )}

              {selectedPayment.notes && (
                <div>
                  <label className="text-sm text-gray-500">Notes</label>
                  <p className="text-gray-600">{selectedPayment.notes}</p>
                </div>
              )}

              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Refund History</h4>
                {selectedPayment.refundedAmount > 0 ? (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Refunded:</span>
                      <span className="font-medium text-red-600">
                        {formatCurrency(selectedPayment.refundedAmount)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {selectedPayment.isFullyRefunded ? 'Payment fully refunded' : 'Partial refund processed'}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">No refunds processed for this payment</div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ProcessRefund