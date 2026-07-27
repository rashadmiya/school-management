// src/pages/Fees/StudentFees.jsx
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useGetFeeSummaryQuery, useGetStudentFeesQuery } from '@/features/apis/finance/feeApi'
import {
  AlertCircle,
  Calendar,
  DollarSign,
  Download,
  Eye,
  Search,
  User
} from 'lucide-react'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/formaters'
import { SESSION_OPTIONS } from '@/utils/constants'
import { useStudentSearch } from '@/hooks/useStudentSearch'

const StudentFees = () => {
  const [search, setSearch] = useState('')
  const [session, setSession] = useState(SESSION_OPTIONS[2].value)
  const [status, setStatus] = useState('')
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [showDetails, setShowDetails] = useState(false)

  // Fetch students
  // const { data: students, isLoading: studentsLoading } = useGetStudentsQuery({
  //   session,
  //   search: search || undefined,
  //   limit: 10,
  // })

  const {
    results: students,
    isLoading: studentsLoading
  } = useStudentSearch(search, {
    fields: 'name,rollNumber,religion',
    limit: 10,
  })

  // Fetch fees for selected student
  const { data: feesData, isLoading: feesLoading } = useGetStudentFeesQuery(
    selectedStudent ? { studentId: selectedStudent._id, session } : null,
    { skip: !selectedStudent }
  );

  const studentFees = feesData?.data || [];

  const { data: summaryData } = useGetFeeSummaryQuery(
    selectedStudent ? { studentId: selectedStudent._id, session } : null,
    { skip: !selectedStudent }
  )
  const feeSummary = summaryData?.data || {}

  const handleSelectStudent = (student) => {
    setSelectedStudent(student)
  }

  const renderFeeSummary = () => {
    if (!feeSummary) return null

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">
                {formatCurrency(feeSummary.totalFees)}
              </div>
              <div className="text-sm text-gray-500">Total Fees</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(feeSummary.totalPaid)}
              </div>
              <div className="text-sm text-gray-500">Total Paid</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(feeSummary.totalWaived)}
              </div>
              <div className="text-sm text-gray-500">Total Waived</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(feeSummary.totalDue)}
              </div>
              <div className="text-sm text-gray-500">Total Due</div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Student Fees</h1>
          <p className="text-muted-foreground">
            View and manage fees for individual students
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={session} onValueChange={setSession}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select session" />
            </SelectTrigger>
            <SelectContent>
              {SESSION_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Student Search and Selection */}
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
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {studentsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : students?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {students.map((student) => (
                  <Card
                    key={student._id}
                    className={`cursor-pointer transition-all hover:shadow-md ${selectedStudent?._id === student._id
                      ? 'ring-2 ring-primary'
                      : ''
                      }`}
                    onClick={() => handleSelectStudent(student)}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start space-x-4">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{student.name}</div>
                          <div className="text-sm text-gray-500">
                            Roll: {student.rollNumber} | Class: {student.class?.name}
                          </div>
                          <div className="flex items-center mt-2">
                            <Badge variant="outline" className="text-xs">
                              {student.feeCategory}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            setShowDetails(true)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <User className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-semibold">No students found</h3>
                <p className="text-gray-500">Try a different search term</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Student Fee Details */}
      {selectedStudent && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{selectedStudent.name}'s Fees</CardTitle>
                <div className="text-sm text-gray-500">
                  Roll: {selectedStudent.rollNumber} | Class: {selectedStudent.class?.name}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button>
                  <DollarSign className="mr-2 h-4 w-4" />
                  Receive Payment
                </Button>
                <Button variant="outline">
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Request Waiver
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Summary Cards */}
            {renderFeeSummary()}

            {/* Fees Table */}
            {feesLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : studentFees?.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fee Title</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Waived</TableHead>
                      <TableHead>Due</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentFees.map((fee) => (
                      <TableRow key={fee._id}>
                        <TableCell>
                          <div className="font-medium">{fee.feeTemplate?.title}</div>
                          <div className="text-sm text-gray-500">{fee.feeTemplate?.description}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                            {formatDate(fee.dueDate)}
                          </div>
                          {new Date(fee.dueDate) < new Date() && fee.status !== 'paid' && (
                            <div className="text-xs text-red-500">Overdue</div>
                          )}
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
                          <div className="text-blue-600">
                            {formatCurrency(fee.waivedAmount)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold">
                            {formatCurrency(fee.dueAmount)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(fee.status)}>
                            {fee.status.charAt(0).toUpperCase() + fee.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                // Navigate to payment page
                              }}
                            >
                              Pay
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                // Navigate to waiver page
                              }}
                            >
                              Waive
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
                <h3 className="mt-4 text-lg font-semibold">No fees found</h3>
                <p className="text-gray-500">This student has no fees for the selected session</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Student Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{selectedStudent.name}</h3>
                  <p className="text-gray-500">Roll: {selectedStudent.rollNumber}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Class</label>
                  <p className="font-medium">{selectedStudent.class?.name}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Section</label>
                  <p className="font-medium">{selectedStudent.section}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Fee Category</label>
                  <p className="font-medium">{selectedStudent.feeCategory}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Session</label>
                  <p className="font-medium">{selectedStudent.session}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default StudentFees