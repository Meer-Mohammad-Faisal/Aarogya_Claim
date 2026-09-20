import express from 'express';
import { getCurrentUser, login } from '../controllers/authController.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/requireRole.js';
import { validate } from '../middleware/validate.js';

const authRoutes = express.Router();

const validateLogin = (body) => {
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return { error: new Error('A valid email is required') };
  }

  if (password.length < 8) {
    return { error: new Error('Password must be at least 8 characters long') };
  }

  return { value: { email, password } };
};

authRoutes.post('/login', validate(validateLogin), login);
authRoutes.get('/me', authenticate, getCurrentUser);
authRoutes.get('/patient-check', authenticate, requireRole('patient'), getCurrentUser);
authRoutes.get('/insurer-check', authenticate, requireRole('insurer'), getCurrentUser);

export default authRoutes;
