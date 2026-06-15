import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Search, MapPin, SlidersHorizontal, FileText, CheckCircle2, X, Briefcase, GraduationCap, Building2, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DashboardPelamar() {
  const { jobs, applicants, fetchData } = useData();
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [cvMatchMode, setCvMatchMode] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [isApplying, setIsApplying] = useState(false);
  const [showApplySuccess, setShowApplySuccess] = useState(false);
  const [visibleJobsCount, setVisibleJobsCount] = useState(6);

  // Advanced filters state
  const [filterEdu, setFilterEdu] = useState([]);
  const [filterSistemKerja, setFilterSistemKerja] = useState([]);
  const [filterGender, setFilterGender] = useState([]);
  const [filterJenisPekerjaan, setFilterJenisPekerjaan] = useState([]);
  const [sortBy, setSortBy] = useState('rekomendasi');

  // Get all job IDs that the current user has already applied for
  const appliedJobIds = (applicants || [])
    .filter(app => {
      const appUserId = app.user_id !== undefined ? app.user_id : app.userId;
      return Number(appUserId) === Number(user?.id);
    })
    .map(app => app.job_id !== undefined ? app.job_id : app.jobId);

  // Helper to safely get jobs, filtering out jobs that the user has already applied for
  const activeJobs = (jobs || [])
    .filter(j => j.status === 'Active' || j.status === 'Dibuka')
    .filter(j => !appliedJobIds.includes(j.id));

  const handleToggleFilter = (item, list, setList) => {
    if (list.includes(item)) {
      setList(list.filter(x => x !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleResetFilters = () => {
    setFilterEdu([]);
    setFilterSistemKerja([]);
    setFilterGender([]);
    setFilterJenisPekerjaan([]);
    setSortBy('rekomendasi');
  };

  const handleCvMatch = () => {
    if (!user?.profile?.cvUrl) {
      addToast("Anda belum mengunggah CV. Silakan unggah di halaman Profil.", "error");
      navigate('/pelamar/profile');
    } else {
      setCvMatchMode(!cvMatchMode);
    }
  };

  const handleApply = async (job) => {
    const p = user?.profile || {};
    
    // Validasi data profile wajib saja
    const isProfileReadyForApply = p.nama_lengkap && p.cvUrl;

    if (!isProfileReadyForApply) {
      addToast("Harap lengkapi setidaknya Nama Lengkap dan CV pada profil Anda terlebih dahulu sebelum melamar.", "warning", 5000);
      navigate('/pelamar/profile');
      return;
    }

    setIsApplying(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || '/api';
      const res = await fetch(`${API_URL}/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          jobId: job.id,
          name: user.profile?.nama_lengkap || user.name,
          cv: user.profile?.cvUrl || 'no-cv.pdf'
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowApplySuccess(true);
        setSelectedJob(null);
        if (typeof fetchData === 'function') {
          fetchData();
        }
      } else {
        addToast(data.error || "Gagal melamar.", "error");
      }
    } catch (err) {
      addToast("Terjadi kesalahan server.", "error");
    } finally {
      setIsApplying(false);
    }
  };

  // Advanced Search & Filter Logic
  const getFilteredJobs = () => {
    let filtered = [...activeJobs];

    // Search Term Filter
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(j => 
        (j.title || '').toLowerCase().includes(q) || 
        (j.company_name || 'PT. Inovasi Teknologi').toLowerCase().includes(q) ||
        (j.department || '').toLowerCase().includes(q)
      );
    }

    // Location Filter
    if (searchLocation) {
      const loc = searchLocation.toLowerCase();
      filtered = filtered.filter(j => 
        (j.kota || '').toLowerCase().includes(loc)
      );
    }

    // Education Filter
    if (filterEdu.length > 0) {
      filtered = filtered.filter(j => {
        const jEdu = (j.pendidikan || '').toLowerCase();
        return filterEdu.some(edu => {
          const normEdu = edu.toLowerCase();
          if (normEdu.includes('tidak') || normEdu.includes('bebas')) {
            return jEdu === '' || jEdu.includes('tidak') || jEdu.includes('bebas') || jEdu.includes('semua');
          }
          if (normEdu === 'sma/smk/ma') return jEdu.includes('sma') || jEdu.includes('smk') || jEdu.includes('ma') || jEdu.includes('slta');
          if (normEdu === 'smp/mts') return jEdu.includes('smp') || jEdu.includes('mts');
          return jEdu.includes(normEdu);
        });
      });
    }

    // Kebijakan Kerja (Sistem Kerja) Filter
    if (filterSistemKerja.length > 0) {
      filtered = filtered.filter(j => {
        const js = (j.sistem_kerja || '').toLowerCase();
        return filterSistemKerja.some(option => {
          if (option.includes('Remote')) return js.includes('wfh') || js.includes('remote') || js.includes('home');
          if (option.includes('WFO')) return js.includes('wfo') || js.includes('office');
          if (option.includes('Hybrid')) return js.includes('hybrid');
          if (option.includes('lapangan')) return js.includes('lapangan') || js.includes('field');
          return false;
        });
      });
    }

    // Gender Filter
    if (filterGender.length > 0) {
      filtered = filtered.filter(j => {
        const jg = (j.gender || '').toLowerCase();
        return filterGender.some(option => {
          if (option.includes('Semua')) return jg.includes('semua') || jg.includes('keduanya') || jg.includes('pria & wanita');
          if (option.includes('Laki-laki')) return jg.includes('laki') || jg.includes('pria') || jg.includes('semua') || jg.includes('keduanya');
          if (option.includes('Perempuan')) return jg.includes('perempuan') || jg.includes('wanita') || jg.includes('semua') || jg.includes('keduanya');
          return false;
        });
      });
    }

    // Tipe Kerja (Jenis Pekerjaan) Filter
    if (filterJenisPekerjaan.length > 0) {
      filtered = filtered.filter(j => {
        const jp = (j.jenis_pekerjaan || '').toLowerCase();
        return filterJenisPekerjaan.some(option => {
          const optLower = option.toLowerCase();
          if (optLower === 'kontrak') return jp.includes('contract') || jp.includes('kontrak');
          if (optLower === 'magang') return jp.includes('intern') || jp.includes('magang');
          return jp.includes(optLower);
        });
      });
    }

    // Sort order & CV Match Score mapping
    if (cvMatchMode && user?.profile) {
      const skillsList = Array.isArray(user.profile.skills) ? user.profile.skills : [];
      filtered = filtered.map(j => {
        let score = 65; // baseline
        // match skills
        skillsList.forEach(s => {
          if ((j.deskripsi || '').toLowerCase().includes(s.toLowerCase()) || (j.title || '').toLowerCase().includes(s.toLowerCase())) {
            score += 10;
          }
        });
        // match education
        const userEdu = (user.profile.pendidikan_terakhir || '').toLowerCase();
        const jEdu = (j.pendidikan || '').toLowerCase();
        if (userEdu && jEdu && userEdu.includes(jEdu)) {
          score += 10;
        }
        score = Math.min(98, score);
        return { ...j, tempScore: score };
      });

      if (sortBy === 'rekomendasi') {
        filtered.sort((a, b) => b.tempScore - a.tempScore);
      }
    }

    if (sortBy === 'terbaru') {
      filtered.sort((a, b) => b.id - a.id);
    }

    return filtered;
  };

  const filteredJobsList = getFilteredJobs();
  const isAnyFilterActive = searchTerm || searchLocation || filterEdu.length > 0 || filterSistemKerja.length > 0 || filterGender.length > 0 || filterJenisPekerjaan.length > 0 || cvMatchMode;

  // Standard categorizations (for initial non-filtered view)
  const promotedJobs = activeJobs.slice(0, 3);
  const s1Jobs = activeJobs.filter(j => j.pendidikan?.toLowerCase().includes('s1')).slice(0, 3);
  const otherJobs = activeJobs.slice(0, visibleJobsCount);

  // Check if profile is fully complete for banner logic
  const isProfileComplete = user?.profile?.nama_lengkap && user?.profile?.cvUrl && user?.profile?.kota_domisili;

  const JobCard = ({ job, matchScore }) => (
    <div 
      className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow relative cursor-pointer group"
      onClick={() => setSelectedJob(job)}
    >
      {matchScore && (
        <div className="absolute -top-3 -right-3 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
          <CheckCircle2 size={12} /> {matchScore}% Cocok
        </div>
      )}
      <div className="flex gap-4">
        <div className="w-12 h-12 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0 text-xl overflow-hidden">
          {/* Mock company logo */}
          <Building2 className="text-gray-400" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 leading-tight group-hover:text-blue-600 transition-colors">{job.title}</h4>
          <p className="text-sm text-gray-600 mb-2">{job.company_name || 'PT. Inovasi Teknologi'}</p>
          
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="inline-flex items-center text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-md">
              <MapPin size={12} className="mr-1" /> {job.kota || 'Remote'}
            </span>
            <span className="inline-flex items-center text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
              {job.jenis_pekerjaan || 'Full-time'}
            </span>
          </div>

          <div className="flex justify-between items-center mt-4">
            <span className="text-xs text-gray-400">Baru saja</span>
            <span className="text-blue-600 font-medium text-sm group-hover:underline">Lihat Detail</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-[#F8F9FA] min-h-screen pb-12 font-sans relative">
      
      {/* Filter Sidebar Modal */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsFilterOpen(false)}></div>
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Filter</h2>
              <button onClick={() => setIsFilterOpen(false)} className="text-gray-400 hover:text-gray-600 p-2">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              
              {/* Urutkan */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 text-sm">Urutkan</h3>
                <div className="flex gap-2">
                  <label className="flex-1 cursor-pointer">
                    <input 
                      type="radio" 
                      name="sort" 
                      className="peer hidden" 
                      checked={sortBy === 'rekomendasi'} 
                      onChange={() => setSortBy('rekomendasi')} 
                    />
                    <div className="text-center px-4 py-2 border border-gray-200 bg-white text-gray-600 rounded-full text-sm font-medium peer-checked:border-blue-500 peer-checked:bg-blue-50 peer-checked:text-blue-600 transition-colors">
                      Rekomendasi
                    </div>
                  </label>
                  <label className="flex-1 cursor-pointer">
                    <input 
                      type="radio" 
                      name="sort" 
                      className="peer hidden" 
                      checked={sortBy === 'terbaru'} 
                      onChange={() => setSortBy('terbaru')} 
                    />
                    <div className="text-center px-4 py-2 border border-gray-200 bg-white text-gray-600 rounded-full text-sm font-medium peer-checked:border-blue-500 peer-checked:bg-blue-50 peer-checked:text-blue-600 transition-colors">
                      Terbaru
                    </div>
                  </label>
                </div>
              </div>

              {/* Pendidikan */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 text-sm">Minimum Pendidikan</h3>
                <div className="flex flex-wrap gap-2">
                  {['SMP/MTS', 'SMA/SMK/MA', 'D3', 'S1', 'S2', 'S3', 'Tidak Ada Ketentuan'].map(edu => (
                    <label key={edu} className="cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="peer hidden" 
                        checked={filterEdu.includes(edu)} 
                        onChange={() => handleToggleFilter(edu, filterEdu, setFilterEdu)} 
                      />
                      <div className="px-4 py-1.5 border border-gray-200 rounded-full text-sm text-gray-600 peer-checked:border-blue-500 peer-checked:bg-blue-50 peer-checked:text-blue-600 transition-colors">
                        {edu}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Kebijakan Kerja */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 text-sm">Kebijakan Kerja</h3>
                <div className="flex flex-wrap gap-2">
                  {['Kerja dari manapun (Remote)', 'Kerja dari kantor (WFO)', 'Campuran (Hybrid)', 'Kerja di lapangan'].map(tipe => (
                    <label key={tipe} className="cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="peer hidden" 
                        checked={filterSistemKerja.includes(tipe)} 
                        onChange={() => handleToggleFilter(tipe, filterSistemKerja, setFilterSistemKerja)} 
                      />
                      <div className="px-4 py-1.5 border border-gray-200 rounded-full text-sm text-gray-600 peer-checked:border-blue-500 peer-checked:bg-blue-50 peer-checked:text-blue-600 transition-colors">
                        {tipe}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Jenis Kelamin */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 text-sm">Jenis Kelamin</h3>
                <div className="flex flex-wrap gap-2">
                  {['Semua Jenis Kelamin', 'Laki-laki', 'Perempuan'].map(jk => (
                    <label key={jk} className="cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="peer hidden" 
                        checked={filterGender.includes(jk)} 
                        onChange={() => handleToggleFilter(jk, filterGender, setFilterGender)} 
                      />
                      <div className="px-4 py-1.5 border border-gray-200 rounded-full text-sm text-gray-600 peer-checked:border-blue-500 peer-checked:bg-blue-50 peer-checked:text-blue-600 transition-colors">
                        {jk}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Tipe Kerja */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 text-sm">Tipe Kerja</h3>
                <div className="flex flex-wrap gap-2">
                  {['Freelance', 'Full-Time', 'Part-Time', 'Magang', 'Kontrak'].map(tipe => (
                    <label key={tipe} className="cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="peer hidden" 
                        checked={filterJenisPekerjaan.includes(tipe)} 
                        onChange={() => handleToggleFilter(tipe, filterJenisPekerjaan, setFilterJenisPekerjaan)} 
                      />
                      <div className="px-4 py-1.5 border border-gray-200 rounded-full text-sm text-gray-600 peer-checked:border-blue-500 peer-checked:bg-blue-50 peer-checked:text-blue-600 transition-colors">
                        {tipe}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

            </div>
            <div className="p-4 border-t border-gray-100 bg-white flex gap-3">
              <button onClick={handleResetFilters} className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors">Reset</button>
              <button onClick={() => setIsFilterOpen(false)} className="flex-[2] py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors">Terapkan Filter</button>
            </div>
          </div>
        </div>
      )}

      {/* Job Detail Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setSelectedJob(null)}></div>
          <div className="relative bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start p-6 border-b border-gray-100 bg-gray-50/50">
              <div className="flex gap-4 items-center">
                <div className="w-16 h-16 rounded-xl bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                  <Building2 size={32} className="text-gray-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedJob.title}</h2>
                  <p className="text-blue-600 font-medium">{selectedJob.company_name || 'PT. Inovasi Teknologi'}</p>
                </div>
              </div>
              <button onClick={() => setSelectedJob(null)} className="p-2 text-gray-400 hover:text-gray-600 bg-white rounded-full border border-gray-100 shadow-sm">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="flex flex-wrap gap-4 bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex items-center gap-2 text-sm text-gray-700 w-full sm:w-[45%]">
                  <MapPin size={16} className="text-gray-400" />
                  <span className="font-medium">{selectedJob.kota || 'Remote'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700 w-full sm:w-[45%]">
                  <Briefcase size={16} className="text-gray-400" />
                  <span className="font-medium">{selectedJob.jenis_pekerjaan || 'Full-time'} ({selectedJob.sistem_kerja || 'WFO'})</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700 w-full sm:w-[45%]">
                  <GraduationCap size={16} className="text-gray-400" />
                  <span className="font-medium">Min. {selectedJob.pendidikan || 'S1'}</span>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Deskripsi Pekerjaan</h3>
                <div className="prose prose-sm text-gray-600 max-w-none whitespace-pre-wrap">
                  {selectedJob.deskripsi || 'Tidak ada deskripsi rinci untuk pekerjaan ini. Anda diharapkan mampu memenuhi ekspektasi standar untuk peran ini.'}
                </div>
              </div>

              {selectedJob.psikotes === 1 && (
                <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 flex items-start gap-3">
                  <CheckCircle2 className="text-purple-600 mt-0.5" size={18} />
                  <div>
                    <h4 className="font-semibold text-purple-900 text-sm">Membutuhkan Psikotest</h4>
                    <p className="text-xs text-purple-700 mt-1">Jika lolos seleksi berkas, Anda akan diminta mengerjakan {selectedJob.paket_psikotes}.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-white flex justify-end">
              <button 
                onClick={() => handleApply(selectedJob)}
                disabled={isApplying}
                className="bg-blue-600 text-white font-bold px-8 py-3 rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed w-full sm:w-auto justify-center"
              >
                {isApplying ? 'Mengirim Lamaran...' : <><Send size={18} /> Lamar Sekarang</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="bg-[#0052cc] text-white pt-12 pb-16 px-6 relative overflow-hidden">
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Cari Loker Makin Mudah dan <span className="text-yellow-400">#Cuan</span></h1>
            <p className="text-blue-100">Info Loker Terbaru & Terpercaya</p>
          </div>

          {/* Search Box */}
          <div className="bg-white/10 backdrop-blur-md p-2 rounded-2xl flex flex-col md:flex-row gap-2 max-w-4xl mx-auto shadow-lg">
            <div className="flex-1 bg-white rounded-xl flex items-center px-4 py-3">
              <Search className="text-gray-400 mr-2" size={20} />
              <input 
                type="text" 
                placeholder="Cari nama pekerjaan/perusahaan" 
                className="w-full text-gray-800 focus:outline-none placeholder-gray-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex-1 bg-white rounded-xl flex items-center px-4 py-3">
              <MapPin className="text-gray-400 mr-2" size={20} />
              <input 
                type="text" 
                placeholder="Semua Lokasi" 
                className="w-full text-gray-800 focus:outline-none placeholder-gray-400"
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
              />
            </div>
            <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-xl transition-colors whitespace-nowrap shadow-sm">
              Cari Loker
            </button>
          </div>

          <div className="flex justify-center gap-4 mt-6">
            <button onClick={() => setIsFilterOpen(true)} className="flex items-center gap-2 text-sm font-medium text-white bg-white/10 hover:bg-white/20 px-5 py-2.5 rounded-full border border-white/20 transition-all backdrop-blur-sm">
              <SlidersHorizontal size={16} /> Filter Lanjutan
            </button>
            <button 
              onClick={handleCvMatch}
              className={`flex items-center gap-2 text-sm font-medium text-white px-5 py-2.5 rounded-full border transition-all backdrop-blur-sm shadow-sm ${
                cvMatchMode ? 'bg-green-500 border-green-400 shadow-green-500/30' : 'bg-white/10 hover:bg-white/20 border-white/20'
              }`}
            >
              <FileText size={16} /> {cvMatchMode ? 'Mode CV Aktif' : 'Cari Berdasarkan CV'}
            </button>
          </div>
        </div>

        {/* Decor */}
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute top-12 -right-12 w-48 h-48 bg-yellow-400/10 rounded-full blur-2xl"></div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 mt-8 relative z-10">
        
        {cvMatchMode && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-sm gap-4">
            <div>
              <h3 className="font-bold text-green-800">Menampilkan Lowongan Relevan dengan CV Anda</h3>
              <p className="text-sm text-green-600 mt-1">Sistem kami menggunakan AI untuk mencocokkan keterampilan Anda dengan kriteria pekerjaan secara otomatis.</p>
            </div>
            <button onClick={() => setCvMatchMode(false)} className="bg-white border border-green-200 text-sm text-green-700 px-4 py-2 rounded-lg font-medium hover:bg-green-100 transition-colors whitespace-nowrap">
              Matikan Mode
            </button>
          </div>
        )}

        {isAnyFilterActive ? (
          <div className="mb-10 animate-in fade-in duration-300">
            <div className="flex justify-between items-end mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {cvMatchMode ? 'Rekomendasi Lowongan Sesuai CV Anda' : 'Hasil Pencarian & Filter'}
                <span className="text-sm font-normal text-gray-500 ml-2">({filteredJobsList.length} lowongan ditemukan)</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredJobsList.map((job, idx) => (
                <JobCard key={job.id || idx} job={job} matchScore={cvMatchMode ? job.tempScore : null} />
              ))}
              {filteredJobsList.length === 0 && (
                <div className="col-span-full p-12 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
                    <SlidersHorizontal size={28} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Tidak ada lowongan yang cocok</h3>
                  <p className="text-gray-500 text-sm">Coba sesuaikan kata kunci atau bersihkan filter pencarian Anda.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Section 1 */}
            <div className="mb-10">
              <div className="flex justify-between items-end mb-4">
                <h2 className="text-xl font-bold text-gray-900">Lowongan Dipromosikan</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {promotedJobs.map((job, idx) => (
                  <JobCard key={job.id || idx} job={job} />
                ))}
                {promotedJobs.length === 0 && <div className="col-span-full p-8 text-center text-gray-500 bg-white rounded-xl border border-dashed">Belum ada lowongan yang sesuai.</div>}
              </div>
            </div>

            {/* Banner CTA or Broadcast */}
            {!cvMatchMode && (
              isProfileComplete ? (
                <div className="mb-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white flex items-center justify-between shadow-lg shadow-indigo-200">
                  <div>
                    <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold tracking-wider mb-3 inline-block">BERITA TERBARU</span>
                    <h3 className="font-bold text-xl mb-1">Tips Wawancara Kerja 2026</h3>
                    <p className="text-sm text-indigo-100 mb-4 max-w-lg opacity-90">Pelajari tren rekrutmen terbaru dan bagaimana cara menjawab pertanyaan wawancara dengan metode STAR agar rekruter terkesan.</p>
                    <button className="bg-white text-indigo-600 text-sm font-bold px-5 py-2.5 rounded-full hover:bg-indigo-50 transition-colors shadow-sm">
                      Baca Selengkapnya
                    </button>
                  </div>
                  <div className="hidden sm:flex text-6xl opacity-90">🚀</div>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4 mb-10">
                  <div className="bg-gradient-to-br from-blue-600 to-blue-500 rounded-2xl p-6 text-white flex items-center justify-between shadow-lg shadow-blue-200">
                    <div>
                      <h3 className="font-bold text-xl mb-1">Cari kerja pakai CV?</h3>
                      <p className="text-sm text-blue-100 mb-4 opacity-90">Sistem otomatis cari loker yang cocok buatmu.</p>
                      <button onClick={() => navigate('/pelamar/profile')} className="bg-white text-blue-600 text-sm font-bold px-5 py-2.5 rounded-full hover:bg-blue-50 transition-colors shadow-sm">
                        Upload CV Sekarang
                      </button>
                    </div>
                    <div className="hidden sm:block text-5xl opacity-80">📄</div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-500 to-amber-400 rounded-2xl p-6 text-white flex items-center justify-between shadow-lg shadow-orange-200">
                    <div>
                      <h3 className="font-bold text-xl mb-1">Lengkapi Profilmu!</h3>
                      <p className="text-sm text-orange-50 mb-4 opacity-90">Profil lengkap meningkatkan peluang direkrut.</p>
                      <button onClick={() => navigate('/pelamar/profile')} className="bg-white text-orange-600 text-sm font-bold px-5 py-2.5 rounded-full hover:bg-orange-50 transition-colors shadow-sm">
                        Lengkapi Sekarang
                      </button>
                    </div>
                    <div className="hidden sm:block text-5xl opacity-80">👤</div>
                  </div>
                </div>
              )
            )}

            {/* Section 2 */}
            {!cvMatchMode && s1Jobs.length > 0 && (
              <div className="mb-10">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Lowongan Pilihan S1 / Manajerial</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {s1Jobs.map((job, idx) => (
                    <JobCard key={job.id || idx} job={job} />
                  ))}
                </div>
              </div>
            )}

            {/* Section 3 */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 font-sans">Mungkin Kamu Tertarik</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {otherJobs.map((job, idx) => (
                  <JobCard key={job.id || idx} job={job} />
                ))}
                {otherJobs.length === 0 && <div className="col-span-full p-8 text-center text-gray-500 bg-white rounded-xl border border-dashed">Belum ada lowongan.</div>}
              </div>
              
              {activeJobs.length > visibleJobsCount && (
                <div className="text-center mt-10 mb-6">
                  <button 
                    onClick={() => setVisibleJobsCount(prev => prev + 6)}
                    className="bg-blue-50 text-blue-600 font-bold px-8 py-3 rounded-full hover:bg-blue-100 hover:shadow-sm transition-all"
                  >
                    Tampilkan Lebih Banyak Lowongan
                  </button>
                </div>
              )}
            </div>
          </>
        )}

      </div>
      
      {/* Interactive Apply Success Modal */}
      {showApplySuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">🚀</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Lamaran Terkirim!</h3>
            <p className="text-gray-600 mb-8">Lamaran Anda berhasil dikirim ke perusahaan. Silakan cek halaman "Status Lamaran" secara berkala.</p>
            <button 
              onClick={() => setShowApplySuccess(false)}
              className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 hover:shadow-lg transition-all focus:outline-none focus:ring-4 focus:ring-blue-100"
            >
              Oke, Mengerti
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
