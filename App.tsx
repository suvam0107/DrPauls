import React, { useState, useEffect } from 'react';
import { StyleSheet, View, BackHandler } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AppToast from './src/components/shared/AppToast';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import Header from './src/components/Header';
import BottomNav from './src/components/BottomNav';
import SidebarContainer from './src/components/SidebarContainer';
import SidebarDrawer from './src/components/SidebarDrawer';

import HomeScreen from './src/screens/HomeScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import PatientListScreen from './src/screens/PatientListScreen';
import DoctorScreen from './src/screens/DoctorScreen';
import AppointmentsScreen from './src/screens/AppointmentsScreen';
import PatientRecordsScreen from './src/screens/PatientRecordsScreen';
import AvailablePackagesScreen from './src/screens/AvailablePackagesScreen';
import PatientEnrollmentsScreen from './src/screens/PatientEnrollmentsScreen';
import ReportsScreen from './src/screens/ReportsScreen';
import AuthScreen from './src/screens/AuthScreen';
import CreateAppointmentSheet from './src/components/appointment/CreateAppointmentSheet';
import AddPatientSheet from './src/components/appointment/AddPatientSheet';
import AddDoctorSheet from './src/components/doctor/AddDoctorSheet';
import CenterSwitchSheet from './src/components/shared/CenterSwitchSheet';
import QuickAddPopup from './src/components/shared/QuickAddPopup';
import ExitConfirmationModal from './src/components/shared/ExitConfirmationModal';

import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './src/api/queryClient';
import { setAudioModeAsync } from 'expo-audio';
import useUIStore from './src/store/useUIStore';
import useAuthStore from './src/store/useAuthStore';
import { playNavigationSound } from './src/utils/feedback';

