import React, { useEffect, useState } from 'react';
import { Minus, Square, X, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './components/Sidebar';
import HomeScreen from './components/HomeScreen';
import SearchScreen from './components/SearchScreen';
import LibraryScreen from './components/LibraryScreen';
import ProfilesScreen from './components/ProfilesScreen';
import PetScreen from './components/PetScreen';
import SettingsModal from './components/SettingsModal';
import ConsolePanel from './components/ConsolePanel';
import SplashScreen from './components/SplashScreen';
import CreateInstanceModal from './components/CreateInstanceModal';
import ParticleEffect from './components/ParticleEffect';
import Toast from './components/Toast';
import ProgressOverlay from './components/ProgressOverlay';
import MusicPlayer from './components/MusicPlayer';
import AdminPanel from './components/AdminPanel';
import ChatWidget from './components/ChatWidget';
import { useSettingsStore } from './store/useSettingsStore';
import { useProfileStore } from './store/useProfileStore';

export default function App() {
  const { load: loadSettings, settings } = useSettingsStore();
  const { load: loadProfiles } = useProfileStore();
  
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [createInstanceOpen, setCreateInstanceOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [isLoading, setIsLoading] = useState(true);
  const [updateVersion, setUpdateVersion] = useState<string | null>(null);
  const [adminOpen, setAdminOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    loadSettings();
    loadProfiles();
  }, [loadSettings, loadProfiles]);

  useEffect(() => {
    const remove = (window as any).launcher.onUpdateAvailable?.((version: string) => {
      setUpdateVersion(version);
    });
    return () => remove?.();
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'light') root.classList.remove('dark');
    else root.classList.add('dark');
  }, [settings.theme]);

  useEffect(() => {
    const handler = (e: any) => setActiveTab(e.detail);
    window.addEventListener('switch-tab', handler);
    return () => window.removeEventListener('switch-tab', handler);
  }, []);

  return (
    <AnimatePresence>
      {isLoading ? (
        <SplashScreen key="splash" />
      ) : (
        <motion.div 
          key="app"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col h-screen w-screen bg-gray-100 dark:bg-[#0b0b0f] text-gray-800 dark:text-gray-200 overflow-hidden font-sans relative"
          style={{
            backgroundImage: settings.backgroundImage ? `url(${settings.backgroundImage})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            '--ui-scale': settings.uiScale || 1,
            '--ui-blur': `${settings.uiBlur ?? 16}px`,
            '--ui-radius': `${settings.uiRadius ?? 16}px`,
            '--panel-opacity': (settings.panelOpacity ?? 100) / 100,
            '--glow-intensity': (settings.uiGlow ?? 0) / 100,
          } as React.CSSProperties}
        >
          <ParticleEffect />
          
          {settings.showStars && (
            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
              {Array.from({ length: settings.starCount || 50 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute rounded-full bg-white/60 animate-pulse"
                  style={{
                    width: Math.random() * 2 + 1 + 'px',
                    height: Math.random() * 2 + 1 + 'px',
                    top: Math.random() * 100 + '%',
                    left: Math.random() * 100 + '%',
                    opacity: Math.random() * 0.5 + 0.2,
                    animationDuration: Math.random() * 3 + 2 + 's'
                  }}
                />
              ))}
            </div>
          )}

          {settings.backgroundImage && (
            <div className="absolute inset-0 bg-black/60 z-0 pointer-events-none" style={{ opacity: 1 - (settings.backgroundOpacity || 0.2) }} />
          )}
          
          <div className="title-bar-drag h-9 flex items-center justify-between px-3 bg-black/10 dark:bg-black/20 border-b border-black/5 dark:border-white/5 shrink-0 z-20">
            <div className="text-xs font-semibold tracking-widest text-gray-500 dark:text-gray-400">MCATLAUNCHER</div>
            <div className="flex gap-2 no-drag">
              <button onClick={() => (window as any).launcher.minimize()} className="p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded transition-colors"><Minus size={14} /></button>
              <button onClick={() => (window as any).launcher.maximize()} className="p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded transition-colors"><Square size={12} /></button>
              <button onClick={() => (window as any).launcher.close()} className="p-1.5 hover:bg-red-500/80 rounded transition-colors text-black dark:text-white"><X size={14} /></button>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden relative z-10">
            <Sidebar 
              activeTab={activeTab} 
              setActiveTab={setActiveTab} 
              onOpenSettings={() => setSettingsOpen(true)} 
              onCreateInstance={() => setCreateInstanceOpen(true)} 
            />
            
            <main className="flex-1 overflow-y-auto relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  {activeTab === 'home' && <HomeScreen onOpenAdmin={() => setAdminOpen(true)} />}
                  {activeTab === 'search' && <SearchScreen />}
                  {activeTab === 'library' && <LibraryScreen />}
                  {activeTab === 'profiles' && <ProfilesScreen />}
                  {activeTab === 'pet' && <PetScreen />}
                </motion.div>
              </AnimatePresence>
            </main>

            <ConsolePanel />
          </div>

          {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
          {createInstanceOpen && <CreateInstanceModal onClose={() => setCreateInstanceOpen(false)} />} 
          
          <Toast />
          <ProgressOverlay />
          <MusicPlayer />
          <ChatWidget />
          {adminOpen && <AdminPanel onClose={() => setAdminOpen(false)} />}

          {updateVersion && (
            <div className="fixed bottom-6 right-6 z-[999] bg-[#1a1a1f] border border-blue-500/50 p-6 rounded-2xl shadow-2xl max-w-sm">
              <h3 className="text-lg font-bold text-white mb-2">Доступно обновление!</h3>
              <p className="text-sm text-gray-400 mb-4">Вышла новая версия лаунчера: <span className="text-blue-400 font-bold">v{updateVersion}</span></p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setUpdateVersion(null)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
                >
                  Позже
                </button>
                <button 
                  onClick={() => { (window as any).launcher.downloadUpdate(); setUpdateVersion(null); }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors"
                >
                  <Download size={16} /> Скачать
                </button>
              </div>
            </div>
          )}

        </motion.div>
      )}
    </AnimatePresence>
  );
}