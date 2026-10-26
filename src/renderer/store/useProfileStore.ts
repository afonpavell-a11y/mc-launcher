import { create } from 'zustand';
import type { Profile } from '../../shared/types';

interface ProfileState {
  profiles: Profile[];
  activeId: string | null;
  load: () => Promise<void>;
  setActive: (id: string) => void;
  addOffline: (name: string) => Promise<boolean>;
  updateProfile: (id: string, patch: Partial<Profile>) => Promise<void>;
  deleteProfile: (id: string) => Promise<void>; // <-- новое
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profiles: [],
  activeId: null,
  load: async () => {
    const res = await window.launcher.getProfiles();
    if (res.ok && res.data) {
      const savedActiveId = get().activeId;
      const exists = res.data.some(p => p.id === savedActiveId);
      set({ 
        profiles: res.data, 
        activeId: exists ? savedActiveId : (res.data[0]?.id ?? null) 
      });
    }
  },
  setActive: (id) => set({ activeId: id }),
  addOffline: async (name) => {
    const res = await window.launcher.createOffline(name);
    if (res.ok && res.data) {
      const next = [...get().profiles, res.data];
      set({ profiles: next, activeId: res.data.id });
      await window.launcher.saveProfiles(next);
      return true;
    }
    return false;
  },
  updateProfile: async (id, patch) => {
    const next = get().profiles.map(p => p.id === id ? { ...p, ...patch } : p);
    set({ profiles: next });
    await window.launcher.saveProfiles(next);
  },
  deleteProfile: async (id) => {
    const next = get().profiles.filter(p => p.id !== id);
    set({ 
      profiles: next, 
      activeId: get().activeId === id ? (next[0]?.id ?? null) : get().activeId 
    });
    await window.launcher.saveProfiles(next);
  },
}));