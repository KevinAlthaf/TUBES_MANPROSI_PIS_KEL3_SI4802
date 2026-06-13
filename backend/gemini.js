import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ambil API Key dari process.env atau file .env secara aman
function getGeminiApiKey() {
  let key = process.env.GEMINI_API_KEY || '';
  if (key && key !== 'YOUR_GEMINI_API_KEY_HERE') return key;

  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    try {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const match = envContent.match(/GEMINI_API_KEY\s*=\s*(.*)/);
      if (match) {
        const parsedKey = match[1].trim().replace(/['"]/g, '');
        if (parsedKey && parsedKey !== 'YOUR_GEMINI_API_KEY_HERE') {
          return parsedKey;
        }
      }
    } catch (err) {
      console.error("Gagal membaca API key Gemini dari .env", err);
    }
  }
  return '';
}

// Fungsi utama untuk memanggil Gemini API via HTTPS request
function callGeminiAPI(prompt, pdfBuffer = null, mimeType = null) {
  return new Promise((resolve, reject) => {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      return reject(new Error("GEMINI_API_KEY tidak dikonfigurasi."));
    }

    const payload = {
      contents: [
        {
          parts: []
        }
      ],
      generationConfig: {
        responseMimeType: "application/json"
      }
    };

    // Jika ada file PDF, masukkan sebagai inlineData base64
    if (pdfBuffer && mimeType) {
      payload.contents[0].parts.push({
        inlineData: {
          mimeType: mimeType,
          data: pdfBuffer.toString('base64')
        }
      });
    }

    // Masukkan instruksi teks prompt
    payload.contents[0].parts.push({
      text: prompt
    });

    const dataString = JSON.stringify(payload);
    const options = {
      hostname: 'generativelanguage.googleapis.com',
      port: 443,
      path: `/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(dataString)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const data = JSON.parse(body);
            const textResult = data.candidates[0].content.parts[0].text;
            resolve(JSON.parse(textResult));
          } catch (e) {
            reject(new Error('Gagal mem-parse respon JSON dari Gemini API.'));
          }
        } else {
          reject(new Error(`Gemini API mengembalikan status ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', (err) => { reject(err); });
    req.write(dataString);
    req.end();
  });
}

// ==========================================
// 1. ANALISIS KECOCOKAN CV (AI MATCH SCORE)
// ==========================================
export async function analyzeCV(jobDetails, profileData, pdfBuffer = null, mimeType = null) {
  const prompt = `Anda adalah Asisten HRD AI tingkat lanjut. Tugas Anda adalah menganalisis kecocokan CV pelamar dengan persyaratan lowongan kerja secara kritis.

INFORMASI LOWONGAN:
- Judul: ${jobDetails.title}
- Departemen: ${jobDetails.department || 'Umum'}
- Kota: ${jobDetails.kota || 'Umum'}
- Pendidikan Minimum: ${jobDetails.pendidikan || 'Semua'}
- Jenis Pekerjaan: ${jobDetails.jenis_pekerjaan || 'Full-time'}
- Sistem Kerja: ${jobDetails.sistem_kerja || 'WFO'}
- Deskripsi & Kualifikasi Pekerjaan: ${jobDetails.deskripsi || ''}

INFORMASI PROFIL PELAMAR:
- Nama Lengkap: ${profileData.nama_lengkap || ''}
- Pendidikan Terakhir: ${profileData.pendidikan_terakhir || ''}
- Posisi Diinginkan: ${profileData.posisi_diinginkan || ''}
- Pengalaman Kerja: ${profileData.pengalaman_kerja || ''}
- Skills/Keahlian: ${JSON.stringify(profileData.skills || [])}
- Edukasi Tambahan: ${JSON.stringify(profileData.edukasi || null)}
- Pengalaman Organisasi: ${profileData.pengalaman_organisasi || ''}

Tugas Anda adalah menilai secara jujur kecocokan pelamar dengan kualifikasi lowongan. Jika ada berkas CV PDF pelamar terlampir, evaluasi teks di dalamnya dengan teliti untuk menemukan detail yang tidak tertera pada profil terstruktur.

Berikan keluaran dalam format JSON valid dalam Bahasa Indonesia. Pastikan tidak ada teks pembuka/penutup lain di luar JSON:
{
  "match_score": 85,
  "strengths": [
    "Poin kelebihan konkret 1 berdasarkan profil/CV",
    "Poin kelebihan konkret 2 berdasarkan profil/CV"
  ],
  "weaknesses": [
    "Poin kekurangan/gap konkret 1 berdasarkan profil/CV",
    "Poin kekurangan/gap konkret 2 berdasarkan profil/CV"
  ],
  "conclusion": "Kesimpulan ringkas 2-3 kalimat mengenai kecocokan pelamar ini dengan posisi tersebut."
}`;

  try {
    const result = await callGeminiAPI(prompt, pdfBuffer, mimeType);
    if (result && typeof result.match_score === 'number') {
      return result;
    }
    throw new Error("Format output Gemini tidak sesuai.");
  } catch (err) {
    console.warn("Gemini AI CV Match gagal, menggunakan fallback lokal:", err.message);
    return localCVMatchFallback(jobDetails, profileData);
  }
}

// Fallback lokal untuk analisis CV
function localCVMatchFallback(job, profile) {
  const skillsList = Array.isArray(profile.skills) ? profile.skills : 
                     (typeof profile.skills === 'string' ? JSON.parse(profile.skills || '[]') : []);
  let score = 65;
  const strengths = [];
  const weaknesses = [];

  // Pencocokan skill
  const matchedSkills = [];
  skillsList.forEach(s => {
    if ((job.deskripsi || '').toLowerCase().includes(s.toLowerCase()) || 
        (job.title || '').toLowerCase().includes(s.toLowerCase())) {
      score += 8;
      matchedSkills.push(s);
    }
  });

  if (matchedSkills.length > 0) {
    strengths.push(`Menguasai keahlian relevan: ${matchedSkills.slice(0, 3).join(', ')}`);
  } else {
    weaknesses.push("Belum mendeskripsikan keahlian teknis khusus yang sesuai dengan deskripsi lowongan.");
  }

  // Pencocokan pendidikan
  const userEdu = (profile.pendidikan_terakhir || '').toLowerCase();
  const jobEdu = (job.pendidikan || '').toLowerCase();
  if (userEdu && jobEdu) {
    if (userEdu.includes(jobEdu) || (jobEdu === 's1' && userEdu === 's1') || (jobEdu === 'd3' && (userEdu === 'd3' || userEdu === 's1'))) {
      score += 15;
      strengths.push(`Pendidikan terakhir (${profile.pendidikan_terakhir}) memenuhi kriteria minimum (${job.pendidikan})`);
    } else {
      score -= 10;
      weaknesses.push(`Pendidikan terakhir (${profile.pendidikan_terakhir}) di bawah kriteria minimum (${job.pendidikan})`);
    }
  }

  // Pencocokan domisili
  const userLoc = (profile.kota_domisili || '').toLowerCase();
  const jobLoc = (job.kota || '').toLowerCase();
  if (userLoc && jobLoc) {
    if (userLoc.includes(jobLoc) || jobLoc.includes(userLoc) || jobLoc === 'remote' || jobLoc === 'wfh') {
      score += 5;
      strengths.push(`Domisili pelamar di ${profile.kota_domisili} sesuai dengan lokasi penugasan`);
    } else {
      weaknesses.push(`Domisili di ${profile.kota_domisili}, sedangkan pekerjaan berlokasi di ${job.kota} (Perlu relokasi/WFO)`);
    }
  }

  score = Math.min(98, Math.max(45, score));
  
  if (strengths.length === 0) {
    strengths.push("Memiliki berkas administrasi lamaran yang lengkap untuk posisi ini.");
  }
  if (weaknesses.length === 0) {
    weaknesses.push("Tidak ada ketidakcocokan kualifikasi yang mencolok secara administrasi.");
  }

  const conclusion = score >= 80 ? 
    `Kandidat memiliki kualifikasi yang baik dan relevan dengan kebutuhan posisi ${job.title}. Direkomendasikan untuk lanjut ke tahap seleksi berikutnya.` :
    `Kandidat memenuhi kriteria dasar untuk posisi ${job.title}, namun perlu peninjauan lebih lanjut di beberapa aspek kompetensi teknis.`;

  return {
    match_score: score,
    strengths,
    weaknesses,
    conclusion
  };
}

// ==========================================
// 2. ANALISIS TRANSKRIP WAWANCARA
// ==========================================
export async function analyzeInterviewTranscript(transcript, applicantName, jobTitle) {
  const prompt = `Anda adalah Asisten Rekrutmen AI tingkat lanjut. Tugas Anda adalah menganalisis transkrip percakapan wawancara antara HRD dan Pelamar secara kritis.
Nama Pelamar: ${applicantName}
Posisi Pekerjaan: ${jobTitle}

Transkrip Wawancara:
"${transcript.trim()}"

Evaluasi sikap, kesesuaian budaya kerja, etika berbicara, kemampuan teknis, dan motivasi pelamar secara objektif berdasarkan isi transkrip. Jika kandidat berkata kasar, tidak sopan, malas, tidak beretika, atau menolak bekerja, berikan skor rendah (50-60) dan kesimpulan "Tidak Direkomendasikan". Jika kandidat sangat terampil dan komunikatif, berikan skor tinggi (83-100) dan kesimpulan "Layak Diterima".

Keluaran HARUS berupa objek JSON valid dalam Bahasa Indonesia. Pastikan tidak ada teks lain di luar JSON:
{
  "score": 85,
  "conclusion": "Layak Diterima",
  "notes": "Laporan evaluasi detail Anda dalam Bahasa Indonesia. Jelaskan performa teknis dan komunikasi secara konkret dengan merujuk ke isi transkrip."
}`;

  try {
    const result = await callGeminiAPI(prompt);
    if (result && typeof result.score === 'number') {
      return result;
    }
    throw new Error("Format output Gemini tidak sesuai.");
  } catch (err) {
    console.warn("Gemini AI Analisis Wawancara gagal, menggunakan fallback lokal:", err.message);
    return localInterviewFallback(transcript, applicantName, jobTitle);
  }
}

// Fallback lokal untuk analisis wawancara
function localInterviewFallback(transcript, applicantName, jobTitle) {
  const t = (transcript || '').toLowerCase();
  
  const techs = [];
  if (t.includes('react')) techs.push('React.js');
  if (t.includes('javascript') || t.includes(' js ')) techs.push('JavaScript (ES6+)');
  if (t.includes('node') || t.includes('express')) techs.push('Node.js / Express');
  if (t.includes('mysql') || t.includes('database') || t.includes('sql')) techs.push('MySQL / Database');
  if (t.includes('tailwind') || t.includes('css')) techs.push('CSS / Tailwind');

  const positiveTraits = [];
  if (t.includes('komunikasi') || t.includes('bicara') || t.includes('lancar')) positiveTraits.push('Kemampuan komunikasi verbal yang sangat baik');
  if (t.includes('tim') || t.includes('kolaborasi')) positiveTraits.push('Semangat kolaborasi tim yang baik');
  if (t.includes('belajar') || t.includes('adaptasi')) positiveTraits.push('Hasrat belajar besar untuk mengadopsi teknologi baru');

  const concerns = [];
  if (t.includes('gugup') || t.includes('grogi')) concerns.push('Kandidat terlihat agak gugup menjawab pertanyaan kompleks');
  if (t.includes('kurang') || t.includes('lemah')) concerns.push('Keterbatasan pengalaman praktis pada beberapa sub-teknologi');

  let localScore = 75;
  localScore += techs.length * 3;
  localScore += positiveTraits.length * 4;
  localScore -= concerns.length * 6;
  
  const finalScore = Math.min(98, Math.max(50, localScore));

  let conclusion = 'Dipertimbangkan';
  let summarySentence = '';
  if (finalScore >= 83) {
    conclusion = 'Layak Diterima';
    summarySentence = `Kandidat ${applicantName} menunjukkan performa komunikasi dan pemahaman teknis yang kuat untuk posisi ${jobTitle}. Sangat direkomendasikan.`;
  } else if (finalScore >= 65) {
    conclusion = 'Dipertimbangkan';
    summarySentence = `Kandidat ${applicantName} memiliki dasar kompetensi memadai untuk posisi ${jobTitle}, namun memerlukan bimbingan awal (mentoring) di area yang dinilai kurang optimal.`;
  } else {
    conclusion = 'Tidak Direkomendasikan';
    summarySentence = `Kandidat ${applicantName} belum memenuhi standar minimum kompetensi atau keselarasan kerja yang dibutuhkan untuk posisi ${jobTitle}.`;
  }

  const notesReport = `[TRANSKRIP ASLI WAWANCARA]:\n"${transcript.trim()}"\n\n[ANALISIS EVALUASI AI (LOCAL FALLBACK)]:\n- KESIMPULAN: ${summarySentence}\n- KEAHLIAN TERDETEKSI: ${techs.length > 0 ? techs.join(', ') : 'Umum'}\n- SOFT SKILLS: ${positiveTraits.length > 0 ? positiveTraits.join(', ') : 'Cukup kooperatif'}\n- CATATAN KHUSUS: ${concerns.length > 0 ? concerns.join(', ') : 'Tidak ada catatan negatif khusus.'}`;

  return {
    score: finalScore,
    conclusion,
    notes: notesReport
  };
}

// ==========================================
// 3. ANALISIS CATATAN MANUAL WAWANCARA
// ==========================================
export async function analyzeNotes(notes, score) {
  const prompt = `Anda adalah Asisten HRD AI tingkat lanjut. Tugas Anda adalah membaca catatan wawancara singkat tentang seorang kandidat dengan skor ${score}/100, lalu merumuskan sebuah ringkasan kesimpulan evaluasi yang sangat profesional, terstruktur, objektif, dan tepercaya dalam Bahasa Indonesia.
Berikan keluaran dalam format JSON valid dengan struktur berikut:
{
  "summary": "Tulis 1 paragraf penjelasan mengalir yang padat mengenai evaluasi kandidat tersebut."
}`;

  try {
    const result = await callGeminiAPI(prompt);
    if (result && result.summary) {
      return result.summary;
    }
    throw new Error("Format output summary tidak sesuai.");
  } catch (err) {
    console.warn("Gemini AI Analisis Catatan gagal, menggunakan fallback lokal:", err.message);
    const scoreVal = parseInt(score) || 80;
    if (scoreVal >= 80) {
      return `Kandidat dinilai luar biasa dan berkompetensi tinggi berdasarkan catatan pewawancara. Komunikasi sangat matang, profesional, dan terstruktur. Logika pemecahan masalah dan wawasan teknisnya sangat memadai untuk standar tim.`;
    } else if (scoreVal >= 60) {
      return `Kandidat memiliki kompetensi dasar yang cukup solid berdasarkan catatan pewawancara, namun masih memerlukan pembelajaran tambahan untuk level tingkat lanjut. Menunjukkan motivasi belajar yang tinggi untuk berkembang.`;
    } else {
      return `Kandidat belum memenuhi ekspektasi standar minimum yang ditentukan berdasarkan catatan pewawancara. Pemahaman konsep pemrograman dasar dan wawasan praktis masih terbatas.`;
    }
  }
}

