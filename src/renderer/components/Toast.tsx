import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';
export interface ToastMessage {
  id: number;
  type: ToastType;
  text: string;
}

let toastListeners: ((toasts: ToastMessage[]) => void)[] = [];
let toasts: ToastMessage[] = [];
let nextId = 1;

export function showToast(text: string, type: ToastType = 'info') {
  const toast: ToastMessage = { id: nextId++, type, text };
  toasts = [...toasts, toast];
  toastListeners.forEach(l => l(toasts));
  
  setTimeout(() => {
    toasts = toasts.filter(t => t.id !== toast.id);
    toastListeners.forEach(l => l(toasts));
  }, 4000);
}

export default function Toast() {
  const [list, setList] = useState<ToastMessage[]>([]);

  useEffect(() => {
    toastListeners.push(setList);
    return () => {
      toastListeners = toastListeners.filter(l => l !== setList);
    };
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
      <AnimatePresence>
        {list.map(t => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className={`glass px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border-l-4 ${
              t.type === 'success' ? 'border-green-500' : 
              t.type === 'error' ? 'border-red-500' : 'border-blue-500'
            }`}
          >
            {t.type === 'success' && <CheckCircle size={18} className="text-green-500" />}
            {t.type === 'error' && <AlertCircle size={18} className="text-red-500" />}
            {t.type === 'info' && <Info size={18} className="text-blue-500" />}
            <span className="text-sm text-gray-900 dark:text-white font-medium">{t.text}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}