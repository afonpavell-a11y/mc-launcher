import React, { useState, useEffect } from 'react';
import { Search, Loader2, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { useVersionsStore } from '../store/useVersionsStore';
import { showToast } from './Toast';
import InstallModal from './InstallModal';

type Tab = 'mods' | 'modpacks' | 'resourcepacks' | 'shaders' | 'optimization';

const OPTIMIZATION_MODS = [
  { id: 'sodium', title: 'Sodium', desc: 'Замена рендера, даёт огромный прирост FPS' },
  { id: 'lithium', title: 'Lithium', desc: 'Оптимизация игровой логики и AI' },
  { id: 'ferritecore', title: 'FerriteCore', desc: 'Снижает потребление оперативной памяти' },
  { id: 'entityculling', title: 'Entity Culling', desc: 'Не рендерит невидимых мобов и блоки' },
  { id: 'immediatelyfast', title: 'ImmediatelyFast', desc: 'Ускоряет рендеринг интерфейса и текста' },
  { id: 'modernfix', title: 'ModernFix', desc: 'Ускоряет загрузку и оптимизирует память' },
];

export default function SearchScreen() {
  const { selectedInstance } = useVersionsStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('mods');
  const [page, setPage] = useState(1);
  const [totalHits, setTotalHits] = useState(0);
  
  const [installModalOpen, setInstallModalOpen] = useState(false);
  const [pendingMod, setPendingMod] = useState<any>(null);

  const itemsPerPage = 20;

  const fetchData = async (currentPage: number, isSearch = false) => {
    setLoading(true);
    try {
      const offset = (currentPage - 1) * itemsPerPage;
      let res;
      
      if (tab === 'optimization') {
        setResults(OPTIMIZATION_MODS.map(m => ({
          project_id: m.id, title: m.title, description: m.desc, icon_url: null,
          downloads: 0, follows: 0, date_modified: new Date().toISOString(), _isOptimization: true,
        })));
        setTotalHits(OPTIMIZATION_MODS.length);
      } else if (isSearch && query.trim()) {
        const searchType = tab === 'mods' ? 'mod' : tab === 'modpacks' ? 'modpack' : tab === 'resourcepacks' ? 'resourcepack' : 'shader';
        res = await window.launcher.searchMods(query, { type: searchType, offset });
        if (res.ok && res.data) {
          setResults(res.data.hits || []);
          setTotalHits(res.data.total || 0);
        } else {
          setResults([]); setTotalHits(0);
        }
      } else {
        const type = tab === 'mods' ? 'mod' : tab === 'modpacks' ? 'modpack' : tab === 'resourcepacks' ? 'resourcepack' : 'shader';
        res = await window.launcher.getPopularMods(type, offset);
        if (res.ok && res.data) {
          setResults(res.data.hits || []);
          setTotalHits(res.data.total || 0);
        } else {
          setResults([]); setTotalHits(0);
        }
      }
    } catch (e) {
      console.error(e);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    setQuery('');
    fetchData(1, false);
  }, [tab]);

  const handleSearch = () => {
    setPage(1);
    fetchData(1, true);
  };

  const changePage = (newPage: number) => {
    if (newPage < 1 || newPage > Math.ceil(totalHits / itemsPerPage)) return;
    setPage(newPage);
    fetchData(newPage, !!query.trim());
  };

  const handleDownload = (mod: any) => {
    setPendingMod(mod);
    setInstallModalOpen(true);
  };

  // ИСПРАВЛЕННЫЙ МЕТОД:
  const handleConfirmInstall = async (instanceId: string, gameVersion: string, loader: string) => {
    if (!pendingMod) return;
    setInstallModalOpen(false);
    
    setDownloading(pendingMod.project_id);
    
    // Передаем instanceId напрямую в Main-процесс, он сам найдет папку
    const res = await window.launcher.downloadMod(pendingMod.project_id, instanceId, gameVersion, loader);
    
    if (res.ok) {
      showToast(`Мод ${pendingMod.title} скачан в ${instanceId}!`, 'success');
    } else {
      showToast(`Ошибка: ${res.error}`, 'error');
    }
    setDownloading(null);
    setPendingMod(null);
  };

  const tabs = [
    { id: 'mods', label: 'Mods' },
    { id: 'modpacks', label: 'Modpacks' },
    { id: 'resourcepacks', label: 'Resource Packs' },
    { id: 'shaders', label: 'Shaders' },
    { id: 'optimization', label: 'Оптимизация', icon: Sparkles },
  ] as const;

  const totalPages = Math.ceil(totalHits / itemsPerPage);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Поиск</h1>

      <div className="flex gap-2 mb-6 border-b border-white/10 pb-2 flex-wrap">
        {tabs.map(t => (
          <button 
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${tab === t.id ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            {t.icon && <t.icon size={16} />}
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder={`Поиск...`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 text-base"
          />
        </div>
        <button onClick={handleSearch} className="bg-green-600 hover:bg-green-500 text-white px-8 rounded-xl font-medium">Найти</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin" size={32} /></div>
      ) : (
        <>
          {results.length === 0 ? (
            <div className="text-center text-gray-400 py-10">Ничего не найдено</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.map((mod) => (
                <div key={mod.project_id} className="glass p-4 rounded-2xl flex items-start gap-4">
                  <div className="w-16 h-16 rounded-xl bg-gray-800 flex items-center justify-center">
                    {mod.icon_url ? <img src={mod.icon_url} className="w-full h-full object-cover rounded-xl" /> : '📦'}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white">{mod.title}</h3>
                    <p className="text-sm text-gray-400 line-clamp-2">{mod.description}</p>
                  </div>
                  <button 
                    onClick={() => handleDownload(mod)} 
                    disabled={downloading === mod.project_id}
                    className="p-2 bg-green-600/20 text-green-400 rounded-lg disabled:opacity-50"
                  >
                    {downloading === mod.project_id ? <Loader2 className="animate-spin" size={20} /> : 'Install'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <button onClick={() => changePage(page - 1)} disabled={page === 1} className="p-2 bg-white/5 rounded-lg disabled:opacity-30"><ChevronLeft size={20} /></button>
              <span className="text-sm text-gray-400">Страница {page} из {totalPages}</span>
              <button onClick={() => changePage(page + 1)} disabled={page >= totalPages} className="p-2 bg-white/5 rounded-lg disabled:opacity-30"><ChevronRight size={20} /></button>
            </div>
          )}
        </>
      )}

      {installModalOpen && pendingMod && (
        <InstallModal
          onClose={() => { setInstallModalOpen(false); setPendingMod(null); }}
          onConfirm={handleConfirmInstall}
          projectTitle={pendingMod.title}
        />
      )}
    </div>
  );
}