import mongoose, { Document, Schema } from 'mongoose';

export interface ISupportTicketReply {
  senderId: mongoose.Types.ObjectId;
  senderName: string;
  senderRole: string;
  message: string;
  createdAt: Date;
}

export interface ISupportTicket extends Document {
  userId: mongoose.Types.ObjectId;
  subject: string;
  category: 'technical' | 'verification' | 'appointment' | 'billing' | 'general';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  description: string;
  assignedAgentId?: mongoose.Types.ObjectId;
  replies: ISupportTicketReply[];
  isDemo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SupportTicketSchema = new Schema<ISupportTicket>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['technical', 'verification', 'appointment', 'billing', 'general'],
      default: 'general',
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed'],
      default: 'open',
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    assignedAgentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    replies: [
      {
        senderId: { type: Schema.Types.ObjectId, ref: 'User' },
        senderName: String,
        senderRole: String,
        message: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    isDemo: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const SupportTicket = mongoose.model<ISupportTicket>('SupportTicket', SupportTicketSchema);
