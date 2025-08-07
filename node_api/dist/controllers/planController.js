"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPlans = getPlans;
exports.getPlanDetails = getPlanDetails;
exports.updateExistingPlan = updateExistingPlan;
// getPlanDetailsByPlanId をインポートに追加
const planService_1 = require("../services/planService"); // ★PlanData をインポートに追加
// import { IPlanUpdateRequest } from '../models/ITPlan'; // IPlanUpdateRequestは使用しないため削除
async function getPlans(req, res) {
    try {
        const searchParams = {
            deliveryDate: req.query.deliveryDate,
            productCode: req.query.productCode
        };
        const plans = await (0, planService_1.getPlanList)(searchParams);
        res.json(plans);
    }
    catch (error) {
        console.error('Error getting plans:', error);
        res.status(500).send('Error fetching plan data');
    }
}
// 特定の計画IDの明細データを取得するコントローラー関数を新規追加
async function getPlanDetails(req, res) {
    try {
        const planId = parseInt(req.params.id, 10); // URLパラメータから計画IDを取得し、数値に変換
        if (isNaN(planId)) {
            return res.status(400).send('無効な計画IDです。');
        }
        const details = await (0, planService_1.getPlanDetailsByPlanId)(planId);
        if (details.length > 0) {
            res.json(details);
        }
        else {
            // 明細データが見つからない場合も404を返す
            res.status(404).send('指定された計画IDの明細データが見つかりません。');
        }
    }
    catch (error) {
        console.error(`Error in getPlanDetails controller for Plan ID ${req.params.id}:`, error);
        res.status(500).send('計画明細データの取得中にエラーが発生しました。');
    }
}
async function updateExistingPlan(req, res) {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            return res.status(400).send('Invalid Plan ID');
        }
        // ★修正: リクエストボディ全体を PlanData 型として受け取る
        const updateData = req.body; // 明示的に型アサーションを行う
        // UPDATE_TANTO_CODE のチェックは引き続き重要です。
        // PlanData には UPDATE_TANTO_CODE が必須フィールドとして含まれていますが、
        // リクエストボディにそれが含まれているかは別問題です。
        if (!updateData.UPDATE_TANTO_CODE) {
            return res.status(400).send('UPDATE_TANTO_CODE is required for plan update.');
        }
        // updatePlan 関数に req.body (PlanData) を直接渡す
        const updatedPlan = await (0, planService_1.updatePlan)(id, updateData);
        if (updatedPlan) {
            res.json(updatedPlan);
        }
        else {
            res.status(404).send('Plan not found for update');
        }
    }
    catch (error) {
        console.error('Error updating plan:', error);
        res.status(500).send('Error updating plan');
    }
}
