# JobPortal Dashboard (HRD & Operator)

Aplikasi Web Full-Stack sederhana untuk simulasi Dashboard HRD dan Operator. Proyek ini dibangun menggunakan **React (Vite)** untuk Frontend, **Node.js (Express)** untuk Backend API, dan **MySQL** untuk Database.

## 🚀 Fitur Utama
1. **Posting Lowongan Pekerjaan**: HRD dapat memposting loker beserta detail dan integrasi syarat Psikotes.
2. **AI CV Matching**: Simulasi *screening* AI untuk melihat kelebihan, kekurangan, dan persentase kecocokan pelamar.
3. **Manajemen Wawancara**: Penentuan status pelamar (Menunggu -> Interview -> Diterima/Ditolak) beserta *summary* penilaian otomatis.
4. **Chat Support**: Chat secara *real-time* antara pihak HRD dengan Operator.
5. **Kelola Psikotes**: Operator dapat menambahkan paket tes psikotes baru yang otomatis tersinkronisasi ke *form* HRD.

---

## 🛠️ Persyaratan Sistem (Prerequisites)
Sebelum menjalankan proyek ini di laptop Anda, pastikan Anda sudah menginstal perangkat lunak berikut:
1. **Node.js**: [Download & Install Node.js](https://nodejs.org/) (Disarankan versi LTS).
2. **XAMPP / Laragon**: Untuk menjalankan server database MySQL secara lokal.

---

## ⚙️ Cara Instalasi & Menjalankan Proyek

Ikuti langkah-langkah di bawah ini secara berurutan agar aplikasi dapat berjalan dengan normal:

### 1. Persiapan Database (MySQL)
1. Buka aplikasi **XAMPP** atau **Laragon**, lalu nyalakan modul **Apache** dan **MySQL** (Klik tombol *Start*).
2. Buka browser dan ketik alamat: `http://localhost/phpmyadmin` (atau buka database Anda melalui *HeidiSQL*/*DBeaver*).
3. Buat sebuah database baru dengan nama: **`jobportal_db`** (harus sama persis).
4. Klik menu **Import**, pilih file **`database.sql`** yang ada di dalam folder proyek ini, lalu klik Kirim/Go.
   *(File ini akan otomatis membuat tabel `jobs`, `applicants`, `psychotest_packages`, `support_messages` beserta isi data dummy-nya).*

### 2. Instalasi Library / Dependencies
1. Buka folder proyek ini di terminal (atau CMD / Terminal VSCode).
2. Jalankan perintah instalasi berikut untuk mendownload semua *library* yang dibutuhkan:
   ```bash
   npm install
   ```

### 3. Menjalankan Aplikasi
Aplikasi ini sudah dikonfigurasi menggunakan `concurrently`. Artinya, Anda hanya perlu menjalankan 1 perintah untuk menyalakan Server Frontend (React) dan Server Backend (Node.js) secara bersamaan.

Di dalam terminal proyek Anda, jalankan:
```bash
npm run dev
```

Jika berhasil, Anda akan melihat pesan berikut di terminal Anda:
- `Backend server running on http://localhost:5000`
- `VITE ready in ...`
- `Local: http://localhost:5173/`

### 4. Buka di Browser
Buka link berikut di browser kesayangan Anda:
**[http://localhost:5173](http://localhost:5173)**

---

## 🎭 Panduan Simulasi (Uji Coba Multi-Role)

Aplikasi ini mendeteksi 2 jenis *Role* pengguna berdasarkan simulasi login (karena tidak ada autentikasi password yang sesungguhnya di *prototype* ini, kita menggunakan tombol bypass):

Untuk merasakan fungsi penuh aplikasi ini (terutama fitur **Chat Support**), Anda disarankan membuka 2 jendela browser sekaligus:
1. **Browser 1 (Mode Biasa)**: Login sebagai **HRD**. Cobalah untuk membuat Lowongan, melihat AI Match, dan mengirim *Chat Bantuan* (melalui *widget* di pojok kanan bawah).
2. **Browser 2 (Mode Incognito/Samaran)**: Login sebagai **Operator**. Buka menu "Pesan Bantuan" di *sidebar* untuk membaca dan membalas pesan dari HRD. Buka menu "Kelola Psikotes" untuk mencoba menambahkan paket soal.

Semua interaksi antar 2 jendela tersebut akan **sinkron dan tersimpan secara nyata ke dalam database MySQL lokal Anda!**

---

### Catatan Tambahan (Troubleshooting)
- *Error saat memposting lowongan / mengirim pesan?* Pastikan XAMPP/Laragon Anda sedang menyala dan port MySQL adalah default `3306`.
- *Error "Cannot find module express"?* Pastikan Anda sudah menjalankan perintah `npm install` dengan benar sebelum `npm run dev`.

**Happy Coding! ✨**