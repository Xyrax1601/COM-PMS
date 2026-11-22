import { Request, Response } from 'express';
import { ActivityLog } from '../models/ActivityLog.js';

export const getActivityLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { action, entity_type, page = '1', limit = '50' } = req.query;

    const query: any = {};
    if (action && action !== 'All') {
      query.action = action;
    }
    if (entity_type && entity_type !== 'All') {
      query.entity_type = entity_type;
    }

    const pageNum = Math.max(1, parseInt(String(page), 10));
    const limitNum = Math.max(1, Math.min(200, parseInt(String(limit), 10)));
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      ActivityLog.find(query).sort({ created_at: -1 }).skip(skip).limit(limitNum),
      ActivityLog.countDocuments(query),
    ]);

    res.json({
      success: true,
      logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
