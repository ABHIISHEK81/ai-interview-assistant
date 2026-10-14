const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AppError = require('../utils/AppError');
const cloudinary = require('../config/cloudinary');

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/x-pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt'];

// File filter supporting both MIME and filename extension
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_MIME_TYPES.includes(file.mimetype) || ALLOWED_EXTENSIONS.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        'Invalid file type. Only PDF, DOC, and DOCX files are allowed.',
        400
      ),
      false
    );
  }
};

let storage;

const isCloudinaryConfigured =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET &&
  !process.env.CLOUDINARY_CLOUD_NAME.includes('your_') &&
  !process.env.CLOUDINARY_CLOUD_NAME.includes('mock_') &&
  !process.env.CLOUDINARY_API_KEY.includes('mock_') &&
  !process.env.CLOUDINARY_API_KEY.includes('your_');

if (isCloudinaryConfigured) {
  try {
    const { CloudinaryStorage } = require('multer-storage-cloudinary');
    storage = new CloudinaryStorage({
      cloudinary: cloudinary,
      params: {
        folder: 'ai-interview/resumes',
        resource_type: 'auto',
        allowed_formats: ['pdf', 'doc', 'docx'],
      },
    });
  } catch (err) {
    storage = createLocalStorage();
  }
} else {
  storage = createLocalStorage();
}

function createLocalStorage() {
  const uploadDir = path.join(__dirname, '../../uploads/resumes');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  });
}

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB per PDF p. 371
  },
  fileFilter: fileFilter,
});

module.exports = upload;
