import { Router } from 'express';
import { getTanto } from '../controllers/tantoController';

const router = Router();

router.get('/', getTanto); // /api/tantos にGETリクエストが来た時にgetTantoを実行

export default router;