"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// node_api/src/index.ts (既存ファイルを修正)
const app_1 = __importDefault(require("./app"));
const port = process.env.PORT || 8081;
app_1.default.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`Access M_TANTO API at http://localhost:${port}/api/tantos`); // 既存
    console.log(`Access T_PLAN API at http://localhost:${port}/api/plans`); // ★この行を追加
});
