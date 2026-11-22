import { Router } from 'express';
import { getActivityLogs } from '../controllers/activityLogController.js';
import { authenticate, requireRoles } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.use(requireRoles('admin', 'viewer'));

router.get('/', getActivityLogs);

export default router;
