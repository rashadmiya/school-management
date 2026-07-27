// src/pages/Reports/OutstandingReport.jsx
import { useGetOutstandingFeesReportQuery } from '@/features/apis/finance/feeApi'
import { CLASS_OPTIONS, SECTION_OPTIONS, SESSION_OPTIONS } from '@/utils/constants'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency, formatDate } from '@/lib/formaters'
import {
    AlertCircle,
    Calendar,
    ChevronDown,
    ChevronUp,
    DollarSign,
    Download,
    Eye,
    Filter,
    Mail,
    Phone,
    TrendingDown,
    Users
} from 'lucide-react'
import { useState } from 'react'
import { useGetStudentsQuery } from '@/features/apis/studentsApi'

const OutstandingReport = () => {
  const [session, setSession] = useState(SESSION_OPTIONS[1].value)
  const [classId, setClassId] = useState('')
  const [sectionId, setSectionId] = useState('')
  const [overdueOnly, setOverdueOnly] = useState(false)
  const [sortBy, setSortBy] = useState('amount') // amount, date, name
  const [sortOrder, setSortOrder] = useState('desc') // asc, desc
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [showStudentDetails, setShowStudentDetails] = useState(false)

  const { data: reportData, isLoading } = useGetOutstandingFeesReportQuery({
    session,
    classId: classId || undefined,
    sectionId: sectionId || undefined,
    overdueOnly,
  })

  const { data: students } = useGetStudentsQuery({
    session,
    classId: classId || undefined,
    sectionId: sectionId || undefined,
    limit: 1000,
  })

  // Process data for display
  const processedData = reportData?.map(item => {
    const student = students?.find(s => s._id === item.studentId)
    return {
      ...item,
      student,
    }
  }) || []

  // Sort data
  const sortedData = [...processedData].sort((a, b) => {
    let comparison = 0
    
    switch (sortBy) {
      case 'amount':
        comparison = b.totalOutstanding - a.totalOutstanding
        break
      case 'date':
        const aDate = new Date(a.oldestDueDate || 0)
        const bDate = new Date(b.oldestDueDate || 0)
        comparison = bDate - aDate
        break
      case 'name':
        comparison = (a.student?.name || '').localeCompare(b.student?.name || '')
        break
      default:
        comparison = 0
    }
    
    return sortOrder === 'desc' ? comparison : -comparison
  })

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
  }

  const handleViewStudent = (student) => {
    setSelectedStudent(student)
    setShowStudentDetails(true)
  }

  const handleExport = () => {
    // Export functionality
    console.log('Exporting outstanding report...')
  }

  const handleSendReminders = () => {
    // Send reminders functionality
    console.log('Sending reminders...')
  }

  const totalOutstanding = sortedData.reduce((sum, item) => sum + item.totalOutstanding, 0)
  const totalStudents = sortedData.length
  const totalOverdue = sortedData.filter(item => item.hasOverdue).length
  const averageOutstanding = totalStudents > 0 ? totalOutstanding / totalStudents : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Outstanding Fees Report</h1>
          <p className="text-muted-foreground">
            Track and manage overdue fee payments
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleSendReminders}>
            <Mail className="mr-2 h-4 w-4" />
            Send Reminders
          </Button>
          <Button onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
            <div>
              <label className="block text-sm font-medium mb-2">Class</label>
              <Select value={classId} onValueChange={setClassId}>
                <SelectTrigger>
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Classes</SelectItem>
                  {CLASS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Section</label>
              <Select value={sectionId} onValueChange={setSectionId}>
                <SelectTrigger>
                  <SelectValue placeholder="All Sections" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Sections</SelectItem>
                  {SECTION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <Select value={overdueOnly ? 'overdue' : 'all'} onValueChange={(value) => setOverdueOnly(value === 'overdue')}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Outstanding</SelectItem>
                  <SelectItem value="overdue">Overdue Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button className="w-full">
                <Filter className="mr-2 h-4 w-4" />
                Generate Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {formatCurrency(totalOutstanding)}
            </div>
            <p className="text-xs text-gray-500">
              Across {totalStudents} student(s)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students with Dues</CardTitle>
            <Users className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {totalStudents}
            </div>
            <p className="text-xs text-gray-500">
              {totalOverdue} with overdue fees
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Outstanding</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {formatCurrency(averageOutstanding)}
            </div>
            <p className="text-xs text-gray-500">
              Per student
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Oldest Overdue</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {sortedData.length > 0 && sortedData[0].oldestDueDate
                ? formatDate(sortedData[0].oldestDueDate, 'dd MMM')
                : 'N/A'
              }
            </div>
            <p className="text-xs text-gray-500">
              From {sortedData[0]?.student?.name || 'N/A'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Outstanding Fees Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Outstanding Fees Details</CardTitle>
            <div className="text-sm text-gray-500">
              Total: {formatCurrency(totalOutstanding)}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : sortedData.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-semibold">No outstanding fees found</h3>
              <p className="text-gray-500">All fees are paid or no students found with selected filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort('amount')}
                    >
                      <div className="flex items-center">
                        Outstanding Amount
                        {sortBy === 'amount' && (
                          sortOrder === 'desc' 
                            ? <ChevronDown className="ml-1 h-4 w-4" />
                            : <ChevronUp className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead>Fee Count</TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort('date')}
                    >
                      <div className="flex items-center">
                        Oldest Due Date
                        {sortBy === 'date' && (
                          sortOrder === 'desc' 
                            ? <ChevronDown className="ml-1 h-4 w-4" />
                            : <ChevronUp className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead>Overdue</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedData.map((item, index) => (
                    <TableRow key={item.studentId || index}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{item.student?.name}</div>
                            <div className="text-sm text-gray-500">
                              Roll: {item.student?.rollNumber} | Class: {item.student?.class?.name}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-red-600">
                          {formatCurrency(item.totalOutstanding)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-center">
                          <div className="font-medium">{item.feeCount}</div>
                          <div className="text-xs text-gray-500">fees</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                          {item.oldestDueDate ? (
                            <div>
                              <div>{formatDate(item.oldestDueDate)}</div>
                              {new Date(item.oldestDueDate) < new Date() && (
                                <div className="text-xs text-red-500">Overdue</div>
                              )}
                            </div>
                          ) : (
                            <div className="text-gray-400">N/A</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.hasOverdue ? (
                          <Badge className="bg-red-100 text-red-800">
                            <AlertCircle className="mr-1 h-3 w-3" />
                            Overdue
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-500">
                            Not Overdue
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="text-gray-500">Parent: {item.student?.parent?.name || 'N/A'}</div>
                          <div className="text-gray-500">Phone: {item.student?.guardianContact || 'N/A'}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewStudent(item.student)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Navigate to student fees
                            }}
                          >
                            View Fees
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Send reminder
                            }}
                          >
                            <Mail className="mr-2 h-4 w-4" />
                            Remind
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

      {/* Class-wise Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Class-wise Outstanding Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {CLASS_OPTIONS.slice(0, 10).map((classOption) => {
              const classData = sortedData.filter(item => 
                item.student?.class?.name === classOption.label
              )
              const classTotal = classData.reduce((sum, item) => sum + item.totalOutstanding, 0)
              const classCount = classData.length
              
              return (
                <div key={classOption.value} className="text-center p-4 border rounded-lg">
                  <div className="text-sm font-medium text-gray-500">{classOption.label}</div>
                  <div className="text-2xl font-bold text-red-600 mt-2">
                    {formatCurrency(classTotal)}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {classCount} student{classCount !== 1 ? 's' : ''}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="mr-2 h-5 w-5 text-yellow-600" />
              High Priority
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sortedData
                .filter(item => item.totalOutstanding > 50000 && item.hasOverdue)
                .slice(0, 3)
                .map((item, index) => (
                  <div key={index} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="font-medium text-yellow-800">{item.student?.name}</div>
                    <div className="text-sm text-yellow-600">
                      {formatCurrency(item.totalOutstanding)} | {item.feeCount} fees
                    </div>
                  </div>
                ))}
              {sortedData.filter(item => item.totalOutstanding > 50000 && item.hasOverdue).length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  No high priority cases
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Phone className="mr-2 h-5 w-5 text-blue-600" />
              Contact Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button className="w-full" variant="outline">
                <Mail className="mr-2 h-4 w-4" />
                Email All Parents
              </Button>
              <Button className="w-full" variant="outline">
                <Phone className="mr-2 h-4 w-4" />
                Call Overdue Students
              </Button>
              <Button className="w-full" variant="outline">
                Download Contact List
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Report Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Top 3 Classes:</span>
                <span className="font-medium">10A, 9B, 11C</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Largest Single Due:</span>
                <span className="font-medium text-red-600">
                  {sortedData.length > 0 ? formatCurrency(sortedData[0].totalOutstanding) : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Overdue Percentage:</span>
                <span className="font-medium">
                  {totalStudents > 0 ? Math.round((totalOverdue / totalStudents) * 100) : 0}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Collection Target:</span>
                <span className="font-medium text-green-600">
                  {formatCurrency(totalOutstanding * 0.7)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Student Details Dialog */}
      <Dialog open={showStudentDetails} onOpenChange={setShowStudentDetails}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-6">
              {/* Student Info */}
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{selectedStudent.name}</h3>
                  <p className="text-gray-500">
                    Roll: {selectedStudent.rollNumber} | Class: {selectedStudent.class?.name} | Section: {selectedStudent.section}
                  </p>
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Parent/Guardian</label>
                  <p className="font-medium">{selectedStudent.parent?.name || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Contact Number</label>
                  <p className="font-medium">{selectedStudent.guardianContact || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Email</label>
                  <p className="font-medium">{selectedStudent.parent?.email || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Fee Category</label>
                  <Badge variant="outline">{selectedStudent.feeCategory}</Badge>
                </div>
              </div>

              {/* Outstanding Summary */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Outstanding Summary</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <div>
                      <div className="font-medium text-red-800">Total Outstanding</div>
                      <div className="text-sm text-red-600">Includes all unpaid fees</div>
                    </div>
                    <div className="text-2xl font-bold text-red-600">
                      {formatCurrency(
                        sortedData.find(item => item.studentId === selectedStudent._id)?.totalOutstanding || 0
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t pt-4 flex justify-end space-x-3">
                <Button variant="outline">
                  <Phone className="mr-2 h-4 w-4" />
                  Call Parent
                </Button>
                <Button variant="outline">
                  <Mail className="mr-2 h-4 w-4" />
                  Send Email
                </Button>
                <Button>
                  <DollarSign className="mr-2 h-4 w-4" />
                  Receive Payment
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default OutstandingReport