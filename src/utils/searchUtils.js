/**
 * Regex patient search — matches name, patientId, or mobile.
 * @param {import('../data/schema').Patient[]} patients
 * @param {string} query
 * @returns {import('../data/schema').Patient[]}
 */
export const searchPatients = (patients, query) => {
  if (!query || query.trim().length < 1) return [];
  try {
    const re = new RegExp(query.trim(), 'i');
    return patients.filter(
      (p) => re.test(p.name) || re.test(p.id) || re.test(p.mobile)
    );
  } catch {
    // fallback to plain substring if regex is invalid
    const q = query.trim().toLowerCase();
    return patients.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.mobile.includes(q)
    );
  }
};

/** Generate next patient ID */
export const nextPatientId = (patients) => {
  const max = patients.reduce((m, p) => {
    const n = parseInt(p.id.replace('PAT-', ''), 10);
    return n > m ? n : m;
  }, 0);
  return `PAT-${String(max + 1).padStart(3, '0')}`;
};

/** Generate next appointment ID */
export const nextAppointmentId = (appointments) => {
  const max = appointments.reduce((m, a) => {
    const n = parseInt(a.id.replace('APT-', ''), 10);
    return n > m ? n : m;
  }, 0);
  return `APT-${String(max + 1).padStart(3, '0')}`;
};
