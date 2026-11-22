import { Router } from 'express';
import {
  getMedicationRecords,
  createMedicationRecord,
  updateMedicationRecord,
  deleteMedicationRecord,
} from '../controllers/medicationController.js';
import { authenticate, requireRoles } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getMedicationRecords);
router.post('/', requireRoles('admin', 'medical'), createMedicationRecord);
router.put('/:id', requireRoles('admin', 'medical'), updateMedicationRecord);
router.delete('/:id', requireRoles('admin'), deleteMedicationRecord);

export default router;
