import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createMockJWT,
  decodeMockJWT,
  isTokenExpired,
  MOCK_USERS,
} from '../utils/authUtils';

const STORAGE_KEY_TOKEN = '@drpauls_jwt_token';
const STORAGE_KEY_USER = '@drpauls_user_profile';

const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  refreshTokenStr: null,
  expiresAt: null,
  isAuthenticated: false,
  isCheckingAuth: true,
  registeredUsers: [...MOCK_USERS],

  /**
   * Strictly verifies token existence in persistent AsyncStorage on app startup.
   * If token is valid -> grants direct entry to Home Page.
   * If token was deleted on logout or expired -> routes user to AuthScreen (Sign In).
   */
  checkAndVerifyAuth: async () => {
    try {
      set({ isCheckingAuth: true });
      const savedToken = await AsyncStorage.getItem(STORAGE_KEY_TOKEN);
      const savedUserStr = await AsyncStorage.getItem(STORAGE_KEY_USER);

      if (!savedToken || !savedUserStr) {
        set({
          user: null,
          token: null,
          refreshTokenStr: null,
          expiresAt: null,
          isAuthenticated: false,
          isCheckingAuth: false,
        });
        return false;
      }

      const savedUser = JSON.parse(savedUserStr);

      // Check 24-hour token expiration
      if (isTokenExpired(savedToken)) {
        // Issue fresh token for valid user session
        const refreshedToken = await get().refreshAuthTokenForUser(savedUser);
        if (!refreshedToken) {
          await get().logout();
          return false;
        }
        set({ isCheckingAuth: false });
        return true;
      }

      set({
        user: savedUser,
        token: savedToken,
        isAuthenticated: true,
        isCheckingAuth: false,
      });
      return true;
    } catch {
      set({
        user: null,
        token: null,
        refreshTokenStr: null,
        expiresAt: null,
        isAuthenticated: false,
        isCheckingAuth: false,
      });
      return false;
    }
  },

  /**
   * Authenticates user with email & password, saving JWT token permanently to AsyncStorage
   */
  login: async (email, password) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const foundUser = get().registeredUsers.find(
      (u) => u.email.toLowerCase() === cleanEmail && u.password === password
    );

    if (!foundUser) {
      return {
        success: false,
        message: 'Invalid email address or password. Please try again.',
      };
    }

    const { password: _, ...userObj } = foundUser;
    const jwtData = createMockJWT({
      userId: userObj.id,
      staffId: userObj.staffId,
      email: userObj.email,
      name: userObj.name,
      role: userObj.role,
    });

    // Save token permanently to device disk storage
    await AsyncStorage.setItem(STORAGE_KEY_TOKEN, jwtData.token);
    await AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(userObj));

    set({
      user: userObj,
      token: jwtData.token,
      refreshTokenStr: jwtData.refreshToken,
      expiresAt: jwtData.expiresAt,
      isAuthenticated: true,
      isCheckingAuth: false,
    });

    return { success: true, user: userObj, token: jwtData.token };
  },

  /**
   * Registers new staff user & saves 24h JWT token to AsyncStorage
   */
  register: async ({ name, email, phone, role, password }) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const existing = get().registeredUsers.find(
      (u) => u.email.toLowerCase() === cleanEmail
    );

    if (existing) {
      return {
        success: false,
        message: 'An account with this email address already exists.',
      };
    }

    const newStaffId = `REC-2026-0${get().registeredUsers.length + 1}`;
    const newUser = {
      id: `USR-00${get().registeredUsers.length + 1}`,
      staffId: newStaffId,
      name: name.trim(),
      email: cleanEmail,
      phone: phone.trim(),
      role: role || 'Receptionist',
      password,
    };

    const updatedUsers = [...get().registeredUsers, newUser];
    const { password: _, ...userObj } = newUser;
    const jwtData = createMockJWT({
      userId: userObj.id,
      staffId: userObj.staffId,
      email: userObj.email,
      name: userObj.name,
      role: userObj.role,
    });

    await AsyncStorage.setItem(STORAGE_KEY_TOKEN, jwtData.token);
    await AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(userObj));

    set({
      registeredUsers: updatedUsers,
      user: userObj,
      token: jwtData.token,
      refreshTokenStr: jwtData.refreshToken,
      expiresAt: jwtData.expiresAt,
      isAuthenticated: true,
      isCheckingAuth: false,
    });

    return { success: true, user: userObj, token: jwtData.token };
  },

  /**
   * Refreshes JWT token for saved user & updates AsyncStorage
   */
  refreshAuthTokenForUser: async (userObj) => {
    if (!userObj) return null;

    const jwtData = createMockJWT({
      userId: userObj.id,
      staffId: userObj.staffId,
      email: userObj.email,
      name: userObj.name,
      role: userObj.role,
    });

    await AsyncStorage.setItem(STORAGE_KEY_TOKEN, jwtData.token);
    await AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(userObj));

    set({
      user: userObj,
      token: jwtData.token,
      refreshTokenStr: jwtData.refreshToken,
      expiresAt: jwtData.expiresAt,
      isAuthenticated: true,
    });

    return jwtData.token;
  },

  /**
   * Completely DELETES the token & user profile from AsyncStorage on Sign Out
   */
  logout: async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY_TOKEN);
      await AsyncStorage.removeItem(STORAGE_KEY_USER);
    } catch {
      // ignore storage clear error
    }

    set({
      user: null,
      token: null,
      refreshTokenStr: null,
      expiresAt: null,
      isAuthenticated: false,
      isCheckingAuth: false,
    });
  },
}));

// Strictly run persistent AsyncStorage token check on store startup
useAuthStore.getState().checkAndVerifyAuth();

export default useAuthStore;
