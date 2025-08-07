"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// node_api/src/app.ts
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv")); // ★dotenvをインポート
const db_1 = require("./config/db"); // 既存
const tantoRoutes_1 = __importDefault(require("./routes/tantoRoutes")); // 既存
const planRoutes_1 = __importDefault(require("./routes/planRoutes")); // 既存
// ★.envファイルを読み込む
dotenv_1.default.config();
const app = (0, express_1.default)();
// CORS設定を修正: 環境変数からオリジンを読み込む
// 環境変数FRONTEND_ORIGINSが存在しない場合は、デフォルトでhttp://localhost:3000を許可
const allowedOrigins = process.env.FRONTEND_ORIGINS ? process.env.FRONTEND_ORIGINS.split(',') : ['http://localhost:8080'];
app.use((0, cors_1.default)({
    origin: allowedOrigins, // ★環境変数から読み込んだオリジンを使用
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // 許可するHTTPメソッド
    allowedHeaders: ['Content-Type', 'Authorization'], // 許可するヘッダー
}));
app.use(express_1.default.json());
app.use('/api/tantos', tantoRoutes_1.default); // 既存
app.use('/api/plans', planRoutes_1.default); // 既存
async function initializeApp() {
    try {
        await (0, db_1.connectToDatabase)();
    }
    catch (error) {
        console.error('Failed to connect to database at app initialization:', error);
        process.exit(1);
    }
}
initializeApp();
process.on('SIGINT', async () => {
    console.log('SIGINT signal received: closing database connection.');
    await (0, db_1.closeDatabase)();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received: closing database connection.');
    await (0, db_1.closeDatabase)();
    process.exit(0);
});
exports.default = app;
