import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export default function ProgressOverlay() {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 100, message: 'Подготовка...' });

  useEffect(() => {
    const removeListener = window.launcher.onLaunchProgress((data) => {
      // Если игра запустилась или закрылась — СКРЫВАЕМ оверлей
      if (data.stage === 'running' || data.stage === 'exited') {
        setVisible(false);
      } else {
        // Иначе показываем и обновляем прогресс
        setVisible(true);
        setProgress({
          current: data.current || 0,
          total: data.total || 100,
          message: data.message || 'Загрузка...'
        });
      }
    });

    return () => removeListener();
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-[#1a1a1f] border border-white/10 p-8 rounded-3xl shadow-2xl w-96 text-center"
          >
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">{progress.message}</h2>
            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden mt-6">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${Math.min(100, (progress.current / progress.total) * 100)}%` }}
              />
            </div>
            <p className="text-gray-400 text-sm mt-3">
              {progress.current} / {progress.total} ({Math.round((progress.current / progress.total) * 100)}%)
            </p>
            <p className="text-xs text-gray-500 mt-4">Пожалуйста, подождите...</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}