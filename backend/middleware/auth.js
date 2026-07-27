const ErrorHandler = require("../utils/ErrorHandler");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// middleware/studentAuth.js
const Student = require("../models/Student");

exports.isAuthenticated = async (req, res, next) => {
  const token = req.cookies.token;

  // console.log("token at isAuthenticated :", token)
  if (!token) return next(new ErrorHandler("(@) Please log in to access this resource", 401));

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // Populate the role so we have roleName and permissions
    const user = await User.findById(decoded.id)
      .populate("role") // this is the key
      .lean(); // optional, returns plain object


    if (!user) return next(new ErrorHandler("User not found", 404));
    // console.log("user at isAuthenticated :", user)

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error(error);
    return next(new ErrorHandler("Not authorized", 401));
  }
};


exports.isAdmin = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role.roleName)) {
      return next(
        new ErrorHandler(`${req.user.role.roleName} cannot access this resource!`, 403)
      );
    }
    next();
  };
};


exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    // console.log("user at authorizeRoles :", req.user)
    if (!roles.includes(req.user.role.name)) {
      return next(
        new ErrorHandler(`${req.user.role.name} cannot access this resource!`, 403)
      );
    }
    next();
  };
};


// Middleware - use req.user
exports.isStudentAuthenticated = async (req, res, next) => {
  const token = req.cookies.student_token;

  // console.log("token :", token)
  // console.log("req.cookies :", req.cookies)
  if (!token) {
    return next(new ErrorHandler("Please log in to access this resource", 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const student = await Student.findById(decoded.id)
      .populate("class grade parent")
      .lean();

    if (!student) {
      return next(new ErrorHandler("Student not found", 404));
    }

    req.user = student; // ✅ Use req.user for consistency
    req.token = token;
    next();
  } catch (error) {
    console.error("Student auth error:", error);
    return next(new ErrorHandler("Not authorized", 401));
  }
};

// exports.isStudentAuthenticated = async (req, res, next) => {
//   const token = req.cookies.student_token;
//   console.log("isStudentAuthenticated");
//   console.log("token :", token);

//   if (!token) {
//     return next(new ErrorHandler("Please log in to access this resource", 401));
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

//     const student = await Student.findById(decoded.id)
//       .populate("class grade parent")
//       .lean();

//     if (!student) {
//       return next(new ErrorHandler("Student not found", 404));
//     }

//     // ✅ Use req.user instead of req.student for consistency
//     req.user = student;
//     req.token = token;
//     next();
//   } catch (error) {
//     console.error(error);
//     return next(new ErrorHandler("Not authorized", 401));
//   }
// };

