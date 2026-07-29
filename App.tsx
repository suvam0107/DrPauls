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
import ExitConfirmationModal from './src/components/shared/ExitConfirmationModal';

import useUIStore from './src/store/useUIStore';
import useAuthStore from './src/store/useAuthStore';

function MainApp() {
  const { colors, isDark } = useTheme();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const checkAndVerifyAuth = useAuthStore((s) => s.checkAndVerifyAuth);

  const [activeTab, setActiveTab] = useState('home');
  const [currentScreen, setCurrentScreen] = useState('home');
  const [screenHistory, setScreenHistory] = useState<string[]>(['home']);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  const setThemeMode = useUIStore((s) => s.setThemeMode);

  // App Startup Token Verification Flow:
  // If valid token exists -> directs straight to Home Page without showing login page
  // If token is null/expired -> presents Login page
  useEffect(() => {
    checkAndVerifyAuth();
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
    setActiveTab(tab);
    if (tab === 'home') handleNavigate('home');
    else if (tab === 'settings') handleNavigate('settings');
    else if (tab === 'newAppt') setShowCreateModal(true);
  };

  // Android hardware back button & back gesture handler (router.back behavior)
  useEffect(() => {
    const onBackPress = () => {
      // 0. If exit confirmation modal is open -> dismiss modal
      if (showExitModal) {
        setShowExitModal(false);
        return true;
      }

      // 1. If create appointment modal is open -> close modal
      if (showCreateModal) {
        setShowCreateModal(false);
        return true;
      }

      // 2. If sidebar drawer is open -> close drawer
      if (drawerOpen) {
        setDrawerOpen(false);
        return true;
      }

      // 3. Router back: pop history stack
      if (screenHistory.length > 1) {
        const updatedHistory = [...screenHistory];
        updatedHistory.pop(); // Remove current screen
        const prevScreen = updatedHistory[updatedHistory.length - 1];
        setScreenHistory(updatedHistory);
        setCurrentScreen(prevScreen);
        if (prevScreen === 'home' || prevScreen === 'settings') {
          setActiveTab(prevScreen);
        }
        return true;
      }

      // 4. On Home screen -> show theme-aligned exit confirmation modal
      setShowExitModal(true);
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backHandler.remove();
  }, [showExitModal, showCreateModal, drawerOpen, screenHistory, currentScreen]);

  // If user is not authenticated or token was deleted -> present AuthScreen
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

      {/* Top App Header with safe area inset */}
      <Header
        onMenuPress={() => setDrawerOpen(true)}
        onThemeToggle={() => setThemeMode(isDark ? 'light' : 'dark')}
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
      <BottomNav activeTab={activeTab} onTabSelect={handleTabSelect} />

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
