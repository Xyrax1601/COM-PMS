import { Router } from 'express';
import {
  getLabRecords,
  createLabRecord,
  updateLabRecord,
  deleteLabRecord,
} from '../controllers/labController.js';
import { authenticate, requireRoles } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getLabRecords);
router.post('/', requireRoles('admin', 'medical'), createLabRecord);
router.put('/:id', requireRoles('admin', 'medical'), updateLabRecord);
router.delete('/:id', requireRoles('admin'), deleteLabRecord);

export default router;
