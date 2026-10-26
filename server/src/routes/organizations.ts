import { Router, Response } from 'express';
import { z } from 'zod';
import { Organization } from '../models/Organization';
import { Membership } from '../models/Membership';
import { User } from '../models/User';
import { BedInventory } from '../models/BedInventory';
import { authenticate, AuthRequest } from '../middlewares/auth';
import { requireRole, requireOrganizationAccess } from '../middlewares/rbac';
import { validateBody } from '../middlewares/validate';
import { logAuditEvent } from '../services/auditService';
import mongoose from 'mongoose';

const router = Router();

const createOrgSchema = z.object({
  name: z.string().min(2),
  type: z.enum(['hospital', 'private_clinic', 'homeopathy_clinic', 'medical_store', 'diagnostic_lab', 'emergency_provider']),
  registrationNumber: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    area: z.string(),
    city: z.string(),
    pincode: z.string(),
    state: z.string().default('Madhya Pradesh'),
    coordinates: z.object({ lat: z.number(), lng: z.number() }).optional(),
  }),
  phone: z.string(),
  email: z.string().email().optional(),
  emergencyHelpline: z.string().optional(),
  operatingHours: z.string().default('24x7 Emergency / 9:00 AM - 8:00 PM OPD'),
  services: z.array(z.string()).default([]),
  departments: z.array(z.string()).default([]),
  totalBeds: z.number().default(0),
});

const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum([
    'hospital_admin',
    'hospital_doctor',
    'hospital_receptionist',
    'hospital_staff',
    'nurse',
    'bed_manager',
    'clinic_admin',
    'private_doctor',
    'clinic_receptionist',
    'homeopathy_doctor',
    'store_owner',
    'pharmacist',
    'lab_admin',
    'lab_tech',
  ]),
  department: z.string().optional(),
});

// GET /api/v1/organizations - Public directory search
router.get('/', async (req: any, res: Response): Promise<void> => {
  try {
    const { type, city, search, verifiedOnly } = req.query;
    const filter: any = {};

    if (type) {
      filter.type = type;
    }
    if (city) {
      filter['address.city'] = new RegExp(city as string, 'i');
    }
    if (verifiedOnly === 'true') {
      filter.isVerified = true;
    }
    if (search) {
      filter.$or = [
        { name: new RegExp(search as string, 'i') },
        { services: new RegExp(search as string, 'i') },
        { 'address.area': new RegExp(search as string, 'i') },
      ];
    }

    const organizations = await Organization.find(filter).sort({ isVerified: -1, name: 1 });

    // Include bed summaries for hospitals
    const orgsWithDetails = await Promise.all(
      organizations.map(async (org) => {
        const orgObj: any = org.toObject();
        if (org.type === 'hospital') {
          const beds = await BedInventory.find({ organizationId: org._id });
          const totalCapacity = beds.reduce((acc, b) => acc + b.totalCapacity, 0);
          const totalAvailable = beds.reduce((acc, b) => acc + b.available, 0);
          const lastUpdated = beds.length > 0 ? beds.reduce((latest, b) => (b.lastUpdatedAt > latest ? b.lastUpdatedAt : latest), beds[0].lastUpdatedAt) : org.updatedAt;

          orgObj.bedSummary = {
            totalCapacity,
            totalAvailable,
            lastUpdatedAt: lastUpdated,
            isStale: Date.now() - new Date(lastUpdated).getTime() > 24 * 60 * 60 * 1000,
          };
        }
        return orgObj;
      })
    );

    res.json({
      success: true,
      count: orgsWithDetails.length,
      data: orgsWithDetails,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/v1/organizations/:id - Detail view
router.get('/:id', async (req: any, res: Response): Promise<void> => {
  try {
    const org = await Organization.findById(req.params.id);
    if (!org) {
      res.status(404).json({ success: false, error: 'Organization not found.' });
      return;
    }

    const beds = await BedInventory.find({ organizationId: org._id }).populate('lastUpdatedBy', 'name');
    const members = await Membership.find({ organizationId: org._id, status: 'active' }).populate('userId', 'name email role');

    res.json({
      success: true,
      data: {
        ...org.toObject(),
        beds,
        staffCount: members.length,
        members,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/organizations - Create/request organization
router.post('/', authenticate, validateBody(createOrgSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const orgData = req.body;

    const organization = await Organization.create({
      ...orgData,
      ownerId: user._id,
      isVerified: false,
      verificationStatus: 'pending',
      isDemo: true,
    });

    // Automatically add creator as admin/owner membership
    await Membership.create({
      userId: user._id,
      organizationId: organization._id,
      role: orgData.type === 'hospital' ? 'hospital_admin' : orgData.type === 'medical_store' ? 'store_owner' : 'clinic_admin',
      status: 'active',
    });

    await logAuditEvent({
      actorId: user._id as mongoose.Types.ObjectId,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'ORGANIZATION_CREATE',
      organizationId: organization._id as mongoose.Types.ObjectId,
      details: { organizationName: organization.name, type: organization.type },
    });

    res.status(201).json({
      success: true,
      message: 'Organization registered successfully and submitted for verification.',
      data: organization,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/organizations/:organizationId/invite - Staff invitation
router.post(
  '/:organizationId/invite',
  authenticate,
  requireOrganizationAccess('organizationId'),
  requireRole('hospital_admin', 'clinic_admin', 'store_owner', 'lab_admin', 'platform_super_admin'),
  validateBody(inviteMemberSchema),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { organizationId } = req.params;
      const { email, role, department } = req.body;

      let targetUser = await User.findOne({ email });

      // If user doesn't exist yet, we create an account with invited status
      if (!targetUser) {
        targetUser = await User.create({
          name: email.split('@')[0],
          email,
          passwordHash: '$2a$10$demoHashedPasswordFallbackOnlyForInvitesDemo',
          role: role as any,
          isEmailVerified: false,
          isDemoAccount: true,
        });
      }

      const existingMembership = await Membership.findOne({
        userId: targetUser._id,
        organizationId,
      });

      if (existingMembership) {
        existingMembership.role = role;
        existingMembership.department = department;
        existingMembership.status = 'active';
        await existingMembership.save();
      } else {
        await Membership.create({
          userId: targetUser._id,
          organizationId,
          role,
          department,
          status: 'active',
          invitedBy: req.user!._id,
        });
      }

      await logAuditEvent({
        actorId: req.user!._id as mongoose.Types.ObjectId,
        actorEmail: req.user!.email,
        actorRole: req.user!.role,
        action: 'MEMBER_INVITE',
        organizationId: new mongoose.Types.ObjectId(organizationId),
        details: { targetEmail: email, assignedRole: role },
      });

      res.status(200).json({
        success: true,
        message: `Staff member ${email} invited and assigned role ${role} successfully.`,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// GET /api/v1/organizations/:organizationId/members
router.get(
  '/:organizationId/members',
  authenticate,
  requireOrganizationAccess('organizationId'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { organizationId } = req.params;
      const members = await Membership.find({ organizationId }).populate('userId', 'name email phone role isEmailVerified');

      res.json({
        success: true,
        data: members,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

export default router;
