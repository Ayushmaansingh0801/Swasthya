import { Router, Response } from 'express';
import { z } from 'zod';
import { Appointment, AppointmentStatus } from '../models/Appointment';
import { DoctorProfile } from '../models/DoctorProfile';
import { Organization } from '../models/Organization';
import { authenticate, AuthRequest } from '../middlewares/auth';
import { validateBody } from '../middlewares/validate';
import { logAuditEvent } from '../services/auditService';
import mongoose from 'mongoose';

const router = Router();

const createAppointmentSchema = z.object({
  doctorId: z.string(),
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date format must be YYYY-MM-DD'),
  timeSlot: z.string().min(2),
  reason: z.string().min(3),
  notes: z.string().optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['requested', 'confirmed', 'checked_in', 'completed', 'cancelled', 'no_show']),
  notes: z.string().optional(),
});

// GET /api/v1/appointments - List appointments based on role & permissions
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const filter: any = {};

    // Patient sees only their appointments
    if (user.role === 'patient') {
      filter.patientId = user._id;
    } else if (user.role.includes('doctor')) {
      const doctorProfile = await DoctorProfile.findOne({ userId: user._id });
      if (doctorProfile) {
        filter.doctorId = doctorProfile._id;
      } else {
        res.json({ success: true, count: 0, data: [] });
        return;
      }
    } else if (req.activeWorkspaceId) {
      // Organization staff (receptionist, admin, bed manager) see appointments for active organization
      filter.organizationId = req.activeWorkspaceId;
    }

    const { date, status } = req.query;
    if (date) {
      filter.appointmentDate = date;
    }
    if (status) {
      filter.status = status;
    }

    const appointments = await Appointment.find(filter)
      .populate('patientId', 'name email phone')
      .populate({
        path: 'doctorId',
        populate: [
          { path: 'userId', select: 'name email phone' },
          { path: 'organizationId', select: 'name type address phone' },
        ],
      })
      .populate('organizationId', 'name type address phone')
      .sort({ appointmentDate: 1, timeSlot: 1 });

    res.json({
      success: true,
      count: appointments.length,
      data: appointments,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/appointments - Book appointment with server-side double booking prevention
router.post('/', authenticate, validateBody(createAppointmentSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { doctorId, appointmentDate, timeSlot, reason, notes } = req.body;
    const patientId = req.user!._id;

    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      res.status(400).json({ success: false, error: 'Invalid Doctor ID.' });
      return;
    }

    const doctor = await DoctorProfile.findById(doctorId);
    if (!doctor) {
      res.status(404).json({ success: false, error: 'Doctor not found.' });
      return;
    }

    const organizationId = doctor.organizationId;
    if (!organizationId) {
      res.status(400).json({ success: false, error: 'Doctor has no affiliated organization/clinic.' });
      return;
    }

    // CRITICAL: Double booking check
    // Check if there is already an active (not cancelled) appointment for this doctor on this date & timeSlot
    const existingConflict = await Appointment.findOne({
      doctorId: doctor._id,
      appointmentDate,
      timeSlot,
      status: { $in: ['requested', 'confirmed', 'checked_in'] },
    });

    if (existingConflict) {
      res.status(409).json({
        success: false,
        error: `Slot Conflict: Doctor is already booked for ${timeSlot} on ${appointmentDate}. Please choose a different time slot.`,
      });
      return;
    }

    // Generate token number for the day
    const countForDay = await Appointment.countDocuments({
      doctorId: doctor._id,
      appointmentDate,
    });
    const tokenNumber = countForDay + 1;

    const appointment = await Appointment.create({
      patientId,
      doctorId: doctor._id,
      organizationId,
      appointmentDate,
      timeSlot,
      status: 'confirmed',
      reason,
      tokenNumber,
      notes,
      statusHistory: [
        {
          status: 'confirmed',
          changedBy: req.user!._id,
          changedAt: new Date(),
          notes: 'Appointment initially confirmed',
        },
      ],
      isDemo: true,
    });

    await logAuditEvent({
      actorId: req.user!._id as mongoose.Types.ObjectId,
      actorEmail: req.user!.email,
      actorRole: req.user!.role,
      action: 'APPOINTMENT_CREATE',
      targetType: 'Appointment',
      targetId: appointment._id.toString(),
      organizationId: organizationId as mongoose.Types.ObjectId,
      details: { doctorId, appointmentDate, timeSlot, tokenNumber },
    });

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully.',
      data: appointment,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/v1/appointments/:id/status - Status transitions
router.patch('/:id/status', authenticate, validateBody(updateStatusSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      res.status(404).json({ success: false, error: 'Appointment not found.' });
      return;
    }

    // Role check: Patient can only cancel their own appointment.
    // Doctor or Clinic/Hospital staff can update to checked_in, completed, no_show, cancelled.
    const isPatient = (req.user!._id as mongoose.Types.ObjectId).toString() === appointment.patientId.toString();

    if (isPatient && status !== 'cancelled') {
      res.status(403).json({ success: false, error: 'Patients can only cancel their appointments.' });
      return;
    }

    appointment.status = status as AppointmentStatus;
    appointment.statusHistory.push({
      status: status as AppointmentStatus,
      changedBy: req.user!._id as mongoose.Types.ObjectId,
      changedAt: new Date(),
      notes: notes || `Status changed to ${status}`,
    });

    await appointment.save();

    await logAuditEvent({
      actorId: req.user!._id as mongoose.Types.ObjectId,
      actorEmail: req.user!.email,
      actorRole: req.user!.role,
      action: 'APPOINTMENT_STATUS_UPDATE',
      targetType: 'Appointment',
      targetId: appointment._id.toString(),
      organizationId: appointment.organizationId as mongoose.Types.ObjectId,
      details: { newStatus: status, notes },
    });

    res.json({
      success: true,
      message: `Appointment status updated to ${status}.`,
      data: appointment,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
