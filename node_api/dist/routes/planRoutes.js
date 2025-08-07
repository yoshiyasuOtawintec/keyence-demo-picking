"use strict";
// node_api/src/routes/planRoutes.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express"); // ★RequestHandlerもインポート
const planController_1 = require("../controllers/planController"); // getPlanDetails をインポートに追加
const router = (0, express_1.Router)();
// updateExistingPlan 関数が正常なRequestハンドラとして認識されるか、明示的に型をキャストしてみる
router.put('/:id', planController_1.updateExistingPlan); // ★元の型キャストとコメントを維持しました
// もしくは、より明示的に関数を定義し直す（これは冗長ですが、原因切り分けのため）
// router.put('/:id', async (req: Request, res: Response) => {
//   await updateExistingPlan(req, res);
// });
router.get('/', planController_1.getPlans);
// ★ /api/plans/:id/details にGETリクエストが来た時にgetPlanDetailsを実行
// 特定の計画IDの明細データを取得するためのルート
router.get('/:id/details', planController_1.getPlanDetails); // ★RequestHandlerとして明示的にキャスト
exports.default = router;
