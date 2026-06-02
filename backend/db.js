import mysql from 'mysql2';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root', // Default XAMPP/Laragon user
  password: '', // Default XAMPP/Laragon password is empty
  database: 'jobportal_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Convert pool to use promises
const promisePool = pool.promise();

export default promisePool;
