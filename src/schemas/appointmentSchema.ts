import { z } from 'zod';

const BaseAppointmentSchema = z.object({
  centerId: z.string().min(1, 'Please select a clinic center'),
  patientId: z.string().min(1, 'Please select or add a patient'),
  patientName: z.string().min(1, 'Patient name is required'),
  patientMobile: z.string(),
  doctorId: z.string().min(1, 'Please select a doctor'),
  date: z.string().min(1, 'Please select an appointment date'),
  startTime: z.string().min(1, 'Please select a valid time slot'),
  prePaymentRequired: z.boolean(),
  prePaymentAmount: z.string(),
  remark: z.string(),
});

export const NormalAppointmentSchema = BaseAppointmentSchema.extend({
  activeTab: z.literal('Normal'),
  appointmentType: z.string().min(1, 'Appointment type is required'),
  serviceType: z.string().min(1, 'Service type is required'),
  visitType: z.string().min(1, 'Visit type is required'),
  therapistId: z.string(),
  packageId: z.string().optional(),
  sessionInterval: z.number().optional(),
});

export const PackageAppointmentSchema = BaseAppointmentSchema.extend({
  activeTab: z.literal('Package'),
  appointmentType: z.string().optional(),
  serviceType: z.string().optional(),
  visitType: z.string().optional(),
  packageId: z.string().min(1, 'Please select a package'),
  sessionInterval: z.union([
    z.literal(7),
    z.literal(14),
    z.literal(21),
    z.literal(30),
  ]),
  therapistId: z.string(),
});

export const CreateAppointmentSchema = z.discriminatedUnion('activeTab', [
  NormalAppointmentSchema,
  PackageAppointmentSchema,
]);

export type NormalAppointmentFormValues = z.infer<typeof NormalAppointmentSchema>;
export type PackageAppointmentFormValues = z.infer<typeof PackageAppointmentSchema>;
export type CreateAppointmentFormValues = z.infer<typeof CreateAppointmentSchema>;
