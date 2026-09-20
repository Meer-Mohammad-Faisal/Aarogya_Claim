import jwt from 'jsonwebtoken';
import { getEnv } from '../config/env.js';

export const createAccessToken = (user) => jwt.sign(
  { role: user.role },
  getEnv().jwtSecret,
  {
    subject: user._id.toString(),
    expiresIn: getEnv().jwtExpiresIn,
  },
);
