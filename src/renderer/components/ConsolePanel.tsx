import React, { useEffect, useState, useRef } from 'react';
import { Terminal, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { LogLine } from '../../shared/types';

export default function ConsolePanel() {
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = window.launcher.onLaunchLog((line) => {
      setLogs(prev => [...prev.slice(-300), line]);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (isOpen) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, isOpen]);

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="absolute bottom-6 right-6 p-3 bg-black/80 hover:bg-black text-white rounded-full shadow-lg transition-colors z-40 border border-white/20"
            title="Открыть консоль"
          >
            <Terminal size={20} />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute bottom-6 right-6 w-[600px] h-64 bg-black/95 rounded-2xl border border-white/20 shadow-2xl flex flex-col z-50 overflow-hidden"
          >
            <div className="flex justify-between items-center p-2 bg-white/5 border-b border-white/10">
              <span className="text-xs font-semibold text-gray-300 ml-2">Консоль</span>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/20 rounded text-gray-400">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 p-2 overflow-y-auto font-mono text-[11px]">
              {logs.length === 0 && <div className="text-gray-500">Консоль пуста...</div>}
              {logs.map((l, i) => (
                <div key={i} className={l.type === 'stderr' ? 'text-red-400' : 'text-green-400'}>
                  {l.line}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}