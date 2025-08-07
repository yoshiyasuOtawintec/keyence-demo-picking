"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTantoList = getTantoList;
const db_1 = require("../config/db");
async function getTantoList() {
    try {
        const pool = await (0, db_1.getDbPool)();
        const result = await pool.request().query('SELECT TANTO_CODE, TANTO_NAME FROM M_TANTO ORDER BY TANTO_CODE');
        return result.recordset;
    }
    catch (error) {
        console.error('Error in getTantoList:', error);
        throw error; // エラーを呼び出し元に伝播
    }
}
