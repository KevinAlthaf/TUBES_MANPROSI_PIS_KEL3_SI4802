import React, { useState, useEffect } from 'react';
import { FileQuestion, Plus, Trash2, Edit, X, Check, Upload, CheckCircle } from 'lucide-react';
import { useData } from '../context/DataContext';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export default function KelolaPsikotes() {
  const { addPsychotestPackage } = useData();
  const [packages, setPackages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingPackage, setEditingPackage] = useState(null);
  const [newPackageName, setNewPackageName] = useState('');
  
  // Question Form State
  const [newQuestionText, setNewQuestionText] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');
  const [newCorrectAnswer, setNewCorrectAnswer] = useState('A');

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage('');
    }, 3000);
  };

  const handlePublishPackage = async (id, name) => {
    if (!window.confirm(`Apakah Anda yakin ingin mengupload paket "${name}" ke HRD? Setelah diupload, paket ini akan dipublikasikan dan dapat digunakan oleh HRD.`)) return;
    
    try {
      const res = await fetch(`${API_URL}/packages-full/${id}/publish`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (res.ok) {
        setPackages(prev => prev.map(p => p.id === id ? { ...p, status: 'published' } : p));
        if (editingPackage && editingPackage.id === id) {
          setEditingPackage(prev => ({ ...prev, status: 'published' }));
        }
        showToast(`Paket "${name}" berhasil diupload ke HRD!`);
      } else {
        showToast("Gagal mengupload paket ke HRD.");
      }
    } catch (error) {
      console.error(error);
      showToast("Koneksi backend gagal.");
    }
  };

  // Fetch Packages with questions on mount
  const fetchPackages = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/packages-full`);
      if (res.ok) {
        const data = await res.json();
        setPackages(data);
      } else {
        showToast("Gagal mengambil data paket psikotes.");
      }
    } catch (error) {
      console.error("Error fetching packages:", error);
      showToast("Koneksi ke backend gagal.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handleCreatePackage = async (e) => {
    e.preventDefault();
    if (!newPackageName.trim()) return;

    try {
      const res = await fetch(`${API_URL}/packages-full`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newPackageName.trim() })
      });

      if (res.ok) {
        const newPkg = await res.json();
        setPackages(prev => [newPkg, ...prev]);
        setNewPackageName('');
        showToast("Paket baru berhasil dibuat!");
      } else {
        const err = await res.json();
        alert("Gagal membuat paket: " + (err.error || "Terjadi kesalahan"));
      }
    } catch (error) {
      console.error(error);
      showToast("Koneksi backend gagal.");
    }
  };

  const handleDeletePackage = async (id, name) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus paket "${name}"? Semua pertanyaan di dalamnya akan ikut terhapus.`)) return;

    try {
      const res = await fetch(`${API_URL}/packages-full/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setPackages(prev => prev.filter(p => p.id !== id));
        showToast("Paket berhasil dihapus.");
        if (editingPackage && editingPackage.id === id) {
          setEditingPackage(null);
        }
      } else {
        showToast("Gagal menghapus paket.");
      }
    } catch (error) {
      console.error(error);
      showToast("Koneksi backend gagal.");
    }
  };

  const handleAddQuestion = async (packageId) => {
    if (!newQuestionText.trim()) {
      alert("Teks pertanyaan tidak boleh kosong.");
      return;
    }
    if (!optionA.trim() || !optionB.trim() || !optionC.trim() || !optionD.trim()) {
      alert("Semua pilihan ganda (A, B, C, D) harus diisi.");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/packages-full/${packageId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionText: newQuestionText.trim(),
          correctAnswer: newCorrectAnswer,
          options: [optionA.trim(), optionB.trim(), optionC.trim(), optionD.trim()]
        })
      });

      if (res.ok) {
        const newQuestion = await res.json();
        
        // Update local states
        setEditingPackage(prev => ({
          ...prev,
          questions: [...prev.questions, newQuestion]
        }));
        setPackages(prev => prev.map(p => p.id === packageId ? { ...p, questions: [...p.questions, newQuestion] } : p));
        
        setNewQuestionText('');
        setOptionA('');
        setOptionB('');
        setOptionC('');
        setOptionD('');
        setNewCorrectAnswer('A');
        showToast("Pertanyaan pilihan ganda berhasil ditambahkan!");
      } else {
        showToast("Gagal menyimpan pertanyaan.");
      }
    } catch (error) {
      console.error(error);
      showToast("Koneksi backend gagal.");
    }
  };

  const handleDeleteQuestion = async (packageId, questionId) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus pertanyaan ini?")) return;

    try {
      const res = await fetch(`${API_URL}/questions-full/${questionId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setEditingPackage(prev => ({
          ...prev,
          questions: prev.questions.filter(q => q.id !== questionId)
        }));
        setPackages(prev => prev.map(p => p.id === packageId ? { ...p, questions: p.questions.filter(q => q.id !== questionId) } : p));
        showToast("Pertanyaan berhasil dihapus.");
      } else {
        showToast("Gagal menghapus pertanyaan.");
      }
    } catch (error) {
      console.error(error);
      showToast("Koneksi backend gagal.");
    }
  };

  return (
    <div className="space-y-6 relative">
      {toastMessage && (
        <div className="fixed bottom-5 right-5 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <Check size={18} className="text-green-400" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileQuestion className="text-blue-500" />
          Kelola Paket Psikotes
        </h2>
        <p className="text-gray-500 text-sm mt-1">Buat, kelola, dan tambahkan pertanyaan pilihan ganda psikotes untuk pelamar kerja.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Create Form */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm sticky top-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Buat Paket Soal Baru</h3>
            <form onSubmit={handleCreatePackage} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Nama Label Soal</label>
                <input 
                  type="text" 
                  value={newPackageName}
                  onChange={(e) => setNewPackageName(e.target.value)}
                  placeholder="Contoh: SOAL MATEMATIKA"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                  required
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <Plus size={18} />
                Buat Paket
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Packages List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-bold text-gray-900">Daftar Paket Psikotes</h3>
            </div>
            {isLoading ? (
              <div className="p-8 text-center text-gray-500 text-sm">Loading data paket...</div>
            ) : packages.length === 0 ? (
              <div className="p-16 text-center text-gray-500">
                <FileQuestion size={40} className="mx-auto mb-3 text-gray-300" />
                <p className="font-semibold text-gray-600">Belum ada paket soal</p>
                <p className="text-xs text-gray-400 mt-1">Gunakan panel di samping untuk membuat paket baru.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {packages.map((pkg) => (
                  <div key={pkg.id} className="p-6 hover:bg-gray-50/50 transition-colors flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <FileQuestion size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-950 text-base">{pkg.name}</h4>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          <span className="text-gray-550 text-xs font-semibold bg-gray-100 px-2 py-0.5 rounded-md">
                            {pkg.questions?.length || 0} Pertanyaan
                          </span>
                          {pkg.status === 'published' ? (
                            <span className="inline-flex items-center gap-1 text-green-700 text-xs font-semibold bg-green-50 border border-green-200 px-2 py-0.5 rounded-md">
                              <CheckCircle size={12} className="text-green-650" /> Terpublikasi ke HRD
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-700 text-xs font-semibold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> Draft
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                      {pkg.status !== 'published' && (
                        <button 
                          onClick={() => handlePublishPackage(pkg.id, pkg.name)}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-sm font-bold text-xs whitespace-nowrap"
                        >
                          <Upload size={14} /> Upload ke HRD
                        </button>
                      )}
                      <button 
                        onClick={() => {
                          setEditingPackage(pkg);
                          setNewQuestionText('');
                          setOptionA('');
                          setOptionB('');
                          setOptionC('');
                          setOptionD('');
                          setNewCorrectAnswer('A');
                        }}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-semibold text-xs whitespace-nowrap"
                      >
                        <Edit size={14} /> Kelola Pertanyaan
                      </button>
                      <button 
                        onClick={() => handleDeletePackage(pkg.id, pkg.name)}
                        className="p-2 border border-red-100 text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                        title="Hapus Paket"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit / Manage Questions Modal */}
      {editingPackage && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
              <div>
                <h3 className="text-lg font-bold text-gray-950">Kelola Pertanyaan Psikotes</h3>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <p className="text-gray-500 text-xs">Paket: <span className="font-bold text-blue-600">{editingPackage.name}</span></p>
                  {editingPackage.status === 'published' ? (
                    <span className="inline-flex items-center gap-1 text-green-700 text-[10px] font-bold bg-green-50 border border-green-200 px-1.5 py-0.5 rounded">
                      <CheckCircle size={10} /> Terpublikasi ke HRD
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-amber-700 text-[10px] font-bold bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                      <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse"></span> Draft
                    </span>
                  )}
                </div>
              </div>
              <button onClick={() => setEditingPackage(null)} className="text-gray-400 hover:text-gray-655 p-2 rounded-full hover:bg-gray-200 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-gray-50/50">
              {/* Form to Add Question One-by-One */}
              <div className="bg-white border border-blue-100 rounded-xl p-5 shadow-sm space-y-4">
                <h4 className="font-bold text-blue-900 text-sm flex items-center gap-1.5">
                  <Plus size={16} /> Tambah Pertanyaan Pilihan Ganda Baru
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Teks Pertanyaan</label>
                    <textarea 
                      value={newQuestionText}
                      onChange={(e) => setNewQuestionText(e.target.value)}
                      placeholder="Masukkan pertanyaan psikotes pilihan ganda di sini..."
                      className="w-full border border-gray-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium text-gray-800 bg-white"
                      rows="2"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Pilihan A</label>
                      <input 
                        type="text"
                        value={optionA}
                        onChange={(e) => setOptionA(e.target.value)}
                        placeholder="Pilihan A"
                        className="w-full border border-gray-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Pilihan B</label>
                      <input 
                        type="text"
                        value={optionB}
                        onChange={(e) => setOptionB(e.target.value)}
                        placeholder="Pilihan B"
                        className="w-full border border-gray-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Pilihan C</label>
                      <input 
                        type="text"
                        value={optionC}
                        onChange={(e) => setOptionC(e.target.value)}
                        placeholder="Pilihan C"
                        className="w-full border border-gray-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Pilihan D</label>
                      <input 
                        type="text"
                        value={optionD}
                        onChange={(e) => setOptionD(e.target.value)}
                        placeholder="Pilihan D"
                        className="w-full border border-gray-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Kunci Jawaban Benar</label>
                    <select 
                      value={newCorrectAnswer}
                      onChange={(e) => setNewCorrectAnswer(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white font-medium"
                    >
                      <option value="A">Pilihan A</option>
                      <option value="B">Pilihan B</option>
                      <option value="C">Pilihan C</option>
                      <option value="D">Pilihan D</option>
                    </select>
                  </div>

                  <button 
                    type="button"
                    onClick={() => handleAddQuestion(editingPackage.id)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Plus size={14} /> Tambahkan Pertanyaan
                  </button>
                </div>
              </div>

              {/* Questions List inside this package */}
              <div className="space-y-4">
                <h4 className="font-bold text-gray-800 text-sm">Daftar Soal Saat Ini ({editingPackage.questions?.length || 0})</h4>
                {(!editingPackage.questions || editingPackage.questions.length === 0) ? (
                  <p className="text-center text-gray-550 text-xs py-8 bg-white rounded-xl border border-dashed border-gray-200 font-medium">
                    Belum ada pertanyaan. Silakan tambahkan pertanyaan baru di atas.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {editingPackage.questions.map((item, idx) => (
                      <div key={item.id || idx} className="bg-white border border-gray-150 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative">
                        <button 
                          onClick={() => handleDeleteQuestion(editingPackage.id, item.id)}
                          className="absolute top-4 right-4 text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus Soal"
                        >
                          <Trash2 size={16} />
                        </button>
                        <div className="font-bold text-blue-600 text-xs mb-2">SOAL #{idx + 1}</div>
                        <p className="text-gray-800 text-sm whitespace-pre-wrap pr-8 mb-3 font-semibold leading-relaxed">
                          {item.q}
                        </p>
                        
                        {item.options && item.options.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3 bg-gray-55/40 p-3 rounded-lg border border-gray-100">
                            {item.options.map((opt, i) => {
                              const letter = String.fromCharCode(65 + i);
                              const isCorrect = item.a === letter;
                              return (
                                <div key={i} className={`text-xs p-2 rounded-md font-medium border ${isCorrect ? 'bg-green-50 border-green-200 text-green-800' : 'bg-white border-gray-150 text-gray-700'}`}>
                                  <span className="font-bold">{letter}.</span> {opt} {isCorrect && '✔️'}
                                </div>
                              );
                            })}
                          </div>
                        ) : item.a && (
                          <div className="bg-green-50 text-green-800 text-xs px-3 py-1.5 rounded-lg font-medium inline-block border border-green-100 mb-3">
                            <span className="font-bold text-green-900">Petunjuk/Kunci:</span> {item.a}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-100 flex justify-between items-center bg-white rounded-b-2xl">
              <div>
                {editingPackage.status !== 'published' ? (
                  <button 
                    onClick={() => handlePublishPackage(editingPackage.id, editingPackage.name)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-sm font-bold text-xs"
                  >
                    <Upload size={14} /> Upload ke HRD
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1 text-green-700 text-xs font-semibold">
                    <CheckCircle size={14} className="text-green-500" /> Sudah Terpublikasi ke HRD
                  </span>
                )}
              </div>
              <button 
                onClick={() => setEditingPackage(null)}
                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-bold transition-colors text-xs"
              >
                Selesai & Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
