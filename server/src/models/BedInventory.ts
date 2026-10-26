import mongoose, { Document, Schema } from 'mongoose';

export type BedCategory = 'general' | 'icu' | 'emergency' | 'oxygen' | 'pediatric';

export interface IBedInventory extends Document {
  organizationId: mongoose.Types.ObjectId;
  ward: string;
  category: BedCategory;
  totalCapacity: number;
  available: number;
  occupied: number;
  cleaning: number;
  reserved: number;
  lastUpdatedBy: mongoose.Types.ObjectId;
  lastUpdatedAt: Date;
  isDemo: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BedInventorySchema = new Schema<IBedInventory>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    ward: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['general', 'icu', 'emergency', 'oxygen', 'pediatric'],
      required: true,
      index: true,
    },
    totalCapacity: {
      type: Number,
      required: true,
      min: 0,
    },
    available: {
      type: Number,
      required: true,
      min: 0,
    },
    occupied: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    cleaning: {
      type: Number,
      min: 0,
      default: 0,
    },
    reserved: {
      type: Number,
      min: 0,
      default: 0,
    },
    lastUpdatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lastUpdatedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    isDemo: {
      type: Boolean,
      default: true,
    },
    notes: String,
  },
  {
    timestamps: true,
  }
);

BedInventorySchema.index({ organizationId: 1, ward: 1, category: 1 }, { unique: true });

export const BedInventory = mongoose.model<IBedInventory>('BedInventory', BedInventorySchema);
