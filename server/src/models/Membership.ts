import mongoose, { Document, Schema } from 'mongoose';

export type MembershipRole =
  | 'hospital_admin'
  | 'hospital_doctor'
  | 'hospital_receptionist'
  | 'hospital_staff'
  | 'nurse'
  | 'bed_manager'
  | 'clinic_admin'
  | 'private_doctor'
  | 'clinic_receptionist'
  | 'homeopathy_doctor'
  | 'store_owner'
  | 'pharmacist'
  | 'lab_admin'
  | 'lab_tech';

export interface IMembership extends Document {
  userId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  role: MembershipRole;
  department?: string;
  status: 'active' | 'invited' | 'suspended';
  invitedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MembershipSchema = new Schema<IMembership>(
  {
    userId: {
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
    role: {
      type: String,
      required: true,
    },
    department: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'invited', 'suspended'],
      default: 'active',
      index: true,
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

MembershipSchema.index({ userId: 1, organizationId: 1 }, { unique: true });

export const Membership = mongoose.model<IMembership>('Membership', MembershipSchema);
