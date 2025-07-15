import type { Staff, PlanData } from '@/types'; // 型定義は @/types からインポートされることを想定

// モックデータ - 実際の運用時はAPIから取得
export const mockStaff: Staff[] = [
  { TANTO_CODE: '1', TANTO_NAME: '田中太郎' },
  { TANTO_CODE: '2', TANTO_NAME: '佐藤花子' },
  { TANTO_CODE: '3', TANTO_NAME: '鈴木一郎' },
  { TANTO_CODE: '4', TANTO_NAME: '高橋美咲' },
];

export const mockPlanData: PlanData[] = [
  {
    ID: 1,
    HINBAN: 'P2024-001',
    NOHIN_DATE: '2024-07-04', // 今日の日付に変更
    QTY: 150, // 受注数量
    UPDATE_TANTO_CODE: '1',
    UPDATE_TANTO_NAME: '田中太郎',
    PLAN_STATUS: 0, // 未着手
    details: [
      {
        ID: 101,
        ROW_NO: 1,
        HINBAN: 'METAL-BOLT-M6', // 品番をより具体的なものに変更
        ITEM_NAME: 'ボルト M6×20',
        DETAIL_QTY: 50, // 指示数量
        READ_QTY: 0,
        ITEM_TITLE: '金属部品',
        COMMENT: '在庫確認要',
        ALERT_MSG: '取り扱い注意',
        REMARK: undefined,
        isCompleted: false,
        READ_DATA: '490100000001', // バーコードデータ
      },
      {
        ID: 102,
        ROW_NO: 2,
        HINBAN: 'METAL-NUT-M6', // 品番をより具体的なものに変更
        ITEM_NAME: 'ナット M6',
        DETAIL_QTY: 50,
        READ_QTY: 0,
        ITEM_TITLE: '金属部品',
        COMMENT: undefined,
        ALERT_MSG: undefined,
        REMARK: '品質チェック済み',
        isCompleted: false,
        READ_DATA: '490100000002',
      },
      {
        ID: 103,
        ROW_NO: 3,
        HINBAN: 'DOC-MANUAL-01', // 品番をより具体的なものに変更
        ITEM_NAME: '操作手順書',
        DETAIL_QTY: 1, // 説明書は数量1
        READ_QTY: 0,
        ITEM_TITLE: '説明書',
        COMMENT: '製品に同梱',
        ALERT_MSG: undefined,
        REMARK: undefined,
        isCompleted: false,
        READ_DATA: '490100000003',
      },
      {
        ID: 104,
        ROW_NO: 4,
        HINBAN: 'LABEL-P2024-001', // 品番をより具体的なものに変更
        ITEM_NAME: 'シールラベル',
        DETAIL_QTY: 150, // QTY: 150 と同数
        READ_QTY: 0,
        ITEM_TITLE: 'ラベル',
        COMMENT: undefined,
        ALERT_MSG: undefined,
        REMARK: '最終梱包時に貼付',
        isCompleted: false,
        READ_DATA: '490100000004',
      },
    ],
    CREATE_DTM: '2024-07-04T08:00:00',
    UPDATE_DTM: '2024-07-04T08:00:00',
  },
  {
    ID: 2,
    HINBAN: 'P2024-002',
    NOHIN_DATE: '2024-07-04',
    QTY: 100,
    UPDATE_TANTO_CODE: '2',
    UPDATE_TANTO_NAME: '佐藤花子',
    PLAN_STATUS: 1, // 作業中
    details: [
      {
        ID: 201,
        ROW_NO: 1,
        HINBAN: 'METAL-WASHER-06',
        ITEM_NAME: 'ワッシャー φ6',
        DETAIL_QTY: 100,
        READ_QTY: 30, // 一部完了
        ITEM_TITLE: '金属部品',
        COMMENT: undefined,
        ALERT_MSG: undefined,
        REMARK: undefined,
        isCompleted: false,
        READ_DATA: '490100000005',
      },
      {
        ID: 202,
        ROW_NO: 2,
        HINBAN: 'DOC-GUIDE-02',
        ITEM_NAME: 'クイックスタートガイド',
        DETAIL_QTY: 1,
        READ_QTY: 0,
        ITEM_TITLE: '説明書',
        COMMENT: undefined,
        ALERT_MSG: undefined,
        REMARK: undefined,
        isCompleted: false,
        READ_DATA: '490100000006',
      },
      {
        ID: 203,
        ROW_NO: 3,
        HINBAN: 'LABEL-P2024-002',
        ITEM_NAME: '製品ロゴシール',
        DETAIL_QTY: 100, // QTY: 100 と同数
        READ_QTY: 0,
        ITEM_TITLE: 'ラベル',
        COMMENT: '防水仕様',
        ALERT_MSG: undefined,
        REMARK: undefined,
        isCompleted: false,
        READ_DATA: '490100000007',
      },
    ],
    CREATE_DTM: '2024-07-04T09:00:00',
    UPDATE_DTM: '2024-07-04T10:30:00',
  },
  {
    ID: 3,
    HINBAN: 'P2024-003',
    NOHIN_DATE: '2024-07-05',
    QTY: 25,
    UPDATE_TANTO_CODE: '3',
    UPDATE_TANTO_NAME: '鈴木一郎',
    PLAN_STATUS: 0, // 未着手
    details: [
      {
        ID: 301,
        ROW_NO: 1,
        HINBAN: 'SPRING-COMP-01',
        ITEM_NAME: '圧縮スプリング φ10×50',
        DETAIL_QTY: 25,
        READ_QTY: 0,
        ITEM_TITLE: 'バネ部品',
        COMMENT: undefined,
        ALERT_MSG: '圧縮注意',
        REMARK: undefined,
        isCompleted: false,
        READ_DATA: '490100000008',
      },
      {
        ID: 302,
        ROW_NO: 2,
        HINBAN: 'DOC-SAFETY-03',
        ITEM_NAME: '安全上の注意書き',
        DETAIL_QTY: 1,
        READ_QTY: 0,
        ITEM_TITLE: '説明書',
        COMMENT: '重要',
        ALERT_MSG: '必ず同梱！',
        REMARK: undefined,
        isCompleted: false,
        READ_DATA: '490100000009',
      },
      {
        ID: 303,
        ROW_NO: 3,
        HINBAN: 'LABEL-WARNING-03',
        ITEM_NAME: '警告ラベル',
        DETAIL_QTY: 25, // QTY: 25 と同数
        READ_QTY: 0,
        ITEM_TITLE: 'ラベル',
        COMMENT: undefined,
        ALERT_MSG: undefined,
        REMARK: '赤色',
        isCompleted: false,
        READ_DATA: '490100000010',
      },
    ],
    CREATE_DTM: '2024-07-05T07:30:00',
    UPDATE_DTM: '2024-07-05T07:30:00',
  },
];