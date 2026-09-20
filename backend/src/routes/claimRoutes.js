import express from 'express';
import {
  createClaim,
  getAllClaims,
  getClaimById,
  getMyClaims,
  updateClaimStatus,
} from '../controllers/claimController.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/requireRole.js';
import { uploadDocument } from '../middleware/upload.js';

const claimRoutes = express.Router();

claimRoutes.post(
  '/',
  authenticate,
  requireRole('patient'),
  uploadDocument.single('document'),
  createClaim,
);
claimRoutes.get('/my', authenticate, requireRole('patient'), getMyClaims);
claimRoutes.get('/', authenticate, requireRole('insurer'), getAllClaims);
claimRoutes.get('/:id', authenticate, getClaimById);
claimRoutes.patch('/:id/status', authenticate, requireRole('insurer'), updateClaimStatus);

export default claimRoutes;
