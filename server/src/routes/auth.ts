import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { z } from 'zod';
import { User, IUser, UserRole } from '../models/User';
import { PatientProfile } from '../models/PatientProfile';
import { DoctorProfile } from '../models/DoctorProfile';
import { Membership } from '../models/Membership';
import { Organization } from '../models/Organization';
import { authenticate, generateTokens, AuthRequest } from '../middlewares/auth';
import { validateBody } from '../middlewares/validate';
import { logAuditEvent } from '../services/auditService';
import mongoose from 'mongoose';

const router = Router();

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
  role: z.enum([
    'patient',
    'hospital_doctor',
    'hospital_admin',
    'hospital_receptionist',
    'hospital_staff',
    'private_doctor',
    'private_clinic_admin',
    'clinic_receptionist',
    'homeopathy_doctor',
    'homeopathy_clinic_admin',
    'medical_store_owner',
    'pharmacist',
    'lab_admin',
    'lab_tech',
    'nurse',
    'bed_manager',
    'ambulance_provider',
  ]).default('patient'),
  preferredLanguage: z.enum(['en', 'hi']).default('en'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// POST /api/v1/auth/signup
router.post('/signup', validateBody(signupSchema), async (req: any, res: Response): Promise<void> => {
  const { name, email, password, phone, role, preferredLanguage } = req.body;

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      res.status(400).json({ success: false, error: 'An account with this email already exists.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const verificationToken = crypto.randomBytes(24).toString('hex');

    // Self-registration can create patient accounts.
    // Provider roles are requested and start with isEmailVerified=false
    const user = await User.create({
      name,
      email,
      passwordHash,
      phone,
      role: role as UserRole,
      preferredLanguage,
      verificationToken,
      isEmailVerified: false,
      isDemoAccount: false,
    });

    // Create corresponding profile
    if (role === 'patient') {
      await PatientProfile.create({
        userId: user._id,
        allergies: [],
        chronicConditions: [],
        currentMedications: [],
        dependents: [],
        consentSharing: true,
      });
    } else if (role.includes('doctor')) {
      await DoctorProfile.create({
        userId: user._id,
        specialty: 'General Medicine',
        qualifications: ['MBBS'],
        registrationNumber: `REG-${Math.floor(100000 + Math.random() * 900000)}`,
        isHomeopathy: role.includes('homeopathy'),
        isVerified: false,
      });
    }

    const tokens = generateTokens(user);

    await logAuditEvent({
      actorId: user._id as mongoose.Types.ObjectId,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'USER_SIGNUP',
      ipAddress: req.ip,
      details: { role: user.role },
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully. Please verify your email.',
      demoVerificationLink: `/verify-email?token=${verificationToken}`,
      verificationToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        preferredLanguage: user.preferredLanguage,
      },
      ...tokens,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/auth/login
router.post('/login', validateBody(loginSchema), async (req: any, res: Response): Promise<void> => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid email or password credentials.' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ success: false, error: 'Invalid email or password credentials.' });
      return;
    }

    // Get user's approved organizations and memberships
    const memberships = await Membership.find({ userId: user._id, status: 'active' }).populate('organizationId');
    const ownedOrgs = await Organization.find({ ownerId: user._id });

    const tokens = generateTokens(user, user.activeWorkspaceId?.toString());

    await logAuditEvent({
      actorId: user._id as mongoose.Types.ObjectId,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'USER_LOGIN',
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'Login successful.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        preferredLanguage: user.preferredLanguage,
        activeWorkspaceId: user.activeWorkspaceId,
        isDemoAccount: user.isDemoAccount,
      },
      workspaces: [
        ...memberships.map((m: any) => ({
          membershipId: m._id,
          organizationId: m.organizationId._id,
          organizationName: m.organizationId.name,
          organizationType: m.organizationId.type,
          role: m.role,
        })),
        ...ownedOrgs.map((o: any) => ({
          membershipId: null,
          organizationId: o._id,
          organizationName: o.name,
          organizationType: o.type,
          role: 'owner',
        })),
      ],
      ...tokens,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/auth/verify-email
router.post('/verify-email', async (req: any, res: Response): Promise<void> => {
  const { token } = req.body;
  if (!token) {
    res.status(400).json({ success: false, error: 'Verification token is required.' });
    return;
  }

  try {
    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      res.status(400).json({ success: false, error: 'Invalid or expired verification token.' });
      return;
    }

    user.isEmailVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Email address verified successfully! You can now log in.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/v1/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const memberships = await Membership.find({ userId: user._id, status: 'active' }).populate('organizationId');
    const ownedOrgs = await Organization.find({ ownerId: user._id });

    let profileData: any = null;
    if (user.role === 'patient') {
      profileData = await PatientProfile.findOne({ userId: user._id });
    } else if (user.role.includes('doctor')) {
      profileData = await DoctorProfile.findOne({ userId: user._id });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        preferredLanguage: user.preferredLanguage,
        activeWorkspaceId: req.activeWorkspaceId || user.activeWorkspaceId,
        workspaceRole: req.workspaceRole,
        isDemoAccount: user.isDemoAccount,
      },
      profile: profileData,
      workspaces: [
        ...memberships.map((m: any) => ({
          membershipId: m._id,
          organizationId: m.organizationId?._id,
          organizationName: m.organizationId?.name,
          organizationType: m.organizationId?.type,
          role: m.role,
        })),
        ...ownedOrgs.map((o: any) => ({
          membershipId: null,
          organizationId: o._id,
          organizationName: o.name,
          organizationType: o.type,
          role: 'owner',
        })),
      ],
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/auth/switch-workspace
router.post('/switch-workspace', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { organizationId } = req.body;

  try {
    const user = req.user!;

    if (!organizationId) {
      user.activeWorkspaceId = undefined;
      await user.save();
      const tokens = generateTokens(user);
      res.json({ success: true, message: 'Switched to personal workspace.', ...tokens });
      return;
    }

    // Verify user is member or owner of organization
    const org = await Organization.findById(organizationId);
    if (!org) {
      res.status(404).json({ success: false, error: 'Organization not found.' });
      return;
    }

    const isOwner = org.ownerId?.toString() === (user._id as mongoose.Types.ObjectId).toString();
    const membership = await Membership.findOne({ userId: user._id, organizationId, status: 'active' });

    if (!isOwner && !membership && user.role !== 'platform_super_admin') {
      res.status(403).json({ success: false, error: 'You are not an authorized member of this organization.' });
      return;
    }

    user.activeWorkspaceId = org._id as mongoose.Types.ObjectId;
    await user.save();

    const tokens = generateTokens(user, org._id.toString());

    await logAuditEvent({
      actorId: user._id as mongoose.Types.ObjectId,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'WORKSPACE_SWITCH',
      organizationId: org._id as mongoose.Types.ObjectId,
      details: { organizationName: org.name },
    });

    res.json({
      success: true,
      message: `Workspace switched to ${org.name}.`,
      workspace: {
        organizationId: org._id,
        organizationName: org.name,
        organizationType: org.type,
        role: isOwner ? 'owner' : membership?.role,
      },
      ...tokens,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
