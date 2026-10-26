import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, FolderOpen, AlertCircle } from 'lucide-react';
import { useSettingsStore } from '../store/useSettingsStore';

export default function MusicPlayer() {
  const { settings } = useSettingsStore();
  const [tracks, setTracks] = useState<{ name: string, dataUrl: string }[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const load = async () => {
      const res = await (window as any).launcher.getMusicTracks?.();
      if (res?.ok && res.data) {
        setTracks(res.data);
        if (res.data.length === 0) setError("Нет треков в папке public/music");
      } else {
        setError(res?.error || 'Ошибка загрузки музыки');
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted, currentIndex]);

  const togglePlay = async () => {
    if (!audioRef.current || tracks.length === 0) return;
    setError(null);

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        audioRef.current.load(); 
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (e: any) {
        console.error("Ошибка воспроизведения:", e);
        setError(e.name === 'NotAllowedError' ? 'Нажмите на окно' : 'Ошибка формата');
        setIsPlaying(false);
      }
    }
  };

  const nextTrack = () => {
    if (tracks.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % tracks.length);
    setIsPlaying(true);
  };

  const prevTrack = () => {
    if (tracks.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + tracks.length) % tracks.length);
    setIsPlaying(true);
  };

  useEffect(() => {
    if (audioRef.current && isPlaying) {
      audioRef.current.play().catch((e) => {
        console.error("Автовоспроизведение заблокировано:", e);
        setIsPlaying(false);
      });
    }
  }, [currentIndex]);

  const currentTrack = tracks[currentIndex];
  const trackName = currentTrack ? currentTrack.name.replace(/\.[^/.]+$/, "") : "Нет треков";

  if (!settings.enableMusic) return null;

  return (
    <div className="fixed top-1/2 right-4 -translate-y-1/2 z-[100] flex flex-col items-center gap-3 bg-[#1a1a1f]/90 backdrop-blur-md border border-white/10 p-3 rounded-2xl shadow-2xl w-28">
      
      {currentTrack && (
        <audio
          ref={audioRef}
          src={currentTrack.dataUrl}
          onEnded={nextTrack}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onError={(e) => {
            console.error("Ошибка аудио:", e);
            setError("Формат не поддерживается");
          }}
        />
      )}

      <div className="w-full text-center px-1">
        <span className="text-[11px] font-bold text-white break-words line-clamp-3 leading-tight" title={trackName}>
          {trackName}
        </span>
        <span className="text-[9px] text-gray-400 block mt-1">Фоновая музыка</span>
      </div>

      {error && (
        <div className="text-[9px] text-red-400 text-center flex items-center justify-center gap-1 px-1">
          <AlertCircle size={10} /> {error}
        </div>
      )}

      <div className="flex flex-col items-center gap-1 w-full">
        <button onClick={prevTrack} className="p-2 text-gray-400 hover:text-white transition-colors" title="Предыдущий">
          <SkipBack size={18} fill="currentColor" />
        </button>
        <button 
          onClick={togglePlay} 
          disabled={tracks.length === 0}
          className="p-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white rounded-full transition-colors my-1"
        >
          {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
        </button>
        <button onClick={nextTrack} className="p-2 text-gray-400 hover:text-white transition-colors" title="Следующий">
          <SkipForward size={18} fill="currentColor" />
        </button>
      </div>

      <div className="flex flex-col items-center gap-2 w-full border-t border-white/10 pt-3">
        <button onClick={() => setIsMuted(!isMuted)} className="text-gray-400 hover:text-white transition-colors">
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
        
        <div className="w-full h-16 flex items-center justify-center">
          <input 
            type="range" 
            min="0" max="1" step="0.01" 
            value={volume} 
            onChange={(e) => {
              setVolume(parseFloat(e.target.value));
              if (isMuted) setIsMuted(false);
            }}
            className="w-16 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-500 rotate-[-90deg]"
          />
        </div>

        <button 
          onClick={() => (window as any).launcher.openMusicFolder?.()} 
          className="p-2 text-gray-400 hover:text-white transition-colors" 
          title="Открыть папку с музыкой"
        >
          <FolderOpen size={18} />
        </button>
      </div>
    </div>
  );
}