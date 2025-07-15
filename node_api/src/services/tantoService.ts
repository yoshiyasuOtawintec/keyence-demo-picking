import { getDbPool } from '../config/db';
import sql from 'mssql';

export interface ITanto {
  TANTO_CODE: string;
  TANTO_NAME: string;
}

export async function getTantoList(): Promise<ITanto[]> {
  try {
    const pool = await getDbPool();
    const result = await pool.request().query<ITanto>('SELECT TANTO_CODE, TANTO_NAME FROM M_TANTO ORDER BY TANTO_CODE');
    return result.recordset;
  } catch (error) {
    console.error('Error in getTantoList:', error);
    throw error; // エラーを呼び出し元に伝播
  }
}