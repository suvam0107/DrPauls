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
import SearchInput from '../components/shared/SearchInput';
import { useDebounce } from '../utils/useDebounce';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import usePackageStore from '../store/usePackageStore';
import { Package } from '../types';
import CreateAppointmentSheet from '../components/appointment/CreateAppointmentSheet';
import { playClickSound } from '../utils/feedback';
import { useRefresh } from '../utils/useRefresh';
import PackagesCatalogSkeleton from '../components/skeletons/PackagesCatalogSkeleton';

import { usePackagesQuery, usePackageSearchQuery } from '../hooks/queries/usePackagesQuery';
import { useScrollNavbar } from '../hooks/useScrollNavbar';

export default function AvailablePackagesScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { refreshing, onRefresh } = useRefresh();
  const { handleScroll } = useScrollNavbar();

  const { data: packages = [] } = usePackagesQuery();

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 200);
  const [selectedServiceFilter, setSelectedServiceFilter] = useState<string>('All');
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [showBookingSheet, setShowBookingSheet] = useState(false);

  const serviceCategories = ['All', 'Hair', 'Skin', 'Laser', 'Hair Transplant'];

  const isSearchActive = debouncedSearchQuery.trim().length >= 1;
  const { data: searchResults = [], isFetching: isSearchFetching } = usePackageSearchQuery(
    debouncedSearchQuery,
    selectedServiceFilter
  );

  const filteredPackages = isSearchActive
    ? searchResults
    : packages.filter((pkg) => {
        return selectedServiceFilter === 'All' || pkg.serviceType === selectedServiceFilter;
      });

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View style={[styles.topHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.headerTitleRow}>
          <View>
            <Text style={[styles.screenTitle, { color: colors.text }]}>
              Available Packages
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={{ marginBottom: 10 }}>
          <SearchInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search packages by name or service..."
            isFetching={isSearchFetching && isSearchActive}
          />
        </View>

        {/* Service Filter Chips Row */}
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
                  { color: colors.textMuted },
                  selectedServiceFilter === cat && { color: '#FFF', fontWeight: '700' },
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Package Cards Content */}
      {isSearchFetching && isSearchActive && searchResults.length === 0 ? (
        <PackagesCatalogSkeleton />
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<AppRefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {filteredPackages.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="gift-outline" size={40} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>No treatment packages found.</Text>
            </View>
          ) : (
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
          )}
        </ScrollView>
      )}

      {/* Booking Sheet */}
      <CreateAppointmentSheet
        visible={showBookingSheet}
        onClose={() => {
          setShowBookingSheet(false);
          setSelectedPackage(null);
        }}
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
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
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
    gap: 8,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  serviceItemText: {
    fontSize: 12,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    marginTop: 4,
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
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  assignBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
