const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Configure multer for disk storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    try {
      // Default folder or use custom folder from route
      const folder = req.uploadFolder || 'uploads/temp';
      const uploadDir = path.join(process.cwd(), folder);
      
      console.log(`📂 Creating upload directory: ${uploadDir}`);
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
        console.log(`✅ Directory created: ${uploadDir}`);
      }
      
      cb(null, uploadDir);
    } catch (error) {
      console.error('❌ Error creating upload directory:', error);
      cb(error);
    }
  },
  filename: function (req, file, cb) {
    try {
      console.log(`📝 Generating filename for: ${file.originalname}`);
      const timestamp = Date.now();
      const uuid = uuidv4();
      const extension = path.extname(file.originalname);
      const baseName = path.basename(file.originalname, extension);
      
      // Sanitize filename
      const sanitizedName = baseName.replace(/[^a-zA-Z0-9-_]/g, '_');
      const uniqueFileName = `${timestamp}_${uuid}_${sanitizedName}${extension}`;
      
      console.log(`✅ Generated filename: ${uniqueFileName}`);
      cb(null, uniqueFileName);
    } catch (error) {
      console.error('❌ Error generating filename:', error);
      cb(error);
    }
  }
});

// File filter function for general uploads
const fileFilter = (req, file, cb) => {
  // Allow specific file types for PowerBI reports
  const allowedTypes = [
    'application/vnd.ms-excel', // .xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/pdf', // .pdf
    'text/csv', // .csv
    'application/json', // .json
    'application/xml', // .xml
    'text/xml', // .xml
    'application/zip', // .zip
    'application/x-zip-compressed', // .zip
    'application/octet-stream', // .pbix and other binary files
    // Add image types for task attachments
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    // Add document types
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    // Add video types
    'video/mp4',
    'video/avi',
    'video/mov',
    'video/wmv',
    // Add audio types
    'audio/mpeg',
    'audio/wav',
    'audio/mp3'
  ];

  // Check file extension as fallback
  const allowedExtensions = ['.xls', '.xlsx', '.pdf', '.csv', '.json', '.xml', '.zip', '.pbix', 
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.doc', '.docx', '.txt', '.mp4', '.avi', '.mov', '.wmv', '.mp3', '.wav'];
  const fileExtension = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed. Allowed types: ${allowedExtensions.join(', ')}`), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 1 // Only one file per request
  }
});

// Middleware for single file upload
const uploadSingleFile = upload.single('file');

// Middleware wrapper to handle multer errors
const handleFileUpload = (req, res, next) => {
  uploadSingleFile(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File too large. Maximum size is 50MB.',
          error: err.message
        });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          success: false,
          message: 'Too many files. Only one file is allowed.',
          error: err.message
        });
      }
      return res.status(400).json({
        success: false,
        message: 'File upload error',
        error: err.message
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: 'File validation error',
        error: err.message
      });
    }
    next();
  });
};

// Generate unique filename
const generateFileName = (originalName) => {
  const timestamp = Date.now();
  const uuid = uuidv4();
  const extension = path.extname(originalName);
  const baseName = path.basename(originalName, extension);
  
  // Sanitize filename
  const sanitizedName = baseName.replace(/[^a-zA-Z0-9-_]/g, '_');
  
  return `powerbi/${timestamp}_${uuid}_${sanitizedName}${extension}`;
};

// Get content type based on file extension
const getContentType = (filename) => {
  const extension = path.extname(filename).toLowerCase();
  const contentTypes = {
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.pdf': 'application/pdf',
    '.csv': 'text/csv',
    '.json': 'application/json',
    '.xml': 'application/xml',
    '.zip': 'application/zip',
    '.pbix': 'application/octet-stream'
  };
  
  return contentTypes[extension] || 'application/octet-stream';
};

// Upload middleware factory function
const uploadMiddleware = (folder = 'uploads') => {
  return (req, res, next) => {
    console.log(`🔄 Upload middleware started for folder: ${folder}`);
    
    // Set custom folder for this upload
    req.uploadFolder = `uploads/${folder}`;
    
    uploadSingleFile(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        console.error('❌ Multer error:', err.code, err.message);
        
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'File too large. Maximum size is 50MB.',
            error: err.message
          });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            success: false,
            message: 'Too many files. Only one file is allowed.',
            error: err.message
          });
        }
        return res.status(400).json({
          success: false,
          message: 'File upload error',
          error: err.message
        });
      } else if (err) {
        console.error('❌ Upload validation error:', err.message);
        return res.status(400).json({
          success: false,
          message: 'File validation error',
          error: err.message
        });
      }
      
      console.log('✅ File upload middleware completed');
      next();
    });
  };
};

module.exports = {
  handleFileUpload,
  generateFileName,
  getContentType,
  uploadMiddleware
};
