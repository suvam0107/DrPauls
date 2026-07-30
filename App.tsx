import React, { useState, useEffect } from 'react';
import { StyleSheet, View, BackHandler } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AppToast from './src/components/shared/AppToast';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import Header from './src/components/Header';
import BottomNav from './src/components/BottomNav';
import SidebarDrawer from './src/components/SidebarDrawer';

import HomeScreen from './src/screens/HomeScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import PatientListScreen from './src/screens/PatientListScreen';
import DoctorScreen from './src/screens/DoctorScreen';
import ReportsScreen from './src/screens/ReportsScreen';
import AuthScreen from './src/screens/AuthScreen';
import CreateAppointmentSheet from './src/components/appointment/CreateAppointmentSheet';
import AddPatientSheet from './src/components/appointment/AddPatientSheet';
import CenterSwitchSheet from './src/components/shared/CenterSwitchSheet';
import QuickAddPopup from './src/components/shared/QuickAddPopup';
import ExitConfirmationModal from './src/components/shared/ExitConfirmationModal';

import useUIStore from './src/store/useUIStore';
import useAuthStore from './src/store/useAuthStore';
import useCenterStore from './src/store/useCenterStore';
import { playNavigationSound, playClickSound } from './src/utils/feedback';

function MainApp() {
  const { colors, isDark } = useTheme();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const checkAndVerifyAuth = useAuthStore((s) => s.checkAndVerifyAuth);
  const fetchCenters = useCenterStore((s) => s.fetchCenters);

  const [activeTab, setActiveTab] = useState('home');
  const [currentScreen, setCurrentScreen] = useState('home');
  const [screenHistory, setScreenHistory] = useState<string[]>(['home']);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Modal visibilities
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [showCenterSwitchModal, setShowCenterSwitchModal] = useState(false);
  const [showQuickAddPopup, setShowQuickAddPopup] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  const setThemeMode = useUIStore((s) => s.setThemeMode);

  useEffect(() => {
    checkAndVerifyAuth();
    fetchCenters();
  }, []);

  // Navigate & push to navigation history stack
  const handleNavigate = (screen: string) => {
    if (screen === currentScreen) return;
    setScreenHistory((prev) => [...prev, screen]);
    setCurrentScreen(screen);
    if (screen === 'home' || screen === 'settings') {
      setActiveTab(screen);
    }
  };

  const handleTabSelect = (tab: string) => {
    if (tab === 'quickAdd') {
      setShowQuickAddPopup(true);
      return;
    }
    setActiveTab(tab);
    if (tab === 'home') handleNavigate('home');
    else if (tab === 'settings') handleNavigate('settings');
  };

  // Android hardware back button & back gesture handler
  useEffect(() => {
    const onBackPress = () => {
      if (showExitModal) {
        playClickSound();
        setShowExitModal(false);
        return true;
      }
      if (showCenterSwitchModal) {
        playClickSound();
        setShowCenterSwitchModal(false);
        return true;
      }
      if (showQuickAddPopup) {
        playClickSound();
        setShowQuickAddPopup(false);
        return true;
      }
      if (showAddPatientModal) {
        playClickSound();
        setShowAddPatientModal(false);
        return true;
      }
      if (showCreateModal) {
        playClickSound();
        setShowCreateModal(false);
        return true;
      }
      if (drawerOpen) {
        playClickSound();
        setDrawerOpen(false);
        return true;
      }

      if (screenHistory.length > 1) {
        playNavigationSound();
        const updatedHistory = [...screenHistory];
        updatedHistory.pop();
        const prevScreen = updatedHistory[updatedHistory.length - 1];
        setScreenHistory(updatedHistory);
        setCurrentScreen(prevScreen);
        if (prevScreen === 'home' || prevScreen === 'settings') {
          setActiveTab(prevScreen);
        }
        return true;
      }

      setShowExitModal(true);
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backHandler.remove();
  }, [
    showExitModal,
    showCenterSwitchModal,
    showQuickAddPopup,
    showAddPatientModal,
    showCreateModal,
    drawerOpen,
    screenHistory,
    currentScreen,
  ]);

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
        onThemeToggle={() => setThemeMode(isDark ? 'light' : 'dark')}
        onCenterPress={() => setShowCenterSwitchModal(true)}
      />

      {/* Main Screen Content */}
      <View style={[styles.screenContainer, { backgroundColor: colors.background }]}>
        {currentScreen === 'home' && <HomeScreen onNavigate={handleNavigate} />}
        {currentScreen === 'calendar' && <CalendarScreen />}
        {currentScreen === 'patients' && <PatientListScreen />}
        {currentScreen === 'doctors' && <DoctorScreen />}
        {currentScreen === 'reports' && <ReportsScreen />}
        {currentScreen === 'settings' && <SettingsScreen />}
      </View>

      {/* Bottom Nav Bar with safe area bottom inset */}
      <BottomNav
        activeTab={activeTab}
        onTabSelect={handleTabSelect}
        onPlusPress={() => setShowQuickAddPopup((prev) => !prev)}
      />

      {/* Quick Add Floating Popup (above bottom nav) */}
      <QuickAddPopup
        visible={showQuickAddPopup}
        onClose={() => setShowQuickAddPopup(false)}
        onNewAppointment={() => setShowCreateModal(true)}
        onNewPatient={() => setShowAddPatientModal(true)}
      />

      {/* Center Switch Bottom Sheet */}
      <CenterSwitchSheet
        visible={showCenterSwitchModal}
        onClose={() => setShowCenterSwitchModal(false)}
      />

      {/* Sidebar Drawer */}
      <SidebarDrawer
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onNavigate={handleNavigate}
      />

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

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <MainApp />
      </ThemeProvider>
    </SafeAreaProvider>
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
