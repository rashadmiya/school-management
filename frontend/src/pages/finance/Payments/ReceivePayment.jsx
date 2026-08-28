
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
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground">৳</span>
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