function MainApp() {
  const { colors, isDark } = useTheme();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const checkAndVerifyAuth = useAuthStore((s) => s.checkAndVerifyAuth);
  const setNavVisible = useUIStore((s) => s.setNavVisible);

  const [activeTab, setActiveTab] = useState('home');
  const [currentScreen, setCurrentScreen] = useState('home');
  const [screenHistory, setScreenHistory] = useState<string[]>(['home']);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activePatientIdForRecords, setActivePatientIdForRecords] = useState<string | undefined>(undefined);

  // Modal visibilities
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
  const [showCenterSwitchModal, setShowCenterSwitchModal] = useState(false);
  const [showQuickAddPopup, setShowQuickAddPopup] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  useEffect(() => {
    checkAndVerifyAuth();
  }, []);

  // Standard Android Hardware Back Handler
  useEffect(() => {
    const backAction = () => {
      if (drawerOpen) {
        setDrawerOpen(false);
        return true;
      }
      if (showQuickAddPopup) {
        setShowQuickAddPopup(false);
        return true;
      }
      if (showCenterSwitchModal) {
        setShowCenterSwitchModal(false);
        return true;
      }
      if (showCreateModal) {
        setShowCreateModal(false);
        return true;
      }
      if (showAddPatientModal) {
        setShowAddPatientModal(false);
        return true;
      }
      if (showAddDoctorModal) {
        setShowAddDoctorModal(false);
        return true;
      }
      if (showExitModal) {
        setShowExitModal(false);
        return true;
      }
      if (screenHistory.length > 1) {
        playNavigationSound();
        setScreenHistory((prev) => {
          const updated = [...prev];
          updated.pop();
          const prevScreen = updated[updated.length - 1];
          setCurrentScreen(prevScreen);
          if (['home', 'calendar', 'patients', 'appointments'].includes(prevScreen)) {
            setActiveTab(prevScreen);
          }
          return updated;
        });
        setNavVisible(true);
        return true;
      }
      setShowExitModal(true);
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [
    drawerOpen,
    showQuickAddPopup,
    showCenterSwitchModal,
    showCreateModal,
    showAddPatientModal,
    showAddDoctorModal,
    showExitModal,
    screenHistory,
    setNavVisible,
  ]);

  const [appointmentsFilterParams, setAppointmentsFilterParams] = useState<{ statusFilter?: string } | null>(null);

  // Navigate & push to navigation history stack
  const handleNavigate = (screen: string, params?: { patientId?: string; statusFilter?: string }) => {
    if (params?.patientId) {
      setActivePatientIdForRecords(params.patientId);
    }
    if (params?.statusFilter) {
      setAppointmentsFilterParams({ statusFilter: params.statusFilter });
    }
    if (screen === currentScreen && !params?.patientId && !params?.statusFilter) return;
    setScreenHistory((prev) => [...prev, screen]);
    setCurrentScreen(screen);
    if (['home', 'calendar', 'patients', 'appointments'].includes(screen)) {
      setActiveTab(screen);
    }
    setNavVisible(true);
  };

  const handleTabSelect = (tab: string) => {
    if (tab === 'quickAdd') {
      setShowQuickAddPopup(true);
      return;
    }
    setActiveTab(tab);
    handleNavigate(tab);
  };

  if (!isAuthenticated) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <AuthScreen />
        <AppToast />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Top App Header with safe area inset & center toggle */}
      <Header
        onMenuPress={() => setDrawerOpen(true)}
        onProfilePress={() => handleNavigate('settings')}
        onCenterPress={() => setShowCenterSwitchModal(true)}
      />

      {/* Main Screen Content */}
      <View style={[styles.screenContainer, { backgroundColor: colors.background }]}>
        {currentScreen === 'home' && <HomeScreen onNavigate={handleNavigate} />}
        {currentScreen === 'calendar' && <CalendarScreen />}
        {(currentScreen === 'appointments' || currentScreen === 'past-appointments') && (
          <AppointmentsScreen initialStatusFilter={appointmentsFilterParams?.statusFilter as any} />
        )}
        {currentScreen === 'patients' && <PatientListScreen onNavigate={handleNavigate} />}
        {currentScreen === 'patient-records' && (
          <PatientRecordsScreen
            patientId={activePatientIdForRecords}
            onBack={() => handleNavigate('patients')}
          />
        )}
        {currentScreen === 'doctors' && <DoctorScreen />}
        {(currentScreen === 'packages' || currentScreen === 'available-packages') && (
          <AvailablePackagesScreen />
        )}
        {currentScreen === 'patient-enrollments' && <PatientEnrollmentsScreen />}
        {currentScreen === 'reports' && <ReportsScreen />}
        {currentScreen === 'settings' && <SettingsScreen />}
      </View>

      {/* Bottom Nav Bar — hidden on settings screen */}
      {currentScreen !== 'settings' && (
        <BottomNav
          activeTab={activeTab}
          onTabSelect={handleTabSelect}
          onPlusPress={() => setShowQuickAddPopup((prev) => !prev)}
          isQuickAddOpen={showQuickAddPopup}
        />
      )}

      {/* Quick Add Floating Popup (above bottom nav) */}
      <QuickAddPopup
        visible={showQuickAddPopup}
        onClose={() => setShowQuickAddPopup(false)}
        onNewAppointment={() => setShowCreateModal(true)}
        onNewPatient={() => setShowAddPatientModal(true)}
        onNewDoctor={() => setShowAddDoctorModal(true)}
      />

      {/* Center Switch Bottom Sheet */}
      <CenterSwitchSheet
        visible={showCenterSwitchModal}
        onClose={() => setShowCenterSwitchModal(false)}
      />

      {/* Sidebar Drawer Container */}
      <SidebarContainer
        open={drawerOpen}
        onOpen={() => setDrawerOpen(true)}
        onClose={() => setDrawerOpen(false)}
        edgeSwipeEnabled={true}
      >
        <SidebarDrawer
          onClose={() => setDrawerOpen(false)}
          onNavigate={handleNavigate}
          currentScreen={currentScreen}
        />
      </SidebarContainer>

      {/* Create Appointment Modal */}
      <CreateAppointmentSheet
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      {/* Quick Add Patient Modal */}
      <AddPatientSheet
        visible={showAddPatientModal}
        onClose={() => setShowAddPatientModal(false)}
      />

      {/* Quick Add Doctor Modal */}
      <AddDoctorSheet
        visible={showAddDoctorModal}
        onClose={() => setShowAddDoctorModal(false)}
      />

      {/* Theme-Aligned Exit App Confirmation Modal */}
      <ExitConfirmationModal
        visible={showExitModal}
        onCancel={() => setShowExitModal(false)}
        onConfirm={() => BackHandler.exitApp()}
      />

      {/* Global Toast Component */}
      <AppToast />
    </View>
  );
}

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';

export default function App() {
  // Allow Expo audio playback to mix with other media and behave like standard system sound
  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'mixWithOthers',
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <KeyboardProvider>
            <ThemeProvider>
              <MainApp />
            </ThemeProvider>
          </KeyboardProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
  },
});
