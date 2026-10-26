import mongoose, { Document, Schema } from 'mongoose';

export type VerificationItemType =
  | 'hospital'
  | 'clinic'
  | 'pharmacy'
  | 'lab'
  | 'doctor'
  | 'ambulance';

export type VerificationState =
  | 'pending'
  | 'in_review'
  | 'verified'
  | 'rejected'
  | 'needs_update'
  | 'expired';

export interface IVerificationDocument {
  docType: string; // e.g. 'Medical License', 'Clinical Establishment Act Certificate', 'Drug License'
  documentNumber: string;
  issueDate?: string;
  expiryDate?: string;
  fileUrl?: string;
  status: 'pending' | 'verified' | 'rejected';
}

export interface IVerificationCase extends Document {
  targetType: VerificationItemType;
  targetId: mongoose.Types.ObjectId; // Organization or DoctorProfile
  targetName: string;
  submittedBy: mongoose.Types.ObjectId;
  status: VerificationState;
  documents: IVerificationDocument[];
  reviewerId?: mongoose.Types.ObjectId;
  reviewerNotes?: string;
  decisionReason?: string;
  decisionAt?: Date;
  isDemo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const VerificationCaseSchema = new Schema<IVerificationCase>(
  {
    targetType: {
      type: String,
      required: true,
      index: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    targetName: {
      type: String,
      required: true,
    },
    submittedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'in_review', 'verified', 'rejected', 'needs_update', 'expired'],
      default: 'pending',
      index: true,
    },
    documents: [
      {
        docType: { type: String, required: true },
        documentNumber: { type: String, required: true },
        issueDate: String,
        expiryDate: String,
        fileUrl: String,
        status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
      },
    ],
    reviewerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewerNotes: String,
    decisionReason: String,
    decisionAt: Date,
    isDemo: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const VerificationCase = mongoose.model<IVerificationCase>('VerificationCase', VerificationCaseSchema);
