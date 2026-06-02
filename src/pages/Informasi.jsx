import React, { useState } from 'react';
import { 
  Sparkles, 
  Briefcase, 
  Users, 
  Video, 
  HelpCircle, 
  Settings, 
  Info, 
  BookOpen, 
  ChevronRight, 
  Layers, 
  ShieldCheck, 
  Bot 
} from 'lucide-react';

export default function Informasi() {
  const [activeTab, setActiveTab] = useState('panduan');

  const features = [
    {
      id: 'dashboard',
      icon: Layers,
      color: 'text-blue-600 bg-blue-50 border-blue-100',
      title: '1. Dashboard Utama',
      description: 'Pusat ringkasan aktivitas rekrutmen Anda.',
      points: [
        'Memantau jumlah total lowongan aktif dan pelamar masuk secara real-time.',
        'Melihat grafik tren aplikasi dan status rekrutmen terbaru.',
        'Mengakses metrik kinerja cepat rekrutmen perusahaan.'
      ]
    },
    {
      id: 'lowongan',
      icon: Briefcase,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
      title: '2. Manajemen Lowongan Kerja',
      description: 'Alat lengkap untuk mempublikasikan dan mengatur posisi pekerjaan.',
      points: [
        'Klik tombol "Buat Lowongan" untuk membuka form pembuatan posisi baru.',
        'Isi kriteria komprehensif: Departemen, Lokasi, Syarat Pendidikan, Tipe Kerja (Full-time/Part-time), Sistem Kerja (WFO/WFH/Hybrid), serta batasan Gender/Status.',
        'Aktifkan opsi "Psikotes" jika Anda ingin mewajibkan tes kepribadian/logika bagi pelamar yang lolos seleksi berkas awal.',
        'Kelola lowongan aktif: Nonaktifkan (Tutup) atau Aktifkan kembali lowongan secara dinamis kapan saja.'
      ]
    },
    {
      id: 'pelamar',
      icon: Users,
      color: 'text-amber-600 bg-amber-50 border-amber-100',
      title: '3. Penyaringan & Berkas Pelamar',
      description: 'Lakukan seleksi awal berkas pelamar dengan mudah dan terstruktur.',
      points: [
        'Melihat profil lengkap pelamar secara terperinci.',
        'Fitur "Lihat CV": Klik tautan CV untuk langsung mengunduh atau membaca berkas CV pelamar asli di tab baru tanpa hambatan.',
        'Ubah Tahap Pelamar Instan: Menggunakan badge deskriptif yang interaktif untuk memindahkan pelamar ke tahap berikutnya ("Wawancara", "Psikotes", "Tolak", atau "Batalkan Tahap").'
      ]
    },
    {
      id: 'wawancara',
      icon: Video,
      color: 'text-purple-600 bg-purple-50 border-purple-100',
      title: '4. Kelola Wawancara & Analisis AI',
      description: 'Wawancara virtual instan yang didukung penuh oleh kecerdasan buatan (AI).',
      points: [
        'Klik "Masuk Ruang Interview" untuk terhubung langsung ke ruang video call virtual (Jitsi Meet) yang disematkan langsung di dashboard dengan navigasi premium.',
        'AI Auto-Analysis: Sistem AI kami secara otomatis menyusun ringkasan evaluasi kecocokan kandidat dan rekomendasi skor wawancara langsung saat halaman dibuka.',
        'Penyesuaian Nilai & Rekomendasi: Anda dapat dengan mudah menggeser slider nilai (0-100), mencatat poin penting hasil interview, lalu mengeklik "Analisis AI & Simpulkan" untuk memperbarui kesimpulan secara cerdas.',
        'Pilihan Keputusan Akhir: Berikan rekomendasi keputusan ("Layak Diterima", "Dipertimbangkan", atau "Tidak Direkomendasikan"). Menentukan status "Terima" atau "Tolak" akan langsung menyimpan seluruh data feedback rekruter ke dalam database MySQL.'
      ]
    },
    {
      id: 'rekomendasi',
      icon: Bot,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
      title: '5. Rekomendasi Kandidat (AI Match-Matching)',
      description: 'Temukan talenta terbaik berdasarkan skor kesesuaian AI yang objektif.',
      points: [
        'Sistem menghitung persentase kecocokan (Match Score) CV pelamar dengan kriteria lowongan kerja secara algoritmik.',
        'Membantu menyaring ratusan CV dalam hitungan detik untuk langsung fokus pada kandidat dengan performa tinggi.'
      ]
    },
    {
      id: 'pengaturan',
      icon: Settings,
      color: 'text-rose-600 bg-rose-50 border-rose-100',
      title: '6. Pengaturan Akun & Dokumen Legalitas',
      description: 'Kelola informasi profil perusahaan Anda secara resmi.',
      points: [
        'Pilihan Wilayah Indonesia Dinamis: Input data Provinsi, Kota/Kabupaten, hingga Kecamatan yang saling terintegrasi secara dinamis untuk ketepatan domisili.',
        'Input Tanggal Berdiri: Mempermudah penentuan usia perusahaan melalui pemilih kalender digital yang bersahabat.',
        'Unggah Legalitas Perusahaan (NIB / SIUP / NPWP): Unggah dokumen perusahaan Anda dengan aman menggunakan backend Multipart File Upload. Dokumen yang berhasil diunggah akan menampilkan indikator tanda centang (✓ Terupload) dan dapat diunduh/ditinjau kembali kapan saja.'
      ]
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 font-sans">
      
      {/* Premium Header */}
      <div className="relative bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 rounded-3xl p-8 md:p-12 text-white shadow-xl overflow-hidden mb-10">
        <div className="relative z-10 max-w-3xl">
          <span className="bg-white/20 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wider mb-4 inline-block backdrop-blur-sm border border-white/10 uppercase">
            Pusat Informasi & Panduan Pengguna
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold mb-3 leading-tight tracking-tight">
            Bagaimana Cara Kerja <span className="text-yellow-400">JobPortal HRD</span>?
          </h1>
          <p className="text-blue-100/90 text-sm md:text-base leading-relaxed max-w-2xl font-light">
            Selamat datang di pusat informasi JobPortal. Di sini Anda akan mempelajari bagaimana cara memanfaatkan ekosistem digital rekrutmen kami secara optimal, mulai dari publikasi lowongan hingga rekrutmen cerdas berbasis AI.
          </p>
        </div>
        
        {/* Decor */}
        <div className="absolute -right-16 -bottom-16 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute -left-12 -top-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl"></div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-8 bg-white p-2 rounded-2xl border shadow-sm">
        <button
          onClick={() => setActiveTab('panduan')}
          className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
            activeTab === 'panduan'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
          }`}
        >
          <BookOpen size={18} />
          Panduan Fitur Dashboard
        </button>
        <button
          onClick={() => setActiveTab('faq')}
          className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
            activeTab === 'faq'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
          }`}
        >
          <HelpCircle size={18} />
          Pertanyaan Umum (FAQ)
        </button>
      </div>

      {activeTab === 'panduan' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <div 
                key={feat.id} 
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shrink-0 ${feat.color}`}>
                      <Icon size={22} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg leading-tight">{feat.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">{feat.description}</p>
                    </div>
                  </div>
                  
                  <ul className="space-y-3 mt-4 text-left">
                    {feat.points.map((pt, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-sm text-gray-600 leading-relaxed">
                        <ChevronRight className="text-blue-600 mt-1 shrink-0" size={14} />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
                  <span>Modul Rekrutmen Aktif</span>
                  <span className="font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-md">Terintegrasi</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <ShieldCheck className="text-blue-600" /> Tanya Jawab Sistem
          </h2>
          
          <div className="space-y-6 text-left">
            <div className="border-b border-gray-100 pb-5">
              <h4 className="font-bold text-gray-900 mb-2">Q: Bagaimana cara kerja sistem AI dalam merangkum hasil interview?</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                A: Sistem AI kami membaca profil kecakapan kandidat beserta catatan mentah dari pewawancara. Dengan algoritma pemrosesan bahasa alami (NLP) internal, AI akan memformulasikan rangkuman evaluasi yang lengkap, objektif, dan otomatis memberikan salah satu dari tiga keputusan rekomendasi akhir secara instan saat Anda membuka halaman penilaian wawancara.
              </p>
            </div>
            
            <div className="border-b border-gray-100 pb-5">
              <h4 className="font-bold text-gray-900 mb-2">Q: Apakah dokumen legalitas NIB/SIUP/NPWP yang saya unggah aman?</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                A: Ya, berkas legalitas perusahaan yang Anda unggah disimpan langsung di server penyimpanan lokal kami dengan penamaan unik berbasis enkripsi timestamp (`company_nib_` prefix) untuk mencegah penumpukan file serta penyalahgunaan akses oleh pihak luar.
              </p>
            </div>

            <div className="pb-2">
              <h4 className="font-bold text-gray-900 mb-2">Q: Saya mengubah status pelamar menjadi Wawancara, apa langkah selanjutnya?</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                A: Pelamar tersebut akan otomatis terdaftar ke dalam tabel **Kelola Wawancara**. Di sana, ruang virtual (Jitsi Video Room) yang unik akan terbuat untuk kandidat tersebut. Anda cukup berkoordinasi mengenai waktu dengan pelamar, lalu klik "Masuk Ruang Interview" di waktu yang telah disepakati bersama.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
