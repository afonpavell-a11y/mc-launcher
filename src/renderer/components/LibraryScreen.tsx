import React, { useEffect, useState } from 'react';
import { Play, Trash2, Loader2 } from 'lucide-react';
import { useProfileStore } from '../store/useProfileStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useVersionsStore } from '../store/useVersionsStore';
import { playClickSound } from '../lib/sound';
import { t } from '../lib/i18n';
import InstancePage from './InstancePage';

export default function LibraryScreen() {
  const { profiles, activeId } = useProfileStore();
  const { settings } = useSettingsStore();
  const { selectedInstance, setSelectedInstance } = useVersionsStore();
  const lang = settings.language || 'ru';
  
  const [instances, setInstances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [launching, setLaunching] = useState<string | null>(null);
  const [showPage, setShowPage] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await window.launcher.getInstalledVersions();
      if (res.ok && res.data) {
        // Преобразуем в формат, который нужен UI
        const list = res.data.map((i: any) => ({
          id: i.id,
          name: i.id.includes('fabric') ? `Fabric ${i.mcVersion}` : 
                i.id.includes('forge') ? `Forge ${i.mcVersion}` : 
                i.id.includes('quilt') ? `Quilt ${i.mcVersion}` : 
                i.id.includes('neoforge') ? `NeoForge ${i.mcVersion}` : `Vanilla ${i.mcVersion}`,
          type: i.loader || 'Vanilla',
          mcVersion: i.mcVersion,
        }));
        setInstances(list);
      }
      setLoading(false);
    };
    load();
  }, []);

  const handlePlay = async (id: string) => {
    const profile = profiles.find(p => p.id === activeId);
    if (!profile) return alert('Создайте профиль!');
    if (settings.enableSounds) playClickSound();
    
    setLaunching(id);
    try {
      const json = await window.launcher.getVersionJson(id);
      if (!json.ok || !json.data) throw new Error('JSON не найден');
      await window.launcher.launchGame({ profile, version: json.data, settings });
    } catch (e: any) {
      alert(`Ошибка: ${e.message}`);
    } finally {
      setLaunching(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`Удалить инстанс ${id}?`)) return;
    if (settings.enableSounds) playClickSound();
    const res = await window.launcher.deleteVersion(id);
    if (res.ok) {
      setInstances(prev => prev.filter(i => i.id !== id));
    }
  };

  const handleOpen = (id: string) => {
    if (settings.enableSounds) playClickSound();
    setSelectedInstance(id);
    setShowPage(true);
  };

  if (showPage && selectedInstance) {
    return <InstancePage instanceId={selectedInstance} onBack={() => setShowPage(false)} />;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto h-full overflow-y-auto">
      <h1 className="text-3xl font-bold mb-8 text-white">
        {t(lang, 'library')}
      </h1>

      {loading ? (
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="animate-spin" /> Загрузка...
        </div>
      ) : instances.length === 0 ? (
        <div className="text-gray-500 text-center py-10">
          Нет инстансов. Нажмите "+" в сайдбаре.
        </div>
      ) : (
        <div className="space-y-3">
          {instances.map(v => (
            <div 
              key={v.id} 
              onClick={() => handleOpen(v.id)}
              className="glass p-4 rounded-2xl flex items-center justify-between cursor-pointer hover:border-blue-500/50 border-2 border-transparent transition-all"
            >
              <div>
                <h3 className="font-bold text-lg text-white">{v.name}</h3>
                <p className="text-sm text-gray-500">{v.type}</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); handlePlay(v.id); }}
                  disabled={launching === v.id}
                  className="p-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white rounded-xl"
                >
                  {launching === v.id ? <Loader2 className="animate-spin" size={20} /> : <Play size={20} fill="currentColor" />}
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDelete(v.id); }}
                  className="p-3 bg-white/5 hover:bg-red-600 rounded-xl text-gray-400 hover:text-white"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}