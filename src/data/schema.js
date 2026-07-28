/**
 * @DataEngineer — JSDoc schema definitions (JS equivalent of TypeScript types)
 * All entities follow ARCHITECTURE.md §7. Update here when schema changes.
 */

/**
 * @typedef {Object} ParentDetail
 * @property {string} name
 * @property {string} relation
 * @property {string} contactNo
 * @property {string} [whatsapp]
 */

/**
 * @typedef {Object} TherapistAssignment
 * @property {string} therapistId
 * @property {string} therapistName
 * @property {boolean} isPrimary
 */

/**
 * @typedef {Object} Patient
 * @property {string} id              - "PAT-001"
 * @property {string} name
 * @property {string} mobile          - 10-digit primary
 * @property {string} [whatsapp]
 * @property {string} [alternateMobile]
 * @property {string} [dob]           - "YYYY-MM-DD"
 * @property {'Male'|'Female'|'Other'} gender
 * @property {string} [email]
 * @property {string} [address]
 * @property {string} [pinCode]
 * @property {string} [state]
 * @property {string} [district]
 * @property {string} [enquirySource]
 * @property {string} [enquirySubSource]
 * @property {string} [referenceDoctor]
 * @property {ParentDetail[]} parentDetails
 * @property {TherapistAssignment[]} therapistDetails
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @typedef {'Mon'|'Tue'|'Wed'|'Thu'|'Fri'|'Sat'|'Sun'} WeekDay
 */

/**
 * @typedef {Object} Doctor
 * @property {string} id             - "DOC-001"
 * @property {string} name
 * @property {string} specialty
 * @property {string} department
 * @property {string} [qualification]
 * @property {boolean} available
 * @property {number} consultFee
 * @property {string} location
 * @property {WeekDay[]} workingDays
 * @property {{start:string, end:string}} workingHours - "HH:mm"
 * @property {string} [photo]
 */

/**
 * @typedef {Object} Appointment
 * @property {string} id             - "APT-001"
 * @property {string} patientId
 * @property {string} patientName
 * @property {string} patientMobile
 * @property {string} doctorId
 * @property {string} doctorName
 * @property {string} date           - "YYYY-MM-DD"
 * @property {string} startTime      - "HH:mm"
 * @property {string} endTime        - "HH:mm"
 * @property {string} appointmentType
 * @property {string} serviceType
 * @property {string} visitType
 * @property {string} [consultancy]
 * @property {string} [therapistId]
 * @property {string} [therapistName]
 * @property {boolean} isPackage
 * @property {string} [packageId]
 * @property {boolean} prePaymentRequired
 * @property {number} prePaymentAmount
 * @property {string} status
 * @property {string} leadStatus
 * @property {string} [remark]
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @typedef {Object} Package
 * @property {string} id             - "PKG-001"
 * @property {string} name
 * @property {string} serviceType
 * @property {number} totalSessions
 * @property {number} usedSessions
 * @property {number} price
 * @property {string} patientId
 * @property {string} [validUntil]
 * @property {'Active'|'Completed'|'Expired'} status
 */

/**
 * @typedef {Object} Therapist
 * @property {string} id             - "THR-001"
 * @property {string} name
 * @property {string} specialization
 * @property {boolean} available
 */

/**
 * @typedef {Object} StaffUser
 * @property {string} id
 * @property {string} name
 * @property {'Receptionist'|'Manager'|'Admin'} role
 * @property {string} staffId        - "DRP-R-0042"
 * @property {string} [email]
 * @property {string} [mobile]
 */
