import PaymentForm from '@/components/finance/PaymentForm'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  useGetPaymentHistoryQuery,
  useReceivePaymentMutation,
} from '@/features/apis/finance/paymentApi'
import { useToast } from '@/hooks/use-toast'
import { useStudentSearch } from '@/hooks/useStudentSearch'
import { formatCurrency, formatDate } from '@/lib/formaters'
import { PAYMENT_METHODS, SESSION_OPTIONS } from '@/utils/constants'
import {
  AlertCircle,
  CheckCircle,
  DollarSign,
  History,
  Search,
  User
} from 'lucide-react'
import { useState } from 'react'

const ReceivePayment = () => {
  const { toast } = useToast()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [activeTab, setActiveTab] = useState('quick')

  const [quickPayment, setQuickPayment] = useState({
    amount: '',
    method: 'cash',
    reference: '',
    notes: '',
  })

  const {
    results: searchedStudents,
    isLoading: searchLoading
  } = useStudentSearch(searchTerm, {
    fields: 'name,rollNumber,religion',
    limit: 10,
  })

  // const searchedStudents = searchResults?.students || []

  const { data: recentPaymentsData, refetch: refetchPayments } =
    useGetPaymentHistoryQuery(
      selectedStudent
        ? {
            studentId: selectedStudent?._id,
            session: SESSION_OPTIONS[1].value,
            limit: 5,
          }
        : null,
      { skip: !selectedStudent }
    )

  const recentPayments = recentPaymentsData?.data || []

  const [receivePayment, { isLoading }] =
    useReceivePaymentMutation()

  // ---------------------------
  // Quick payment handler
  // ---------------------------
  const handleQuickPayment = async () => {
    if (!quickPayment.amount || parseFloat(quickPayment.amount) <= 0) {
      toast({
        title: 'Invalid amount',
        variant: 'destructive',
      })
      return
    }

    try {
      await receivePayment({
        studentId: selectedStudent._id,
        amount: Number(quickPayment.amount),
        method: quickPayment.method,
        reference: quickPayment.reference,
        notes: quickPayment.notes,
        session: SESSION_OPTIONS[1].value,
      }).unwrap()

      toast({
        title: 'Payment received',
        variant: 'success',
      })

      setQuickPayment({
        amount: '',
        method: 'cash',
        reference: '',
        notes: '',
      })

      refetchPayments()
    } catch (err) {
      toast({
        title: 'Payment failed',
        description: err?.data?.message,
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* ================= HEADER ================= */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Receive Payment</h1>
          <p className="text-muted-foreground">
            Search and select a student to receive payment
          </p>
        </div>

        <Button variant="outline">
          <History className="mr-2 h-4 w-4" />
          View All Payments
        </Button>
      </div>

      {/* ================= STUDENT SEARCH ================= */}
      <Card>
        <CardHeader>
          <CardTitle>Select Student</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or roll..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {searchedStudents.length > 0 && (
            <div className="max-h-72 overflow-auto space-y-2">
              {searchedStudents.map((student) => (
                <div
                  key={student._id}
                  onClick={() => setSelectedStudent(student)}
                  className="cursor-pointer rounded-lg border p-3 hover:bg-muted transition"
                >
                  <div className="font-medium">{student.name}</div>
                  <div className="text-xs text-muted-foreground">
                    Roll {student.rollNumber} • {student.class?.name}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ================= FULL SCREEN PAYMENT MODAL ================= */}
      <Dialog
        open={!!selectedStudent}
        onOpenChange={() => setSelectedStudent(null)}
      >
        <DialogContent className="max-w-none w-screen h-screen p-0">
          {/* HEADER */}
          <DialogHeader className="border-b px-6 py-4 flex flex-row items-center justify-between">
            <DialogTitle className="flex items-center gap-3">
              <User className="h-5 w-5 text-primary" />
              {selectedStudent?.name}
              <span className="text-sm text-muted-foreground font-normal">
                Roll {selectedStudent?.rollNumber}
              </span>
            </DialogTitle>

            {/* <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedStudent(null)}
            >
              <X className="h-5 w-5" />
            </Button> */}
          </DialogHeader>

          {/* BODY */}
          <div className="p-6 overflow-y-auto space-y-6">
            {/* TABS */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-2 max-w-md">
                <TabsTrigger value="quick">Quick</TabsTrigger>
                <TabsTrigger value="detailed">Detailed</TabsTrigger>
              </TabsList>

              {/* QUICK PAYMENT */}
              <TabsContent value="quick">
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Payment</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium">
                          Amount
                        </label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            className="pl-10 text-lg font-semibold"
                            value={quickPayment.amount}
                            onChange={(e) =>
                              setQuickPayment({
                                ...quickPayment,
                                amount: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium">
                          Method
                        </label>
                        <select
                          className="w-full border rounded-md p-2"
                          value={quickPayment.method}
                          onChange={(e) =>
                            setQuickPayment({
                              ...quickPayment,
                              method: e.target.value,
                            })
                          }
                        >
                          {PAYMENT_METHODS.map((m) => (
                            <option key={m.value} value={m.value}>
                              {m.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-sm font-medium">
                          Reference
                        </label>
                        <Input
                          value={quickPayment.reference}
                          onChange={(e) =>
                            setQuickPayment({
                              ...quickPayment,
                              reference: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    <Textarea
                      placeholder="Notes"
                      value={quickPayment.notes}
                      onChange={(e) =>
                        setQuickPayment({
                          ...quickPayment,
                          notes: e.target.value,
                        })
                      }
                    />

                    <div className="flex items-center justify-between bg-muted rounded-lg p-4">
                      <div>
                        <div className="text-sm text-muted-foreground">
                          Total
                        </div>
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(
                            Number(quickPayment.amount || 0)
                          )}
                        </div>
                      </div>

                      <Button
                        size="lg"
                        onClick={handleQuickPayment}
                        disabled={isLoading}
                      >
                        Receive Payment
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* DETAILED PAYMENT */}
              <TabsContent value="detailed">
                <PaymentForm
                  student={selectedStudent}
                  studentId={selectedStudent?._id}
                  onSuccess={() => {
                    toast({
                      title: 'Payment received',
                      variant: 'success',
                    })
                    refetchPayments()
                  }}
                />
              </TabsContent>
            </Tabs>

            {/* RECENT PAYMENTS */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Payments</CardTitle>
              </CardHeader>
              <CardContent>
                {recentPayments.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentPayments.map((p) => (
                        <TableRow key={p._id}>
                          <TableCell>
                            {formatDate(p.createdAt)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {p.method}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold text-green-600">
                            {formatCurrency(p.amount)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {p.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center text-muted-foreground py-6">
                    No recent payments
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* ================= GUIDELINES ================= */}
      <Card className="bg-muted/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Payment Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Verify student before payment
          </div>
          <div className="flex gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Always issue receipt
          </div>
          <div className="flex gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Record reference & notes
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ReceivePayment

// // src/pages/Payments/ReceivePayment.jsx
// import PaymentForm from '@/components/finance/PaymentForm'
// import { Badge } from '@/components/ui/badge'
// import { Button } from '@/components/ui/button'
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
// import { Input } from '@/components/ui/input'
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
// import { Textarea } from '@/components/ui/textarea'
// import { useGetPaymentHistoryQuery, useReceivePaymentMutation } from '@/features/apis/finance/paymentApi'
// import { useAdvancedStudentSearchQuery } from '@/features/apis/studentsApi'
// import { useToast } from '@/hooks/use-toast'
// import { formatCurrency, formatDate } from '@/lib/formaters'
// import { PAYMENT_METHODS, SESSION_OPTIONS } from '@/utils/constants'
// import {
//     AlertCircle,
//     Calendar,
//     CheckCircle,
//     CreditCard,
//     DollarSign,
//     History,
//     Search,
//     User
// } from 'lucide-react'
// import { useState } from 'react'

// const ReceivePayment = () => {
//     const [searchTerm, setSearchTerm] = useState('')
//     const [selectedStudent, setSelectedStudent] = useState(null)
//     const [activeTab, setActiveTab] = useState('receive')
//     const [quickPayment, setQuickPayment] = useState({
//         amount: '',
//         method: 'cash',
//         reference: '',
//         notes: '',
//     });

//     const [showPaymentDialog, setShowPaymentDialog] = useState(false)


//     const { toast } = useToast()

//     const { data: searchResults } = useAdvancedStudentSearchQuery(searchTerm, {
//         skip: searchTerm.length < 2,
//     });

//     const searchedStudents = searchResults?.students || []
//     // const { data: recentPayments, refetch: refetchPayments } = useGetPaymentHistoryQuery(
//     //     selectedStudent ? { studentId: selectedStudent._id, limit: 5 } : null,
//     //     { skip: !selectedStudent }
//     // );

//     // FIX 1: Update the hook call:
//     const { data: recentPaymentsData, refetch: refetchPayments } = useGetPaymentHistoryQuery(
//         selectedStudent ? {
//             studentId: selectedStudent._id,
//             session: SESSION_OPTIONS[1].value, // Add session
//             limit: 5
//         } : null,
//         { skip: !selectedStudent }
//     )

//     const recentPayments = recentPaymentsData?.data || []

//     const [receivePayment, { isLoading: isProcessing }] = useReceivePaymentMutation()

//     const handleStudentSelect = (student) => {
//         setSelectedStudent(student)
//         setActiveTab('receive')
//     }

//     const handleQuickPayment = async () => {
//         if (!selectedStudent || !quickPayment.amount || parseFloat(quickPayment.amount) <= 0) {
//             toast({
//                 title: 'Error',
//                 description: 'Please select a student and enter a valid amount',
//                 variant: 'destructive',
//             })
//             return
//         }

//         try {
//             const paymentData = {
//                 studentId: selectedStudent._id,
//                 amount: parseFloat(quickPayment.amount),
//                 method: quickPayment.method,
//                 reference: quickPayment.reference,
//                 notes: quickPayment.notes,
//                 session: SESSION_OPTIONS[1].value,
//             }

//             const result = await receivePayment(paymentData).unwrap()

//             toast({
//                 title: 'Success',
//                 description: `Payment of ${formatCurrency(quickPayment.amount)} received successfully`,
//                 variant: 'success',
//             })

//             // Reset quick payment form
//             setQuickPayment({
//                 amount: '',
//                 method: 'cash',
//                 reference: '',
//                 notes: '',
//             })

//             // Refresh payment history
//             refetchPayments()
//         } catch (error) {
//             toast({
//                 title: 'Error',
//                 description: error.data?.message || 'Failed to receive payment',
//                 variant: 'destructive',
//             })
//         }
//     }

//     return (
//         <div className="space-y-6">
//             {/* Header */}
//             <div className="flex items-center justify-between">
//                 <div>
//                     <h1 className="text-3xl font-bold tracking-tight">Receive Payment</h1>
//                     <p className="text-muted-foreground">
//                         {selectedStudent
//                             ? `Receiving payment for ${selectedStudent.name}`
//                             : 'Select a student to begin'}
//                     </p>
//                 </div>

//                 <Button variant="outline">
//                     <History className="mr-2 h-4 w-4" />
//                     View All Payments
//                 </Button>
//             </div>

//             {/* Student Search */}
//             <Card>
//                 <CardHeader>
//                     <CardTitle>Select Student</CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                     <div className="space-y-4">
//                         <div className="relative">
//                             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
//                             <Input
//                                 placeholder="Search student by name or roll number..."
//                                 className="pl-10"
//                                 value={searchTerm}
//                                 onChange={(e) => setSearchTerm(e.target.value)}
//                             />
//                         </div>

//                         {searchedStudents && searchedStudents.length > 0 && searchTerm.length >= 2 && (
//                             <div className="border rounded-md max-h-60 overflow-auto">
//                                 {searchedStudents.map((student) => (
//                                     <div className="bg-background border rounded-lg p-2 space-y-1">
//                                         <div
//                                             key={student._id}
//                                             className="px-4 py-3 hover:bg-muted cursor-pointer transition rounded-md"
//                                             onClick={() => handleStudentSelect(student)}
//                                         >
//                                             <div className="font-medium">{student.name}</div>
//                                             <div className="text-xs text-muted-foreground">
//                                                 Roll: {student.rollNumber} • Class: {student.class?.name}
//                                             </div>
//                                         </div>
//                                     </div>
//                                 ))}
//                             </div>
//                         )}

//                         {selectedStudent && (
//                             <Card className="bg-muted/50 border-dashed">
//                                 <CardContent className="flex items-center justify-between p-4">
//                                     <div className="flex items-center gap-3">
//                                         <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
//                                             <User className="h-5 w-5 text-primary" />
//                                         </div>
//                                         <div>
//                                             <div className="font-semibold">{selectedStudent.name}</div>
//                                             <div className="text-xs text-muted-foreground">
//                                                 Roll {selectedStudent.rollNumber} • {selectedStudent.class?.name}
//                                             </div>
//                                         </div>
//                                     </div>

//                                     <Button variant="ghost" size="sm" onClick={() => setSelectedStudent(null)}>
//                                         Change
//                                     </Button>
//                                 </CardContent>
//                             </Card>
//                         )}
//                     </div>
//                 </CardContent>
//             </Card>

//             {selectedStudent && (
//                 <>
//                     {/* Tabs for Payment Options */}
//                     <Tabs value={activeTab} onValueChange={setActiveTab}>
//                         <TabsList className="grid grid-cols-2 w-full max-w-md">
//                             <TabsTrigger value="quick">Quick Payment</TabsTrigger>
//                             <TabsTrigger value="receive">Detailed Payment</TabsTrigger>
//                         </TabsList>

//                         <TabsContent value="quick" className="space-y-6">
//                             <Card>
//                                 <CardHeader>
//                                     <CardTitle>Quick Payment</CardTitle>
//                                 </CardHeader>
//                                 <CardContent>
//                                     <div className="space-y-4">
//                                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                                             <div>
//                                                 <label className="block text-sm font-medium mb-2">
//                                                     Amount (BDT) *
//                                                 </label>
//                                                 <div className="relative">
//                                                     <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
//                                                     <Input
//                                                         type="number"
//                                                         step="0.01"
//                                                         inputMode="decimal"
//                                                         className="pl-10 text-lg font-semibold"
//                                                         placeholder="Enter amount"
//                                                         value={quickPayment.amount}
//                                                         onChange={(e) => setQuickPayment({ ...quickPayment, amount: e.target.value })}
//                                                     />

//                                                 </div>
//                                             </div>
//                                             <div>
//                                                 <label className="block text-sm font-medium mb-2">
//                                                     Payment Method *
//                                                 </label>
//                                                 <Select
//                                                     value={quickPayment.method}
//                                                     onValueChange={(value) => setQuickPayment({ ...quickPayment, method: value })}
//                                                 >
//                                                     <SelectTrigger>
//                                                         <SelectValue placeholder="Select method" />
//                                                     </SelectTrigger>
//                                                     <SelectContent>
//                                                         {PAYMENT_METHODS.map((option) => (
//                                                             <SelectItem key={option.value} value={option.value}>
//                                                                 {option.label}
//                                                             </SelectItem>
//                                                         ))}
//                                                     </SelectContent>
//                                                 </Select>
//                                             </div>
//                                             <div>
//                                                 <label className="block text-sm font-medium mb-2">
//                                                     Reference
//                                                 </label>
//                                                 <Input
//                                                     placeholder="Optional reference"
//                                                     value={quickPayment.reference}
//                                                     onChange={(e) => setQuickPayment({ ...quickPayment, reference: e.target.value })}
//                                                 />
//                                             </div>
//                                         </div>
//                                         <div>
//                                             <label className="block text-sm font-medium mb-2">
//                                                 Notes
//                                             </label>
//                                             <Textarea
//                                                 placeholder="Additional notes..."
//                                                 rows={2}
//                                                 value={quickPayment.notes}
//                                                 onChange={(e) => setQuickPayment({ ...quickPayment, notes: e.target.value })}
//                                             />
//                                         </div>
//                                         <div className="border-t pt-4">
//                                             <div className="flex items-center justify-between">
//                                                 <div>
//                                                     <div className="text-lg font-semibold">Total Amount</div>
//                                                     <div className="text-2xl font-bold text-green-600">
//                                                         {formatCurrency(parseFloat(quickPayment.amount) || 0)}
//                                                     </div>
//                                                 </div>
//                                                 <Button
//                                                     onClick={handleQuickPayment}
//                                                     disabled={isProcessing || !quickPayment.amount}
//                                                     size="lg"
//                                                 >
//                                                     {isProcessing ? (
//                                                         <>
//                                                             <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
//                                                             Processing...
//                                                         </>
//                                                     ) : (
//                                                         <>
//                                                             <CreditCard className="mr-2 h-4 w-4" />
//                                                             Receive Payment
//                                                         </>
//                                                     )}
//                                                 </Button>
//                                             </div>
//                                         </div>
//                                     </div>
//                                 </CardContent>
//                             </Card>
//                         </TabsContent>

//                         <TabsContent value="receive">
//                             <PaymentForm
//                                 studentId={selectedStudent._id}
//                                 // students={searchedStudents}
//                                 student={selectedStudent}
//                                 onSuccess={(result) => {
//                                     toast({
//                                         title: 'Success',
//                                         description: 'Payment received successfully',
//                                         variant: 'success',
//                                     })
//                                     refetchPayments()
//                                 }}
//                             />
//                         </TabsContent>
//                     </Tabs>

//                     {/* Recent Payments */}
//                     <Card>
//                         <CardHeader>
//                             <div className="flex items-center justify-between">
//                                 <CardTitle>Recent Payments</CardTitle>
//                                 <Button variant="ghost" size="sm" onClick={refetchPayments}>
//                                     <History className="mr-2 h-4 w-4" />
//                                     Refresh
//                                 </Button>
//                             </div>
//                         </CardHeader>
//                         <CardContent>
//                             {recentPayments?.length > 0 ? (
//                                 <div className="overflow-x-auto">
//                                     <Table>
//                                         <TableHeader>
//                                             <TableRow>
//                                                 <TableHead>Date</TableHead>
//                                                 <TableHead>Method</TableHead>
//                                                 <TableHead>Amount</TableHead>
//                                                 <TableHead>Reference</TableHead>
//                                                 <TableHead>Status</TableHead>
//                                             </TableRow>
//                                         </TableHeader>
//                                         <TableBody>
//                                             {recentPayments.map((payment) => (
//                                                 <TableRow key={payment._id}>
//                                                     <TableCell>
//                                                         <div className="flex items-center">
//                                                             <Calendar className="mr-2 h-4 w-4 text-gray-400" />
//                                                             {formatDate(payment.createdAt)}
//                                                         </div>
//                                                     </TableCell>
//                                                     <TableCell>
//                                                         <Badge variant="outline">
//                                                             {payment.method}
//                                                         </Badge>
//                                                     </TableCell>
//                                                     <TableCell className="font-semibold text-green-600">
//                                                         {formatCurrency(payment.amount)}
//                                                     </TableCell>
//                                                     <TableCell>
//                                                         <div className="text-sm text-gray-500">
//                                                             {payment.reference || 'N/A'}
//                                                         </div>
//                                                     </TableCell>
//                                                     <TableCell>
//                                                         <Badge className="bg-green-100 text-green-800">
//                                                             <CheckCircle className="mr-1 h-3 w-3" />
//                                                             {payment.status}
//                                                         </Badge>
//                                                     </TableCell>
//                                                 </TableRow>
//                                             ))}
//                                         </TableBody>
//                                     </Table>
//                                 </div>
//                             ) : (
//                                 <div className="text-center py-8">
//                                     <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
//                                     <h3 className="mt-4 text-lg font-semibold">No recent payments</h3>
//                                     <p className="text-gray-500">No payment history found for this student</p>
//                                 </div>
//                             )}
//                         </CardContent>
//                     </Card>

//                     {/* Quick Stats */}
//                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//                         <Card>
//                             <CardContent className="pt-6">
//                                 <div className="text-center">
//                                     <div className="text-2xl font-bold text-green-600">
//                                         {formatCurrency(
//                                             recentPayments?.reduce((sum, p) => sum + p.amount, 0) || 0
//                                         )}
//                                     </div>
//                                     <div className="text-sm text-gray-500">Total Paid (Recent)</div>
//                                 </div>
//                             </CardContent>
//                         </Card>
//                         <Card>
//                             <CardContent className="pt-6">
//                                 <div className="text-center">
//                                     <div className="text-2xl font-bold text-blue-600">
//                                         {recentPayments?.length || 0}
//                                     </div>
//                                     <div className="text-sm text-gray-500">Total Transactions</div>
//                                 </div>
//                             </CardContent>
//                         </Card>
//                         <Card>
//                             <CardContent className="pt-6">
//                                 <div className="text-center">
//                                     <div className="text-2xl font-bold text-purple-600">
//                                         {recentPayments?.length > 0
//                                             ? formatCurrency(
//                                                 recentPayments.reduce((sum, p) => sum + p.amount, 0) / recentPayments.length
//                                             )
//                                             : formatCurrency(0)
//                                         }
//                                     </div>
//                                     <div className="text-sm text-gray-500">Average Payment</div>
//                                 </div>
//                             </CardContent>
//                         </Card>
//                     </div>
//                 </>
//             )}

//             {/* Help/Info Card */}
//             <Card>
//                 <CardHeader>
//                     <CardTitle className="flex items-center">
//                         <AlertCircle className="mr-2 h-5 w-5 text-blue-600" />
//                         Payment Guidelines
//                     </CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                     <div className="space-y-3">
//                         <div className="flex items-start space-x-3">
//                             <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
//                             <div>
//                                 <div className="font-medium">Always verify student identity</div>
//                                 <div className="text-sm text-gray-600">
//                                     Confirm student details before accepting payment
//                                 </div>
//                             </div>
//                         </div>
//                         <div className="flex items-start space-x-3">
//                             <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
//                             <div>
//                                 <div className="font-medium">Provide receipt for every payment</div>
//                                 <div className="text-sm text-gray-600">
//                                     Ensure students receive payment confirmation
//                                 </div>
//                             </div>
//                         </div>
//                         <div className="flex items-start space-x-3">
//                             <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
//                             <div>
//                                 <div className="font-medium">Record all payment details</div>
//                                 <div className="text-sm text-gray-600">
//                                     Include reference numbers and notes for tracking
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 </CardContent>
//             </Card>
//         </div>
//     )
// }

// export default ReceivePayment