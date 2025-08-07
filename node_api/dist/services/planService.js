"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPlanDetailsByPlanId = getPlanDetailsByPlanId;
exports.getPlanList = getPlanList;
exports.updatePlan = updatePlan;
exports.getPlanById = getPlanById;
const db_1 = require("../config/db"); // データベースプールを取得する関数をインポート
const mssql_1 = __importDefault(require("mssql")); // mssqlライブラリをインポート
// --- 日付フォーマットのヘルパー関数 ---
const formatDateToYYYYMMDD = (date) => {
    if (!date)
        return null;
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};
// getPlanListで使用するために残しておくが、直接のタイムゾーン変換は不要になる可能性が高い
const formatDateTimeToISOString = (date) => {
    if (!date)
        return null;
    return date.toISOString();
};
// --- T_PLAN_DETAIL 関連関数 ---
async function getPlanDetailsByPlanId(planId) {
    try {
        const pool = await (0, db_1.getDbPool)(); // mssqlのプールを取得
        const result = await pool.request()
            .input('planId', mssql_1.default.Int, planId) // sql.Intを使用
            .query(`
        SELECT
          ID, HINSYU, ROW_NO, ITEM_TITLE, ITEM_NAME, TANA_NO, READ_DATA, QTY_TYPE,
          DETAIL_QTY, READ_QTY, COMMENT, ALERT_MSG, REMARK
        FROM T_PLAN_DETAIL
        WHERE ID = @planId -- T_PLAN_DETAILのIDカラムでフィルタリング
        ORDER BY ROW_NO ASC -- 連番でソート
      `);
        return result.recordset;
    }
    catch (err) {
        console.error(`SQL error in getPlanDetailsByPlanId for Plan ID ${planId}:`, err);
        throw err;
    }
}
// --- 計画リスト取得関数 ---
async function getPlanList(searchParams) {
    var _a, _b, _c, _d;
    try {
        const pool = await (0, db_1.getDbPool)(); // mssqlのプールを取得
        let query = `
      SELECT
        tp.ID, tp.NOHIN_DATE, tp.HINBAN, tp.QTY, tp.PLAN_STATUS,
        tp.START_DTM, tp.END_DTM, tp.CSV_FILE,
        tp.CREATE_DTM, tp.CREATE_TANTO_CODE, mtc.TANTO_NAME AS CREATE_TANTO_NAME,
        tp.UPDATE_DTM, tp.UPDATE_TANTO_CODE, mtu.TANTO_NAME AS UPDATE_TANTO_NAME,
        tp.START_TANTO_CODE,
        mts.TANTO_NAME AS START_TANTO_NAME
      FROM T_PLAN tp
      LEFT JOIN M_TANTO mtc ON tp.CREATE_TANTO_CODE = mtc.TANTO_CODE
      LEFT JOIN M_TANTO mtu ON tp.UPDATE_TANTO_CODE = mtu.TANTO_CODE
      LEFT JOIN M_TANTO mts ON tp.START_TANTO_CODE = mts.TANTO_CODE
      WHERE 1 = 1
    `;
        const request = pool.request();
        if (searchParams.deliveryDate) {
            query += ` AND CONVERT(DATE, tp.NOHIN_DATE) <= CONVERT(DATE, @deliveryDate)`;
            request.input('deliveryDate', mssql_1.default.Date, searchParams.deliveryDate);
        }
        if (searchParams.productCode) {
            query += ` AND tp.HINBAN LIKE @productCode`;
            request.input('productCode', mssql_1.default.NVarChar, `%${searchParams.productCode}%`);
        }
        query += ` ORDER BY tp.NOHIN_DATE ASC, tp.ID ASC`;
        const result = await request.query(query);
        const plansWithDetails = [];
        for (const plan of result.recordset) {
            const details = await getPlanDetailsByPlanId(plan.ID);
            plansWithDetails.push({
                ID: plan.ID,
                NOHIN_DATE: formatDateToYYYYMMDD(plan.NOHIN_DATE) || '',
                HINBAN: plan.HINBAN,
                QTY: plan.QTY,
                PLAN_STATUS: plan.PLAN_STATUS,
                START_DTM: plan.START_DTM ? plan.START_DTM.toISOString() : null,
                END_DTM: plan.END_DTM ? plan.END_DTM.toISOString() : null,
                CSV_FILE: plan.CSV_FILE,
                CREATE_DTM: plan.CREATE_DTM ? plan.CREATE_DTM.toISOString() : '',
                CREATE_TANTO_CODE: plan.CREATE_TANTO_CODE,
                CREATE_TANTO_NAME: (_a = plan.CREATE_TANTO_NAME) !== null && _a !== void 0 ? _a : '',
                UPDATE_DTM: plan.UPDATE_DTM ? plan.UPDATE_DTM.toISOString() : '',
                UPDATE_TANTO_CODE: plan.UPDATE_TANTO_CODE,
                UPDATE_TANTO_NAME: (_b = plan.UPDATE_TANTO_NAME) !== null && _b !== void 0 ? _b : '',
                START_TANTO_CODE: (_c = plan.START_TANTO_CODE) !== null && _c !== void 0 ? _c : null,
                START_TANTO_NAME: (_d = plan.START_TANTO_NAME) !== null && _d !== void 0 ? _d : null,
                details: details,
            });
        }
        return plansWithDetails;
    }
    catch (error) {
        console.error('Error getting plan list from DB:', error);
        throw error;
    }
}
// --- 計画更新関数 ---
async function updatePlan(id, updateData) {
    try {
        const pool = await (0, db_1.getDbPool)();
        const transaction = new mssql_1.default.Transaction(pool);
        await transaction.begin();
        try {
            const request = transaction.request();
            let updateFields = [];
            let inputParams = [];
            // PLAN_STATUSは常に更新データから取得
            updateFields.push('PLAN_STATUS = @PLAN_STATUS');
            // ★修正: sql.Int() のように関数呼び出しにする
            inputParams.push({ name: 'PLAN_STATUS', type: mssql_1.default.Int(), value: updateData.PLAN_STATUS });
            // START_DTMとSTART_TANTO_CODEは、PLAN_STATUSが0から1に変わる時のみ設定（NULLの場合のみ）
            if (updateData.PLAN_STATUS === 1 && updateData.START_DTM === null) {
                updateFields.push('START_DTM = GETDATE()'); // DBサーバーの現在時刻
                updateFields.push('START_TANTO_CODE = @START_TANTO_CODE');
                // ★修正: sql.NVarChar() のように関数呼び出しにする (適切な長さを指定)
                inputParams.push({ name: 'START_TANTO_CODE', type: mssql_1.default.NVarChar(50), value: updateData.START_TANTO_CODE });
            }
            else if (updateData.START_DTM !== null) {
                // フロントエンドから既存のSTART_DTMが送られてきた場合、それをそのまま設定（変更しない）
                // SQL ServerのDateTimeOffset型に合わせるため、Dateオブジェクトに変換
                updateFields.push('START_DTM = @START_DTM');
                // ★修正: sql.DateTimeOffset() のように関数呼び出しにする
                inputParams.push({ name: 'START_DTM', type: mssql_1.default.DateTimeOffset(), value: new Date(updateData.START_DTM) });
                // START_TANTO_CODE も同様に更新データからそのまま設定
                updateFields.push('START_TANTO_CODE = @START_TANTO_CODE');
                // ★修正: sql.NVarChar() のように関数呼び出しにする (適切な長さを指定)
                inputParams.push({ name: 'START_TANTO_CODE', type: mssql_1.default.NVarChar(50), value: updateData.START_TANTO_CODE });
            }
            // END_DTMは、PLAN_STATUSが2（準備完了）に変わる時のみ設定
            // フロントエンドからEND_DTMがnullでない値で送られてきた場合（PickingPageで設定される）
            if (updateData.PLAN_STATUS === 2 && updateData.END_DTM !== null) {
                updateFields.push('END_DTM = GETDATE()'); // DBサーバーの現在時刻
            }
            else if (updateData.END_DTM === null) {
                // nullを明示的にセットする場合（例: 完了状態を取り消すなど）
                // nullを設定する場合でも、型は指定する (sql.DateTimeOffset()でnullを許容)
                updateFields.push('END_DTM = @END_DTM');
                inputParams.push({ name: 'END_DTM', type: mssql_1.default.DateTimeOffset(), value: null });
            }
            // UPDATE_DTM は常に DBサーバーの現在時刻
            updateFields.push('UPDATE_DTM = GETDATE()');
            updateFields.push('UPDATE_TANTO_CODE = @UPDATE_TANTO_CODE');
            // ★修正: sql.NVarChar() のように関数呼び出しにする (適切な長さを指定)
            inputParams.push({ name: 'UPDATE_TANTO_CODE', type: mssql_1.default.NVarChar(50), value: updateData.UPDATE_TANTO_CODE });
            // パラメータをリクエストに追加
            inputParams.forEach(p => {
                request.input(p.name, p.type, p.value);
            });
            await request.input('id', mssql_1.default.Int, id).query(`
        UPDATE T_PLAN
        SET ${updateFields.join(', ')}
        WHERE ID = @id
      `);
            // T_PLAN_DETAIL (明細) の更新
            for (const detail of updateData.details) {
                await transaction.request()
                    .input('detailId', mssql_1.default.Int, detail.ID)
                    .input('rowNo', mssql_1.default.Int, detail.ROW_NO)
                    .input('readQty', mssql_1.default.Int, detail.READ_QTY)
                    .query(`
            UPDATE T_PLAN_DETAIL
            SET READ_QTY = @readQty
            WHERE ID = @detailId AND ROW_NO = @rowNo
          `);
            }
            await transaction.commit();
            return await getPlanById(id);
        }
        catch (error) {
            await transaction.rollback();
            console.error('Transaction rolled back due to error in updatePlan:', error);
            throw error;
        }
    }
    catch (error) {
        console.error('Error in updatePlan (outer catch):', error);
        throw error;
    }
}
// getPlanById関数が定義されていないので追加 (ITPlanを返す)
async function getPlanById(id) {
    try {
        const pool = await (0, db_1.getDbPool)();
        const result = await pool.request()
            .input('id', mssql_1.default.Int, id)
            .query(`
        SELECT
          P.ID,
          P.NOHIN_DATE,
          P.HINBAN,
          P.QTY,
          P.PLAN_STATUS,
          P.START_DTM,
          P.END_DTM,
          P.CSV_FILE,
          P.CREATE_DTM,
          P.CREATE_TANTO_CODE,
          C.TANTO_NAME AS CREATE_TANTO_NAME,
          P.UPDATE_DTM,
          P.UPDATE_TANTO_CODE,
          U.TANTO_NAME AS UPDATE_TANTO_NAME,
          P.START_TANTO_CODE,
          S.TANTO_NAME AS START_TANTO_NAME
        FROM T_PLAN AS P
        LEFT JOIN M_TANTO AS C ON P.CREATE_TANTO_CODE = C.TANTO_CODE
        LEFT JOIN M_TANTO AS U ON P.UPDATE_TANTO_CODE = U.TANTO_CODE
        LEFT JOIN M_TANTO AS S ON P.START_TANTO_CODE = S.TANTO_CODE
        WHERE P.ID = @id
      `);
        return result.recordset.length > 0 ? result.recordset[0] : null;
    }
    catch (error) {
        console.error('Error in getPlanById:', error);
        throw error;
    }
}
