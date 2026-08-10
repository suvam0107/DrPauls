import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useTheme } from '../theme/ThemeContext';
import useUIStore from '../store/useUIStore';
import useCenterStore from '../store/useCenterStore';
import useAuthStore from '../store/useAuthStore';
import LogoutConfirmationModal from '../components/shared/LogoutConfirmationModal';
import { playClickSound } from '../utils/feedback';
import { copyToClipboard } from '../utils/clipboardUtils';

import { formatCenterText, shareDetails } from '../utils/shareUtils';

import { useCentersQuery } from '../hooks/queries/useCentersQuery';
import { useStaffQuery } from '../hooks/queries/useStaffQuery';

export default function SettingsScreen() {
  const { colors, isDark } = useTheme();
  const themeMode = useUIStore((s) => s.themeMode);
  const setThemeMode = useUIStore((s) => s.setThemeMode);
  const activeCenterId = useUIStore((s) => s.activeCenterId);

  const { data: centers = [] } = useCentersQuery();
  const { data: staff } = useStaffQuery();
  const currentCenter = centers.find((c) => c.id === activeCenterId) || centers[0];

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleConfirmLogout = async () => {
    setShowLogoutModal(false);
    await logout();
    Toast.show({
      type: 'info',
      text1: 'Signed Out Successfully',
      text2: 'Session token deleted from device',
      position: 'bottom',
      bottomOffset: 40,
    });
  };

  const displayName = user?.name || 'Anita Roy';
  const displayRole = user?.role || 'Receptionist';
  const displayStaffId = user?.staffId || 'REC-2026-04';
  const displayEmail = user?.email || 'anita.reception@drpauls.com';
  const displayPhone = user?.phone || '9812345678';

  const formattedCenterInfo = currentCenter ? formatCenterText(currentCenter) : '';

  const handleCopyCenterDetails = () => {
    if (!formattedCenterInfo) return;
    copyToClipboard(formattedCenterInfo, 'Center Details');
  };

  const handleShareCenterDetails = () => {
    if (!formattedCenterInfo) return;
    shareDetails('Center Details', formattedCenterInfo);
  };

  return (
    <>
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
        <Text style={[styles.pageTitle, { color: colors.text }]}>Settings & Profile</Text>

        {/* Staff Profile Card with Mobile & Receptionist ID */}
        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>{displayName.charAt(0)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.staffName, { color: colors.text }]}>{displayName}</Text>
            <Text style={[styles.staffRole, { color: colors.primary }]}>
              {displayRole} • ID: {displayStaffId}
            </Text>

            <TouchableOpacity
              onLongPress={() => copyToClipboard(displayEmail, 'Staff Email')}
              activeOpacity={0.7}
            >
              <Text style={[styles.profileMeta, { color: colors.textMuted }]}>{displayEmail}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.phoneBadgeRow}
              onLongPress={() => copyToClipboard(`+91 ${displayPhone}`, 'Staff Phone')}
              activeOpacity={0.7}
            >
              <Ionicons name="call-outline" size={13} color={colors.textMuted} />
              <Text style={[styles.phoneBadgeText, { color: colors.textMuted }]}>+91 {displayPhone}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* App Preferences */}
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>App Preferences</Text>
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingTextGroup}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Dark Mode</Text>
              <Text style={[styles.settingSub, { color: colors.textMuted }]}>
                {isDark ? 'Dark theme active' : 'Light theme active'}
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={(val) => {
                playClickSound();
                setThemeMode(val ? 'dark' : 'light');
              }}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={isDark ? '#FFFFFF' : '#F4F3F4'}
            />
          </View>
        </View>

        {/* Clinic Details (Current Center) */}
        {currentCenter && (
          <>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted, marginBottom: 0 }]}>
                Center Details
              </Text>

              {/* Plain Copy & Share Icons side-by-side */}
              <View style={styles.iconRow}>
                <TouchableOpacity
                  onPress={handleCopyCenterDetails}
                  activeOpacity={0.7}
                  hitSlop={6}
                >
                  <Ionicons name="copy-outline" size={18} color={colors.primary} />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleShareCenterDetails}
                  activeOpacity={0.7}
                  hitSlop={6}
                >
                  <Ionicons name="share-social-outline" size={18} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>

              <TouchableOpacity
                style={styles.infoRow}
                onLongPress={() => copyToClipboard(currentCenter.cc_name, 'Center Name')}
                activeOpacity={0.7}
              >
                <Ionicons name="business-outline" size={18} color={colors.primary} />
                <Text style={[styles.infoTitleText, { color: colors.text }]}>
                  {currentCenter.cc_name} {currentCenter.isMain ? '(Main Center)' : ''}
                </Text>
              </TouchableOpacity>

              {currentCenter.comp_name && (
                <TouchableOpacity
                  style={styles.infoRow}
                  onLongPress={() => copyToClipboard(currentCenter.comp_name || '', 'Company Name')}
                  activeOpacity={0.7}
                >
                  <Ionicons name="briefcase-outline" size={18} color={colors.primary} />
                  <Text style={[styles.infoText, { color: colors.text }]}>
                    {currentCenter.comp_name}
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.infoRow}
                onLongPress={() =>
                  copyToClipboard(
                    `${currentCenter.bill_address}, ${currentCenter.bill_state} - ${currentCenter.bill_pin}`,
                    'Center Address'
                  )
                }
                activeOpacity={0.7}
              >
                <Ionicons name="location-outline" size={18} color={colors.primary} />
                <Text style={[styles.infoText, { color: colors.text }]}>
                  {currentCenter.bill_address}, {currentCenter.bill_state} - {currentCenter.bill_pin}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.infoRow}
                onLongPress={() =>
                  copyToClipboard(
                    `+91 ${currentCenter.phone}`,
                    'Center Contact'
                  )
                }
                activeOpacity={0.7}
              >
                <Ionicons name="call-outline" size={18} color={colors.primary} />
                <Text style={[styles.infoText, { color: colors.text }]}>
                  +91 {currentCenter.phone}
                </Text>
              </TouchableOpacity>

              {currentCenter.email && (
                <TouchableOpacity
                  style={styles.infoRow}
                  onLongPress={() =>
                    copyToClipboard(
                      `${currentCenter.email}`,
                      'Center Email'
                    )
                  }
                  activeOpacity={0.7}
                >
                  <Ionicons name="mail-outline" size={18} color={colors.primary} />
                  <Text style={[styles.infoText, { color: colors.text }]}>
                    {currentCenter.email}
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.infoRow}
                onLongPress={() =>
                  copyToClipboard(
                    `Hours: ${currentCenter.openHours.start} - ${currentCenter.openHours.end} (${currentCenter.openDays.join(', ')})`,
                    'Operating Hours'
                  )
                }
                activeOpacity={0.7}
              >
                <Ionicons name="time-outline" size={18} color={colors.primary} />
                <Text style={[styles.infoText, { color: colors.text }]}>
                  Open: {currentCenter.openHours.start} - {currentCenter.openHours.end}{`\n`}({currentCenter.openDays.join(', ')})
                  {currentCenter.closedDays && currentCenter.closedDays.length > 0
                    ? `\nClosed: ${currentCenter.closedDays.join(', ')}`
                    : ''}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Sign Out Button */}
        <TouchableOpacity
          style={[styles.logoutBtn, { backgroundColor: colors.primary }]}
          onPress={() => setShowLogoutModal(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
          <Text style={[styles.logoutBtnText, { color: '#FFFFFF' }]}>Sign Out of Account</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Theme-Aligned Sign Out Confirmation Modal */}
      <LogoutConfirmationModal
        visible={showLogoutModal}
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  pageTitle: { fontSize: 22, fontWeight: '700', marginBottom: 16 },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 16,
    marginBottom: 20,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#FFF', fontSize: 22, fontWeight: '700' },
  staffName: { fontSize: 17, fontWeight: '700' },
  staffRole: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  profileMeta: { fontSize: 12, marginTop: 2 },
  phoneBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  phoneBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4
  },
  sectionCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 20,
    gap: 14,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingTextGroup: { flex: 1 },
  settingTitle: { fontSize: 15, fontWeight: '600' },
  settingSub: { fontSize: 12, marginTop: 2 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  infoTitleText: { fontSize: 14, fontWeight: '700', flex: 1 },
  infoText: { fontSize: 13, flex: 1, lineHeight: 18 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
    marginBottom: 12,
  },
  logoutBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
