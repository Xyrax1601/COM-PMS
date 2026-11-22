import { Router } from 'express';
import { getFpeRecords, recordFpe, updateFpeRecord } from '../controllers/fpeController.js';
import { authenticate, requireRoles } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getFpeRecords);
router.post('/', requireRoles('admin', 'medical'), recordFpe);
router.put('/:id', requireRoles('admin', 'medical'), updateFpeRecord);

export default router;
