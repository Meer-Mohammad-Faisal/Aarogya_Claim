import { v2 as cloudinary } from 'cloudinary';

const getCloudinaryClient = () => {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    const error = new Error('Document storage is not configured');
    error.statusCode = 503;
    throw error;
  }

  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
  });

  return cloudinary;
};

export const uploadClaimDocument = (buffer) => new Promise((resolve, reject) => {
  let cloudinaryClient;

  try {
    cloudinaryClient = getCloudinaryClient();
  } catch (error) {
    reject(error);
    return;
  }

  const uploadStream = cloudinaryClient.uploader.upload_stream(
    {
      folder: process.env.CLOUDINARY_FOLDER || 'aarogya-claims',
      resource_type: 'auto',
    },
    (error, result) => {
      if (error) {
        const uploadError = new Error('Unable to upload supporting document');
        uploadError.statusCode = 502;
        uploadError.cause = error;
        reject(uploadError);
        return;
      }

      resolve({
        url: result.secure_url,
        publicId: result.public_id,
        resourceType: result.resource_type,
      });
    },
  );

  uploadStream.end(buffer);
});

export const deleteClaimDocument = ({ publicId, resourceType = 'auto' }) => {
  const cloudinaryClient = getCloudinaryClient();
  return cloudinaryClient.uploader.destroy(publicId, { resource_type: resourceType });
};
