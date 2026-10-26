import mongoose, { Document, Schema } from 'mongoose';

export interface IPrescriptionItem {
  name: string;
  genericName?: string;
  dosage: string;
  frequency: string; // e.g. '1-0-1' or 'Once daily'
  duration: string;  // e.g. '5 days'
  instructions?: string; // e.g. 'After food'
}

export interface IPrescription extends Document {
  patientId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  appointmentId?: mongoose.Types.ObjectId;
  diagnosis: string;
  medicines: IPrescriptionItem[];
  advice?: string;
  followUpDate?: string;
  allergyWarningTriggered: boolean;
  allergyDetails?: string;
  status: 'active' | 'dispensed' | 'cancelled';
  dispensedBy?: mongoose.Types.ObjectId;
  dispensedAt?: Date;
  isDemo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PrescriptionSchema = new Schema<IPrescription>(
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
      required: true,
      index: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
    },
    diagnosis: {
      type: String,
      required: true,
    },
    medicines: [
      {
        name: { type: String, required: true },
        genericName: String,
        dosage: { type: String, required: true },
        frequency: { type: String, required: true },
        duration: { type: String, required: true },
        instructions: String,
      },
    ],
    advice: String,
    followUpDate: String,
    allergyWarningTriggered: {
      type: Boolean,
      default: false,
    },
    allergyDetails: String,
    status: {
      type: String,
      enum: ['active', 'dispensed', 'cancelled'],
      default: 'active',
      index: true,
    },
    dispensedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    dispensedAt: Date,
    isDemo: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Prescription = mongoose.model<IPrescription>('Prescription', PrescriptionSchema);
