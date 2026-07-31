
const express = require("express");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { upload } = require("../multer");
const sendMail = require("../utils/sendMail");
const sendToken = require("../utils/jwtToken");
const { isAuthenticated, isAdmin } = require("../middleware/auth");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");

const Parent = require("../models/Parent");
const Teacher = require("../models/Teacher");

const router = express.Router();

const createActivationToken = (user) => jwt.sign(user, process.env.ACTIVATION_SECRET, { expiresIn: "5m" });

// Register user
router.post("/create-user",
  upload.single("file"),
  // isAdmin("admin", "superAdmin"), // ✅ allow both
  (async (req, res, next) => {
    const { name, email, password } = req.body;
    console.log("create user called :", req.body)
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      if (req.file) fs.unlink(`uploads/${req.file.filename}`, (err) => err && console.log(err));
      return next(new ErrorHandler("User already exists", 400));
    }

    // const fileUrl = req.file ? path.join(req.file.filename) : null;
    const fileUrl = req.file ? path.join("uploads", req.file.filename) : null;
    // const hashedPassword = await bcrypt.hash(password, 10);

    const activationToken = createActivationToken({
      name,
      email,
      // password: hashedPassword,
      password,
      avatar: fileUrl
    });
    const activationUrl = `${process.env.ACTIVATION_LINK}${activationToken}`;

    await sendMail({
      email,
      subject: "Activate your account",
      message: `
  <h1>Hello ${name},</h1>
  <p>Please click the link below to activate your account:</p>
  <a href="${activationUrl}" style="padding:10px 20px; background:#4caf50; color:#fff; text-decoration:none;">Activate Account</a>
  <p>This link will expire in 15 minutes.</p>
`,
    });

    res.status(201).json({
      success: true,
      message: `Check your email at ${email} to activate your account!`,
    });
  }));

// Activate user account
router.post("/activation", catchAsyncErrors(async (req, res, next) => {
  const { activation_token } = req.body;
  if (!activation_token) return next(new ErrorHandler("Missing activation token", 400));

  const newUser = jwt.verify(activation_token, process.env.ACTIVATION_SECRET);

  if (!newUser) return next(new ErrorHandler("Invalid token", 400));

  const userExists = await User.findOne({ email: newUser.email });
  if (userExists) return next(new ErrorHandler("User already exists", 400));

  const user = await User.create(newUser);
  sendToken(user, 201, res);
}));

// // User login (working)
// router.post("/login-user", catchAsyncErrors(async (req, res, next) => {
//   const { email, password } = req.body;
//   if (!email || !password) return next(new ErrorHandler("All fields are required", 400));

//   const user = await User.findOne({ email }).select("+password");
//   if (!user || !(await user.comparePassword(password))) return next(new ErrorHandler("Invalid credentials", 400));

//   sendToken(user, 201, res);
// }));

router.post("/login-user", catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorHandler("All fields are required", 400));
  }

  const user = await User.findOne({ email })
    .select("+password")
    .populate('role', 'name');

  if (!user || !(await user.comparePassword(password))) {
    return next(new ErrorHandler("Invalid credentials", 400));
  }

  // Check if role exists
  if (!user.role) {
    return next(new ErrorHandler("User role not found", 400));
  }

  // Get profile data based on role
  let profile = null;
  if (user.role.name === 'teacher') {
    profile = await Teacher.findOne({ user: user._id })
      .populate('subjects')
      .populate('classes');
  } else if (user.role.name === 'parent') {
    profile = await Parent.findOne({ user: user._id })
      .populate('children');
  }

  sendToken(user, 200, res, {
    profile: profile
  });
}));


// Logout user
router.post("/logout", catchAsyncErrors(async (req, res) => {
  res.cookie("token", null, { expires: new Date(Date.now()), httpOnly: true });
  res.status(200).json({ success: true, message: "Logged out successfully!" });
}));


