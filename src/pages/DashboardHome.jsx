import React from 'react';
import StatCard from '../components/StatCard';

export default function DashboardHome() {
  return (
    <div className="space-y-6">
      
      {/* Top Banner & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Welcome Banner */}
        <div className="bg-[#EBF3FB] rounded-2xl p-8 flex flex-col justify-center border border-blue-50">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Selamat datang!</h2>
          <p className="text-gray-600 text-sm">Yuk, kelola lowongan & proses lamaran yang masuk.</p>
        </div>

        {/* Stat Cards */}
        <StatCard title="Lamaran baru" count="0" illustrationType="new" />
        <StatCard title="Lamaran belum diproses" count="0" illustrationType="unprocessed" />
        
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Table 1 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 min-h-[300px] flex flex-col">
          <h3 className="font-bold text-gray-900 mb-4">Daftar lowongan dengan pelamar terbanyak yang perlu segera Anda proses</h3>
          <div className="bg-yellow-50 rounded-t-xl grid grid-cols-2 p-3 text-sm font-medium text-gray-700">
            <div>Lowongan</div>
            <div className="text-right">Jumlah</div>
          </div>
          <div className="flex-1 flex items-center justify-center border border-t-0 border-gray-100 rounded-b-xl bg-gray-50/30">
            <p className="text-gray-400 text-sm">Belum ada data</p>
          </div>
        </div>

        {/* Table 2 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 min-h-[300px] flex flex-col">
          <h3 className="font-bold text-gray-900 mb-4">Daftar lowongan dengan pelamar terseleksi paling banyak</h3>
          <div className="bg-green-100 rounded-t-xl grid grid-cols-2 p-3 text-sm font-medium text-gray-700">
            <div>Lowongan</div>
            <div className="text-right">Jumlah</div>
          </div>
          <div className="flex-1 flex items-center justify-center border border-t-0 border-gray-100 rounded-b-xl bg-gray-50/30">
            <p className="text-gray-400 text-sm">Belum ada data</p>
          </div>
        </div>

      </div>
    </div>
  );
}
