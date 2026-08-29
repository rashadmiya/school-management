// config/multer.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
  destination(req, file, cb) {
    let uploadPath = "uploads/others";

    console.log("upload photo filename:", file.fieldname)
    // For gallery images
    if (file.fieldname === "image" || file.fieldname === "gallery") {
      uploadPath = "uploads/gallery";
    } else if (file.fieldname === "hero" || file.fieldname === "heroSlider") {
      uploadPath = "uploads/hero";
    }

    // For profile photos
    else if (file.fieldname === "photo" || file.fieldname === "avatar") {
      if (req.baseUrl && req.baseUrl.includes("students")) {
        uploadPath = "uploads/avatars/students";
      } else if (req.baseUrl && req.baseUrl.includes("teachers")) {
        uploadPath = "uploads/avatars/teachers";
      } else {
        uploadPath = "uploads/avatars";
      }
    }
    // For other uploads
    else if (file.fieldname === "file" || file.fieldname === "document") {
      uploadPath = "uploads/documents";
    }

    // FIXED: Use the same working pattern as your old code
    // __dirname is the config folder, so we join with uploadPath
    // This creates the full path relative to the config folder
    const fullPath = path.join(__dirname, uploadPath);

    console.log("Creating directory at:", fullPath);

    // Create directory if it doesn't exist
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log("Directory created:", fullPath);
    }

    cb(null, fullPath);
  },

  filename(req, file, cb) {
    const ext = path.extname(file.originalname);
    const name = path.parse(file.originalname).name.replace(/\s+/g, "-");
    const filename = `${name}-${Date.now()}${ext}`;
    console.log("Generated filename:", filename);
    cb(null, filename);
  }
});

// File filter for images
const imageFileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPEG, PNG, and WebP images are allowed."), false);
  }
};

// File filter for documents
const documentFileFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only PDF and Word documents are allowed."), false);
  }
};

// Create multer instances
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: imageFileFilter,
});

const uploadDocument = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: documentFileFilter,
});

// Custom middleware for logo upload
const uploadLogo = multer({
    storage: multer.diskStorage({
        destination(req, file, cb) {
            const fullPath = path.join(__dirname, "uploads/logos");
            if (!fs.existsSync(fullPath)) {
                fs.mkdirSync(fullPath, { recursive: true });
            }
            cb(null, fullPath);
        },
        filename(req, file, cb) {
            const ext = path.extname(file.originalname);
            const name = path.parse(file.originalname).name.replace(/\s+/g, "-");
            const filename = `logo-${Date.now()}${ext}`;
            console.log("Generated logo filename:", filename);
            cb(null, filename);
        }
    }),
    limits: {
        fileSize: 2 * 1024 * 1024, // 2MB limit for logos
    },
    fileFilter: imageFileFilter,
});

// Single image upload middleware
const uploadSingleImage = upload.single("image");
const uploadSinglePhoto = upload.single("photo");
const uploadSingleDocument = uploadDocument.single("document");
const uploadHeroImage = upload.single("hero"); // Add this
// Multiple images upload
const uploadMultipleImages = upload.array("images", 10);
const uploadLogoImage = uploadLogo.single("logo"); // field name will be 'logo'

module.exports = {
  upload,
  uploadDocument,
  uploadSingleImage,
  uploadSinglePhoto,
  uploadSingleDocument,
  uploadMultipleImages,
  uploadHeroImage,
  uploadLogoImage
};