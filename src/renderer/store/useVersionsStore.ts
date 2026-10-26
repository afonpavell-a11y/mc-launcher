import { create } from 'zustand';
import type { VersionSummary } from '../../shared/types';

interface VersionsState {
  versions: VersionSummary[];
  loading: boolean;
  selectedVersion: VersionSummary | null;
  selectedInstance: string | null;
  load: () => Promise<void>;
  setSelectedVersion: (v: VersionSummary) => void;
  setSelectedInstance: (id: string | null) => void;
}

export const useVersionsStore = create<VersionsState>((set) => ({
  versions: [],
  loading: true,
  selectedVersion: null,
  selectedInstance: null,
  load: async () => {
    const res = await window.launcher.getManifest();
    if (res.ok && res.data) {
      const releases = res.data.versions.filter((v: VersionSummary) => v.type === 'release');
      set({ versions: releases, loading: false });
    } else {
      set({ loading: false });
    }
  },
  setSelectedVersion: (v) => set({ selectedVersion: v }),
  setSelectedInstance: (id) => set({ selectedInstance: id }),
}));