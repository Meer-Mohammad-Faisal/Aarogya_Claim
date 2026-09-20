export const errorHandler = (error, _request, response, _next) => {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'An unexpected error occurred';

  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(error.errors).map((validationError) => validationError.message).join(', ');
  }

  if (error.code === 11000) {
    statusCode = 409;
    message = 'A record with those details already exists';
  }

  if (error.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Request body contains invalid JSON';
  }

  if (error.code === 'LIMIT_FILE_SIZE') {
    statusCode = 400;
    message = 'Supporting document must be 5 MB or smaller';
  }

  if (error.code === 'INVALID_FILE_TYPE') {
    statusCode = 400;
  }

  if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid request value';
  }

  if (statusCode >= 500) {
    console.error(`[${statusCode}] ${message}`);
  }

  response.status(statusCode).json({
    success: false,
    message,
  });
};
