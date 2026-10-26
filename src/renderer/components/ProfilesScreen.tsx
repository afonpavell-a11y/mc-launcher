import React, { useState, useRef } from 'react';
import { UserPlus, Upload, Check, Trash2 } from 'lucide-react';
import { useProfileStore } from '../store/useProfileStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { playClickSound } from '../lib/sound';
import { t } from '../lib/i18n';
import SkinViewer from './SkinViewer';

export default function ProfilesScreen() {
  const { profiles, activeId, setActive, addOffline, updateProfile, deleteProfile } = useProfileStore();
  const { settings } = useSettingsStore();
  const [name, setName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lang = settings.language || 'ru';

  const handleAdd = async () => {
    if (!name.trim()) return;
    if (settings.enableSounds) playClickSound();
    await addOffline(name);
    setName('');
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

  return (
    <div className="p-8 max-w-4xl mx-auto h-full overflow-y-auto">
      <h1 className="text-3xl font-bold mb-8 text-white">{t(lang, 'profiles')}</h1>

      <div className="space-y-3 mb-6">
        {profiles.map(p => {
          // Ссылка на текстуру скина (PNG), чтобы skinview3d её отрендерил
          const skinTexture = p.localSkin || `https://mc-heads.net/skin/${p.name}`;
          
          return (
            <div 
              key={p.id} 
              onClick={() => setActive(p.id)}
              className={`p-4 rounded-2xl cursor-pointer flex items-center justify-between border-2 transition-all ${activeId === p.id ? 'border-blue-500 bg-blue-500/10' : 'border-transparent bg-white/5 hover:bg-white/10'}`}
            >
              <div className="flex items-center gap-4">
                {/* Мини 3D-модель */}
                <div className="w-16 h-16 flex items-center justify-center bg-black/30 rounded-xl overflow-hidden">
                  <SkinViewer skinUrl={skinTexture} width={64} height={64} autoRotate={false} />
                </div>
                <div>
                  <span className="font-bold text-white text-lg block">{p.name}</span>
                  <span className="text-sm text-gray-500">{p.type === 'offline' ? 'Offline' : 'Microsoft'}</span>
                </div>
              </div>
              {activeId === p.id && <Check size={20} className="text-blue-500" />}
              <button onClick={(e) => { e.stopPropagation(); deleteProfile(p.id); }} className="p-2 text-gray-500 hover:text-red-500">
                <Trash2 size={18} />
              </button>
            </div>
          );
        })}
      </div>

      <div className="glass p-6 rounded-2xl">
        <p className="font-medium text-white mb-4">{t(lang, 'addProfile')}</p>
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder={t(lang, 'nickname')}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          />
          <button onClick={handleAdd} className="p-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white">
            <UserPlus size={20} />
          </button>
        </div>

        {activeId && (
          <div className="mt-4">
            <input type="file" accept="image/png" ref={fileInputRef} onChange={handleSkinUpload} className="hidden" />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/30 transition-colors"
            >
              <Upload size={16} /> {t(lang, 'uploadSkin')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}