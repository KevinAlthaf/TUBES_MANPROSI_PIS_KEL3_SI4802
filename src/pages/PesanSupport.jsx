import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, User, Search } from 'lucide-react';
import { useData } from '../context/DataContext';

export default function PesanSupport() {
  const { supportMessages, addSupportMessage } = useData();
  const [hrUsers, setHrUsers] = useState([]);
  const [selectedHr, setSelectedHr] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    // Fetch all HR users for the sidebar
    fetch('http://localhost:5000/api/hr-users')
      .then(res => res.json())
      .then(data => setHrUsers(data))
      .catch(err => console.error(err));
  }, []);

  const handleReply = (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedHr) return;
    
    // addSupportMessage(text, role, targetHrId)
    addSupportMessage(replyText, 'Operator', selectedHr.id);
    setReplyText('');
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [supportMessages, selectedHr]);

  // Filter messages for the currently selected HR
  const currentMessages = selectedHr 
    ? supportMessages.filter(msg => msg.hr_id === selectedHr.id)
    : [];

  const filteredHrUsers = hrUsers.filter(hr => 
    (hr.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (hr.company_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col mt-4 mx-4 mb-4">
      <div className="flex-1 bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden flex">
        
        {/* Left Sidebar: Contacts */}
        <div className="w-80 border-r border-gray-100 flex flex-col bg-gray-50/50">
          <div className="p-5 border-b border-gray-100 bg-white">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4">
              <MessageCircle className="text-blue-600" />
              Chat HRD
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Cari HR atau Perusahaan..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-100 border-none rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {filteredHrUsers.length > 0 ? (
              filteredHrUsers.map(hr => {
                const isSelected = selectedHr?.id === hr.id;
                // Get last message snippet
                const hrMsgs = supportMessages.filter(m => m.hr_id === hr.id);
                const lastMsg = hrMsgs.length > 0 ? hrMsgs[hrMsgs.length - 1] : null;

                return (
                  <button 
                    key={hr.id}
                    onClick={() => setSelectedHr(hr)}
                    className={`w-full text-left p-4 flex items-center gap-4 transition-all hover:bg-gray-100 ${isSelected ? 'bg-blue-50/50 relative' : ''}`}
                  >
                    {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600"></div>}
                    <div className="relative shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600 flex items-center justify-center border border-blue-200">
                        <User size={22} />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <h4 className="font-bold text-gray-900 truncate pr-2">{hr.name || 'HRD Unknown'}</h4>
                        {lastMsg && (
                          <span className="text-[10px] text-gray-400 shrink-0">
                            {new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-blue-600 truncate mb-0.5">{hr.company_name || 'Tanpa Perusahaan'}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {lastMsg ? (lastMsg.senderRole === 'Operator' ? `Anda: ${lastMsg.text}` : lastMsg.text) : 'Belum ada percakapan'}
                      </p>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-8 text-center text-gray-500 text-sm flex flex-col items-center">
                <MessageCircle size={32} className="text-gray-300 mb-3" />
                <p>Tidak ada kontak HR yang ditemukan.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Content: Chat Room */}
        {selectedHr ? (
          <div className="flex-1 flex flex-col bg-[#F4F5F7] relative">
            {/* Header */}
            <div className="h-16 bg-white border-b border-gray-100 flex items-center px-6 shrink-0 shadow-sm z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600 flex items-center justify-center">
                  <User size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 leading-tight">{selectedHr.name || 'HRD Unknown'}</h3>
                  <p className="text-xs text-green-500 flex items-center gap-1.5 font-medium">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> {selectedHr.company_name || 'Online'}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {currentMessages.length > 0 ? (
                currentMessages.map((msg, idx) => {
                  const isOperator = msg.senderRole === 'Operator';
                  return (
                    <div key={idx} className={`flex ${isOperator ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] p-4 rounded-2xl text-sm shadow-sm relative group ${
                        isOperator 
                          ? 'bg-blue-600 text-white rounded-br-sm' 
                          : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm'
                      }`}>
                        <p className="leading-relaxed">{msg.text}</p>
                        <span className={`text-[10px] mt-2 block font-medium ${isOperator ? 'text-blue-200 text-right' : 'text-gray-400 text-left'}`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="bg-white/60 px-6 py-3 rounded-full text-sm text-gray-500 font-medium">
                    Belum ada riwayat pesan. Kirim pesan untuk memulai!
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-100 shrink-0">
              <form onSubmit={handleReply} className="flex items-end gap-3 bg-gray-50 p-2 rounded-2xl border border-gray-200 transition-colors focus-within:border-blue-300 focus-within:bg-white">
                <textarea 
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleReply(e);
                    }
                  }}
                  placeholder="Ketik balasan Anda di sini... (Tekan Enter untuk kirim)" 
                  className="flex-1 bg-transparent border-none px-3 py-2 focus:ring-0 resize-none max-h-32 text-sm outline-none"
                  rows="1"
                />
                <button 
                  type="submit" 
                  disabled={!replyText.trim()}
                  className="w-10 h-10 shrink-0 rounded-xl bg-blue-600 text-white flex items-center justify-center disabled:opacity-50 disabled:bg-gray-300 hover:bg-blue-700 transition-colors mb-0.5"
                >
                  <Send size={18} className="-ml-0.5" />
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-[#F4F5F7] text-gray-400">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <MessageCircle size={40} className="text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-600 mb-2">Pilih Obrolan</h3>
            <p className="text-sm max-w-sm text-center">Pilih salah satu kontak HRD dari panel sebelah kiri untuk melihat riwayat pesan dan mulai membalas.</p>
          </div>
        )}

      </div>
    </div>
  );
}
