import {
  AlarmClock,
  BarChart3,
  BookMarked,
  BookOpen,
  CalendarDays,
  CircleDollarSign,
  ClipboardCheck,
  ClipboardPen,
  FileEdit,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  HandCoins,
  History,
  Home,
  Layers3,
  LayoutGrid,
  Megaphone,
  Percent,
  Receipt,
  RotateCcw,
  School,
  Settings,
  Shield,
  Trophy,
  UserRound,
  UserRoundCheck,
  UserRoundCog,
  Users,
  Wallet
} from "lucide-react";

export const navItems = [
  {
    label: "Dashboard",
    icon: Home,
    path: "/admin/dashboard",
    roles: ["admin"],
  },

  {
    label: "Announcements",
    icon: Megaphone,
    path: "/admin/announcements",
    roles: ["admin", "teacher"],
  },

  // =========================
  // ADMIN / TEACHER
  // =========================

  {
    label: "Committee",
    icon: Users,
    path: "/admin/committee",
    roles: ["admin"],
  },

  {
    label: "Teachers",
    icon: GraduationCap,
    path: "/admin/teachers",
    roles: ["admin"],
  },

  {
    label: "Staffs",
    icon: UserRoundCog,
    path: "/admin/staff",
    roles: ["admin"],
  },

  {
    label: "Students",
    icon: GraduationCap,
    path: "/admin/students",
    roles: ["admin", "teacher"],
  },

  {
    label: "Cabinet",
    icon: School,
    path: "/admin/cabinet",
    roles: ["admin", "teacher"],
  },

  {
    label: "Classes",
    icon: Layers3,
    path: "/admin/classes",
    roles: ["admin", "teacher"],
  },

  {
    label: "Sections",
    icon: LayoutGrid,
    path: "/admin/sections",
    roles: ["admin", "teacher"],
  },

  {
    label: "Clubs",
    icon: Trophy,
    path: "/admin/clubs",
    roles: ["admin", "teacher"],
  },

  {
    label: "Subjects",
    icon: BookOpen,
    path: "/admin/subjects",
    roles: ["admin", "teacher"],
  },

  {
    label: "Routine",
    icon: CalendarDays,
    path: "/admin/routines",
    roles: ["admin", "teacher"],
  },

  {
    label: "Attendance",
    icon: UserRoundCheck,
    path: "/admin/attendances",
    roles: ["admin", "teacher"],
  },

  {
    label: "Exam Routine",
    icon: AlarmClock,
    path: "/admin/exam-routines",
    roles: ["admin", "teacher"],
  },

  {
    label: "Assignments",
    icon: ClipboardPen,
    path: "/admin/assignments",
    roles: ["admin", "teacher"],
  },

  {
    label: "Results",
    icon: FileSpreadsheet,
    path: "/admin/results",
    roles: ["admin", "teacher"],
  },

  {
    label: "Result Sheets",
    icon: FileSpreadsheet,
    path: "/admin/result-sheets",
    roles: ["admin", "teacher"],
  },

  // =========================
  // FINANCE
  // =========================

  {
    label: "Finance",
    icon: Wallet,
    roles: ["admin", "teacher"],
    children: [
      {
        label: "Finance Dashboard",
        path: "/admin/finance",
        icon: BarChart3,
      },
      {
        label: "Fee Templates",
        path: "/admin/finance/fees/templates",
        icon: FileText,
      },
      {
        label: "Student Fees",
        path: "/admin/finance/fees/students",
        icon: Receipt,
      },
      {
        label: "Apply Fees",
        path: "/admin/finance/fees/apply",
        icon: FileEdit,
      },
      {
        label: "Receive Payment",
        path: "/admin/finance/payments/receive",
        icon: HandCoins,
      },
      {
        label: "Payment History",
        path: "/admin/finance/payments/history",
        icon: History,
      },
      {
        label: "Advance Balance",
        path: "/admin/finance/payments/advance",
        icon: CircleDollarSign,
      },
      {
        label: "Refunds",
        path: "/admin/finance/refunds",
        icon: RotateCcw,
      },
      {
        label: "Request Waiver",
        path: "/admin/finance/waivers/request",
        icon: Percent,
      },
      {
        label: "Approve Waivers",
        path: "/admin/finance/waivers/approve",
        icon: ClipboardCheck,
      },
      {
        label: "Student Ledger",
        path: "/admin/finance/ledger",
        icon: BookMarked,
      },
      {
        label: "Collection Report",
        path: "/admin/finance/reports/collection",
        icon: BarChart3,
      },
      {
        label: "Outstanding Report",
        path: "/admin/finance/reports/outstanding",
        icon: CircleDollarSign,
      },
      {
        label: "Session Settings",
        path: "/admin/finance/settings/session",
        icon: Settings,
      },
    ],
  },

  // =========================
  // PORTALS
  // =========================

  {
    label: "Teacher Portal",
    icon: GraduationCap,
    path: "/teacher",
    roles: ["teacher"],
  },

  {
    label: "Student Portal",
    icon: UserRound,
    path: "/student",
    roles: ["student"],
  },

  {
    label: "Parent Portal",
    icon: UserRound,
    path: "/parent",
    roles: ["parent"],
  },

  // =========================
  // ADMINISTRATION
  // =========================

  {
    label: "Admin Panel",
    icon: Shield,
    path: "/admin/administration",
    roles: ["admin", "teacher"],
  },
];