import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER || 'root'}:${process.env.DB_PASSWORD || ''}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'jobportal_db'}`,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// A wrapper to translate mysql2 queries into pg queries
const db = {
  query: async (sql, values) => {
    let pgSql = sql;
    let pgValues = values || [];
    
    // Convert ? to $1, $2, etc.
    if (values && values.length > 0) {
      let i = 1;
      pgSql = sql.replace(/\?/g, () => `$${i++}`);
    }

    // Convert AUTO_INCREMENT to SERIAL in ALTER statements if any, though best handled in SQL files directly.
    // If it's an INSERT statement without RETURNING, append RETURNING id to mimic mysql's insertId
    const isInsert = pgSql.trim().toUpperCase().startsWith('INSERT');
    if (isInsert && !pgSql.toUpperCase().includes('RETURNING')) {
      // Append RETURNING id, assumes the primary key is 'id'
      pgSql = pgSql + ' RETURNING id';
    }

    try {
      const res = await pool.query(pgSql, pgValues);
      
      // Mimic mysql2 return format [rows, fields/result]
      if (isInsert) {
        // Return a mock result object with insertId
        const insertId = res.rows.length > 0 ? res.rows[0].id : null;
        return [ { insertId, ...res }, res.fields ];
      }
      
      // For SELECT/UPDATE/DELETE
      return [res.rows, res.fields];
    } catch (err) {
      console.error('Database query error:', err.message, '\\nSQL:', pgSql, '\\nValues:', pgValues);
      throw err;
    }
  }
};

export default db;
