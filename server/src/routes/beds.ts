import { Router, Response } from 'express';
import { z } from 'zod';
import { BedInventory, BedCategory } from '../models/BedInventory';
import { Organization } from '../models/Organization';
import { authenticate, AuthRequest } from '../middlewares/auth';
import { requireRole, requireOrganizationAccess } from '../middlewares/rbac';
import { validateBody } from '../middlewares/validate';
import { logAuditEvent } from '../services/auditService';
import mongoose from 'mongoose';

const router = Router();

const updateBedSchema = z.object({
  totalCapacity: z.number().min(1),
  available: z.number().min(0),
  occupied: z.number().min(0),
  cleaning: z.number().min(0).default(0),
  reserved: z.number().min(0).default(0),
  notes: z.string().optional(),
});

// GET /api/v1/beds - Public view of beds with freshness labels
router.get('/', async (req: any, res: Response): Promise<void> => {
  try {
    const { organizationId, category } = req.query;
    const filter: any = {};

    if (organizationId) {
      filter.organizationId = organizationId;
    }
    if (category) {
      filter.category = category;
    }

    const beds = await BedInventory.find(filter)
      .populate('organizationId', 'name address phone emergencyHelpline isVerified')
      .populate('lastUpdatedBy', 'name role')
      .sort({ lastUpdatedAt: -1 });

    const now = Date.now();
    const enrichedBeds = beds.map((b) => {
      const obj: any = b.toObject();
      const ageHours = (now - new Date(b.lastUpdatedAt).getTime()) / (1000 * 60 * 60);
      obj.isStale = ageHours > 12;
      obj.ageHours = Math.round(ageHours * 10) / 10;
      return obj;
    });

    res.json({
      success: true,
      count: enrichedBeds.length,
      data: enrichedBeds,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/v1/beds/summary - Aggregated availability across hospitals
router.get('/summary', async (req: any, res: Response): Promise<void> => {
  try {
    const beds = await BedInventory.find().populate('organizationId', 'name address phone');

    const summary = {
      totalGeneral: 0,
      availableGeneral: 0,
      totalICU: 0,
      availableICU: 0,
      totalEmergency: 0,
      availableEmergency: 0,
      totalOxygen: 0,
      availableOxygen: 0,
      hospitalCount: new Set(beds.map((b) => b.organizationId?._id?.toString())).size,
    };

    beds.forEach((b) => {
      if (b.category === 'general') {
        summary.totalGeneral += b.totalCapacity;
        summary.availableGeneral += b.available;
      } else if (b.category === 'icu') {
        summary.totalICU += b.totalCapacity;
        summary.availableICU += b.available;
      } else if (b.category === 'emergency') {
        summary.totalEmergency += b.totalCapacity;
        summary.availableEmergency += b.available;
      } else if (b.category === 'oxygen') {
        summary.totalOxygen += b.totalCapacity;
        summary.availableOxygen += b.available;
      }
    });

    res.json({
      success: true,
      data: summary,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/v1/beds/:id - Update bed count by hospital bed manager or admin
router.put(
  '/:id',
  authenticate,
  validateBody(updateBedSchema),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { totalCapacity, available, occupied, cleaning, reserved, notes } = req.body;

      const bed = await BedInventory.findById(id);
      if (!bed) {
        res.status(404).json({ success: false, error: 'Bed inventory record not found.' });
        return;
      }

      // Validate capacity consistency
      if (available + occupied + cleaning + reserved > totalCapacity) {
        res.status(400).json({
          success: false,
          error: `Capacity Inconsistency: Sum of available (${available}) + occupied (${occupied}) + cleaning (${cleaning}) + reserved (${reserved}) exceeds total capacity (${totalCapacity}).`,
        });
        return;
      }

      bed.totalCapacity = totalCapacity;
      bed.available = available;
      bed.occupied = occupied;
      bed.cleaning = cleaning;
      bed.reserved = reserved;
      bed.notes = notes;
      bed.lastUpdatedBy = req.user!._id as mongoose.Types.ObjectId;
      bed.lastUpdatedAt = new Date();

      await bed.save();

      await logAuditEvent({
        actorId: req.user!._id as mongoose.Types.ObjectId,
        actorEmail: req.user!.email,
        actorRole: req.user!.role,
        action: 'BED_STATUS_UPDATE',
        targetType: 'BedInventory',
        targetId: bed._id.toString(),
        organizationId: bed.organizationId as mongoose.Types.ObjectId,
        details: {
          ward: bed.ward,
          category: bed.category,
          totalCapacity,
          available,
          occupied,
        },
      });

      res.json({
        success: true,
        message: 'Bed status updated successfully.',
        data: bed,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// POST /api/v1/beds - Initialize bed ward for an organization
router.post(
  '/',
  authenticate,
  requireRole('hospital_admin', 'bed_manager', 'platform_super_admin'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { organizationId, ward, category, totalCapacity, available, occupied } = req.body;

      const bed = await BedInventory.create({
        organizationId: organizationId || req.activeWorkspaceId,
        ward,
        category: category as BedCategory,
        totalCapacity,
        available,
        occupied: occupied || 0,
        lastUpdatedBy: req.user!._id,
        lastUpdatedAt: new Date(),
        isDemo: true,
      });

      res.status(201).json({
        success: true,
        data: bed,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

export default router;
