"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectToDatabase = connectToDatabase;
exports.getDbPool = getDbPool;
exports.closeDatabase = closeDatabase;
const mssql_1 = __importDefault(require("mssql"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
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
let pool = null; // nullで初期化
async function connectToDatabase() {
    try {
        if (pool && pool.connected) {
            console.log('Database pool already connected.');
            return pool;
        }
        console.log('Connecting to SQL Server...');
        pool = await mssql_1.default.connect(config);
        console.log('SQL Server connected!');
        return pool;
    }
    catch (err) {
        console.error('Database connection failed!', err);
        // 接続失敗時はエラーをthrowし、呼び出し元で処理させる
        throw new Error('Database connection failed');
    }
}
async function getDbPool() {
    if (!pool || !pool.connected) {
        await connectToDatabase();
    }
    return pool; // 非nullアサーション
}
async function closeDatabase() {
    if (pool && pool.connected) {
        await pool.close();
        console.log('SQL Server connection closed.');
        pool = null; // クローズ後にプールをリセット
    }
}
