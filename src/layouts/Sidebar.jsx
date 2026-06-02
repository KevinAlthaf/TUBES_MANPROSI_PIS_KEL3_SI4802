import React from 'react';
import { LayoutDashboard, Briefcase, Users, Calendar, Sparkles, Settings, Info, MessageCircle, Plus, FileQuestion } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setIsChatOpen } = useData();
  
  const menuItems = user?.role === 'Operator' ? [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: FileQuestion, label: 'Kelola Psikotes', path: '/kelola-psikotes' },
    { icon: MessageCircle, label: 'Pesan Bantuan', path: '/pesan-support' },
  ] : [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Briefcase, label: 'Lowongan', path: '/lowongan' },
    { icon: Users, label: 'Pelamar', path: '/data-pelamar' },
    { icon: Calendar, label: 'Kelola Wawancara', path: '/wawancara' },
    { icon: Sparkles, label: 'Rekomendasi Kandidat', path: '/rekomendasi' },
  ];

  const bottomItems = [
    { icon: Settings, label: 'Pengaturan Akun', path: '/pengaturan' },
    { icon: Info, label: 'Halaman Informasi', path: '/informasi' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0">
      {/* Logo Area */}
      <div className="p-6">
        <div className="flex items-center gap-2 text-blue-600 font-bold text-xl">
          <Sparkles className="text-orange-500 fill-orange-500" />
          <span>JobPortal</span>
        </div>
      </div>

      {/* User Info Snippet */}
      <div className="px-6 pb-6">
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
              {user?.role === 'HRD' ? user.companyInfo?.name?.charAt(0).toUpperCase() || 'H' : 'O'}
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">
                {user?.role === 'HRD' ? (user.companyInfo?.name || 'HRD') : 'Operator'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Create Button (Only for HRD) */}
      {user?.role === 'HRD' && (
        <div className="px-6 pb-4">
          <button 
            onClick={() => navigate('/lowongan', { state: { openModal: true } })}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Plus size={18} />
            Buat Lowongan
          </button>
        </div>
      )}

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.label}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-8 pt-4 border-t border-gray-100">
          <ul className="space-y-1">
            {bottomItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.label}>
                  <Link
                    to={item.path}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
                  >
                    <Icon size={18} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
            
            {/* Hubungi Support Action (Only for HRD) */}
            {user?.role === 'HRD' && (
              <li>
                <button
                  onClick={() => setIsChatOpen(true)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  <MessageCircle size={18} />
                  Hubungi Support
                </button>
              </li>
            )}
          </ul>
        </div>
      </div>
    </aside>
  );
}
