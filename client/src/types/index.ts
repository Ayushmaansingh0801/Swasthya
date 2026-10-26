export type UserRole =
  | 'patient'
  | 'hospital_doctor'
  | 'hospital_admin'
  | 'hospital_receptionist'
  | 'hospital_staff'
  | 'private_doctor'
  | 'private_clinic_admin'
  | 'clinic_receptionist'
  | 'homeopathy_doctor'
  | 'homeopathy_clinic_admin'
  | 'medical_store_owner'
  | 'pharmacist'
  | 'platform_super_admin'
  | 'verification_admin'
  | 'ambulance_provider'
  | 'lab_admin'
  | 'lab_tech'
  | 'nurse'
  | 'bed_manager'
  | 'doctor_assistant'
  | 'support_agent'
  | 'public_health_admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  isEmailVerified: boolean;
  preferredLanguage: 'en' | 'hi';
  activeWorkspaceId?: string;
  workspaceRole?: string;
  isDemoAccount?: boolean;
}

export interface WorkspaceItem {
  membershipId: string | null;
  organizationId: string;
  organizationName: string;
  organizationType: string;
  role: string;
}

export interface Organization {
  _id: string;
  name: string;
  type: 'hospital' | 'private_clinic' | 'homeopathy_clinic' | 'medical_store' | 'diagnostic_lab' | 'emergency_provider';
  registrationNumber?: string;
  address: {
    street?: string;
    area: string;
    city: string;
    pincode: string;
    state: string;
    coordinates?: { lat: number; lng: number };
  };
  phone: string;
  email?: string;
  emergencyHelpline?: string;
  operatingHours: string;
  services: string[];
  departments?: string[];
  totalBeds?: number;
  isVerified: boolean;
  verificationStatus: string;
  isDemo: boolean;
  bedSummary?: {
    totalCapacity: number;
    totalAvailable: number;
    lastUpdatedAt: string;
    isStale: boolean;
  };
}

export interface Doctor {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
  organizationId?: Organization;
  specialty: string;
  qualifications: string[];
  registrationNumber: string;
  experienceYears: number;
  consultationFee: number;
  isHomeopathy: boolean;
  isVerified: boolean;
  about?: string;
  consultationHours: string;
  availableDays: string[];
  slotDurationMinutes: number;
  availableSlots?: string[];
}

export interface Bed {
  _id: string;
  organizationId: Organization;
  ward: string;
  category: 'general' | 'icu' | 'emergency' | 'oxygen' | 'pediatric';
  totalCapacity: number;
  available: number;
  occupied: number;
  cleaning: number;
  reserved: number;
  lastUpdatedBy: {
    _id: string;
    name: string;
    role: string;
  };
  lastUpdatedAt: string;
  isStale: boolean;
  ageHours?: number;
  notes?: string;
}

export interface Appointment {
  _id: string;
  patientId: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
  doctorId: Doctor;
  organizationId: Organization;
  appointmentDate: string;
  timeSlot: string;
  status: 'requested' | 'confirmed' | 'checked_in' | 'completed' | 'cancelled' | 'no_show';
  reason: string;
  tokenNumber: number;
  notes?: string;
  statusHistory?: Array<{
    status: string;
    changedAt: string;
    notes?: string;
  }>;
}

export interface MedicalRecord {
  _id: string;
  patientId: {
    _id: string;
    name: string;
  };
  doctorId?: {
    _id: string;
    name: string;
  };
  type: string;
  title: string;
  recordDate: string;
  clinicalNotes?: {
    symptoms?: string;
    examination?: string;
    diagnosis?: string;
    plan?: string;
    followUpDate?: string;
  };
  aiDraftSummary?: string;
  aiApprovedByDoctor?: boolean;
  fileUrl?: string;
  fileName?: string;
}

export interface Prescription {
  _id: string;
  patientId: {
    _id: string;
    name: string;
    phone?: string;
  };
  doctorId: {
    _id: string;
    name: string;
  };
  organizationId?: Organization;
  diagnosis: string;
  medicines: Array<{
    name: string;
    genericName?: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
  }>;
  advice?: string;
  followUpDate?: string;
  allergyWarningTriggered: boolean;
  allergyDetails?: string;
  status: 'active' | 'dispensed' | 'cancelled';
  createdAt: string;
}

export interface PharmacyItem {
  _id: string;
  organizationId: Organization;
  medicineName: string;
  genericName: string;
  brand: string;
  strength: string;
  dosageForm: string;
  packSize: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  lowStockThreshold: number;
  price: number;
  isPrescriptionRequired: boolean;
  isLowStock?: boolean;
  isNearExpiry?: boolean;
  isExpired?: boolean;
}

export interface LabOrder {
  _id: string;
  patientId: {
    _id: string;
    name: string;
    email: string;
  };
  organizationId: Organization;
  testName: string;
  category: string;
  sampleId: string;
  collectionDate?: string;
  sampleStatus: 'ordered' | 'collected' | 'processing' | 'completed' | 'rejected';
  results: Array<{
    parameter: string;
    value: string;
    unit: string;
    referenceRange: string;
    isAbnormal: boolean;
  }>;
  technicianNotes?: string;
  isReleasedToPatient: boolean;
  releasedAt?: string;
  aiExplanation?: string;
  reportStatusNotice?: string;
}

export interface VerificationCase {
  _id: string;
  targetType: string;
  targetId: string;
  targetName: string;
  submittedBy: {
    _id: string;
    name: string;
    email: string;
  };
  status: 'pending' | 'in_review' | 'verified' | 'rejected' | 'needs_update' | 'expired';
  documents: Array<{
    docType: string;
    documentNumber: string;
    issueDate?: string;
    expiryDate?: string;
    status: string;
  }>;
  decisionReason?: string;
  reviewerNotes?: string;
  createdAt: string;
}
