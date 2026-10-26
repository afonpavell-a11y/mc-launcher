import React, { useEffect, useState } from 'react';
import { X, Loader2, FolderOpen } from 'lucide-react';

interface Props {
  onClose: () => void;
  onConfirm: (instanceId: string, gameVersion: string, loader: string) => void;
  projectTitle: string;
}

export default function InstallModal({ onClose, onConfirm, projectTitle }: Props) {
  const [instances, setInstances] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      // Используем правильный метод getInstalledVersions
      const res = await window.launcher.getInstalledVersions();
      if (res.ok && res.data) {
        setInstances(res.data);
        if (res.data.length > 0) {
          setSelectedId(res.data[0].id);
        }
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleInstall = () => {
    if (!selectedId) return;
    const inst = instances.find(i => i.id === selectedId);
    // Берем версию и загрузчик из инстанса
    const gameVersion = inst?.mcVersion || '1.21.11'; 
    const loader = inst?.loader || 'fabric';
    onConfirm(selectedId, gameVersion, loader);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-10">
      <div className="w-full max-w-lg bg-[#1a1a1f] border border-white/10 rounded-2xl shadow-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Установка {projectTitle}</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg"><X size={20} /></button>
        </div>

        <p className="text-gray-400 text-sm mb-4">Выберите инстанс, в который нужно скачать мод:</p>

        {loading ? (
          <div className="flex justify-center py-6"><Loader2 className="animate-spin text-blue-500" /></div>
        ) : instances.length === 0 ? (
          <div className="text-center py-6 text-red-400">
            У вас нет скачанных версий. Сначала создайте сборку.
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto mb-6">
            {instances.map(inst => (
              <button
                key={inst.id}
                onClick={() => setSelectedId(inst.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                  selectedId === inst.id ? 'bg-blue-600/20 border-blue-500/50' : 'bg-white/5 border-transparent hover:bg-white/10'
                }`}
              >
                <FolderOpen size={18} className={selectedId === inst.id ? 'text-blue-400' : 'text-gray-400'} />
                <div className="text-left">
                  <div className="font-bold text-white">{inst.id}</div>
                  <div className="text-xs text-gray-400">{inst.loader || 'Vanilla'} • {inst.mcVersion}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-gray-400 hover:text-white transition-colors">Отмена</button>
          <button 
            onClick={handleInstall}
            disabled={!selectedId || instances.length === 0}
            className="px-6 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white rounded-xl font-bold transition-colors"
          >
            Установить
          </button>
        </div>
      </div>
    </div>
  );
}