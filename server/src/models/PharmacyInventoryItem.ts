import mongoose, { Document, Schema } from 'mongoose';

export type DosageForm = 'tablet' | 'syrup' | 'capsule' | 'injection' | 'ointment' | 'drops' | 'powder';

export interface IPharmacyInventoryItem extends Document {
  organizationId: mongoose.Types.ObjectId;
  medicineName: string;
  genericName: string;
  brand: string;
  strength: string; // e.g. '500mg'
  dosageForm: DosageForm;
  packSize: string; // e.g. 'Strip of 10'
  batchNumber: string;
  expiryDate: string; // YYYY-MM-DD
  quantity: number;
  lowStockThreshold: number;
  price: number;
  isPrescriptionRequired: boolean;
  lastUpdatedBy: mongoose.Types.ObjectId;
  isDemo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PharmacyInventoryItemSchema = new Schema<IPharmacyInventoryItem>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    medicineName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    genericName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    brand: {
      type: String,
      default: 'Generic',
    },
    strength: {
      type: String,
      required: true,
    },
    dosageForm: {
      type: String,
      enum: ['tablet', 'syrup', 'capsule', 'injection', 'ointment', 'drops', 'powder'],
      required: true,
    },
    packSize: {
      type: String,
      default: '10 units',
    },
    batchNumber: {
      type: String,
      required: true,
    },
    expiryDate: {
      type: String,
      required: true,
      index: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    lowStockThreshold: {
      type: Number,
      default: 20,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    isPrescriptionRequired: {
      type: Boolean,
      default: false,
    },
    lastUpdatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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

PharmacyInventoryItemSchema.index({ organizationId: 1, medicineName: 1, batchNumber: 1 }, { unique: true });

export const PharmacyInventoryItem = mongoose.model<IPharmacyInventoryItem>(
  'PharmacyInventoryItem',
  PharmacyInventoryItemSchema
);
