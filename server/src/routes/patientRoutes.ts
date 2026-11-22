import { Router } from 'express';
import {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
  archivePatient,
  unarchivePatient,
  deletePatient,
} from '../controllers/patientController.js';
import { authenticate, requireRoles } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getPatients);
router.get('/:id', getPatientById);

router.post('/', requireRoles('admin', 'medical', 'registration'), createPatient);
router.put('/:id', requireRoles('admin', 'medical', 'registration'), updatePatient);

router.patch('/:id/archive', requireRoles('admin', 'medical'), archivePatient);
router.patch('/:id/unarchive', requireRoles('admin', 'medical'), unarchivePatient);

router.delete('/:id', requireRoles('admin'), deletePatient);

export default router;
