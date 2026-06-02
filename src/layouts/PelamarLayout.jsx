import React, { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, Sparkles, ChevronDown, FileText } from 'lucide-react';

export default function PelamarLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-white h-16 border-b border-gray-200 flex items-center justify-between px-6 lg:px-12 sticky top-0 z-50">
        <Link to="/pelamar/dashboard" className="flex items-center gap-2">
          <div className="flex items-center">
            <span className="text-2xl font-bold text-orange-500">*</span>
            <span className="text-xl font-bold text-blue-600">kitalulus</span>
          </div>
        </Link>

        <div className="flex items-center gap-6">
          <span className="text-sm font-medium text-gray-700 hidden md:block">Lowongan Kerja</span>
          
          <div className="relative">
            <button 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 hover:bg-gray-50 p-1.5 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm">
                {user?.name?.charAt(0).toUpperCase() || 'P'}
              </div>
              <span className="text-sm font-medium text-gray-700 max-w-[100px] truncate">{user?.name || 'Pelamar'}</span>
              <ChevronDown size={16} className="text-gray-500" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1">
                <Link 
                  to="/pelamar/profile"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                >
                  <User size={16} />
                  Profil Saya
                </Link>
                <div className="py-2 border-b border-gray-100">
                  <Link to="/pelamar/status-lamaran" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                    <FileText size={16} />
                    Status Lamaran
                  </Link>
                </div>
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left"
                >
                  <LogOut size={16} />
                  Keluar
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full bg-white">
        <Outlet />
      </main>
      
      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 py-6 text-center text-sm text-gray-500">
        <p>&copy; 2026 KitaLulus Clone. All rights reserved.</p>
      </footer>
    </div>
  );
}
