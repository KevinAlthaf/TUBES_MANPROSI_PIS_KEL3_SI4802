// import 'dotenv/config'; 
import db from './db.js';


async function migrate() {
  try {
    console.log("Starting migration...");
    await db.query(`
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
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS user_profile (
        id SERIAL PRIMARY KEY,
        nama_lengkap VARCHAR(255) DEFAULT '',
        email VARCHAR(255) DEFAULT '',
        no_whatsapp VARCHAR(50) DEFAULT ''
      );
    `);

    await db.query(`
      INSERT INTO company_profile (id, nama_perusahaan, email_perusahaan, deskripsi, no_telp, alamat, provinsi, kota, kecamatan, kode_pos, jumlah_pegawai, industri, website, tahun_berdiri, nib, logo)
      VALUES (1, '', '', '', '', '', '', '', '', '', '', '', '', '', '', NULL)
      ON CONFLICT (id) DO NOTHING
    `); 

    await db.query(`
      INSERT INTO user_profile (id, nama_lengkap, email, no_whatsapp)
      VALUES (1, '', '', '')
      ON CONFLICT (id) DO NOTHING
    `); 

    console.log("Migration complete: Tables created and seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrate();
