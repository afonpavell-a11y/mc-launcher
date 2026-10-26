import React, { useState, useEffect } from 'react';
import { X, Check, Loader2, Package, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVersionsStore } from '../store/useVersionsStore';
import { playClickSound } from '../lib/sound';
import { useSettingsStore } from '../store/useSettingsStore';

type Loader = 'vanilla' | 'fabric' | 'forge' | 'neoforge' | 'quilt';

const LOADER_INFO: Record<Loader, { name: string; icon: string; color: string }> = {
  vanilla: { name: 'Vanilla', icon: '📦', color: '#8b5cf6' },
  fabric: { name: 'Fabric', icon: '🧵', color: '#22c55e' },
  forge: { name: 'Forge', icon: '🔨', color: '#f59e0b' },
  neoforge: { name: 'NeoForge', icon: '⚙️', color: '#ef4444' },
  quilt: { name: 'Quilt', icon: '🧶', color: '#ec4899' },
};

export default function CreateInstanceModal({ onClose }: { onClose: () => void }) {
  const { versions, load } = useVersionsStore();
  const { settings } = useSettingsStore();
  const [loader, setLoader] = useState<Loader>('fabric');
  const [gameVersion, setGameVersion] = useState('');
  const [loaderVersion, setLoaderVersion] = useState('');
  const [availableLoaderVersions, setAvailableLoaderVersions] = useState<string[]>([]);
  const [loadingLoaders, setLoadingLoaders] = useState(false);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!gameVersion || loader === 'vanilla') return;
    const fetchLoaders = async () => {
      setLoadingLoaders(true);
      setAvailableLoaderVersions([]);
      let res;
      if (loader === 'fabric') res = await window.launcher.getFabricLoaders(gameVersion);
      else if (loader === 'forge') res = await window.launcher.getForgeVersions(gameVersion);
      else if (loader === 'neoforge') res = await window.launcher.getNeoForgeVersions(gameVersion);
      else if (loader === 'quilt') res = await window.launcher.getQuiltLoaders();
      
      if (res?.ok && res.data) {
        const vers = (loader === 'fabric' || loader === 'quilt')
          ? res.data.map((v: any) => v.version || v.loader?.version).filter(Boolean)
          : res.data;
        setAvailableLoaderVersions(vers);
        if (vers.length > 0) setLoaderVersion(vers[0]);
      }
      setLoadingLoaders(false);
    };
    fetchLoaders();
  }, [loader, gameVersion]);

  const handleCreate = async () => {
    if (!gameVersion) return alert('Выберите версию игры');
    if (settings.enableSounds) playClickSound();
    setCreating(true);
    
    try {
      if (loader === 'vanilla') {
        const v = versions.find(v => v.id === gameVersion);
        if (!v) throw new Error('Версия не найдена');
        const res = await window.launcher.downloadVersion(v);
        if (!res.ok) throw new Error(res.error);
      } else {
        if (!loaderVersion) throw new Error('Выберите версию загрузчика');
        let res;
        if (loader === 'fabric') res = await window.launcher.installFabric(gameVersion, loaderVersion);
        else if (loader === 'forge') res = await window.launcher.installForge(gameVersion, loaderVersion);
        else if (loader === 'neoforge') res = await window.launcher.installNeoForge(gameVersion, loaderVersion);
        else if (loader === 'quilt') res = await window.launcher.installQuilt(gameVersion, loaderVersion);
        if (res && !res.ok) throw new Error(res.error);
      }
      alert('Инстанс создан!');
      onClose();
    } catch (e: any) {
      alert(`Ошибка: ${e.message}`);
    } finally {
      setCreating(false);
    }
  };

  const filteredVersions = versions
    .filter(v => v.type === 'release')
    .filter(v => v.id.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 50);

  const accent = settings.accentColor || '#2563eb';

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-6"
        onClick={onClose}
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }} 
          animate={{ scale: 1, opacity: 1, y: 0 }} 
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={e => e.stopPropagation()}
          className="relative w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl"
          style={{
            background: `linear-gradient(135deg, ${accent}22, #0b0b0f 60%)`,
            border: `1px solid ${accent}44`,
          }}
        >
          {/* Декоративный градиентный блик */}
          <div 
            className="absolute -top-32 -right-32 w-64 h-64 rounded-full blur-[100px] opacity-30"
            style={{ backgroundColor: accent }}
          />

          {/* Header */}
          <div className="relative p-6 border-b border-white/10 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-extrabold text-white">Create instance</h2>
              <p className="text-sm text-gray-400 mt-1">Выберите версию и загрузчик</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition">
              <X size={20} />
            </button>
          </div>

          <div className="relative p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Loader selection */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Loader</label>
              <div className="grid grid-cols-5 gap-2">
                {(Object.keys(LOADER_INFO) as Loader[]).map(l => {
                  const info = LOADER_INFO[l];
                  const active = loader === l;
                  return (
                    <button
                      key={l}
                      onClick={() => { if (settings.enableSounds) playClickSound(); setLoader(l); setGameVersion(''); setLoaderVersion(''); }}
                      className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all border-2 ${active ? 'scale-105 shadow-lg' : 'hover:scale-105 opacity-70 hover:opacity-100'}`}
                      style={{
                        borderColor: active ? info.color : 'transparent',
                        backgroundColor: active ? `${info.color}22` : 'rgba(255,255,255,0.03)',
                      }}
                    >
                      <span className="text-2xl">{info.icon}</span>
                      <span className="text-xs font-semibold text-white">{info.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Game version */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Game version</label>
              <input
                type="text"
                placeholder="Поиск версии (например, 1.21)..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/30 mb-3"
              />
              <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto pr-1">
                {filteredVersions.map(v => (
                  <button
                    key={v.id}
                    onClick={() => { if (settings.enableSounds) playClickSound(); setGameVersion(v.id); }}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${gameVersion === v.id ? 'bg-white text-black' : 'bg-white/5 text-gray-300 hover:bg-white/10'}`}
                  >
                    {v.id}
                  </button>
                ))}
              </div>
            </div>

            {/* Loader version */}
            {loader !== 'vanilla' && gameVersion && (
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Loader version</label>
                {loadingLoaders ? (
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <Loader2 className="animate-spin" size={16} /> Загрузка...
                  </div>
                ) : availableLoaderVersions.length === 0 ? (
                  <div className="text-red-400 text-sm bg-red-500/10 p-3 rounded-xl">
                    Нет доступных сборок для этой версии
                  </div>
                ) : (
                  <select
                    value={loaderVersion}
                    onChange={e => setLoaderVersion(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/30"
                  >
                    {availableLoaderVersions.map(v => (
                      <option key={v} value={v} className="bg-[#0b0b0f]">{v}</option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="relative p-6 border-t border-white/10 flex justify-between items-center">
            <button onClick={onClose} className="px-6 py-2.5 text-gray-400 hover:text-white font-medium transition">
              Отмена
            </button>
            <button
              onClick={handleCreate}
              disabled={!gameVersion || (loader !== 'vanilla' && !loaderVersion) || creating}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105"
              style={{ backgroundColor: accent }}
            >
              {creating ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} />}
              {creating ? 'Создание...' : 'Create instance'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}