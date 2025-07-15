import { Request, Response } from 'express';
// getPlanDetailsByPlanId をインポートに追加
import { getPlanList, getPlanDetailsByPlanId, updatePlan, IPlanSearchParams, PlanData } from '../services/planService'; // ★PlanData をインポートに追加
// import { IPlanUpdateRequest } from '../models/ITPlan'; // IPlanUpdateRequestは使用しないため削除

export async function getPlans(req: Request, res: Response) {
  try {
    const searchParams: IPlanSearchParams = {
      deliveryDate: req.query.deliveryDate as string,
      productCode: req.query.productCode as string
    };

    const plans = await getPlanList(searchParams);
    res.json(plans);
  } catch (error) {
    console.error('Error getting plans:', error);
    res.status(500).send('Error fetching plan data');
  }
}

// 特定の計画IDの明細データを取得するコントローラー関数を新規追加
export async function getPlanDetails(req: Request, res: Response) {
  try {
    const planId = parseInt(req.params.id, 10); // URLパラメータから計画IDを取得し、数値に変換

    if (isNaN(planId)) {
      return res.status(400).send('無効な計画IDです。');
    }

    const details = await getPlanDetailsByPlanId(planId);
    if (details.length > 0) {
      res.json(details);
    } else {
      // 明細データが見つからない場合も404を返す
      res.status(404).send('指定された計画IDの明細データが見つかりません。');
    }
  } catch (error) {
    console.error(`Error in getPlanDetails controller for Plan ID ${req.params.id}:`, error);
    res.status(500).send('計画明細データの取得中にエラーが発生しました。');
  }
}

export async function updateExistingPlan(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).send('Invalid Plan ID');
    }
    // ★修正: リクエストボディ全体を PlanData 型として受け取る
    const updateData: PlanData = req.body as PlanData; // 明示的に型アサーションを行う

    // UPDATE_TANTO_CODE のチェックは引き続き重要です。
    // PlanData には UPDATE_TANTO_CODE が必須フィールドとして含まれていますが、
    // リクエストボディにそれが含まれているかは別問題です。
    if (!updateData.UPDATE_TANTO_CODE) {
      return res.status(400).send('UPDATE_TANTO_CODE is required for plan update.');
    }

    // updatePlan 関数に req.body (PlanData) を直接渡す
    const updatedPlan = await updatePlan(id, updateData);
    if (updatedPlan) {
      res.json(updatedPlan);
    } else {
      res.status(404).send('Plan not found for update');
    }
  } catch (error) {
    console.error('Error updating plan:', error);
    res.status(500).send('Error updating plan');
  }
}