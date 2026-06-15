import express from 'express';
import cors from 'cors';
import db from './db.js';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { analyzeCV, analyzeInterviewTranscript, analyzeNotes } from './gemini.js';

// --- PERBAIKAN 1: Menyesuaikan folder uploads untuk Vercel ---
// Vercel hanya mengizinkan pembuatan folder/file di dalam folder /tmp
const uploadDir = process.env.VERCEL ? '/tmp/uploads' : 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Gunakan direktori yang aman
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    let prefix = 'company_logo_';
    if (file.fieldname === 'nib_file') prefix = 'company_nib_';
    else if (file.fieldname === 'file') prefix = 'pelamar_doc_';
    cb(null, prefix + Date.now() + ext);
  }
});
const upload = multer({ storage });

// Database Migrations
(async () => {
  try {
    await db.query('ALTER TABLE jobs ADD COLUMN hr_id INTEGER');
    console.log('Added hr_id to jobs table');
  } catch (e) { /* ignore if already exists */ }
  try {
    await db.query('ALTER TABLE company_profile ADD COLUMN nib_file VARCHAR(255) DEFAULT NULL');
    console.log('Added nib_file to company_profile table');
  } catch (e) { /* ignore if already exists */ }
  try {
    await db.query('ALTER TABLE applicants ADD COLUMN interview_transcript TEXT DEFAULT NULL');
  } catch (err) {}
  
  try {
    await db.query('ALTER TABLE applicants ADD COLUMN interview_score INTEGER DEFAULT NULL');
  } catch (err) {}

  try {
    await db.query('ALTER TABLE applicants ADD COLUMN interview_notes TEXT DEFAULT NULL');
  } catch (err) {}

  try {
    await db.query('ALTER TABLE applicants ADD COLUMN interview_conclusion TEXT DEFAULT NULL');
    console.log('Added interview columns to applicants table');
  } catch (e) { /* ignore if already exists */ }
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS support_messages (
        id SERIAL PRIMARY KEY,
        hr_id INTEGER,
        sender_role VARCHAR(50),
        text TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Ensured support_messages table exists');
  } catch (e) {
    console.error('Error creating support_messages:', e.message);
  }

  // Interview Rooms table
  try {
    await db.query(`
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
      )
    `);
    console.log('Ensured interview_rooms table exists');
  } catch (e) {
    console.error('Error creating interview_rooms:', e.message);
  }

  // Interview Chats table
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS interview_chats (
        id SERIAL PRIMARY KEY,
        room_id INTEGER NOT NULL,
        sender_id INTEGER NOT NULL,
        sender_name VARCHAR(255) NOT NULL,
        sender_role VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (room_id) REFERENCES interview_rooms(id) ON DELETE CASCADE
      )
    `);
    console.log('Ensured interview_chats table exists');
  } catch (e) {
    console.error('Error creating interview_chats:', e.message);
  }

  // Table for Psychotest Packages
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS psychotest_packages (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        status VARCHAR(50) DEFAULT 'draft'
      )
    `);
    console.log('Ensured psychotest_packages table exists');
  } catch (e) {
    console.error('Error creating psychotest_packages:', e.message);
  }

  // Migration for status column
  try {
    await db.query("ALTER TABLE psychotest_packages ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'draft'");
    await db.query("UPDATE psychotest_packages SET status = 'published' WHERE status IS NULL");
    console.log('Migrated psychotest_packages status column');
  } catch (e) {
    // If ALTER TABLE throws (e.g. duplicate column or keyword mismatch), handle gracefully
    try {
      await db.query("ALTER TABLE psychotest_packages ADD COLUMN status VARCHAR(50) DEFAULT 'draft'");
      await db.query("UPDATE psychotest_packages SET status = 'published' WHERE status IS NULL");
      console.log('Fallback: Migrated psychotest_packages status column');
    } catch (err) {
      console.error('Error migrating psychotest_packages status:', err.message);
    }
  }

  // Table for Psychotest Questions
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS psychotest_questions (
        id SERIAL PRIMARY KEY,
        package_id INTEGER NOT NULL REFERENCES psychotest_packages(id) ON DELETE CASCADE,
        question_text TEXT NOT NULL,
        correct_answer VARCHAR(255) DEFAULT ''
      )
    `);
    console.log('Ensured psychotest_questions table exists');
  } catch (e) {
    console.error('Error creating psychotest_questions:', e.message);
  }

  // Table for Psychotest Answers
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS psychotest_answers (
        id SERIAL PRIMARY KEY,
        applicant_id INTEGER NOT NULL UNIQUE REFERENCES applicants(id) ON DELETE CASCADE,
        answers_json TEXT NOT NULL,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Ensured psychotest_answers table exists');
  } catch (e) {
    console.error('Error creating psychotest_answers:', e.message);
  }

  // Seed default packages and questions if empty
  try {
    const [pkgCheck] = await db.query('SELECT COUNT(*) as count FROM psychotest_packages');
    if (parseInt(pkgCheck[0].count) === 0) {
      console.log('Seeding default psychotest packages & questions...');
      const [resA] = await db.query("INSERT INTO psychotest_packages (name, status) VALUES ('Paket A (General Intelligence & Logic)', 'published')");
      const [resB] = await db.query("INSERT INTO psychotest_packages (name, status) VALUES ('Paket B (Numerical & Analytical)', 'published')");
      const [resC] = await db.query("INSERT INTO psychotest_packages (name, status) VALUES ('Paket C (Komprehensif)', 'published')");

      const idA = resA.insertId;
      const idB = resB.insertId;
      const idC = resC.insertId;

      // Insert Questions for A
      await db.query("INSERT INTO psychotest_questions (package_id, question_text, correct_answer) VALUES (?, ?, ?)", [idA, "Jika semua burung bisa terbang, dan Penguin adalah burung, apakah Penguin bisa terbang?", "Tergantung konteks definisi terbang (Pengecualian)"]);
      await db.query("INSERT INTO psychotest_questions (package_id, question_text, correct_answer) VALUES (?, ?, ?)", [idA, "Lanjutkan deret angka ini: 2, 4, 8, 16, ...", "32"]);
      await db.query("INSERT INTO psychotest_questions (package_id, question_text, correct_answer) VALUES (?, ?, ?)", [idA, "Bagaimana Anda menangani konflik dengan rekan kerja?", "Mendengarkan secara objektif dan mencari jalan tengah"]);

      // Insert Questions for B
      await db.query("INSERT INTO psychotest_questions (package_id, question_text, correct_answer) VALUES (?, ?, ?)", [idB, "Sebuah kereta melaju dengan kecepatan 80km/jam. Jarak tempuh 200km. Berapa jam waktu yang dibutuhkan?", "2.5 Jam"]);
      await db.query("INSERT INTO psychotest_questions (package_id, question_text, correct_answer) VALUES (?, ?, ?)", [idB, "Jika 5 pekerja bisa menyelesaikan proyek dalam 10 hari, berapa lama jika hanya ada 2 pekerja?", "25 Hari"]);
      await db.query("INSERT INTO psychotest_questions (package_id, question_text, correct_answer) VALUES (?, ?, ?)", [idB, "Berapa 15% dari 200?", "30"]);

      // Insert Questions for C
      await db.query("INSERT INTO psychotest_questions (package_id, question_text, correct_answer) VALUES (?, ?, ?)", [idC, "Sebutkan kelebihan terbesar diri Anda dan kontribusi apa yang bisa Anda berikan.", "Fokus kerja keras, komunikasi, dan kejujuran"]);
      console.log('Psychotest packages & questions seeded successfully.');
    }
  } catch (err) {
    console.error('Failed to seed default psychotest data:', err.message);
  }
})();

// --- AUTH ENDPOINTS ---
app.post('/api/auth/register', async (req, res) => {
  const { role, email, password, name, phone, companyName, adminCode } = req.body;
  try {
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) return res.status(400).json({ error: 'Email sudah terdaftar.' });

    const [result] = await db.query(
      'INSERT INTO users (role, email, password, name, phone, company_name, admin_code) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [role, email, password, name, phone, companyName || null, adminCode || null]
    );
    const newUserId = result.insertId;

    if (role === 'Pelamar') {
      await db.query(
        'INSERT INTO pelamar_profiles (user_id, nama_lengkap, no_telepon) VALUES (?, ?, ?)',
        [newUserId, name, phone]
      );
    }

    res.status(201).json({ success: true, id: newUserId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password, role } = req.body;
  try {
    const [users] = await db.query('SELECT * FROM users WHERE email = ? AND password = ? AND role = ?', [email, password, role]);
    if (users.length === 0) return res.status(401).json({ error: 'Email, password, atau role tidak cocok.' });
    
    const user = users[0];
    let profileData = {};

    if (role === 'Pelamar') {
      const [profiles] = await db.query('SELECT * FROM pelamar_profiles WHERE user_id = ?', [user.id]);
      if (profiles.length > 0) {
        const p = profiles[0];
        profileData = {
          nama_lengkap: p.nama_lengkap,
          no_telepon: p.no_telepon,
          kota_domisili: p.kota_domisili,
          pendidikan_terakhir: p.pendidikan_terakhir,
          posisi_diinginkan: p.posisi_diinginkan,
          pengalaman_kerja: p.pengalaman_kerja,
          ekspektasi_gaji_min: p.ekspektasi_gaji_min,
          ekspektasi_gaji_max: p.ekspektasi_gaji_max,
          skills: p.skills ? JSON.parse(p.skills) : [],
          cvUrl: p.cv_url,
          fotoUrl: p.foto_url,
          ktpUrl: p.ktp_url,
          ijazahUrl: p.ijazah_url,
          suratUrl: p.surat_url,
          edukasi: p.edukasi_json ? JSON.parse(p.edukasi_json) : null,
          pengalaman_organisasi: p.pengalaman_organisasi
        };
      }
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        role: user.role,
        email: user.email,
        name: user.name,
        phone: user.phone,
        companyInfo: user.company_name ? { name: user.company_name } : null,
        profile: profileData
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/users/:id/profile', async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  try {
    const updates = [];
    const values = [];

    const fieldMap = {
      nama_lengkap: 'nama_lengkap',
      no_telepon: 'no_telepon',
      kota_domisili: 'kota_domisili',
      pendidikan_terakhir: 'pendidikan_terakhir',
      posisi_diinginkan: 'posisi_diinginkan',
      pengalaman_kerja: 'pengalaman_kerja',
      ekspektasi_gaji_min: 'ekspektasi_gaji_min',
      ekspektasi_gaji_max: 'ekspektasi_gaji_max',
      cvUrl: 'cv_url',
      fotoUrl: 'foto_url',
      ktpUrl: 'ktp_url',
      ijazahUrl: 'ijazah_url',
      suratUrl: 'surat_url',
      pengalaman_organisasi: 'pengalaman_organisasi'
    };

    for (const [key, dbField] of Object.entries(fieldMap)) {
      if (data[key] !== undefined) {
        updates.push(`${dbField} = ?`);
        let val = data[key];
        if ((key === 'ekspektasi_gaji_min' || key === 'ekspektasi_gaji_max') && val === '') {
          val = null;
        }
        values.push(val);
      }
    }

    if (data.skills !== undefined) {
      updates.push('skills = ?');
      values.push(JSON.stringify(data.skills));
    }
    
    if (data.edukasi !== undefined) {
      updates.push('edukasi_json = ?');
      values.push(JSON.stringify(data.edukasi));
    }
    
    if (updates.length > 0) {
      values.push(id);
      await db.query(`UPDATE pelamar_profiles SET ${updates.join(', ')} WHERE user_id = ?`, values);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/users/:id/company', async (req, res) => {
  const { id } = req.params;
  const { companyName } = req.body;
  try {
    await db.query('UPDATE users SET company_name = ? WHERE id = ?', [companyName, id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- JOBS ENDPOINTS ---
app.get('/api/jobs', async (req, res) => {
  const hrId = req.query.hr_id;
  try {
    let query = 'SELECT j.*, u.company_name FROM jobs j LEFT JOIN users u ON j.hr_id = u.id ORDER BY j.id DESC';
    const params = [];
    if (hrId) {
      query = 'SELECT j.*, u.company_name FROM jobs j LEFT JOIN users u ON j.hr_id = u.id WHERE j.hr_id = ? ORDER BY j.id DESC';
      params.push(hrId);
    }
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/jobs', async (req, res) => {
  const { hr_id, title, department, kota, pendidikan, jenisPekerjaan, sistemKerja, gender, statusPernikahan, deskripsi, hariJamKerja, psikotes, paketPsikotes } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO jobs (hr_id, title, department, kota, pendidikan, jenis_pekerjaan, sistem_kerja, gender, status_pernikahan, deskripsi, hari_jam_kerja, psikotes, paket_psikotes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [hr_id, title, department, kota, pendidikan, jenisPekerjaan, sistemKerja, gender, statusPernikahan, deskripsi, hariJamKerja, psikotes ? 1 : 0, paketPsikotes]
    );
    res.status(201).json({ id: result.insertId, ...req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/jobs/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await db.query('UPDATE jobs SET status = ? WHERE id = ?', [status, id]);
    res.json({ success: true, id, status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/jobs/:id', async (req, res) => {
  const { id } = req.params;
  const { title, department, kota, pendidikan, jenisPekerjaan, sistemKerja, gender, statusPernikahan, deskripsi, hariJamKerja, psikotes, paketPsikotes } = req.body;
  try {
    await db.query(
      'UPDATE jobs SET title = ?, department = ?, kota = ?, pendidikan = ?, jenis_pekerjaan = ?, sistem_kerja = ?, gender = ?, status_pernikahan = ?, deskripsi = ?, hari_jam_kerja = ?, psikotes = ?, paket_psikotes = ? WHERE id = ?',
      [title, department, kota, pendidikan, jenisPekerjaan, sistemKerja, gender, statusPernikahan, deskripsi, hariJamKerja, psikotes ? 1 : 0, paketPsikotes, id]
    );
    res.json({ id, ...req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a job vacancy (cascading deletes related applicants)
app.delete('/api/jobs/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM jobs WHERE id = ?', [id]);
    res.json({ success: true, message: 'Lowongan pekerjaan berhasil dihapus.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- APPLICANTS ENDPOINTS ---
app.get('/api/applicants', async (req, res) => {
  const hrId = req.query.hr_id;
  try {
    let query = 'SELECT a.*, EXISTS(SELECT 1 FROM psychotest_answers WHERE applicant_id = a.id) AS has_answers FROM applicants a ORDER BY a.id DESC';
    const params = [];
    if (hrId) {
      query = 'SELECT a.*, EXISTS(SELECT 1 FROM psychotest_answers WHERE applicant_id = a.id) AS has_answers FROM applicants a JOIN jobs j ON a.job_id = j.id WHERE j.hr_id = ? ORDER BY a.id DESC';
      params.push(hrId);
    }
    const [rows] = await db.query(query, params);
    // Parse JSON strings back to arrays/objects
    const parsedRows = rows.map(r => ({
      ...r,
      hasAnswers: r.has_answers === true || r.has_answers === 1 || r.has_answers === 'true',
      jobId: r.job_id,
      matchScore: r.match_score,
      aiMatchDetails: {
        strengths: r.ai_strengths ? JSON.parse(r.ai_strengths) : [],
        weaknesses: r.ai_weaknesses ? JSON.parse(r.ai_weaknesses) : [],
        conclusion: r.ai_conclusion
      },
      interviewSummary: r.interview_score ? {
        score: r.interview_score,
        notes: r.interview_notes,
        conclusion: r.interview_conclusion
      } : null
    }));
    res.json(parsedRows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/applicants/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await db.query('UPDATE applicants SET status = ? WHERE id = ?', [status, id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/applicants/:id/feedback', async (req, res) => {
  const { id } = req.params;
  const { score, notes, conclusion } = req.body;
  try {
    await db.query(
      'UPDATE applicants SET interview_score = ?, interview_notes = ?, interview_conclusion = ? WHERE id = ?',
      [score, notes, conclusion, id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/applicants/:id/transcript/append', async (req, res) => {
  const { id } = req.params;
  const { senderName, text } = req.body;
  try {
    const [rows] = await db.query('SELECT interview_transcript FROM applicants WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Pelamar tidak ditemukan.' });
    
    let current = rows[0].interview_transcript || '';
    if (current && !current.endsWith('\n')) {
      current += '\n';
    }
    const cleanText = (text || '').trim();
    if (cleanText) {
      current += `${senderName}: "${cleanText}"\n`;
      await db.query('UPDATE applicants SET interview_transcript = ? WHERE id = ?', [current, id]);
    }
    res.json({ success: true, transcript: current });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/applicants/:id/transcript', async (req, res) => {
  const { id } = req.params;
  const { transcript: bodyTranscript } = req.body;
  try {
    // Ambil data transkrip yang ada di DB serta detail pelamar/pekerjaan
    const [appRows] = await db.query(`
      SELECT a.name, a.interview_transcript, j.title as job_title 
      FROM applicants a
      JOIN jobs j ON a.job_id = j.id
      WHERE a.id = ?
    `, [id]);
    
    if (appRows.length === 0) {
      return res.status(404).json({ error: 'Pelamar tidak ditemukan.' });
    }

    const applicantName = appRows[0].name;
    const jobTitle = appRows[0].job_title;
    
    // Gunakan transkrip terakumulasi dari DB. Jika kosong, gunakan data yang dikirim di body
    let finalTranscript = appRows[0].interview_transcript || '';
    if (!finalTranscript.trim() && bodyTranscript) {
      finalTranscript = bodyTranscript;
    }

    if (!finalTranscript.trim()) {
      return res.status(400).json({ error: 'Transkrip kosong, tidak ada percakapan untuk dianalisis.' });
    }

    console.log(`Menjalankan analisis transkrip Gemini AI untuk kandidat ${applicantName}...`);
    const analysis = await analyzeInterviewTranscript(finalTranscript, applicantName, jobTitle);

    const scoreVal = analysis.score || 75;
    const generatedConclusion = analysis.conclusion || 'Dipertimbangkan';
    const notesReport = `[TRANSKRIP ASLI WAWANCARA]:\n"${finalTranscript.trim()}"\n\n[ANALISIS EVALUASI GEMINI AI]:\n${analysis.notes}`;

    await db.query(
      `UPDATE applicants SET 
        interview_transcript = ?, 
        interview_score = ?, 
        interview_notes = ?, 
        interview_conclusion = ? 
       WHERE id = ?`,
      [finalTranscript, scoreVal, notesReport, generatedConclusion, id]
    );

    res.json({ success: true, score: scoreVal, notes: notesReport, conclusion: generatedConclusion });
  } catch (error) {
    console.error("Gagal menganalisis transkrip wawancara:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ai/analyze-notes', async (req, res) => {
  const { notes, score } = req.body;
  try {
    console.log("Menjalankan analisis ringkasan catatan wawancara menggunakan Gemini...");
    const summary = await analyzeNotes(notes, score);
    res.json({ success: true, summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/applications/finish-interview/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    // Generate mock AI interview results
    const scoreVal = Math.floor(Math.random() * (95 - 65 + 1)) + 65; // random between 65 and 95
    let summary = '';
    let notes = '- Menjawab dengan tenang\\n- Pengalaman cukup relevan\\n- Komunikasi baik';
    if (scoreVal >= 85) {
      summary = `Kandidat dinilai luar biasa dan berkompetensi tinggi. Komunikasi sangat matang, profesional, dan terstruktur. Logika pemecahan masalah dan wawasan teknisnya sangat memadai untuk standar tim.`;
    } else if (scoreVal >= 75) {
      summary = `Kandidat memiliki kompetensi dasar yang cukup solid, namun masih memerlukan pembelajaran tambahan untuk level tingkat lanjut. Menunjukkan motivasi belajar yang tinggi untuk berkembang.`;
    } else {
      summary = `Kandidat belum memenuhi ekspektasi standar minimum yang ditentukan. Pemahaman konsep dasar dan wawasan praktis masih terbatas.`;
    }

    await db.query(
      "UPDATE applicants SET status = 'Menunggu Hasil', interview_score = ?, interview_notes = ?, interview_conclusion = ? WHERE user_id = ? AND status = 'Interview'", 
      [scoreVal, notes, summary, userId]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// For Pelamar Lamaran Saya
app.get('/api/applications/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const [rows] = await db.query(`
      SELECT a.*, j.title as job_title, j.kota as job_location, j.psikotes 
      FROM applicants a 
      JOIN jobs j ON a.job_id = j.id 
      WHERE a.user_id = ? 
      ORDER BY a.created_at DESC
    `, [userId]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/applications', async (req, res) => {
  const { userId, jobId, name, cv } = req.body;
  try {
    // 1. Ambil data lowongan
    const [jobRows] = await db.query('SELECT * FROM jobs WHERE id = ?', [jobId]);
    if (jobRows.length === 0) return res.status(404).json({ error: 'Lowongan tidak ditemukan.' });
    const job = jobRows[0];

    // 2. Ambil profil pelamar
    const [profRows] = await db.query('SELECT * FROM pelamar_profiles WHERE user_id = ?', [userId]);
    const profile = profRows[0] || {};

    // 3. Baca CV jika formatnya PDF dan filenya ada
    let pdfBuffer = null;
    let mimeType = null;
    if (cv && cv.toLowerCase().endsWith('.pdf')) {
      const filePath = path.join(uploadDir, cv);
      if (fs.existsSync(filePath)) {
        try {
          pdfBuffer = fs.readFileSync(filePath);
          mimeType = 'application/pdf';
        } catch (err) {
          console.error("Gagal membaca file CV PDF pelamar:", err);
        }
      }
    }

    // 4. Jalankan analisis CV menggunakan Gemini AI
    console.log(`Menjalankan analisis CV Gemini AI untuk pelamar ${name}...`);
    const matchResult = await analyzeCV(job, profile, pdfBuffer, mimeType);
    const strengthsJson = JSON.stringify(matchResult.strengths || []);
    const weaknessesJson = JSON.stringify(matchResult.weaknesses || []);

    const [result] = await db.query(
      `INSERT INTO applicants (user_id, job_id, name, cv, match_score, ai_strengths, ai_weaknesses, ai_conclusion) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId, 
        jobId, 
        name, 
        cv, 
        matchResult.match_score || 70, 
        strengthsJson, 
        weaknessesJson, 
        matchResult.conclusion || ''
      ]
    );
    res.status(201).json({ success: true, id: result.insertId });
  } catch (error) {
    console.error("Error saat menyimpan lamaran pelamar:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/applicants/:id/analyze-cv', async (req, res) => {
  const { id } = req.params;
  try {
    const [appRows] = await db.query('SELECT * FROM applicants WHERE id = ?', [id]);
    if (appRows.length === 0) return res.status(404).json({ error: 'Pelamar tidak ditemukan.' });
    const app = appRows[0];
    
    const [jobRows] = await db.query('SELECT * FROM jobs WHERE id = ?', [app.job_id]);
    if (jobRows.length === 0) return res.status(404).json({ error: 'Lowongan tidak ditemukan.' });
    const job = jobRows[0];

    const [profRows] = await db.query('SELECT * FROM pelamar_profiles WHERE user_id = ?', [app.user_id]);
    const profile = profRows[0] || {};
    
    let pdfBuffer = null;
    let mimeType = null;
    if (app.cv && app.cv.toLowerCase().endsWith('.pdf')) {
      const filePath = path.join(uploadDir, app.cv);
      if (fs.existsSync(filePath)) {
        try {
          pdfBuffer = fs.readFileSync(filePath);
          mimeType = 'application/pdf';
        } catch (err) {
          console.error("Gagal membaca file CV PDF pelamar:", err);
        }
      }
    }

    console.log(`Menjalankan re-analisis CV Gemini AI untuk pelamar ${app.name}...`);
    const matchResult = await analyzeCV(job, profile, pdfBuffer, mimeType);
    const strengthsJson = JSON.stringify(matchResult.strengths || []);
    const weaknessesJson = JSON.stringify(matchResult.weaknesses || []);

    await db.query(
      `UPDATE applicants SET 
        match_score = ?, 
        ai_strengths = ?, 
        ai_weaknesses = ?, 
        ai_conclusion = ? 
       WHERE id = ?`,
      [matchResult.match_score || 70, strengthsJson, weaknessesJson, matchResult.conclusion || '', id]
    );

    res.json({
      success: true,
      matchScore: matchResult.match_score,
      aiMatchDetails: {
        strengths: matchResult.strengths || [],
        weaknesses: matchResult.weaknesses || [],
        conclusion: matchResult.conclusion || ''
      }
    });
  } catch (error) {
    console.error("Gagal melakukan re-analisis CV:", error);
    res.status(500).json({ error: error.message });
  }
});

