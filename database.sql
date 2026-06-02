CREATE DATABASE IF NOT EXISTS `jobportal_db`;
USE `jobportal_db`;

-- Table for Psychotest Packages
CREATE TABLE IF NOT EXISTS `psychotest_packages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `psychotest_packages` (`name`) VALUES
('Paket A (Logika Umum & Deret Angka)'),
('Paket B (Kepribadian & Studi Kasus)'),
('Paket C (Komprehensif)');


-- Table for Jobs
CREATE TABLE IF NOT EXISTS `jobs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `department` varchar(100) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'Active',
  `kota` varchar(100) DEFAULT NULL,
  `pendidikan` varchar(50) DEFAULT NULL,
  `jenis_pekerjaan` varchar(50) DEFAULT NULL,
  `sistem_kerja` varchar(50) DEFAULT NULL,
  `gender` varchar(50) DEFAULT NULL,
  `status_pernikahan` varchar(50) DEFAULT NULL,
  `deskripsi` text DEFAULT NULL,
  `hari_jam_kerja` varchar(100) DEFAULT NULL,
  `psikotes` tinyint(1) DEFAULT 0,
  `paket_psikotes` varchar(255) DEFAULT NULL,
  `hr_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `jobs` (`title`, `department`, `kota`, `pendidikan`, `jenis_pekerjaan`, `sistem_kerja`, `gender`, `status_pernikahan`, `deskripsi`, `hari_jam_kerja`, `psikotes`, `paket_psikotes`, `hr_id`) VALUES
('Frontend Developer', 'Engineering', 'Jakarta', 'S1', 'Full-time', 'WFO', 'Keduanya', 'Bebas', 'Membangun antarmuka web modern menggunakan React dan TailwindCSS.', 'Senin - Jumat, 09:00 - 18:00', 1, 'Paket A (Logika Umum & Deret Angka)', 3),
('Product Manager', 'Product', 'Bandung', 'S1', 'Full-time', 'WFH', 'Keduanya', 'Bebas', 'Memimpin pengembangan produk dari ideasi hingga peluncuran.', 'Senin - Jumat, Flexible', 0, '', 3);


-- Table for Users
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `role` varchar(50) NOT NULL,
  `email` varchar(255) NOT NULL UNIQUE,
  `password` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `company_name` varchar(255) DEFAULT NULL,
  `admin_code` varchar(255) DEFAULT NULL,
  `cv_url` varchar(255) DEFAULT NULL,
  `skills` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `users` (`role`, `email`, `password`, `name`, `phone`, `company_name`) VALUES 
('Pelamar', 'budi@gmail.com', 'password123', 'Budi Santoso', '081234567890', NULL),
('Pelamar', 'siti@gmail.com', 'password123', 'Siti Aminah', '081234567891', NULL),
('HRD', 'hrd@perusahaan.com', 'password123', 'Bapak HRD', '081234567892', 'PT. Inovasi Teknologi');


-- Table for Applicants
CREATE TABLE IF NOT EXISTS `applicants` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `job_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `match_score` int(11) NOT NULL DEFAULT 0,
  `status` varchar(50) DEFAULT 'Menunggu',
  `cv` varchar(255) DEFAULT NULL,
  `ai_strengths` text DEFAULT NULL,
  `ai_weaknesses` text DEFAULT NULL,
  `ai_conclusion` text DEFAULT NULL,
  `interview_score` int(11) DEFAULT NULL,
  `interview_notes` text DEFAULT NULL,
  `interview_conclusion` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `applicants` (`user_id`, `job_id`, `name`, `match_score`, `status`, `cv`, `ai_strengths`, `ai_weaknesses`, `ai_conclusion`, `interview_score`, `interview_notes`, `interview_conclusion`) VALUES
