import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MonitorUp, Settings, Mic, MicOff, Video, VideoOff, MessageSquare, X, Send, Users, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export default function InterviewRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Room data from DB
  const [roomData, setRoomData] = useState(null);
  const [roomLoading, setRoomLoading] = useState(true);
  const [roomError, setRoomError] = useState(null);

  // Participant presence
  const [hrdOnline, setHrdOnline] = useState(false);
  const [pelamarOnline, setPelamarOnline] = useState(false);

  // Controls State
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  
  // Speech-to-Text Recognition State
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [lastChatId, setLastChatId] = useState(0);
  const chatEndRef = useRef(null);

  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedMic, setSelectedMic] = useState('default');
  const [selectedCamera, setSelectedCamera] = useState('default');

  // WebRTC Refs & States
  const localVideoRef = useRef(null);
  const screenVideoRef = useRef(null);
  const [localStream, setLocalStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);

  // ============================
  // 1. LOAD ROOM DATA FROM DB
  // ============================
  useEffect(() => {
    async function loadRoom() {
      try {
        const res = await fetch(`${API_URL}/interview-rooms/${roomId}`);
        if (!res.ok) {
          setRoomError('Room tidak ditemukan.');
          setRoomLoading(false);
          return;
        }
        const data = await res.json();
        setRoomData(data);
        setChatMessages([{ sender: 'system', text: `Selamat datang di ${data.room_name}` }]);
      } catch (err) {
        setRoomError('Gagal memuat data room.');
      } finally {
        setRoomLoading(false);
      }
    }
    loadRoom();
  }, [roomId]);

  // ============================
  // 2. HEARTBEAT - Presence Detection
  // ============================
  useEffect(() => {
    if (!roomData || !user) return;

    const sendHeartbeat = async () => {
      try {
        const res = await fetch(`${API_URL}/interview-rooms/${roomId}/heartbeat`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: user.role })
        });
        const data = await res.json();
        setHrdOnline(data.hrdOnline);
        setPelamarOnline(data.pelamarOnline);
      } catch (err) {
        console.error('Heartbeat error:', err);
      }
    };

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 5000);
    return () => clearInterval(interval);
  }, [roomData, user, roomId]);

  // ============================
  // 3. CHAT POLLING FROM DB
  // ============================
  const fetchNewChats = useCallback(async () => {
    if (!roomData) return;
    try {
      const res = await fetch(`${API_URL}/interview-rooms/${roomId}/chats?after_id=${lastChatId}`);
      const newMsgs = await res.json();
      if (newMsgs.length > 0) {
        const mapped = newMsgs.map(m => ({
          id: m.id,
          sender: m.sender_id === user?.id ? 'Anda' : m.sender_name,
          senderRole: m.sender_role,
          text: m.message
        }));
        setChatMessages(prev => [...prev, ...mapped]);
        setLastChatId(newMsgs[newMsgs.length - 1].id);
      }
    } catch (err) {
      console.error('Chat poll error:', err);
    }
  }, [roomData, roomId, lastChatId, user]);

  useEffect(() => {
    if (!roomData) return;
    const interval = setInterval(fetchNewChats, 3000);
    return () => clearInterval(interval);
  }, [fetchNewChats, roomData]);

  // Refs to avoid stale closures in Speech Recognition
  const roomDataRef = useRef(null);
  const userRef = useRef(null);
  useEffect(() => {
    roomDataRef.current = roomData;
    userRef.current = user;
  }, [roomData, user]);

  // ============================
  // 4. SPEECH RECOGNITION
  // ============================
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'id-ID';
      rec.maxAlternatives = 1;

      rec.onresult = (event) => {
        let interimTranscript = '';
        let localFinal = '';
        
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i];
          if (result.isFinal) {
            localFinal += result[0].transcript + ' ';
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        if (localFinal.trim()) {
          setTranscript(prev => prev + localFinal);
          const currentRoom = roomDataRef.current;
          const currentUser = userRef.current;
          if (currentRoom?.applicant_id) {
            const displayName = currentUser?.role === 'HRD' ? `HRD (${currentUser.name})` : currentUser?.name || currentUser?.role || 'Pelamar';
            fetch(`${API_URL}/applicants/${currentRoom.applicant_id}/transcript/append`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ senderName: displayName, text: localFinal })
            }).catch(err => console.error("Gagal mengirim potongan transkrip ke backend:", err));
          }
        }
        
        setInterimText(interimTranscript);
      };

      rec.onerror = (event) => {
        console.error("Speech Recognition Error:", event.error);
      };

      rec.onend = () => {
        try {
          rec.start();
        } catch (e) {}
      };

      recognitionRef.current = rec;
      try {
        rec.start();
        setIsListening(true);
      } catch (err) {
        console.error("Failed to start Speech Recognition:", err);
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  // ============================
  // 5. WEBCAM SETUP
  // ============================
  useEffect(() => {
    let activeStream = null;
    async function setupMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        activeStream = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Gagal mengakses kamera/mic:", err);
      }
    }
    setupMedia();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Sync Video/Audio Toggle
  useEffect(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = isMicOn;
      });
      localStream.getVideoTracks().forEach(track => {
        track.enabled = isVideoOn;
      });
    }
  }, [isMicOn, isVideoOn, localStream]);

  // Sync Screen Stream
  useEffect(() => {
    if (isScreenSharing && screenStream && screenVideoRef.current) {
      screenVideoRef.current.srcObject = screenStream;
    }
  }, [isScreenSharing, screenStream]);

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
        setScreenStream(null);
      }
      setIsScreenSharing(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        setScreenStream(stream);
        setIsScreenSharing(true);
        
        stream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          setScreenStream(null);
        };
      } catch (err) {
        console.error("Gagal share screen:", err);
      }
    }
  };

  // Auto-scroll chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isChatOpen]);

  // ============================
  // 6. END SESSION
  // ============================
  const handleEndSession = async () => {
    if (localStream) localStream.getTracks().forEach(t => t.stop());
    if (screenStream) screenStream.getTracks().forEach(t => t.stop());
    
    if (user?.role === 'Pelamar') {
      try {
        await fetch(`${API_URL}/applications/finish-interview/${user.id}`, { method: 'PUT' });
      } catch (err) {}
      navigate('/pelamar/status-lamaran');
    } else {
      // HRD: save transcript and end room
      if (transcript.trim() && roomData) {
        try {
          await fetch(`${API_URL}/applicants/${roomData.applicant_id}/transcript`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transcript: transcript })
          });
        } catch (err) {
          console.error("Failed to save transcript:", err);
        }
      }
      // Update room status to ended
      try {
        await fetch(`${API_URL}/interview-rooms/${roomId}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'ended' })
        });
      } catch (err) {}
      navigate('/wawancara');
    }
  };

  // ============================
  // 7. SEND CHAT MESSAGE (to DB)
  // ============================
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !roomData) return;
    const msgText = newMessage.trim();
    setNewMessage('');

    try {
      const res = await fetch(`${API_URL}/interview-rooms/${roomId}/chats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: user.id,
          senderName: user.name || user.role,
          senderRole: user.role,
          message: msgText
        })
      });
      const data = await res.json();
      if (data.success) {
        setChatMessages(prev => [...prev, { id: data.id, sender: 'Anda', senderRole: user.role, text: msgText }]);
        setLastChatId(data.id);
        // Also add to transcript for AI analysis (HRD only)
        if (user.role === 'HRD') {
          setTranscript(prev => prev + `[Catatan HRD]: ${msgText}. `);
        }
      }
    } catch (err) {
      console.error('Send chat error:', err);
    }
  };

  // ============================
  // LOADING / ERROR STATES
  // ============================
  if (roomLoading) {
    return (
      <div className="min-h-screen bg-[#1a1c29] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={48} className="text-blue-500 animate-spin" />
          <p className="text-gray-400 text-lg font-medium">Memuat room interview...</p>
        </div>
      </div>
    );
  }

  if (roomError || !roomData) {
    return (
      <div className="min-h-screen bg-[#1a1c29] flex items-center justify-center">
        <div className="bg-[#242736] p-8 rounded-2xl border border-gray-700 text-center max-w-md">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <X size={32} className="text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Room Tidak Ditemukan</h2>
          <p className="text-gray-400 mb-6">{roomError || 'Room interview ini tidak tersedia atau sudah berakhir.'}</p>
          <button 
            onClick={() => navigate(user?.role === 'Pelamar' ? '/pelamar/status-lamaran' : '/wawancara')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  const isPelamar = user?.role === 'Pelamar';
  const isFinished = roomData?.status === 'ended' || (isPelamar && roomData?.applicant_status && roomData.applicant_status !== 'Interview');

  if (isFinished && isPelamar) {
    return (
      <div className="min-h-screen bg-[#1a1c29] flex items-center justify-center font-sans p-4">
        <div className="bg-[#242736] p-8 rounded-3xl border border-gray-800 text-center max-w-md shadow-2xl relative overflow-hidden">
          {/* Decorative glows */}
          <div className="absolute -top-12 -left-12 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl"></div>

          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20 shadow-[0_0_20px_rgba(34,197,94,0.15)] animate-pulse">
            <CheckCircle2 size={40} className="text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3 tracking-wide">Wawancara Selesai</h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-8">
            Terima kasih telah mengikuti sesi wawancara untuk posisi <span className="text-blue-400 font-semibold">{roomData.job_title}</span>. Evaluasi Anda sedang diproses oleh tim HRD perusahaan.
          </p>
          <button 
            onClick={() => navigate('/pelamar/status-lamaran')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition-all hover:shadow-[0_0_20px_rgba(37,99,235,0.4)]"
          >
            Kembali ke Status Lamaran
          </button>
        </div>
      </div>
    );
  }

  // Determine who is the counterpart
  const isHRD = user?.role === 'HRD' || user?.role === 'Operator';
  const counterpartName = isHRD ? roomData.applicant_name : roomData.hrd_name;
  const counterpartOnline = isHRD ? pelamarOnline : hrdOnline;
  const myOnline = isHRD ? hrdOnline : pelamarOnline;

  return (
    <div className="min-h-screen bg-[#1a1c29] flex overflow-hidden relative font-sans">
      
      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col items-center justify-between p-6 relative transition-all duration-300 ${isChatOpen ? 'mr-80' : ''}`}>
        
        {/* Room Header Info */}
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-10 flex flex-col items-center gap-2">
          <div className="text-gray-400 text-sm font-semibold tracking-wider uppercase px-4 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-gray-800/50 shadow-sm">{roomData.room_name}</div>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-gray-500">Kode: <span className="text-indigo-400 font-mono font-bold">{roomData.room_code}</span></span>
            <span className="text-gray-600">|</span>
            <div className="flex items-center gap-1.5">
              <Users size={12} className="text-gray-500" />
              <span className={`flex items-center gap-1 ${counterpartOnline ? 'text-green-400' : 'text-gray-500'}`}>
                <span className={`w-2 h-2 rounded-full ${counterpartOnline ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`}></span>
                {counterpartName} {counterpartOnline ? '(Online)' : '(Offline)'}
              </span>
            </div>
          </div>
        </div>

        {/* Live Speech-to-Text Status Indicator */}
        <div className="w-full max-w-6xl flex items-center justify-between px-4 py-2.5 bg-indigo-950/40 backdrop-blur-md rounded-2xl border border-indigo-500/20 shadow-sm mt-20 -mb-12 z-10">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <span className="text-[10px] font-bold text-red-200 uppercase tracking-wider">Asisten AI Transkrip Aktif</span>
          </div>
          <p className="text-xs text-indigo-200 truncate max-w-[70%] font-medium">
            {interimText ? (
              <span className="text-yellow-300 italic animate-pulse">Mendengar (Real-Time): "{interimText}..."</span>
            ) : transcript ? (
              <span className="text-indigo-100 italic">Terdengar: "{transcript.slice(-70)}..."</span>
            ) : (
              <span className="text-indigo-300">AI mendengarkan suara Anda secara real-time. Bicara pelan & jelas, atau ketik catatan cepat di chat sidebar...</span>
            )}
          </p>
        </div>

        {/* Video Grid — HRD on LEFT, Pelamar on RIGHT */}
        <div className="w-full max-w-6xl flex-1 flex flex-col md:flex-row items-center justify-center gap-6 mt-16 mb-24 transition-all">
          
          {/* LEFT: Your video (local camera) */}
          <div className={`aspect-video bg-gray-900 rounded-3xl overflow-hidden relative shadow-lg transition-all ${isScreenSharing ? 'w-1/4 absolute bottom-24 left-6 z-20 border-2 border-blue-500' : 'w-full md:w-1/2'}`}>
            <video 
              ref={localVideoRef}
              autoPlay 
              playsInline 
              muted
              className={`w-full h-full object-cover ${!isVideoOn ? 'hidden' : ''}`}
            />
            {!isVideoOn && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center text-white">
                  <VideoOff size={32} />
                </div>
              </div>
            )}
            <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-xs font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400"></span>
              {user?.name || (isHRD ? 'HRD' : 'Pelamar')} (Anda) {!isMicOn && ' - Muted'}
            </div>
          </div>

          {/* RIGHT: Counterpart video area or Screen Share */}
          <div className={`aspect-video bg-gray-900 rounded-3xl overflow-hidden relative shadow-lg transition-all ${isScreenSharing ? 'w-full max-w-5xl' : 'w-full md:w-1/2'}`}>
            {isScreenSharing ? (
              <video 
                ref={screenVideoRef}
                autoPlay 
                playsInline 
                className="w-full h-full object-contain bg-black"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                {counterpartOnline ? (
                  <>
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg ring-4 ring-green-400/30">
                      {counterpartName?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <p className="text-white font-semibold mt-4 text-lg">{counterpartName}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse"></span>
                      <span className="text-green-400 text-sm font-medium">Sedang Online di Room</span>
                    </div>
                    <p className="text-gray-500 text-xs mt-3 max-w-xs text-center">Video peer-to-peer membutuhkan WebRTC signaling server. Saat ini kedua pihak berada di room yang sama dan dapat berkomunikasi via chat.</p>
                  </>
                ) : (
                  <>
                    <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 text-3xl font-bold">
                      {counterpartName?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <p className="text-gray-400 font-semibold mt-4 text-lg">{counterpartName}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-gray-500"></span>
                      <span className="text-gray-500 text-sm font-medium">Belum Bergabung</span>
                    </div>
                    <div className="flex items-center gap-2 mt-4 bg-gray-800 border border-gray-700 px-4 py-2 rounded-full">
                      <Loader2 size={14} className="text-blue-400 animate-spin" />
                      <span className="text-gray-400 text-xs">Menunggu {counterpartName} bergabung...</span>
                    </div>
                  </>
                )}
              </div>
            )}
            <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-xs font-medium flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${counterpartOnline ? 'bg-green-400' : 'bg-gray-500'}`}></span>
              {isScreenSharing ? 'Layar Anda' : counterpartName}
            </div>
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-6 w-full max-w-6xl flex items-center justify-between px-6 z-10">
          
          {/* Left: Screen Share */}
          <div>
            <button 
              onClick={toggleScreenShare}
              className={`w-12 h-12 rounded-xl border transition-colors flex items-center justify-center ${isScreenSharing ? 'bg-blue-600 border-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]' : 'border-gray-600 bg-[#242736] text-white hover:bg-gray-700'}`}
              title="Bagikan Layar"
            >
              <MonitorUp size={24} />
            </button>
          </div>

          {/* Center: Controls & End Session */}
          <div className="flex items-center gap-4 bg-[#242736] px-6 py-2 rounded-2xl shadow-lg border border-gray-700">
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-800 hover:bg-white transition-colors"
              title="Pengaturan"
            >
              <Settings size={22} />
            </button>
            <button 
              onClick={() => setIsMicOn(!isMicOn)}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isMicOn ? 'bg-gray-200 text-gray-800 hover:bg-white' : 'bg-red-500 text-white hover:bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.5)]'}`}
              title="Toggle Mic"
            >
              {isMicOn ? <Mic size={22} /> : <MicOff size={22} />}
            </button>
            <button 
              onClick={() => setIsVideoOn(!isVideoOn)}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isVideoOn ? 'bg-gray-200 text-gray-800 hover:bg-white' : 'bg-red-500 text-white hover:bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.5)]'}`}
              title="Toggle Camera"
            >
              {isVideoOn ? <Video size={22} /> : <VideoOff size={22} />}
            </button>

            <div className="w-px h-8 bg-gray-600 mx-2"></div>

            <button 
              onClick={handleEndSession}
              className="bg-[#e53935] hover:bg-[#d32f2f] text-white px-6 py-3 rounded-lg flex items-center gap-2 font-semibold transition-colors shadow-[0_0_15px_rgba(229,57,53,0.3)]"
            >
              <X size={20} strokeWidth={3} /> Akhiri Sesi
            </button>
          </div>

          {/* Right: Chat */}
          <div>
            <button 
              onClick={() => setIsChatOpen(!isChatOpen)}
              className={`w-12 h-12 rounded-xl border transition-colors flex items-center justify-center relative ${isChatOpen ? 'bg-white border-white text-gray-900' : 'border-gray-600 bg-[#242736] text-white hover:bg-gray-700'}`}
              title="Buka Chat"
            >
              <MessageSquare size={24} />
              {!isChatOpen && chatMessages.length > 1 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              )}
            </button>
          </div>

        </div>
      </div>
      
      {/* Chat Sidebar */}
      <div className={`fixed right-0 top-0 bottom-0 w-80 bg-white shadow-2xl transform transition-transform duration-300 z-50 flex flex-col ${isChatOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <MessageSquare size={18} className="text-blue-600" /> Pesan Ruangan
          </h3>
          <button onClick={() => setIsChatOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-200 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Online Status Bar */}
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${hrdOnline ? 'bg-green-400' : 'bg-gray-300'}`}></span>
            <span className={hrdOnline ? 'text-green-700 font-medium' : 'text-gray-400'}>
              {isHRD ? `${roomData.hrd_name || user?.name || 'HRD'} (Anda)` : (roomData.hrd_name || 'HRD')}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${pelamarOnline ? 'bg-green-400' : 'bg-gray-300'}`}></span>
            <span className={pelamarOnline ? 'text-green-700 font-medium' : 'text-gray-400'}>
              {!isHRD ? `${roomData.applicant_name || user?.name || 'Pelamar'} (Anda)` : (roomData.applicant_name || 'Pelamar')}
            </span>
          </div>
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto bg-white space-y-4">
          {chatMessages.map((msg, idx) => (
            <div key={msg.id || idx} className={`flex flex-col ${msg.sender === 'Anda' ? 'items-end' : msg.sender === 'system' ? 'items-center' : 'items-start'}`}>
              {msg.sender === 'system' ? (
                <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full">{msg.text}</span>
              ) : (
                <div className={`max-w-[85%] rounded-2xl px-4 py-2 ${msg.sender === 'Anda' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}>
                  <p className="text-sm">{msg.text}</p>
                </div>
              )}
              {msg.sender !== 'system' && <span className="text-[10px] text-gray-400 mt-1 mx-1">{msg.sender}{msg.senderRole ? ` (${msg.senderRole})` : ''}</span>}
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <input 
              type="text" 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Ketik pesan..." 
              className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
            />
            <button type="submit" disabled={!newMessage.trim()} className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center disabled:opacity-50 hover:bg-blue-700 transition-colors shrink-0">
              <Send size={16} className="-ml-0.5" />
            </button>
          </form>
        </div>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Settings size={20} className="text-gray-600" /> Pengaturan Perangkat
              </h3>
              <button onClick={() => setIsSettingsOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-200 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Mikrofon (Audio Input)</label>
                <select 
                  value={selectedMic} 
                  onChange={(e) => setSelectedMic(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="default">Default - Mikrofon Bawaan</option>
                  <option value="external">External USB Microphone</option>
                  <option value="headset">Headset Microphone</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Kamera (Video Input)</label>
                <select 
                  value={selectedCamera} 
                  onChange={(e) => setSelectedCamera(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="default">Default - HD Web Camera</option>
                  <option value="virtual">OBS Virtual Camera</option>
                </select>
              </div>

              <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mt-6">
                <p className="text-xs text-blue-700">Perubahan pengaturan akan otomatis tersimpan. Pastikan browser Anda memiliki izin akses ke perangkat yang dipilih.</p>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
