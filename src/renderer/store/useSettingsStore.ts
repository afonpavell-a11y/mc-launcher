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
    theme: 'system',
    ramMinMb: 1024,
    ramMaxMb: 4096,
    closeLauncherOnGameStart: false,
    showSnapshots: false,
    backgroundOpacity: 0.2,
    accentColor: '#2563eb',
    uiScale: 1,
    uiBlur: 16,
    uiRadius: 16,
    panelOpacity: 100,
    uiGlow: 0,
    showStars: true,
    starCount: 50,
    language: 'ru',
    enableSounds: true,
    enableMusic: true, // <-- ДОБАВЛЕНО
  },
  loading: true,
  load: async () => {
    const res = await (window as any).launcher.getSettings();
    if (res.ok && res.data) {
      // Сливаем с дефолтными настройками на случай, если каких-то полей нет в сохраненном файле
      set({ settings: { ...get().settings, ...res.data }, loading: false });
    } else {
      set({ loading: false });
    }
  },
  update: async (patch) => {
    const next = { ...get().settings, ...patch };
    set({ settings: next });
    await (window as any).launcher.saveSettings(next);
  },
}));