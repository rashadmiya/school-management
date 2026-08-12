// src/pages/Reports/CollectionReport.jsx - FIXED VERSION
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
import { useAppSelector } from '@/features/store'
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

// Theme hook
const useTheme = () => {
    const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
    return {
        isDarkMode,
        bg: isDarkMode ? "bg-gray-900" : "bg-white",
        text: isDarkMode ? "text-white" : "text-gray-900",
        textSecondary: isDarkMode ? "text-gray-300" : "text-gray-700",
        textMuted: isDarkMode ? "text-gray-400" : "text-gray-500",
        border: isDarkMode ? "border-gray-700" : "border-gray-200",
        bgCard: isDarkMode ? "bg-gray-900/50" : "bg-white",
        bgHover: isDarkMode ? "hover:bg-gray-800/50" : "hover:bg-gray-50",
        bgInput: isDarkMode ? "bg-gray-800" : "bg-white",
        borderInput: isDarkMode ? "border-gray-700" : "border-gray-300",
        focusRing: "focus:ring-blue-500 focus:border-blue-500",
        placeholder: isDarkMode ? "placeholder:text-gray-500" : "placeholder:text-gray-400",
        select: {
            trigger: isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900",
            content: isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white",
            item: isDarkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-900 hover:bg-gray-100",
        },
        badge: {
            outline: isDarkMode ? "border-gray-700 text-gray-300" : "",
            green: isDarkMode ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-green-100 text-green-800",
            red: isDarkMode ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-red-100 text-red-800",
            yellow: isDarkMode ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" : "bg-yellow-100 text-yellow-800",
            orange: isDarkMode ? "bg-orange-500/20 text-orange-400 border-orange-500/30" : "bg-orange-100 text-orange-800",
            purple: isDarkMode ? "bg-purple-500/20 text-purple-400 border-purple-500/30" : "bg-purple-100 text-purple-800",
            gray: isDarkMode ? "bg-gray-700 text-gray-300 border-gray-600" : "bg-gray-100 text-gray-800",
        },
        button: {
            primary: isDarkMode ? "bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-700 disabled:text-gray-400" : "bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300 disabled:text-gray-500",
            outline: isDarkMode ? "border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white" : "border-gray-300 text-gray-700 hover:bg-gray-50",
        },
        stat: {
            green: isDarkMode ? "text-emerald-400" : "text-green-600",
            blue: isDarkMode ? "text-blue-400" : "text-blue-600",
            purple: isDarkMode ? "text-purple-400" : "text-purple-600",
            orange: isDarkMode ? "text-orange-400" : "text-orange-600",
        },
        loading: isDarkMode ? "border-blue-400" : "border-blue-600",
        icon: isDarkMode ? "text-gray-400" : "text-gray-500",
        insight: {
            green: isDarkMode ? "bg-emerald-500/10 border-emerald-500/20" : "bg-green-50 border-green-200",
            greenText: isDarkMode ? "text-emerald-400" : "text-green-800",
            greenSub: isDarkMode ? "text-emerald-400/80" : "text-green-600",
            yellow: isDarkMode ? "bg-yellow-500/10 border-yellow-500/20" : "bg-yellow-50 border-yellow-200",
            yellowText: isDarkMode ? "text-yellow-400" : "text-yellow-800",
            yellowSub: isDarkMode ? "text-yellow-400/80" : "text-yellow-600",
            blue: isDarkMode ? "bg-blue-500/10 border-blue-500/20" : "bg-blue-50 border-blue-200",
            blueText: isDarkMode ? "text-blue-400" : "text-blue-800",
            blueSub: isDarkMode ? "text-blue-400/80" : "text-blue-600",
        },
        progress: {
            bg: isDarkMode ? "bg-gray-700" : "bg-gray-200",
        },
        chart: isDarkMode ? "bg-gray-800/50" : "bg-gray-50",
    };
};

