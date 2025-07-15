// node_api/src/app.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv'; // ★dotenvをインポート

import { connectToDatabase, closeDatabase } from './config/db'; // 既存
import tantoRoutes from './routes/tantoRoutes'; // 既存
import planRoutes from './routes/planRoutes'; // 既存

// ★.envファイルを読み込む
dotenv.config();

const app = express();

// CORS設定を修正: 環境変数からオリジンを読み込む
// 環境変数FRONTEND_ORIGINSが存在しない場合は、デフォルトでhttp://localhost:3000を許可
const allowedOrigins = process.env.FRONTEND_ORIGINS ? process.env.FRONTEND_ORIGINS.split(',') : ['http://localhost:8080'];

app.use(cors({
  origin: allowedOrigins, // ★環境変数から読み込んだオリジンを使用
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // 許可するHTTPメソッド
  allowedHeaders: ['Content-Type', 'Authorization'], // 許可するヘッダー
}));

app.use(express.json());

app.use('/api/tantos', tantoRoutes); // 既存
app.use('/api/plans', planRoutes); // 既存

async function initializeApp() {
  try {
    await connectToDatabase();
  } catch (error) {
    console.error('Failed to connect to database at app initialization:', error);
    process.exit(1);
  }
}

initializeApp();

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing database connection.');
  await closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing database connection.');
  await closeDatabase();
  process.exit(0);
});

export default app;
