-- PostgreSQL Schema for JobPortal

-- Table for Psychotest Packages
CREATE TABLE IF NOT EXISTS psychotest_packages (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL
);

INSERT INTO psychotest_packages (name) VALUES
('Paket A (Logika Umum & Deret Angka)'),
('Paket B (Kepribadian & Studi Kasus)'),
('Paket C (Komprehensif)');


-- Table for Jobs
CREATE TABLE IF NOT EXISTS jobs (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  department VARCHAR(100) DEFAULT NULL,
  status VARCHAR(50) DEFAULT 'Active',
  kota VARCHAR(100) DEFAULT NULL,
  pendidikan VARCHAR(50) DEFAULT NULL,
  jenis_pekerjaan VARCHAR(50) DEFAULT NULL,
  sistem_kerja VARCHAR(50) DEFAULT NULL,
  gender VARCHAR(50) DEFAULT NULL,
  status_pernikahan VARCHAR(50) DEFAULT NULL,
  deskripsi TEXT DEFAULT NULL,
  hari_jam_kerja VARCHAR(100) DEFAULT NULL,
  psikotes SMALLINT DEFAULT 0,
  paket_psikotes VARCHAR(255) DEFAULT NULL,
  hr_id INTEGER DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO jobs (title, department, kota, pendidikan, jenis_pekerjaan, sistem_kerja, gender, status_pernikahan, deskripsi, hari_jam_kerja, psikotes, paket_psikotes, hr_id) VALUES
('Frontend Developer', 'Engineering', 'Jakarta', 'S1', 'Full-time', 'WFO', 'Keduanya', 'Bebas', 'Membangun antarmuka web modern menggunakan React dan TailwindCSS.', 'Senin - Jumat, 09:00 - 18:00', 1, 'Paket A (Logika Umum & Deret Angka)', 3),
('Product Manager', 'Product', 'Bandung', 'S1', 'Full-time', 'WFH', 'Keduanya', 'Bebas', 'Memimpin pengembangan produk dari ideasi hingga peluncuran.', 'Senin - Jumat, Flexible', 0, '', 3);


-- Table for Users
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  role VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) DEFAULT NULL,
  company_name VARCHAR(255) DEFAULT NULL,
  admin_code VARCHAR(255) DEFAULT NULL,
  cv_url VARCHAR(255) DEFAULT NULL,
  skills TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (role, email, password, name, phone, company_name) VALUES 
('Pelamar', 'budi@gmail.com', 'password123', 'Budi Santoso', '081234567890', NULL),
('Pelamar', 'siti@gmail.com', 'password123', 'Siti Aminah', '081234567891', NULL),
('HRD', 'hrd@perusahaan.com', 'password123', 'Bapak HRD', '081234567892', 'PT. Inovasi Teknologi');


