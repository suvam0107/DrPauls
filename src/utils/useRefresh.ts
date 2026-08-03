import { useState, useCallback } from 'react';
import { RefreshControl } from 'react-native';
import useAppointmentStore from '../store/useAppointmentStore';
import usePatientStore from '../store/usePatientStore';
import useDoctorStore from '../store/useDoctorStore';
import useCenterStore from '../store/useCenterStore';
import usePackageStore from '../store/usePackageStore';
import { playClickSound } from './feedback';

export function useRefresh(onCustomRefresh?: () => Promise<void> | void) {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    playClickSound();

    try {
      if (onCustomRefresh) {
        await onCustomRefresh();
      }
      await Promise.all([
        useAppointmentStore.getState().fetchAppointments(),
        usePatientStore.getState().fetchPatients(),
        useDoctorStore.getState().fetchDoctorsAndTherapists(),
        useCenterStore.getState().fetchCenters(),
        usePackageStore.getState().fetchPackages(),
      ]);
    } catch (e) {
      console.warn('Refresh error:', e);
    } finally {
      setTimeout(() => {
        setRefreshing(false);
      }, 500);
    }
  }, [onCustomRefresh]);

  return { refreshing, onRefresh };
}
