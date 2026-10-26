import React, { useEffect, useState } from 'react';
import { Play, Settings, MoreHorizontal, FolderOpen, Trash2, Plus, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { useProfileStore } from '../store/useProfileStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useVersionsStore } from '../store/useVersionsStore';
import { playClickSound } from '../lib/sound';
import { showToast } from './Toast';
import { t } from '../lib/i18n';

export default function InstancePage({ instanceId, onBack }: { instanceId: string; onBack: () => void }) {
  const { profiles, activeId } = useProfileStore();
  const { settings } = useSettingsStore();
  const { setSelectedInstance } = useVersionsStore();
  const lang = settings.language || 'ru';
  
  const [mods, setMods] = useState<any[]>([]);
  const [shaders, setShaders] = useState<any[]>([]);
  const [resourcePacks, setResourcePacks] = useState<any[]>([]);
  const [worlds, setWorlds] = useState<string[]>([]);
  const [logContent, setLogContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'content' | 'files' | 'worlds' | 'logs'>('content');
  const [search, setSearch] = useState('');

  const [modsDir, setModsDir] = useState('');
  const [shadersDir, setShadersDir] = useState('');
  const [resourcePacksDir, setResourcePacksDir] = useState('');

  useEffect(() => {
    const init = async () => {
      const gameDirRes = await window.launcher.getGameDir(instanceId);
      if (gameDirRes.ok && gameDirRes.data) {
        const base = gameDirRes.data;
        setModsDir(`${base}\\mods`);
        setShadersDir(`${base}\\shaderpacks`);
        setResourcePacksDir(`${base}\\resourcepacks`);
      }
      loadData();
    };
    init();
  }, [instanceId]);

  const loadData = async () => {
    setLoading(true);
    const gameDirRes = await window.launcher.getGameDir(instanceId);
    if (gameDirRes.ok && gameDirRes.data) {
      const base = gameDirRes.data;
      const modsRes = await window.launcher.listFiles(`${base}\\mods`, ['.jar', '.disabled']);
      const shadersRes = await window.launcher.listFiles(`${base}\\shaderpacks`, ['.zip']);
      const rpRes = await window.launcher.listFiles(`${base}\\resourcepacks`, ['.zip']);
      const worldsRes = await window.launcher.listWorlds(instanceId);
      const logRes = await window.launcher.readLog(instanceId);
      
      if (modsRes.ok) setMods(modsRes.data || []);
      if (shadersRes.ok) setShaders(shadersRes.data || []);
      if (rpRes.ok) setResourcePacks(rpRes.data || []);
      if (worldsRes.ok) setWorlds(worldsRes.data || []);
      if (logRes.ok && logRes.data) setLogContent(logRes.data);
    }
    setLoading(false);
  };

  const handlePlay = async () => {
    const activeProfile = profiles.find(p => p.id === activeId);
    if (!activeProfile) return showToast('Создайте профиль!', 'error');
    if (settings.enableSounds) playClickSound();
    
    const jsonRes = await window.launcher.getVersionJson(instanceId);
    if (!jsonRes.ok || !jsonRes.data) return showToast('JSON не найден', 'error');
    
    const launchRes = await window.launcher.launchGame({ profile: activeProfile, version: jsonRes.data, settings });
    if (!launchRes.ok) showToast(`Ошибка: ${launchRes.error}`, 'error');
  };

  const handleOpenModsFolder = () => window.launcher.openFolder(modsDir);
  const handleOpenShadersFolder = () => window.launcher.openFolder(shadersDir);
  const handleOpenResourcePacksFolder = () => window.launcher.openFolder(resourcePacksDir);

  const handleFindProjects = () => {
    if (settings.enableSounds) playClickSound();
    setSelectedInstance(instanceId);
    window.dispatchEvent(new CustomEvent('switch-tab', { detail: 'search' }));
  };

  const handleToggleMod = async (mod: any) => {
    if (settings.enableSounds) playClickSound();
    const fullPath = `${modsDir}\\${mod.name}`;
    const res = await window.launcher.toggleMod(fullPath);
    
    if (res.ok) {
      setMods(prev => prev.map(m => m.name === mod.name ? { ...m, name: res.data.newPath.split('\\').pop(), enabled: res.data.enabled } : m));
      showToast(res.data.enabled ? `Мод включен` : `Мод отключен`, 'success');
    }
  };

  const filteredMods = mods.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 max-w-6xl mx-auto h-full overflow-y-auto">
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white">←</button>
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg">📦</div>
          <div>
            <h1 className="text-3xl font-bold text-white">{instanceId.replace('fabric-loader-', 'Fabric ')}</h1>
            <p className="text-sm text-gray-400 mt-1">Fabric • {mods.length} модов</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handlePlay} className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-colors shadow-lg">
            <Play size={18} fill="currentColor" /> {t(lang, 'play')}
          </button>
          <button className="p-3 bg-white/5 hover:bg-white/10 rounded-xl"><Settings size={20} className="text-white" /></button>
          <button className="p-3 bg-white/5 hover:bg-white/10 rounded-xl"><MoreHorizontal size={20} className="text-white" /></button>
        </div>
      </div>

      <div className="flex gap-2 mb-6 border-b border-white/10 pb-2">
        {[
          { id: 'content', label: 'Контент', icon: '🧩' },
          { id: 'files', label: 'Файлы', icon: '📁' },
          { id: 'worlds', label: 'Миры', icon: '🌍' },
          { id: 'logs', label: 'Журнал', icon: '📄' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'content' && (
        <>
          <div className="flex gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 text-gray-400" size={18} />
              <input type="text" placeholder={`Поиск ${mods.length} проектов...`} value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none" />
            </div>
            <button onClick={handleOpenModsFolder} className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-medium text-white"><FolderOpen size={16} /> Добавить файлы</button>
            <button onClick={handleFindProjects} className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-500 rounded-xl text-sm font-medium text-white"><Plus size={16} /> Найти проекты</button>
          </div>

          <div className="space-y-2">
            {loading ? <p className="text-gray-500">Загрузка...</p> : filteredMods.length === 0 ? <p className="text-gray-500">Нет установленных модов.</p> : filteredMods.map((mod, i) => (
              <div key={i} className="glass p-3 rounded-xl flex items-center gap-3 hover:bg-white/5">
                <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center text-lg">📦</div>
                <div className="flex-1">
                  <p className="font-medium text-white">{mod.name.replace('.jar', '').replace('.disabled', '')}</p>
                  <p className="text-xs text-gray-500">{mod.enabled ? 'Включен' : 'Отключен'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleToggleMod(mod)} className={`relative w-12 h-7 rounded-full transition-colors ${mod.enabled ? 'bg-green-500' : 'bg-gray-600'}`}>
                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all ${mod.enabled ? 'left-6' : 'left-1'}`} />
                  </button>
                  <button className="p-2 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'files' && (
        <div className="grid grid-cols-3 gap-4">
          <button onClick={handleOpenModsFolder} className="glass p-6 rounded-xl flex flex-col items-center gap-2 hover:bg-white/5">
            <FolderOpen size={32} className="text-blue-400" /><span className="text-white font-medium">Папка модов</span><span className="text-xs text-gray-400">{mods.length} файлов</span>
          </button>
          <button onClick={handleOpenShadersFolder} className="glass p-6 rounded-xl flex flex-col items-center gap-2 hover:bg-white/5">
            <FolderOpen size={32} className="text-yellow-400" /><span className="text-white font-medium">Папка шейдеров</span><span className="text-xs text-gray-400">{shaders.length} файлов</span>
          </button>
          <button onClick={handleOpenResourcePacksFolder} className="glass p-6 rounded-xl flex flex-col items-center gap-2 hover:bg-white/5">
            <FolderOpen size={32} className="text-green-400" /><span className="text-white font-medium">Папка текстур</span><span className="text-xs text-gray-400">{resourcePacks.length} файлов</span>
          </button>
        </div>
      )}

      {activeTab === 'worlds' && (
        <div className="space-y-2">
          {loading ? <p className="text-gray-500">Загрузка...</p> : worlds.length === 0 ? (
            <p className="text-gray-500">Миров пока нет. Запустите игру и создайте новый мир.</p>
          ) : (
            worlds.map((world, i) => (
              <div key={i} className="glass p-3 rounded-xl flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center text-lg">🌍</div>
                <span className="font-medium text-white">{world}</span>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="glass p-4 rounded-xl">
          <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap max-h-96 overflow-y-auto">{logContent || 'Лог пуст.'}</pre>
        </div>
      )}
    </motion.div>
  );
}