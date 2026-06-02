import React, { useState } from 'react';
import { FileQuestion, Plus, Trash2, Edit, UploadCloud, CheckCircle, X } from 'lucide-react';
import { useData } from '../context/DataContext';

const PREDEFINED_PACKAGES = [
  {
    id: 1,
    name: "Paket A (General Intelligence & Logic)",
    status: "Draft",
    questions: [
      { q: "Jika semua burung bisa terbang, dan Penguin adalah burung, apakah Penguin bisa terbang?", a: "Tergantung konteks definisi terbang (Pengecualian)." },
      { q: "Lanjutkan deret angka ini: 2, 4, 8, 16, ...", a: "32" },
      { q: "Bagaimana Anda menangani konflik dengan rekan kerja?", a: "Mendengarkan secara objektif dan mencari jalan tengah." }
    ]
  },
  {
    id: 2,
    name: "Paket B (Numerical & Analytical)",
    status: "Draft",
    questions: [
      { q: "Sebuah kereta melaju dengan kecepatan 80km/jam. Jarak tempuh 200km. Berapa jam waktu yang dibutuhkan?", a: "2.5 Jam" },
      { q: "Jika 5 pekerja bisa menyelesaikan proyek dalam 10 hari, berapa lama jika hanya ada 2 pekerja?", a: "25 Hari" },
      { q: "Berapa 15% dari 200?", a: "30" }
    ]
  }
];

export default function KelolaPsikotes() {
  const { addPsychotestPackage } = useData();
  const [packages, setPackages] = useState(PREDEFINED_PACKAGES);
  const [editingPackage, setEditingPackage] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleEdit = (pkg) => {
    // Clone to avoid direct mutation
    setEditingPackage(JSON.parse(JSON.stringify(pkg)));
  };

  const handleQuestionChange = (index, field, value) => {
    const updatedQs = [...editingPackage.questions];
    updatedQs[index][field] = value;
    setEditingPackage({ ...editingPackage, questions: updatedQs });
  };

  const saveEdits = () => {
    setPackages(packages.map(p => p.id === editingPackage.id ? editingPackage : p));
    setEditingPackage(null);
  };

  const handlePublish = (pkg) => {
    // "Upload" it so HR can see it
    addPsychotestPackage(pkg.name);
    setPackages(packages.map(p => p.id === pkg.id ? { ...p, status: 'Published' } : p));
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 relative">
      {showSuccess && (
        <div className="fixed top-10 right-10 bg-gray-900 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 z-50 animate-in fade-in slide-in-from-right-8 duration-300">
          <CheckCircle className="text-green-400" size={24} />
          <div>
            <p className="font-bold">Berhasil Diupload!</p>
            <p className="text-sm text-gray-300">Paket psikotes kini bisa digunakan oleh HRD.</p>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileQuestion className="text-blue-500" />
          Kelola Paket Psikotes
        </h2>
        <p className="text-gray-500 text-sm mt-1">Review, edit, dan upload paket soal psikotes agar siap digunakan HRD.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50">
          <h3 className="font-bold text-gray-900">Daftar Pre-defined Paket</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {packages.map((pkg) => (
            <div key={pkg.id} className="p-6 hover:bg-gray-50 transition-colors flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <FileQuestion size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-lg">{pkg.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-gray-500 text-sm">{pkg.questions.length} Pertanyaan</span>
                    <span className="text-gray-300">&bull;</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${pkg.status === 'Published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {pkg.status}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 w-full md:w-auto">
                <button 
                  onClick={() => handleEdit(pkg)}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium text-sm"
                >
                  <Edit size={16} /> Review & Edit
                </button>
                <button 
                  onClick={() => handlePublish(pkg)}
                  disabled={pkg.status === 'Published'}
                  className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${pkg.status === 'Published' ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                >
                  <UploadCloud size={16} /> {pkg.status === 'Published' ? 'Telah Diupload' : 'Upload ke HRD'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Modal */}
      {editingPackage && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Review & Edit Soal</h3>
                <p className="text-gray-500 text-sm mt-1">{editingPackage.name}</p>
              </div>
              <button onClick={() => setEditingPackage(null)} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-200 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-gray-50">
              {editingPackage.questions.map((item, idx) => (
                <div key={idx} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-blue-600">Soal {idx + 1}</span>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Pertanyaan</label>
                      <textarea 
                        value={item.q}
                        onChange={(e) => handleQuestionChange(idx, 'q', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium text-gray-800 bg-gray-50 focus:bg-white transition-colors"
                        rows="2"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Kunci Jawaban Benar</label>
                      <input 
                        type="text"
                        value={item.a}
                        onChange={(e) => handleQuestionChange(idx, 'a', e.target.value)}
                        className="w-full border border-green-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-green-500 text-sm font-medium text-green-800 bg-green-50 focus:bg-white transition-colors"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-white rounded-b-2xl">
              <button 
                onClick={() => setEditingPackage(null)}
                className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={saveEdits}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
