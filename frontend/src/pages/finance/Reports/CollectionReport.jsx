// src/pages/Reports/CollectionReport.jsx - UPDATED VERSION
import { useGetPaymentCollectionReportQuery } from '@/features/apis/finance/paymentApi'
import { CLASS_OPTIONS, PAYMENT_METHODS, SESSION_OPTIONS } from '@/utils/constants'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useGetFeeCollectionReportQuery } from '@/features/apis/finance/feeApi'
import { formatCurrency, formatDate } from '@/lib/formaters'
import {
  BarChart3,
  Calendar,
  CreditCard,
  DollarSign,
  Download,
  Filter,
  PieChart,
  TrendingUp,
  Users
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useCurrentSession } from '@/hooks/useCurrentSession'

const CollectionReport = () => {
  // const [session, setSession] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [method, setMethod] = useState('')
  const [classId, setClassId] = useState('')
  const [reportType, setReportType] = useState('daily')


    const {
      selectedSession,
      isLoading: sessionLoading,
      updateSession
    } = useCurrentSession()

  // Set default dates to current month
  useEffect(() => {
    const today = new Date()
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)

    setStartDate(firstDay.toISOString().split('T')[0])
    setEndDate(lastDay.toISOString().split('T')[0])
  }, [])

  const { data: collectionData, isLoading: isLoadingPayments, refetch: refetchPayments } = useGetPaymentCollectionReportQuery({
    selectedSession,
    startDate,
    endDate,
    method: method || undefined,
    classId: classId || undefined,
  })

  const { data: feeData, isLoading: isLoadingFees, refetch: refetchFees } = useGetFeeCollectionReportQuery({
    selectedSession,
    startDate,
    endDate,
    classId: classId || undefined,
  });

  // Calculate real data from API response
  const realData = {
    totalAmount: collectionData?.data?.totalAmount || 0,
    totalTransactions: collectionData?.data?.totalTransactions || 0,
    averageTransaction: collectionData?.data?.averageTransaction || 0,
    collectionRate: collectionData?.data?.collectionRate || 0,
    byMethod: collectionData?.data?.byMethod || [],
    dailyCollection: collectionData?.data?.dailyCollection || [],
    topStudents: collectionData?.data?.topStudents || [],
    
    // Additional fee data
    feeSummary: feeData?.data?.summary || {
      totalGenerated: 0,
      totalPaid: 0,
      totalDue: 0,
      totalWaived: 0,
      totalAdvanceUsed: 0,
      count: 0,
      paidCount: 0,
      collectionRate: 0
    },
    statusDistribution: feeData?.data?.statusDistribution || [],
    classWise: feeData?.data?.classWise || []
  }

  // Calculate top performing class from fee data
  const topPerformingClass = realData.classWise.length > 0 
    ? realData.classWise.reduce((max, current) => 
        current.totalPaid > max.totalPaid ? current : max
      )
    : { className: 'N/A', totalPaid: 0 };

  // Calculate highest and lowest collection days
  const highestCollectionDay = realData.dailyCollection.length > 0
    ? realData.dailyCollection.reduce((max, current) => 
        current.amount > max.amount ? current : max
      )
    : { date: new Date(), amount: 0, transactions: 0 };

  const lowestCollectionDay = realData.dailyCollection.length > 0
    ? realData.dailyCollection.reduce((min, current) => 
        current.amount < min.amount ? current : min
      )
    : { date: new Date(), amount: 0, transactions: 0 };

  // Calculate busiest day
  const busiestDay = realData.dailyCollection.length > 0
    ? realData.dailyCollection.reduce((max, current) => 
        current.transactions > max.transactions ? current : max
      )
    : { date: new Date(), amount: 0, transactions: 0 };

  // Calculate average daily collection
  const averageDailyCollection = realData.dailyCollection.length > 0
    ? realData.dailyCollection.reduce((sum, day) => sum + day.amount, 0) / realData.dailyCollection.length
    : 0;

  const handleExport = () => {
    // Export functionality
    console.log('Exporting report with real data:', realData);
    // You can implement CSV/Excel export here
  }

  const handleGenerateReport = () => {
    refetchPayments();
    refetchFees();
  }

  const getMethodLabel = (methodValue) => {
    return PAYMENT_METHODS.find(m => m.value === methodValue)?.label || methodValue
  }

  const getStatusLabel = (status) => {
    const statusMap = {
      'paid': { label: 'Paid', color: 'bg-green-100 text-green-800' },
      'unpaid': { label: 'Unpaid', color: 'bg-red-100 text-red-800' },
      'partial': { label: 'Partial', color: 'bg-yellow-100 text-yellow-800' },
      'overdue': { label: 'Overdue', color: 'bg-orange-100 text-orange-800' },
      'waived': { label: 'Waived', color: 'bg-purple-100 text-purple-800' }
    };
    return statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
  }

  if (isLoadingPayments || isLoadingFees) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading collection report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Collection Report</h1>
          <p className="text-muted-foreground">
            Analyze fee collection patterns and trends
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={handleExport} disabled={realData.totalAmount === 0}>
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
              <label className="block text-sm font-medium mb-2">Session</label>
              <Select value={selectedSession} onValueChange={updateSession}>
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
              <label className="block text-sm font-medium mb-2">Payment Method</label>
              <Select value={method ?? 'all'}
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
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Class</label>
              <Select value={classId ?? 'all'}
                onValueChange={(value => setClassId(value === 'all' ? '' : value))}>
                <SelectTrigger>
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {CLASS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue placeholder="Report Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily Collection</SelectItem>
                <SelectItem value="monthly">Monthly Summary</SelectItem>
                <SelectItem value="yearly">Yearly Overview</SelectItem>
                <SelectItem value="method">By Payment Method</SelectItem>
              </SelectContent>
            </Select>
            <div className="md:col-span-3 flex items-end">
              <Button onClick={handleGenerateReport} className="w-full">
                <Filter className="mr-2 h-4 w-4" />
                Generate Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Collection</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {formatCurrency(realData.totalAmount)}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {realData.totalTransactions} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {realData.totalTransactions}
            </div>
            <p className="text-sm text-gray-500">
              Avg: {formatCurrency(realData.averageTransaction)} per transaction
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {realData.collectionRate.toFixed(1)}%
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(realData.collectionRate, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Performing</CardTitle>
            <Users className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {topPerformingClass.className}
            </div>
            <p className="text-sm text-gray-500">
              {formatCurrency(topPerformingClass.totalPaid)} collected
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Collection by Method */}
      <Card>
        <CardHeader>
          <CardTitle>Collection by Payment Method</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {realData.byMethod.length > 0 ? (
                realData.byMethod.map((item, index) => (
                  <div key={index} className="text-center p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="text-sm text-gray-500 mb-1">
                      {getMethodLabel(item.method)}
                    </div>
                    <div className="text-2xl font-bold">
                      {formatCurrency(item.amount)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {item.count} transactions
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {item.percentage.toFixed(1)}% of total
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-5 text-center py-8 text-gray-500">
                  No payment method data available
                </div>
              )}
            </div>

            {/* Pie Chart Visualization */}
            {realData.byMethod.length > 0 ? (
              <div className="h-64 flex items-center justify-center border rounded-lg bg-gray-50">
                <div className="text-center">
                  <PieChart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Payment Method Distribution</p>
                  <div className="mt-4 space-y-1">
                    {realData.byMethod.map((item, index) => (
                      <div key={index} className="flex items-center justify-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2" 
                          style={{ 
                            backgroundColor: `hsl(${index * 60}, 70%, 60%)` 
                          }}
                        />
                        <span className="text-sm">
                          {getMethodLabel(item.method)}: {item.percentage.toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* Daily Collection */}
      {reportType === 'daily' && (
        <Card>
          <CardHeader>
            <CardTitle>Daily Collection Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {realData.dailyCollection.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Amount Collected</TableHead>
                      <TableHead className="text-right">Transactions</TableHead>
                      <TableHead className="text-right">Average</TableHead>
                      <TableHead>Trend</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {realData.dailyCollection.map((day, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="flex items-center">
                            <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                            {formatDate(day.date, 'dd MMM')}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(day.amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          {day.transactions}
                        </TableCell>
                        <TableCell className="text-right text-gray-500">
                          {formatCurrency(day.amount / day.transactions)}
                        </TableCell>
                        <TableCell>
                          <Badge className={
                            index > 0 && day.amount > realData.dailyCollection[index - 1].amount
                              ? 'bg-green-100 text-green-800'
                              : index > 0
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                          }>
                            {index > 0 && day.amount > realData.dailyCollection[index - 1].amount
                              ? '↑ Up'
                              : index > 0
                                ? '↓ Down'
                                : '–'
                            }
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No daily collection data available for the selected period
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Fee Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Fee Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {realData.statusDistribution.map((status, index) => {
                const statusInfo = getStatusLabel(status._id);
                const percentage = (status.count / realData.feeSummary.count) * 100;
                
                return (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={statusInfo.color}>
                        {statusInfo.label}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="text-2xl font-bold">
                      {status.count}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatCurrency(status.totalAmount)}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className={`h-2 rounded-full ${statusInfo.color.split(' ')[0]}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Students */}
      <Card>
        <CardHeader>
          <CardTitle>Top Contributing Students</CardTitle>
        </CardHeader>
        <CardContent>
          {realData.topStudents.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead className="text-right">Total Paid</TableHead>
                    <TableHead className="text-right">Payments</TableHead>
                    <TableHead className="text-right">Average Payment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {realData.topStudents.map((student, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10">
                          <span className="font-bold">{index + 1}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{student.name}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{student.class}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold text-green-600">
                        {formatCurrency(student.amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {student.payments}
                      </TableCell>
                      <TableCell className="text-right text-gray-500">
                        {formatCurrency(student.amount / student.payments)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No student payment data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Collection Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            {realData.dailyCollection.length > 0 ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Highest Collection Day</span>
                  <span className="font-medium">
                    {formatDate(highestCollectionDay.date, 'dd MMM')}: {formatCurrency(highestCollectionDay.amount)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Lowest Collection Day</span>
                  <span className="font-medium">
                    {formatDate(lowestCollectionDay.date, 'dd MMM')}: {formatCurrency(lowestCollectionDay.amount)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Busiest Day (Transactions)</span>
                  <span className="font-medium">
                    {formatDate(busiestDay.date, 'dd MMM')}: {busiestDay.transactions} transactions
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Average Daily Collection</span>
                  <span className="font-medium">{formatCurrency(averageDailyCollection)}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No statistics available for the selected period
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="font-medium text-green-800">Collection Rate</div>
                <div className="text-sm text-green-600">
                  {realData.collectionRate > 50 
                    ? `Strong collection at ${realData.collectionRate.toFixed(1)}% rate`
                    : `Collection rate is ${realData.collectionRate.toFixed(1)}%, needs improvement`}
                </div>
              </div>
              
              {realData.byMethod.length > 0 && (
                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="font-medium text-yellow-800">Preferred Payment Method</div>
                  <div className="text-sm text-yellow-600">
                    {getMethodLabel(realData.byMethod[0].method)} is the most used method at {realData.byMethod[0].percentage.toFixed(1)}%
                  </div>
                </div>
              )}
              
              {realData.topStudents.length > 0 && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="font-medium text-blue-800">Top Contributor</div>
                  <div className="text-sm text-blue-600">
                    {realData.topStudents[0].name} contributed {formatCurrency(realData.topStudents[0].amount)} across {realData.topStudents[0].payments} payments
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fee Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Fee Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-gray-500 mb-1">Total Generated</div>
              <div className="text-2xl font-bold">
                {formatCurrency(realData.feeSummary.totalGenerated)}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {realData.feeSummary.count} fee instances
              </div>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-gray-500 mb-1">Total Collected</div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(realData.feeSummary.totalPaid + realData.feeSummary.totalAdvanceUsed)}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {realData.feeSummary.paidCount} paid instances
              </div>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-gray-500 mb-1">Total Due</div>
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(realData.feeSummary.totalDue)}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Pending collection
              </div>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-gray-500 mb-1">Total Waived</div>
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(realData.feeSummary.totalWaived)}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Approved waivers
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default CollectionReport

// // src/pages/Reports/CollectionReport".jsx

// import { useGetPaymentCollectionReportQuery } from '@/features/apis/finance/paymentApi'
// import { CLASS_OPTIONS, PAYMENT_METHODS, SESSION_OPTIONS } from '@/utils/constants'
// import { Badge } from '@/components/ui/badge'
// import { Button } from '@/components/ui/button'
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
// import { Input } from '@/components/ui/input'
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
// import { useGetFeeCollectionReportQuery } from '@/features/apis/finance/feeApi'
// import { formatCurrency, formatDate } from '@/lib/formaters'
// import {
//   BarChart3,
//   Calendar,
//   CreditCard,
//   DollarSign,
//   Download,
//   Filter,
//   PieChart,
//   TrendingUp,
//   Users
// } from 'lucide-react'
// import { useState } from 'react'

// const CollectionReport = () => {
//   const [session, setSession] = useState(SESSION_OPTIONS[1].value)
//   const [startDate, setStartDate] = useState('')
//   const [endDate, setEndDate] = useState('')
//   const [method, setMethod] = useState('')
//   const [classId, setClassId] = useState('')
//   const [reportType, setReportType] = useState('daily') // daily, monthly, yearly, method

//   // Set default dates to current month
//   useState(() => {
//     const today = new Date()
//     const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
//     const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)

//     setStartDate(firstDay.toISOString().split('T')[0])
//     setEndDate(lastDay.toISOString().split('T')[0])
//   }, [])

//   const { data: collectionData, isLoading } = useGetPaymentCollectionReportQuery({
//     session,
//     startDate,
//     endDate,
//     method: method || undefined,
//     classId: classId || undefined,
//   })

//   const { data: feeData } = useGetFeeCollectionReportQuery({
//     session,
//     startDate,
//     endDate,
//     classId: classId || undefined,
//   });

//   console.log("collectionData:", collectionData);
//   console.log("feeData:", feeData);

//   // Mock data for demonstration
//   const mockData = {
//     totalAmount: collectionData?.totalAmount || 1250000,
//     totalTransactions: collectionData?.totalTransactions || 345,
//     averageTransaction: collectionData?.totalAmount && collectionData?.totalTransactions
//       ? collectionData.totalAmount / collectionData.totalTransactions
//       : 3623,
//     collectionRate: 85,
//     byMethod: [
//       { method: 'cash', amount: 450000, count: 120, percentage: 36 },
//       { method: 'bank_transfer', amount: 380000, count: 85, percentage: 30.4 },
//       { method: 'mobile_banking', amount: 250000, count: 95, percentage: 20 },
//       { method: 'check', amount: 120000, count: 35, percentage: 9.6 },
//       { method: 'other', amount: 50000, count: 10, percentage: 4 },
//     ],
//     dailyCollection: Array.from({ length: 30 }, (_, i) => ({
//       date: new Date(new Date().setDate(new Date().getDate() - i)),
//       amount: Math.floor(Math.random() * 50000) + 10000,
//       transactions: Math.floor(Math.random() * 20) + 5,
//     })).reverse(),
//     topStudents: [
//       { name: 'John Doe', class: '10A', amount: 75000, payments: 3 },
//       { name: 'Jane Smith', class: '9B', amount: 68000, payments: 2 },
//       { name: 'Bob Johnson', class: '11C', amount: 62000, payments: 1 },
//       { name: 'Alice Brown', class: '8A', amount: 58000, payments: 2 },
//       { name: 'Charlie Wilson', class: '12A', amount: 55000, payments: 3 },
//     ],
//   }

//   const handleExport = () => {
//     // Export functionality
//     console.log('Exporting report...')
//   }

//   const getMethodLabel = (methodValue) => {
//     return PAYMENT_METHODS.find(m => m.value === methodValue)?.label || methodValue
//   }

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-3xl font-bold tracking-tight">Collection Report</h1>
//           <p className="text-muted-foreground">
//             Analyze fee collection patterns and trends
//           </p>
//         </div>
//         <div className="flex items-center space-x-2">
//           <Button onClick={handleExport}>
//             <Download className="mr-2 h-4 w-4" />
//             Export Report
//           </Button>
//         </div>
//       </div>

//       {/* Filters */}
//       <Card>
//         <CardContent className="pt-6">
//           <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
//             <div>
//               <label className="block text-sm font-medium mb-2">From Date</label>
//               <Input
//                 type="date"
//                 value={startDate}
//                 onChange={(e) => setStartDate(e.target.value)}
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium mb-2">To Date</label>
//               <Input
//                 type="date"
//                 value={endDate}
//                 onChange={(e) => setEndDate(e.target.value)}
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium mb-2">Session</label>
//               <Select value={session} onValueChange={setSession}>
//                 <SelectTrigger>
//                   <SelectValue placeholder="Session" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   {SESSION_OPTIONS.map((option) => (
//                     <SelectItem key={option.value} value={option.value}>
//                       {option.label}
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//             </div>
//             <div>
//               <label className="block text-sm font-medium mb-2">Payment Method</label>
//               <Select value={method ?? 'all'}
//                 onValueChange={(value => setMethod(value === 'all' ? '' : value))}>
//                 <SelectTrigger>
//                   <SelectValue placeholder="All Methods" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="all">All Methods</SelectItem>
//                   {PAYMENT_METHODS.map((option) => (
//                     <SelectItem key={option.value} value={option.value}>
//                       {option.label}
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//             </div>
//             <div>
//               <label className="block text-sm font-medium mb-2">Class</label>
//               <Select value={classId ?? 'all'}
//                 onValueChange={(value => setClassId(value === 'all' ? '' : value))}>
//                 <SelectTrigger>
//                   <SelectValue placeholder="All Classes" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="all">All Classes</SelectItem>
//                   {CLASS_OPTIONS.map((option) => (
//                     <SelectItem key={option.value} value={option.value}>
//                       {option.label}
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//             </div>
//           </div>
//           <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
//             <Select value={reportType} onValueChange={setReportType}>
//               <SelectTrigger>
//                 <SelectValue placeholder="Report Type" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="daily">Daily Collection</SelectItem>
//                 <SelectItem value="monthly">Monthly Summary</SelectItem>
//                 <SelectItem value="yearly">Yearly Overview</SelectItem>
//                 <SelectItem value="method">By Payment Method</SelectItem>
//               </SelectContent>
//             </Select>
//             <div className="md:col-span-3 flex items-end">
//               <Button className="w-full">
//                 <Filter className="mr-2 h-4 w-4" />
//                 Generate Report
//               </Button>
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Summary Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">Total Collection</CardTitle>
//             <DollarSign className="h-4 w-4 text-green-600" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-3xl font-bold text-green-600">
//               {formatCurrency(mockData.totalAmount)}
//             </div>
//             <div className="flex items-center text-sm text-green-600 mt-1">
//               <TrendingUp className="mr-1 h-4 w-4" />
//               +12.5% from last period
//             </div>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
//             <CreditCard className="h-4 w-4 text-blue-600" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-3xl font-bold text-blue-600">
//               {mockData.totalTransactions}
//             </div>
//             <p className="text-sm text-gray-500">
//               Avg: {formatCurrency(mockData.averageTransaction)} per transaction
//             </p>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
//             <BarChart3 className="h-4 w-4 text-purple-600" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-3xl font-bold text-purple-600">
//               {mockData.collectionRate}%
//             </div>
//             <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
//               <div
//                 className="bg-purple-600 h-2 rounded-full"
//                 style={{ width: `${mockData.collectionRate}%` }}
//               />
//             </div>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">Top Performing</CardTitle>
//             <Users className="h-4 w-4 text-orange-600" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-3xl font-bold text-orange-600">
//               Class 10A
//             </div>
//             <p className="text-sm text-gray-500">
//               {formatCurrency(450000)} collected
//             </p>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Collection by Method */}
//       <Card>
//         <CardHeader>
//           <CardTitle>Collection by Payment Method</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <div className="space-y-4">
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
//               {mockData.byMethod.map((item, index) => (
//                 <div key={index} className="text-center p-4 border rounded-lg">
//                   <div className="text-sm text-gray-500 mb-1">
//                     {getMethodLabel(item.method)}
//                   </div>
//                   <div className="text-2xl font-bold">
//                     {formatCurrency(item.amount)}
//                   </div>
//                   <div className="text-sm text-gray-500">
//                     {item.count} transactions
//                   </div>
//                   <div className="text-xs text-gray-400 mt-1">
//                     {item.percentage}% of total
//                   </div>
//                 </div>
//               ))}
//             </div>

//             {/* Pie Chart Visualization (mock) */}
//             <div className="h-64 flex items-center justify-center border rounded-lg bg-gray-50">
//               <div className="text-center">
//                 <PieChart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
//                 <p className="text-gray-500">Payment Method Distribution</p>
//                 <p className="text-sm text-gray-400">Visual chart would appear here</p>
//               </div>
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Daily Collection */}
//       {reportType === 'daily' && (
//         <Card>
//           <CardHeader>
//             <CardTitle>Daily Collection Trend</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="overflow-x-auto">
//               <Table>
//                 <TableHeader>
//                   <TableRow>
//                     <TableHead>Date</TableHead>
//                     <TableHead className="text-right">Amount Collected</TableHead>
//                     <TableHead className="text-right">Transactions</TableHead>
//                     <TableHead className="text-right">Average</TableHead>
//                     <TableHead>Trend</TableHead>
//                   </TableRow>
//                 </TableHeader>
//                 <TableBody>
//                   {mockData.dailyCollection.map((day, index) => (
//                     <TableRow key={index}>
//                       <TableCell>
//                         <div className="flex items-center">
//                           <Calendar className="mr-2 h-4 w-4 text-gray-400" />
//                           {formatDate(day.date, 'dd MMM')}
//                         </div>
//                       </TableCell>
//                       <TableCell className="text-right font-medium">
//                         {formatCurrency(day.amount)}
//                       </TableCell>
//                       <TableCell className="text-right">
//                         {day.transactions}
//                       </TableCell>
//                       <TableCell className="text-right text-gray-500">
//                         {formatCurrency(day.amount / day.transactions)}
//                       </TableCell>
//                       <TableCell>
//                         <Badge className={
//                           index > 0 && day.amount > mockData.dailyCollection[index - 1].amount
//                             ? 'bg-green-100 text-green-800'
//                             : index > 0
//                               ? 'bg-red-100 text-red-800'
//                               : 'bg-gray-100 text-gray-800'
//                         }>
//                           {index > 0 && day.amount > mockData.dailyCollection[index - 1].amount
//                             ? '↑ Up'
//                             : index > 0
//                               ? '↓ Down'
//                               : '–'
//                           }
//                         </Badge>
//                       </TableCell>
//                     </TableRow>
//                   ))}
//                 </TableBody>
//               </Table>
//             </div>
//           </CardContent>
//         </Card>
//       )}

//       {/* Top Students */}
//       <Card>
//         <CardHeader>
//           <CardTitle>Top Contributing Students</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <div className="overflow-x-auto">
//             <Table>
//               <TableHeader>
//                 <TableRow>
//                   <TableHead>Rank</TableHead>
//                   <TableHead>Student</TableHead>
//                   <TableHead>Class</TableHead>
//                   <TableHead className="text-right">Total Paid</TableHead>
//                   <TableHead className="text-right">Payments</TableHead>
//                   <TableHead className="text-right">Average Payment</TableHead>
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {mockData.topStudents.map((student, index) => (
//                   <TableRow key={index}>
//                     <TableCell>
//                       <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10">
//                         <span className="font-bold">{index + 1}</span>
//                       </div>
//                     </TableCell>
//                     <TableCell>
//                       <div className="font-medium">{student.name}</div>
//                     </TableCell>
//                     <TableCell>
//                       <Badge variant="outline">{student.class}</Badge>
//                     </TableCell>
//                     <TableCell className="text-right font-bold text-green-600">
//                       {formatCurrency(student.amount)}
//                     </TableCell>
//                     <TableCell className="text-right">
//                       {student.payments}
//                     </TableCell>
//                     <TableCell className="text-right text-gray-500">
//                       {formatCurrency(student.amount / student.payments)}
//                     </TableCell>
//                   </TableRow>
//                 ))}
//               </TableBody>
//             </Table>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Summary Statistics */}
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//         <Card>
//           <CardHeader>
//             <CardTitle>Collection Statistics</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="space-y-4">
//               <div className="flex justify-between items-center">
//                 <span className="text-gray-600">Highest Collection Day</span>
//                 <span className="font-medium">15 Oct: {formatCurrency(85000)}</span>
//               </div>
//               <div className="flex justify-between items-center">
//                 <span className="text-gray-600">Lowest Collection Day</span>
//                 <span className="font-medium">22 Oct: {formatCurrency(12000)}</span>
//               </div>
//               <div className="flex justify-between items-center">
//                 <span className="text-gray-600">Busiest Day (Transactions)</span>
//                 <span className="font-medium">10 Oct: 45 transactions</span>
//               </div>
//               <div className="flex justify-between items-center">
//                 <span className="text-gray-600">Average Daily Collection</span>
//                 <span className="font-medium">{formatCurrency(41666)}</span>
//               </div>
//             </div>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader>
//             <CardTitle>Performance Insights</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="space-y-3">
//               <div className="p-3 bg-green-50 rounded-lg border border-green-200">
//                 <div className="font-medium text-green-800">Strong Collection</div>
//                 <div className="text-sm text-green-600">
//                   Collection rate improved by 8% compared to last month
//                 </div>
//               </div>
//               <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
//                 <div className="font-medium text-yellow-800">Mobile Banking Growth</div>
//                 <div className="text-sm text-yellow-600">
//                   Mobile payments increased by 15% this period
//                 </div>
//               </div>
//               <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
//                 <div className="font-medium text-blue-800">Weekend Collection</div>
//                 <div className="text-sm text-blue-600">
//                   Saturday collections are 25% higher than weekdays
//                 </div>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   )
// }

// export default CollectionReport