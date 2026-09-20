import multer from 'multer';

const allowedMimeTypes = new Set(['application/pdf', 'image/jpeg', 'image/png']);
const allowedExtensions = new Set(['.pdf', '.jpg', '.jpeg', '.png']);

const hasAllowedExtension = (filename) => {
  const extension = filename.slice(filename.lastIndexOf('.')).toLowerCase();
  return allowedExtensions.has(extension);
};

const fileFilter = (_request, file, callback) => {
  if (!allowedMimeTypes.has(file.mimetype) || !hasAllowedExtension(file.originalname)) {
    const error = new Error('Supporting document must be a PDF, JPG, JPEG, or PNG file');
    error.statusCode = 400;
    error.code = 'INVALID_FILE_TYPE';
    callback(error);
    return;
  }

  callback(null, true);
};

export const uploadDocument = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});
