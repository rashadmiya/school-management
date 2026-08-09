// src/pages/Dashboard.jsx - UPDATED with Dark Mode
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useGetDashboardDataQuery } from '@/features/apis/finance/ledgerApi'
import { useGetPaymentCollectionReportQuery } from '@/features/apis/finance/paymentApi'
import { useAppSelector } from '@/features/store'
import { useCurrentSession } from '@/hooks/useCurrentSession'
import { formatCurrency, formatDate } from '@/lib/formaters'
import { SESSION_OPTIONS } from '@/utils/constants'
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
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'

const FinanceDashboard = () => {
    const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
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

    // Theme-based classes
    const theme = {
        textPrimary: isDarkMode ? "text-white" : "text-gray-900",
        textSecondary: isDarkMode ? "text-gray-300" : "text-gray-700",
        textMuted: isDarkMode ? "text-gray-400" : "text-gray-500",
        textLight: isDarkMode ? "text-gray-500" : "text-gray-400",
        border: isDarkMode ? "border-gray-700" : "border-gray-200",
        bgCard: isDarkMode ? "bg-gray-900/50" : "bg-white",
        bgHover: isDarkMode ? "hover:bg-gray-800/50" : "hover:bg-gray-100",
        bgInput: isDarkMode ? "bg-gray-800" : "bg-white",
        inputBorder: isDarkMode ? "border-gray-700" : "border-gray-200",
        select: isDarkMode 
            ? "bg-gray-800 border-gray-700 text-white" 
            : "bg-white border-gray-200 text-gray-900",
        selectContent: isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white",
        selectItem: isDarkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-900 hover:bg-gray-100",
        button: {
            outline: isDarkMode 
                ? "border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white" 
                : "border-gray-200 text-gray-700 hover:bg-gray-50",
            ghost: isDarkMode 
                ? "text-gray-400 hover:text-white hover:bg-gray-800" 
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
        },
        stat: {
            blue: isDarkMode 
                ? "bg-blue-500/10 border-blue-500/20 text-blue-400" 
                : "bg-blue-50 text-blue-600",
            green: isDarkMode 
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                : "bg-green-50 text-green-600",
            purple: isDarkMode 
                ? "bg-purple-500/10 border-purple-500/20 text-purple-400" 
                : "bg-purple-50 text-purple-600",
            red: isDarkMode 
                ? "bg-red-500/10 border-red-500/20 text-red-400" 
                : "bg-red-50 text-red-600",
            yellow: isDarkMode 
                ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400" 
                : "bg-yellow-50 text-yellow-800",
        },
        alert: {
            warning: isDarkMode 
                ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400" 
                : "bg-yellow-50 border-yellow-200 text-yellow-800",
            info: isDarkMode 
                ? "bg-blue-500/10 border-blue-500/20 text-blue-400" 
                : "bg-blue-50 border-blue-200 text-blue-800",
            error: isDarkMode 
                ? "bg-red-500/10 border-red-500/20 text-red-400" 
                : "bg-red-50 border-red-200 text-red-800",
        },
        alertSub: {
            warning: isDarkMode ? "text-yellow-400/80" : "text-yellow-600",
            info: isDarkMode ? "text-blue-400/80" : "text-blue-600",
            error: isDarkMode ? "text-red-400/80" : "text-red-600",
        },
        paymentItem: isDarkMode 
            ? "bg-gray-800/50 hover:bg-gray-800" 
            : "bg-gray-50 hover:bg-gray-100",
        quickAction: isDarkMode 
            ? "border-gray-700 hover:bg-gray-800/50" 
            : "border-gray-200 hover:bg-gray-50",
        iconColor: isDarkMode ? "text-blue-400" : "text-primary",
        trendUp: isDarkMode ? "text-emerald-400" : "text-green-600",
        trendDown: isDarkMode ? "text-red-400" : "text-red-600",
        loading: isDarkMode ? "border-blue-400" : "border-primary",
    };

    if (isLoading) {
        return (
            <div className={`flex items-center justify-center h-64 ${isDarkMode ? "text-gray-400" : ""}`}>
                <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${theme.loading}`}></div>
            </div>
        )
    }

    return (
        <div className={`space-y-6 ${isDarkMode ? "text-white" : ""}`}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className={`text-3xl font-bold tracking-tight ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                        Dashboard
                    </h1>
                    <p className={isDarkMode ? "text-gray-400" : "text-muted-foreground"}>
                        Overview of fee collections and pending actions
                    </p>
                </div>
                <div className="flex items-center space-x-4 flex-wrap gap-2">
                    <Select value={session} onValueChange={(value) => {
                        setSession(value);
                        refetch();
                    }}>
                        <SelectTrigger className={`w-[180px] ${theme.select}`}>
                            <SelectValue placeholder="Select session" />
                        </SelectTrigger>
                        <SelectContent className={theme.selectContent}>
                            {SESSION_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value} className={theme.selectItem}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" onClick={() => refetch()} className={theme.button.outline}>
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className={theme.button.outline}>
                        <Download className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-sm`}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                            Total Students
                        </CardTitle>
                        <Users className={`h-4 w-4 ${isDarkMode ? "text-gray-400" : "text-muted-foreground"}`} />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                            {dashboardData?.totalStudents?.toLocaleString() || 0}
                        </div>
                        <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-muted-foreground"}`}>
                            {dashboardData?.activeStudents || 0} active
                        </p>
                    </CardContent>
                </Card>

                <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-sm`}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                            Total Collection
                        </CardTitle>
                        <CreditCard className={`h-4 w-4 ${isDarkMode ? "text-gray-400" : "text-muted-foreground"}`} />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                            {formatCurrency(dashboardData?.totalCollection || 0)}
                        </div>
                        <div className={`flex items-center text-xs ${theme.trendUp}`}>
                            <TrendingUp className="mr-1 h-4 w-4" />
                            {dashboardData?.collectionRate || 0}% collection rate
                        </div>
                    </CardContent>
                </Card>

                <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-sm`}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                            Outstanding
                        </CardTitle>
                        <DollarSign className={`h-4 w-4 ${isDarkMode ? "text-gray-400" : "text-muted-foreground"}`} />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                            {formatCurrency(dashboardData?.outstandingAmount || 0)}
                        </div>
                        <div className={`flex items-center text-xs ${theme.trendDown}`}>
                            <TrendingDown className="mr-1 h-4 w-4" />
                            Needs attention
                        </div>
                    </CardContent>
                </Card>

                <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-sm`}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                            Pending Actions
                        </CardTitle>
                        <AlertCircle className={`h-4 w-4 ${isDarkMode ? "text-gray-400" : "text-muted-foreground"}`} />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                            {dashboardData?.pendingActions || 0}
                        </div>
                        <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-muted-foreground"}`}>
                            {dashboardData?.pendingWaivers || 0} waivers, {dashboardData?.pendingRefunds || 0} refunds
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts and Recent Activities */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Recent Payments */}
                    <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-sm`}>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className={isDarkMode ? "text-white" : "text-gray-900"}>
                                Recent Payments
                            </CardTitle>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => navigate('/payments/history')}
                                className={theme.button.ghost}
                            >
                                View All
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {dashboardData?.recentPayments?.length > 0 ? (
                                <div className="space-y-4">
                                    {dashboardData.recentPayments.map((payment) => (
                                        <div key={payment.id} className={`flex items-center justify-between p-3 rounded-lg transition-colors ${theme.paymentItem}`}>
                                            <div>
                                                <p className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                                                    {payment.student} - {payment.class}
                                                </p>
                                                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                                                    Payment via {payment.method}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                                                    {formatCurrency(payment.amount)}
                                                </p>
                                                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                                                    {formatDate(payment.time, 'hh:mm a')}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className={`text-center py-8 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                                    No recent payments found
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Collection Summary */}
                    <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-sm`}>
                        <CardHeader>
                            <CardTitle className={isDarkMode ? "text-white" : "text-gray-900"}>
                                Collection Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-3 gap-4">
                                <div className={`text-center p-4 rounded-lg border ${theme.stat.blue}`}>
                                    <p className={`text-2xl font-bold ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}>
                                        {formatCurrency(monthStats?.data?.totalAmount || 0)}
                                    </p>
                                    <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                                        This Month
                                    </p>
                                </div>
                                <div className={`text-center p-4 rounded-lg border ${theme.stat.green}`}>
                                    <p className={`text-2xl font-bold ${isDarkMode ? "text-emerald-400" : "text-green-600"}`}>
                                        {formatCurrency(yearStats?.data?.totalAmount || 0)}
                                    </p>
                                    <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                                        This Year
                                    </p>
                                </div>
                                <div className={`text-center p-4 rounded-lg border ${theme.stat.purple}`}>
                                    <p className={`text-2xl font-bold ${isDarkMode ? "text-purple-400" : "text-purple-600"}`}>
                                        {dashboardData?.collectionRate || 0}%
                                    </p>
                                    <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                                        Collection Rate
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions and Notifications */}
                <div className="space-y-6">
                    <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-sm`}>
                        <CardHeader>
                            <CardTitle className={isDarkMode ? "text-white" : "text-gray-900"}>
                                Quick Actions
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {dashboardData?.quickActions?.map((action, index) => (
                                    <button
                                        key={index}
                                        onClick={() => navigate(action.path)}
                                        className={`w-full text-left p-3 rounded-lg border transition-colors flex items-center ${theme.quickAction}`}
                                    >
                                        {action.label === 'Receive Payment' && <CreditCard className={`h-5 w-5 mr-3 ${theme.iconColor}`} />}
                                        {action.label === 'Apply Fees' && <FileText className={`h-5 w-5 mr-3 ${theme.iconColor}`} />}
                                        {action.label === 'Process Refund' && <RefreshCw className={`h-5 w-5 mr-3 ${theme.iconColor}`} />}
                                        {action.label === 'Generate Report' && <Eye className={`h-5 w-5 mr-3 ${theme.iconColor}`} />}
                                        <div>
                                            <p className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                                                {action.label}
                                            </p>
                                            <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                                                {action.description}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className={`${isDarkMode ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"} shadow-sm`}>
                        <CardHeader>
                            <CardTitle className={isDarkMode ? "text-white" : "text-gray-900"}>
                                System Alerts
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {dashboardData?.alerts?.length > 0 ? (
                                <div className="space-y-3">
                                    {dashboardData.alerts.map((alert, index) => {
                                        const alertType = alert.type === 'warning' ? 'warning' : 
                                                       alert.type === 'info' ? 'info' : 'error';
                                        return (
                                            <div key={index} className={`p-3 border rounded-lg ${theme.alert[alertType]}`}>
                                                <p className={`font-medium ${theme.alert[alertType]}`}>
                                                    {alert.title}
                                                </p>
                                                <p className={`text-sm ${theme.alertSub[alertType]}`}>
                                                    {alert.message}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className={`text-center py-8 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
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

export default FinanceDashboard;