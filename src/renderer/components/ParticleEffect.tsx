import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useSettingsStore } from '../store/useSettingsStore';

export default function ParticleEffect() {
  const { settings } = useSettingsStore();
  const [particles, setParticles] = useState<{ id: number; x: number; size: number; duration: number; delay: number; rotation: number }[]>([]);

  useEffect(() => {
    const count = settings.particlesCount || 50;
    const newParticles = Array.from({ length: count }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      size: Math.random() * 8 + 4,
      duration: (Math.random() * 10 + 10) / (settings.particlesSpeed || 1),
      delay: Math.random() * 5,
      rotation: Math.random() * 360,
    }));
    setParticles(newParticles);
  }, [settings.particlesCount, settings.particlesSpeed]);

  if (settings.particlesType === 'none' || !settings.particlesType) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
      {particles.map(p => {
        const commonProps = {
          key: p.id,
          className: "absolute",
          initial: { y: '-10%', opacity: 0 },
          animate: { 
            y: '110%', 
            opacity: [0, 1, 1, 0],
            rotate: p.rotation,
            x: [0, Math.random() * 40 - 20]
          },
          transition: { 
            duration: p.duration, 
            repeat: Infinity, 
            delay: p.delay,
            ease: 'linear' as const
          },
          style: { left: `${p.x}%`, top: 0, willChange: 'transform' }
        };

        if (settings.particlesType === 'stars') {
          return (
            <motion.div {...commonProps}>
              <svg width={p.size} height={p.size} viewBox="0 0 24 24" fill="white" style={{ filter: 'drop-shadow(0 0 4px white)' }}>
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </motion.div>
          );
        }
        if (settings.particlesType === 'snow') {
          return (
            <motion.div {...commonProps} className="absolute bg-white rounded-full" style={{ width: p.size, height: p.size, left: `${p.x}%`, opacity: 0.7 }} />
          );
        }
        if (settings.particlesType === 'sakura') {
          return (
            <motion.div {...commonProps}>
              <svg width={p.size * 1.5} height={p.size * 1.5} viewBox="0 0 24 24" fill="#fbcfe8">
                <path d="M12 2C12 2 14 6 14 8C14 10 12 12 12 12C12 12 10 10 10 8C10 6 12 2 12 2Z" />
                <path d="M12 22C12 22 14 18 14 16C14 14 12 12 12 12C12 12 10 14 10 16C10 18 12 22 12 22Z" />
                <path d="M2 12C2 12 6 10 8 10C10 10 12 12 12 12C12 12 10 14 8 14C6 14 2 12 2 12Z" />
                <path d="M22 12C22 12 18 10 16 10C14 10 12 12 12 12C12 12 14 14 16 14C18 14 22 12 22 12Z" />
              </svg>
            </motion.div>
          );
        }
        if (settings.particlesType === 'rain') {
          return (
            <motion.div {...commonProps} className="absolute bg-blue-300/50" style={{ width: 2, height: p.size * 3, left: `${p.x}%` }} />
          );
        }
        if (settings.particlesType === 'sparks') {
          return (
            <motion.div {...commonProps} className="absolute rounded-full bg-yellow-400 blur-[1px]" style={{ width: p.size, height: p.size, left: `${p.x}%`, boxShadow: '0 0 10px yellow' }} />
          );
        }
        return null;
      })}
    </div>
  );
}