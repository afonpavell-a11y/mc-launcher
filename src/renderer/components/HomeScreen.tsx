import React, { useState } from 'react';
import { Play, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useProfileStore } from '../store/useProfileStore';
import { useVersionsStore } from '../store/useVersionsStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { playClickSound } from '../lib/sound';
import { t } from '../lib/i18n';
import SkinViewer from './SkinViewer';

export default function HomeScreen() {
  const { profiles, activeId } = useProfileStore();
  const { selectedVersion } = useVersionsStore();
  const { settings } = useSettingsStore();
  const active = profiles.find(p => p.id === activeId);
  const isReady = active && selectedVersion;
  const lang = settings.language || 'ru';

  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const skinUrl = active?.localSkin 
    ? active.localSkin 
    : active ? `https://mc-heads.net/skin/${active.name}` : null;

  const handleClick = () => {
    if (settings.enableSounds) playClickSound();

    // Если версия не выбрана — перекидываем в библиотеку
    if (!isReady) {
      window.dispatchEvent(new CustomEvent('switch-tab', { detail: 'library' }));
      return;
    }

    // Если всё выбрано — запускаем игру
    if (launching) return;
    setLaunching(true);
    setError(null);

    window.launcher.launchGame({
      profile: active,
      version: selectedVersion,
      settings,
    }).then((res) => {
      if (!res.ok) {
        setError(res.error || 'Ошибка запуска');
        setLaunching(false);
      }
    }).catch((e) => {
      setError(e.message || 'Ошибка запуска');
      setLaunching(false);
    });
  };

  return (
    <div className="flex h-full w-full p-8 gap-8">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 flex flex-col justify-center max-w-2xl">
        <h1 className="text-6xl font-extrabold text-white mb-4">
          {t(lang, 'hello')}, <span style={{ color: settings.accentColor || '#2563eb' }}>{active ? active.name : 'Guest'}</span>!
        </h1>
        <p className="text-xl text-gray-400 mb-2">
          {selectedVersion ? `Готов к запуску ${selectedVersion.id}` : t(lang, 'selectVersion')}
        </p>
        
        {!active && (
          <div className="flex items-center gap-2 text-red-400 text-sm mb-6">
            <AlertCircle size={16} /> Нет профиля. Перейдите в "Профили".
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm mb-6">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <button
          onClick={handleClick}
          style={{ backgroundColor: settings.accentColor || '#2563eb' }}
          className={`mt-4 flex items-center gap-3 hover:brightness-110 text-white px-10 py-4 rounded-2xl font-bold text-xl w-fit transition-all ${
            launching ? 'opacity-70 cursor-wait' : 'hover:scale-105'
          }`}
        >
          {launching ? <Loader2 className="animate-spin" size={24} /> : <Play fill="currentColor" size={24} />}
          {launching ? 'Запуск...' : isReady ? t(lang, 'play') : t(lang, 'selectVersion')}
        </button>
      </motion.div>

      <motion.div initial={{ opacity: 0, scale: 0.9, x: 20 }} animate={{ opacity: 1, scale: 1, x: 0 }} className="w-1/3 flex flex-col items-center justify-center">
        {skinUrl ? (
          <SkinViewer skinUrl={skinUrl} width={200} height={400} />
        ) : (
          <div className="glass p-8 rounded-3xl text-center">
            <div className="text-4xl mb-4">🎮</div>
            <p className="text-gray-400 text-sm">Загрузите скин в профиле</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}