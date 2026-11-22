import { Router } from 'express';
import {
  getFollowUps,
  createFollowUp,
  updateFollowUp,
  deleteFollowUp,
} from '../controllers/followUpController.js';
import { authenticate, requireRoles } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getFollowUps);
router.post('/', requireRoles('admin', 'medical'), createFollowUp);
router.put('/:id', requireRoles('admin', 'medical'), updateFollowUp);
router.delete('/:id', requireRoles('admin'), deleteFollowUp);

export default router;