const CollectionReport = () => {
    const theme = useTheme();
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [method, setMethod] = useState('all')
    const [classId, setClassId] = useState('all')
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
        method: method === 'all' ? undefined : method,
        classId: classId === 'all' ? undefined : classId,
    })

    const { data: feeData, isLoading: isLoadingFees, refetch: refetchFees } = useGetFeeCollectionReportQuery({
        selectedSession,
        startDate,
        endDate,
        classId: classId === 'all' ? undefined : classId,
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

    const busiestDay = realData.dailyCollection.length > 0
        ? realData.dailyCollection.reduce((max, current) => 
            current.transactions > max.transactions ? current : max
        )
        : { date: new Date(), amount: 0, transactions: 0 };

    const averageDailyCollection = realData.dailyCollection.length > 0
        ? realData.dailyCollection.reduce((sum, day) => sum + day.amount, 0) / realData.dailyCollection.length
        : 0;

    const handleExport = () => {
        console.log('Exporting report with real data:', realData);
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
            'paid': { label: 'Paid', color: 'bg-green-100 text-green-800 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30' },
            'unpaid': { label: 'Unpaid', color: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30' },
            'partial': { label: 'Partial', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400 dark:border-yellow-500/30' },
            'overdue': { label: 'Overdue', color: 'bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-400 dark:border-orange-500/30' },
            'waived': { label: 'Waived', color: 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-400 dark:border-purple-500/30' }
        };
        return statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600' };
    }

    if (isLoadingPayments || isLoadingFees) {
        return (
            <div className={`flex items-center justify-center min-h-[400px] ${theme.textMuted}`}>
                <div className="text-center">
                    <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${theme.loading} mx-auto`}></div>
                    <p className="mt-4">Loading collection report...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`space-y-6 ${theme.text}`}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className={`text-3xl font-bold tracking-tight ${theme.text}`}>Collection Report</h1>
                    <p className={theme.textMuted}>
                        Analyze fee collection patterns and trends
                    </p>
                </div>
                <Button 
                    onClick={handleExport} 
                    disabled={realData.totalAmount === 0}
                    className={theme.button.primary}
                >
                    <Download className="mr-2 h-4 w-4" />
                    Export Report
                </Button>
            </div>

            {/* Filters */}
            <Card className={`${theme.bgCard} ${theme.border} shadow-sm`}>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div>
                            <label className={`block text-sm font-medium mb-2 ${theme.textSecondary}`}>From Date</label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className={`${theme.bgInput} ${theme.borderInput} ${theme.focusRing} text-gray-900 dark:text-white ${theme.placeholder}`}
                            />
                        </div>
                        <div>
                            <label className={`block text-sm font-medium mb-2 ${theme.textSecondary}`}>To Date</label>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className={`${theme.bgInput} ${theme.borderInput} ${theme.focusRing} text-gray-900 dark:text-white ${theme.placeholder}`}
                            />
                        </div>
                        <div>
                            <label className={`block text-sm font-medium mb-2 ${theme.textSecondary}`}>Session</label>
                            <Select value={selectedSession} onValueChange={updateSession}>
                                <SelectTrigger className={theme.select.trigger}>
                                    <SelectValue placeholder="Session" />
                                </SelectTrigger>
                                <SelectContent className={theme.select.content}>
                                    {SESSION_OPTIONS.map((option) => (
                                        <SelectItem key={option.value} value={option.value} className={theme.select.item}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className={`block text-sm font-medium mb-2 ${theme.textSecondary}`}>Payment Method</label>
                            <Select 
                                value={method} 
                                onValueChange={(value) => setMethod(value)}
                            >
                                <SelectTrigger className={theme.select.trigger}>
                                    <SelectValue placeholder="All Methods" />
                                </SelectTrigger>
                                <SelectContent className={theme.select.content}>
                                    <SelectItem value="all" className={theme.select.item}>All Methods</SelectItem>
                                    {PAYMENT_METHODS.map((option) => (
                                        <SelectItem key={option.value} value={option.value} className={theme.select.item}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className={`block text-sm font-medium mb-2 ${theme.textSecondary}`}>Class</label>
                            <Select 
                                value={classId} 
                                onValueChange={(value) => setClassId(value)}
                            >
                                <SelectTrigger className={theme.select.trigger}>
                                    <SelectValue placeholder="All Classes" />
                                </SelectTrigger>
                                <SelectContent className={theme.select.content}>
                                    <SelectItem value="all" className={theme.select.item}>All Classes</SelectItem>
                                    {CLASS_OPTIONS.map((option) => (
                                        <SelectItem key={option.value} value={option.value} className={theme.select.item}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                        <div>
                            <label className={`block text-sm font-medium mb-2 ${theme.textSecondary}`}>Report Type</label>
                            <Select value={reportType} onValueChange={setReportType}>
                                <SelectTrigger className={theme.select.trigger}>
                                    <SelectValue placeholder="Report Type" />
                                </SelectTrigger>
                                <SelectContent className={theme.select.content}>
                                    <SelectItem value="daily" className={theme.select.item}>Daily Collection</SelectItem>
                                    <SelectItem value="monthly" className={theme.select.item}>Monthly Summary</SelectItem>
                                    <SelectItem value="yearly" className={theme.select.item}>Yearly Overview</SelectItem>
                                    <SelectItem value="method" className={theme.select.item}>By Payment Method</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="md:col-span-3 flex items-end">
                            <Button onClick={handleGenerateReport} className={`w-full ${theme.button.primary}`}>
                                <Filter className="mr-2 h-4 w-4" />
                                Generate Report
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className={`${theme.bgCard} ${theme.border} shadow-sm`}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className={`text-sm font-medium ${theme.textSecondary}`}>Total Collection</CardTitle>
                        <DollarSign className={`h-4 w-4 ${theme.stat.green}`} />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-3xl font-bold ${theme.stat.green}`}>
                            {formatCurrency(realData.totalAmount)}
                        </div>
                        <p className={`text-sm ${theme.textMuted} mt-1`}>
                            {realData.totalTransactions} transactions
                        </p>
                    </CardContent>
                </Card>

                <Card className={`${theme.bgCard} ${theme.border} shadow-sm`}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className={`text-sm font-medium ${theme.textSecondary}`}>Total Transactions</CardTitle>
                        <CreditCard className={`h-4 w-4 ${theme.stat.blue}`} />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-3xl font-bold ${theme.stat.blue}`}>
                            {realData.totalTransactions}
                        </div>
                        <p className={`text-sm ${theme.textMuted}`}>
                            Avg: {formatCurrency(realData.averageTransaction)} per transaction
                        </p>
                    </CardContent>
                </Card>

                <Card className={`${theme.bgCard} ${theme.border} shadow-sm`}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className={`text-sm font-medium ${theme.textSecondary}`}>Collection Rate</CardTitle>
                        <BarChart3 className={`h-4 w-4 ${theme.stat.purple}`} />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-3xl font-bold ${theme.stat.purple}`}>
                            {realData.collectionRate.toFixed(1)}%
                        </div>
                        <div className={`w-full ${theme.progress.bg} rounded-full h-2 mt-2`}>
                            <div
                                className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(realData.collectionRate, 100)}%` }}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className={`${theme.bgCard} ${theme.border} shadow-sm`}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className={`text-sm font-medium ${theme.textSecondary}`}>Top Performing</CardTitle>
                        <Users className={`h-4 w-4 ${theme.stat.orange}`} />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-3xl font-bold ${theme.stat.orange}`}>
                            {topPerformingClass.className}
                        </div>
                        <p className={`text-sm ${theme.textMuted}`}>
                            {formatCurrency(topPerformingClass.totalPaid)} collected
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Collection by Method */}
            <Card className={`${theme.bgCard} ${theme.border} shadow-sm`}>
                <CardHeader>
                    <CardTitle className={theme.text}>Collection by Payment Method</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            {realData.byMethod.length > 0 ? (
                                realData.byMethod.map((item, index) => (
                                    <div key={index} className={`text-center p-4 border rounded-lg ${theme.border} hover:shadow-md transition-shadow`}>
                                        <div className={`text-sm ${theme.textMuted} mb-1`}>
                                            {getMethodLabel(item.method)}
                                        </div>
                                        <div className={`text-2xl font-bold ${theme.text}`}>
                                            {formatCurrency(item.amount)}
                                        </div>
                                        <div className={`text-sm ${theme.textMuted}`}>
                                            {item.count} transactions
                                        </div>
                                        <div className={`text-xs ${theme.textMuted} mt-1`}>
                                            {item.percentage.toFixed(1)}% of total
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className={`col-span-5 text-center py-8 ${theme.textMuted}`}>
                                    No payment method data available
                                </div>
                            )}
                        </div>

                        {/* Pie Chart Visualization */}
                        {realData.byMethod.length > 0 ? (
                            <div className={`h-64 flex items-center justify-center border rounded-lg ${theme.chart}`}>
                                <div className="text-center">
                                    <PieChart className={`h-16 w-16 ${theme.textMuted} mx-auto mb-4`} />
                                    <p className={theme.textMuted}>Payment Method Distribution</p>
                                    <div className="mt-4 space-y-1">
                                        {realData.byMethod.map((item, index) => (
                                            <div key={index} className="flex items-center justify-center">
                                                <div 
                                                    className="w-3 h-3 rounded-full mr-2" 
                                                    style={{ 
                                                        backgroundColor: `hsl(${index * 60}, 70%, 60%)` 
                                                    }}
                                                />
                                                <span className={`text-sm ${theme.textMuted}`}>
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
                <Card className={`${theme.bgCard} ${theme.border} shadow-sm`}>
                    <CardHeader>
                        <CardTitle className={theme.text}>Daily Collection Trend</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {realData.dailyCollection.length > 0 ? (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className={`${theme.tableHeader} border-b ${theme.border}`}>
                                        <TableRow>
                                            <TableHead className={theme.textSecondary}>Date</TableHead>
                                            <TableHead className={`text-right ${theme.textSecondary}`}>Amount Collected</TableHead>
                                            <TableHead className={`text-right ${theme.textSecondary}`}>Transactions</TableHead>
                                            <TableHead className={`text-right ${theme.textSecondary}`}>Average</TableHead>
                                            <TableHead className={theme.textSecondary}>Trend</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {realData.dailyCollection.map((day, index) => {
                                            const isUp = index > 0 && day.amount > realData.dailyCollection[index - 1].amount;
                                            return (
                                                <TableRow key={index} className={`border-b ${theme.tableRow}`}>
                                                    <TableCell>
                                                        <div className={`flex items-center ${theme.textMuted}`}>
                                                            <Calendar className="mr-2 h-4 w-4" />
                                                            {formatDate(day.date, 'dd MMM')}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className={`text-right font-medium ${theme.text}`}>
                                                        {formatCurrency(day.amount)}
                                                    </TableCell>
                                                    <TableCell className={`text-right ${theme.textMuted}`}>
                                                        {day.transactions}
                                                    </TableCell>
                                                    <TableCell className={`text-right ${theme.textMuted}`}>
                                                        {formatCurrency(day.amount / day.transactions)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge className={
                                                            isUp
                                                                ? theme.badge.green
                                                                : index > 0
                                                                    ? theme.badge.red
                                                                    : theme.badge.gray
                                                        }>
                                                            {isUp
                                                                ? '↑ Up'
                                                                : index > 0
                                                                    ? '↓ Down'
                                                                    : '–'
                                                            }
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className={`text-center py-8 ${theme.textMuted}`}>
                                No daily collection data available for the selected period
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Fee Status Distribution */}
            <Card className={`${theme.bgCard} ${theme.border} shadow-sm`}>
                <CardHeader>
                    <CardTitle className={theme.text}>Fee Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {realData.statusDistribution.map((status, index) => {
                                const statusInfo = getStatusLabel(status._id);
                                const percentage = realData.feeSummary.count > 0 
                                    ? (status.count / realData.feeSummary.count) * 100 
                                    : 0;
                                
                                return (
                                    <div key={index} className={`p-4 border rounded-lg ${theme.border}`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <Badge className={statusInfo.color}>
                                                {statusInfo.label}
                                            </Badge>
                                            <span className={`text-sm ${theme.textMuted}`}>
                                                {percentage.toFixed(1)}%
                                            </span>
                                        </div>
                                        <div className={`text-2xl font-bold ${theme.text}`}>
                                            {status.count}
                                        </div>
                                        <div className={`text-sm ${theme.textMuted}`}>
                                            {formatCurrency(status.totalAmount)}
                                        </div>
                                        <div className={`w-full ${theme.progress.bg} rounded-full h-2 mt-2`}>
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
            <Card className={`${theme.bgCard} ${theme.border} shadow-sm`}>
                <CardHeader>
                    <CardTitle className={theme.text}>Top Contributing Students</CardTitle>
                </CardHeader>
                <CardContent>
                    {realData.topStudents.length > 0 ? (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className={`${theme.tableHeader} border-b ${theme.border}`}>
                                    <TableRow>
                                        <TableHead className={theme.textSecondary}>Rank</TableHead>
                                        <TableHead className={theme.textSecondary}>Student</TableHead>
                                        <TableHead className={theme.textSecondary}>Class</TableHead>
                                        <TableHead className={`text-right ${theme.textSecondary}`}>Total Paid</TableHead>
                                        <TableHead className={`text-right ${theme.textSecondary}`}>Payments</TableHead>
                                        <TableHead className={`text-right ${theme.textSecondary}`}>Average Payment</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {realData.topStudents.map((student, index) => (
                                        <TableRow key={index} className={`border-b ${theme.tableRow}`}>
                                            <TableCell>
                                                <div className={`flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 ${theme.text}`}>
                                                    <span className="font-bold">{index + 1}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className={`font-medium ${theme.text}`}>
                                                {student.name}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={theme.badge.outline}>
                                                    {student.class}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className={`text-right font-bold ${theme.stat.green}`}>
                                                {formatCurrency(student.amount)}
                                            </TableCell>
                                            <TableCell className={`text-right ${theme.textMuted}`}>
                                                {student.payments}
                                            </TableCell>
                                            <TableCell className={`text-right ${theme.textMuted}`}>
                                                {formatCurrency(student.amount / student.payments)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className={`text-center py-8 ${theme.textMuted}`}>
                            No student payment data available
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Summary Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className={`${theme.bgCard} ${theme.border} shadow-sm`}>
                    <CardHeader>
                        <CardTitle className={theme.text}>Collection Statistics</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {realData.dailyCollection.length > 0 ? (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className={theme.textMuted}>Highest Collection Day</span>
                                    <span className={`font-medium ${theme.text}`}>
                                        {formatDate(highestCollectionDay.date, 'dd MMM')}: {formatCurrency(highestCollectionDay.amount)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className={theme.textMuted}>Lowest Collection Day</span>
                                    <span className={`font-medium ${theme.text}`}>
                                        {formatDate(lowestCollectionDay.date, 'dd MMM')}: {formatCurrency(lowestCollectionDay.amount)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className={theme.textMuted}>Busiest Day (Transactions)</span>
                                    <span className={`font-medium ${theme.text}`}>
                                        {formatDate(busiestDay.date, 'dd MMM')}: {busiestDay.transactions} transactions
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className={theme.textMuted}>Average Daily Collection</span>
                                    <span className={`font-medium ${theme.text}`}>{formatCurrency(averageDailyCollection)}</span>
                                </div>
                            </div>
                        ) : (
                            <div className={`text-center py-8 ${theme.textMuted}`}>
                                No statistics available for the selected period
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className={`${theme.bgCard} ${theme.border} shadow-sm`}>
                    <CardHeader>
                        <CardTitle className={theme.text}>Performance Insights</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className={`p-3 rounded-lg border ${theme.insight.green}`}>
                                <div className={`font-medium ${theme.insight.greenText}`}>Collection Rate</div>
                                <div className={`text-sm ${theme.insight.greenSub}`}>
                                    {realData.collectionRate > 50 
                                        ? `Strong collection at ${realData.collectionRate.toFixed(1)}% rate`
                                        : `Collection rate is ${realData.collectionRate.toFixed(1)}%, needs improvement`}
                                </div>
                            </div>
                            
                            {realData.byMethod.length > 0 && (
                                <div className={`p-3 rounded-lg border ${theme.insight.yellow}`}>
                                    <div className={`font-medium ${theme.insight.yellowText}`}>Preferred Payment Method</div>
                                    <div className={`text-sm ${theme.insight.yellowSub}`}>
                                        {getMethodLabel(realData.byMethod[0].method)} is the most used method at {realData.byMethod[0].percentage.toFixed(1)}%
                                    </div>
                                </div>
                            )}
                            
                            {realData.topStudents.length > 0 && (
                                <div className={`p-3 rounded-lg border ${theme.insight.blue}`}>
                                    <div className={`font-medium ${theme.insight.blueText}`}>Top Contributor</div>
                                    <div className={`text-sm ${theme.insight.blueSub}`}>
                                        {realData.topStudents[0].name} contributed {formatCurrency(realData.topStudents[0].amount)} across {realData.topStudents[0].payments} payments
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Fee Summary */}
            <Card className={`${theme.bgCard} ${theme.border} shadow-sm`}>
                <CardHeader>
                    <CardTitle className={theme.text}>Fee Overview</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className={`p-4 border rounded-lg ${theme.border}`}>
                            <div className={`text-sm ${theme.textMuted} mb-1`}>Total Generated</div>
                            <div className={`text-2xl font-bold ${theme.text}`}>
                                {formatCurrency(realData.feeSummary.totalGenerated)}
                            </div>
                            <div className={`text-xs ${theme.textMuted} mt-1`}>
                                {realData.feeSummary.count} fee instances
                            </div>
                        </div>
                        
                        <div className={`p-4 border rounded-lg ${theme.border}`}>
                            <div className={`text-sm ${theme.textMuted} mb-1`}>Total Collected</div>
                            <div className={`text-2xl font-bold ${theme.stat.green}`}>
                                {formatCurrency(realData.feeSummary.totalPaid + realData.feeSummary.totalAdvanceUsed)}
                            </div>
                            <div className={`text-xs ${theme.textMuted} mt-1`}>
                                {realData.feeSummary.paidCount} paid instances
                            </div>
                        </div>
                        
                        <div className={`p-4 border rounded-lg ${theme.border}`}>
                            <div className={`text-sm ${theme.textMuted} mb-1`}>Total Due</div>
                            <div className={`text-2xl font-bold ${theme.stat.orange}`}>
                                {formatCurrency(realData.feeSummary.totalDue)}
                            </div>
                            <div className={`text-xs ${theme.textMuted} mt-1`}>
                                Pending collection
                            </div>
                        </div>
                        
                        <div className={`p-4 border rounded-lg ${theme.border}`}>
                            <div className={`text-sm ${theme.textMuted} mb-1`}>Total Waived</div>
                            <div className={`text-2xl font-bold ${theme.stat.purple}`}>
                                {formatCurrency(realData.feeSummary.totalWaived)}
                            </div>
                            <div className={`text-xs ${theme.textMuted} mt-1`}>
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