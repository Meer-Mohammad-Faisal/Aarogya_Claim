const requiredEnvironmentVariables = ['MONGODB_URI', 'JWT_SECRET'];

export const getEnv = () => {
  const missingVariables = requiredEnvironmentVariables.filter(
    (variableName) => !process.env[variableName],
  );

  if (missingVariables.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVariables.join(', ')}`);
  }

  if (process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }

  return {
    port: Number(process.env.PORT) || 5000,
    mongodbUri: process.env.MONGODB_URI,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
    clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  };
};
