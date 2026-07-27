import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router-dom";
import ProtectedRoute from "./hooks/ProtectedRoute";
import DashboardWrapper from "./layout/DashboardWrapper";
import AttendancesPage from "./pages/attendances/AttendancesPage";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import UserActivation from "./pages/auth/UserActivation";
import UserManagement from "./pages/auth/UserManagement";
import ClassesPage from "./pages/classes/ClassesPage";
import Dashboard from "./pages/dashboard/Dashboard";
import ExamsPage from "./pages/exams/ExamsPage";
import ParentsPage from "./pages/parents/ParentsPage";
import ResultSheetsPage from "./pages/results/ResultSheetsPage";
import ResultPage from "./pages/results/ResultsPage";
import RolesPage from "./pages/roles/RolesPage";
import RoutinePage from "./pages/routines/RoutinePage";
import StudentsPage from "./pages/students/StudentsPage";
import SubjectsPage from "./pages/subjects/SubjectsPage";
import TeachersPage from "./pages/teachers/TeachersPage";

//Finance Components


// Teacher Portal Components
import TeacherDashboard from "./components/teacher/TeacherDashboard";
import TeacherLayout from "./components/teacher/TeacherLayout";
import MyClasses from "./pages/teachers/MyClasses";
import MySchedule from "./pages/teachers/MySchedule";
import TeacherAssignments from "./pages/teachers/TeacherAssignments";
import TeacherAttendance from "./pages/teachers/TeacherAttendance";
import TeacherExams from "./pages/teachers/TeacherExams";
import TeacherResults from "./pages/teachers/TeacherResults";

// Student Portal Components
import StudentDashboard from "./components/student/StudentDashboard";
import StudentLayout from "./components/student/StudentLayout";
import StudentAssignments from "./pages/students/StudentAssignments";
import StudentAttendance from "./pages/students/StudentAttendance";
import StudentExams from "./pages/students/StudentExams";
import StudentProfile from "./pages/students/StudentProfile";
import StudentResults from "./pages/students/StudentResults";
import StudentSchedule from "./pages/students/StudentSchedule";

