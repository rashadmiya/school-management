
# School Management Frontend Starter

This archive contains a starter frontend structure (Vite + React + Tailwind + shadcn/ui + Redux Toolkit + RTK Query)
prepared to integrate with the backend you built.

Folders included:
- src/
  - app/
    - store.js
  - features/
    - api/
      - apiSlice.js
      - studentsApi.js
      - notificationsApi.js
    - auth/
      - authSlice.js
      - authApi.js
      - Login.jsx
      - Register.jsx
  - layout/
    - DashboardLayout.jsx
    - Sidebar.jsx
    - Navbar.jsx
  - hooks/
    - ProtectedRoute.jsx
  - pages/
    - Dashboard.jsx
    - StudentsPage.jsx
  - components/
    - common/
      - DataTable.jsx
      - ConfirmDialog.jsx
    - student/
      - StudentList.jsx
      - StudentForm.jsx
  - main.jsx
  - App.jsx

Notes:
- You already used shadcn/ui in your project. This starter assumes you generated `src/components/ui/*` using `npx shadcn-ui add ...`.
- Update API_BASE_URL in src/features/api/apiSlice.js to point to your backend.
- Install dependencies: react, react-dom, react-router-dom, @reduxjs/toolkit, react-redux, @reduxjs/toolkit/query, axios (optional), react-hook-form, lucide-react, shadcn components, tailwindcss.




Styling & UX polish notes (small, but important)

Use shadcn Dialog for forms (instead of the simple fixed modal I used) for better accessibility.

Use react-hook-form + validations for robust UX (I used basic react-hook-form usage already in forms).

For Routine, prefer a calendar-like view (one column per day); but list table is fine for MVP.

Show friendly server error messages when server rejects due to conflict.

For ClassForm, fetch subjects if your backend requires assigning subjects.

npx shadcn@latest init
npx shadcn@latest add popover
npx shadcn@latest add switch

next important tasks:
finence niye kaj korte hobe, finance quick access need to implement

backend photo should be uploaded at the photos/avaters folder inside uploads
student image upload not working.

# finance features should works like that, there can be two types of fees
1.  fees for all class
2.  fees for specific class (include all sections of the class).

when admin/teacher create a fees entry (for example, convocation fees for class 10 - and its for all section, yearly utility fees for all student-its for all active students for the session), it will appear on the students ledger based on class or (for the all student if it is for all).

teacher will able to collect the fees. after teacher collect fees for a student and enter it in our application,  it will be shown in the student ledger transactions.

student all dues, all paids should shown in the student finanec.
and students totall dues, totall collected, totall balance will be shown in the finanec dashboard.

# attendance need to check (attendance period should be check from routine, if subject has scheduled of the date, we will take the routine period from it and set it on the attendance period),


# Install required packages
npm install @reduxjs/toolkit react-redux date-fns react-hook-form @hookform/resolvers axios
npx shadcn@latest add button card table dialog form input label select textarea badge alert avatar spinner pagination separator tabs calendar popover toast
npm install lucide-react recharts
