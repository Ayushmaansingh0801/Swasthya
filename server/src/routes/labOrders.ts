import { Router, Response } from 'express';
import { z } from 'zod';
import { LabOrder, SampleStatus } from '../models/LabOrder';
import { authenticate, AuthRequest } from '../middlewares/auth';
import { requireRole } from '../middlewares/rbac';
import { validateBody } from '../middlewares/validate';
import { AIService } from '../services/aiService';
import { logAuditEvent } from '../services/auditService';
import mongoose from 'mongoose';

const router = Router();

const createLabOrderSchema = z.object({
  patientId: z.string().optional(),
  organizationId: z.string(),
  testName: z.string().min(2),
  category: z.string().default('General Pathology'),
});

const enterResultsSchema = z.object({
  results: z.array(
    z.object({
      parameter: z.string().min(1),
      value: z.string().min(1),
      unit: z.string(),
      referenceRange: z.string(),
      isAbnormal: z.boolean().default(false),
    })
  ),
  technicianNotes: z.string().optional(),
});

// GET /api/v1/lab-orders
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const filter: any = {};

    if (user.role === 'patient') {
      filter.patientId = user._id;
      // Fetch orders for this patient
      const orders = await LabOrder.find(filter)
        .populate('organizationId', 'name address phone')
        .sort({ createdAt: -1 });

      // CRITICAL SECURITY RULE: If not released, mask the results so patient cannot view unapproved report data
      const sanitized = orders.map((order) => {
        const obj: any = order.toObject();
        if (!order.isReleasedToPatient) {
          obj.results = [];
          obj.aiExplanation = undefined;
          obj.reportStatusNotice = 'Results are currently undergoing lab quality verification and have not yet been released.';
        }
        return obj;
      });

      res.json({
        success: true,
        count: sanitized.length,
        data: sanitized,
      });
      return;
    }

    if (req.activeWorkspaceId) {
      filter.organizationId = req.activeWorkspaceId;
    }

    const orders = await LabOrder.find(filter)
      .populate('patientId', 'name email phone')
      .populate('organizationId', 'name address phone')
      .populate('releasedBy', 'name role')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/v1/lab-orders/:id - Single order detail
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const order = await LabOrder.findById(req.params.id)
      .populate('patientId', 'name email phone')
      .populate('organizationId', 'name address phone')
      .populate('releasedBy', 'name role');

    if (!order) {
      res.status(404).json({ success: false, error: 'Lab order not found.' });
      return;
    }

    // Patient access check
    if (req.user!.role === 'patient') {
      if (order.patientId._id.toString() !== (req.user!._id as mongoose.Types.ObjectId).toString()) {
        res.status(403).json({ success: false, error: 'Access denied: You can only view your own lab orders.' });
        return;
      }

      if (!order.isReleasedToPatient) {
        res.status(403).json({
          success: false,
          error: 'Lab report access is withheld: This report has not yet been authorized or released by the laboratory.',
        });
        return;
      }
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/lab-orders - Book lab test
router.post('/', authenticate, validateBody(createLabOrderSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { patientId, organizationId, testName, category } = req.body;
    const targetPatientId = patientId || req.user!._id;
    const sampleId = `SMP-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const order = await LabOrder.create({
      patientId: targetPatientId,
      organizationId,
      testName,
      category,
      sampleId,
      sampleStatus: 'ordered',
      results: [],
      isReleasedToPatient: false,
      isDemo: true,
    });

    res.status(201).json({
      success: true,
      message: 'Lab test ordered successfully.',
      data: order,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/v1/lab-orders/:id/status - Update sample state
router.patch(
  '/:id/status',
  authenticate,
  requireRole('lab_admin', 'lab_tech'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { status } = req.body;
      const order = await LabOrder.findById(req.params.id);

      if (!order) {
        res.status(404).json({ success: false, error: 'Lab order not found.' });
        return;
      }

      order.sampleStatus = status as SampleStatus;
      if (status === 'collected' && !order.collectionDate) {
        order.collectionDate = new Date().toISOString().split('T')[0];
      }

      await order.save();

      res.json({
        success: true,
        message: `Sample status updated to ${status}.`,
        data: order,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// PATCH /api/v1/lab-orders/:id/results - Enter test results
router.patch(
  '/:id/results',
  authenticate,
  requireRole('lab_admin', 'lab_tech'),
  validateBody(enterResultsSchema),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { results, technicianNotes } = req.body;
      const order = await LabOrder.findById(req.params.id);

      if (!order) {
        res.status(404).json({ success: false, error: 'Lab order not found.' });
        return;
      }

      order.results = results;
      order.technicianNotes = technicianNotes;
      order.sampleStatus = 'completed';

      // Generate AI explanation for the findings
      const analysis = await AIService.explainLabReport(
        order.testName,
        results.map((r: any) => ({ name: r.parameter, value: r.value, unit: r.unit }))
      );
      order.aiExplanation = analysis.summary;

      await order.save();

      res.json({
        success: true,
        message: 'Test results entered and saved.',
        data: order,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// PATCH /api/v1/lab-orders/:id/release - Authorized release to patient
router.patch(
  '/:id/release',
  authenticate,
  requireRole('lab_admin', 'lab_tech'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const order = await LabOrder.findById(req.params.id);
      if (!order) {
        res.status(404).json({ success: false, error: 'Lab order not found.' });
        return;
      }

      order.isReleasedToPatient = true;
      order.releasedAt = new Date();
      order.releasedBy = req.user!._id as mongoose.Types.ObjectId;
      await order.save();

      await logAuditEvent({
        actorId: req.user!._id as mongoose.Types.ObjectId,
        actorEmail: req.user!.email,
        actorRole: req.user!.role,
        action: 'LAB_REPORT_RELEASE',
        targetType: 'LabOrder',
        targetId: order._id.toString(),
        organizationId: order.organizationId as mongoose.Types.ObjectId,
        details: { sampleId: order.sampleId, testName: order.testName },
      });

      res.json({
        success: true,
        message: 'Lab report successfully released to patient.',
        data: order,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

export default router;
