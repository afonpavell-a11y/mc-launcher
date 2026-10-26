import React, { useState } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettingsStore } from '../store/useSettingsStore';
import { playClickSound } from '../lib/sound';
import { t } from '../lib/i18n';

type Tab = 'interface' | 'appearance' | 'particles' | 'memory' | 'java';

export default function SettingsModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('interface');
  const { settings, update } = useSettingsStore();
  const lang = settings.language || 'ru';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => update({ backgroundImage: reader.result as string });
    reader.readAsDataURL(file);
  };

  const handleClose = () => { if (settings.enableSounds) playClickSound(); onClose(); };
  const handleTab = (t: Tab) => { if (settings.enableSounds) playClickSound(); setTab(t); };

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-10">
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-4xl h-[600px] glass modal-panel shadow-2xl flex overflow-hidden">
          <div className="w-56 bg-black/10 dark:bg-black/40 p-6 flex flex-col border-r border-white/5">
            <h2 className="text-lg font-bold mb-6 text-white">{t(lang, 'settings')}</h2>
            <nav className="flex flex-col gap-2 overflow-y-auto">
              <button onClick={() => handleTab('interface')} className={`text-left px-4 py-2 rounded-lg transition ${tab === 'interface' ? 'bg-blue-600/20 text-blue-400 font-medium' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>{t(lang, 'interface')}</button>
              <button onClick={() => handleTab('appearance')} className={`text-left px-4 py-2 rounded-lg transition ${tab === 'appearance' ? 'bg-blue-600/20 text-blue-400 font-medium' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>{t(lang, 'appearance')}</button>
              <button onClick={() => handleTab('particles')} className={`text-left px-4 py-2 rounded-lg transition ${tab === 'particles' ? 'bg-blue-600/20 text-blue-400 font-medium' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>{t(lang, 'particles')}</button>
              <button onClick={() => handleTab('memory')} className={`text-left px-4 py-2 rounded-lg transition ${tab === 'memory' ? 'bg-blue-600/20 text-blue-400 font-medium' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>{t(lang, 'memory')}</button>
              <button onClick={() => handleTab('java')} className={`text-left px-4 py-2 rounded-lg transition ${tab === 'java' ? 'bg-blue-600/20 text-blue-400 font-medium' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>{t(lang, 'java')}</button>
            </nav>
            <button onClick={handleClose} className="mt-auto flex items-center gap-2 text-sm text-gray-500 hover:text-white"><X size={16} /> {t(lang, 'close')}</button>
          </div>

          <div className="flex-1 p-8 overflow-y-auto">
            {tab === 'interface' && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
                <h3 className="text-xl font-semibold text-white mb-6">{t(lang, 'interface')}</h3>
                <div className="space-y-4">
                  {/* Язык */}
                  <div className="glass p-5 rounded-xl">
                    <p className="font-medium text-white mb-3">{t(lang, 'language')}</p>
                    <div className="flex gap-2">
                      {[{id:'ru',l:'Русский'},{id:'en',l:'English'},{id:'uk',l:'Українська'}].map(x => (
                        <button key={x.id} onClick={() => update({ language: x.id as any })} className={`flex-1 py-2 rounded-lg text-sm transition-all ${settings.language === x.id ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-300'}`}>{x.l}</button>
                      ))}
                    </div>
                  </div>
                  {/* Тема */}
                  <div className="glass p-5 rounded-xl">
                    <p className="font-medium text-white mb-3">{t(lang, 'theme')}</p>
                    <div className="flex gap-2">
                      <button onClick={() => update({ theme: 'dark' })} className={`flex-1 py-2 rounded-lg ${settings.theme === 'dark' ? 'bg-black/80 border-2 border-blue-500 text-white' : 'bg-white/5 text-gray-300'}`}>{t(lang, 'dark')}</button>
                      <button onClick={() => update({ theme: 'light' })} className={`flex-1 py-2 rounded-lg ${settings.theme === 'light' ? 'bg-gray-200 text-black border-2 border-blue-500' : 'bg-white/5 text-gray-300'}`}>{t(lang, 'light')}</button>
                    </div>
                  </div>
                  {/* Цветовая схема */}
                  <div className="glass p-5 rounded-xl">
                    <p className="font-medium text-white mb-3">Цветовая схема</p>
                    <div className="flex gap-2 flex-wrap">
                      {[{id:'blue',c:'#2563eb'},{id:'green',c:'#16a34a'},{id:'purple',c:'#9333ea'},{id:'red',c:'#ef4444'},{id:'orange',c:'#f59e0b'},{id:'pink',c:'#ec4899'}].map(x => (
                        <button key={x.id} onClick={() => update({ themeColor: x.id as any, accentColor: x.c })} className={`w-10 h-10 rounded-full border-2 transition-transform hover:scale-110 ${settings.themeColor === x.id ? 'border-white scale-110' : 'border-transparent'}`} style={{ backgroundColor: x.c }} />
                      ))}
                    </div>
                  </div>
                  {/* Звуки */}
                  <div className="glass p-5 rounded-xl flex items-center justify-between">
                    <p className="font-medium text-white">{t(lang, 'sounds')}</p>
                    <input type="checkbox" checked={settings.enableSounds} onChange={(e) => update({ enableSounds: e.target.checked })} className="w-5 h-5 rounded accent-blue-600" />
                  </div>
                </div>
              </motion.div>
            )}

            {tab === 'appearance' && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
                <h3 className="text-xl font-semibold text-white mb-6">{t(lang, 'appearance')}</h3>
                <div className="space-y-4">
                  <div className="glass p-5 rounded-xl">
                    <p className="font-medium mb-2 text-white">{t(lang, 'background')}</p>
                    <input type="file" accept="image/*" onChange={handleFileChange} className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600/20 file:text-blue-600" />
                    {settings.backgroundImage && <button onClick={() => update({ backgroundImage: undefined })} className="mt-2 text-xs text-red-400">Удалить фон</button>}
                  </div>
                  <div className="glass p-5 rounded-xl">
                    <p className="font-medium mb-2 text-white">Прозрачность фона ({Math.round((settings.backgroundOpacity || 0) * 100)}%)</p>
                    <input type="range" min="0" max="1" step="0.1" value={settings.backgroundOpacity} onChange={(e) => update({ backgroundOpacity: parseFloat(e.target.value) })} className="w-full" />
                  </div>
                  <div className="glass p-5 rounded-xl">
                    <p className="font-medium mb-2 text-white">{t(lang, 'accentColor')}</p>
                    <div className="flex gap-2">
                      {['#2563eb', '#16a34a', '#9333ea', '#ef4444', '#f59e0b', '#ec4899'].map(color => (
                        <button key={color} onClick={() => update({ accentColor: color })} className={`w-8 h-8 rounded-full border-2 ${settings.accentColor === color ? 'border-white' : 'border-transparent'}`} style={{ backgroundColor: color }} />
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {tab === 'particles' && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
                <h3 className="text-xl font-semibold text-white mb-6">{t(lang, 'particles')}</h3>
                <div className="space-y-4">
                  <div className="glass p-5 rounded-xl">
                    <p className="font-medium mb-3 text-white">{t(lang, 'particleType')}</p>
                    <div className="flex flex-wrap gap-2">
                      {(['none', 'stars', 'snow', 'sakura', 'rain', 'sparks'] as const).map(type => (
                        <button key={type} onClick={() => update({ particlesType: type })} className={`px-4 py-2 rounded-lg text-sm font-medium ${settings.particlesType === type ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-300 hover:bg-white/10'}`}>
                          {type === 'none' ? 'Нет' : type === 'stars' ? 'Звёзды' : type === 'snow' ? 'Снег' : type === 'sakura' ? 'Сакура' : type === 'rain' ? 'Дождь' : 'Искры'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="glass p-5 rounded-xl">
                    <p className="font-medium mb-2 text-white">{t(lang, 'count')} ({settings.particlesCount || 50})</p>
                    <input type="range" min="10" max="200" step="10" value={settings.particlesCount || 50} onChange={(e) => update({ particlesCount: parseInt(e.target.value) })} className="w-full" />
                  </div>
                  <div className="glass p-5 rounded-xl">
                    <p className="font-medium mb-2 text-white">{t(lang, 'speed')} ({settings.particlesSpeed || 1}x)</p>
                    <input type="range" min="0.2" max="3" step="0.1" value={settings.particlesSpeed || 1} onChange={(e) => update({ particlesSpeed: parseFloat(e.target.value) })} className="w-full" />
                  </div>
                </div>
              </motion.div>
            )}

            {tab === 'memory' && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
                <h3 className="text-xl font-semibold text-white mb-6">{t(lang, 'memory')}</h3>
                <div className="glass p-5 rounded-xl">
                  <p className="font-medium text-white mb-2">{t(lang, 'maxRam')}: {settings.ramMaxMb} MB</p>
                  <input type="range" min="1024" max="16384" step="512" value={settings.ramMaxMb} onChange={(e) => update({ ramMaxMb: parseInt(e.target.value) })} className="w-full" />
                  <div className="flex justify-between text-xs text-gray-500 mt-1"><span>1 GB</span><span>16 GB</span></div>
                </div>
              </motion.div>
            )}

            {tab === 'java' && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
                <h3 className="text-xl font-semibold text-white mb-6">{t(lang, 'java')}</h3>
                <div className="glass p-5 rounded-xl">
                  <p className="font-medium text-white mb-2">{t(lang, 'javaPath')}</p>
                  <input type="text" placeholder={t(lang, 'autoJava')} value={settings.javaPath || ''} onChange={(e) => update({ javaPath: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
                  <p className="text-xs text-gray-500 mt-2">{t(lang, 'autoJava')}</p>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}