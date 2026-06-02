import db from './db.js';

async function migrate() {
  try {
    console.log("Starting migration...");
    await db.query(`
      CREATE TABLE IF NOT EXISTS company_profile (
        id int(11) NOT NULL AUTO_INCREMENT,
        nama_perusahaan varchar(255) DEFAULT '',
        email_perusahaan varchar(255) DEFAULT '',
        deskripsi text DEFAULT NULL,
        no_telp varchar(50) DEFAULT '',
        alamat text DEFAULT NULL,
        provinsi varchar(100) DEFAULT '',
        kota varchar(100) DEFAULT '',
        kecamatan varchar(100) DEFAULT '',
        kode_pos varchar(20) DEFAULT '',
        jumlah_pegawai varchar(50) DEFAULT '',
        industri varchar(100) DEFAULT '',
        website varchar(255) DEFAULT '',
        tahun_berdiri varchar(10) DEFAULT '',
        nib varchar(100) DEFAULT '',
        logo varchar(255) DEFAULT NULL,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS user_profile (
        id int(11) NOT NULL AUTO_INCREMENT,
        nama_lengkap varchar(255) DEFAULT '',
        email varchar(255) DEFAULT '',
        no_whatsapp varchar(50) DEFAULT '',
        PRIMARY KEY (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await db.query(`
      INSERT INTO company_profile (id, nama_perusahaan, email_perusahaan, deskripsi, no_telp, alamat, provinsi, kota, kecamatan, kode_pos, jumlah_pegawai, industri, website, tahun_berdiri, nib, logo)
      SELECT 1, '', '', '', '', '', '', '', '', '', '', '', '', '', '', NULL
      FROM DUAL
      WHERE NOT EXISTS (SELECT 1 FROM company_profile WHERE id = 1);
    `);

    await db.query(`
      INSERT INTO user_profile (id, nama_lengkap, email, no_whatsapp)
      SELECT 1, '', '', ''
      FROM DUAL
      WHERE NOT EXISTS (SELECT 1 FROM user_profile WHERE id = 1);
    `);

    console.log("Migration complete: Tables created and seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrate();
