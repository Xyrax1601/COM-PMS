import { Router } from 'express';
import {
  getMonitoringSummary,
  getMonitoringCategoryPatients,
} from '../controllers/monitoringController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/summary', getMonitoringSummary);
router.get('/category/:category', getMonitoringCategoryPatients);

export default router;
