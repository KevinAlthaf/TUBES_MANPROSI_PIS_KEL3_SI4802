import React, { useState } from 'react';
import { Users, Filter, CheckCircle, XCircle, CalendarClock, BrainCircuit, FileText, ChevronRight, X, ThumbsUp, ThumbsDown, Video, Calendar } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

export default function Pelamar() {
  const { applicants, jobs, updateApplicantStatus } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Parse jobId from query params if present
  const queryParams = new URLSearchParams(location.search);
  const initialJobId = queryParams.get('jobId') || 'All';

  const [filterStatus, setFilterStatus] = useState('All');
  const [filterJob, setFilterJob] = useState(initialJobId);
  const [selectedAiMatch, setSelectedAiMatch] = useState(null);
  
  // Modals State
  const [confirmStatusModal, setConfirmStatusModal] = useState({ isOpen: false, applicantId: null, targetStatus: null, title: '', message: '' });
  const [showPsikotesResult, setShowPsikotesResult] = useState(null);
  const [psychotestAnswers, setPsychotestAnswers] = useState(null);
  const [loadingAnswers, setLoadingAnswers] = useState(false);
  const [hasilWawancaraModal, setHasilWawancaraModal] = useState(null);

  const handleViewPsikotes = async (applicant) => {
    setShowPsikotesResult(applicant);
    setPsychotestAnswers(null);
    setLoadingAnswers(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || '/api';
      const res = await fetch(`${API_URL}/applicants/${applicant.id}/answers`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.answers) {
          setPsychotestAnswers(data.answers);
        }
      }
    } catch (error) {
      console.error("Gagal mengambil jawaban psikotes:", error);
    } finally {
      setLoadingAnswers(false);
    }
  };

  // Meeting Modal State
  const [meetingModal, setMeetingModal] = useState({ isOpen: false, applicantId: null, type: null });
  const [roomName, setRoomName] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('');

  const openMeetingModal = (applicantId) => {
    setMeetingModal({ isOpen: true, applicantId, type: null });
    setRoomName('');
    setMeetingDate('');
    setMeetingTime('');
  };

  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  const handleCreateMeeting = async () => {
    if (meetingModal.type === 'now') {
      if (!roomName) return alert('Nama room harus diisi!');
      setIsCreatingRoom(true);
      try {
        const API_URL = import.meta.env.VITE_API_URL || '/api';
        const res = await fetch(`${API_URL}/interview-rooms`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            applicantId: meetingModal.applicantId,
            roomName: roomName,
            createdBy: user.id,
            scheduledAt: null
          })
        });
        const data = await res.json();
        if (data.success) {
          navigate(`/interview-room/${data.id}`);
        } else {
          alert('Gagal membuat room: ' + (data.error || 'Unknown error'));
        }
      } catch (err) {
        console.error(err);
        alert('Gagal terhubung ke server.');
      } finally {
        setIsCreatingRoom(false);
      }
    } else if (meetingModal.type === 'scheduled') {
      if (!meetingDate || !meetingTime) return alert('Tanggal dan Jam harus diisi!');
      if (!roomName) return alert('Nama room harus diisi!');
      setIsCreatingRoom(true);
      try {
        const scheduledAt = new Date(`${meetingDate}T${meetingTime}:00`).toISOString();
        const API_URL = import.meta.env.VITE_API_URL || '/api';
        const res = await fetch(`${API_URL}/interview-rooms`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            applicantId: meetingModal.applicantId,
            roomName: roomName || `Interview ${meetingDate}`,
            createdBy: user.id,
            scheduledAt
          })
        });
        const data = await res.json();
        if (data.success) {
          alert(`✅ Jadwal meeting berhasil disimpan!\nTanggal: ${meetingDate}\nJam: ${meetingTime}\nKode Room: ${data.roomCode}\n\nPelamar akan melihat jadwal ini di halaman Status Lamaran mereka.`);
          setMeetingModal({ isOpen: false, applicantId: null, type: null });
        } else {
          alert('Gagal membuat jadwal: ' + (data.error || 'Unknown error'));
        }
      } catch (err) {
        console.error(err);
        alert('Gagal terhubung ke server.');
      } finally {
        setIsCreatingRoom(false);
      }
    }
  };

  const filteredApplicants = applicants.filter(a => {
    const matchStatus = filterStatus === 'All' || a.status === filterStatus;
    const matchJob = filterJob === 'All' || a.jobId.toString() === filterJob.toString();
    return matchStatus && matchJob;
  });

  const handleConfirmStatus = () => {
    updateApplicantStatus(confirmStatusModal.applicantId, confirmStatusModal.targetStatus);
    setConfirmStatusModal({ isOpen: false, applicantId: null, targetStatus: null, title: '', message: '' });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Daftar Pelamar</h2>
          <p className="text-gray-500 text-sm mt-1">Kelola dan review CV pelamar yang masuk ke lowongan Anda.</p>
        </div>
        <div className="flex gap-2">
          <select 
            value={filterJob} 
            onChange={(e) => setFilterJob(e.target.value)}
            className="bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-lg font-medium outline-none focus:ring-2 focus:ring-blue-500 max-w-[200px]"
          >
            <option value="All">Semua Lowongan</option>
            {jobs.map(j => (
              <option key={j.id} value={j.id}>{j.title}</option>
            ))}
          </select>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-lg font-medium outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">Semua Status</option>
            <option value="Menunggu">Menunggu</option>
            <option value="Interview">Interview</option>
            <option value="Menunggu Hasil">Menunggu Hasil</option>
            <option value="Psikotes">Psikotes</option>
            <option value="Ditolak">Ditolak</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredApplicants.length === 0 ? (
          <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 mb-4">
              <Users size={32} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Tidak ada pelamar</h3>
            <p className="text-gray-500 text-sm">Tidak ditemukan pelamar dengan kriteria ini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 border-b border-gray-100">
                <tr>
                 <th className="px-6 py-4 font-bold">Pelamar</th>
                 <th className="px-6 py-4 font-bold">Lowongan</th>
                 <th className="px-6 py-4 font-bold">Skor AI Match</th>
                 <th className="px-6 py-4 font-bold text-center">Status</th>
                <th className="px-6 py-4 font-bold text-center">Riwayat Psikotes</th>
                <th className="px-6 py-4 font-bold text-right">Aksi</th>
              </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredApplicants.map((app) => {
                  const job = jobs.find(j => j.id === app.jobId);
                  const isPsikotesRequired = job && (job.psikotes === 1 || job.psikotes === true);

                  return (
                    <tr key={app.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                            {app.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{app.name}</p>
                            <p 
                              className="text-xs text-blue-600 flex items-center gap-1 cursor-pointer hover:underline"
                              onClick={() => window.open('/uploads/' + (app.cv || 'no-cv.pdf'), '_blank')}
                            >
                              <FileText size={12} /> Lihat CV
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">{job?.title || 'Unknown'}</td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => setSelectedAiMatch(app)} 
                          className="flex items-center gap-2 hover:bg-blue-50 p-2 -ml-2 rounded-lg transition-colors group"
                          title="Lihat Detail Analisis AI"
                        >
                          <BrainCircuit size={16} className={app.matchScore >= 85 ? 'text-green-500' : 'text-yellow-500'} />
                          <span className={`font-semibold ${app.matchScore >= 85 ? 'text-green-600' : 'text-yellow-600'}`}>
                            {app.matchScore}%
                          </span>
                          <ChevronRight size={14} className="text-gray-400 group-hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100" />
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium
                          ${app.status === 'Menunggu' ? 'bg-yellow-100 text-yellow-700' : ''}
                          ${app.status === 'Interview' ? 'bg-blue-100 text-blue-700' : ''}
                          ${app.status === 'Menunggu Hasil' ? 'bg-orange-100 text-orange-700' : ''}
                          ${app.status === 'Psikotes' ? 'bg-purple-100 text-purple-700' : ''}
                          ${app.status === 'Ditolak' ? 'bg-red-100 text-red-700' : ''}
                        `}>
                          {app.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {app.hasAnswers ? (
                          <button 
                            onClick={() => handleViewPsikotes(app)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-xs font-semibold"
                          >
                            <FileText size={14} /> Lihat
                          </button>
                        ) : app.status === 'Psikotes' ? (
                          <span className="text-xs text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full font-medium">Sedang Ujian</span>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2.5">
                          {app.status === 'Menunggu' && (
                            <>
                              <button 
                                onClick={() => setConfirmStatusModal({ isOpen: true, applicantId: app.id, targetStatus: 'Interview', title: 'Lanjut Wawancara?', message: `Apakah Anda yakin ingin memanggil ${app.name} untuk tahap Wawancara?` })}
                                className="bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold transition-colors shadow-sm"
                              >
                                <CalendarClock size={15} />
                                Wawancara
                              </button>
                              {isPsikotesRequired && (
                                <button 
                                  onClick={() => setConfirmStatusModal({ isOpen: true, applicantId: app.id, targetStatus: 'Psikotes', title: 'Lanjut Psikotes?', message: `Apakah Anda yakin ingin memberikan Psikotes kepada ${app.name}?` })}
                                  className="bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold transition-colors shadow-sm"
                                >
                                  <BrainCircuit size={15} />
                                  Psikotes
                                </button>
                              )}
                              <button 
                                onClick={() => setConfirmStatusModal({ isOpen: true, applicantId: app.id, targetStatus: 'Ditolak', title: 'Tolak Pelamar?', message: `Apakah Anda yakin ingin menolak pelamar ${app.name}?` })}
                                className="bg-red-50 text-red-700 hover:bg-red-100 border border-red-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold transition-colors shadow-sm"
                              >
                                <XCircle size={15} />
                                Tolak
                              </button>
                            </>
                          )}
                          {app.status === 'Menunggu Hasil' && (
                            <button 
                              onClick={() => setHasilWawancaraModal(app)}
                              className="bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold transition-colors shadow-sm"
                            >
                              <FileText size={15} />
                              Hasil Wawancara
                            </button>
                          )}                           {(app.status === 'Interview' || app.status === 'Psikotes') && (
                            <>
                              {app.status === 'Psikotes' && app.hasAnswers && (
                                <button 
                                  onClick={() => setConfirmStatusModal({ isOpen: true, applicantId: app.id, targetStatus: 'Interview', title: 'Lanjut Wawancara?', message: `Apakah Anda yakin ingin memanggil ${app.name} untuk tahap Wawancara?` })}
                                  className="bg-blue-600 text-white hover:bg-blue-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold transition-colors shadow-sm"
                                >
                                  <CalendarClock size={15} />
                                  Wawancara
                                </button>
                              )}
                              <button 
                                onClick={() => setConfirmStatusModal({ isOpen: true, applicantId: app.id, targetStatus: 'Menunggu', title: 'Batalkan Tahap?', message: `Anda yakin ingin membatalkan tahap ini dan mengembalikan ${app.name} ke status Menunggu?` })}
                                className="bg-red-50 text-red-700 hover:bg-red-100 border border-red-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold transition-colors shadow-sm"
                              >
                                <XCircle size={15} />
                                Batalkan Tahap
                              </button>
                              {app.status === 'Interview' && (
                                <button 
                                  onClick={() => openMeetingModal(app.id)}
                                  className="bg-blue-600 text-white hover:bg-blue-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold transition-colors shadow-sm"
                                >
                                  <Video size={15} />
                                  Buat Room
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* AI Match Details Modal */}
      {selectedAiMatch && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 flex justify-between items-start text-white">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <BrainCircuit /> Analisis AI
                </h3>
                <p className="text-blue-100 text-sm mt-1">Kecocokan CV {selectedAiMatch.name} dengan Requirement</p>
              </div>
              <button onClick={() => setSelectedAiMatch(null)} className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <div className={`text-5xl font-bold mb-2 ${selectedAiMatch.matchScore >= 85 ? 'text-green-500' : 'text-yellow-500'}`}>
                    {selectedAiMatch.matchScore}%
                  </div>
                  <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">Match Score</div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-green-50/50 border border-green-100 p-4 rounded-xl">
                  <h4 className="flex items-center gap-2 font-semibold text-green-800 mb-3">
                    <ThumbsUp size={18} className="text-green-500" /> Poin Kelebihan
                  </h4>
                  <ul className="space-y-2">
                    {selectedAiMatch.aiMatchDetails?.strengths?.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-green-700">
                        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-green-500 shrink-0"></span> {s}
                      </li>
                    ))}
                    {!selectedAiMatch.aiMatchDetails && <li className="text-sm text-green-700 italic">Data tidak tersedia</li>}
                  </ul>
                </div>
                
                <div className="bg-red-50/50 border border-red-100 p-4 rounded-xl">
                  <h4 className="flex items-center gap-2 font-semibold text-red-800 mb-3">
                    <ThumbsDown size={18} className="text-red-500" /> Poin Kekurangan / Gap
                  </h4>
                  <ul className="space-y-2">
                    {selectedAiMatch.aiMatchDetails?.weaknesses?.map((w, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-red-700">
                        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span> {w}
                      </li>
                    ))}
                    {!selectedAiMatch.aiMatchDetails && <li className="text-sm text-red-700 italic">Data tidak tersedia</li>}
                  </ul>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <h4 className="font-semibold text-gray-900 mb-2 text-sm">Kesimpulan AI:</h4>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg italic border border-gray-100">
                  "{selectedAiMatch.aiMatchDetails?.conclusion || 'Menunggu analisis lebih lanjut.'}"
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Meeting Modal */}
      {meetingModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Buat Room Interview</h3>
              <button onClick={() => setMeetingModal({ isOpen: false, applicantId: null, type: null })} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {!meetingModal.type ? (
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setMeetingModal(prev => ({ ...prev, type: 'now' }))}
                    className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-gray-100 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
                  >
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <Video size={24} />
                    </div>
                    <span className="font-semibold text-gray-700 group-hover:text-blue-700">Meeting Sekarang</span>
                  </button>
                  <button 
                    onClick={() => setMeetingModal(prev => ({ ...prev, type: 'scheduled' }))}
                    className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-gray-100 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all group"
                  >
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors">
                      <Calendar size={24} />
                    </div>
                    <span className="font-semibold text-gray-700 group-hover:text-green-700">Meeting Terjadwal</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <button 
                    onClick={() => setMeetingModal(prev => ({ ...prev, type: null }))}
                    className="text-sm text-blue-600 hover:underline mb-2 inline-block"
                  >
                    &larr; Kembali
                  </button>
                  
                  {meetingModal.type === 'now' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nama Room Meeting</label>
                      <input 
                        type="text" 
                        value={roomName}
                        onChange={(e) => setRoomName(e.target.value)}
                        placeholder="Contoh: Interview Frontend Dev"
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                    </div>
                  )}

                  {meetingModal.type === 'scheduled' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nama Room Meeting</label>
                        <input 
                          type="text" 
                          value={roomName}
                          onChange={(e) => setRoomName(e.target.value)}
                          placeholder="Contoh: Interview Frontend Dev"
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Meeting</label>
                        <input 
                          type="date" 
                          value={meetingDate}
                          onChange={(e) => setMeetingDate(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Jam Mulai</label>
                        <input 
                          type="time" 
                          value={meetingTime}
                          onChange={(e) => setMeetingTime(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  )}

                  <button 
                    onClick={handleCreateMeeting}
                    disabled={isCreatingRoom}
                    className={`w-full py-2.5 rounded-lg text-white font-medium transition-colors disabled:opacity-50 ${meetingModal.type === 'now' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}`}
                  >
                    {isCreatingRoom ? 'Membuat Room...' : (meetingModal.type === 'now' ? 'Masuk ke Room' : 'Simpan Jadwal')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmStatusModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden text-center p-6 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{confirmStatusModal.title}</h3>
            <p className="text-gray-600 mb-6 text-sm">{confirmStatusModal.message}</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setConfirmStatusModal({ isOpen: false, applicantId: null, targetStatus: null, title: '', message: '' })}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={handleConfirmStatus}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Ya, Yakin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Psikotes Results Modal */}
      {showPsikotesResult && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 duration-300">
            <div className="bg-gradient-to-r from-purple-650 from-purple-600 to-purple-800 p-6 flex justify-between items-start text-white">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <FileText /> Riwayat Psikotes Pelamar
                </h3>
                <p className="text-purple-200 text-sm mt-1">Hasil pengerjaan psikotes oleh {showPsikotesResult.name}</p>
              </div>
              <button onClick={() => setShowPsikotesResult(null)} className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
              {loadingAnswers ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                  <p className="text-gray-500 text-xs font-semibold">Memuat jawaban psikotes...</p>
                </div>
              ) : !psychotestAnswers || psychotestAnswers.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                    <XCircle size={32} />
                  </div>
                  <p className="font-bold text-gray-700">Belum Ada Jawaban</p>
                  <p className="text-xs text-gray-400 mt-1">Pelamar ini belum menyelesaikan lembar jawaban psikotes.</p>
                </div>
              ) : (() => {
                // Calculate correct/incorrect counts dynamically
                let totalQuestions = psychotestAnswers.length;
                let correctAnswersCount = 0;
                let incorrectAnswersCount = 0;
                
                psychotestAnswers.forEach(item => {
                  const isMultipleChoice = item.options && item.options.length > 0;
                  if (isMultipleChoice && item.correctAnswer) {
                    const letterPrefix = item.correctAnswer + '.';
                    const isCorrect = item.answerText.trim().startsWith(letterPrefix);
                    if (isCorrect) {
                      correctAnswersCount++;
                    } else {
                      incorrectAnswersCount++;
                    }
                  } else if (item.correctAnswer) {
                    const isCorrect = item.answerText.trim().toLowerCase() === item.correctAnswer.trim().toLowerCase();
                    if (isCorrect) {
                      correctAnswersCount++;
                    } else {
                      incorrectAnswersCount++;
                    }
                  }
                });
                
                const scorePercent = Math.round((correctAnswersCount / totalQuestions) * 100);

                return (
                  <div className="space-y-4">
                    {/* Score summary panel */}
                    <div className="grid grid-cols-3 gap-4 bg-purple-50/60 border border-purple-100 rounded-xl p-4 text-center">
                      <div>
                        <span className="text-gray-550 text-xs font-semibold block mb-1">Total Soal</span>
                        <span className="font-bold text-gray-800 text-lg">{totalQuestions}</span>
                      </div>
                      <div>
                        <span className="text-green-600 text-xs font-semibold block mb-1">Jawaban Benar</span>
                        <span className="font-bold text-green-700 text-lg">{correctAnswersCount}</span>
                      </div>
                      <div>
                        <span className="text-red-500 text-xs font-semibold block mb-1">Jawaban Salah</span>
                        <span className="font-bold text-red-655 text-lg">{incorrectAnswersCount}</span>
                      </div>
                    </div>

                    <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 flex gap-4 items-center">
                      <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center border border-purple-200 text-2xl font-bold text-purple-700 shadow-sm shrink-0">
                        {scorePercent}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm">Skor Akhir Psikotes</h4>
                        <p className="text-xs text-gray-650 mt-0.5 leading-relaxed">
                          {scorePercent >= 80 
                            ? "Hasil sangat baik. Pelamar menunjukkan logika dan kompetensi pemecahan masalah yang tinggi." 
                            : scorePercent >= 60 
                              ? "Hasil cukup baik. Pelamar memiliki potensi pemecahan masalah standar."
                              : "Hasil kurang memuaskan. Nilai berada di bawah rata-rata kelulusan."}
                        </p>
                      </div>
                    </div>

                    {/* Questions loop */}
                    {psychotestAnswers.map((item, idx) => {
                      const isMultipleChoice = item.options && item.options.length > 0;
                      const letterPrefix = item.correctAnswer + '.';
                      const isCorrect = isMultipleChoice 
                        ? item.answerText.trim().startsWith(letterPrefix) 
                        : (item.correctAnswer && item.answerText.trim().toLowerCase() === item.correctAnswer.trim().toLowerCase());

                      return (
                        <div key={idx} className="border border-gray-150 rounded-xl p-5 bg-white shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-center mb-3">
                            <span className="font-bold text-purple-600 text-xs">PERTANYAAN #{idx + 1}</span>
                            {item.correctAnswer ? (
                              isCorrect ? (
                                <span className="text-xs text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-md flex items-center gap-1 border border-green-100">
                                  <CheckCircle size={12} className="text-green-500" /> Benar
                                </span>
                              ) : (
                                <span className="text-xs text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded-md flex items-center gap-1 border border-red-100">
                                  <XCircle size={12} className="text-red-500" /> Salah
                                </span>
                              )
                            ) : (
                              <span className="text-xs text-gray-500 font-medium bg-gray-50 px-2 py-0.5 rounded-md">Esai</span>
                            )}
                          </div>

                          <p className="font-semibold text-gray-800 mb-3 text-sm leading-relaxed whitespace-pre-wrap">{item.questionText || item.q}</p>
                          
                          {isMultipleChoice && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3 bg-gray-55/50 p-3 rounded-lg border border-gray-100">
                              {item.options.map((opt, i) => {
                                const letter = String.fromCharCode(65 + i);
                                const isThisCorrect = item.correctAnswer === letter;
                                const isThisChosen = item.answerText.trim().startsWith(letter + '.');
                                return (
                                  <div 
                                    key={i} 
                                    className={`text-xs p-2 rounded-md font-medium border ${
                                      isThisCorrect 
                                        ? 'bg-green-50 border-green-200 text-green-800 font-semibold' 
                                        : isThisChosen 
                                          ? 'bg-red-50 border-red-200 text-red-800' 
                                          : 'bg-white border-gray-150 text-gray-700'
                                    }`}
                                  >
                                    <span className="font-bold">{letter}.</span> {opt} {isThisCorrect && '✔️'} {isThisChosen && !isThisCorrect && '❌'}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          <div className="bg-purple-50/30 border border-purple-100 rounded-lg p-3.5">
                            <span className="block text-xs font-bold text-purple-800/60 mb-1.5 uppercase tracking-wider">Jawaban Pelamar:</span>
                            <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed font-semibold">
                              {item.answerText || '- (Kosong)'}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
            
            <div className="p-4 border-t border-gray-100 bg-white flex justify-end">
              <button 
                onClick={() => setShowPsikotesResult(null)}
                className="px-5 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg font-bold text-xs transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hasil Wawancara Modal */}
      {hasilWawancaraModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-orange-500 to-orange-700 p-6 flex justify-between items-start text-white">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <FileText /> Evaluasi Hasil Wawancara
                </h3>
                <p className="text-orange-100 text-sm mt-1">Ringkasan wawancara untuk {hasilWawancaraModal.name}</p>
              </div>
              <button onClick={() => setHasilWawancaraModal(null)} className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              <div className="bg-orange-50 rounded-xl p-4 flex gap-4 items-center border border-orange-100">
                <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center border border-orange-200 text-2xl font-bold text-orange-600 shadow-sm">
                  {hasilWawancaraModal.interview_score || 85}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-lg">Skor Analisis AI</h4>
                  <p className="text-sm text-gray-600">Skor ini dihitung secara otomatis berdasarkan transkrip dan kecocokan profil selama sesi wawancara.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm">
                  <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <BrainCircuit size={18} className="text-orange-500" /> Kesimpulan AI
                  </h4>
                  <p className="text-gray-700 leading-relaxed text-sm bg-gray-50 p-4 rounded-lg">
                    {hasilWawancaraModal.interview_conclusion || "Kandidat menunjukkan komunikasi yang baik dan pengalaman yang relevan. Sangat disarankan untuk mempertimbangkan kandidat ini untuk tahap selanjutnya."}
                  </p>
                </div>

                <div className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm">
                  <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <FileText size={18} className="text-blue-500" /> Catatan Tambahan (Otomatis)
                  </h4>
                  <pre className="text-gray-700 text-sm bg-gray-50 p-4 rounded-lg whitespace-pre-wrap font-sans">
                    {hasilWawancaraModal.interview_notes || "- Memiliki dasar yang kuat\n- Antusias terhadap peran ini"}
                  </pre>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-4 justify-end">
              <button 
                onClick={() => {
                  setConfirmStatusModal({ isOpen: true, applicantId: hasilWawancaraModal.id, targetStatus: 'Ditolak', title: 'Tolak Kandidat?', message: `Apakah Anda yakin ingin menolak ${hasilWawancaraModal.name}?` });
                  setHasilWawancaraModal(null);
                }}
                className="px-6 py-2.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl font-bold transition-colors flex items-center gap-2"
              >
                <ThumbsDown size={18} /> Tolak Kandidat
              </button>
              <button 
                onClick={() => {
                  setConfirmStatusModal({ isOpen: true, applicantId: hasilWawancaraModal.id, targetStatus: 'Diterima', title: 'Terima Kandidat?', message: `Apakah Anda yakin ingin menerima ${hasilWawancaraModal.name}?` });
                  setHasilWawancaraModal(null);
                }}
                className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-colors shadow-lg flex items-center gap-2"
              >
                <ThumbsUp size={18} /> Terima Kandidat
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
