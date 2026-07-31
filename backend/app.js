
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const path = require("path");
const ErrorHandler = require("./utils/error")
const app = express();


// working cors
// const allowedOrigins = process.env.FRONTEND_URL_FOR_CORS
//   .split(",")
//   .map(origin => origin.trim());

// const corsOptions = {
//   origin(origin, callback) {

//     // Allow requests like Postman or server-to-server
//     if (!origin) {
//       return callback(null, true);
//     }

//     if (allowedOrigins.includes(origin)) {
//       return callback(null, true);
//     }

//     return callback(new Error("Not allowed by CORS"));
//   },

//   credentials: true,
//   methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//   allowedHeaders: ["Content-Type", "Authorization"],
// };

// app.use(cors(corsOptions));

app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));

// Serve static uploads folder
app.use("/uploads", express.static(path.resolve(__dirname, "uploads")));

// Serve static files (e.g., fonts)
app.use(express.static('public'));

// Test route
app.use("/test", (req, res) => {
  res.send("Hello world!");
});

// Import routes
const user = require("./controllers/user");
const assignmentRoutes = require("./controllers/assignmentRoutes");
const attendance = require("./controllers/attendance");
const classRoutes = require("./controllers/classRoutes");
const examRoutes = require("./controllers/examRoutes");
const gradeRoutes = require("./controllers/gradeRoutes");
const parentRoutes = require("./controllers/parentRoutes");
const resultRoutes = require("./controllers/resultRoutes");
const resultSheetRoutes = require("./controllers/resultSheetRoutes");
const routineRoutes = require("./controllers/routineRoutes");
const studentRoutes = require("./controllers/studentRoutes");
const subjectRoutes = require("./controllers/subjectRoutes");
const teacherRoutes = require("./controllers/teacherRoutes");
const roleRoutes = require("./controllers/roleRoutes");
const financeRoutes = require("./controllers/financeRoutes");
const adminRoutes = require("./controllers/adminRoutes");
const publicRoutes = require("./controllers/publicRoutes");
const announcementRoutes = require("./controllers/announcementRoutes");
const sectionRoutes = require("./controllers/sectionRoutes");
const examRoutineRoutes = require("./controllers/examRoutineRoutes");
// NEW: Directory routes
const stuffRoutes = require('./controllers/stuffRoutes');
const committeeRoutes = require('./controllers/committeeRoutes');
const cabinetRoutes = require('./controllers/cabinetRoutes');
const clubRoutes = require('./controllers/clubRoutes');
//finance routes
const feesRoutes = require('./financeSystem/routes/feeRoutes');
const ledgerRoutes = require('./financeSystem/routes/ledgerRoutes');
const paymentRoutes = require('./financeSystem/routes/paymentRoutes');
const refundRoutes = require('./financeSystem/routes/refundRoutes');
const waiverRoutes = require('./financeSystem/routes/waiverRoutes');
const reportRoutes = require('./financeSystem/routes/reportRoutes');
//finance routes

app.use("/api/s2/user", user);
app.use("/api/s2/assignments", assignmentRoutes);
app.use("/api/s2/attendance", attendance);
app.use("/api/s2/classes", classRoutes);
app.use("/api/s2/exams", examRoutes);
app.use("/api/s2/grade", gradeRoutes);
app.use("/api/s2/parents", parentRoutes);
app.use("/api/s2/results", resultRoutes);
app.use("/api/result-sheets", resultSheetRoutes);
app.use("/api/s2/routines", routineRoutes);
app.use("/api/s2/students", studentRoutes);
app.use("/api/s2/subjects", subjectRoutes);
app.use("/api/s2/teachers", teacherRoutes);
app.use("/api/s2/roles", roleRoutes);
// app.use("/api/s2/finance", financeRoutes);
app.use("/api/s2/admin", adminRoutes);
app.use("/api/s2/public", publicRoutes);
app.use("/api/s2/announcements", announcementRoutes);
app.use("/api/s2/sections", sectionRoutes);
app.use("/api/s2/exam-routines", examRoutineRoutes);
// NEW: Mount directory routes
app.use('/api/s2/stuff', stuffRoutes);
app.use('/api/s2/committee', committeeRoutes);
app.use('/api/s2/cabinet', cabinetRoutes);
app.use('/api/s2/clubs', clubRoutes);
// app.use("/api/s2/finance/reports", reportRoutes);
// NEW: Mount finance routes
app.use("/api/s2/fees", feesRoutes);
app.use("/api/s2/ledger", ledgerRoutes);
app.use("/api/s2/payments", paymentRoutes);
app.use("/api/s2/refunds", refundRoutes);
app.use("/api/s2/waivers", waiverRoutes);
app.use('/api/s2/reports', reportRoutes);

// Global error handler
app.use(ErrorHandler);

module.exports = app;