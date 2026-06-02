import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Save, User, Briefcase, FileText, GraduationCap, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ProfilePelamar() {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const profile = user?.profile || {};

  const [formData, setFormData] = useState({
    // Data Diri
    namaLengkap: profile.nama_lengkap || user?.name || '',
    email: user?.email || '',
    noTelepon: profile.no_telepon || user?.phone || '',
    kotaDomisili: profile.kota_domisili || '',
    pendidikanTerakhir: profile.pendidikan_terakhir || '',
    
    // Pengalaman & Keahlian
    posisiDiinginkan: profile.posisi_diinginkan || '',
    pengalamanKerja: profile.pengalaman_kerja || '',
    ekspektasiGajiMin: profile.ekspektasi_gaji_min || '',
    ekspektasiGajiMax: profile.ekspektasi_gaji_max || '',
    skills: profile.skills ? profile.skills.join(', ') : '',
    
    // Pendidikan
    edukasi: profile.edukasi || {
      jenjang: '',
      jurusan: '',
      mulai: '',
      lulus: '',
      sekolah: ''
    },

    // Organisasi
    pengalamanOrganisasi: profile.pengalaman_organisasi || ''
  });

  const [docs, setDocs] = useState({
    fotoUrl: profile.fotoUrl || '',
    ktpUrl: profile.ktpUrl || '',
    ijazahUrl: profile.ijazahUrl || '',
    suratUrl: profile.suratUrl || '',
    cvUrl: profile.cvUrl || ''
  });

  const [isSaving, setIsSaving] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  useEffect(() => {
    if (user?.profile) {
      const p = user.profile;
      setFormData(prev => ({
        ...prev,
        namaLengkap: p.nama_lengkap || user.name || '',
        email: user.email || '',
        noTelepon: p.no_telepon || user.phone || '',
        kotaDomisili: p.kota_domisili || '',
        pendidikanTerakhir: p.pendidikan_terakhir || '',
        posisiDiinginkan: p.posisi_diinginkan || '',
        pengalamanKerja: p.pengalaman_kerja || '',
        ekspektasiGajiMin: p.ekspektasi_gaji_min || '',
        ekspektasiGajiMax: p.ekspektasi_gaji_max || '',
        skills: p.skills ? p.skills.join(', ') : '',
        edukasi: p.edukasi || {
          jenjang: '',
          jurusan: '',
          mulai: '',
          lulus: '',
          sekolah: ''
        },
        pengalamanOrganisasi: p.pengalaman_organisasi || ''
      }));
      setDocs({
        fotoUrl: p.fotoUrl || '',
        ktpUrl: p.ktpUrl || '',
        ijazahUrl: p.ijazahUrl || '',
        suratUrl: p.suratUrl || '',
        cvUrl: p.cvUrl || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('edu_')) {
      const field = name.replace('edu_', '');
      setFormData(prev => ({ ...prev, edukasi: { ...prev.edukasi, [field]: value } }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileUpload = async (type, e) => {
    const file = e.target.files[0];
    if (file) {
      addToast(`Mengunggah ${type}...`, 'info', 1500);
      try {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });

        if (res.ok) {
          const data = await res.json();
          const fieldName = `${type}Url`;
          setDocs(prev => ({ ...prev, [fieldName]: data.filename }));
          
          try {
            await updateProfile({ [fieldName]: data.filename });
            addToast(`${type.toUpperCase()} berhasil diunggah dan disimpan ke profil!`, 'success');
          } catch (dbErr) {
            console.error("Auto-save to database failed", dbErr);
            addToast(`Gagal menyimpan ${type} ke database profil.`, 'error');
          }
        } else {
          addToast(`Gagal mengunggah ${type}.`, 'error');
        }
      } catch (err) {
        console.error(err);
        addToast(`Gagal menghubungi server.`, 'error');
      }
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const payload = {
        nama_lengkap: formData.namaLengkap,
        no_telepon: formData.noTelepon,
        kota_domisili: formData.kotaDomisili,
        pendidikan_terakhir: formData.pendidikanTerakhir,
        posisi_diinginkan: formData.posisiDiinginkan,
        pengalaman_kerja: formData.pengalamanKerja,
        ekspektasi_gaji_min: formData.ekspektasiGajiMin,
        ekspektasi_gaji_max: formData.ekspektasiGajiMax,
        skills: formData.skills.split(',').map(s => s.trim()).filter(s => s),
        edukasi: formData.edukasi,
        pengalaman_organisasi: formData.pengalamanOrganisasi,
        ...docs
      };

      await updateProfile(payload);
      setShowSaveSuccess(true);
    } catch (err) {
      addToast(err.message || 'Gagal menyimpan profil.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profil Saya</h1>
          <p className="text-gray-500 mt-1">Lengkapi data diri Anda untuk meningkatkan peluang direkrut.</p>
        </div>
        <button 
          onClick={handleSaveProfile}
          disabled={isSaving}
          className="bg-blue-600 text-white font-medium hover:bg-blue-700 px-6 py-2.5 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
        >
          <Save size={18} />
          {isSaving ? 'Menyimpan...' : 'Simpan Profil'}
        </button>
      </div>

      <div className="space-y-6">
        
        {/* DATA DIRI */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2 bg-gray-50/50">
            <User size={18} className="text-blue-600" />
            <h2 className="font-semibold text-gray-800">Data Diri</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Nama Lengkap *</label>
              <input type="text" name="namaLengkap" value={formData.namaLengkap} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Email *</label>
              <input type="email" name="email" value={formData.email} disabled className="w-full border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50 text-gray-500 cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">No. Telepon *</label>
              <input type="tel" name="noTelepon" value={formData.noTelepon} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Kota Domisili *</label>
              <select name="kotaDomisili" value={formData.kotaDomisili} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors bg-white">
                <option value="">Pilih Kota</option>
                <option value="Jakarta">Jakarta</option>
                <option value="Bandung, Jawa Barat">Bandung, Jawa Barat</option>
                <option value="Surabaya">Surabaya</option>
                <option value="Yogyakarta">Yogyakarta</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Pendidikan Terakhir</label>
              <select name="pendidikanTerakhir" value={formData.pendidikanTerakhir} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors bg-white">
                <option value="">Pilih Pendidikan</option>
                <option value="SMA/SMK">SMA/SMK</option>
                <option value="D3">D3</option>
                <option value="S1">S1</option>
                <option value="S2">S2</option>
              </select>
            </div>
          </div>
        </section>

        {/* PENGALAMAN & KEAHLIAN */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2 bg-gray-50/50">
            <Briefcase size={18} className="text-blue-600" />
            <h2 className="font-semibold text-gray-800">Pengalaman & Keahlian</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Posisi Yang Diinginkan *</label>
              <input type="text" name="posisiDiinginkan" value={formData.posisiDiinginkan} onChange={handleChange} placeholder="cth: UI/UX Designer, Frontend Developer" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Pengalaman Kerja</label>
              <select name="pengalamanKerja" value={formData.pengalamanKerja} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors bg-white">
                <option value="">Pilih Pengalaman</option>
                <option value="Fresh Graduate">Fresh Graduate</option>
                <option value="< 1 Tahun">&lt; 1 Tahun</option>
                <option value="1-2 Tahun">1-2 Tahun</option>
                <option value="> 3 Tahun">&gt; 3 Tahun</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Ekspektasi Gaji (Min)</label>
              <input type="number" name="ekspektasiGajiMin" value={formData.ekspektasiGajiMin} onChange={handleChange} placeholder="5000000" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Ekspektasi Gaji (Max)</label>
              <input type="number" name="ekspektasiGajiMax" value={formData.ekspektasiGajiMax} onChange={handleChange} placeholder="8000000" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Keahlian / Skill</label>
              <input type="text" name="skills" value={formData.skills} onChange={handleChange} placeholder="Ketik skill lalu pisahkan dengan koma..." className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors" />
              <div className="flex flex-wrap gap-2 mt-3">
                {formData.skills.split(',').filter(s=>s.trim()).map((skill, idx) => (
                  <span key={idx} className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-sm font-medium border border-blue-100">
                    {skill.trim()}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* DOKUMEN PENDUKUNG */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2 bg-gray-50/50">
            <FileText size={18} className="text-blue-600" />
            <h2 className="font-semibold text-gray-800">Dokumen Pendukung</h2>
          </div>
          <div className="p-6 space-y-4">
            {[
              { id: 'foto', label: 'Foto 3x4', icon: '📷' },
              { id: 'ktp', label: 'KTP', icon: '🪪' },
              { id: 'ijazah', label: 'Ijazah Terakhir', icon: '🎓' },
              { id: 'surat', label: 'Surat Keterangan Lainnya', icon: '📝' },
              { id: 'cv', label: 'Curriculum Vitae (CV)', icon: '📄' }
            ].map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-gray-100/50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{doc.icon}</span>
                  <div>
                    <p className="font-medium text-gray-800">{doc.label}</p>
                    {docs[`${doc.id}Url`] && (
                      <p className="text-xs text-green-600 font-medium truncate max-w-[200px]">{docs[`${doc.id}Url`]}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {docs[`${doc.id}Url`] && (
                    <span className="text-sm font-medium text-green-600 flex items-center gap-1">✓ Terupload</span>
                  )}
                  {docs[`${doc.id}Url`] && doc.id === 'cv' && (
                    <a href={`/uploads/${docs.cvUrl}`} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline font-semibold mr-1">
                      Lihat CV
                    </a>
                  )}
                  <label className="cursor-pointer text-sm font-semibold bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 px-4 py-2 rounded-lg text-gray-700 hover:text-blue-600 transition-all shadow-sm">
                    {docs[`${doc.id}Url`] ? "Ganti / Upload Ulang" : "Upload"}
                    <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => handleFileUpload(doc.id, e)} />
                  </label>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* PENDIDIKAN */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2 bg-gray-50/50">
            <GraduationCap size={18} className="text-blue-600" />
            <h2 className="font-semibold text-gray-800">Pendidikan</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Jenjang Pendidikan *</label>
              <input type="text" name="edu_jenjang" value={formData.edukasi.jenjang} onChange={handleChange} placeholder="cth: S1" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Jurusan / Program Studi *</label>
              <input type="text" name="edu_jurusan" value={formData.edukasi.jurusan} onChange={handleChange} placeholder="cth: Sistem Informasi" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Mulai Pendidikan *</label>
              <input type="text" name="edu_mulai" value={formData.edukasi.mulai} onChange={handleChange} placeholder="cth: 14 September 2020" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Lulusan Pendidikan</label>
              <input type="text" name="edu_lulus" value={formData.edukasi.lulus} onChange={handleChange} placeholder="cth: Juni 2024" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Sekolah / Perguruan Tinggi *</label>
              <input type="text" name="edu_sekolah" value={formData.edukasi.sekolah} onChange={handleChange} placeholder="cth: Telkom University" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors" />
            </div>
          </div>
        </section>

        {/* ORGANISASI */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2 bg-gray-50/50">
            <Users size={18} className="text-blue-600" />
            <h2 className="font-semibold text-gray-800">Pengalaman Organisasi/Pengembangan diri</h2>
          </div>
          <div className="p-6">
            <p className="text-sm text-gray-500 mb-4">Jika ada, ceritakan pengalaman organisasi atau pengembangan diri yang pernah kamu lakukan agar rekruter terkesan.</p>
            <textarea 
              name="pengalamanOrganisasi"
              value={formData.pengalamanOrganisasi}
              onChange={handleChange}
              rows={6}
              placeholder="Contoh:&#10;- Volunteer dalam kegiatan publik&#10;- Mengelola online shop"
              className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors bg-gray-50/30"
            />
          </div>
        </section>

      </div>

      {/* Interactive Success Modal */}
      {showSaveSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">🎉</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Profil Diperbarui!</h3>
            <p className="text-gray-600 mb-8">Data profil Anda telah berhasil disimpan ke dalam sistem. Lanjutkan aktivitas Anda.</p>
            <button 
              onClick={() => setShowSaveSuccess(false)}
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
