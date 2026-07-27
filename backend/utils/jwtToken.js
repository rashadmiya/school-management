// utils/jwtToken.js
// const jwt = require("jsonwebtoken")
// const sendToken = (user, statusCode, res, additionalData = {}) => {
//   const token = user.getJwtToken();

//   const options = {
//     expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
//     httpOnly: true,
//     sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
//     secure: process.env.NODE_ENV === "production",
//   };

//   res
//     .status(statusCode)
//     .cookie("token", token, options)
//     .json({
//       success: true,
//       user: {
//         _id: user._id,
//         name: user.name,
//         email: user.email,
//         phoneNumber: user.phoneNumber,
//         avatar: user.avatar,
//         role: user.role?.name || user.role,
//         isVerified: user.isVerified,
//       },
//       ...additionalData, // Include any additional data like profile
//       token,
//     });
// };

// module.exports = sendToken;


//working sendToken
const jwt = require("jsonwebtoken");

const sendToken = (user, statusCode, res) => {
  const token = user.getJwtToken();
  const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });

  const options = {
    expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Strict",
    secure: process.env.NODE_ENV === "production",
  };

  res.status(statusCode)
    .cookie("token", token, options)
    .cookie("refreshToken", refreshToken, { ...options, expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) })
    .json({
      success: true,
      user,
      token,
    });
};

module.exports = sendToken;