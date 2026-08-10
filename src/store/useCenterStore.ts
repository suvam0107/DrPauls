import { create } from 'zustand';
import { centerService } from '../api/services/centerService';
import { dataStore } from '../api/dataStore';
import { Center } from '../types';

export interface CenterState {
  centers: Center[];
  getCenterById: (id: string) => Center | undefined;
}

const initialCenters = dataStore.getData().centers;

const useCenterStore = create<CenterState>((set, get) => ({
  centers: initialCenters,

  getCenterById: (id: string) => get().centers.find((c) => c.id === id),
}));

export default useCenterStore;
