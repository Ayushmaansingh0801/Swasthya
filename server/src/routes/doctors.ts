import { Router, Response } from 'express';
import { DoctorProfile } from '../models/DoctorProfile';
import { User } from '../models/User';
import { Organization } from '../models/Organization';
import { authenticate, AuthRequest } from '../middlewares/auth';
import { requireRole } from '../middlewares/rbac';

const router = Router();

// GET /api/v1/doctors - Search doctors
router.get('/', async (req: any, res: Response): Promise<void> => {
  try {
    const { specialty, homeopathy, search, organizationId } = req.query;
    const filter: any = {};

    if (specialty) {
      filter.specialty = new RegExp(specialty as string, 'i');
    }
    if (homeopathy === 'true') {
      filter.isHomeopathy = true;
    } else if (homeopathy === 'false') {
      filter.isHomeopathy = false;
    }
    if (organizationId) {
      filter.organizationId = organizationId;
    }

    const doctors = await DoctorProfile.find(filter)
      .populate('userId', 'name email phone preferredLanguage')
      .populate('organizationId', 'name type address phone operatingHours isVerified')
      .sort({ isVerified: -1, experienceYears: -1 });

    let filtered = doctors;
    if (search) {
      const q = (search as string).toLowerCase();
      filtered = doctors.filter((doc: any) => {
        const docName = doc.userId?.name?.toLowerCase() || '';
        const docSpec = doc.specialty?.toLowerCase() || '';
        const orgName = doc.organizationId?.name?.toLowerCase() || '';
        return docName.includes(q) || docSpec.includes(q) || orgName.includes(q);
      });
    }

    res.json({
      success: true,
      count: filtered.length,
      data: filtered,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/v1/doctors/:id - Doctor detail
router.get('/:id', async (req: any, res: Response): Promise<void> => {
  try {
    const doctor = await DoctorProfile.findById(req.params.id)
      .populate('userId', 'name email phone preferredLanguage')
      .populate('organizationId', 'name type address phone operatingHours isVerified');

    if (!doctor) {
      res.status(404).json({ success: false, error: 'Doctor profile not found.' });
      return;
    }

    // Default slots for booking demo
    const defaultTimeSlots = [
      '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
      '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM'
    ];

    res.json({
      success: true,
      data: {
        ...doctor.toObject(),
        availableSlots: defaultTimeSlots,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/v1/doctors/profile - Update own doctor profile
router.put(
  '/profile',
  authenticate,
  requireRole('hospital_doctor', 'private_doctor', 'homeopathy_doctor'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { specialty, qualifications, consultationFee, about, consultationHours, availableDays } = req.body;

      const profile = await DoctorProfile.findOneAndUpdate(
        { userId: req.user!._id },
        {
          $set: {
            specialty,
            qualifications,
            consultationFee,
            about,
            consultationHours,
            availableDays,
          },
        },
        { new: true, upsert: true }
      );

      res.json({
        success: true,
        message: 'Doctor profile updated successfully.',
        data: profile,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

export default router;
