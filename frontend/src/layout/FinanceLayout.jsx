// src/components/layout/FinanceLayout.jsx
import { useAppDispatch, useAppSelector } from '@/features/store'
import {
  BarChart,
  Bell,
  BookOpen,
  CreditCard,
  DollarSign,
  FileText,
  Home,
  LogOut,
  Menu,
  Percent,
  RefreshCw,
  Search,
  Settings,
  User,
  Users,
  X
} from 'lucide-react'
import { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { userLoggedOut } from '@/features/slices/authSlice'

const FinanceLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((state) => state.user)

  const navigation = [
    { name: 'Dashboard', href: '/finance', icon: Home },
    { name: 'Fee Templates', href: '/finance/fees/templates', icon: FileText },
    { name: 'Student Fees', href: '/finance/fees/students', icon: Users },
    { name: 'Apply Fees', href: '/finance/fees/apply', icon: DollarSign },
    { name: 'Receive Payment', href: '/finance/payments/receive', icon: CreditCard },
    { name: 'Payment History', href: '/finance/payments/history', icon: CreditCard },
    { name: 'Advance Balance', href: '/finance/payments/advance', icon: DollarSign },
    { name: 'Refunds', href: '/finance/refunds', icon: RefreshCw },
    { name: 'Waivers', href: '/finance/waivers/request', icon: Percent },
    { name: 'Approve Waivers', href: '/finance/waivers/approve', icon: Percent },
    { name: 'Ledger', href: '/finance/ledger', icon: BookOpen },
    { name: 'Reports', href: '/finance/reports/collection', icon: BarChart },
    { name: 'Settings', href: '/finance/settings/session', icon: Settings },
  ]

  const handleLogout = () => {
    dispatch(userLoggedOut())
    navigate('/login')
  }

  const isActive = (path) => {
    // Dashboard (exact match only)
    if (path === '/finance') {
      return location.pathname === '/finance'
    }

    // Other menu items (nested routes allowed)
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 z-50 flex flex-col bg-white border-r transition-all duration-300 overflow-hidden",
        sidebarOpen ? "w-64" : "w-20"
      )}>
        <div className="flex items-center justify-between h-16 px-4 border-b">
          {sidebarOpen ? (
            <h1
              onClick={() => navigate('/admin/dashboard')}
              className="text-xl font-bold text-primary cursor-pointer hover:opacity-80"
            >
              School Fee System
            </h1>
          ) : (
            <div className="text-xl font-bold text-primary cursor-pointer"
              onClick={() => navigate('/admin/dashboard')}
            >SF</div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="h-8 w-8"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </Button>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.name}
                onClick={() => navigate(item.href)}
                className={cn(
                  "flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive(item.href)
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-gray-100 text-gray-700"
                )}
              >
                <Icon className={cn("h-5 w-5", sidebarOpen ? "mr-3" : "mx-auto")} />
                {sidebarOpen && <span>{item.name}</span>}
              </button>
            )
          })}
        </nav>

        <div className="p-4 border-t">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
            </div>
            {sidebarOpen && (
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium truncate">{user?.name || 'Admin User'}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email || 'admin@school.edu'}</p>
              </div>
            )}
            {sidebarOpen && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="h-8 w-8 ml-2"
              >
                <LogOut size={16} />
              </Button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={cn("transition-all duration-300", sidebarOpen ? "ml-64" : "ml-20")}>
        {/* Header */}
        <header className="sticky top-0 z-40 flex items-center justify-between h-16 px-6 bg-white border-b">
          <div className="flex items-center flex-1 max-w-2xl">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search students, payments, fees..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell size={20} />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center">3</Badge>
            </Button>

            {/* <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium">Current Session</p>
                <p className="text-xs text-gray-500">2024-2025</p>
              </div>
              <Button variant="outline" size="sm">Change</Button>
            </div> */}
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="border-t px-6 py-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              <span className="font-medium">School Fee Management System</span>
              <span className="mx-2">•</span>
              <span>v1.0.0</span>
            </div>
            <div>
              <span>© {new Date().getFullYear()} All rights reserved</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default FinanceLayout

// // src/layouts/FinanceLayout.tsx
// import React, { ReactNode } from 'react';
// import { Link, useLocation } from 'react-router-dom';
// import { cn } from '@/lib/utils';
// import {
//   BarChart3,
//   CreditCard,
//   FileText,
//   Home,
//   Settings,
//   Users,
//   Wallet,
//   Receipt,
//   PieChart,
//   Bell,
//   User,
// } from 'lucide-react';


// const FinanceLayout= ({ children }) => {
//   const location = useLocation();

//   const navigation = [
//     {
//       name: 'Dashboard',
//       href: '/finance',
//       icon: Home,
//       current: location.pathname === '/finance',
//     },
//     {
//       name: 'Fee Templates',
//       href: '/finance/fee-templates',
//       icon: FileText,
//       current: location.pathname.includes('/fee-templates'),
//     },
//     {
//       name: 'Fee Instances',
//       href: '/finance/fee-instances',
//       icon: CreditCard,
//       current: location.pathname.includes('/fee-instances'),
//     },
//     {
//       name: 'Payments',
//       href: '/finance/payments',
//       icon: Wallet,
//       current: location.pathname.includes('/payments'),
//     },
//     {
//       name: 'Ledger',
//       href: '/finance/ledger',
//       icon: Receipt,
//       current: location.pathname.includes('/ledger'),
//     },
//     {
//       name: 'Reports',
//       href: '/finance/reports',
//       icon: BarChart3,
//       current: location.pathname.includes('/reports'),
//     },
//     {
//       name: 'Students',
//       href: '/finance/students',
//       icon: Users,
//       current: location.pathname.includes('/students'),
//     },
//     {
//       name: 'Analytics',
//       href: '/finance/analytics',
//       icon: PieChart,
//       current: location.pathname.includes('/analytics'),
//     },
//   ];

//   const secondaryNavigation = [
//     {
//       name: 'Settings',
//       href: '/finance/settings',
//       icon: Settings,
//     },
//   ];

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Sidebar */}
//       <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r">
//         <div className="flex flex-col h-full">
//           {/* Logo */}
//           <div className="flex h-16 items-center px-6 border-b">
//             <div className="flex items-center">
//               <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
//                 <Wallet className="h-5 w-5 text-white" />
//               </div>
//               <span className="ml-3 text-xl font-bold">Finance Portal</span>
//             </div>
//           </div>

