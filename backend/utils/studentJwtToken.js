const jwt = require("jsonwebtoken");

const sendStudentToken = (student, statusCode, res) => {
  const token = student.getJwtToken();

  // Create a refresh token specifically for the student
  const refreshToken = jwt.sign(
    { id: student._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );

  const options = {
    expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Strict",
    secure: process.env.NODE_ENV === "production",
  };
  // console.log("user at student jwt token:", student.toObject())

  res.status(statusCode)
    // ✅ Use different cookie names to avoid collision with admin/teacher cookies
    .cookie("student_token", token, options)
    .cookie("student_refreshToken", refreshToken, {
      ...options,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    })
    .json({
      success: true,
      user: { ...student.toObject(), role: { name: "student" } },
      token,
    });

};

module.exports = sendStudentToken;

// const jwt = require("jsonwebtoken");

// const sendStudentToken = (student, statusCode, res) => {
//   const token = student.getJwtToken();

//   const options = {
//     expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
//     httpOnly: true,
//     sameSite: "lax",
//     secure: process.env.NODE_ENV === "production",
//   };

//   res
//     .status(statusCode)
//     .cookie("student_token", token, options) // ✅ different cookie name
//     .json({
//       success: true,
//       token,
//       student,
//     });
// };

// module.exports = sendStudentToken;
