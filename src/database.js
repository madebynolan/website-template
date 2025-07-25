import mysql from 'mysql2/promise';

// Create database pool
export const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export async function query(query, params = []) {
  try {
    return await db.execute(query, params);
  } catch (err) {
    console.error(`❌ Failed to run raw query:`, err);
    throw err;
  }
}

export function mysqlTime(date) {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}