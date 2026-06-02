import React from 'react';
import { Sparkles, BrainCircuit, ChevronRight } from 'lucide-react';
import { useData } from '../context/DataContext';

export default function Rekomendasi() {
  const { applicants, jobs } = useData();

  // Sort by match score descending
  const rankedApplicants = [...applicants]
    .filter(a => a.status === 'Menunggu') // Only recommend those not yet processed
    .sort((a, b) => b.matchScore - a.matchScore);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Sparkles className="text-yellow-500" />
          Rekomendasi Kandidat AI
        </h2>
        <p className="text-gray-500 text-sm mt-1">Sistem AI mengurutkan pelamar berdasarkan tingkat kecocokan CV dengan requirement lowongan.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {rankedApplicants.length === 0 ? (
           <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-white to-yellow-50/30">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-500 mb-4 shadow-inner">
              <Sparkles size={40} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Tidak ada rekomendasi baru</h3>
            <p className="text-gray-500 text-sm max-w-md mx-auto">Semua pelamar telah diproses atau belum ada pelamar baru yang masuk.</p>
          </div>
        ) : (
          <div className="p-6">
            <div className="space-y-4">
              {rankedApplicants.map((app, index) => {
                const job = jobs.find(j => j.id === app.jobId);
                return (
                  <div key={app.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-yellow-200 hover:shadow-sm transition-all bg-gradient-to-r from-white to-yellow-50/10">
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                        ${index === 0 ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-500'}
                      `}>
                        #{index + 1}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{app.name}</h4>
                        <p className="text-sm text-gray-500">Melamar: {job?.title}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-sm font-medium text-gray-500 mb-1">
                           <BrainCircuit size={14} /> AI Match Score
                        </div>
                        <div className="text-xl font-bold text-green-600">
                          {app.matchScore}%
                        </div>
                      </div>
                      <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                        <ChevronRight size={20} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
