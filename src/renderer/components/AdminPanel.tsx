import React, { useState } from 'react';
import { X, Shield, Users, Tag, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { useProfileStore } from '../store/useProfileStore';
import { showToast } from './Toast';
import type { Profile } from '../../shared/types';

const ADMIN_CODE = 'CHERRY_ADMIN_2026';

export default function AdminPanel({ onClose }: { onClose: () => void }) {
  const { profiles, activeId } = useProfileStore();
  
  const [code, setCode] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(profiles.find(p => p.id === activeId)?.isAdmin || false);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState<'players' | 'statuses'>('players');
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [newPrefix, setNewPrefix] = useState('');

  const handleLogin = () => {
    if (code === ADMIN_CODE) {
      setIsAuthorized(true);
      setError(false);
      showToast('Вы вошли как администратор!', 'success');
    } else {
      setError(true);
      showToast('Неверный код доступа', 'error');
    }
  };

  const applyPrefix = () => {
    if (!selectedProfile) return;
    
    const updatedProfiles = profiles.map(p => 
      p.id === selectedProfile.id ? { ...p, prefix: newPrefix } : p
    );
    (window as any).launcher.saveProfiles(updatedProfiles);
    
    showToast(`Префикс "${newPrefix}" выдан игроку ${selectedProfile.name}`, 'success');
    setSelectedProfile(null);
    setNewPrefix('');
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-10">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-2xl h-[600px] bg-[#1a1a1f] border border-red-500/30 rounded-3xl shadow-2xl flex overflow-hidden"
      >
        <div className="w-56 bg-black/40 p-4 border-r border-white/10 flex flex-col gap-2">
          <div className="flex items-center gap-2 mb-4 px-2">
            <Shield className="text-red-400" size={24} />
            <h2 className="text-xl font-bold text-red-400">Админ</h2>
          </div>
          
          {isAuthorized ? (
            <>
              <button 
                onClick={() => setActiveTab('players')}
                className={`flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${activeTab === 'players' ? 'bg-red-500/20 text-red-400' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
              >
                <Users size={18} /> Игроки
              </button>
              <button 
                onClick={() => setActiveTab('statuses')}
                className={`flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${activeTab === 'statuses' ? 'bg-red-500/20 text-red-400' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
              >
                <Activity size={18} /> Статусы
              </button>
            </>
          ) : (
            <div className="text-gray-500 text-sm px-2">Введите код для доступа</div>
          )}

          <button onClick={onClose} className="mt-auto flex items-center gap-2 p-3 text-gray-400 hover:text-white transition-colors">
            <X size={18} /> Закрыть
          </button>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          {!isAuthorized ? (
            <div className="h-full flex flex-col items-center justify-center">
              <Shield size={48} className="text-red-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-4">Доступ запрещён</h3>
              <p className="text-gray-400 mb-6 text-center">Введите секретный код, чтобы открыть панель.</p>
              <input
                type="password"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="Код доступа..."
                className={`w-full max-w-xs bg-black/40 border ${error ? 'border-red-500' : 'border-white/10'} rounded-xl p-3 text-white text-center outline-none mb-3`}
              />
              <button onClick={handleLogin} className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-colors">
                Войти
              </button>
            </div>
          ) : (
            <>
              {activeTab === 'players' && (
                <div>
                  <h3 className="text-lg font-bold text-white mb-4">Выдать префикс</h3>
                  
                  {selectedProfile ? (
                    <div className="bg-white/5 p-4 rounded-xl border border-white/10 mb-4">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-lg font-bold">
                          {selectedProfile.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-white">{selectedProfile.name}</div>
                          <div className="text-xs text-gray-400">Текущий префикс: {selectedProfile.prefix || 'Нет'}</div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newPrefix}
                          onChange={(e) => setNewPrefix(e.target.value)}
                          placeholder="Например: [ADMIN]"
                          className="flex-1 bg-black/40 border border-white/10 rounded-xl p-2 text-white outline-none"
                        />
                        <button onClick={applyPrefix} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl">
                          Выдать
                        </button>
                        <button onClick={() => setSelectedProfile(null)} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl">
                          Отмена
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {profiles.map(p => (
                        <button
                          key={p.id}
                          onClick={() => { setSelectedProfile(p); setNewPrefix(p.prefix || ''); }}
                          className="w-full flex items-center justify-between bg-white/5 hover:bg-white/10 p-3 rounded-xl border border-white/10 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm">
                              {p.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="text-left">
                              <div className="font-bold text-white">{p.name}</div>
                              <div className="text-xs text-gray-400">Префикс: {p.prefix || 'Нет'}</div>
                            </div>
                          </div>
                          <Tag size={16} className="text-gray-400" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'statuses' && (
                <div>
                  <h3 className="text-lg font-bold text-white mb-4">Статусы игроков</h3>
                  <div className="space-y-2">
                    {profiles.map(p => (
                      <div key={p.id} className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/10">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm">
                            {p.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-white">{p.name}</div>
                            <div className="text-xs text-gray-400">{p.prefix || 'Без префикса'}</div>
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                          p.status === 'online' ? 'bg-green-500/20 text-green-400' :
                          p.status === 'playing' ? 'bg-blue-500/20 text-blue-400' :
                          p.status === 'dnd' ? 'bg-red-500/20 text-red-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {p.status === 'online' ? 'В сети' : 
                           p.status === 'playing' ? 'Играет' : 
                           p.status === 'dnd' ? 'Не беспокоить' : 'Оффлайн'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}