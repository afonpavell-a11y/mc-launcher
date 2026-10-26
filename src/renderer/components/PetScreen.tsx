import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Utensils, Gamepad2, Droplets, Coins } from 'lucide-react';
import { useSettingsStore } from '../store/useSettingsStore';
import { playClickSound } from '../lib/sound';
import { showToast } from './Toast';

interface PetStats {
  hunger: number;
  clean: number;
  mood: number;
  coins: number;
}

const INITIAL_STATS: PetStats = { hunger: 80, clean: 80, mood: 80, coins: 0 };

const PET_MODELS = [
  { id: 'macdonald', name: 'Macdonald', file: './macdonald.glb' },
  { id: 'macdonald_mouse', name: 'Mouse', file: './macdonald_mouse.glb' },
];

const MEMES = [
  'Я не голоден, я просто хочу кушать!',
  'Дай мне печеньку 🍪',
  'Ты лучший хозяин!',
  'Погладь меня!',
  'Я устал, давай поиграем?',
  'Монетки, монетки, монетки!',
  'Я видел, как ты читеришь...',
  'Мяу? (Я вообще собака, но ладно)',
  'Покорми меня, и я стану сильнее!',
  'Ты сегодня выглядишь сонным...',
];

export default function PetScreen() {
  const { settings } = useSettingsStore();
  const [stats, setStats] = useState<PetStats>(INITIAL_STATS);
  const [petState, setPetState] = useState<'idle' | 'eating' | 'playing' | 'washing' | 'sad'>('idle');
  const [activeModel, setActiveModel] = useState(0);
  const [speech, setSpeech] = useState<string | null>(null);
  const [cooldowns, setCooldowns] = useState<{ feed: number; play: number; wash: number }>({ feed: 0, play: 0, wash: 0 });

  // Загрузка/Сохранение
  useEffect(() => {
    const saved = localStorage.getItem('pet_stats');
    if (saved) {
      try { setStats(JSON.parse(saved)); } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('pet_stats', JSON.stringify(stats));
  }, [stats]);

  // Голод/Грязь со временем
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        hunger: Math.max(0, prev.hunger - 1),
        clean: Math.max(0, prev.clean - 1),
        mood: Math.max(0, prev.mood - 1),
      }));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Эмоции
  useEffect(() => {
    if (stats.hunger < 20 || stats.clean < 20 || stats.mood < 20) {
      setPetState('sad');
    } else if (petState === 'sad') {
      setPetState('idle');
    }
  }, [stats.hunger, stats.clean, stats.mood, petState]);

  // Случайные фразы
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() < 0.3) {
        setSpeech(MEMES[Math.floor(Math.random() * MEMES.length)]);
      }
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Скрытие фразы
  useEffect(() => {
    if (speech) {
      const timer = setTimeout(() => setSpeech(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [speech]);

  // Кулдаун
  useEffect(() => {
    const interval = setInterval(() => {
      setCooldowns(prev => ({
        feed: Math.max(0, prev.feed - 1),
        play: Math.max(0, prev.play - 1),
        wash: Math.max(0, prev.wash - 1),
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = (action: 'feed' | 'play' | 'wash') => {
    if (cooldowns[action] > 0) {
      showToast(`Подожди ${cooldowns[action]} сек.`, 'error');
      return;
    }
    
    if (settings.enableSounds) playClickSound();
    
    if (action === 'feed') {
      if (stats.coins < 10) return showToast('Мало монет!', 'error');
      setStats(prev => ({ ...prev, hunger: Math.min(100, prev.hunger + 20), mood: Math.min(100, prev.mood + 5), coins: prev.coins - 10 }));
      setCooldowns(prev => ({ ...prev, feed: 5 }));
      setPetState('eating');
      setSpeech('Ням-ням! 🍔');
    } else if (action === 'play') {
      setStats(prev => ({ ...prev, mood: Math.min(100, prev.mood + 20), hunger: Math.max(0, prev.hunger - 5) }));
      setCooldowns(prev => ({ ...prev, play: 5 }));
      setPetState('playing');
      setSpeech('Ура! 🎮');
    } else if (action === 'wash') {
      if (stats.coins < 5) return showToast('Мало монет!', 'error');
      setStats(prev => ({ ...prev, clean: Math.min(100, prev.clean + 25), mood: Math.max(0, prev.mood - 5), coins: prev.coins - 5 }));
      setCooldowns(prev => ({ ...prev, wash: 8 }));
      setPetState('washing');
      setSpeech('Буль-буль! 💦');
    }

    setTimeout(() => setPetState('idle'), 1500);
  };

  const earnCoin = () => {
    if (settings.enableSounds) playClickSound();
    setStats(prev => ({ ...prev, coins: prev.coins + 1 }));
    setSpeech('Спасибо за монетку! 🪙');
  };

  return (
    <div className="p-8 max-w-4xl mx-auto h-full overflow-y-auto flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6 text-white">Мой питомец</h1>

      {/* Баланс монет */}
      <div className="flex items-center gap-2 mb-4 text-yellow-400 font-bold text-xl">
        <Coins size={24} /> {stats.coins}
      </div>

      {/* Питомец */}
      <div className="relative w-64 h-64 flex items-center justify-center mb-2">
        <div className="absolute bottom-4 w-32 h-4 bg-black/30 rounded-full blur-md" />

        {/* Речевое облачко */}
        <AnimatePresence>
          {speech && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.8 }}
              className="absolute -top-16 glass px-4 py-2 rounded-2xl rounded-bl-none text-sm text-white shadow-lg z-20"
            >
              {speech}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 3D Модель */}
        {/* @ts-ignore */}
        <model-viewer
          src={PET_MODELS[activeModel].file}
          alt="Pet"
          autoplay
          auto-rotate
          rotation-per-second={petState === 'playing' ? '180deg' : '30deg'}
          camera-controls
          disable-zoom
          class="relative z-10 w-full h-full"
          style={{ backgroundColor: 'transparent' }}
        />
      </div>

      {/* Кнопка "Клик!" */}
      <button 
        onClick={earnCoin}
        className="mb-6 bg-yellow-500 hover:bg-yellow-400 text-black px-6 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-transform hover:scale-105 z-10"
      >
        <Coins size={18} /> Клик!
      </button>

      {/* Переключатель моделей */}
      <div className="flex gap-2 mb-8">
        {PET_MODELS.map((model, idx) => (
          <button
            key={model.id}
            onClick={() => {
              if (settings.enableSounds) playClickSound();
              setActiveModel(idx);
            }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeModel === idx 
                ? 'bg-green-600 text-white shadow-lg' 
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            {model.name}
          </button>
        ))}
      </div>

      {/* Статистика */}
      <div className="w-full max-w-md space-y-4 mb-8">
        <div className="flex items-center gap-3">
          <Utensils size={20} className="text-orange-400" />
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1 text-gray-400"><span>Голод</span><span>{stats.hunger}%</span></div>
            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
              <div className="bg-orange-400 h-full transition-all" style={{ width: `${stats.hunger}%` }} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Droplets size={20} className="text-blue-400" />
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1 text-gray-400"><span>Чистота</span><span>{stats.clean}%</span></div>
            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
              <div className="bg-blue-400 h-full transition-all" style={{ width: `${stats.clean}%` }} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Heart size={20} className="text-pink-400" />
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1 text-gray-400"><span>Настроение</span><span>{stats.mood}%</span></div>
            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
              <div className="bg-pink-400 h-full transition-all" style={{ width: `${stats.mood}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Кнопки действий */}
      <div className="flex gap-4">
        <button 
          onClick={() => handleAction('feed')}
          disabled={cooldowns.feed > 0}
          className={`flex flex-col items-center gap-2 p-4 glass rounded-2xl hover:bg-white/10 transition-colors w-24 ${cooldowns.feed > 0 ? 'opacity-50' : ''}`}
        >
          <Utensils size={24} className="text-orange-400" />
          <span className="text-xs text-white">{cooldowns.feed > 0 ? `${cooldowns.feed}с` : 'Кормить'}</span>
        </button>
        <button 
          onClick={() => handleAction('play')}
          disabled={cooldowns.play > 0}
          className={`flex flex-col items-center gap-2 p-4 glass rounded-2xl hover:bg-white/10 transition-colors w-24 ${cooldowns.play > 0 ? 'opacity-50' : ''}`}
        >
          <Gamepad2 size={24} className="text-purple-400" />
          <span className="text-xs text-white">{cooldowns.play > 0 ? `${cooldowns.play}с` : 'Играть'}</span>
        </button>
        <button 
          onClick={() => handleAction('wash')}
          disabled={cooldowns.wash > 0}
          className={`flex flex-col items-center gap-2 p-4 glass rounded-2xl hover:bg-white/10 transition-colors w-24 ${cooldowns.wash > 0 ? 'opacity-50' : ''}`}
        >
          <Droplets size={24} className="text-blue-400" />
          <span className="text-xs text-white">{cooldowns.wash > 0 ? `${cooldowns.wash}с` : 'Мыть'}</span>
        </button>
      </div>
    </div>
  );
}