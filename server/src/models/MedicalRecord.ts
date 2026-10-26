import mongoose, { Document, Schema } from 'mongoose';

export type MedicalRecordType = 'visit_note' | 'lab_report' | 'discharge_summary' | 'imaging' | 'prescription_doc';

export interface IMedicalRecord extends Document {
  patientId: mongoose.Types.ObjectId;
  doctorId?: mongoose.Types.ObjectId;
  organizationId?: mongoose.Types.ObjectId;
  type: MedicalRecordType;
  title: string;
  recordDate: Date;
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
  fileMimeType?: string;
  isPrivate: boolean;
  isDemo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MedicalRecordSchema = new Schema<IMedicalRecord>(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      index: true,
    },
    type: {
      type: String,
      enum: ['visit_note', 'lab_report', 'discharge_summary', 'imaging', 'prescription_doc'],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    recordDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    clinicalNotes: {
      symptoms: String,
      examination: String,
      diagnosis: String,
      plan: String,
      followUpDate: String,
    },
    aiDraftSummary: String,
    aiApprovedByDoctor: {
      type: Boolean,
      default: false,
    },
    fileUrl: String,
    fileName: String,
    fileMimeType: String,
    isPrivate: {
      type: Boolean,
      default: false,
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

export const MedicalRecord = mongoose.model<IMedicalRecord>('MedicalRecord', MedicalRecordSchema);