// Parent Portal Components
import DirectoryManager from "./pages/public/admin/DirectoryManager";
import ChildrenAttendance from "./components/parent/ChildrenAttendance";
import ChildrenList from "./components/parent/ChildrenList";
import ChildrenResults from "./components/parent/ChildrenResults";
import ParentDashboard from "./components/parent/ParentDashboard";
import ParentLayout from "./components/parent/ParentLayout";
import ParentProfile from "./components/parent/ParentProfile";
import PaymentReceipt from "./components/parent/PaymentReceipt";
import PublicLayout from "./components/public/PublicLayout";
import AdminProtectedRoute from "./hooks/AdminProtectedRoute";
import AdministrationLayout from "./pages/administration/AdministrationLayout";
import AssignmentsPage from "./pages/assignments/AssignmentsPage";
import ClassDetailsPage from "./pages/classes/ClassDetailsPage";
import ChildPaymentDetails from "./pages/parents/ChildPaymentDetails";
import ParentPayments from "./pages/parents/ParentPayments";
import AnnouncementDetail from "./pages/public/AnnouncementDetail";
import AnnouncementsPage from "./pages/public/AnnouncementsPage";
import DynamicPage from "./pages/public/DynamicPage";
import PublicHome from "./pages/public/PublicHome";
import AnnouncementManager from "./pages/public/admin/AnnouncementManager";
import PageManager from "./pages/public/admin/PageManager";
import SettingsManager from "./pages/public/admin/SettingManager";
import ClubDetailPage from "./pages/public/ClubDetailsPage";
// import CommitteePage from "./pages/public/directory/CommitteePage";
import DirectoryPage from "./pages/public/directory/DirectoryPage";
import ExamRoutinePage from "./pages/routines/ExamRoutinesPage";
import SectionsPage from "./pages/section/SectionsPage";
import StudentExamRoutinesPage from "./pages/students/StudentExamRoutinesPage";
import SubjectDetailsPage from "./pages/subjects/SubjectDetailsPage";
import SubmittedAssignment from "./pages/teachers/SubmittedAssignment";
import TeacherExamRoutinePage from "./pages/teachers/TeacherExamRoutinePage";
import { FinanceRoutes } from "./routes/finance.routes";
import CommitteePage from "./pages/public/CommitteePage";
import CommitteeMemberDetail from "./pages/public/CommitteeMemberDetail";
import StaffDetailPage from "./pages/public/StaffDetailPage";
import StudentCabinetDetailPage from "./pages/public/StudentCabinetDetailPage";
import ClubsTab from "./pages/public/directory/ClubsTab";
import StuffTab from "./pages/public/directory/StuffTab";
import CabinetTab from "./pages/public/directory/CabinetTab";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/*" element={<PublicLayout />}>
          <Route index element={<PublicHome />} />
          <Route path=":slug" element={<DynamicPage />} />
          <Route path="announcements" element={<AnnouncementsPage />} />
          <Route path="announcements/:id" element={<AnnouncementDetail />} />
          <Route path='login' element={<Login />} />
          <Route path='signup' element={<Register />} />
          <Route path="activation/:token" element={<UserActivation />} />
          <Route path="directory" element={<DirectoryPage />} />
          <Route path="staff/:id" element={<StaffDetailPage />} />
          <Route path="committee/:id" element={<CommitteeMemberDetail />} />
          <Route path="cabinet/:id" element={<StudentCabinetDetailPage />} />
          <Route path="clubs/:id" element={<ClubDetailPage />} />
          <Route path="committee" element={<CommitteePage />} />
          <Route path="clubs" element={<ClubsTab />} />
          <Route path="staff" element={<StuffTab />} />
          <Route path="cabinet" element={<CabinetTab />} />
        </Route>

        {/* Admin/Teacher Routes with Dashboard Layout */}
        <Route path="/admin/*" element={
          <DashboardWrapper>
            <Routes>
              <Route path="dashboard" element={<AdminProtectedRoute children={<Dashboard />} />} />
              <Route path="teachers" element={<AdminProtectedRoute children={<TeachersPage />} />} />
              <Route path="classes" element={<AdminProtectedRoute children={<ClassesPage />} />} />
              <Route path="classes/:id" element={<ClassDetailsPage />} />
              <Route path="subjects/:id" element={<SubjectDetailsPage />} />
              <Route path="routines" element={<AdminProtectedRoute children={<RoutinePage />} />} />
              <Route path="students" element={<AdminProtectedRoute children={<StudentsPage />} />} />
              <Route path="subjects" element={<AdminProtectedRoute children={<SubjectsPage />} />} />
              <Route path="attendances" element={<AdminProtectedRoute children={<AttendancesPage />} />} />
              <Route path="exams" element={<AdminProtectedRoute children={<ExamsPage />} />} />
              <Route path="exam-routines" element={<AdminProtectedRoute children={<ExamRoutinePage />} />} />
              <Route path="assignments" element={<AdminProtectedRoute children={<AssignmentsPage />} />} />
              <Route path="results" element={<AdminProtectedRoute children={<ResultPage />} />} />
              <Route path="result-sheets" element={<AdminProtectedRoute children={<ResultSheetsPage />} />} />
              <Route path="parents" element={<AdminProtectedRoute children={<ParentsPage />} />} />
              <Route path="roles" element={<AdminProtectedRoute children={<RolesPage />} />} />
              <Route path="user-management" element={<AdminProtectedRoute children={<UserManagement />} />} />
              <Route path="sections" element={<AdminProtectedRoute children={<SectionsPage />} />} />
              <Route path="directory" element={<AdminProtectedRoute children={<DirectoryManager />} />} />
              <Route path="administration" element={<AdminProtectedRoute children={<AdministrationLayout />} />} />

              {/* Admin Pages Management */}
              <Route path="pages" element={<AdminProtectedRoute children={<PageManager />} />} />
              <Route path="settings" element={<AdminProtectedRoute children={<SettingsManager />} />} />
              <Route path="announcements" element={<AdminProtectedRoute children={<AnnouncementManager />} />} />
              {/* Redirect admin root to admin dashboard */}
              <Route path="" element={<Navigate to="dashboard" replace />} />
            </Routes>
          </DashboardWrapper>
        } />

        {/* Finance Portal Routes (Admin + Teacher access) */}
        <Route path="/finance/*" element={<FinanceRoutes />} />

        {/* Teacher Portal Routes */}
        <Route path="/teacher/*" element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <TeacherLayout />
          </ProtectedRoute>
        }>
          <Route index element={<TeacherDashboard />} />
          <Route path="classes" element={<MyClasses />} />
          <Route path="routines" element={<MySchedule />} />
          <Route path="assignments" element={<TeacherAssignments />} />
          <Route path="exams" element={<TeacherExams />} />
          <Route path="exam-duties" element={<TeacherExamRoutinePage />} />
          <Route path="attendance" element={<TeacherAttendance />} />
          <Route path="results" element={<TeacherResults />} />
          <Route path="assignments/:assignmentId" element={<SubmittedAssignment />} />
          <Route path="finance" element={<Navigate to="/finance/dashboard" replace />} /> {/* Redirect to finance portal */}
        </Route>

        {/* Student Portal Routes */}
        <Route path="/student/*" element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentLayout />
          </ProtectedRoute>
        }>
          <Route index element={<StudentDashboard />} />
          <Route path="schedule" element={<StudentSchedule />} />
          <Route path="assignments" element={<StudentAssignments />} />
          <Route path="exams" element={<StudentExams />} />
          <Route path="exams-schedule" element={<StudentExamRoutinesPage />} />
          <Route path="attendance" element={<StudentAttendance />} />
          <Route path="results" element={<StudentResults />} />
          <Route path="profile" element={<StudentProfile />} />

          {/* <Route path="finance-dashboard" element={<StudentFinanceDashboard />} />
          <Route path="fees" element={<StudentFeeList />} />
          <Route path="payments" element={<StudentPaymentHistory />} />
          <Route path="ledger" element={<StudentLedger />} /> */}
        </Route>

        {/* Parent Portal Routes */}
        <Route path="/parent/*" element={
          <ProtectedRoute allowedRoles={['parent']}>
            <ParentLayout />
          </ProtectedRoute>
        }>
          <Route index element={<ParentDashboard />} />
          <Route path="children" element={<ChildrenList />} />
          <Route path="attendance" element={<ChildrenAttendance />} />
          <Route path="results" element={<ChildrenResults />} />
          <Route path="profile" element={<ParentProfile />} />
          <Route path="payments" element={<ParentPayments />} />
          <Route path="payments/:childId" element={<ChildPaymentDetails />} />
          <Route path="payments/receipt/:paymentId" element={<PaymentReceipt />} />
        </Route>

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App;