import { Router, Response } from 'express';
import { z } from 'zod';
import { SupportTicket } from '../models/SupportTicket';
import { authenticate, AuthRequest } from '../middlewares/auth';
import { validateBody } from '../middlewares/validate';
import mongoose from 'mongoose';

const router = Router();

const createTicketSchema = z.object({
  subject: z.string().min(3),
  category: z.enum(['technical', 'verification', 'appointment', 'billing', 'general']).default('general'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  description: z.string().min(5),
});

const replyTicketSchema = z.object({
  message: z.string().min(1),
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
});

// GET /api/v1/support/tickets
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const filter: any = {};

    if (user.role === 'patient') {
      filter.userId = user._id;
    }

    const tickets = await SupportTicket.find(filter)
      .populate('userId', 'name email phone role')
      .populate('assignedAgentId', 'name role')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: tickets.length,
      data: tickets,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/support/tickets
router.post('/', authenticate, validateBody(createTicketSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { subject, category, priority, description } = req.body;

    const ticket = await SupportTicket.create({
      userId: req.user!._id,
      subject,
      category,
      priority,
      description,
      status: 'open',
      replies: [],
      isDemo: true,
    });

    res.status(201).json({
      success: true,
      message: 'Support ticket submitted successfully.',
      data: ticket,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/support/tickets/:id/reply
router.post('/:id/reply', authenticate, validateBody(replyTicketSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { message, status } = req.body;

    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      res.status(404).json({ success: false, error: 'Support ticket not found.' });
      return;
    }

    ticket.replies.push({
      senderId: req.user!._id as mongoose.Types.ObjectId,
      senderName: req.user!.name,
      senderRole: req.user!.role,
      message,
      createdAt: new Date(),
    });

    if (status) {
      ticket.status = status;
    }

    await ticket.save();

    res.json({
      success: true,
      message: 'Reply added successfully.',
      data: ticket,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
