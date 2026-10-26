import { create } from 'zustand';
import type { Settings } from '../../shared/types';

interface SettingsState {
  settings: Settings;
  loading: boolean;
  load: () => Promise<void>;
  update: (patch: Partial<Settings>) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: {
    theme: 'dark',
    themeColor: 'blue',
    language: 'ru',
    ramMinMb: 1024,
    ramMaxMb: 4096,
    closeLauncherOnGameStart: false,
    showSnapshots: false,
    backgroundImage: undefined,
    backgroundOpacity: 0.2,
    showStars: true,
    starCount: 50,
    accentColor: '#2563eb',
    enableSounds: true,
    particlesType: 'none',
    particlesCount: 50,
    particlesSpeed: 1,
    uiGlow: 0,
    uiBlur: 16,
    uiScale: 1,
    uiRadius: 16,
    panelOpacity: 100,
  },
  loading: true,
  load: async () => {
    const res = await window.launcher.getSettings();
    if (res.ok && res.data) set({ settings: res.data, loading: false });
    else set({ loading: false });
  },
  update: async (patch) => {
    const next = { ...get().settings, ...patch };
    set({ settings: next });
    await window.launcher.saveSettings(next);
  },
}));