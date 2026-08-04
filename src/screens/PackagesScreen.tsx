import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
} from 'react-native';
import AppRefreshControl from '../components/shared/AppRefreshControl';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import usePackageStore from '../store/usePackageStore';
import useAppointmentStore from '../store/useAppointmentStore';
import { Package, PackageEnrollment } from '../types';
import CreateAppointmentSheet from '../components/appointment/CreateAppointmentSheet';
import PackageEnrollmentDetailSheet from '../components/package/PackageEnrollmentDetailSheet';
import StatusChip from '../components/shared/StatusChip';
import SessionProgressRing from '../components/package/SessionProgressRing';
import { playClickSound } from '../utils/feedback';
import { useRefresh } from '../utils/useRefresh';
import { formatDateShort, getNextSessionAppointment } from '../utils/dateUtils';

export default function PackagesScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { refreshing, onRefresh } = useRefresh();

  const packages = usePackageStore((s) => s.packages);
  const enrollments = usePackageStore((s) => s.enrollments);
  const appointments = useAppointmentStore((s) => s.appointments);

  const [activeTab, setActiveTab] = useState<'Catalog' | 'Enrollments'>('Catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedServiceFilter, setSelectedServiceFilter] = useState<string>('All');
  const [enrollmentStatusFilter, setEnrollmentStatusFilter] = useState<string>('All');

  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [showBookingSheet, setShowBookingSheet] = useState(false);
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<string | null>(null);

  const serviceCategories = ['All', 'Hair', 'Skin', 'Laser', 'Hair Transplant'];
  const enrollmentStatusCategories = ['All', 'Active', 'Paused', 'Completed'];

  const filteredPackages = packages.filter((pkg) => {
    const matchesService = selectedServiceFilter === 'All' || pkg.serviceType === selectedServiceFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pkg.serviceType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (pkg.description && pkg.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesService && matchesSearch;
  });

  const filteredEnrollments = enrollments.filter((e) => {
    const matchesStatus = enrollmentStatusFilter === 'All' || e.status === enrollmentStatusFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      e.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.packageName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.enrollmentId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View style={[styles.topHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.headerTitleRow}>
          <View>
            <Text style={[styles.screenTitle, { color: colors.text }]}>
              {activeTab === 'Catalog' ? 'Available Packages' : 'Patient Package Enrollments'}
            </Text>
            <Text style={[styles.screenSub, { color: colors.textMuted }]}>
              {activeTab === 'Catalog'
                ? 'Treatment Packs & Subscriptions Catalog'
                : 'Manage Patient Sessions, Progress & ERP Lifecycles'}
            </Text>
          </View>

          {/* Mode Switcher Pill */}
          <View style={[styles.modeTabGroup, { backgroundColor: colors.surface }]}>
            {(['Catalog', 'Enrollments'] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.modeTabBtn,
                  activeTab === tab && { backgroundColor: colors.primary },
                ]}
                onPress={() => {
                  playClickSound();
                  setActiveTab(tab);
                }}
              >
                <Text
                  style={[
                    styles.modeTabText,
                    { color: activeTab === tab ? '#FFF' : colors.textMuted },
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search" size={16} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={
              activeTab === 'Catalog'
                ? 'Search packages by name or service...'
                : 'Search enrollments by patient or package...'
            }
            placeholderTextColor={colors.textMuted}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filter Chips Row */}
        {activeTab === 'Catalog' ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {serviceCategories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.chip,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  selectedServiceFilter === cat && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
                onPress={() => {
                  playClickSound();
                  setSelectedServiceFilter(cat);
                }}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: selectedServiceFilter === cat ? '#FFF' : colors.text },
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {enrollmentStatusCategories.map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.chip,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  enrollmentStatusFilter === status && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
                onPress={() => {
                  playClickSound();
                  setEnrollmentStatusFilter(status);
                }}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: enrollmentStatusFilter === status ? '#FFF' : colors.text },
                  ]}
                >
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<AppRefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {activeTab === 'Catalog' ? (
          /* Catalog View */
          filteredPackages.map((pkg) => (
            <View key={pkg.id} style={[styles.pkgCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <View style={styles.tagRow}>
                    <View style={[styles.serviceTag, { backgroundColor: colors.primaryLight }]}>
                      <Text style={[styles.serviceTagText, { color: colors.primary }]}>{pkg.serviceType}</Text>
                    </View>
                  </View>
                  <Text style={[styles.pkgName, { color: colors.text }]}>{pkg.name}</Text>
                </View>
                <View style={styles.priceCol}>
                  <Text style={[styles.priceAmount, { color: colors.primary }]}>₹{pkg.price.toLocaleString()}</Text>
                  <Text style={[styles.pricePerSession, { color: colors.textMuted }]}>
                    ₹{pkg.perSessionPrice || Math.round(pkg.price / pkg.totalSessions)}/session
                  </Text>
                </View>
              </View>

              {pkg.description ? (
                <Text style={[styles.pkgDesc, { color: colors.textMuted }]}>{pkg.description}</Text>
              ) : null}

              {pkg.includedServices && pkg.includedServices.length > 0 ? (
                <View style={styles.servicesGrid}>
                  {pkg.includedServices.map((service, idx) => (
                    <View key={idx} style={[styles.serviceItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <Ionicons name="checkmark-circle" size={14} color={colors.success || '#059669'} />
                      <Text style={[styles.serviceItemText, { color: colors.text }]}>{service}</Text>
                    </View>
                  ))}
                </View>
              ) : null}

              <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
                <View style={styles.sessionInfo}>
                  <Ionicons name="layers-outline" size={16} color={colors.primary} />
                  <Text style={[styles.sessionText, { color: colors.text }]}>
                    <Text style={{ fontWeight: '700' }}>{pkg.totalSessions}</Text> Total Sessions
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.assignBtn, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    playClickSound();
                    setSelectedPackage(pkg);
                    setShowBookingSheet(true);
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="calendar-outline" size={15} color="#FFF" />
                  <Text style={styles.assignBtnText}>Assign / Book Pack</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          /* Enrollments List View */
          filteredEnrollments.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="layers-outline" size={40} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>No package enrollments found.</Text>
            </View>
          ) : (
            filteredEnrollments.map((e) => {
              const nextAppt = getNextSessionAppointment(e.sessionIds, appointments);

              return (
                <View key={e.enrollmentId} style={[styles.enrollmentCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.enrollmentHeader}>
                    <View style={{ flex: 1 }}>
                      <View style={styles.tagRow}>
                        <View style={[styles.serviceTag, { backgroundColor: colors.primaryLight }]}>
                          <Text style={[styles.serviceTagText, { color: colors.primary }]}>{e.serviceType}</Text>
                        </View>
                        <Text style={[styles.idBadge, { color: colors.textMuted }]}>{e.enrollmentId}</Text>
                      </View>
                      <Text style={[styles.pkgName, { color: colors.text }]}>{e.packageName}</Text>
                    </View>

                    <SessionProgressRing
                      total={e.totalSessions}
                      completed={e.completedSessions}
                      size={54}
                      strokeWidth={5}
                    />
                  </View>

                  <View style={[styles.enrollmentMeta, { borderTopColor: colors.border }]}>
                    <View style={styles.metaRow}>
                      <Ionicons name="person" size={14} color={colors.primary} />
                      <Text style={[styles.metaText, { color: colors.text }]}>
                        {e.patientName} ({e.patientMobile})
                      </Text>
                    </View>

                    <View style={styles.metaRow}>
                      <Ionicons name="medkit-outline" size={14} color={colors.textMuted} />
                      <Text style={[styles.metaText, { color: colors.textMuted }]}>
                        Doctor: {e.doctorName}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.enrollmentFooter, { borderTopColor: colors.border }]}>
                    <View style={styles.nextDateBox}>
                      <Ionicons name="time-outline" size={14} color={colors.primary} />
                      <Text style={[styles.nextDateText, { color: colors.text }]}>
                        {nextAppt
                          ? `Next: ${formatDateShort(nextAppt.date)} (${nextAppt.startTime})`
                          : 'All Sessions Finished'}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={[styles.detailsBtn, { backgroundColor: colors.primary }]}
                      onPress={() => {
                        playClickSound();
                        setSelectedEnrollmentId(e.enrollmentId);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.detailsBtnText}>View Timeline</Text>
                      <Ionicons name="chevron-forward" size={14} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )
        )}
      </ScrollView>

      {/* Booking Sheet */}
      <CreateAppointmentSheet
        visible={showBookingSheet}
        onClose={() => {
          setShowBookingSheet(false);
          setSelectedPackage(null);
        }}
      />

      {/* Detail Sheet */}
      <PackageEnrollmentDetailSheet
        visible={!!selectedEnrollmentId}
        enrollmentId={selectedEnrollmentId}
        onClose={() => setSelectedEnrollmentId(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 10,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  screenSub: {
    fontSize: 12,
    marginTop: 2,
  },
  modeTabGroup: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 2,
  },
  modeTabBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  modeTabText: {
    fontSize: 12,
    fontWeight: '700',
  },
  searchBox: {
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
  },
  filterScroll: {
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    padding: 16,
    gap: 14,
  },
  pkgCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  serviceTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  serviceTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  idBadge: {
    fontSize: 11,
    fontWeight: '600',
  },
  pkgName: {
    fontSize: 16,
    fontWeight: '700',
  },
  priceCol: {
    alignItems: 'flex-end',
  },
  priceAmount: {
    fontSize: 18,
    fontWeight: '800',
  },
  pricePerSession: {
    fontSize: 11,
    marginTop: 2,
  },
  pkgDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  serviceItemText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  sessionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sessionText: {
    fontSize: 13,
  },
  assignBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  assignBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  enrollmentCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  enrollmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  enrollmentMeta: {
    borderTopWidth: 1,
    paddingTop: 8,
    gap: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '600',
  },
  enrollmentFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 10,
  },
  nextDateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nextDateText: {
    fontSize: 12,
    fontWeight: '700',
  },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  detailsBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyBox: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
