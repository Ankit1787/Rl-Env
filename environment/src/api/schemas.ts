import { z } from 'zod';
import { ACTIONS } from '../domain/types.js';

export const stepRequestSchema = z.object({
  action: z.enum(ACTIONS),
});

const positionSchema = z.object({
  x: z.number().int().min(0),
  y: z.number().int().min(0),
});

export const configureRequestSchema = z.object({
  width: z.number().int().min(2).max(30),
  height: z.number().int().min(2).max(30),
  maxSteps: z.number().int().min(1).max(10000),
  robotStart: positionSchema,
  boxStart: positionSchema,
  goalPosition: positionSchema,
  walls: z.array(positionSchema).max(300).default([]),
});

export type StepRequest = z.infer<typeof stepRequestSchema>;
