import { Router, Response } from 'express';
import { z } from 'zod';
import { AIService } from '../services/aiService';
import { authenticate, AuthRequest } from '../middlewares/auth';
import { validateBody } from '../middlewares/validate';

const router = Router();

const triageSchema = z.object({
  symptoms: z.string().min(2, 'Please describe your symptoms.'),
  language: z.enum(['en', 'hi']).default('en'),
});

const reportExplainSchema = z.object({
  reportText: z.string().optional(),
  parameters: z
    .array(
      z.object({
        name: z.string(),
        value: z.string(),
        unit: z.string().optional(),
      })
    )
    .default([]),
});

// POST /api/v1/ai/triage
router.post('/triage', validateBody(triageSchema), async (req: any, res: Response): Promise<void> => {
  try {
    const { symptoms, language } = req.body;
    const result = await AIService.analyzeSymptoms(symptoms, language);

    res.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/ai/explain-report
router.post('/explain-report', validateBody(reportExplainSchema), async (req: any, res: Response): Promise<void> => {
  try {
    const { reportText, parameters } = req.body;
    const result = await AIService.explainLabReport(reportText || '', parameters);

    res.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
