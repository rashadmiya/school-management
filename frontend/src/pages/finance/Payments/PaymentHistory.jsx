// src/pages/Payments/PaymentHistory.jsx - COMPLETE WORKING VERSION
import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useGetCurrentSessionQuery } from '@/features/apis/finance/feeApi'
import {
    useGetPaymentAllocationsQuery,
    useLazySearchPaymentsLazyQuery,
    useLazyGetPaymentHistoryLazyQuery
} from '@/features/apis/finance/paymentApi'
import { formatCurrency, formatDateTime } from '@/lib/formaters'
import { PAYMENT_METHODS, PAYMENT_STATUS } from '@/utils/constants'
import {
    Calendar,
    CreditCard,
    Download,
    Eye,
    Filter,
    Receipt,
    Search,
    User,
    Loader2,
    AlertCircle,
    ChevronLeft,
    ChevronRight
} from 'lucide-react'

const PaymentHistory = () => {
    const [searchTerm, setSearchTerm] = useState('')
    const [session, setSession] = useState('')
    const [method, setMethod] = useState('')
    const [status, setStatus] = useState('completed')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [selectedPayment, setSelectedPayment] = useState(null)
    const [showDetails, setShowDetails] = useState(false)
    const [activeTab, setActiveTab] = useState('search') // 'search' or 'student'
    const [page, setPage] = useState(1)
    const [limit] = useState(20)

    // Get current session
    const { data: sessionData, isLoading: sessionLoading } = useGetCurrentSessionQuery()

    // Set default session
    useEffect(() => {
        if (sessionData?.data?.currentSession && !session) {
            setSession(sessionData.data.currentSession)
        }
    }, [sessionData, session])

    // Search payments query
    const [searchPayments, {
        data: searchData,
        isLoading: searchLoading,
        isFetching: searchFetching
    }] = useLazySearchPaymentsLazyQuery()

    // Get payment history for specific student
    const [getPaymentHistory, {
        data: studentPaymentsData,
        isLoading: studentLoading
    }] = useLazyGetPaymentHistoryLazyQuery()

    // Get payment allocations
    const { data: allocations } = useGetPaymentAllocationsQuery(selectedPayment?._id, {
        skip: !selectedPayment,
    })

    // Handle search
    const handleSearch = () => {
        if (activeTab === 'search') {
            searchPayments({
                search: searchTerm,
                session,
                method: method || undefined,
                status: status || undefined,
                startDate: startDate || undefined,
                endDate: endDate || undefined,
                page,
                limit
            })
        } else {
            // Search by specific student
            if (searchTerm) {
                getPaymentHistory({
                    studentId: searchTerm,
                    session,
                    limit: 50
                })
            }
        }
    }

    // Handle pagination
    const handleNextPage = () => {
        if (searchData?.pagination?.pages > page) {
            setPage(prev => prev + 1)
        }
    }

    const handlePrevPage = () => {
        if (page > 1) {
            setPage(prev => prev - 1)
        }
    }

    // Auto-search when filters change
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm || method || status || startDate || endDate) {
                handleSearch()
            }
        }, 500)

        return () => clearTimeout(timer)
    }, [searchTerm, session, method, status, startDate, endDate, page, activeTab])

    // Get payments based on active tab
    const payments = activeTab === 'search'
        ? searchData?.data || []
        : studentPaymentsData?.data || []

    const isLoading = activeTab === 'search' ? searchLoading || searchFetching : studentLoading
    const pagination = searchData?.pagination

    const handleViewDetails = (payment) => {
        setSelectedPayment(payment)
        setShowDetails(true)
    }

    const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0)

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

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-2 w-full max-w-md">
                    <TabsTrigger value="search">Search Payments</TabsTrigger>
                    <TabsTrigger value="student">By Student</TabsTrigger>
                </TabsList>

                {/* Filters Card */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            {/* Search Input */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder={
                                        activeTab === 'search'
                                            ? "Search by student name or roll number..."
                                            : "Enter student ID, roll number, or name..."
                                    }
                                    className="pl-10"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            {/* Filters Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                {/* Session Selector */}
                                <Select
                                    value={session}
                                    onValueChange={setSession}
                                    disabled={sessionLoading}
                                >
                                    <SelectTrigger>
                                        {sessionLoading ? (
                                            <div className="flex items-center">
                                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                Loading session...
                                            </div>
                                        ) : (
                                            <SelectValue placeholder="Select session" />
                                        )}
                                    </SelectTrigger>
                                    <SelectContent>
                                        {sessionData?.data && (
                                            <>
                                                <SelectItem value={sessionData.data.currentSession}>
                                                    {sessionData.data.currentSession} (Current)
                                                </SelectItem>
                                                {sessionData.data.previousSession && (
                                                    <SelectItem value={sessionData.data.previousSession}>
                                                        {sessionData.data.previousSession}
                                                    </SelectItem>
                                                )}
                                            </>
                                        )}
                                    </SelectContent>
                                </Select>

                                {/* Method Filter */}
                                <Select value={method ?? "all"} 
                                onValueChange={(value => setMethod(value === 'all' ? '' : value))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Methods" />
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

                                {/* Status Filter */}
                                <Select value={status} onValueChange={setStatus}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PAYMENT_STATUS.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {/* Clear Filters Button */}
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setSearchTerm('')
                                        setMethod('')
                                        setStatus('completed')
                                        setStartDate('')
                                        setEndDate('')
                                        setPage(1)
                                    }}
                                    className="flex items-center"
                                >
                                    <Filter className="mr-2 h-4 w-4" />
                                    Clear Filters
                                </Button>
                            </div>

                            {/* Date Range */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                    <Button
                                        onClick={handleSearch}
                                        disabled={isLoading}
                                        className="w-full"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Searching...
                                            </>
                                        ) : (
                                            'Search Payments'
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </Tabs>

            {/* Results Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>
                            Payments ({payments.length})
                            {pagination && (
                                <span className="text-sm font-normal text-gray-500 ml-2">
                                    Page {page} of {pagination.pages}
                                </span>
                            )}
                        </CardTitle>
                        <div className="flex items-center space-x-4">
                            <div className="text-sm text-gray-500">
                                Total: {formatCurrency(totalAmount)}
                            </div>
                            {/* Pagination Controls */}
                            {pagination && pagination.pages > 1 && (
                                <div className="flex items-center space-x-2">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={handlePrevPage}
                                        disabled={page === 1 || isLoading}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <span className="text-sm">
                                        {page} / {pagination.pages}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={handleNextPage}
                                        disabled={page === pagination.pages || isLoading}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-64">
                            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                            <p className="text-gray-500">Loading payments...</p>
                        </div>
                    ) : payments.length === 0 ? (
                        <div className="text-center py-12">
                            <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-4 text-lg font-semibold">No payments found</h3>
                            <p className="text-gray-500 mt-2">
                                {searchTerm
                                    ? `No payments found for "${searchTerm}"`
                                    : 'Try searching for payments'
                                }
                            </p>
                            {activeTab === 'student' && (
                                <div className="mt-4 p-4 bg-amber-50 rounded-lg max-w-md mx-auto">
                                    <div className="flex items-start">
                                        <AlertCircle className="h-5 w-5 text-amber-600 mr-2 flex-shrink-0 mt-0.5" />
                                        <div className="text-left">
                                            <p className="text-sm font-medium text-amber-800">
                                                Search Tips:
                                            </p>
                                            <ul className="text-xs text-amber-700 mt-1 list-disc list-inside">
                                                <li>Try student roll number (e.g., "1234123")</li>
                                                <li>Try student name (e.g., "Rakibul")</li>
                                                <li>Try student ID from database</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}
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
                                    {payments.map((payment) => (
                                        <TableRow key={payment._id} className="hover:bg-gray-50">
                                            <TableCell>
                                                <div className="flex items-center space-x-3">
                                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                        <User className="h-5 w-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">
                                                            {payment.student?.name || 'Unknown Student'}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            Roll: {payment.student?.rollNumber || 'N/A'}
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
                                            <TableCell className="font-semibold text-green-600">
                                                {formatCurrency(payment.amount)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="capitalize">
                                                    {PAYMENT_METHODS.find(m => m.value === payment.method)?.label || payment.method}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm text-gray-500 font-mono">
                                                    {payment.reference || 'N/A'}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={
                                                    payment.status === 'completed'
                                                        ? 'bg-green-100 text-green-800'
                                                        : payment.status === 'pending'
                                                            ? 'bg-yellow-100 text-yellow-800'
                                                            : 'bg-red-100 text-red-800'
                                                }>
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
                                                            window.print()
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
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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
                                        Payment ID: {selectedPayment._id.slice(-8)}
                                    </div>
                                </div>
                                <Badge className={
                                    selectedPayment.status === 'completed'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-yellow-100 text-yellow-800'
                                }>
                                    {selectedPayment.status}
                                </Badge>
                            </div>

                            {/* Payment Details Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-gray-500">Student Name</label>
                                    <p className="font-medium">{selectedPayment.student?.name || 'Unknown'}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500">Roll Number</label>
                                    <p className="font-medium">{selectedPayment.student?.rollNumber || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500">Payment Method</label>
                                    <p className="font-medium capitalize">{selectedPayment.method}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500">Date & Time</label>
                                    <p className="font-medium">{formatDateTime(selectedPayment.createdAt)}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500">Received By</label>
                                    <p className="font-medium">{selectedPayment.receivedBy?.name || 'Unknown'}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500">Session</label>
                                    <p className="font-medium">{selectedPayment.session}</p>
                                </div>
                            </div>

                            {/* Method Details */}
                            {selectedPayment.methodDetails && Object.keys(selectedPayment.methodDetails).length > 0 && (
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
                                    <div className="space-y-2">
                                        {allocations.map((allocation) => (
                                            <div key={allocation._id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                                <div>
                                                    <div className="font-medium">
                                                        {allocation.feeInstance?.feeTemplate?.title || 'Unknown Fee'}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        Allocation ID: {allocation._id.slice(-8)}
                                                    </div>
                                                </div>
                                                <div className="font-semibold text-green-600">
                                                    {formatCurrency(allocation.amount)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Notes */}
                            {selectedPayment.notes && (
                                <div className="border-t pt-4">
                                    <h4 className="font-medium mb-2">Notes</h4>
                                    <p className="text-gray-600 whitespace-pre-wrap">{selectedPayment.notes}</p>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="border-t pt-4 flex justify-end space-x-2">
                                <Button variant="outline" onClick={() => window.print()}>
                                    Print Receipt
                                </Button>
                                {selectedPayment.status === 'completed' && (
                                    <Button variant="outline" className="text-red-600 border-red-200">
                                        Process Refund
                                    </Button>
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

// // src/pages/Payments/PaymentHistory.jsx
// import { Badge } from '@/components/ui/badge'
// import { Button } from '@/components/ui/button'
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
// import { Input } from '@/components/ui/input'
// import { Label } from '@/components/ui/label'
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
// import { useGetCurrentSessionQuery } from '@/features/apis/finance/feeApi'
// import { useGetPaymentAllocationsQuery, useGetPaymentHistoryQuery } from '@/features/apis/finance/paymentApi'
// import { formatCurrency, formatDateTime, getStatusColor } from '@/lib/formaters'
// import { PAYMENT_METHODS, PAYMENT_STATUS, SESSION_OPTIONS } from '@/utils/constants'
// import {
//     Calendar,
//     CreditCard,
//     Download,
//     Eye,
//     Filter,
//     Receipt,
//     Search,
//     User
// } from 'lucide-react'
// import { useState } from 'react'

// const PaymentHistory = () => {
//     const [search, setSearch] = useState('')
//     const [session, setSession] = useState(SESSION_OPTIONS[1].value)
//     const [method, setMethod] = useState('')
//     const [status, setStatus] = useState('')
//     const [startDate, setStartDate] = useState('')
//     const [endDate, setEndDate] = useState('')
//     const [selectedPayment, setSelectedPayment] = useState(null)
//     const [showDetails, setShowDetails] = useState(false)

//     // Get current session
//     const { data: sessionData } = useGetCurrentSessionQuery()
//     const currentSession = sessionData?.data?.currentSession || ''

//     // const { data: payments, isLoading } = useGetPaymentsQuery({
//     //     session,
//     //     method: method || undefined,
//     //     status: status || undefined,
//     //     startDate: startDate || undefined,
//     //     endDate: endDate || undefined,
//     //     studentId: search || undefined,
//     // })

//     // SOLUTION: In PaymentHistory.jsx, replace useGetPaymentsQuery with:
//     // Get payments for searched student
//     const { data: paymentsData, isLoading } = useGetPaymentHistoryQuery(
//         search ? {
//             studentId: search, // Using search as studentId
//             session: currentSession,
//             limit: 50
//         } : null,
//         { skip: !search || !currentSession }
//     )

//     const payments = paymentsData?.data || []


//     const { data: allocations } = useGetPaymentAllocationsQuery(selectedPayment?._id, {
//         skip: !selectedPayment,
//     });

//     console.log('allocations', allocations);
//     console.log('paymentsData', paymentsData);
//     console.log('sessionData', sessionData);

//     const handleViewDetails = (payment) => {
//         setSelectedPayment(payment)
//         setShowDetails(true)
//     }

//     const filteredPayments = payments || []

//     return (
//         <div className="space-y-6">
//             {/* Header */}
//             <div className="flex items-center justify-between">
//                 <div>
//                     <h1 className="text-3xl font-bold tracking-tight">Payment History</h1>
//                     <p className="text-muted-foreground">
//                         View and track all payment transactions
//                     </p>
//                 </div>
//                 <div className="flex items-center space-x-2">
//                     <Button variant="outline">
//                         <Download className="mr-2 h-4 w-4" />
//                         Export
//                     </Button>
//                 </div>
//             </div>

//             {/* Filters */}
//             <Card>
//                 <CardContent className="pt-6">
//                     <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
//                         <div className="relative">
//                             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
//                             <Input
//                                 placeholder="Search by student..."
//                                 className="pl-10"
//                                 value={search}
//                                 onChange={(e) => setSearch(e.target.value)}
//                             />
//                         </div>
//                         <Select value={session} onValueChange={setSession}>
//                             <SelectTrigger>
//                                 <SelectValue placeholder="Session" />
//                             </SelectTrigger>
//                             <SelectContent>
//                                 {SESSION_OPTIONS.map((option) => (
//                                     <SelectItem key={option.value} value={option.value}>
//                                         {option.label}
//                                     </SelectItem>
//                                 ))}
//                             </SelectContent>
//                         </Select>
//                         <Select value={method ?? 'all'}
//                             onValueChange={(value) => setMethod(value === 'all' ? '' : value)}>
//                             <SelectTrigger>
//                                 <SelectValue placeholder="Payment Method" />
//                             </SelectTrigger>
//                             <SelectContent>
//                                 <SelectItem value="all">All Methods</SelectItem>
//                                 {PAYMENT_METHODS.map((option) => (
//                                     <SelectItem key={option.value} value={option.value}>
//                                         {option.label}
//                                     </SelectItem>
//                                 ))}
//                             </SelectContent>
//                         </Select>
//                         <Select value={status ?? 'all'}
//                             onValueChange={(value) => setStatus(value === 'all' ? '' : value)}>
//                             <SelectTrigger>
//                                 <SelectValue placeholder="Status" />
//                             </SelectTrigger>
//                             <SelectContent>
//                                 <SelectItem value="all">All Status</SelectItem>
//                                 {PAYMENT_STATUS.map((option) => (
//                                     <SelectItem key={option.value} value={option.value}>
//                                         {option.label}
//                                     </SelectItem>
//                                 ))}
//                             </SelectContent>
//                         </Select>
//                         <div className="flex space-x-2">
//                             <Button variant="outline" className="flex-1" onClick={() => {
//                                 setSearch('')
//                                 setMethod('')
//                                 setStatus('')
//                                 setStartDate('')
//                                 setEndDate('')
//                             }}>
//                                 <Filter className="mr-2 h-4 w-4" />
//                                 Clear
//                             </Button>
//                         </div>
//                     </div>
//                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
//                         <div>
//                             <Label htmlFor="startDate">From Date</Label>
//                             <Input
//                                 id="startDate"
//                                 type="date"
//                                 value={startDate}
//                                 onChange={(e) => setStartDate(e.target.value)}
//                             />
//                         </div>
//                         <div>
//                             <Label htmlFor="endDate">To Date</Label>
//                             <Input
//                                 id="endDate"
//                                 type="date"
//                                 value={endDate}
//                                 onChange={(e) => setEndDate(e.target.value)}
//                             />
//                         </div>
//                         <div className="flex items-end">
//                             <Button className="w-full">
//                                 Apply Filters
//                             </Button>
//                         </div>
//                     </div>
//                 </CardContent>
//             </Card>

//             {/* Payments Table */}
//             <Card>
//                 <CardHeader>
//                     <div className="flex items-center justify-between">
//                         <CardTitle>Payments ({filteredPayments.length})</CardTitle>
//                         <div className="text-sm text-gray-500">
//                             Total: {formatCurrency(filteredPayments.reduce((sum, p) => sum + p.amount, 0))}
//                         </div>
//                     </div>
//                 </CardHeader>
//                 <CardContent>
//                     {isLoading ? (
//                         <div className="flex items-center justify-center h-64">
//                             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
//                         </div>
//                     ) : filteredPayments.length === 0 ? (
//                         <div className="text-center py-12">
//                             <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
//                             <h3 className="mt-4 text-lg font-semibold">No payments found</h3>
//                             <p className="text-gray-500">Try adjusting your filters</p>
//                         </div>
//                     ) : (
//                         <div className="overflow-x-auto">
//                             <Table>
//                                 <TableHeader>
//                                     <TableRow>
//                                         <TableHead>Student</TableHead>
//                                         <TableHead>Date & Time</TableHead>
//                                         <TableHead>Amount</TableHead>
//                                         <TableHead>Method</TableHead>
//                                         <TableHead>Reference</TableHead>
//                                         <TableHead>Status</TableHead>
//                                         <TableHead className="text-right">Actions</TableHead>
//                                     </TableRow>
//                                 </TableHeader>
//                                 <TableBody>
//                                     {filteredPayments.map((payment) => (
//                                         <TableRow key={payment._id}>
//                                             <TableCell>
//                                                 <div className="flex items-center space-x-3">
//                                                     <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
//                                                         <User className="h-5 w-5 text-primary" />
//                                                     </div>
//                                                     <div>
//                                                         <div className="font-medium">{payment.student?.name}</div>
//                                                         <div className="text-sm text-gray-500">
//                                                             Roll: {payment.student?.rollNumber}
//                                                         </div>
//                                                     </div>
//                                                 </div>
//                                             </TableCell>
//                                             <TableCell>
//                                                 <div className="flex items-center">
//                                                     <Calendar className="mr-2 h-4 w-4 text-gray-400" />
//                                                     {formatDateTime(payment.createdAt)}
//                                                 </div>
//                                             </TableCell>
//                                             <TableCell className="font-semibold">
//                                                 {formatCurrency(payment.amount)}
//                                             </TableCell>
//                                             <TableCell>
//                                                 <Badge variant="outline">
//                                                     {PAYMENT_METHODS.find(m => m.value === payment.method)?.label || payment.method}
//                                                 </Badge>
//                                             </TableCell>
//                                             <TableCell>
//                                                 <div className="text-sm text-gray-500">
//                                                     {payment.reference || 'N/A'}
//                                                 </div>
//                                             </TableCell>
//                                             <TableCell>
//                                                 <Badge className={getStatusColor(payment.status, 'payment')}>
//                                                     {payment.status}
//                                                 </Badge>
//                                             </TableCell>
//                                             <TableCell className="text-right">
//                                                 <div className="flex items-center justify-end space-x-2">
//                                                     <Button
//                                                         variant="ghost"
//                                                         size="icon"
//                                                         onClick={() => handleViewDetails(payment)}
//                                                     >
//                                                         <Eye className="h-4 w-4" />
//                                                     </Button>
//                                                     <Button
//                                                         variant="ghost"
//                                                         size="icon"
//                                                         onClick={() => {
//                                                             // Print receipt
//                                                         }}
//                                                     >
//                                                         <Receipt className="h-4 w-4" />
//                                                     </Button>
//                                                 </div>
//                                             </TableCell>
//                                         </TableRow>
//                                     ))}
//                                 </TableBody>
//                             </Table>
//                         </div>
//                     )}
//                 </CardContent>
//             </Card>

//             {/* Payment Details Dialog */}
//             <Dialog open={showDetails} onOpenChange={setShowDetails}>
//                 <DialogContent className="max-w-3xl">
//                     <DialogHeader>
//                         <DialogTitle>Payment Details</DialogTitle>
//                     </DialogHeader>
//                     {selectedPayment && (
//                         <div className="space-y-6">
//                             {/* Payment Header */}
//                             <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
//                                 <div>
//                                     <div className="text-2xl font-bold text-green-600">
//                                         {formatCurrency(selectedPayment.amount)}
//                                     </div>
//                                     <div className="text-sm text-gray-500">
//                                         Payment #{selectedPayment._id}
//                                     </div>
//                                 </div>
//                                 <Badge className={getStatusColor(selectedPayment.status, 'payment')}>
//                                     {selectedPayment.status}
//                                 </Badge>
//                             </div>

//                             {/* Payment Details */}
//                             <div className="grid grid-cols-2 gap-4">
//                                 <div>
//                                     <label className="text-sm text-gray-500">Student</label>
//                                     <p className="font-medium">{selectedPayment.student?.name}</p>
//                                 </div>
//                                 <div>
//                                     <label className="text-sm text-gray-500">Payment Method</label>
//                                     <p className="font-medium">
//                                         {PAYMENT_METHODS.find(m => m.value === selectedPayment.method)?.label || selectedPayment.method}
//                                     </p>
//                                 </div>
//                                 <div>
//                                     <label className="text-sm text-gray-500">Date & Time</label>
//                                     <p className="font-medium">{formatDateTime(selectedPayment.createdAt)}</p>
//                                 </div>
//                                 <div>
//                                     <label className="text-sm text-gray-500">Received By</label>
//                                     <p className="font-medium">{selectedPayment.receivedBy?.name}</p>
//                                 </div>
//                                 <div>
//                                     <label className="text-sm text-gray-500">Reference</label>
//                                     <p className="font-medium">{selectedPayment.reference || 'N/A'}</p>
//                                 </div>
//                                 <div>
//                                     <label className="text-sm text-gray-500">Session</label>
//                                     <p className="font-medium">{selectedPayment.session}</p>
//                                 </div>
//                             </div>

//                             {/* Method Details */}
//                             {selectedPayment.methodDetails && (
//                                 <div className="border-t pt-4">
//                                     <h4 className="font-medium mb-2">Payment Method Details</h4>
//                                     <div className="grid grid-cols-2 gap-4">
//                                         {selectedPayment.methodDetails.bankName && (
//                                             <div>
//                                                 <label className="text-sm text-gray-500">Bank Name</label>
//                                                 <p className="font-medium">{selectedPayment.methodDetails.bankName}</p>
//                                             </div>
//                                         )}
//                                         {selectedPayment.methodDetails.accountNumber && (
//                                             <div>
//                                                 <label className="text-sm text-gray-500">Account Number</label>
//                                                 <p className="font-medium">{selectedPayment.methodDetails.accountNumber}</p>
//                                             </div>
//                                         )}
//                                         {selectedPayment.methodDetails.transactionId && (
//                                             <div>
//                                                 <label className="text-sm text-gray-500">Transaction ID</label>
//                                                 <p className="font-medium">{selectedPayment.methodDetails.transactionId}</p>
//                                             </div>
//                                         )}
//                                         {selectedPayment.methodDetails.mobileOperator && (
//                                             <div>
//                                                 <label className="text-sm text-gray-500">Mobile Operator</label>
//                                                 <p className="font-medium">{selectedPayment.methodDetails.mobileOperator}</p>
//                                             </div>
//                                         )}
//                                     </div>
//                                 </div>
//                             )}

//                             {/* Allocations */}
//                             {allocations && allocations.length > 0 && (
//                                 <div className="border-t pt-4">
//                                     <h4 className="font-medium mb-2">Payment Allocations</h4>
//                                     <div className="overflow-x-auto">
//                                         <table className="w-full text-sm">
//                                             <thead>
//                                                 <tr className="border-b">
//                                                     <th className="text-left py-2">Fee Title</th>
//                                                     <th className="text-right py-2">Amount</th>
//                                                 </tr>
//                                             </thead>
//                                             <tbody>
//                                                 {allocations.map((allocation) => (
//                                                     <tr key={allocation._id} className="border-b">
//                                                         <td className="py-2">{allocation.feeInstance?.feeTemplate?.title}</td>
//                                                         <td className="text-right py-2">{formatCurrency(allocation.amount)}</td>
//                                                     </tr>
//                                                 ))}
//                                             </tbody>
//                                         </table>
//                                     </div>
//                                 </div>
//                             )}

//                             {/* Notes */}
//                             {selectedPayment.notes && (
//                                 <div className="border-t pt-4">
//                                     <h4 className="font-medium mb-2">Notes</h4>
//                                     <p className="text-gray-600">{selectedPayment.notes}</p>
//                                 </div>
//                             )}

//                             {/* Actions */}
//                             <div className="border-t pt-4 flex justify-end space-x-2">
//                                 <Button variant="outline">Print Receipt</Button>
//                                 {selectedPayment.status === 'completed' && (
//                                     <Button variant="outline">Process Refund</Button>
//                                 )}
//                             </div>
//                         </div>
//                     )}
//                 </DialogContent>
//             </Dialog>
//         </div>
//     )
// }

// export default PaymentHistory