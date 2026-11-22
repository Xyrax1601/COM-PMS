import { Router } from 'express';
import { getReportData, exportReportExcel } from '../controllers/reportController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/data', getReportData);
router.get('/export-excel', exportReportExcel);

export default router;
