"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const db_js_1 = require("./config/db.js");
const seedData_js_1 = require("./utils/seedData.js");
const authRoutes_js_1 = __importDefault(require("./routes/authRoutes.js"));
const patientRoutes_js_1 = __importDefault(require("./routes/patientRoutes.js"));
const fpeRoutes_js_1 = __importDefault(require("./routes/fpeRoutes.js"));
const consultationRoutes_js_1 = __importDefault(require("./routes/consultationRoutes.js"));
const labRoutes_js_1 = __importDefault(require("./routes/labRoutes.js"));
const medicationRoutes_js_1 = __importDefault(require("./routes/medicationRoutes.js"));
const followUpRoutes_js_1 = __importDefault(require("./routes/followUpRoutes.js"));
const monitoringRoutes_js_1 = __importDefault(require("./routes/monitoringRoutes.js"));
const dashboardRoutes_js_1 = __importDefault(require("./routes/dashboardRoutes.js"));
const reportRoutes_js_1 = __importDefault(require("./routes/reportRoutes.js"));
const userRoutes_js_1 = __importDefault(require("./routes/userRoutes.js"));
const activityLogRoutes_js_1 = __importDefault(require("./routes/activityLogRoutes.js"));
const importExportRoutes_js_1 = __importDefault(require("./routes/importExportRoutes.js"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.use((0, cors_1.default)({
    origin: true,
    credentials: true,
}));
app.use(express_1.default.json({ limit: '20mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '20mb' }));
app.use((0, morgan_1.default)('dev'));
// API Routes
app.use('/api/auth', authRoutes_js_1.default);
app.use('/api/patients', patientRoutes_js_1.default);
app.use('/api/fpe', fpeRoutes_js_1.default);
app.use('/api/consultations', consultationRoutes_js_1.default);
app.use('/api/laboratories', labRoutes_js_1.default);
app.use('/api/medications', medicationRoutes_js_1.default);
app.use('/api/follow-ups', followUpRoutes_js_1.default);
app.use('/api/monitoring', monitoringRoutes_js_1.default);
app.use('/api/dashboard', dashboardRoutes_js_1.default);
app.use('/api/reports', reportRoutes_js_1.default);
app.use('/api/users', userRoutes_js_1.default);
app.use('/api/activity-logs', activityLogRoutes_js_1.default);
app.use('/api/import-export', importExportRoutes_js_1.default);
// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        system: 'COM-PMS API Server',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
    });
});
// Serve static frontend build if present
const clientDistPath = path_1.default.resolve(process.cwd(), '../client/dist');
if (fs_1.default.existsSync(clientDistPath)) {
    console.log(`[Static] Serving React client bundle from: ${clientDistPath}`);
    app.use(express_1.default.static(clientDistPath));
    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api')) {
            return next();
        }
        res.sendFile(path_1.default.join(clientDistPath, 'index.html'));
    });
}
// Error handling middleware
app.use((err, req, res, next) => {
    console.error('[Unhandled Error]', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
    });
});
async function startServer() {
    try {
        console.log('[COM-PMS Server] Connecting to database...');
        await (0, db_js_1.connectDB)();
        console.log('[COM-PMS Server] Running initial database verification...');
        await (0, seedData_js_1.seedDatabase)(false);
        app.listen(PORT, () => {
            console.log(`================================================================`);
            console.log(`  COM-PMS API Server is running on http://localhost:${PORT}`);
            console.log(`  Health Check: http://localhost:${PORT}/api/health`);
            console.log(`================================================================`);
        });
    }
    catch (error) {
        console.error('Fatal Server Startup Error:', error);
        process.exit(1);
    }
}
startServer();
