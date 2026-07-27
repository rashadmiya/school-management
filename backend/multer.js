const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
  destination(req, file, cb) {
    let uploadPath = "uploads/others";

    if (file.fieldname === "photo") {
      if (req.baseUrl.includes("students")) {
        uploadPath = "uploads/avatars/students";
      } else if (req.baseUrl.includes("teachers")) {
        uploadPath = "uploads/avatars/teachers";
      }
    }

    // const fullPath = path.join(__dirname, "..", uploadPath);
    const fullPath = path.join(__dirname, uploadPath);

    fs.mkdirSync(fullPath, { recursive: true });
    cb(null, fullPath);
  },

  filename(req, file, cb) {
    const ext = path.extname(file.originalname);
    const name = path.parse(file.originalname).name.replace(/\s+/g, "-");
    cb(null, `${name}-${Date.now()}${ext}`);
  }
});



// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     let uploadPath = "uploads/others";

//     // Avatar images
//     if (file.fieldname === "photo") {
//       if (req.baseUrl.includes("teachers")) {
//         uploadPath = "uploads/avatars/teachers";
//       } else if (req.baseUrl.includes("students")) {
//         uploadPath = "uploads/avatars/students";
//       } else {
//         uploadPath = "uploads/avatars";
//       }
//     }

//     // Documents
//     else if (
//       file.mimetype.startsWith("application/") ||
//       file.mimetype === "text/plain"
//     ) {
//       uploadPath = "uploads/documents";
//     }

//     // const fullPath = path.join(__dirname, "..", uploadPath);
//     // const fullPath = path.join(__dirname, "../backend", uploadPath);
//     const fullPath = path.join(__dirname, "..", uploadPath);

//     fs.mkdirSync(fullPath, { recursive: true });

//     cb(null, fullPath);
//   },

//   filename: function (req, file, cb) {
//     const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
//     const ext = path.extname(file.originalname);
//     const name = path
//       .parse(file.originalname)
//       .name.replace(/\s+/g, "-");

//     cb(null, `${name}-${uniqueSuffix}${ext}`);
//   },
// });

exports.upload = multer({ storage });


// const multer = require("multer");
// const path = require("path");


// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, path.join(__dirname, './uploads'));
//     },
//     filename: function (req, file, cb) {
//         const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
//         const ext = path.extname(file.originalname);
//         const filename = path.parse(file.originalname).name;
//         cb(null, filename + "-" + uniqueSuffix + ext);
//     },
// });

// exports.upload = multer({storage: storage});