(1, 1, 'Budi Santoso', 92, 'Menunggu', 'budi_cv.pdf', '["Pengalaman React 3 tahun","Familiar dengan Tailwind"]', '["Belum pernah memimpin tim"]', 'Kandidat sangat cocok untuk posisi ini secara teknis.', NULL, NULL, NULL),
(2, 1, 'Siti Aminah', 85, 'Interview', 'siti_cv.pdf', '["Portfolio UI/UX yang kuat","Menguasai Vue.js"]', '["Kurang pengalaman di React.js"]', 'Cocok, namun butuh waktu adaptasi framework.', 88, 'Komunikasi baik, technical test cukup memuaskan.', 'Layak Diterima');


-- Table for Support Messages
CREATE TABLE IF NOT EXISTS `support_messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sender_role` varchar(50) NOT NULL,
  `text` text NOT NULL,
  `timestamp` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `support_messages` (`sender_role`, `text`, `timestamp`) VALUES
('Operator', 'Halo! Ada yang bisa kami bantu terkait platform JobPortal?', '2026-05-07T00:00:00.000Z');


-- Table for Company Profile
CREATE TABLE IF NOT EXISTS `company_profile` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nama_perusahaan` varchar(255) DEFAULT '',
  `email_perusahaan` varchar(255) DEFAULT '',
  `deskripsi` text DEFAULT NULL,
  `no_telp` varchar(50) DEFAULT '',
  `alamat` text DEFAULT NULL,
  `provinsi` varchar(100) DEFAULT '',
  `kota` varchar(100) DEFAULT '',
  `kecamatan` varchar(100) DEFAULT '',
  `kode_pos` varchar(20) DEFAULT '',
  `jumlah_pegawai` varchar(50) DEFAULT '',
  `industri` varchar(100) DEFAULT '',
  `website` varchar(255) DEFAULT '',
  `tahun_berdiri` varchar(10) DEFAULT '',
  `nib` varchar(100) DEFAULT '',
  `logo` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `company_profile` (`id`, `nama_perusahaan`, `email_perusahaan`, `deskripsi`, `no_telp`, `alamat`, `provinsi`, `kota`, `kecamatan`, `kode_pos`, `jumlah_pegawai`, `industri`, `website`, `tahun_berdiri`, `nib`, `logo`)
SELECT 1, '', '', '', '', '', '', '', '', '', '', '', '', '', '', NULL
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `company_profile` WHERE `id` = 1);


-- Table for User Profile (General/Operator)
CREATE TABLE IF NOT EXISTS `user_profile` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nama_lengkap` varchar(255) DEFAULT '',
  `email` varchar(255) DEFAULT '',
  `no_whatsapp` varchar(50) DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `user_profile` (`id`, `nama_lengkap`, `email`, `no_whatsapp`)
SELECT 1, '', '', ''
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `user_profile` WHERE `id` = 1);


-- Table for Pelamar Profiles
CREATE TABLE IF NOT EXISTS `pelamar_profiles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `nama_lengkap` varchar(255) DEFAULT '',
  `no_telepon` varchar(50) DEFAULT '',
  `kota_domisili` varchar(100) DEFAULT '',
  `pendidikan_terakhir` varchar(50) DEFAULT '',
  `posisi_diinginkan` varchar(255) DEFAULT '',
  `pengalaman_kerja` varchar(50) DEFAULT '',
  `ekspektasi_gaji_min` int(11) DEFAULT NULL,
  `ekspektasi_gaji_max` int(11) DEFAULT NULL,
  `skills` text DEFAULT NULL,
  `foto_url` varchar(255) DEFAULT NULL,
  `ktp_url` varchar(255) DEFAULT NULL,
  `ijazah_url` varchar(255) DEFAULT NULL,
  `surat_url` varchar(255) DEFAULT NULL,
  `edukasi_json` text DEFAULT NULL,
  `pengalaman_organisasi` text DEFAULT NULL,
  `cv_url` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `pelamar_profiles` (`user_id`, `nama_lengkap`, `no_telepon`) VALUES
(1, 'Budi Santoso', '081234567890'),
(2, 'Siti Aminah', '081234567891');

