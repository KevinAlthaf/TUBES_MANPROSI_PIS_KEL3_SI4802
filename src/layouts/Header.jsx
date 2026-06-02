import React from 'react';
import { Clock, MessageCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

export default function Header() {
  const { user } = useAuth();
  const { setIsChatOpen } = useData();
  
  return (
    <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-end px-8 sticky top-0 z-10">
      <div className="flex items-center gap-6">
        
        <button className="flex items-center gap-2 text-blue-500 border border-blue-200 rounded-full px-4 py-2 hover:bg-blue-50 transition-colors">
          <Clock size={16} />
          <span className="text-sm font-medium">Detail Kuota</span>
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </button>

        {user?.role === 'HRD' && (
          <div 
            onClick={() => setIsChatOpen(true)}
            className="flex items-center gap-2 text-gray-600 hover:text-green-600 cursor-pointer transition-colors"
          >
            <MessageCircle size={20} className="text-green-500" />
            <span className="text-sm font-medium">Hubungi Support</span>
          </div>
        )}

        <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold shadow-md">
          {user?.role === 'HRD' ? user.companyInfo?.name?.charAt(0).toUpperCase() || 'H' : 'O'}
        </div>
      </div>
    </header>
  );
}
