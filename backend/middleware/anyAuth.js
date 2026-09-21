// middleware/anyAuth.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Student = require("../models/Student");
const Parent = require("../models/Parent");
const ErrorHandler = require("../utils/ErrorHandler");

exports.isAnyAuthenticated = async (req, res, next) => {
    const userToken = req.cookies.token;
    const parentToken = req.cookies.parent_token;
    const studentToken = req.cookies.student_token;

    if (!userToken && !parentToken && !studentToken) {
        return next(new ErrorHandler("Please log in to access this resource", 401));
    }

    try {
        // ---------- STAFF ----------
        if (userToken) {
            const decoded = jwt.verify(userToken, process.env.ACCESS_TOKEN_SECRET);
            const user = await User.findById(decoded.id).populate("role").lean();
            if (!user) return next(new ErrorHandler("User not found", 404));

            req.auth = {
                type: "user",
                user,
                role: user.role?.roleName || user.role?.name,
            };
            return next();
        }

        // ---------- PARENT ----------
        if (parentToken) {
            const decoded = jwt.verify(parentToken, process.env.PARENT_JWT_SECRET);
            if (decoded.type !== "parent") {
                return next(new ErrorHandler("Invalid session", 401));
            }

            // Populate children so downstream routes can do ownership checks
            // without a second query.
            const parent = await Parent.findById(decoded.parentId)
                .select("-pin -otpHash")
                .populate("children", "_id name rollNumber")
                .lean();

            if (!parent || !parent.isActive) {
                return next(new ErrorHandler("Account disabled", 401));
            }

            req.auth = {
                type: "parent",
                parent,
                role: "parent",
            };
            return next();
        }

        // ---------- STUDENT ----------
        if (studentToken) {
            const decoded = jwt.verify(studentToken, process.env.ACCESS_TOKEN_SECRET);
            const student = await Student.findById(decoded.id)
                .populate("class grade parent")
                .lean();
            if (!student) return next(new ErrorHandler("Student not found", 404));

            req.auth = {
                type: "student",
                student,
                role: "student",
            };
            return next();
        }
    } catch (err) {
        console.error("Auth error:", err);
        return next(new ErrorHandler("Not authorized", 401));
    }
};

// // middleware/anyAuth.js
// const jwt = require("jsonwebtoken");
// const User = require("../models/User");
// const Student = require("../models/Student");
// const ErrorHandler = require("../utils/ErrorHandler");

// exports.isAnyAuthenticated = async (req, res, next) => {
//     const userToken = req.cookies.token;
//     const studentToken = req.cookies.student_token;
//     const parentToken = req.cookies.parent_token;

//     if (!userToken && !studentToken) {
//         return next(new ErrorHandler("Please log in to access this resource", 401));
//     }

//     try {
//         // =====================
//         // USER (Admin / Staff)
//         // =====================
//         if (userToken) {
//             const decoded = jwt.verify(userToken, process.env.ACCESS_TOKEN_SECRET);

//             const user = await User.findById(decoded.id)
//                 .populate("role")
//                 .lean();

//             if (!user) {
//                 return next(new ErrorHandler("User not found", 404));
//             }

//             req.auth = {
//                 type: "user",                // 🔑
//                 user,
//                 role: user.role.roleName
//             };

//             return next();
//         }

//         // =====================
//         // STUDENT
//         // =====================
//         if (studentToken) {
//             const decoded = jwt.verify(studentToken, process.env.ACCESS_TOKEN_SECRET);

//             const student = await Student.findById(decoded.id)
//                 .populate("class grade parent")
//                 .lean();

//             if (!student) {
//                 return next(new ErrorHandler("Student not found", 404));
//             }

//             req.auth = {
//                 type: "student",             // 🔑
//                 student,
//                 role: "student"
//             };

//             return next();
//         }

//         if (parentToken) {
//             const decoded = jwt.verify(parentToken, process.env.PARENT_JWT_SECRET);
//             if (decoded.type !== 'parent') {
//                 return next(new ErrorHandler('Invalid session', 401));
//             }
//             const parent = await Parent.findById(decoded.parentId).lean();
//             if (!parent || !parent.isActive) {
//                 return next(new ErrorHandler('Account disabled', 401));
//             }
//             req.auth = { type: 'parent', parent, role: 'parent' };
//             return next();
//         }

//     } catch (err) {
//         console.error("Auth error:", err);
//         return next(new ErrorHandler("Not authorized", 401));
//     }
// };
