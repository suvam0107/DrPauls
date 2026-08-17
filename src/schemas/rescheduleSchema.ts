import { z } from 'zod';

export const RescheduleSchema = z.object({
  doctorId: z.string().min(1, 'Please select a doctor'),
  date: z.string().min(1, 'Please select a date'),
  startTime: z.string().min(1, 'Please select a valid time slot'),
});

export type RescheduleFormValues = z.infer<typeof RescheduleSchema>;
