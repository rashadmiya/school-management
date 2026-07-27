
// src/routes/finance.routes.tsx
import FinanceLayout from '@/layout/FinanceLayout';
import ApplyFees from '@/pages/finance/fees/ApplyFees';
import FeeTemplates from '@/pages/finance/fees/FeeTemplates';
import StudentFees from '@/pages/finance/fees/StudentFees';
import FinanceDashboard from '@/pages/finance/FinanceDashboard';
import StudentLedger from '@/pages/finance/Ledger/StudentLedger';
import AdvanceBalance from '@/pages/finance/Payments/AdvanceBalance';
import PaymentHistory from '@/pages/finance/Payments/PaymentHistory';
import ReceivePayment from '@/pages/finance/Payments/ReceivePayment';
import ProcessRefund from '@/pages/finance/Refunds/ProcessRefund';
import RefundHistory from '@/pages/finance/Refunds/RefundHistory';
import CollectionReport from '@/pages/finance/Reports/CollectionReport';
import OutstandingReport from '@/pages/finance/Reports/OutstandingReport';
import SessionSettings from '@/pages/finance/Settings/SessionSettings';
import ApproveWaivers from '@/pages/finance/Waivers/ApproveWaivers';
import RequestWaiver from '@/pages/finance/Waivers/RequestWaiver';
import { Route, Routes } from 'react-router-dom';

export const FinanceRoutes = () => {
  return (
    <Routes>
      <Route element={<FinanceLayout />}>
        {/* index route = /finance */}
        <Route index element={<FinanceDashboard />} />

        <Route path="fees/templates" element={<FeeTemplates />} />
        <Route path="fees/students" element={<StudentFees />} />
        <Route path="fees/apply" element={<ApplyFees />} />

        <Route path="payments/receive" element={<ReceivePayment />} />
        <Route path="payments/history" element={<PaymentHistory />} />
        <Route path="payments/advance" element={<AdvanceBalance />} />

        <Route path="refunds" element={<ProcessRefund />} />
        <Route path="refunds/history" element={<RefundHistory />} />

        <Route path="waivers/request" element={<RequestWaiver />} />
        <Route path="waivers/approve" element={<ApproveWaivers />} />

        <Route path="ledger" element={<StudentLedger />} />

        <Route path="reports/collection" element={<CollectionReport />} />
        <Route path="reports/outstanding" element={<OutstandingReport />} />

        <Route path="settings/session" element={<SessionSettings />} />
      </Route>
    </Routes>
  );
};

// // src/routes/finance.routes.tsx
// import FinanceLayout from '@/layout/FinanceLayout';
// import ApplyFees from '@/pages/finance/fees/ApplyFees';
// import FeeTemplates from '@/pages/finance/fees/FeeTemplates';
// import StudentFees from '@/pages/finance/fees/StudentFees';
// import FinanceDashboard from '@/pages/finance/FinanceDashboard';
// import StudentLedger from '@/pages/finance/Ledger/StudentLedger';
// import AdvanceBalance from '@/pages/finance/Payments/AdvanceBalance';
// import PaymentHistory from '@/pages/finance/Payments/PaymentHistory';
// import ReceivePayment from '@/pages/finance/Payments/ReceivePayment';
// import ProcessRefund from '@/pages/finance/Refunds/ProcessRefund';
// import RefundHistory from '@/pages/finance/Refunds/RefundHistory';
// import CollectionReport from '@/pages/finance/Reports/CollectionReport';
// import OutstandingReport from '@/pages/finance/Reports/OutstandingReport';
// import SessionSettings from '@/pages/finance/Settings/SessionSettings';
// import ApproveWaivers from '@/pages/finance/Waivers/ApproveWaivers';
// import RequestWaiver from '@/pages/finance/Waivers/RequestWaiver';
// import { Route, Routes } from 'react-router-dom';

// export const FinanceRoutes = () => {
//   return (
//     <FinanceLayout>
//       <Routes>
//         <Route 
//           path="/"
//           element={
//             <div className="space-y-6">
//               <FinanceDashboard />
//             </div>
//           }
//         />
//         <Route path="/fees/templates" element={<FeeTemplates />} />
//         <Route path="/fees/students" element={<StudentFees />} />
//         <Route path="/fees/apply" element={<ApplyFees />} />
//         <Route path="/payments/receive" element={<ReceivePayment />} />
//         <Route path="/payments/history" element={<PaymentHistory />} />
//         <Route path="/payments/advance" element={<AdvanceBalance />} />
//         <Route path="/finance/refunds" element={<ProcessRefund />} />
//         <Route path="/finance/refunds/history" element={<RefundHistory />} />
//         <Route path="/finance/waivers/request" element={<RequestWaiver />} />
//         <Route path="/finance/waivers/approve" element={<ApproveWaivers />} />
//         <Route path="/finance/waivers/ledger" element={<StudentLedger />} />
//         <Route path="/finance/reports/collection" element={<CollectionReport />} />
//         <Route path="/finance/reports/outstanding" element={<OutstandingReport />} />
//         <Route path="/finance/settings/session" element={<SessionSettings />} />

//       </Routes>
//     </FinanceLayout>
//   );
// };