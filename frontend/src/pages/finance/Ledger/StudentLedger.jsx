// src/pages/Ledger/StudentLedger.jsx
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useGetStudentLedgerQuery, useValidateLedgerQuery } from '@/features/apis/finance/ledgerApi'
import { useToast } from '@/hooks/use-toast'
import { useStudentSearch } from '@/hooks/useStudentSearch'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/formaters'
import {
    ArrowDownRight,
    ArrowUpRight,
    Download,
    Eye,
    FileText,
    Filter,
    RefreshCw,
    Search,
    TrendingUp,
    User
} from 'lucide-react'
import { useState } from 'react'

const StudentLedger = () => {
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedStudent, setSelectedStudent] = useState(null)
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [showValidation, setShowValidation] = useState(false)

    const { toast } = useToast()

    const {
        results: searchResults,
        isLoading: searchLoading
    } = useStudentSearch(searchTerm, {
        fields: 'name,rollNumber,religion',
        limit: 10,
    });

    const { data:ledgerData, isLoading, refetch } = useGetStudentLedgerQuery(
        selectedStudent ? {
            studentId: selectedStudent._id,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
        } : null,
        { skip: !selectedStudent }
    );

    const ledgerEntries = ledgerData?.data || [];
    // console.log("ledgerentris :", data)

    const { data: validation } = useValidateLedgerQuery(selectedStudent?._id, {
        skip: !selectedStudent || !showValidation,
    })

    const handleStudentSelect = (student) => {
        setSelectedStudent(student)
    }

    const handleRefresh = () => {
        refetch()
        toast({
            title: 'Refreshed',
            description: 'Ledger data refreshed',
            variant: 'default',
        })
    }

    const handleExport = () => {
        // Export functionality would go here
        toast({
            title: 'Export Started',
            description: 'Preparing ledger export...',
            variant: 'default',
        })
    }

    const getEntryTypeIcon = (type) => {
        switch (type) {
            case 'fee':
            case 'refund':
            case 'advance_debit':
                return <ArrowUpRight className="h-4 w-4 text-red-500" />
            case 'payment':
            case 'waiver':
            case 'advance_credit':
                return <ArrowDownRight className="h-4 w-4 text-green-500" />
            default:
                return <RefreshCw className="h-4 w-4 text-gray-500" />
        }
    }

    const getEntryTypeColor = (type) => {
        switch (type) {
            case 'fee':
                return 'bg-red-100 text-red-800'
            case 'payment':
                return 'bg-green-100 text-green-800'
            case 'refund':
                return 'bg-orange-100 text-orange-800'
            case 'waiver':
                return 'bg-blue-100 text-blue-800'
            case 'advance_credit':
                return 'bg-purple-100 text-purple-800'
            case 'advance_debit':
                return 'bg-pink-100 text-pink-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    const currentBalance = ledgerEntries?.[0]?.balanceAfter || 0

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Student Ledger</h1>
                    <p className="text-muted-foreground">
                        View complete financial ledger for students
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" onClick={handleRefresh}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh
                    </Button>
                    <Button variant="outline" onClick={handleExport}>
                        <Download className="mr-2 h-4 w-4" />
                        Export
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
                                    <div className="flex items-center space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setShowValidation(true)}
                                        >
                                            Validate Ledger
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setSelectedStudent(null)
                                                setStartDate('')
                                                setEndDate('')
                                            }}
                                        >
                                            Change
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Date Filters and Balance Summary */}
            {selectedStudent && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
                                <TrendingUp className="h-4 w-4 text-green-600" />
                            </CardHeader>
                            <CardContent>
                                <div className={`text-3xl font-bold ${currentBalance > 0 ? 'text-green-600' : currentBalance < 0 ? 'text-red-600' : 'text-gray-600'
                                    }`}>
                                    {formatCurrency(Math.abs(currentBalance))}
                                    {currentBalance > 0 && ' (Credit)'}
                                    {currentBalance < 0 && ' (Debit)'}
                                </div>
                                <p className="text-xs text-gray-500">
                                    As of {formatDate(new Date())}
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Fees</CardTitle>
                                <ArrowUpRight className="h-4 w-4 text-red-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-red-600">
                                    {
                                        formatCurrency((Array.isArray(ledgerEntries) ? ledgerEntries : [])
                                            .filter(e => e.type === 'fee')
                                            .reduce((sum, e) => sum + (e.debit || 0), 0)
                                        )
                                    }
                                </div>
                                <p className="text-xs text-gray-500">
                                    Total fees charged
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
                                <ArrowDownRight className="h-4 w-4 text-green-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-green-600">
                                    {formatCurrency(
                                        (Array.isArray(ledgerEntries) ? ledgerEntries : [])
                                        .filter(e => e.type === 'payment')
                                            .reduce((sum, e) => sum + e.credit, 0) || 0
                                    )}
                                </div>
                                <p className="text-xs text-gray-500">
                                    Total payments received
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Ledger Entries</CardTitle>
                                <FileText className="h-4 w-4 text-blue-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-blue-600">
                                    {ledgerEntries?.length || 0}
                                </div>
                                <p className="text-xs text-gray-500">
                                    Total transactions
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Date Filters */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                                    <label className="block text-sm font-medium mb-2">Transaction Type</label>
                                    <Select>
                                        <SelectTrigger>
                                            <SelectValue placeholder="All Types" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Types</SelectItem>
                                            <SelectItem value="fee">Fees</SelectItem>
                                            <SelectItem value="payment">Payments</SelectItem>
                                            <SelectItem value="refund">Refunds</SelectItem>
                                            <SelectItem value="waiver">Waivers</SelectItem>
                                            <SelectItem value="advance">Advance Balance</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-end">
                                    <Button className="w-full" onClick={handleRefresh}>
                                        <Filter className="mr-2 h-4 w-4" />
                                        Apply Filters
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}

            {/* Ledger Entries Table */}
            {selectedStudent && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Ledger Entries</CardTitle>
                            <div className="text-sm text-gray-500">
                                Balance: {formatCurrency(currentBalance)}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex items-center justify-center h-64">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                            </div>
                        ) : ledgerEntries?.length === 0 ? (
                            <div className="text-center py-12">
                                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-4 text-lg font-semibold">No ledger entries found</h3>
                                <p className="text-gray-500">Try adjusting your date filters</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date & Time</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Description</TableHead>
                                            <TableHead className="text-right">Debit</TableHead>
                                            <TableHead className="text-right">Credit</TableHead>
                                            <TableHead className="text-right">Balance</TableHead>
                                            <TableHead className="text-right">Reference</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {ledgerEntries.map((entry) => (
                                            <TableRow key={entry._id}>
                                                <TableCell>
                                                    <div className="text-sm">
                                                        {formatDateTime(entry.createdAt)}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center space-x-2">
                                                        {getEntryTypeIcon(entry.type)}
                                                        <Badge className={getEntryTypeColor(entry.type)}>
                                                            {entry.type}
                                                        </Badge>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="max-w-xs">
                                                        <div className="font-medium truncate">{entry.description}</div>
                                                        {entry.refModel && (
                                                            <div className="text-xs text-gray-500">
                                                                Ref: {entry.refModel}
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {entry.debit > 0 ? (
                                                        <div className="font-medium text-red-600">
                                                            {formatCurrency(entry.debit)}
                                                        </div>
                                                    ) : (
                                                        <div className="text-gray-400">-</div>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {entry.credit > 0 ? (
                                                        <div className="font-medium text-green-600">
                                                            {formatCurrency(entry.credit)}
                                                        </div>
                                                    ) : (
                                                        <div className="text-gray-400">-</div>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className={`font-medium ${entry.balanceAfter > 0
                                                        ? 'text-green-600'
                                                        : entry.balanceAfter < 0
                                                            ? 'text-red-600'
                                                            : 'text-gray-600'
                                                        }`}>
                                                        {formatCurrency(Math.abs(entry.balanceAfter))}
                                                        {entry.balanceAfter > 0 && ' (Cr)'}
                                                        {entry.balanceAfter < 0 && ' (Dr)'}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            // Navigate to reference details
                                                        }}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Ledger Validation Dialog */}
            <Dialog open={showValidation} onOpenChange={setShowValidation}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Ledger Validation</DialogTitle>
                    </DialogHeader>
                    {validation && (
                        <div className="space-y-4">
                            <div className={`p-4 rounded-lg ${validation.isValid
                                ? 'bg-green-50 border border-green-200'
                                : 'bg-red-50 border border-red-200'
                                }`}>
                                <div className="flex items-center">
                                    {validation.isValid ? (
                                        <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
                                    ) : (
                                        <AlertCircle className="h-6 w-6 text-red-600 mr-3" />
                                    )}
                                    <div>
                                        <div className={`text-lg font-semibold ${validation.isValid ? 'text-green-800' : 'text-red-800'
                                            }`}>
                                            {validation.isValid ? 'Ledger is Valid' : 'Ledger Issues Found'}
                                        </div>
                                        <div className={`text-sm ${validation.isValid ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                            {validation.isValid
                                                ? 'All ledger entries are properly balanced'
                                                : `${validation.errors?.length || 0} inconsistencies found`
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div className="font-medium mb-2">Current Balance</div>
                                <div className={`text-2xl font-bold ${validation.currentBalance > 0
                                    ? 'text-green-600'
                                    : validation.currentBalance < 0
                                        ? 'text-red-600'
                                        : 'text-gray-600'
                                    }`}>
                                    {formatCurrency(Math.abs(validation.currentBalance))}
                                    {validation.currentBalance > 0 && ' (Credit)'}
                                    {validation.currentBalance < 0 && ' (Debit)'}
                                </div>
                            </div>

                            {!validation.isValid && validation.errors?.length > 0 && (
                                <div>
                                    <div className="font-medium mb-2">Issues Found</div>
                                    <div className="space-y-2 max-h-60 overflow-auto">
                                        {validation.errors.map((error, index) => (
                                            <div key={index} className="p-3 bg-red-50 rounded border border-red-200">
                                                <div className="font-medium text-red-800">Entry ID: {error.entryId}</div>
                                                <div className="text-sm text-red-600">
                                                    Expected: {formatCurrency(error.expected)} |
                                                    Actual: {formatCurrency(error.actual)} |
                                                    Difference: {formatCurrency(error.difference)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="border-t pt-4">
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => {
                                        // Run repair if needed
                                        toast({
                                            title: 'Repair Started',
                                            description: 'Attempting to repair ledger inconsistencies...',
                                            variant: 'default',
                                        })
                                        setShowValidation(false)
                                    }}
                                    disabled={validation.isValid}
                                >
                                    Repair Ledger
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default StudentLedger