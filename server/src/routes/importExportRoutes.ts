import { Router } from 'express';
import multer from 'multer';
import {
  previewExcel,
  commitImport,
  exportWorkbookExcel,
} from '../controllers/importExportController.js';
import { authenticate, requireRoles } from '../middleware/auth.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max
});

const router = Router();

router.use(authenticate);

// Preview Excel before saving (Admin, Registration, Medical)
router.post(
  '/preview',
  requireRoles('admin', 'medical', 'registration'),
  upload.single('file'),
  previewExcel
);

// Commit reviewed import into database (Admin, Registration, Medical)
router.post(
  '/commit',
  requireRoles('admin', 'medical', 'registration'),
  commitImport
);

// Export comprehensive workbook Excel (Authorized users)
router.get('/export', exportWorkbookExcel);

export default router;