router.get(
  "/refresh",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    const oldRefreshToken = req.cookies.refreshToken;

    // console.log("Refresh Token:", oldRefreshToken);

    if (!oldRefreshToken) {
      return next(new ErrorHandler("Refresh token not found", 403));
    }

    jwt.verify(oldRefreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
      if (err) {
        return next(new ErrorHandler("Invalid refresh token", 403));
      }

      // const userId = decoded.userId;
      const id = decoded.id;

      // Generate a new access token (valid for 15 minutes)
      const accessToken = jwt.sign({ id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });

      // Generate a new refresh token (valid for 7 days)
      const newRefreshToken = jwt.sign({ id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });

      // Store the new refresh token in cookies
      res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "None", // Ensure cross-site requests work
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Store the new access token in cookies
      res.cookie("token", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "None",
        maxAge: 15 * 60 * 1000, // 15 minutes
      });

      return res.status(200).json({
        success: true,
        message: "Access and refresh tokens refreshed",
      });
    });
  })
);



// Get current logged-in user info
router.get(
  "/auth/me",
  isAuthenticated,
  catchAsyncErrors(async (req, res) => {
    const token = req.token; // ✅ grab the token from middleware
    const user = await User.findById(req.user._id)
      .populate("role");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      token, // ✅ send token
      user,
    });
  })
);


// Update user info
router.put("/update-user-info", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
  const { email, password, phoneNumber, name } = req.body;
  const user = await User.findById(req.user._id).select("+password");

  if (!(await user.comparePassword(password))) return next(new ErrorHandler("Incorrect password", 400));

  Object.assign(user, { name, email, phoneNumber });
  await user.save();

  res.status(200).json({ success: true, user });
}));

// Admin: Delete user
router.delete("/delete-user/:id", isAuthenticated, catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new ErrorHandler("User not found", 400));

  await user.remove();
  res.status(200).json({ success: true, message: "User deleted successfully!" });
}));



//get single user 
router.get(
  "/admin-user/:id",
  isAuthenticated,
  // isAdmin("admin"),
  catchAsyncErrors(async (req, res) => {
    const user = await User.findById(req.params.id)
      .populate("role")

    if (!user) throw new Error("User not found");

    res.status(200).json({ success: true, user });
  })
);

router.get(
  "/all-users",
  isAuthenticated,
  catchAsyncErrors(async (req, res) => {
    const users = await User.find()
      .populate("role")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, users });
  })
);



// POST: send reset link
router.post("/forgot-password", catchAsyncErrors(async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return next(new ErrorHandler("User not found", 404));

  const resetToken = crypto.randomBytes(32).toString("hex");
  user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 mins
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  await sendMail({
    email: user.email,
    subject: "Password Reset",
    message: `Click here to reset your password: ${resetUrl}`,
  });

  res.status(200).json({ success: true, message: `Reset link sent to ${email}` });
}));

// PUT: reset password
router.put("/reset-password/:token", catchAsyncErrors(async (req, res, next) => {
  const resetPasswordToken = crypto.createHash("sha256").update(req.params.token).digest("hex");
  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) return next(new ErrorHandler("Invalid or expired token", 400));

  const { newPassword, confirmPassword } = req.body;
  if (newPassword !== confirmPassword) return next(new ErrorHandler("Passwords do not match", 400));

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  res.status(200).json({ success: true, message: "Password reset successful!" });
}));


// ✅ Update user details by SuperAdmin/Admin
router.put(
  "/update-user-by-admin/:id",
  isAuthenticated,
  async (req, res) => {
    try {
      const requester = req.user;

      if (!["superAdmin", "admin"].includes(requester.role?.roleName)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const { name, email } = req.body;

      const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        { name, email },
        { new: true }
      );

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ success: true, user: updatedUser });
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// ✅ Reset user password (SuperAdmin/Admin can bypass old password)
router.put(
  "/:id/reset-user-password-by-admin",
  isAuthenticated,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { oldPassword, newPassword } = req.body;

      const user = await User.findById(id);
      if (!user) return res.status(404).json({ message: "User not found" });

      const requester = req.user;
      const isPrivileged = ["admin", "superAdmin"].includes(
        requester.role?.roleName
      );

      // ✅ If not privileged, must provide old password
      if (!isPrivileged) {
        if (!oldPassword) {
          return res.status(400).json({
            message: "Old password is required to change password",
          });
        }

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
          return res.status(400).json({ message: "Old password is incorrect" });
        }
      }

      // ✅ Hash new password
      user.password = newPassword;
      await user.save();

      res.status(200).json({ message: "Password updated successfully" });
    } catch (err) {
      console.error("resetPassword error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

module.exports = router;