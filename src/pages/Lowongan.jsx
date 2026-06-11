import React, { useState, useEffect } from 'react';
import { Plus, Search, MapPin, Briefcase, Clock, Users, BookOpen, X, Check, MoreVertical, ChevronDown, ChevronLeft, ChevronRight, Info, Share2, Copy } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';

export default function Lowongan() {
  const { jobs, addJob, updateJob, psychotestPackages, updateJobStatus, applicants, deleteJob } = useData();
  const location = useLocation();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('Semua Lowongan');
  
  // Pagination & Actions State
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [openActionId, setOpenActionId] = useState(null);

  // New states for details, sharing and toast
  const [selectedDetailJob, setSelectedDetailJob] = useState(null);
  const [sharingJob, setSharingJob] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [showJobSuccess, setShowJobSuccess] = useState(false);
  const [deletingJobId, setDeletingJobId] = useState(null);

  // Form state
  const initialFormData = {
    title: '',
    kota: '',
    pendidikan: 'SMA/SMK',
    jenisPekerjaan: 'Full-time',
    sistemKerja: 'WFO (Work From Office)',
    gender: 'Keduanya (Pria & Wanita)',
    statusPernikahan: 'Bebas',
    hariJamKerja: '',
    deskripsi: '',
    psikotes: false,
    paketPsikotes: '',
    department: 'Engineering'
  };

  const [formData, setFormData] = useState(initialFormData);
  const [editingJobId, setEditingJobId] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    let res;
    if (editingJobId) {
      res = await updateJob(editingJobId, formData);
    } else {
      res = await addJob(formData);
    }
    
    if (res && res.success) {
      setShowJobSuccess(true);
      setIsModalOpen(false);
      setEditingJobId(null);
      setFormData(initialFormData);
    } else {
      showToast(res?.error || 'Terjadi kesalahan.');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingJobId(null);
    setFormData(initialFormData);
  };

  const handleEditClick = (job) => {
    setEditingJobId(job.id);
    setFormData({
      title: job.title || '',
      kota: job.kota || '',
      pendidikan: job.pendidikan || 'SMA/SMK',
      jenisPekerjaan: job.jenis_pekerjaan || job.jenisPekerjaan || 'Full-time',
      sistemKerja: job.sistem_kerja || job.sistemKerja || 'WFO (Work From Office)',
      gender: job.gender || 'Keduanya (Pria & Wanita)',
      statusPernikahan: job.status_pernikahan || job.statusPernikahan || 'Bebas',
      hariJamKerja: job.hari_jam_kerja || job.hariJamKerja || '',
      deskripsi: job.deskripsi || '',
      psikotes: job.psikotes === 1 || job.psikotes === true,
      paketPsikotes: job.paket_psikotes || job.paketPsikotes || '',
      department: job.department || 'Engineering'
    });
    setIsModalOpen(true);
  };

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage('');
    }, 3000);
  };

  const copyJobLink = (job) => {
    const jobLink = `${window.location.origin}/lowongan/${job.id}`;
    navigator.clipboard.writeText(jobLink).then(() => {
      showToast('Link lowongan berhasil disalin!');
    }).catch(err => {
      console.error('Could not copy text: ', err);
    });
  };

  // Close action dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenActionId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);
  
  // Tabs config
  const tabs = [
    { id: 'Semua Lowongan', count: jobs.length },
    { id: 'Lowongan Dibuka', count: jobs.filter(j => j.status === 'Active').length },
    { id: 'Lowongan Ditunda', count: jobs.filter(j => j.status === 'Ditunda').length },
    { id: 'Lowongan Ditutup', count: jobs.filter(j => j.status === 'Ditutup').length },
    { id: 'Draft', count: jobs.filter(j => j.status === 'Draft').length }
  ];

  // Filtering
  const filteredJobsByTab = jobs.filter(j => {
    if (activeTab === 'Semua Lowongan') return true;
    if (activeTab === 'Lowongan Dibuka') return j.status === 'Active' || j.status === 'Dibuka';
    if (activeTab === 'Lowongan Ditunda') return j.status === 'Ditunda';
    if (activeTab === 'Lowongan Ditutup') return j.status === 'Ditutup';
    if (activeTab === 'Draft') return j.status === 'Draft';
    return true;
  });

  const filteredJobs = filteredJobsByTab.filter(j => j.title?.toLowerCase().includes(searchTerm.toLowerCase()));

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm]);

  // Pagination calculation
  const totalFiltered = filteredJobs.length;
  const totalPages = Math.ceil(totalFiltered / rowsPerPage) || 1;
  const paginatedJobs = filteredJobs.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const getApplicantCount = (jobId, status) => {
    return applicants.filter(a => a.jobId === jobId && a.status === status).length;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Kelola Lowongan</h2>
          <p className="text-gray-500 text-sm mt-1">Buat dan pantau status lowongan pekerjaan Anda.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-colors"
        >
          <Plus size={20} />
          Buat Lowongan
        </button>
      </div>

      <div className="bg-white shadow-sm border border-gray-100 rounded-2xl overflow-hidden mt-4">
        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-4 pt-4 space-x-6 overflow-x-auto">
          {tabs.map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 pb-3 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              {tab.id} <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>{tab.count}</span>
            </button>
          ))}
        </div>
        
        {/* Search */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari Lowongan..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm bg-white shadow-sm"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left text-sm text-gray-700 min-w-[800px]">
            <thead className="bg-white text-gray-900 font-semibold border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-bold">Lowongan</th>
                <th className="px-6 py-4 text-center font-bold">Jumlah Pelamar per Status</th>
                <th className="px-6 py-4 font-bold">Ganti Status</th>
                <th className="px-6 py-4 text-center font-bold">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {paginatedJobs.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-16 text-center text-gray-500">
                    <Briefcase size={36} className="mx-auto mb-3 text-gray-300" />
                    Belum ada lowongan untuk filter ini.
                  </td>
                </tr>
              ) : (
                paginatedJobs.map(job => (
                  <tr key={job.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900 text-base mb-1 flex items-center gap-2">
                        {job.title} <Info size={14} className="text-yellow-500 cursor-help" />
                      </div>
                      <div className="text-gray-600 text-xs mb-1.5">{job.kota || 'Kabupaten Bandung'}</div>
                      <div className="text-gray-400 text-xs">Bisa diaktifkan ulang s.d 28 May 2026</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-6 text-center text-xs">
                        <div className="flex flex-col items-center">
                          <span className="font-bold text-base text-gray-900 mb-1">{getApplicantCount(job.id, 'Menunggu')}</span>
                          <a href="#" className="text-gray-700 hover:text-blue-600 underline decoration-gray-300 underline-offset-4">Belum Diproses</a>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="font-bold text-base text-gray-900 mb-1">{getApplicantCount(job.id, 'Diterima')}</span>
                          <a href="#" className="text-gray-700 hover:text-blue-600 underline decoration-gray-300 underline-offset-4">Terseleksi</a>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="font-bold text-base text-gray-900 mb-1">{getApplicantCount(job.id, 'Interview')}</span>
                          <a href="#" className="text-gray-700 hover:text-blue-600 underline decoration-gray-300 underline-offset-4">Wawancara</a>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative inline-block w-full max-w-[140px]">
                        <select 
                          className="w-full appearance-none bg-white border border-gray-200 text-gray-600 py-2 pl-3 pr-8 rounded-md outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-medium text-sm cursor-pointer shadow-sm"
                          value={job.status === 'Active' ? 'Dibuka' : job.status}
                          onChange={(e) => updateJobStatus(job.id, e.target.value)}
                        >
                          <option value="Dibuka">Dibuka</option>
                          <option value="Ditunda">Ditunda</option>
                          <option value="Ditutup">Ditutup</option>
                          <option value="Draft">Draft</option>
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center relative">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenActionId(openActionId === job.id ? null : job.id);
                        }}
                        className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors inline-flex"
                      >
                        <MoreVertical size={20} />
                      </button>

                      {/* Action Dropdown Menu */}
                      {openActionId === job.id && (
                        <div className="absolute right-8 top-12 w-48 bg-white border border-gray-100 rounded-xl shadow-lg py-2 z-50 animate-in fade-in zoom-in-95 duration-100 text-left">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setSelectedDetailJob(job); setOpenActionId(null); }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            Lihat detail lowongan
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); navigate(`/pelamar?jobId=${job.id}`); setOpenActionId(null); }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            Lihat pelamar
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleEditClick(job); setOpenActionId(null); }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            Edit lowongan
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setSharingJob(job); setOpenActionId(null); }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            Bagikan lowongan
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); copyJobLink(job); setOpenActionId(null); }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            Salin link lowongan
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setDeletingJobId(job.id); setOpenActionId(null); }}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium"
                          >
                            Hapus lowongan
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-end gap-6 text-sm text-gray-600 bg-white">
          <div className="flex items-center gap-2">
            <span>Baris per halaman</span>
            <div className="relative flex items-center">
              <select 
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="appearance-none bg-transparent pr-4 font-medium outline-none cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            </div>
          </div>
          <div className="font-medium">
            {totalFiltered > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0}-
            {Math.min(currentPage * rowsPerPage, totalFiltered)} dari {totalFiltered}
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-50"
            ><ChevronLeft size={20} /></button>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalFiltered === 0}
              className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-50"
            ><ChevronRight size={20} /></button>
          </div>
        </div>
      </div>

      {/* Modal Buat / Edit Lowongan */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex justify-between items-center z-10">
              <h3 className="text-xl font-bold text-gray-900">{editingJobId ? 'Edit Lowongan Pekerjaan' : 'Buat Lowongan Pekerjaan Baru'}</h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Pekerjaan (Posisi) <span className="text-red-500">*</span></label>
                  <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Contoh: Senior UI/UX Designer" />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Kota Tempat Bekerja</label>
                  <input type="text" value={formData.kota} onChange={e => setFormData({...formData, kota: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Contoh: Jakarta Selatan" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Minimal Pendidikan</label>
                  <select value={formData.pendidikan} onChange={e => setFormData({...formData, pendidikan: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white">
                    <option>SMA/SMK</option>
                    <option>D3</option>
                    <option>S1</option>
                    <option>S2</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Jenis Pekerjaan</label>
                  <select value={formData.jenisPekerjaan} onChange={e => setFormData({...formData, jenisPekerjaan: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white">
                    <option>Full-time</option>
                    <option>Part-time</option>
                    <option>Contract</option>
                    <option>Freelance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Sistem Kerja</label>
                  <select value={formData.sistemKerja} onChange={e => setFormData({...formData, sistemKerja: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white">
                    <option>WFO (Work From Office)</option>
                    <option>WFH (Work From Home)</option>
                    <option>Hybrid</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Ketentuan Gender</label>
                  <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white">
                    <option>Keduanya (Pria & Wanita)</option>
                    <option>Pria</option>
                    <option>Wanita</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Status Pernikahan</label>
                  <select value={formData.statusPernikahan} onChange={e => setFormData({...formData, statusPernikahan: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white">
                    <option>Bebas</option>
                    <option>Belum Menikah</option>
                    <option>Sudah Menikah</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Hari & Jam Kerja</label>
                  <input type="text" value={formData.hariJamKerja} onChange={e => setFormData({...formData, hariJamKerja: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Contoh: Senin - Jumat, 09:00 - 18:00" />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Job Description <span className="text-red-500">*</span></label>
                  <textarea required rows="4" value={formData.deskripsi} onChange={e => setFormData({...formData, deskripsi: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Tuliskan tanggung jawab dan kualifikasi khusus..."></textarea>
                </div>

                <div className="col-span-2 bg-blue-50/50 border border-blue-100 p-5 rounded-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm">Tes Psikotes (Disediakan oleh Operator)</h4>
                      <p className="text-xs text-gray-500 mt-1">Aktifkan jika pelamar wajib mengerjakan psikotes secara online.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={formData.psikotes} onChange={e => setFormData({...formData, psikotes: e.target.checked})} />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  {formData.psikotes && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Pilih Paket Psikotes</label>
                      <select required value={formData.paketPsikotes} onChange={e => setFormData({...formData, paketPsikotes: e.target.value})} className="w-full border border-blue-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white">
                        <option value="" disabled>-- Pilih Paket --</option>
                        {psychotestPackages.map((pkg, idx) => (
                          <option key={idx} value={pkg}>{pkg}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 bg-white">
                <button type="button" onClick={handleCloseModal} className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  Batal
                </button>
                <button type="submit" className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                  {editingJobId ? 'Simpan Perubahan' : 'Posting Lowongan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detail Lowongan */}
      {selectedDetailJob && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex justify-between items-center z-10">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selectedDetailJob.title}</h3>
                <p className="text-gray-500 text-xs mt-1">{selectedDetailJob.kota || 'Kabupaten Bandung'} &bull; {selectedDetailJob.department || 'Engineering'}</p>
              </div>
              <button onClick={() => setSelectedDetailJob(null)} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-6 text-sm text-gray-700">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div>
                  <span className="text-gray-400 text-xs block mb-1">Minimal Pendidikan</span>
                  <span className="font-semibold text-gray-800">{selectedDetailJob.pendidikan || 'SMA/SMK'}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-xs block mb-1">Jenis Pekerjaan</span>
                  <span className="font-semibold text-gray-800">{selectedDetailJob.jenis_pekerjaan || selectedDetailJob.jenisPekerjaan || 'Full-time'}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-xs block mb-1">Sistem Kerja</span>
                  <span className="font-semibold text-gray-800">{selectedDetailJob.sistem_kerja || selectedDetailJob.sistemKerja || 'WFO'}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-xs block mb-1">Ketentuan Gender</span>
                  <span className="font-semibold text-gray-800">{selectedDetailJob.gender || 'Keduanya'}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-xs block mb-1">Status Pernikahan</span>
                  <span className="font-semibold text-gray-800">{selectedDetailJob.status_pernikahan || selectedDetailJob.statusPernikahan || 'Bebas'}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-xs block mb-1">Hari & Jam Kerja</span>
                  <span className="font-semibold text-gray-800">{selectedDetailJob.hari_jam_kerja || selectedDetailJob.hariJamKerja || '-'}</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-gray-900 mb-2">Deskripsi & Persyaratan Pekerjaan</h4>
                <div className="bg-white border border-gray-100 p-4 rounded-xl whitespace-pre-wrap leading-relaxed text-gray-600 shadow-sm">
                  {selectedDetailJob.deskripsi || 'Tidak ada deskripsi.'}
                </div>
              </div>

              <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-blue-900 text-sm">Wajib Ujian Psikotes</h4>
                  <p className="text-xs text-blue-700 mt-0.5">
                    {selectedDetailJob.psikotes === 1 || selectedDetailJob.psikotes === true
                      ? `Ya, menggunakan: ${selectedDetailJob.paket_psikotes || selectedDetailJob.paketPsikotes || 'Paket Komprehensif'}`
                      : 'Tidak membutuhkan psikotes online'}
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${selectedDetailJob.psikotes === 1 || selectedDetailJob.psikotes === true ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                  {selectedDetailJob.psikotes === 1 || selectedDetailJob.psikotes === true ? 'Aktif' : 'Non-aktif'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Bagikan Lowongan */}
      {sharingJob && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Bagikan Lowongan</h3>
              <button onClick={() => setSharingJob(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mx-auto mb-3">
                  <Share2 size={24} />
                </div>
                <h4 className="font-semibold text-gray-900">{sharingJob.title}</h4>
                <p className="text-xs text-gray-500 mt-0.5">{sharingJob.kota || 'Kabupaten Bandung'}</p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Tautan Lowongan</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    readOnly 
                    value={`${window.location.origin}/lowongan/${sharingJob.id}`}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-600 outline-none"
                  />
                  <button 
                    onClick={() => { copyJobLink(sharingJob); setSharingJob(null); }}
                    className="px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
                  >
                    <Copy size={16} /> Salin
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <a 
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Mari bergabung bersama kami untuk posisi ${sharingJob.title} di ${sharingJob.kota || 'Bandung'}! Lamar di sini: ${window.location.origin}/lowongan/${sharingJob.id}`)}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 p-2.5 border border-gray-200 rounded-xl hover:bg-green-50 hover:border-green-300 transition-colors text-sm font-medium text-gray-700"
                >
                  <span className="w-2 h-2 rounded-full bg-green-500"></span> WhatsApp
                </a>
                <a 
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`${window.location.origin}/lowongan/${sharingJob.id}`)}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 p-2.5 border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-colors text-sm font-medium text-gray-700"
                >
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span> LinkedIn
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <Check size={18} className="text-green-400" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Interactive Success Modal */}
      {showJobSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check size={40} className="text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Berhasil!</h3>
            <p className="text-gray-600 mb-8">Data lowongan pekerjaan berhasil disimpan dan dipublikasikan.</p>
            <button 
              onClick={() => setShowJobSuccess(false)}
              className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 hover:shadow-lg transition-all focus:outline-none focus:ring-4 focus:ring-blue-100"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus */}
      {deletingJobId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <X size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Hapus Lowongan Pekerjaan?</h3>
              <p className="text-sm text-gray-500 mb-6">
                Apakah Anda yakin ingin menghapus lowongan ini? Tindakan ini akan menghapus semua data pelamar, chat, dan psikotes yang terkait dengan lowongan ini secara permanen.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setDeletingJobId(null)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={async () => {
                    const res = await deleteJob(deletingJobId);
                    if (res && res.success) {
                      showToast('Lowongan berhasil dihapus.');
                    } else {
                      showToast(res?.error || 'Gagal menghapus lowongan.');
                    }
                    setDeletingJobId(null);
                  }}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
