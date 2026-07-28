/**
 * Mock JWT Token Service & Auth Utilities (@DataEngineer)
 * Simulates real-world JWT token generation, parsing, validation, and 1-day expiration refresh logic.
 */

// Base64 helper for Mock JWT tokens
const base64UrlEncode = (str) => {
  try {
    return btoa(unescape(encodeURIComponent(str)))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  } catch {
    // Basic fallback encoding
    return String(str)
      .split('')
      .map((c) => c.charCodeAt(0).toString(16))
      .join('');
  }
};

const base64UrlDecode = (str) => {
  try {
    return decodeURIComponent(
      escape(
        atob(str.replace(/-/g, '+').replace(/_/g, '/'))
      )
    );
  } catch {
    return str;
  }
};

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Generates a mock JWT token string: header.payload.signature
 * @param {object} userPayload
 * @returns {{ token: string, refreshToken: string, expiresAt: number }}
 */
export const createMockJWT = (userPayload) => {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Date.now();
  const expiresAt = now + ONE_DAY_MS;

  const payload = {
    ...userPayload,
    iat: Math.floor(now / 1000),
    exp: Math.floor(expiresAt / 1000),
    iss: 'drpauls-clinic-auth-service',
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = base64UrlEncode(`mock_sig_${userPayload.email}_${now}`);

  const token = `${encodedHeader}.${encodedPayload}.${signature}`;
  const refreshToken = `ref_${base64UrlEncode(userPayload.email)}_${now + 7 * ONE_DAY_MS}`;

  return { token, refreshToken, expiresAt };
};

/**
 * Decodes and parses a mock JWT token
 * @param {string} token
 * @returns {object|null}
 */
export const decodeMockJWT = (token) => {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  try {
    const payloadJson = base64UrlDecode(parts[1]);
    return JSON.parse(payloadJson);
  } catch {
    return null;
  }
};

/**
 * Checks if a token is expired
 * @param {string} token
 * @returns {boolean}
 */
export const isTokenExpired = (token) => {
  const decoded = decodeMockJWT(token);
  if (!decoded || !decoded.exp) return true;
  const nowInSec = Math.floor(Date.now() / 1000);
  return decoded.exp <= nowInSec;
};

/** Pre-seeded mock user database with staffId numbers */
export const MOCK_USERS = [
  {
    id: 'USR-003',
    staffId: 'REC-2026-04',
    name: 'Anita Roy',
    email: 'anita.reception@drpauls.com',
    password: 'reception123',
    phone: '9812345678',
    role: 'Receptionist',
  },
  {
    id: 'USR-001',
    staffId: 'DOC-2026-01',
    name: 'Dr. Sarah Paul',
    email: 'sarah.paul@drpauls.com',
    password: 'password123',
    phone: '9876543210',
    role: 'Doctor',
  },
  {
    id: 'USR-002',
    staffId: 'ADM-2026-01',
    name: 'Clinic Admin',
    email: 'admin@drpauls.com',
    password: 'adminpassword',
    phone: '9800011122',
    role: 'Admin',
  },
];
