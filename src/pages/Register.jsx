import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { addToast } = useToast();
  const [activeRole, setActiveRole] = useState('Pelamar');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    namaLengkap: '',
    email: '',
    password: '',
    konfirmasiPassword: '',
    namaPerusahaan: '',
    nomorWhatsapp: '',
    kodeAdmin: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (formData.password.length < 8) {
      setErrorMsg('Password minimal harus 8 karakter.');
      return;
    }
    
    if (formData.password !== formData.konfirmasiPassword) {
      setErrorMsg('Password dan Konfirmasi Password tidak cocok.');
      return;
    }

    setIsLoading(true);
    
    let roleToLogin = activeRole;
    if (activeRole === 'HR') roleToLogin = 'HRD';
    if (activeRole === 'Admin') roleToLogin = 'Operator';

    const res = await register({
      role: roleToLogin,
      name: formData.namaLengkap,
      email: formData.email,
      password: formData.password,
      phone: formData.nomorWhatsapp,
      companyName: roleToLogin === 'HRD' ? formData.namaPerusahaan : null,
      adminCode: roleToLogin === 'Operator' ? formData.kodeAdmin : null
    });

    setIsLoading(false);
    
    if (res.success) {
      addToast('Registrasi Berhasil! Silakan masuk.', 'success');
      navigate('/login');
    } else {
      setErrorMsg(res.message || 'Gagal registrasi.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white px-6 md:px-12 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            <span className="text-2xl font-bold text-orange-500">*</span>
            <span className="text-xl font-bold text-blue-600">kitalulus</span>
          </div>
          <span className="text-[10px] text-gray-500 font-bold mt-1 tracking-wider">FOR EMPLOYERS</span>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex">
        {/* Left side */}
        <div className="hidden lg:flex w-1/2 flex-col items-center pt-20 bg-gray-50 px-12 relative overflow-hidden">
          <h1 className="text-4xl font-bold text-gray-800 text-center mb-8 leading-tight z-10">
            Rekrutmen Cepat & Hemat,<br/>
            Tersedia <span className="text-blue-500">11+ Juta</span> Talenta!
          </h1>
          <div className="relative w-full max-w-lg mt-8 z-10">
             {/* Fallback illustration using simple CSS shapes if image not found */}
            <div className="w-full h-80 bg-orange-100 rounded-3xl relative overflow-hidden border-4 border-white shadow-xl flex items-center justify-center">
              <img src="/src/assets/hero.png" alt="Illustration" className="absolute w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
              <div className="text-center p-6 bg-white/80 backdrop-blur rounded-xl shadow-sm z-20">
                <p className="font-semibold text-gray-800">Ilustrasi Dashboard KitaLulus</p>
                <p className="text-sm text-gray-500">Gunakan image asli di folder assets</p>
              </div>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute top-10 -left-6 w-12 h-12 bg-yellow-100 rounded-full blur-xl"></div>
            <div className="absolute bottom-10 -right-6 w-20 h-20 bg-blue-100 rounded-full blur-xl"></div>
          </div>
        </div>

        {/* Right side */}
        <div className="w-full lg:w-1/2 flex items-center justify-center bg-white p-8 overflow-y-auto">
          <div className="w-full max-w-md my-auto">
            <h2 className="text-3xl font-extrabold font-sans text-gray-900 mb-8 text-center md:text-left tracking-tight">Daftar Akun Baru</h2>
            
            {/* Role Selection Tabs */}
            <div className="flex p-1 bg-gray-100 rounded-lg mb-8 shadow-inner">
              {['Pelamar', 'HR', 'Admin'].map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setActiveRole(r);
                    setFormData({
                      namaLengkap: '', email: '', password: '', konfirmasiPassword: '',
                      namaPerusahaan: '', nomorWhatsapp: '', kodeAdmin: ''
                    });
                    setErrorMsg('');
                  }}
                  className={`flex-1 py-2.5 text-sm font-semibold rounded-md transition-all duration-200 ${
                    activeRole === r 
                      ? 'bg-white text-blue-600 shadow-sm border border-gray-200/50' 
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Dynamic Fields based on Role */}
              {activeRole === 'HR' && (
                <div className="relative">
                  <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs font-medium text-gray-600">
                    Nama Perusahaan
                  </label>
                  <input 
                    type="text" 
                    name="namaPerusahaan"
                    value={formData.namaPerusahaan}
                    onChange={handleChange}
                    placeholder="Ketikkan Nama Perusahaan anda dengan lengkap" 
                    className="w-full border border-gray-300 rounded-lg px-4 py-3.5 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                    required 
                  />
                </div>
              )}

              <div className="relative">
                <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs font-medium text-gray-600">
                  Nama Lengkap
                </label>
                <input 
                  type="text" 
                  name="namaLengkap"
                  value={formData.namaLengkap}
                  onChange={handleChange}
                  placeholder="Ketikkan nama lengkap" 
                  className="w-full border border-gray-300 rounded-lg px-4 py-3.5 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                  required 
                />
              </div>

              <div className="relative">
                <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs font-medium text-gray-600">
                  Email
                </label>
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={
                    activeRole === 'Pelamar' ? "pelamar@gmail.com" : 
                    activeRole === 'HR' ? "hrd@perusahaan.com" : "admin@kitalulus.com"
                  } 
                  className="w-full border border-gray-300 rounded-lg px-4 py-3.5 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                  required 
                />
              </div>
              
              {activeRole !== 'Admin' && (
                <div className="relative">
                  <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs font-medium text-gray-600">
                    Nomor WhatsApp anda
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-4 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-green-600 font-medium">
                      +62
                    </span>
                    <input 
                      type="tel" 
                      name="nomorWhatsapp"
                      value={formData.nomorWhatsapp}
                      onChange={handleChange}
                      placeholder="Ketik Tanpa angka 0 didepan" 
                      className="w-full border border-gray-300 rounded-r-lg px-4 py-3.5 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                      required 
                    />
                  </div>
                </div>
              )}

              {activeRole === 'Admin' && (
                <div className="relative">
                  <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs font-medium text-gray-600">
                    Kode Akses Admin
                  </label>
                  <input 
                    type="text" 
                    name="kodeAdmin"
                    value={formData.kodeAdmin}
                    onChange={handleChange}
                    placeholder="Masukkan kode unik admin" 
                    className="w-full border border-gray-300 rounded-lg px-4 py-3.5 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                    required 
                  />
                </div>
              )}

              <div className="relative">
                <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs font-medium text-gray-600">
                  Password
                </label>
                <input 
                  type="password" 
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimal 8 karakter..." 
                  className="w-full border border-gray-300 rounded-lg px-4 py-3.5 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                  required 
                />
              </div>

              <div className="relative">
                <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs font-medium text-gray-600">
                  Konfirmasi Password
                </label>
                <input 
                  type="password" 
                  name="konfirmasiPassword"
                  value={formData.konfirmasiPassword}
                  onChange={handleChange}
                  placeholder="Ketik ulang password..." 
                  className="w-full border border-gray-300 rounded-lg px-4 py-3.5 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                  required 
                />
              </div>

              <div className="flex items-start mt-4">
                <div className="flex items-center h-5">
                  <input id="terms" type="checkbox" className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-blue-300" required />
                </div>
                <label htmlFor="terms" className="ml-2 text-xs text-gray-500">
                  Dengan mendaftar, saya menyetujui <a href="#" className="text-blue-600 hover:underline">Persyaratan dan Kebijakan Privasi</a>.
                </label>
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-blue-600 text-white font-medium py-3.5 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all flex justify-center items-center h-[52px]"
              >
                {isLoading ? (
                  <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  'Daftar'
                )}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-8">
              Sudah punya akun? <Link to="/login" className="text-blue-400 hover:text-blue-600 hover:underline transition-colors">Masuk</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