// --- INTERVIEW ROOMS ENDPOINTS ---

// Create a new interview room (HRD creates)
app.post('/api/interview-rooms', async (req, res) => {
  const { applicantId, roomName, createdBy, scheduledAt } = req.body;
  try {
    // Generate unique room code
    const roomCode = 'INT-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Close any existing active rooms for this applicant
    await db.query(
      "UPDATE interview_rooms SET status = 'ended' WHERE applicant_id = ? AND status != 'ended'",
      [applicantId]
    );
    
    const [result] = await db.query(
      'INSERT INTO interview_rooms (applicant_id, room_name, room_code, status, created_by, scheduled_at) VALUES (?, ?, ?, ?, ?, ?)',
      [applicantId, roomName, roomCode, scheduledAt ? 'scheduled' : 'waiting', createdBy, scheduledAt || null]
    );
    
    res.status(201).json({ 
      success: true, 
      id: result.insertId, 
      roomCode,
      roomName,
      status: scheduledAt ? 'scheduled' : 'waiting',
      scheduledAt: scheduledAt || null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get active room for an applicant
app.get('/api/interview-rooms/applicant/:applicantId', async (req, res) => {
  const { applicantId } = req.params;
  try {
    const [rows] = await db.query(
      "SELECT * FROM interview_rooms WHERE applicant_id = ? ORDER BY created_at DESC LIMIT 1",
      [applicantId]
    );
    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.json(null);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get room by room ID
app.get('/api/interview-rooms/:roomId', async (req, res) => {
  const { roomId } = req.params;
  try {
    const [rows] = await db.query(
      `SELECT ir.*, a.status as applicant_status, a.name as applicant_name, a.user_id as applicant_user_id, a.job_id,
              j.title as job_title, COALESCE(u_hrd.name, u_creator.name) as hrd_name
       FROM interview_rooms ir
       JOIN applicants a ON ir.applicant_id = a.id
       JOIN jobs j ON a.job_id = j.id
       JOIN users u_creator ON ir.created_by = u_creator.id
       LEFT JOIN users u_hrd ON j.hr_id = u_hrd.id
       WHERE ir.id = ?`,
      [roomId]
    );
    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(404).json({ error: 'Room not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update room status
app.put('/api/interview-rooms/:roomId/status', async (req, res) => {
  const { roomId } = req.params;
  const { status } = req.body;
  try {
    await db.query('UPDATE interview_rooms SET status = ? WHERE id = ?', [status, roomId]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Heartbeat - update user presence in room
app.put('/api/interview-rooms/:roomId/heartbeat', async (req, res) => {
  const { roomId } = req.params;
  const { role } = req.body;
  try {
    const col = role === 'HRD' ? 'hrd_last_seen' : 'pelamar_last_seen';
    await db.query(`UPDATE interview_rooms SET ${col} = NOW() WHERE id = ?`, [roomId]);
    
    // Also set room to active if it's still waiting
    await db.query("UPDATE interview_rooms SET status = 'active' WHERE id = ? AND status = 'waiting'", [roomId]);
    
    // Get updated room data to check both presence
    const [rows] = await db.query('SELECT hrd_last_seen, pelamar_last_seen FROM interview_rooms WHERE id = ?', [roomId]);
    if (rows.length > 0) {
      const now = new Date();
      const hrdOnline = rows[0].hrd_last_seen && (now - new Date(rows[0].hrd_last_seen)) < 15000;
      const pelamarOnline = rows[0].pelamar_last_seen && (now - new Date(rows[0].pelamar_last_seen)) < 15000;
      res.json({ success: true, hrdOnline, pelamarOnline });
    } else {
      res.json({ success: true, hrdOnline: false, pelamarOnline: false });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get chat messages for a room
app.get('/api/interview-rooms/:roomId/chats', async (req, res) => {
  const { roomId } = req.params;
  const afterId = req.query.after_id || 0;
  try {
    const [rows] = await db.query(
      'SELECT * FROM interview_chats WHERE room_id = ? AND id > ? ORDER BY id ASC',
      [roomId, afterId]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send chat message in room
app.post('/api/interview-rooms/:roomId/chats', async (req, res) => {
  const { roomId } = req.params;
  const { senderId, senderName, senderRole, message } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO interview_chats (room_id, sender_id, sender_name, sender_role, message) VALUES (?, ?, ?, ?, ?)',
      [roomId, senderId, senderName, senderRole, message]
    );
    res.status(201).json({ 
      success: true, 
      id: result.insertId,
      room_id: parseInt(roomId),
      sender_id: senderId,
      sender_name: senderName,
      sender_role: senderRole,
      message,
      created_at: new Date()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all rooms for an applicant (including scheduled ones)
app.get('/api/interview-rooms/all/:applicantId', async (req, res) => {
  const { applicantId } = req.params;
  try {
    const [rows] = await db.query(
      "SELECT * FROM interview_rooms WHERE applicant_id = ? ORDER BY created_at DESC",
      [applicantId]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- PSYCHOTEST PACKAGES ENDPOINTS ---
app.get('/api/packages', async (req, res) => {
  try {
    const [rows] = await db.query("SELECT name FROM psychotest_packages WHERE status = 'published'");
    res.json(rows.map(r => r.name));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/packages', async (req, res) => {
  const { name } = req.body;
  try {
    await db.query("INSERT INTO psychotest_packages (name, status) VALUES (?, 'draft')", [name]);
    res.status(201).json({ name, status: 'draft' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all packages with questions (for Operator review & management)
app.get('/api/packages-full', async (req, res) => {
  try {
    const [packages] = await db.query('SELECT * FROM psychotest_packages ORDER BY id DESC');
    const [questions] = await db.query('SELECT * FROM psychotest_questions ORDER BY id ASC');
    
    // Group questions by package_id
    const result = packages.map(pkg => ({
      id: pkg.id,
      name: pkg.name,
      status: pkg.status || 'draft',
      questions: questions
        .filter(q => q.package_id === pkg.id)
        .map(q => ({
          id: q.id,
          q: q.question_text,
          a: q.correct_answer,
          options: q.options_json ? JSON.parse(q.options_json) : []
        }))
    }));
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new package (name must be unique)
app.post('/api/packages-full', async (req, res) => {
  const { name } = req.body;
  try {
    const [result] = await db.query("INSERT INTO psychotest_packages (name, status) VALUES (?, 'draft')", [name]);
    res.status(201).json({ id: result.insertId, name, status: 'draft', questions: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Publish a package
app.put('/api/packages-full/:id/publish', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("UPDATE psychotest_packages SET status = 'published' WHERE id = ?", [id]);
    res.json({ success: true, id: parseInt(id), status: 'published' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a package
app.delete('/api/packages-full/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM psychotest_packages WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add a question to a package
app.post('/api/packages-full/:id/questions', async (req, res) => {
  const packageId = req.params.id;
  const { questionText, correctAnswer, options } = req.body;
  const optionsJson = JSON.stringify(options || []);
  try {
    const [result] = await db.query(
      'INSERT INTO psychotest_questions (package_id, question_text, correct_answer, options_json) VALUES (?, ?, ?, ?)',
      [packageId, questionText, correctAnswer || '', optionsJson]
    );
    res.status(201).json({
      id: result.insertId,
      q: questionText,
      a: correctAnswer || '',
      options: options || []
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a question
app.delete('/api/questions-full/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM psychotest_questions WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a question
app.put('/api/questions-full/:id', async (req, res) => {
  const { id } = req.params;
  const { questionText, correctAnswer, options } = req.body;
  const optionsJson = JSON.stringify(options || []);
  try {
    await db.query(
      'UPDATE psychotest_questions SET question_text = ?, correct_answer = ?, options_json = ? WHERE id = ?',
      [questionText, correctAnswer, optionsJson, id]
    );
    res.json({
      success: true,
      id: parseInt(id),
      questionText,
      correctAnswer,
      options
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get questions by package name (for Pelamar taking the test)
app.get('/api/packages/questions', async (req, res) => {
  const { packageName } = req.query;
  try {
    const [packages] = await db.query('SELECT id FROM psychotest_packages WHERE name = ?', [packageName]);
    if (packages.length === 0) {
      return res.json([]);
    }
    const [questions] = await db.query(
      'SELECT id, question_text, options_json FROM psychotest_questions WHERE package_id = ? ORDER BY id ASC',
      [packages[0].id]
    );
    res.json(questions.map(q => ({
      id: q.id,
      q: q.question_text,
      options: q.options_json ? JSON.parse(q.options_json) : []
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get answers for a specific applicant (enriched with correct keys for scoring)
app.get('/api/applicants/:applicantId/answers', async (req, res) => {
  const { applicantId } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM psychotest_answers WHERE applicant_id = ?', [applicantId]);
    if (rows.length === 0) {
      return res.json(null);
    }
    
    const answerRow = rows[0];
    const answers = JSON.parse(answerRow.answers_json);
    
    if (answers && answers.length > 0) {
      const questionIds = answers.map(a => a.questionId).filter(id => id);
      if (questionIds.length > 0) {
        // Query correct keys and options from DB
        const [questions] = await db.query(
          `SELECT id, correct_answer, options_json FROM psychotest_questions WHERE id IN (${questionIds.map(() => '?').join(',')})`,
          questionIds
        );
        
        answers.forEach(ans => {
          const q = questions.find(item => item.id === ans.questionId);
          if (q) {
            ans.correctAnswer = q.correct_answer;
            ans.options = q.options_json ? JSON.parse(q.options_json) : [];
          }
        });
      }
    }
    
    res.json({
      id: answerRow.id,
      applicant_id: answerRow.applicant_id,
      submitted_at: answerRow.submitted_at,
      answers: answers
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit answers for an applicant (keeps applicant status in 'Psikotes')
app.post('/api/applicants/:applicantId/answers', async (req, res) => {
  const { applicantId } = req.params;
  const { answers } = req.body; // array of { questionId, questionText, answerText }
  try {
    const answersJson = JSON.stringify(answers);
    
    // Save to psychotest_answers table
    await db.query(
      'INSERT INTO psychotest_answers (applicant_id, answers_json) VALUES (?, ?) ON CONFLICT (applicant_id) DO UPDATE SET answers_json = EXCLUDED.answers_json',
      [applicantId, answersJson]
    );
    
    res.status(201).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- SUPPORT MESSAGES ENDPOINTS ---
app.get('/api/messages', async (req, res) => {
  const hrId = req.query.hr_id;
  try {
    let query = 'SELECT id, hr_id, sender_role as senderRole, text, created_at as timestamp FROM support_messages ORDER BY id ASC';
    const params = [];
    if (hrId) {
      query = 'SELECT id, hr_id, sender_role as senderRole, text, created_at as timestamp FROM support_messages WHERE hr_id = ? ORDER BY id ASC';
      params.push(hrId);
    }
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/messages', async (req, res) => {
  const { hr_id, senderRole, text } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO support_messages (hr_id, sender_role, text) VALUES (?, ?, ?)',
      [hr_id, senderRole, text]
    );
    res.status(201).json({ id: result.insertId, hr_id, senderRole, text, timestamp: new Date() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to get unique HR users who have messaged (for Operator sidebar)
app.get('/api/hr-users', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT id, name, company_name 
      FROM users 
      WHERE role = 'HRD'
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- PROFILE ENDPOINTS ---
app.get('/api/profile/company', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM company_profile WHERE id = 1');
    if (rows.length > 0) {
      const row = rows[0];
      res.json({
        namaPerusahaan: row.nama_perusahaan || '',
        emailPerusahaan: row.email_perusahaan || '',
        deskripsi: row.deskripsi || '',
        noTelp: row.no_telp || '',
        alamat: row.alamat || '',
        provinsi: row.provinsi || '',
        kota: row.kota || '',
        kecamatan: row.kecamatan || '',
        kodePos: row.kode_pos || '',
        jumlahPegawai: row.jumlah_pegawai || '',
        industri: row.industri || '',
        website: row.website || '',
        tahunBerdiri: row.tahun_berdiri || '',
        nib: row.nib || '',
        logo: row.logo || '',
        nibFile: row.nib_file || ''
      });
    } else {
      res.json({});
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/profile/company', async (req, res) => {
  const { namaPerusahaan, emailPerusahaan, deskripsi, noTelp, alamat, provinsi, kota, kecamatan, kodePos, jumlahPegawai, industri, website, tahunBerdiri, nib, nibFile } = req.body;
  try {
    await db.query(
      `UPDATE company_profile SET 
        nama_perusahaan = ?, email_perusahaan = ?, deskripsi = ?, no_telp = ?, alamat = ?, 
        provinsi = ?, kota = ?, kecamatan = ?, kode_pos = ?, jumlah_pegawai = ?, 
        industri = ?, website = ?, tahun_berdiri = ?, nib = ?, nib_file = ? 
       WHERE id = 1`,
      [namaPerusahaan, emailPerusahaan, deskripsi, noTelp, alamat, provinsi, kota, kecamatan, kodePos, jumlahPegawai, industri, website, tahunBerdiri, nib, nibFile || null]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/profile/company/logo', upload.single('logo'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const filename = req.file.filename;
  try {
    await db.query('UPDATE company_profile SET logo = ? WHERE id = 1', [filename]);
    res.json({ success: true, logo: filename });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/profile/company/nib-file', upload.single('nib_file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const filename = req.file.filename;
  try {
    await db.query('UPDATE company_profile SET nib_file = ? WHERE id = 1', [filename]);
    res.json({ success: true, nibFile: filename });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  res.json({ success: true, filename: req.file.filename });
});

app.get('/api/profile/user', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM user_profile WHERE id = 1');
    if (rows.length > 0) {
      const row = rows[0];
      res.json({
        namaLengkap: row.nama_lengkap || '',
        email: row.email || '',
        noWhatsapp: row.no_whatsapp || ''
      });
    } else {
      res.json({});
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/profile/user', async (req, res) => {
  const { namaLengkap, email, noWhatsapp } = req.body;
  try {
    await db.query(
      'UPDATE user_profile SET nama_lengkap = ?, email = ?, no_whatsapp = ? WHERE id = 1',
      [namaLengkap, email, noWhatsapp]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- PERBAIKAN 2: Penyesuaian Fitur Static Files dan Export ---
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get(/.*/, (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// WAJIB UNTUK VERCEL: Export fungsi aplikasinya (Ini solusi utama 500 Error)
export default app;

// Tetap pertahankan app.listen agar kamu tetap bisa ngetest aplikasinya di localhost laptopmu
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
  });
}