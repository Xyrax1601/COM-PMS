"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const importExportController_js_1 = require("../controllers/importExportController.js");
const auth_js_1 = require("../middleware/auth.js");
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max
});
const router = (0, express_1.Router)();
router.use(auth_js_1.authenticate);
// Preview Excel before saving (Admin, Registration, Medical)
router.post('/preview', (0, auth_js_1.requireRoles)('admin', 'medical', 'registration'), upload.single('file'), importExportController_js_1.previewExcel);
// Commit reviewed import into database (Admin, Registration, Medical)
router.post('/commit', (0, auth_js_1.requireRoles)('admin', 'medical', 'registration'), importExportController_js_1.commitImport);
// Export comprehensive workbook Excel (Authorized users)
router.get('/export', importExportController_js_1.exportWorkbookExcel);
exports.default = router;
