// src/pages/Dashboard.jsx - UPDATED
import {
    AlertCircle,
    CreditCard,
    DollarSign,
    Download,
    Eye,
    FileText,
    RefreshCw,
    TrendingDown,
    TrendingUp,
    Users
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
// import { useGetDashboardDataQuery } from '@/features/apis/finance/dashboardApi' // New API
// import { useGetOutstandingFeesReportQuery } from '@/features/apis/finance/feeApi'
import { useGetPaymentCollectionReportQuery } from '@/features/apis/finance/paymentApi'
import { formatCurrency, formatDate } from '@/lib/formaters'
import { SESSION_OPTIONS } from '@/utils/constants'
import { useNavigate } from 'react-router-dom'
import { useGetDashboardDataQuery } from '@/features/apis/finance/ledgerApi'
import { useCurrentSession } from '@/hooks/useCurrentSession'

const FinanceDashboard = () => {
    const [session, setSession] = useState(SESSION_OPTIONS[1].value)
    const navigate = useNavigate()

    const {
        selectedSession,
        isLoading: sessionLoading,
        updateSession
    } = useCurrentSession();
    
    // Single API call for dashboard
    const { data: dashboarRes, isLoading, refetch } = useGetDashboardDataQuery({
        session: selectedSession || session,
    });

    const dashboardData = dashboarRes?.data || {};

    // For collection summary (monthly/yearly)
    const currentYear = new Date().getFullYear();
    const { data: yearStats } = useGetPaymentCollectionReportQuery({
        session,
        startDate: new Date(currentYear, 0, 1).toISOString(),
        endDate: new Date().toISOString(),
    })

    const { data: monthStats } = useGetPaymentCollectionReportQuery({
        session,
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
        endDate: new Date().toISOString(),
    })

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">
                        Overview of fee collections and pending actions
                    </p>
                </div>
                <div className="flex items-center space-x-4">
                    <Select value={session} onValueChange={(value) => {
                        setSession(value);
                        refetch();
                    }}>
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
                    <Button variant="outline" size="icon" onClick={() => refetch()}>
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                        <Download className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {dashboardData?.totalStudents?.toLocaleString() || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {dashboardData?.activeStudents || 0} active
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Collection</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(dashboardData?.totalCollection || 0)}
                        </div>
                        <div className="flex items-center text-xs text-green-600">
                            <TrendingUp className="mr-1 h-4 w-4" />
                            {dashboardData?.collectionRate || 0}% collection rate
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(dashboardData?.outstandingAmount || 0)}
                        </div>
                        <div className="flex items-center text-xs text-red-600">
                            <TrendingDown className="mr-1 h-4 w-4" />
                            Needs attention
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Actions</CardTitle>
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {dashboardData?.pendingActions || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {dashboardData?.pendingWaivers || 0} waivers, {dashboardData?.pendingRefunds || 0} refunds
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts and Recent Activities */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Recent Payments */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Recent Payments</CardTitle>
                            <Button variant="ghost" size="sm" onClick={() => navigate('/payments/history')}>
                                View All
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {dashboardData?.recentPayments?.length > 0 ? (
                                <div className="space-y-4">
                                    {dashboardData.recentPayments.map((payment) => (
                                        <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                            <div>
                                                <p className="font-medium">{payment.student} - {payment.class}</p>
                                                <p className="text-sm text-gray-500">Payment via {payment.method}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium">{formatCurrency(payment.amount)}</p>
                                                <p className="text-sm text-gray-500">{formatDate(payment.time, 'hh:mm a')}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    No recent payments found
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Collection Summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Collection Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="text-center p-4 bg-blue-50 rounded-lg">
                                    <p className="text-2xl font-bold">
                                        {formatCurrency(monthStats?.data?.totalAmount || 0)}
                                    </p>
                                    <p className="text-sm text-gray-600">This Month</p>
                                </div>
                                <div className="text-center p-4 bg-green-50 rounded-lg">
                                    <p className="text-2xl font-bold">
                                        {formatCurrency(yearStats?.data?.totalAmount || 0)}
                                    </p>
                                    <p className="text-sm text-gray-600">This Year</p>
                                </div>
                                <div className="text-center p-4 bg-purple-50 rounded-lg">
                                    <p className="text-2xl font-bold">
                                        {dashboardData?.collectionRate || 0}%
                                    </p>
                                    <p className="text-sm text-gray-600">Collection Rate</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions and Notifications */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {dashboardData?.quickActions?.map((action, index) => (
                                    <button
                                        key={index}
                                        onClick={() => navigate(action.path)}
                                        className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition-colors flex items-center"
                                    >
                                        {action.label === 'Receive Payment' && <CreditCard className="h-5 w-5 mr-3 text-primary" />}
                                        {action.label === 'Apply Fees' && <FileText className="h-5 w-5 mr-3 text-primary" />}
                                        {action.label === 'Process Refund' && <RefreshCw className="h-5 w-5 mr-3 text-primary" />}
                                        {action.label === 'Generate Report' && <Eye className="h-5 w-5 mr-3 text-primary" />}
                                        <div>
                                            <p className="font-medium">{action.label}</p>
                                            <p className="text-sm text-gray-500">{action.description}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>System Alerts</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {dashboardData?.alerts?.length > 0 ? (
                                <div className="space-y-3">
                                    {dashboardData.alerts.map((alert, index) => (
                                        <div key={index} className={`p-3 border rounded-lg ${alert.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                                            alert.type === 'info' ? 'bg-blue-50 border-blue-200' :
                                                'bg-red-50 border-red-200'
                                            }`}>
                                            <p className={`font-medium ${alert.type === 'warning' ? 'text-yellow-800' :
                                                alert.type === 'info' ? 'text-blue-800' :
                                                    'text-red-800'
                                                }`}>
                                                {alert.title}
                                            </p>
                                            <p className={`text-sm ${alert.type === 'warning' ? 'text-yellow-600' :
                                                alert.type === 'info' ? 'text-blue-600' :
                                                    'text-red-600'
                                                }`}>
                                                {alert.message}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    No alerts at the moment
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

export default FinanceDashboard

// // src/pages/Dashboard.jsx
// import {
//     AlertCircle,
//     CreditCard,
//     DollarSign,
//     Download,
//     Eye,
//     FileText,
//     RefreshCw,
//     TrendingDown,
//     TrendingUp,
//     Users
// } from 'lucide-react'
// import { useState } from 'react'
// import { Button } from '../../components/ui/button'
// import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'

// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
// import { useGetOutstandingFeesReportQuery } from '@/features/apis/finance/feeApi'
// import { useGetPaymentCollectionReportQuery } from '@/features/apis/finance/paymentApi'
// import { formatCurrency, formatDate } from '@/lib/formaters'
// import { SESSION_OPTIONS } from '@/utils/constants'
// import { useNavigate } from 'react-router-dom'

// const FinanceDashboard = () => {
//     const [session, setSession] = useState(SESSION_OPTIONS[1].value)
//     const navigate = useNavigate()

//     // Fetch data
//     const { data: stats, isLoading: statsLoading } = useGetPaymentCollectionReportQuery({
//         session,
//         startDate: new Date(new Date().getFullYear(), 0, 1).toISOString(),
//         endDate: new Date().toISOString(),
//     })

//     const { data: outstandingData, isLoading: outstandingLoading } = useGetOutstandingFeesReportQuery({
//         session,
//         overdueOnly: true,
//     })

//     // Mock data for demonstration
//     const dashboardStats = {
//         totalStudents: stats?.totalStudents || 1250,
//         activeStudents: stats?.activeStudents || 1180,
//         totalCollection: stats?.totalAmount || 1250000,
//         outstandingAmount: outstandingData?.totalOutstanding || 250000,
//         collectionRate: stats?.totalAmount ? Math.round((stats.totalAmount / (stats.totalAmount + (outstandingData?.totalOutstanding || 0))) * 100) : 85,
//         pendingActions: 12,
//         recentPayments: [
//             { id: 1, student: 'John Doe', class: '10A', amount: 15000, method: 'Bank Transfer', time: new Date() },
//             { id: 2, student: 'Jane Smith', class: '9B', amount: 12000, method: 'Cash', time: new Date(Date.now() - 3600000) },
//             { id: 3, student: 'Bob Johnson', class: '11C', amount: 18000, method: 'Mobile Banking', time: new Date(Date.now() - 7200000) },
//         ],
//         quickActions: [
//             { label: 'Receive Payment', description: 'Record new payment', path: '/payments/receive' },
//             { label: 'Apply Fees', description: 'Apply fee template to students', path: '/fees/apply' },
//             { label: 'Process Refund', description: 'Handle refund request', path: '/refunds' },
//             { label: 'Generate Report', description: 'Collection/Outstanding report', path: '/reports/collection' },
//         ]
//     }

//     if (statsLoading || outstandingLoading) {
//         return (
//             <div className="flex items-center justify-center h-64">
//                 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
//             </div>
//         )
//     }

//     return (
//         <div className="space-y-6">
//             {/* Header */}
//             <div className="flex items-center justify-between">
//                 <div>
//                     <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
//                     <p className="text-muted-foreground">
//                         Overview of fee collections and pending actions
//                     </p>
//                 </div>
//                 <div className="flex items-center space-x-4">
//                     <Select value={session} onValueChange={setSession}>
//                         <SelectTrigger className="w-[180px]">
//                             <SelectValue placeholder="Select session" />
//                         </SelectTrigger>
//                         <SelectContent>
//                             {SESSION_OPTIONS.map((option) => (
//                                 <SelectItem key={option.value} value={option.value}>
//                                     {option.label}
//                                 </SelectItem>
//                             ))}
//                         </SelectContent>
//                     </Select>
//                     <Button variant="outline" size="icon">
//                         <Download className="h-4 w-4" />
//                     </Button>
//                 </div>
//             </div>

//             {/* Stats Cards */}
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//                 <Card>
//                     <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                         <CardTitle className="text-sm font-medium">Total Students</CardTitle>
//                         <Users className="h-4 w-4 text-muted-foreground" />
//                     </CardHeader>
//                     <CardContent>
//                         <div className="text-2xl font-bold">{dashboardStats.totalStudents.toLocaleString()}</div>
//                         <p className="text-xs text-muted-foreground">
//                             {dashboardStats.activeStudents} active
//                         </p>
//                     </CardContent>
//                 </Card>

//                 <Card>
//                     <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                         <CardTitle className="text-sm font-medium">Total Collection</CardTitle>
//                         <CreditCard className="h-4 w-4 text-muted-foreground" />
//                     </CardHeader>
//                     <CardContent>
//                         <div className="text-2xl font-bold">{formatCurrency(dashboardStats.totalCollection)}</div>
//                         <div className="flex items-center text-xs text-green-600">
//                             <TrendingUp className="mr-1 h-4 w-4" />
//                             {dashboardStats.collectionRate}% collection rate
//                         </div>
//                     </CardContent>
//                 </Card>

//                 <Card>
//                     <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                         <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
//                         <DollarSign className="h-4 w-4 text-muted-foreground" />
//                     </CardHeader>
//                     <CardContent>
//                         <div className="text-2xl font-bold">{formatCurrency(dashboardStats.outstandingAmount)}</div>
//                         <div className="flex items-center text-xs text-red-600">
//                             <TrendingDown className="mr-1 h-4 w-4" />
//                             Needs attention
//                         </div>
//                     </CardContent>
//                 </Card>

//                 <Card>
//                     <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                         <CardTitle className="text-sm font-medium">Pending Actions</CardTitle>
//                         <AlertCircle className="h-4 w-4 text-muted-foreground" />
//                     </CardHeader>
//                     <CardContent>
//                         <div className="text-2xl font-bold">{dashboardStats.pendingActions}</div>
//                         <p className="text-xs text-muted-foreground">
//                             8 waivers, 4 refunds pending
//                         </p>
//                     </CardContent>
//                 </Card>
//             </div>

//             {/* Charts and Recent Activities */}
//             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//                 <div className="lg:col-span-2 space-y-6">
//                     {/* Recent Payments */}
//                     <Card>
//                         <CardHeader className="flex flex-row items-center justify-between">
//                             <CardTitle>Recent Payments</CardTitle>
//                             <Button variant="ghost" size="sm" onClick={() => navigate('/payments/history')}>
//                                 View All
//                             </Button>
//                         </CardHeader>
//                         <CardContent>
//                             <div className="space-y-4">
//                                 {dashboardStats.recentPayments.map((payment) => (
//                                     <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
//                                         <div>
//                                             <p className="font-medium">{payment.student} - {payment.class}</p>
//                                             <p className="text-sm text-gray-500">Payment via {payment.method}</p>
//                                         </div>
//                                         <div className="text-right">
//                                             <p className="font-medium">{formatCurrency(payment.amount)}</p>
//                                             <p className="text-sm text-gray-500">{formatDate(payment.time, 'hh:mm a')}</p>
//                                         </div>
//                                     </div>
//                                 ))}
//                             </div>
//                         </CardContent>
//                     </Card>

//                     {/* Collection Summary */}
//                     <Card>
//                         <CardHeader>
//                             <CardTitle>Collection Summary</CardTitle>
//                         </CardHeader>
//                         <CardContent>
//                             <div className="grid grid-cols-3 gap-4">
//                                 <div className="text-center p-4 bg-blue-50 rounded-lg">
//                                     <p className="text-2xl font-bold">{formatCurrency(850000)}</p>
//                                     <p className="text-sm text-gray-600">This Month</p>
//                                 </div>
//                                 <div className="text-center p-4 bg-green-50 rounded-lg">
//                                     <p className="text-2xl font-bold">{formatCurrency(4200000)}</p>
//                                     <p className="text-sm text-gray-600">This Year</p>
//                                 </div>
//                                 <div className="text-center p-4 bg-purple-50 rounded-lg">
//                                     <p className="text-2xl font-bold">94%</p>
//                                     <p className="text-sm text-gray-600">Collection Rate</p>
//                                 </div>
//                             </div>
//                         </CardContent>
//                     </Card>
//                 </div>

//                 {/* Quick Actions and Notifications */}
//                 <div className="space-y-6">
//                     <Card>
//                         <CardHeader>
//                             <CardTitle>Quick Actions</CardTitle>
//                         </CardHeader>
//                         <CardContent>
//                             <div className="space-y-3">
//                                 {dashboardStats.quickActions.map((action, index) => (
//                                     <button
//                                         key={index}
//                                         onClick={() => navigate(action.path)}
//                                         className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition-colors flex items-center"
//                                     >
//                                         {action.label === 'Receive Payment' && <CreditCard className="h-5 w-5 mr-3 text-primary" />}
//                                         {action.label === 'Apply Fees' && <FileText className="h-5 w-5 mr-3 text-primary" />}
//                                         {action.label === 'Process Refund' && <RefreshCw className="h-5 w-5 mr-3 text-primary" />}
//                                         {action.label === 'Generate Report' && <Eye className="h-5 w-5 mr-3 text-primary" />}
//                                         <div>
//                                             <p className="font-medium">{action.label}</p>
//                                             <p className="text-sm text-gray-500">{action.description}</p>
//                                         </div>
//                                     </button>
//                                 ))}
//                             </div>
//                         </CardContent>
//                     </Card>

//                     <Card>
//                         <CardHeader>
//                             <CardTitle>System Alerts</CardTitle>
//                         </CardHeader>
//                         <CardContent>
//                             <div className="space-y-3">
//                                 <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
//                                     <p className="font-medium text-yellow-800">5 Overdue Fee Instances</p>
//                                     <p className="text-sm text-yellow-600">Requires immediate attention</p>
//                                 </div>
//                                 <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
//                                     <p className="font-medium text-blue-800">3 Pending Waiver Requests</p>
//                                     <p className="text-sm text-blue-600">Awaiting approval</p>
//                                 </div>
//                                 <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
//                                     <p className="font-medium text-red-800">System Backup Due</p>
//                                     <p className="text-sm text-red-600">Schedule backup for today</p>
//                                 </div>
//                             </div>
//                         </CardContent>
//                     </Card>
//                 </div>
//             </div>
//         </div>
//     )
// }

// export default FinanceDashboard