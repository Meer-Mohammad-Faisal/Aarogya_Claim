import jwt from 'jsonwebtoken';
import { getEnv } from '../config/env.js';
import User from '../models/User.js';

export const authenticate = async (request, _response, next) => {
  try {
    const authorizationHeader = request.get('Authorization');
    const token = authorizationHeader?.startsWith('Bearer ')
      ? authorizationHeader.slice(7)
      : null;

    if (!token) {
      const error = new Error('Authentication token is required');
      error.statusCode = 401;
      throw error;
    }

    const decodedToken = jwt.verify(token, getEnv().jwtSecret);
    const user = await User.findById(decodedToken.sub);

    if (!user) {
      const error = new Error('Authenticated user no longer exists');
      error.statusCode = 401;
      throw error;
    }

    request.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      error.statusCode = 401;
      error.message = error.name === 'TokenExpiredError'
        ? 'Authentication token has expired'
        : 'Authentication token is invalid';
    }

    next(error);
  }
};
