import { Router, Response } from 'express';
import { z } from 'zod';
import { Prescription } from '../models/Prescription';
import { PatientProfile } from '../models/PatientProfile';
import { User } from '../models/User';
import { authenticate, AuthRequest } from '../middlewares/auth';
import { requireRole } from '../middlewares/rbac';
import { validateBody } from '../middlewares/validate';
import { logAuditEvent } from '../services/auditService';
import mongoose from 'mongoose';

const router = Router();

const createPrescriptionSchema = z.object({
  patientId: z.string(),
  appointmentId: z.string().optional(),
  diagnosis: z.string().min(2),
  medicines: z.array(
    z.object({
      name: z.string().min(1),
      genericName: z.string().optional(),
      dosage: z.string().min(1),
      frequency: z.string().min(1),
      duration: z.string().min(1),
      instructions: z.string().optional(),
    })
  ).min(1, 'At least one medicine is required'),
  advice: z.string().optional(),
  followUpDate: z.string().optional(),
});

// GET /api/v1/prescriptions
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const filter: any = {};

    if (user.role === 'patient') {
      filter.patientId = user._id;
    } else if (user.role.includes('doctor')) {
      filter.doctorId = user._id;
    } else if (req.activeWorkspaceId) {
      filter.organizationId = req.activeWorkspaceId;
    }

    const prescriptions = await Prescription.find(filter)
      .populate('patientId', 'name email phone')
      .populate('doctorId', 'name email role')
      .populate('organizationId', 'name type address phone')
      .populate('dispensedBy', 'name role')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: prescriptions.length,
      data: prescriptions,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/prescriptions - Create prescription with allergy check
router.post(
  '/',
  authenticate,
  requireRole('hospital_doctor', 'private_doctor', 'homeopathy_doctor'),
  validateBody(createPrescriptionSchema),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { patientId, appointmentId, diagnosis, medicines, advice, followUpDate } = req.body;

      const patientProfile = await PatientProfile.findOne({ userId: patientId });
      const patientAllergies = patientProfile?.allergies || [];

      // Check for allergy conflicts
      let allergyWarningTriggered = false;
      let allergyDetails = '';

      medicines.forEach((med: any) => {
        const medNameLower = (med.name + ' ' + (med.genericName || '')).toLowerCase();
        patientAllergies.forEach((allergy: string) => {
          if (medNameLower.includes(allergy.toLowerCase())) {
            allergyWarningTriggered = true;
            allergyDetails = `Advisory Warning: Medicine '${med.name}' matches patient's recorded allergy '${allergy}'.`;
          }
        });
      });

      const prescription = await Prescription.create({
        patientId,
        doctorId: req.user!._id,
        organizationId: req.activeWorkspaceId,
        appointmentId,
        diagnosis,
        medicines,
        advice,
        followUpDate,
        allergyWarningTriggered,
        allergyDetails,
        status: 'active',
        isDemo: true,
      });

      await logAuditEvent({
        actorId: req.user!._id as mongoose.Types.ObjectId,
        actorEmail: req.user!.email,
        actorRole: req.user!.role,
        action: 'PRESCRIPTION_CREATE',
        targetType: 'Prescription',
        targetId: prescription._id.toString(),
        details: { patientId, medicineCount: medicines.length, allergyWarningTriggered },
      });

      res.status(201).json({
        success: true,
        message: 'Prescription created successfully.',
        allergyWarningTriggered,
        allergyDetails,
        data: prescription,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// PATCH /api/v1/prescriptions/:id/dispense - Pharmacist dispensing
router.patch(
  '/:id/dispense',
  authenticate,
  requireRole('medical_store_owner', 'pharmacist'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const prescription = await Prescription.findById(req.params.id);
      if (!prescription) {
        res.status(404).json({ success: false, error: 'Prescription not found.' });
        return;
      }

      prescription.status = 'dispensed';
      prescription.dispensedBy = req.user!._id as mongoose.Types.ObjectId;
      prescription.dispensedAt = new Date();
      await prescription.save();

      await logAuditEvent({
        actorId: req.user!._id as mongoose.Types.ObjectId,
        actorEmail: req.user!.email,
        actorRole: req.user!.role,
        action: 'PRESCRIPTION_DISPENSE',
        targetType: 'Prescription',
        targetId: prescription._id.toString(),
        organizationId: req.activeWorkspaceId,
      });

      res.json({
        success: true,
        message: 'Prescription marked as dispensed.',
        data: prescription,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

export default router;
