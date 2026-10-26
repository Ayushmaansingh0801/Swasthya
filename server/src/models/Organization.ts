import mongoose, { Document, Schema } from 'mongoose';

export type OrganizationType =
  | 'hospital'
  | 'private_clinic'
  | 'homeopathy_clinic'
  | 'medical_store'
  | 'diagnostic_lab'
  | 'emergency_provider';

export type VerificationStatus =
  | 'pending'
  | 'in_review'
  | 'verified'
  | 'rejected'
  | 'needs_update';

export interface IOrganization extends Document {
  name: string;
  type: OrganizationType;
  registrationNumber?: string;
  ownerId?: mongoose.Types.ObjectId;
  address: {
    street?: string;
    area: string;
    city: string;
    pincode: string;
    state: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  phone: string;
  email?: string;
  emergencyHelpline?: string;
  operatingHours: string;
  services: string[];
  departments: string[];
  totalBeds?: number;
  isVerified: boolean;
  verificationStatus: VerificationStatus;
  verificationNotes?: string;
  isDemo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema = new Schema<IOrganization>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      index: true,
    },
    registrationNumber: {
      type: String,
      trim: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    address: {
      street: String,
      area: { type: String, required: true },
      city: { type: String, required: true, index: true },
      pincode: { type: String, required: true },
      state: { type: String, required: true, default: 'Madhya Pradesh' },
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
    phone: {
      type: String,
      required: true,
    },
    email: {
      type: String,
    },
    emergencyHelpline: {
      type: String,
    },
    operatingHours: {
      type: String,
      default: '24x7 Emergency / 9:00 AM - 8:00 PM OPD',
    },
    services: {
      type: [String],
      default: [],
    },
    departments: {
      type: [String],
      default: [],
    },
    totalBeds: {
      type: Number,
      default: 0,
    },
    isVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'in_review', 'verified', 'rejected', 'needs_update'],
      default: 'pending',
      index: true,
    },
    verificationNotes: String,
    isDemo: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

OrganizationSchema.index({ 'address.city': 1, type: 1 });

export const Organization = mongoose.model<IOrganization>('Organization', OrganizationSchema);
