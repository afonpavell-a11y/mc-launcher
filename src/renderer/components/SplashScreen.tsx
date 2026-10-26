import React from 'react';
import { motion } from 'framer-motion';
import { Box } from 'lucide-react'; // Иконка куба (можно заменить на свою)

export default function SplashScreen() {
  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0b0b0f]"
    >
      {/* Анимированный логотип */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0, rotate: -90 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ 
          type: "spring", 
          stiffness: 200, 
          damping: 20,
          delay: 0.2 
        }}
        className="relative"
      >
        {/* Свечение вокруг логотипа */}
        <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-40 rounded-full animate-pulse" />
        <Box size={100} className="text-blue-500 relative z-10 drop-shadow-[0_0_15px_rgba(59,130,246,0.8)]" />
      </motion.div>

      {/* Текст */}
      <motion.h1 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="mt-8 text-3xl font-extrabold text-white tracking-widest"
      >
        MC LAUNCHER
      </motion.h1>
      
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="mt-2 text-sm text-gray-400"
      >
        Загрузка мира...
      </motion.p>

      {/* Полоса загрузки */}
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: 200 }}
        transition={{ delay: 0.5, duration: 1.5, ease: "easeInOut" }}
        className="mt-8 h-1 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)]"
      />
    </motion.div>
  );
}