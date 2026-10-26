import React from 'react';
import { Home, Search, Library, Settings as SettingsIcon, User, Plus, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSettingsStore } from '../store/useSettingsStore';
import { playClickSound } from '../lib/sound';
import { t } from '../lib/i18n';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenSettings: () => void;
  onCreateInstance: () => void;
}

export default function Sidebar({ activeTab, setActiveTab, onOpenSettings, onCreateInstance }: SidebarProps) {
  const { settings } = useSettingsStore();
  const lang = settings.language || 'ru';

  const items = [
    { id: 'home', icon: Home, label: t(lang, 'home') },
    { id: 'search', icon: Search, label: t(lang, 'search') },
    { id: 'library', icon: Library, label: t(lang, 'library') },
    { id: 'pet', icon: Sparkles, label: 'Питомец' }, // <-- новая вкладка
  ];

  return (
    <aside className="w-20 shrink-0 flex flex-col items-center py-6 gap-4 border-r border-white/5 bg-black/20 z-30">
      {items.map(item => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => {
              if (settings.enableSounds) playClickSound();
              setActiveTab(item.id);
            }}
            title={item.label}
            className={`relative p-3 rounded-xl transition-all ${isActive ? 'text-white' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
          >
            {isActive && (
              <motion.div
                layoutId="active-tab"
                className="absolute inset-0 rounded-xl"
                style={{ backgroundColor: settings.accentColor || '#2563eb' }}
              />
            )}
            <item.icon size={22} className="relative z-10" />
          </button>
        );
      })}

      <button
        onClick={() => {
          if (settings.enableSounds) playClickSound();
          onCreateInstance();
        }}
        title={t(lang, 'createInstance')}
        className="p-3 rounded-xl border-2 border-dashed border-gray-600 hover:border-blue-500 text-gray-500 hover:text-white"
      >
        <Plus size={22} />
      </button>

      <div className="mt-auto flex flex-col gap-4">
        <button
          onClick={() => {
            if (settings.enableSounds) playClickSound();
            setActiveTab('profiles');
          }}
          title={t(lang, 'profiles')}
          className={`relative p-3 rounded-xl transition-all ${activeTab === 'profiles' ? 'text-white' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
        >
          {activeTab === 'profiles' && (
            <motion.div
              layoutId="active-tab"
              className="absolute inset-0 rounded-xl"
              style={{ backgroundColor: settings.accentColor || '#2563eb' }}
            />
          )}
          <User size={22} className="relative z-10" />
        </button>
        <button
          onClick={() => {
            if (settings.enableSounds) playClickSound();
            onOpenSettings();
          }}
          title={t(lang, 'settings')}
          className="p-3 rounded-xl text-gray-500 hover:text-white hover:bg-white/5"
        >
          <SettingsIcon size={22} />
        </button>
      </div>
    </aside>
  );
}