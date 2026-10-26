import mongoose, { Document, Schema } from 'mongoose';

export type SampleStatus = 'ordered' | 'collected' | 'processing' | 'completed' | 'rejected';

export interface ILabTestResult {
  parameter: string;
  value: string;
  unit: string;
  referenceRange: string;
  isAbnormal: boolean;
}

export interface ILabOrder extends Document {
  patientId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  testName: string;
  category: string;
  sampleId: string;
  collectionDate?: string;
  sampleStatus: SampleStatus;
  results: ILabTestResult[];
  technicianNotes?: string;
  isReleasedToPatient: boolean;
  releasedAt?: Date;
  releasedBy?: mongoose.Types.ObjectId;
  aiExplanation?: string;
  isDemo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LabOrderSchema = new Schema<ILabOrder>(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    testName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    category: {
      type: String,
      default: 'General Pathology',
    },
    sampleId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    collectionDate: String,
    sampleStatus: {
      type: String,
      enum: ['ordered', 'collected', 'processing', 'completed', 'rejected'],
      default: 'ordered',
      index: true,
    },
    results: [
      {
        parameter: { type: String, required: true },
        value: { type: String, required: true },
        unit: { type: String, required: true },
        referenceRange: { type: String, required: true },
        isAbnormal: { type: Boolean, default: false },
      },
    ],
    technicianNotes: String,
    isReleasedToPatient: {
      type: Boolean,
      default: false,
      index: true,
    },
    releasedAt: Date,
    releasedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    aiExplanation: String,
    isDemo: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const LabOrder = mongoose.model<ILabOrder>('LabOrder', LabOrderSchema);