-- Table for Applicants
CREATE TABLE IF NOT EXISTS applicants (
  id SERIAL PRIMARY KEY,
  user_id INTEGER DEFAULT NULL,
  job_id INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  match_score INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(50) DEFAULT 'Menunggu',
  cv VARCHAR(255) DEFAULT NULL,
  ai_strengths TEXT DEFAULT NULL,
  ai_weaknesses TEXT DEFAULT NULL,
  ai_conclusion TEXT DEFAULT NULL,
  interview_transcript TEXT DEFAULT NULL,
  interview_score INTEGER DEFAULT NULL,
  interview_notes TEXT DEFAULT NULL,
  interview_conclusion VARCHAR(100) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO applicants (user_id, job_id, name, match_score, status, cv, ai_strengths, ai_weaknesses, ai_conclusion, interview_score, interview_notes, interview_conclusion) VALUES
(1, 1, 'Budi Santoso', 92, 'Menunggu', 'budi_cv.pdf', '["Pengalaman React 3 tahun","Familiar dengan Tailwind"]', '["Belum pernah memimpin tim"]', 'Kandidat sangat cocok untuk posisi ini secara teknis.', NULL, NULL, NULL),
(2, 1, 'Siti Aminah', 85, 'Interview', 'siti_cv.pdf', '["Portfolio UI/UX yang kuat","Menguasai Vue.js"]', '["Kurang pengalaman di React.js"]', 'Cocok, namun butuh waktu adaptasi framework.', 88, 'Komunikasi baik, technical test cukup memuaskan.', 'Layak Diterima');


-- Table for Support Messages
CREATE TABLE IF NOT EXISTS support_messages (
  id SERIAL PRIMARY KEY,
  hr_id INTEGER DEFAULT NULL,
  sender_role VARCHAR(50) NOT NULL,
  text TEXT NOT NULL,
  timestamp VARCHAR(100) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO support_messages (sender_role, text, timestamp) VALUES
('Operator', 'Halo! Ada yang bisa kami bantu terkait platform JobPortal?', '2026-05-07T00:00:00.000Z');


-- Table for Company Profile
CREATE TABLE IF NOT EXISTS company_profile (
  id SERIAL PRIMARY KEY,
  nama_perusahaan VARCHAR(255) DEFAULT '',
  email_perusahaan VARCHAR(255) DEFAULT '',
  deskripsi TEXT DEFAULT NULL,
  no_telp VARCHAR(50) DEFAULT '',
  alamat TEXT DEFAULT NULL,
  provinsi VARCHAR(100) DEFAULT '',
  kota VARCHAR(100) DEFAULT '',
  kecamatan VARCHAR(100) DEFAULT '',
  kode_pos VARCHAR(20) DEFAULT '',
  jumlah_pegawai VARCHAR(50) DEFAULT '',
  industri VARCHAR(100) DEFAULT '',
  website VARCHAR(255) DEFAULT '',
  tahun_berdiri VARCHAR(10) DEFAULT '',
  nib VARCHAR(100) DEFAULT '',
  logo VARCHAR(255) DEFAULT NULL,
  nib_file VARCHAR(255) DEFAULT NULL
);

INSERT INTO company_profile (id, nama_perusahaan, email_perusahaan, deskripsi, no_telp, alamat, provinsi, kota, kecamatan, kode_pos, jumlah_pegawai, industri, website, tahun_berdiri, nib, logo)
VALUES (1, '', '', '', '', '', '', '', '', '', '', '', '', '', '', NULL)
ON CONFLICT (id) DO NOTHING;


-- Table for User Profile (General/Operator)
CREATE TABLE IF NOT EXISTS user_profile (
  id SERIAL PRIMARY KEY,
  nama_lengkap VARCHAR(255) DEFAULT '',
  email VARCHAR(255) DEFAULT '',
  no_whatsapp VARCHAR(50) DEFAULT ''
);

INSERT INTO user_profile (id, nama_lengkap, email, no_whatsapp)
VALUES (1, '', '', '')
ON CONFLICT (id) DO NOTHING;


-- Table for Pelamar Profiles
CREATE TABLE IF NOT EXISTS pelamar_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  nama_lengkap VARCHAR(255) DEFAULT '',
  no_telepon VARCHAR(50) DEFAULT '',
  kota_domisili VARCHAR(100) DEFAULT '',
  pendidikan_terakhir VARCHAR(50) DEFAULT '',
  posisi_diinginkan VARCHAR(255) DEFAULT '',
  pengalaman_kerja VARCHAR(50) DEFAULT '',
  ekspektasi_gaji_min INTEGER DEFAULT NULL,
  ekspektasi_gaji_max INTEGER DEFAULT NULL,
  skills TEXT DEFAULT NULL,
  foto_url VARCHAR(255) DEFAULT NULL,
  ktp_url VARCHAR(255) DEFAULT NULL,
  ijazah_url VARCHAR(255) DEFAULT NULL,
  surat_url VARCHAR(255) DEFAULT NULL,
  edukasi_json TEXT DEFAULT NULL,
  pengalaman_organisasi TEXT DEFAULT NULL,
  cv_url VARCHAR(255) DEFAULT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO pelamar_profiles (user_id, nama_lengkap, no_telepon) VALUES
(1, 'Budi Santoso', '081234567890'),
(2, 'Siti Aminah', '081234567891');


-- Table for Interview Rooms
CREATE TABLE IF NOT EXISTS interview_rooms (
  id SERIAL PRIMARY KEY,
  applicant_id INTEGER NOT NULL,
  room_name VARCHAR(255) NOT NULL,
  room_code VARCHAR(100) NOT NULL UNIQUE,
  status VARCHAR(50) DEFAULT 'waiting',
  created_by INTEGER NOT NULL,
  scheduled_at TIMESTAMP DEFAULT NULL,
  hrd_last_seen TIMESTAMP DEFAULT NULL,
  pelamar_last_seen TIMESTAMP DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (applicant_id) REFERENCES applicants(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);


-- Table for Interview Chats
CREATE TABLE IF NOT EXISTS interview_chats (
  id SERIAL PRIMARY KEY,
  room_id INTEGER NOT NULL,
  sender_id INTEGER NOT NULL,
  sender_name VARCHAR(255) NOT NULL,
  sender_role VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES interview_rooms(id) ON DELETE CASCADE
);


-- Table for Psychotest Questions
CREATE TABLE IF NOT EXISTS psychotest_questions (
  id SERIAL PRIMARY KEY,
  package_id INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  correct_answer VARCHAR(255) DEFAULT '',
  FOREIGN KEY (package_id) REFERENCES psychotest_packages(id) ON DELETE CASCADE
);


-- Table for Psychotest Answers
CREATE TABLE IF NOT EXISTS psychotest_answers (
  id SERIAL PRIMARY KEY,
  applicant_id INTEGER NOT NULL UNIQUE,
  answers_json TEXT NOT NULL,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (applicant_id) REFERENCES applicants(id) ON DELETE CASCADE
);
