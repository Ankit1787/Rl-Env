import { z } from 'zod';
import { ACTIONS } from '../domain/types.js';

export const stepRequestSchema = z.object({
  action: z.enum(ACTIONS),
});

export type StepRequest = z.infer<typeof stepRequestSchema>;
