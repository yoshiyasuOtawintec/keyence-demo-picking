// node_api/src/index.ts (既存ファイルを修正)
import app from './app';

const port = process.env.PORT || 8081;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Access M_TANTO API at http://localhost:${port}/api/tantos`); // 既存
  console.log(`Access T_PLAN API at http://localhost:${port}/api/plans`); // ★この行を追加
});