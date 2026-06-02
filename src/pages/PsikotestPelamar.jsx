import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, ChevronRight, BrainCircuit } from 'lucide-react';

export default function PsikotestPelamar() {
  const { id } = useParams(); // applicant id
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    nama: user?.name || '',
    usia: '',
    jenisKelamin: '',
    pendidikan: ''
  });
  
  const handleSubmitData = (e) => {
    e.preventDefault();
    setStep(2);
  };

  const handleFinishTest = () => {
    // In a real app we'd submit the score to the backend
    setStep(3);
  };

  if (step === 1) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
              <BrainCircuit size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Data Diri Psikotest</h2>
              <p className="text-gray-500">Lengkapi data diri sebelum memulai tes.</p>
            </div>
          </div>
          
          <form onSubmit={handleSubmitData} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
              <input 
                type="text" required 
                value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})}
                className="w-full border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 p-2.5 border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Usia</label>
              <input 
                type="number" required 
                value={formData.usia} onChange={e => setFormData({...formData, usia: e.target.value})}
                className="w-full border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 p-2.5 border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Kelamin</label>
              <select required value={formData.jenisKelamin} onChange={e => setFormData({...formData, jenisKelamin: e.target.value})} className="w-full border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 p-2.5 border">
                <option value="">Pilih</option>
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pendidikan Terakhir</label>
              <select required value={formData.pendidikan} onChange={e => setFormData({...formData, pendidikan: e.target.value})} className="w-full border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 p-2.5 border">
                <option value="">Pilih</option>
                <option value="SMA">SMA/SMK</option>
                <option value="D3">D3</option>
                <option value="S1">S1</option>
                <option value="S2">S2</option>
              </select>
            </div>
            <button type="submit" className="w-full mt-6 bg-purple-600 text-white py-3 rounded-xl font-medium hover:bg-purple-700 flex items-center justify-center gap-2">
              Mulai Tes <ChevronRight size={18} />
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Simulasi Psikotest</h2>
          <p className="text-gray-500 mb-8">Pilih jawaban yang paling sesuai dengan Anda. (Simulasi)</p>
          
          <div className="space-y-8">
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-4">1. Jika Anda menghadapi tenggat waktu yang ketat, apa yang Anda lakukan?</h3>
              <div className="space-y-2">
                {['Mengerjakan sendiri agar cepat selesai', 'Membagi tugas dengan tim', 'Meminta perpanjangan waktu', 'Mengerjakan seadanya yang penting selesai'].map((opt, i) => (
                  <label key={i} className="flex items-center p-3 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-purple-50 hover:border-purple-200 transition-colors">
                    <input type="radio" name="q1" className="w-4 h-4 text-purple-600 focus:ring-purple-500" />
                    <span className="ml-3 text-gray-700 text-sm">{opt}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-4">2. Bagaimana reaksi Anda ketika mendapat kritik dari atasan?</h3>
              <div className="space-y-2">
                {['Menerima dan berusaha memperbaiki', 'Merasa down dan kehilangan motivasi', 'Membela diri karena merasa benar', 'Mengabaikannya'].map((opt, i) => (
                  <label key={i} className="flex items-center p-3 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-purple-50 hover:border-purple-200 transition-colors">
                    <input type="radio" name="q2" className="w-4 h-4 text-purple-600 focus:ring-purple-500" />
                    <span className="ml-3 text-gray-700 text-sm">{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-8 flex justify-end">
            <button onClick={handleFinishTest} className="bg-purple-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-purple-700">
              Selesai & Kirim
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-6 py-24 text-center">
      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 size={48} className="text-green-500" />
      </div>
      <h2 className="text-3xl font-bold text-gray-900 mb-4">Terima Kasih!</h2>
      <p className="text-gray-500 mb-8">Anda telah menyelesaikan tahap psikotes. Hasil akan dievaluasi oleh tim HRD kami. Silakan tunggu informasi selanjutnya melalui halaman Status Lamaran.</p>
      <button onClick={() => navigate('/pelamar/status-lamaran')} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-blue-700 shadow-lg shadow-blue-200">
        Kembali ke Status Lamaran
      </button>
    </div>
  );
}
