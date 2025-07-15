import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_DATABASE,
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

let pool: sql.ConnectionPool | null = null; // nullで初期化

export async function connectToDatabase() {
  try {
    if (pool && pool.connected) {
      console.log('Database pool already connected.');
      return pool;
    }
    console.log('Connecting to SQL Server...');
    pool = await sql.connect(config);
    console.log('SQL Server connected!');
    return pool;
  } catch (err) {
    console.error('Database connection failed!', err);
    // 接続失敗時はエラーをthrowし、呼び出し元で処理させる
    throw new Error('Database connection failed');
  }
}

export async function getDbPool() {
  if (!pool || !pool.connected) {
    await connectToDatabase();
  }
  return pool as sql.ConnectionPool; // 非nullアサーション
}

export async function closeDatabase() {
  if (pool && pool.connected) {
    await pool.close();
    console.log('SQL Server connection closed.');
    pool = null; // クローズ後にプールをリセット
  }
}