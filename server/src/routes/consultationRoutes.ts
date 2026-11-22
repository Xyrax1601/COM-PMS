import { Router } from 'express';
import {
  getConsultations,
  createConsultation,
  updateConsultation,
} from '../controllers/consultationController.js';
import { authenticate, requireRoles } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getConsultations);
router.post('/', requireRoles('admin', 'medical'), createConsultation);
router.put('/:id', requireRoles('admin', 'medical'), updateConsultation);

export default router;
