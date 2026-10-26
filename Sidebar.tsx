import React from 'react';
import { Home, Search, Library, Settings as SettingsIcon, User } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenSettings: () => void;
  onOpenProfiles: () => void;
}

export default function Sidebar({ activeTab, setActiveTab, onOpenSettings, onOpenProfiles }: SidebarProps) {
  const items = [
    { id: 'home', icon: Home, label: 'Главная' },
    { id: 'search', icon: Search, label: 'Поиск' },
    { id: 'library', icon: Library, label: 'Библиотека' },
  ];

  return (
    <aside className="w-20 shrink-0 flex flex-col items-center py-6 gap-6 border-r border-black/5 dark:border-white/5 bg-white/50 dark:bg-black/20 transition-colors">
      {items.map((item) => (
        <button 
          key={item.id} 
          onClick={() => setActiveTab(item.id)}
          className={`p-3 rounded-xl transition-all ${activeTab === item.id ? 'bg-blue-600/20 text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5'}`}
        >
          <item.icon size={22} />
        </button>
      ))}
      
      <div className="mt-auto flex flex-col gap-4">
        <button onClick={onOpenProfiles} className="p-3 rounded-xl text-gray-500 hover:text-gray-800 dark:hover:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 transition-all" title="Профиль">
          <User size={22} />
        </button>
        <button onClick={onOpenSettings} className="p-3 rounded-xl text-gray-500 hover:text-gray-800 dark:hover:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 transition-all" title="Настройки">
          <SettingsIcon size={22} />
        </button>
      </div>
    </aside>
  );
}