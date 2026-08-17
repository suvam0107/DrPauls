import { z } from 'zod';
import { WeekDay } from '../types';

const weekDayEnum = z.enum(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const);

export const AddDoctorSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Doctor name is required')
    .max(100, 'Doctor name cannot exceed 100 characters'),
  specialty: z.string().min(1, 'Specialty is required'),
  department: z.string().trim().min(1, 'Department is required'),
  qualification: z.string().trim().min(1, 'Qualification is required'),
  phone: z
    .string()
    .trim()
    .min(10, 'Enter a valid 10-digit phone number')
    .max(10, 'Phone number must be exactly 10 digits')
    .regex(/^\d{10}$/, 'Phone number must contain 10 digits'),
  consultFee: z
    .string()
    .trim()
    .min(1, 'Consult fee is required')
    .regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid fee amount')
    .refine((val) => parseFloat(val) >= 0, 'Consult fee cannot be negative'),
  maxPatientsPerDay: z
    .string()
    .trim()
    .min(1, 'Max patients per day is required')
    .regex(/^[1-9]\d*$/, 'Must be a positive integer greater than 0'),
  selectedDays: z
    .array(weekDayEnum)
    .min(1, 'Select at least one working day'),
  startHour: z.string().min(1, 'Start time is required'),
  endHour: z.string().min(1, 'End time is required'),
  centerId: z.string().min(1, 'Clinic center is required'),
  available: z.boolean(),
});

export type AddDoctorFormValues = z.infer<typeof AddDoctorSchema>;
