import React, { useState, useRef } from 'react';
import { X, UserPlus, Check, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProfileStore } from '../store/useProfileStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { playClickSound } from '../lib/sound';

export default function ProfileModal({ onClose }: { onClose: () => void }) {
  const { profiles, activeId, setActive, addOffline, updateProfile } = useProfileStore();
  const { settings } = useSettingsStore();
  const [name, setName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAdd = async () => {
    if (!name.trim()) return;
    if (settings.enableSounds) playClickSound();
    const ok = await addOffline(name);
    if (ok) setName('');
    else alert('Ошибка создания профиля');
  };

  const handleSkinUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeId) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      await updateProfile(activeId, { localSkin: base64 });
      if (settings.enableSounds) playClickSound();
    };
    reader.readAsDataURL(file);
  };

  const handleSetActive = (id: string) => {
    if (settings.enableSounds) playClickSound();
    setActive(id);
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-10"
      >
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-md glass rounded-3xl shadow-2xl p-6"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Профили</h2>
            <button onClick={() => { if (settings.enableSounds) playClickSound(); onClose(); }} className="text-gray-500 hover:text-gray-800 dark:hover:text-white"><X size={20} /></button>
          </div>

          <div className="space-y-2 mb-6 max-h-60 overflow-y-auto pr-2">
            {profiles.map(p => (
              <div 
                key={p.id} 
                onClick={() => handleSetActive(p.id)}
                className={`p-3 rounded-xl cursor-pointer flex items-center justify-between border-2 transition-all ${activeId === p.id ? 'border-blue-500 bg-blue-500/10' : 'border-transparent bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10'}`}
              >
                <span className="font-medium text-gray-900 dark:text-white">{p.name}</span>
                {activeId === p.id && <Check size={18} style={{ color: settings.accentColor || '#2563eb' }} />}
                <span className="text-xs text-gray-500">{p.type}</span>
              </div>
            ))}
            {profiles.length === 0 && <p className="text-sm text-gray-500 text-center py-2">Нет профилей. Создайте первый!</p>}
          </div>

          <div className="border-t border-black/10 dark:border-white/10 pt-4">
            <p className="text-sm font-medium mb-2 text-gray-900 dark:text-white">Добавить оффлайн профиль</p>
            <div className="flex gap-2">
              <input 
                value={name} onChange={e => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
                placeholder="Никнейм (латиницей)" 
                className="flex-1 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-gray-900 dark:text-white"
              />
              <button 
                onClick={handleAdd} 
                disabled={!name.trim()} 
                style={{ backgroundColor: settings.accentColor || '#2563eb' }}
                className="p-2 hover:brightness-110 disabled:opacity-50 rounded-lg text-white"
              >
                <UserPlus size={20} />
              </button>
            </div>

            {activeId && (
              <div className="mt-4">
                <input 
                  type="file" 
                  accept="image/png" 
                  ref={fileInputRef} 
                  onChange={handleSkinUpload} 
                  className="hidden" 
                />
                <button 
                  onClick={() => { if (settings.enableSounds) playClickSound(); fileInputRef.current?.click(); }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/30 transition-colors"
                >
                  <Upload size={16} /> Загрузить скин (PNG)
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}