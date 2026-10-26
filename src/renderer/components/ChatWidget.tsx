import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';
import { useChatStore } from '../store/useChatStore';
import { useProfileStore } from '../store/useProfileStore';
import { useSettingsStore } from '../store/useSettingsStore';

// СЮДА ВСТАВЬ СВОЙ АДРЕС С RENDER (с wss://)
const CHAT_SERVER_URL = 'wss://твой-сервер.onrender.com';

export default function ChatWidget() {
  const { messages, addMessage } = useChatStore();
  const { profiles, activeId } = useProfileStore();
  const { settings } = useSettingsStore();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const activeProfile = profiles.find(p => p.id === activeId);

  // Подключение к серверу
  useEffect(() => {
    const ws = new WebSocket(CHAT_SERVER_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Чат: подключено к серверу');
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        addMessage(msg);
      } catch (e) {
        console.error('Ошибка парсинга сообщения:', e);
      }
    };

    ws.onclose = () => {
      console.log('Чат: отключено от сервера');
      setIsConnected(false);
    };

    ws.onerror = (err) => {
      console.error('Чат: ошибка соединения', err);
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [addMessage]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSend = () => {
    if (!input.trim() || !activeProfile || !wsRef.current) return;

    const prefix = activeProfile.prefix || (activeProfile.isAdmin ? '[ADMIN]' : '[USER]');
    
    const msg = {
      id: crypto.randomUUID(),
      authorName: activeProfile.name,
      authorPrefix: prefix,
      text: input,
      timestamp: Date.now(),
    };

    // Отправляем на сервер
    if (wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }

    setInput('');
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-24 right-4 z-[100] p-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-xl transition-transform hover:scale-110"
        title="Чат"
      >
        <MessageSquare size={24} />
        {!isConnected && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-black" title="Нет соединения" />
        )}
      </button>

      {isOpen && (
        <div className="fixed bottom-36 right-4 z-[100] w-80 h-96 bg-[#1a1a1f]/95 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          <div className="flex justify-between items-center p-3 border-b border-white/10 bg-black/20">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Чат игроков</h3>
              {!isConnected && <span className="text-[10px] text-red-400">(отключено)</span>}
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1 text-gray-400 hover:text-white">
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.length === 0 ? (
              <p className="text-gray-500 text-xs text-center mt-10">
                {isConnected ? 'Сообщений пока нет. Напишите первым!' : 'Подключение к серверу...'}
              </p>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="text-xs break-words">
                  <span 
                    className="font-bold mr-1"
                    style={{ color: msg.authorPrefix.includes('ADMIN') ? '#ef4444' : '#3b82f6' }}
                  >
                    {msg.authorPrefix}
                  </span>
                  <span className="font-bold text-white mr-1">{msg.authorName}:</span>
                  <span className="text-gray-300">{msg.text}</span>
                </div>
              ))
            )}
            <div ref={endRef} />
          </div>

          <div className="p-2 border-t border-white/10 flex gap-2 bg-black/20">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={isConnected ? "Сообщение..." : "Нет соединения"}
              disabled={!isConnected}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none disabled:opacity-50"
            />
            <button 
              onClick={handleSend}
              disabled={!isConnected}
              className="p-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white rounded-xl transition-colors"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}