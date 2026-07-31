import { Share } from 'react-native';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import Toast from 'react-native-toast-message';
import { Appointment, Doctor, Patient, Center } from '../types';
import { formatDate, formatTime } from './dateUtils';
import { copyToClipboard } from './clipboardUtils';
import { playClickSound } from './feedback';

/**
 * Format Appointment details cleanly into a medical clinical template
 * (Note: Patient ID removed for confidentiality; Appointment ID retained)
 */
export function formatAppointmentText(
  appointment: Appointment,
  patientObj?: Patient | null,
  centerObj?: Center | null
): string {
  const lines: string[] = [];
  lines.push('DR. PAUL\'S MULTISPECIALITY CLINIC');
  lines.push('APPOINTMENT DETAILS');
  lines.push('----------------------------------------');
  lines.push(`• Appointment ID: ${appointment.id}`);
  lines.push(`• Patient Name: ${appointment.patientName}`);
  lines.push(`• Contact Mobile: ${appointment.patientMobile || patientObj?.mobile || 'N/A'}`);
  lines.push(`• Doctor: ${appointment.doctorName}`);
  lines.push(`• Service Type: ${appointment.serviceType}`);
  lines.push(`• Date: ${formatDate(appointment.date)}`);
  lines.push(`• Time Slot: ${formatTime(appointment.startTime)}`);
  lines.push(`• Visit Type: ${appointment.visitType} Visit`);
  lines.push(`• Status: ${appointment.status.toUpperCase()}`);

  if (appointment.therapistName) {
    lines.push(`• Therapist: ${appointment.therapistName}`);
  }
  if (appointment.prePaymentRequired) {
    lines.push(`• Pre-payment Required: ₹${appointment.prePaymentAmount || 0}`);
  }
  if (appointment.remark) {
    lines.push(`• Notes / Remark: ${appointment.remark}`);
  }
  if (centerObj) {
    lines.push('----------------------------------------');
    lines.push(`Clinic Branch: ${centerObj.cc_name}`);
    lines.push(`Address: ${centerObj.bill_address}, ${centerObj.bill_state} - ${centerObj.bill_pin}`);
    lines.push(`Clinic Phone: +91 ${centerObj.phone}`);
  }
  return lines.join('\n');
}

/**
 * Format Doctor details cleanly into a medical clinical template
 * (Note: Confidential Doctor ID excluded)
 */
export function formatDoctorText(doctor: Doctor): string {
  const lines: string[] = [];
  lines.push('DR. PAUL\'S MULTISPECIALITY CLINIC');
  lines.push('DOCTOR PROFILE & SCHEDULE');
  lines.push('----------------------------------------');
  lines.push(`• Name: ${doctor.name}`);
  lines.push(`• Specialty: ${doctor.specialty} (${doctor.department || 'Dermatology'})`);
  lines.push(`• Qualification: ${doctor.qualification || 'N/A'}`);
  lines.push(`• Contact Phone: ${doctor.phone || 'N/A'}`);
  lines.push(`• Consultation Fee: ₹${doctor.consultFee || 800}`);
  lines.push(`• Max Daily Patients: ${doctor.maxPatientsPerDay || 15} patients/day`);
  lines.push(`• Primary Location: ${doctor.location || 'Guwahati Main'}`);
  if (doctor.workingHours) {
    lines.push(`• Working Hours: ${doctor.workingHours.start} – ${doctor.workingHours.end}`);
  }
  if (doctor.workingDays && doctor.workingDays.length > 0) {
    lines.push(`• Working Days: ${doctor.workingDays.join(', ')}`);
  }
  lines.push(`• Duty Status: ${doctor.available ? 'Available On Duty' : 'On Leave'}`);
  return lines.join('\n');
}

/**
 * Format Patient details cleanly into a medical clinical template
 * (Note: Confidential Patient ID excluded)
 */
export function formatPatientText(patient: Patient): string {
  const lines: string[] = [];
  lines.push('DR. PAUL\'S MULTISPECIALITY CLINIC');
  lines.push('PATIENT MEDICAL RECORD');
  lines.push('----------------------------------------');
  lines.push(`• Full Name: ${patient.name}`);
  lines.push(`• Gender: ${patient.gender}${patient.dob ? ` | DOB: ${patient.dob}` : ''}`);
  lines.push(`• Primary Mobile: ${patient.mobile}`);
  if (patient.whatsapp) {
    lines.push(`• WhatsApp: ${patient.whatsapp}`);
  }
  if (patient.alternateMobile) {
    lines.push(`• Alternate Mobile: ${patient.alternateMobile}`);
  }
  if (patient.email) {
    lines.push(`• Email Address: ${patient.email}`);
  }
  if (patient.address) {
    const locParts = [patient.address, patient.district, patient.state, patient.pinCode].filter(Boolean);
    lines.push(`• Address: ${locParts.join(', ')}`);
  }
  if (patient.enquirySource) {
    lines.push(`• Enquiry Source: ${patient.enquirySource}`);
  }
  if (patient.referenceDoctor) {
    lines.push(`• Reference Doctor: ${patient.referenceDoctor}`);
  }
  if (patient.createdAt) {
    lines.push(`• Registration Date: ${new Date(patient.createdAt).toLocaleDateString()}`);
  }
  return lines.join('\n');
}

/**
 * Format Center details cleanly into a clinical template
 */
export function formatCenterText(center: Center): string {
  const lines: string[] = [];
  lines.push('DR. PAUL\'S MULTISPECIALITY CLINIC');
  lines.push('CLINIC CENTER DETAILS');
  lines.push('----------------------------------------');
  lines.push(`• Center Name: ${center.cc_name}${center.isMain ? ' (Main Center)' : ''}`);
  if (center.comp_name) {
    lines.push(`• Company: ${center.comp_name}`);
  }
  lines.push(`• Address: ${center.bill_address}, ${center.bill_state} - ${center.bill_pin}`);
  lines.push(`• Phone Contact: +91 ${center.phone}`);
  if (center.email) {
    lines.push(`• Email: ${center.email}`);
  }
  lines.push(`• Operating Hours: ${center.openHours.start} – ${center.openHours.end}`);
  lines.push(`• Operating Days: ${center.openDays.join(', ')}`);
  if (center.closedDays && center.closedDays.length > 0) {
    lines.push(`• Closed Days: ${center.closedDays.join(', ')}`);
  }
  return lines.join('\n');
}

/**
 * Share formatted text directly to messaging apps (WhatsApp, Gmail, Teams, etc.)
 * Pre-fills text directly in the chat composer without creating files or modifying clipboard.
 */
export async function shareDetails(
  title: string,
  formattedText: string
): Promise<void> {
  playClickSound();
  try {
    await Share.share(
      {
        message: formattedText,
        title,
      },
      {
        dialogTitle: `Share ${title}`,
      }
    );
  } catch (error) {
    console.warn('Error sharing text details:', error);
  }
}
