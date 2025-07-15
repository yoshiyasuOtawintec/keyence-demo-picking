export interface ITPlan {
  ID: number;
  NOHIN_DATE: Date;
  HINBAN: string;
  QTY: number;
  PLAN_STATUS: number;
  START_DTM: Date | null;
  END_DTM: Date | null;
  CSV_FILE: string | null;
  CREATE_DTM: Date;
  CREATE_TANTO_CODE: string;
  UPDATE_DTM: Date;
  UPDATE_TANTO_CODE: string;
  START_TANTO_CODE?: string | null;
  CREATE_TANTO_NAME?: string;
  UPDATE_TANTO_NAME?: string;
  START_TANTO_NAME?: string;
}

export interface IPlanUpdateRequest {
  PLAN_STATUS?: number;
  START_DTM?: Date | null;
  END_DTM?: Date | null;
  UPDATE_TANTO_CODE: string;
}