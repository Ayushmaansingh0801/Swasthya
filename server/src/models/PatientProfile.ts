import mongoose, { Document, Schema } from 'mongoose';

export interface IDependent {
  name: string;
  relation: string;
  dateOfBirth?: Date;
  gender?: string;
  allergies?: string[];
}

export interface IPatientProfile extends Document {
  userId: mongoose.Types.ObjectId;
  dateOfBirth?: Date;
  gender?: string;
  bloodGroup?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relation: string;
  };
  allergies: string[];
  chronicConditions: string[];
  currentMedications: string[];
  dependents: IDependent[];
  address?: {
    area: string;
    city: string;
    pincode: string;
    state: string;
  };
  consentSharing: boolean;
  isDemo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PatientProfileSchema = new Schema<IPatientProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    },
    emergencyContact: {
      name: String,
      phone: String,
      relation: String,
    },
    allergies: {
      type: [String],
      default: [],
    },
    chronicConditions: {
      type: [String],
      default: [],
    },
    currentMedications: {
      type: [String],
      default: [],
    },
    dependents: [
      {
        name: { type: String, required: true },
        relation: { type: String, required: true },
        dateOfBirth: Date,
        gender: String,
        allergies: [String],
      },
    ],
    address: {
      area: String,
      city: String,
      pincode: String,
      state: { type: String, default: 'Madhya Pradesh' },
    },
    consentSharing: {
      type: Boolean,
      default: true,
    },
    isDemo: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const PatientProfile = mongoose.model<IPatientProfile>('PatientProfile', PatientProfileSchema);
