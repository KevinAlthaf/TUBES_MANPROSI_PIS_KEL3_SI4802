import React, { useState, useEffect, useRef } from 'react';
import { Upload, Building, User, KeyRound, LogOut, Info, AlertTriangle, Check, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';

// Rich dataset of Indonesian Provinces, Cities, and Districts for dynamic dropdown dependency
const INDONESIAN_REGIONS = {
  "DKI Jakarta": {
    "Jakarta Pusat": ["Gambir", "Kemayoran", "Menteng", "Sawah Besar", "Senen"],
    "Jakarta Selatan": ["Cilandak", "Jagakarsa", "Kebayoran Baru", "Kebayoran Lama", "Mampang Prapatan", "Tebet"],
    "Jakarta Barat": ["Cengkareng", "Grogol Petamburan", "Kalideres", "Kebon Jeruk", "Kembangan", "Palmerah"],
    "Jakarta Timur": ["Cakung", "Duren Sawit", "Jatinegara", "Kramat Jati", "Matraman", "Pasar Rebo"],
    "Jakarta Utara": ["Cilincing", "Kelapa Gading", "Koja", "Pademangan", "Penjaringan", "Tanjung Priok"]
  },
  "Jawa Barat": {
    "Kota Bandung": ["Coblong", "Lengkong", "Regol", "Sumur Bandung", "Cibeunying Kaler", "Andir"],
    "Kabupaten Bandung": ["Bojongsoang", "Dayeuhkolot", "Baleendah", "Margahayu", "Soreang", "Cileunyi"],
    "Kota Bogor": ["Bogor Barat", "Bogor Selatan", "Bogor Tengah", "Bogor Timur", "Bogor Utara", "Tanah Sareal"],
    "Kota Bekasi": ["Bekasi Barat", "Bekasi Selatan", "Bekasi Timur", "Bekasi Utara", "Jatiasih", "Pondok Gede"],
    "Kota Depok": ["Beji", "Cimanggis", "Limo", "Pancoran Mas", "Sawangan", "Sukmajaya"]
  },
  "Banten": {
    "Kota Tangerang": ["Batuceper", "Benda", "Cibodas", "Ciledug", "Cipondoh", "Karawaci", "Pinang"],
    "Kota Tangerang Selatan": ["Ciputat", "Pamulang", "Pondok Aren", "Serpong", "Serpong Utara", "Setu"],
    "Kota Serang": ["Cipocok Jaya", "Curug", "Kasemen", "Serang", "Taktakan", "Walantaka"]
  },
  "Jawa Tengah": {
    "Kota Semarang": ["Banyumanik", "Gajahmungkur", "Genuk", "Pedurungan", "Semarang Barat", "Semarang Timur"],
    "Kota Surakarta (Solo)": ["Banjarsari", "Jebres", "Laweyan", "Pasar Kliwon", "Serengan"]
  },
  "Jawa Timur": {
    "Kota Surabaya": ["Gubeng", "Rungkut", "Wonokromo", "Tegalsari", "Sukolilo", "Genteng", "Sawahan"],
    "Kota Malang": ["Blimbing", "Kedungkandang", "Klojen", "Lowokwaru", "Sukun"]
  },
  "Bali": {
    "Kota Denpasar": ["Denpasar Barat", "Denpasar Selatan", "Denpasar Timur", "Denpasar Utara"],
    "Kabupaten Badung": ["Kuta", "Kuta Utara", "Kuta Selatan", "Mengwi", "Abiansemal"]
  },
  "Sumatera Utara": {
    "Kota Medan": ["Medan Amplas", "Medan Area", "Medan Barat", "Medan Baru", "Medan Belawan", "Medan Deli", "Medan Denai"],
    "Kota Binjai": ["Binjai Barat", "Binjai Kota", "Binjai Selatan", "Binjai Timur", "Binjai Utara"]
  }
};

export default function Pengaturan() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Profil Perusahaan');
  const [isLogoutPopupOpen, setIsLogoutPopupOpen] = useState(false);

  const { 
    fetchCompanyProfile, 
    updateCompanyProfile, 
    uploadCompanyLogo, 
    uploadCompanyNibFile, 
    fetchUserProfile, 
    updateUserProfile 
  } = useData();

  const fileInputRef = useRef(null);
  const nibFileInputRef = useRef(null);
  const [toastMessage, setToastMessage] = useState('');
  
  const [formData, setFormData] = useState({
    namaPerusahaan: "",
    emailPerusahaan: "",
    deskripsi: "",
    noTelp: "",
    alamat: "",
    provinsi: "",
    kota: "",
    kecamatan: "",
    kodePos: "",
    jumlahPegawai: "",
    industri: "",
    website: "https://",
    tahunBerdiri: "",
    nib: "",
    logo: "",
    nibFile: ""
  });

  const [userProfile, setUserProfile] = useState({
    namaLengkap: "",
    email: "",
    noWhatsapp: ""
  });

  const [passwords, setPasswords] = useState({
    newPassword: "",
    confirmPassword: ""
  });

  // Load profiles from backend
  useEffect(() => {
    const loadProfiles = async () => {
      const company = await fetchCompanyProfile();
      if (company) {
        setFormData(company);
      }
      const userProf = await fetchUserProfile();
      if (userProf) {
        setUserProfile(userProf);
      }
    };
    loadProfiles();
  }, []);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage('');
    }, 3000);
  };

  const handleCompanySave = async (e) => {
    if (e) e.preventDefault();
    const success = await updateCompanyProfile(formData);
    if (success) {
      showToast('Profil perusahaan berhasil disimpan!');
    } else {
      alert('Gagal menyimpan profil perusahaan.');
    }
  };

  const handleUserSave = async (e) => {
    if (e) e.preventDefault();
    const success = await updateUserProfile(userProfile);
    if (success) {
      showToast('Profil pengguna berhasil disimpan!');
    } else {
      alert('Gagal menyimpan profil pengguna.');
    }
  };

  const handleLogoUploadClick = (e) => {
    if (e) e.preventDefault();
    fileInputRef.current?.click();
  };

  const handleLogoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran file maksimal 2 MB!');
      return;
    }

    const savedLogo = await uploadCompanyLogo(file);
    if (savedLogo) {
      setFormData(prev => ({ ...prev, logo: savedLogo }));
      showToast('Logo perusahaan berhasil diperbarui!');
    } else {
      alert('Gagal mengunggah logo perusahaan.');
    }
  };

  const handleNibUploadClick = (e) => {
    if (e) e.preventDefault();
    nibFileInputRef.current?.click();
  };

  const handleNibFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file dokumen maksimal 5 MB!');
      return;
    }

    const savedFile = await uploadCompanyNibFile(file);
    if (savedFile) {
      setFormData(prev => ({ ...prev, nibFile: savedFile }));
      showToast('Dokumen NIB/SIUP/NPWP berhasil diunggah!');
    } else {
      alert('Gagal mengunggah dokumen.');
    }
  };
  
  const tabs = [
    { name: 'Profil Perusahaan', icon: Building },
    { name: 'Profil Pengguna', icon: User },
    { name: 'Ganti Kata Sandi', icon: KeyRound },
    { name: 'Keluar Akun', icon: LogOut, textClass: 'text-red-500', iconClass: 'text-red-500', isAction: true }
  ];

  const handleTabClick = (tab) => {
    if (tab.isAction) {
      if (tab.name === 'Keluar Akun') {
        setIsLogoutPopupOpen(true);
      }
    } else {
      setActiveTab(tab.name);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Region dropdown computation
  const availableProvinces = Object.keys(INDONESIAN_REGIONS);
  const availableCities = formData.provinsi ? Object.keys(INDONESIAN_REGIONS[formData.provinsi] || {}) : [];
  const availableDistricts = (formData.provinsi && formData.kota) ? (INDONESIAN_REGIONS[formData.provinsi]?.[formData.kota] || []) : [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Pengaturan Akun</h2>
        <div className="text-sm text-gray-500 flex items-center gap-2">
          <span>Pengaturan Akun</span>
          <span>•</span>
          <span className="text-gray-900">{activeTab}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.name}
              onClick={() => handleTabClick(tab)}
              className={`
                group inline-flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === tab.name && !tab.isAction
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                ${tab.textClass || ''}
              `}
            >
              <tab.icon size={18} className={`${activeTab === tab.name && !tab.isAction ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'} ${tab.iconClass || ''}`} />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* TAB: Profil Perusahaan */}
      {activeTab === 'Profil Perusahaan' && (
        <div className="flex flex-col lg:flex-row gap-8 py-6">
          {/* Left Column - Logo Upload */}
          <div className="w-full lg:w-1/4">
            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 flex flex-col items-center justify-center text-center">
              <div className="w-32 h-32 rounded-full bg-gray-50 border-2 border-dashed border-gray-300 flex items-center justify-center mb-6 relative overflow-hidden">
                {formData.logo ? (
                  <img 
                    src={`/uploads/${formData.logo}`} 
                    alt="Logo Perusahaan" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Building size={48} className="text-gray-300" />
                )}
                <div className="absolute bg-white p-1 rounded-full shadow border border-gray-100 bottom-0 right-0 translate-x-1/4 translate-y-1/4">
                  <div className="bg-gray-800 text-white p-1.5 rounded-full">
                    <Upload size={14} />
                  </div>
                </div>
              </div>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleLogoChange} 
                className="hidden" 
                accept="image/*" 
              />
              
              <button 
                type="button"
                onClick={handleLogoUploadClick}
                className="w-full py-2.5 px-4 bg-white border border-blue-500 text-blue-600 rounded-lg font-medium text-sm hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 mb-4 cursor-pointer"
              >
                <Upload size={16} /> Unggah Logo Perusahaan
              </button>
              
              <p className="text-xs text-gray-500">
                Format *.jpeg, *.jpg, *.png.<br/>
                Ukuran maks 2 MB
              </p>
            </div>
          </div>

          {/* Right Column - Form */}
          <div className="w-full lg:w-3/4">
            <form onSubmit={handleCompanySave} className="bg-white shadow-sm border border-gray-100 rounded-2xl p-8 space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Nama perusahaan<span className="text-red-500">*</span></label>
                  <input type="text" value={formData.namaPerusahaan} onChange={e => setFormData({...formData, namaPerusahaan: e.target.value})} className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none text-gray-800" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Alamat email perusahaan<span className="text-red-500">*</span></label>
                  <input type="email" value={formData.emailPerusahaan} onChange={e => setFormData({...formData, emailPerusahaan: e.target.value})} className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none text-gray-800" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Deskripsi perusahaan<span className="text-red-500">*</span></label>
                <textarea rows="3" value={formData.deskripsi} onChange={e => setFormData({...formData, deskripsi: e.target.value})} className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none text-gray-800"></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Nomor telepon perusahaan (Whatsapp)<span className="text-red-500">*</span></label>
                <div className="flex rounded-lg border border-gray-200 overflow-hidden focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500">
                  <span className="inline-flex items-center px-4 bg-green-100 text-green-700 font-medium text-sm">
                    +62
                  </span>
                  <input type="text" value={formData.noTelp} onChange={e => setFormData({...formData, noTelp: e.target.value})} placeholder="Isi tanpa angka 0 di depan" className="flex-1 p-2.5 outline-none text-gray-800" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Alamat perusahaan</label>
                <textarea rows="2" value={formData.alamat} onChange={e => setFormData({...formData, alamat: e.target.value})} className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none text-gray-800"></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Provinsi</label>
                  <select 
                    value={formData.provinsi} 
                    onChange={e => setFormData({...formData, provinsi: e.target.value, kota: "", kecamatan: ""})} 
                    className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none text-gray-800 bg-white"
                  >
                    <option value="">Pilih Provinsi</option>
                    {availableProvinces.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Kota</label>
                  <select 
                    value={formData.kota} 
                    onChange={e => setFormData({...formData, kota: e.target.value, kecamatan: ""})} 
                    disabled={!formData.provinsi}
                    className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none text-gray-800 bg-white disabled:bg-gray-50 disabled:text-gray-400"
                  >
                    <option value="">Pilih Kota/Kabupaten</option>
                    {availableCities.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Kecamatan</label>
                  <select 
                    value={formData.kecamatan} 
                    onChange={e => setFormData({...formData, kecamatan: e.target.value})} 
                    disabled={!formData.kota}
                    className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none text-gray-800 bg-white disabled:bg-gray-50 disabled:text-gray-400"
                  >
                    <option value="">Pilih Kecamatan</option>
                    {availableDistricts.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Kode pos</label>
                  <input type="text" value={formData.kodePos} onChange={e => setFormData({...formData, kodePos: e.target.value})} className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none text-gray-800" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Jumlah pegawai<span className="text-red-500">*</span></label>
                  <select value={formData.jumlahPegawai} onChange={e => setFormData({...formData, jumlahPegawai: e.target.value})} className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none text-gray-800 bg-white">
                    <option value=""></option>
                    <option>1-49</option>
                    <option>50-200</option>
                    <option>201-500</option>
                    <option>500+</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Industri perusahaan</label>
                  <select value={formData.industri} onChange={e => setFormData({...formData, industri: e.target.value})} className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none text-gray-800 bg-white">
                    <option value=""></option>
                    <option>Kesehatan dan Keamanan Lingkungan</option>
                    <option>Teknologi Informasi</option>
                    <option>Layanan Keuangan</option>
                    <option>Pendidikan</option>
                    <option>Manufaktur</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Link website/media sosial</label>
                  <input type="text" value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})} className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none text-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Tanggal berdiri</label>
                  <input 
                    type="date" 
                    value={formData.tahunBerdiri} 
                    onChange={e => setFormData({...formData, tahunBerdiri: e.target.value})} 
                    className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none text-gray-800 bg-white" 
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-500 mb-1">Nomor Izin Berusaha (NIB)</label>
                  <input type="text" value={formData.nib} onChange={e => setFormData({...formData, nib: e.target.value})} className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none text-gray-800" />
                </div>
              </div>

              {/* Document Upload Area */}
              <div className="pt-4 border-t border-gray-100">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                  <FileText size={18} className="text-blue-500" /> Dokumen NIB / SIUP / NPWP
                </label>
                
                <input 
                  type="file" 
                  ref={nibFileInputRef} 
                  onChange={handleNibFileChange} 
                  className="hidden" 
                  accept=".pdf,image/*" 
                />
                
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border border-gray-200 bg-gray-50">
                  <button 
                    type="button" 
                    onClick={handleNibUploadClick}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer shrink-0"
                  >
                    <Upload size={16} />
                    Pilih & Unggah File
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    {formData.nibFile ? (
                      <div className="flex items-center gap-2 text-sm text-green-700 font-semibold truncate">
                        <Check size={18} className="text-green-600 shrink-0" />
                        <span>Dokumen Terupload:</span>
                        <a 
                          href={`/uploads/${formData.nibFile}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-blue-600 hover:text-blue-800 underline truncate hover:cursor-pointer"
                          title="Klik untuk melihat dokumen"
                        >
                          {formData.nibFile}
                        </a>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">
                        Belum ada dokumen yang terpilih.<br/>
                        Format berkas yang diterima: **PDF, JPG, JPEG, PNG** (maks. 5 MB)
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 flex justify-end">
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2 cursor-pointer">
                  Simpan Perubahan
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* TAB: Profil Pengguna */}
      {activeTab === 'Profil Pengguna' && (
        <div className="max-w-3xl mx-auto py-6">
          <form onSubmit={handleUserSave} className="bg-white shadow-sm border border-gray-100 rounded-2xl p-8 space-y-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Informasi Akun Anda</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Nama Lengkap</label>
              <input type="text" value={userProfile.namaLengkap} onChange={e => setUserProfile({...userProfile, namaLengkap: e.target.value})} className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none text-gray-800" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Alamat Email</label>
              <input type="email" value={userProfile.email} onChange={e => setUserProfile({...userProfile, email: e.target.value})} className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none text-gray-800" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Nomor Whatsapp</label>
              <div className="flex rounded-lg border border-gray-200 overflow-hidden focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500">
                <span className="inline-flex items-center px-4 bg-green-100 text-green-700 font-medium text-sm">+62</span>
                <input type="text" value={userProfile.noWhatsapp} onChange={e => setUserProfile({...userProfile, noWhatsapp: e.target.value})} placeholder="Isi tanpa angka 0 di depan" className="flex-1 p-2.5 outline-none text-gray-800" />
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 flex justify-end">
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-sm">
                Simpan Profil
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB: Ganti Kata Sandi */}
      {activeTab === 'Ganti Kata Sandi' && (
        <div className="max-w-2xl mx-auto py-6">
          <form className="bg-white shadow-sm border border-gray-100 rounded-2xl p-8 space-y-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Keamanan Akun</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Kata Sandi Baru</label>
              <input type="password" value={passwords.newPassword} onChange={e => setPasswords({...passwords, newPassword: e.target.value})} placeholder="Masukkan kata sandi baru" className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none text-gray-800" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Konfirmasi Sandi Baru</label>
              <input type="password" value={passwords.confirmPassword} onChange={e => setPasswords({...passwords, confirmPassword: e.target.value})} placeholder="Ketik ulang kata sandi baru" className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none text-gray-800" />
            </div>

            <div className="pt-6 border-t border-gray-100 flex justify-end">
              <button type="button" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-sm">
                Ubah Kata Sandi
              </button>
            </div>
          </form>
        </div>
      )}

      {/* LOGOUT POPUP */}
      {isLogoutPopupOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Keluar dari akun?</h3>
              <p className="text-gray-500 text-sm">Apakah Anda yakin ingin keluar dari aplikasi? Sesi Anda akan diakhiri.</p>
            </div>
            <div className="px-6 py-4 bg-gray-50 flex gap-3">
              <button 
                onClick={() => setIsLogoutPopupOpen(false)}
                className="flex-1 py-2.5 border border-gray-300 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Tidak
              </button>
              <button 
                onClick={handleLogout}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors shadow-sm"
              >
                Ya, keluar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-white border border-gray-100 shadow-xl rounded-xl p-4 flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-300">
          <div className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
            <Check size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Sukses</p>
            <p className="text-xs text-gray-500">{toastMessage}</p>
          </div>
        </div>
      )}

    </div>
  );
}
