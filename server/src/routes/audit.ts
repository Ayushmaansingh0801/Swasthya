import { Router, Response } from 'express';
import { AuditLog } from '../models/AuditLog';
import { authenticate, AuthRequest } from '../middlewares/auth';
import { requireRole } from '../middlewares/rbac';

const router = Router();

// GET /api/v1/audit-logs - Restricted to hospital admin, platform super admin
router.get(
  '/',
  authenticate,
  requireRole('hospital_admin', 'platform_super_admin'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const filter: any = {};
      if (req.user!.role !== 'platform_super_admin' && req.activeWorkspaceId) {
        filter.organizationId = req.activeWorkspaceId;
      }

      const { action, limit } = req.query;
      if (action) {
        filter.action = action;
      }

      const maxLimit = limit ? Math.min(parseInt(limit as string, 10), 100) : 50;
      const logs = await AuditLog.find(filter)
        .populate('actorId', 'name email role')
        .populate('organizationId', 'name type')
        .sort({ createdAt: -1 })
        .limit(maxLimit);

      res.json({
        success: true,
        count: logs.length,
        data: logs,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

export default router;
