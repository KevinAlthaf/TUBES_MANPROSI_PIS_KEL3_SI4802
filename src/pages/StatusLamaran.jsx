import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, Clock, MapPin, XCircle, BrainCircuit, CalendarClock, ExternalLink, FileText, Search, Building2, Video } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Sub-component: Interview Room Status for each application
function InterviewRoomStatus({ app }) {
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let interval;
    const fetchRoom = async () => {
      try {
        const res = await fetch(`${API_URL}/interview-rooms/applicant/${app.id}`);
        const data = await res.json();
        setRoom(data);
      } catch (err) {
        console.error('Failed to fetch room:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRoom();
    // Poll every 5 seconds to check if HRD created a room
    interval = setInterval(fetchRoom, 5000);
    return () => clearInterval(interval);
  }, [app.id]);

  if (loading) {
    return (
      <div className="mt-8 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 shadow-inner">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-blue-700 font-medium">Memeriksa status room interview...</span>
        </div>
      </div>
    );
  }

  // No room created yet
  if (!room) {
    return (
      <div className="mt-8 p-5 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-inner">
        <div>
          <h4 className="font-bold text-gray-700 flex items-center gap-2 mb-1">
            <Clock size={20} className="text-gray-500"/> Menunggu Room Interview
          </h4>
          <p className="text-sm text-gray-600">HRD belum membuat room interview untuk Anda. Silakan tunggu, halaman ini akan otomatis ter-update.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
          Menunggu...
        </div>
      </div>
    );
  }

  // Room is scheduled for the future
  if (room.status === 'scheduled' && room.scheduled_at) {
    const scheduledDate = new Date(room.scheduled_at);
    const now = new Date();
    const isReady = scheduledDate <= now;

    if (!isReady) {
      return (
        <div className="mt-8 p-5 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-inner">
          <div>
            <h4 className="font-bold text-amber-900 flex items-center gap-2 mb-1">
              <CalendarClock size={20} className="text-amber-600"/> Interview Terjadwal
            </h4>
            <p className="text-sm text-amber-700">
              Room <span className="font-bold">"{room.room_name}"</span> dijadwalkan pada:
            </p>
            <p className="text-lg font-bold text-amber-900 mt-1">
              {scheduledDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} — {scheduledDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
            </p>
          </div>
          <div className="flex flex-col items-center gap-1 text-xs text-amber-600 font-medium bg-amber-100 px-4 py-3 rounded-xl border border-amber-200">
            <CalendarClock size={24} className="text-amber-500" />
            Belum Waktunya
          </div>
        </div>
      );
    }
  }

  // Room has ended
  if (room.status === 'ended') {
    return (
      <div className="mt-8 p-5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-inner">
        <div>
          <h4 className="font-bold text-green-950 flex items-center gap-2 mb-1">
            <CheckCircle2 size={20} className="text-green-600"/> Wawancara Selesai
          </h4>
          <p className="text-sm text-green-800">
            Sesi wawancara Anda telah selesai dilaksanakan. Silakan tunggu informasi hasil seleksi selanjutnya dari tim HRD.
          </p>
        </div>
      </div>
    );
  }

  // Room is ready (waiting/active/scheduled but time has passed)
  return (
    <div className="mt-8 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-inner">
      <div>
        <h4 className="font-bold text-blue-900 flex items-center gap-2 mb-1">
          <Video size={20} className="text-blue-600"/> Room Interview Siap!
        </h4>
        <p className="text-sm text-blue-700">
          Room <span className="font-bold">"{room.room_name}"</span> sudah dibuat oleh HRD. Klik tombol di bawah untuk bergabung.
        </p>
        <p className="text-xs text-blue-500 mt-1">Kode Room: {room.room_code}</p>
      </div>
      <button 
        onClick={() => navigate(`/interview-room/${room.id}`)} 
        className="w-full sm:w-auto flex justify-center items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 hover:shadow-lg transition-all whitespace-nowrap"
      >
        <ExternalLink size={18} /> Gabung Meeting
      </button>
    </div>
  );
}

export default function StatusLamaran() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  
  // States for checkbox filters
  const [selectedStatuses, setSelectedStatuses] = useState(['Semua']);
  const [timeFilter, setTimeFilter] = useState('Semua');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      // 1. Gunakan variabel Vercel yang sudah kita buat di .env
      const API_URL = import.meta.env.VITE_API_URL || '/api';
      
      fetch(`${API_URL}/applications/${user.id}`)
        .then(res => res.json())
        .then(data => {
          // 2. Amankan state: pastikan yang masuk HANYA array
          // Jika data ternyata error/bukan array, jadikan array kosong []
          setApplications(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setApplications([]); // Pastikan array kosong saat koneksi gagal
          setLoading(false);
        });
    }
  }, [user]);

  const handleStatusToggle = (status) => {
    if (status === 'Semua') {
      setSelectedStatuses(['Semua']);
      return;
    }

    setSelectedStatuses(prev => {
      const newArr = prev.filter(s => s !== 'Semua');
      if (newArr.includes(status)) {
        const removed = newArr.filter(s => s !== status);
        return removed.length === 0 ? ['Semua'] : removed;
      } else {
        return [...newArr, status];
      }
    });
  };

  const filteredApps = applications.filter(app => {
    let statusMatch = true;
    if (!selectedStatuses.includes('Semua')) {
      // Map frontend status labels to backend statuses
      const appStatus = app.status; // backend: Menunggu, Psikotes, Interview, Diterima, Ditolak
      const hasTerkirim = selectedStatuses.includes('Terkirim'); // Assume Terkirim is Menunggu
      const hasBerkas = selectedStatuses.includes('Seleksi Berkas'); // Menunggu
      const hasPsikotest = selectedStatuses.includes('Lolos Psikotest'); // Psikotes
      const hasInterview = selectedStatuses.includes('Lolos Interview'); // Interview
      const hasDiterima = selectedStatuses.includes('Diterima'); // Diterima
      const hasDitolak = selectedStatuses.includes('Ditolak'); // Ditolak

      statusMatch = 
        ((hasTerkirim || hasBerkas) && appStatus === 'Menunggu') ||
        (hasPsikotest && appStatus === 'Psikotes') ||
        (hasInterview && (appStatus === 'Interview' || appStatus === 'Menunggu Hasil')) ||
        (hasDiterima && appStatus === 'Diterima') ||
        (hasDitolak && appStatus === 'Ditolak');
    }
    
    let timeMatch = true;
    const appDate = new Date(app.created_at);
    const now = new Date();
    const diffDays = Math.ceil((now - appDate) / (1000 * 60 * 60 * 24));
    
    if (timeFilter === '14 Hari') timeMatch = diffDays <= 14;
    else if (timeFilter === '1 Bulan') timeMatch = diffDays <= 30;
    else if (timeFilter === '3 Bulan') timeMatch = diffDays <= 90;

    return statusMatch && timeMatch;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'Ditolak': return 'text-red-600 bg-red-50 border-red-200';
      case 'Diterima': return 'text-green-600 bg-green-50 border-green-200';
      case 'Interview': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'Psikotes': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'Menunggu Hasil': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-orange-600 bg-orange-50 border-orange-200';
    }
  };

  const getProgressSteps = (app) => {
    const steps = [
      { label: 'Terkirim', completed: true },
      { label: 'Seleksi Berkas', completed: app.status !== 'Menunggu', current: app.status === 'Menunggu' },
      { label: 'Psikotest', required: app.psikotes === 1, completed: app.status === 'Interview' || app.status === 'Menunggu Hasil' || app.status === 'Diterima', current: app.status === 'Psikotes' },
      { label: 'Interview', completed: app.status === 'Menunggu Hasil' || app.status === 'Diterima', current: app.status === 'Interview' },
      { label: 'Hasil', completed: app.status === 'Diterima' || app.status === 'Ditolak', current: app.status === 'Menunggu Hasil' || app.status === 'Diterima' || app.status === 'Ditolak' }
    ];
    return steps.filter(s => s.required !== false);
  };

  if (loading) return <div className="p-12 text-center text-gray-500 font-medium">Memuat data lamaran...</div>;

  const statusOptions = ['Semua', 'Terkirim', 'Seleksi Berkas', 'Lolos Psikotest', 'Lolos Interview', 'Diterima', 'Ditolak'];
  const timeOptions = [
    { id: 'Semua', label: 'Semua Waktu' },
    { id: '14 Hari', label: '14 Hari Terakhir' },
    { id: '1 Bulan', label: '1 Bulan Terakhir' },
    { id: '3 Bulan', label: '3 Bulan Terakhir' }
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row gap-8">
      
      {/* Sidebar Filters */}
      <div className="w-full md:w-64 flex-shrink-0">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Status Lamaran</h1>
        
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6">
          <h3 className="font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100 text-sm tracking-wide">FILTER STATUS</h3>
          <div className="space-y-3">
            {statusOptions.map(opt => (
              <label key={opt} className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors border ${
                  selectedStatuses.includes(opt) 
                    ? 'bg-blue-600 border-blue-600 text-white' 
                    : 'bg-white border-gray-300 group-hover:border-blue-400'
                }`}>
                  {selectedStatuses.includes(opt) && <CheckCircle2 size={14} className="stroke-[3]" />}
                </div>
                <span className={`text-sm ${selectedStatuses.includes(opt) ? 'text-blue-900 font-medium' : 'text-gray-600'}`}>
                  {opt}
                </span>
                {/* Invisible input */}
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={selectedStatuses.includes(opt)}
                  onChange={() => handleStatusToggle(opt)}
                />
              </label>
            ))}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100 text-sm tracking-wide">RENTANG WAKTU</h3>
          <div className="space-y-3">
            {timeOptions.map(opt => (
              <label key={opt.id} className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors border flex-shrink-0 ${
                  timeFilter === opt.id 
                    ? 'border-blue-600 border-4' 
                    : 'border-gray-300 group-hover:border-blue-400'
                }`}></div>
                <span className={`text-sm ${timeFilter === opt.id ? 'text-blue-900 font-medium' : 'text-gray-600'}`}>
                  {opt.label}
                </span>
                {/* Invisible input */}
                <input 
                  type="radio" 
                  name="timeFilter"
                  className="hidden" 
                  checked={timeFilter === opt.id}
                  onChange={() => setTimeFilter(opt.id)}
                />
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 mt-1 md:mt-12">
        {filteredApps.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center flex flex-col items-center">
            <div className="w-32 h-32 bg-blue-50 rounded-full mb-6 flex items-center justify-center">
              <div className="text-blue-300 relative">
                <FileText size={60} strokeWidth={1.5} />
                <Search className="absolute -bottom-2 -right-2 text-blue-500 bg-white rounded-full p-1 shadow-sm" size={32} />
              </div>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Belum ada lamaran</h2>
            <p className="text-gray-500 max-w-md mx-auto mb-8">Kamu belum memiliki riwayat lamaran yang sesuai dengan filter. Ayo mulai cari lowongan impianmu!</p>
            <Link to="/pelamar/dashboard" className="bg-blue-600 text-white font-bold px-8 py-3.5 rounded-xl hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 transition-all">
              Cari Lowongan
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredApps.map(app => (
              <div key={app.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-6 border-b border-gray-50 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0 shadow-sm text-gray-400">
                      <Building2 size={32} />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl text-gray-900 mb-1">{app.job_title}</h3>
                      <p className="text-gray-600 font-medium mb-3">{app.company_name || 'PT. Inovasi Teknologi'}</p>
                      <div className="flex flex-wrap gap-2 text-xs font-medium text-gray-500">
                        <span className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-lg">
                          <MapPin size={14}/> {app.job_location}
                        </span>
                        <span className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-lg">
                          <Clock size={14}/> Dilamar {new Date(app.created_at).toLocaleDateString('id-ID')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className={`px-4 py-2 rounded-full text-sm font-bold border whitespace-nowrap self-start ${getStatusColor(app.status)}`}>
                    {app.status === 'Menunggu' ? 'Seleksi Berkas' : app.status}
                  </div>
                </div>
                
                {/* Progress Timeline */}
                <div className="p-6 bg-gradient-to-b from-gray-50/50 to-white">
                  <div className="relative max-w-3xl mx-auto py-4">
                    <div className="absolute top-1/2 left-4 right-4 h-1 bg-gray-100 -translate-y-1/2 z-0 rounded-full"></div>
                    
                    {/* Progress Bar Fill */}
                    <div 
                      className="absolute top-1/2 left-4 h-1 bg-blue-500 -translate-y-1/2 z-0 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${
                          (getProgressSteps(app).findIndex(s => s.current) / (getProgressSteps(app).length - 1)) * 100
                        }%` 
                      }}
                    ></div>

                    <div className="relative z-10 flex justify-between">
                      {getProgressSteps(app).map((step, idx) => (
                        <div key={idx} className="flex flex-col items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-sm mb-3 transition-colors
                            ${step.completed ? 'bg-green-500 text-white' : step.current ? 'bg-blue-600 text-white ring-4 ring-blue-100' : 'bg-gray-100 text-gray-300'}
                          `}>
                            {step.completed ? <CheckCircle2 size={18} strokeWidth={2.5} /> : step.current && app.status === 'Ditolak' ? <XCircle size={18} strokeWidth={2.5} /> : <div className={`w-2.5 h-2.5 rounded-full ${step.current ? 'bg-white' : 'bg-gray-300'}`}></div>}
                          </div>
                          <span className={`text-xs font-bold text-center max-w-[90px]
                            ${step.completed ? 'text-green-600' : step.current ? (app.status === 'Ditolak' ? 'text-red-600' : 'text-blue-700') : 'text-gray-400'}
                          `}>{step.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Call to Actions for specific statuses */}
                  {app.status === 'Psikotes' && (
                    <div className="mt-8 p-5 bg-gradient-to-r from-purple-50 to-fuchsia-50 rounded-xl border border-purple-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-inner">
                      <div>
                        <h4 className="font-bold text-purple-900 flex items-center gap-2 mb-1"><BrainCircuit size={20} className="text-purple-600"/> Psikotest Online</h4>
                        <p className="text-sm text-purple-700">Anda lolos seleksi berkas. Selesaikan tahap psikotest untuk lanjut ke tahap Interview.</p>
                      </div>
                      <Link to={`/pelamar/psikotest/${app.id}`} className="w-full sm:w-auto text-center bg-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-700 hover:shadow-lg transition-all whitespace-nowrap">
                        Mulai Psikotest
                      </Link>
                    </div>
                  )}

                  {app.status === 'Interview' && (
                    <InterviewRoomStatus app={app} />
                  )}

                  {app.status === 'Menunggu Hasil' && (
                    <div className="mt-8 p-5 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl border border-yellow-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-inner">
                      <div>
                        <h4 className="font-bold text-yellow-900 flex items-center gap-2 mb-1"><Clock size={20} className="text-yellow-600"/> Menunggu Hasil dari HRD</h4>
                        <p className="text-sm text-yellow-800">Interview telah selesai. Silakan tunggu informasi selanjutnya dari tim HRD terkait hasil lamaran Anda.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
