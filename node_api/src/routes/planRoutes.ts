// node_api/src/routes/planRoutes.ts

import { Router, Request, Response, RequestHandler } from 'express'; // ★RequestHandlerもインポート
import { getPlans, getPlanDetails, updateExistingPlan } from '../controllers/planController'; // getPlanDetails をインポートに追加

const router = Router();

// updateExistingPlan 関数が正常なRequestハンドラとして認識されるか、明示的に型をキャストしてみる
router.put('/:id', updateExistingPlan as (req: Request, res: Response) => Promise<void>); // ★元の型キャストとコメントを維持しました

// もしくは、より明示的に関数を定義し直す（これは冗長ですが、原因切り分けのため）
// router.put('/:id', async (req: Request, res: Response) => {
//   await updateExistingPlan(req, res);
// });

router.get('/', getPlans);

// ★ /api/plans/:id/details にGETリクエストが来た時にgetPlanDetailsを実行
// 特定の計画IDの明細データを取得するためのルート
router.get('/:id/details', getPlanDetails as RequestHandler); // ★RequestHandlerとして明示的にキャスト

export default router;
