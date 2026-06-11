import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, ChevronRight, BrainCircuit, AlertCircle, Clock, Send, ChevronLeft } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export default function PsikotestPelamar() {
  const { id } = useParams(); // applicant id
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [packageName, setPackageName] = useState('');
  const [questions, setQuestions] = useState([]);
  
  // Test progression state
  const [step, setStep] = useState(1); // 1: Pre-test Instructions & Data Confirmation, 2: In-test, 3: Completed
  const [formData, setFormData] = useState({
    nama: user?.name || '',
    usia: '',
    jenisKelamin: '',
    pendidikan: ''
  });
  
  // Answers state: key is question ID, value is string answer
  const [answersInput, setAnswersInput] = useState({});

  // Load applicant, check answers, and fetch questions
  useEffect(() => {
    const initTest = async () => {
      try {
        setIsLoading(true);

        // 1. Check if applicant has already submitted answers
        const ansRes = await fetch(`${API_URL}/applicants/${id}/answers`);
        if (ansRes.ok) {
          const ansData = await ansRes.json();
          if (ansData) {
            setAlreadySubmitted(true);
            setStep(3); // Skip to completed screen
            setIsLoading(false);
            return;
          }
        }

        // 2. Fetch applicant details to find job_id
        const appRes = await fetch(`${API_URL}/applicants`);
        if (!appRes.ok) throw new Error("Gagal mengambil data pelamar.");
        const apps = await appRes.json();
        const applicant = apps.find(a => a.id === Number(id));
        
        if (!applicant) {
          setErrorMsg("Data lamaran tidak ditemukan.");
          setIsLoading(false);
          return;
        }

        // 3. Fetch Job details to find associated psychotest package name
        const jobRes = await fetch(`${API_URL}/jobs`);
        if (!jobRes.ok) throw new Error("Gagal mengambil data lowongan.");
        const jobs = await jobRes.json();
        const job = jobs.find(j => j.id === applicant.job_id);

        if (!job) {
          setErrorMsg("Data lowongan untuk lamaran ini tidak ditemukan.");
          setIsLoading(false);
          return;
        }

        // Check if job requires psychotest
        const hasPsychotest = job.psikotes === 1 || job.psikotes === true;
        const pkg = job.paket_psikotes || job.paketCust;

        if (!hasPsychotest || !pkg) {
          setErrorMsg("Pekerjaan ini tidak mewajibkan tes psikotes.");
          setIsLoading(false);
          return;
        }

        setPackageName(pkg);

        // 4. Fetch questions for the package
        const qRes = await fetch(`${API_URL}/packages/questions?packageName=${encodeURIComponent(pkg)}`);
        if (!qRes.ok) throw new Error("Gagal mengambil soal psikotes.");
        const qData = await qRes.json();

        if (qData.length === 0) {
          setErrorMsg("Paket soal psikotes ini belum diisi oleh Operator. Silakan hubungi tim rekrutmen.");
        } else {
          setQuestions(qData);
        }
      } catch (error) {
        console.error(error);
        setErrorMsg("Koneksi gagal. Silakan muat ulang halaman.");
      } finally {
        setIsLoading(false);
      }
    };

    initTest();
  }, [id]);

  const handleSubmitConfirmation = (e) => {
    e.preventDefault();
    // Initialize answers dictionary
    const initialAnswers = {};
    questions.forEach(q => {
      initialAnswers[q.id] = '';
    });
    setAnswersInput(initialAnswers);
    setStep(2);
  };

  const handleInputChange = (qId, text) => {
    setAnswersInput(prev => ({
      ...prev,
      [qId]: text
    }));
  };

  const handleFinishTest = async () => {
    // Check if at least one question is answered (or encourage answering all)
    const unansweredCount = questions.filter(q => !answersInput[q.id]?.trim()).length;
    if (unansweredCount > 0) {
      const confirmSubmit = window.confirm(`Ada ${unansweredCount} soal yang belum dijawab. Apakah Anda yakin ingin mengirimkan jawaban sekarang?`);
      if (!confirmSubmit) return;
    } else {
      const confirmSubmit = window.confirm("Apakah Anda yakin ingin menyelesaikan tes dan mengirimkan semua jawaban?");
      if (!confirmSubmit) return;
    }

    try {
      setIsLoading(true);
      // Map answers to backend format: array of { questionId, questionText, answerText }
      const answersPayload = questions.map(q => ({
        questionId: q.id,
        questionText: q.q,
        answerText: answersInput[q.id] || ''
      }));

      const res = await fetch(`${API_URL}/applicants/${id}/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: answersPayload })
      });

      if (res.ok) {
        setStep(3);
      } else {
        alert("Gagal mengirimkan jawaban. Silakan coba lagi.");
      }
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
        <p className="text-gray-500 text-sm font-medium">Memuat data ujian...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="max-w-md mx-auto px-6 py-16 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
          <AlertCircle size={32} />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Informasi</h3>
        <p className="text-gray-650 text-sm mb-6 leading-relaxed">{errorMsg}</p>
        <button 
          onClick={() => navigate('/pelamar/status-lamaran')}
          className="bg-gray-800 hover:bg-gray-900 text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors"
        >
          Kembali ke Status Lamaran
        </button>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
              <BrainCircuit size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Ujian Psikotes Online</h2>
              <p className="text-gray-500 text-sm">Harap lengkapi dan konfirmasi informasi Anda.</p>
            </div>
          </div>

          <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-5 mb-6 space-y-2">
            <h4 className="font-bold text-purple-900 text-sm">Instruksi Penting:</h4>
            <ul className="text-xs text-purple-850 space-y-1.5 list-disc list-inside">
              <li>Anda akan mengerjakan paket soal: <span className="font-bold">{packageName}</span></li>
              <li>Jumlah pertanyaan: <span className="font-bold">{questions.length} butir</span></li>
              <li><span className="font-bold text-red-650">Perhatian:</span> Anda hanya dapat mengerjakan tes ini <span className="font-bold text-red-650">1 kali saja</span>.</li>
              <li>Pastikan koneksi internet Anda stabil sebelum menekan tombol Mulai.</li>
            </ul>
          </div>
          
          <form onSubmit={handleSubmitConfirmation} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Nama Lengkap</label>
              <input 
                type="text" required 
                value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})}
                className="w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 p-2.5 bg-gray-50/50"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Usia (Tahun)</label>
                <input 
                  type="number" required 
                  value={formData.usia} onChange={e => setFormData({...formData, usia: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 p-2.5 bg-white"
                  placeholder="Contoh: 23"
                  min="15" max="100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Jenis Kelamin</label>
                <select 
                  required 
                  value={formData.jenisKelamin} 
                  onChange={e => setFormData({...formData, jenisKelamin: e.target.value})} 
                  className="w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 p-2.5 bg-white"
                >
                  <option value="">Pilih</option>
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Pendidikan Terakhir</label>
              <select 
                required 
                value={formData.pendidikan} 
                onChange={e => setFormData({...formData, pendidikan: e.target.value})} 
                className="w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 p-2.5 bg-white"
              >
                <option value="">Pilih</option>
                <option value="SMA/SMK">SMA/SMK</option>
                <option value="Diploma (D3)">Diploma (D3)</option>
                <option value="Sarjana (S1)">Sarjana (S1)</option>
                <option value="Magister (S2)">Magister (S2)</option>
              </select>
            </div>
            
            <button type="submit" className="w-full mt-6 bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-750 flex items-center justify-center gap-2 transition-colors shadow-lg shadow-purple-100">
              Mulai Tes Sekarang <ChevronRight size={18} />
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (step === 2) {
    // Calculate progress
    const answeredCount = questions.filter(q => answersInput[q.id]?.trim()).length;
    const progressPercent = Math.round((answeredCount / questions.length) * 100);

    return (
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Floating progress header */}
        <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="font-bold text-gray-900 text-lg">Lembar Jawaban Ujian</h3>
            <p className="text-gray-500 text-xs mt-0.5">Paket Soal: <span className="font-semibold text-purple-600">{packageName}</span></p>
          </div>
          <div className="w-full md:w-64 space-y-1">
            <div className="flex justify-between text-xs font-semibold text-gray-600">
              <span>Progres Pengerjaan</span>
              <span>{answeredCount} dari {questions.length} Terjawab ({progressPercent}%)</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div 
                className="bg-purple-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-6">
          {questions.map((q, idx) => (
            <div key={q.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
              <div className="flex justify-between items-center">
                <span className="bg-purple-50 text-purple-700 text-xs font-bold px-3 py-1 rounded-full">
                  PERTANYAAN {idx + 1}
                </span>
                {answersInput[q.id]?.trim() ? (
                  <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 size={14} /> Sudah diisi
                  </span>
                ) : (
                  <span className="text-xs text-amber-500 font-medium">Belum diisi</span>
                )}
              </div>
              
              <p className="text-gray-850 font-semibold text-base leading-relaxed whitespace-pre-wrap">
                {q.q}
              </p>

              {q.options && q.options.length > 0 ? (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Pilih Jawaban Anda</label>
                  <div className="grid grid-cols-1 gap-2">
                    {q.options.map((opt, i) => {
                      const letter = String.fromCharCode(65 + i); // A, B, C, D
                      const formattedVal = `${letter}. ${opt}`;
                      const isSelected = answersInput[q.id] === formattedVal;
                      return (
                        <label 
                          key={i} 
                          className={`flex items-center p-3.5 border rounded-xl cursor-pointer transition-all ${
                            isSelected 
                              ? 'bg-purple-50 border-purple-500 text-purple-950 font-semibold shadow-sm' 
                              : 'bg-white border-gray-200 text-gray-750 hover:bg-gray-50/50'
                          }`}
                        >
                          <input 
                            type="radio" 
                            name={`q_${q.id}`} 
                            value={formattedVal}
                            checked={isSelected}
                            onChange={() => handleInputChange(q.id, formattedVal)}
                            className="w-4 h-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                          />
                          <span className="ml-3 text-sm">
                            <span className="font-bold mr-1">{letter}.</span> {opt}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Jawaban Anda</label>
                  <textarea 
                    rows="3"
                    value={answersInput[q.id] || ''}
                    onChange={(e) => handleInputChange(q.id, e.target.value)}
                    placeholder="Tuliskan jawaban Anda secara jelas dan mendetail di sini..."
                    className="w-full border border-gray-200 rounded-xl p-3.5 text-sm outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-50/30 focus:bg-white transition-colors leading-relaxed"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Submit Actions */}
        <div className="mt-8 flex justify-between items-center bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <button 
            onClick={() => {
              if (window.confirm("Apakah Anda ingin kembali ke lembar konfirmasi data diri? Progres jawaban saat ini akan tetap tersimpan.")) {
                setStep(1);
              }
            }}
            className="flex items-center gap-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-sm"
          >
            <ChevronLeft size={16} /> Kembali
          </button>
          
          <button 
            onClick={handleFinishTest} 
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg shadow-purple-100 transition-colors"
          >
            <Send size={16} /> Selesai & Kirim Jawaban
          </button>
        </div>
      </div>
    );
  }

  // Step 3: Completed or Already Submitted
  return (
    <div className="max-w-md mx-auto px-6 py-24 text-center">
      <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 size={48} />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-3">
        {alreadySubmitted ? 'Psikotes Sudah Selesai' : 'Jawaban Berhasil Dikirim!'}
      </h2>
      <p className="text-gray-500 text-sm mb-8 leading-relaxed">
        {alreadySubmitted 
          ? 'Anda sudah menyelesaikan tahap psikotes untuk lowongan ini sebelumnya. Jawaban Anda sudah tersimpan aman di database kami.' 
          : 'Terima kasih banyak telah meluangkan waktu untuk menyelesaikan ujian psikotes online ini. Jawaban Anda telah tersimpan secara resmi.'}
      </p>
      <button 
        onClick={() => navigate('/pelamar/status-lamaran')} 
        className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 transition-colors"
      >
        Kembali ke Status Lamaran
      </button>
    </div>
  );
}
