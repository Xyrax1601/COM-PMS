"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logActivity = logActivity;
const ActivityLog_js_1 = require("../models/ActivityLog.js");
async function logActivity(user, action, entityType, entityId = '', details = {}, req) {
    try {
        const ip = req?.ip || req?.socket?.remoteAddress || '';
        await ActivityLog_js_1.ActivityLog.create({
            user_id: user?.userId || undefined,
            user_name: user?.name || 'System',
            action,
            entity_type: entityType,
            entity_id: entityId,
            details,
            ip_address: String(ip),
        });
    }
    catch (err) {
        console.error('[AuditLogger] Failed to write activity log:', err);
    }
}
