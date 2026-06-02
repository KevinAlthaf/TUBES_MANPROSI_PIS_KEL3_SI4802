import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { X, Send, User } from 'lucide-react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useData } from '../context/DataContext';

export default function MainLayout() {
  const { isChatOpen, setIsChatOpen, supportMessages, addSupportMessage } = useData();
  const [chatMessage, setChatMessage] = useState('');

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    
    // HRD sends message
    addSupportMessage(chatMessage, 'HRD');
    setChatMessage('');
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#F8F9FA] p-8">
          <Outlet />
        </main>
        <footer className="py-4 px-8 text-right text-xs text-gray-400 bg-[#F8F9FA]">
          © 2026 JobPortal · Persyaratan & Kebijakan Privasi · Halaman Informasi
        </footer>

        {/* Floating Chat Widget */}
        {isChatOpen && (
          <div className="fixed bottom-6 right-6 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden z-50 animate-in slide-in-from-bottom-5">
            <div className="bg-green-500 p-4 flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <User size={16} />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Support Operator</h4>
                  <p className="text-xs text-green-100">Online</p>
                </div>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="hover:bg-white/20 p-1 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="h-80 p-4 overflow-y-auto bg-gray-50 space-y-3">
              {supportMessages.map((msg, idx) => {
                const isUser = msg.senderRole === 'HRD';
                return (
                  <div key={msg.id || idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                      isUser ? 'bg-green-500 text-white rounded-tr-sm' : 'bg-white border border-gray-100 text-gray-700 rounded-tl-sm shadow-sm'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                );
              })}
            </div>

            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-100 flex gap-2">
              <input 
                type="text" 
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Ketik pesan Anda..." 
                className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-green-500"
              />
              <button type="submit" className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center hover:bg-green-600 transition-colors shrink-0">
                <Send size={16} className="-ml-0.5 mt-0.5" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
