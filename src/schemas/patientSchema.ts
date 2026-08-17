import { z } from 'zod';

export const AddPatientSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Patient name is required')
    .max(80, 'Patient name cannot exceed 80 characters'),
  mobile: z
    .string()
    .trim()
    .min(10, 'Enter a valid 10-digit mobile number')
    .max(10, 'Mobile number must be exactly 10 digits')
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number starting with 6-9'),
  gender: z.enum(['Male', 'Female', 'Other'], {
    error: 'Please select a valid gender',
  }),
  enquirySource: z.string().min(1, 'Enquiry source is required'),
});

export type AddPatientFormValues = z.infer<typeof AddPatientSchema>;