//           {/* Navigation */}
//           <nav className="flex-1 space-y-1 px-4 py-4">
//             {navigation.map((item) => (
//               <Link
//                 key={item.name}
//                 to={item.href}
//                 className={cn(
//                   'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors',
//                   item.current
//                     ? 'bg-primary text-white'
//                     : 'text-gray-700 hover:bg-gray-100'
//                 )}
//               >
//                 <item.icon className="mr-3 h-5 w-5" />
//                 {item.name}
//               </Link>
//             ))}
//           </nav>

//           {/* Secondary Navigation */}
//           <div className="border-t px-4 py-4">
//             {secondaryNavigation.map((item) => (
//               <Link
//                 key={item.name}
//                 to={item.href}
//                 className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
//               >
//                 <item.icon className="mr-3 h-5 w-5" />
//                 {item.name}
//               </Link>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* Main Content */}
//       <div className="pl-64">
//         {/* Top Bar */}
//         <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-white px-6">
//           <div className="flex flex-1 items-center justify-between">
//             <div>
//               <h1 className="text-2xl font-bold text-gray-900">
//                 {navigation.find(nav => nav.current)?.name || 'Finance'}
//               </h1>
//               <p className="text-sm text-gray-500">
//                 Manage school finances efficiently
//               </p>
//             </div>
//             <div className="flex items-center gap-4">
//               <button className="relative p-2 text-gray-600 hover:text-gray-900">
//                 <div className="h-2 w-2 rounded-full bg-red-500 absolute top-2 right-2"></div>
//                 <Bell className="h-5 w-5" />
//               </button>
//               <div className="flex items-center gap-3">
//                 <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
//                   <User className="h-4 w-4 text-primary" />
//                 </div>
//                 <div>
//                   <p className="text-sm font-medium">Finance Officer</p>
//                   <p className="text-xs text-gray-500">admin@school.edu</p>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </header>

//         {/* Page Content */}
//         <main className="p-6">
//           <div className="mx-auto max-w-7xl">
//             {children}
//           </div>
//         </main>
//       </div>
//     </div>
//   );
// };
// export default FinanceLayout;