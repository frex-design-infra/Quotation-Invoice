// 発注者区分
export type OrdererCategory = '国' | '県' | '市町村';

// 点検種別
export type InspectionType = '橋梁点検' | '道路附属物点検';

// 橋長区分マスタ
export interface BridgeLengthTier {
  id: string;
  label: string;            // 例: "15m未満"
  minLength: number;        // 以上
  maxLength: number;        // 未満 (999999 = 上限なし)
  reportLaborDays: number;  // 調書作成 人工数（単価 = 調書人工 × 人工単価）
}

// 特殊調書タイプ
export interface SpecialReportType {
  id: string;
  label: string;         // 例: "橋面のみ", "第三者被害予防措置 定期点検なし"
  unitPrice: number;
  enabled: boolean;
}

// マスタ設定
export interface MasterSettings {
  // 人工単価
  laborUnitPrice: number;

  // 準備計画
  setupPlanningDays: number;         // 人工数

  // 橋長区分マスタ（発注者区分ごと）
  bridgeLengthTiers: Record<OrdererCategory, BridgeLengthTier[]>;

  // 特殊調書タイプ
  specialReportTypes: SpecialReportType[];

  // 高所作業車燃料
  fuelHoursPerDay: number;           // 稼働時間/日
  fuelLitersPerHour: number;         // L/h
  fuelUnitPrice: number;             // 単価（円/L）
  fuelEnabled: boolean;

  // 橋梁点検車（BT-200）燃料
  btFuelHoursPerDay: number;
  btFuelLitersPerHour: number;
  btFuelUnitPrice: number;
  btFuelEnabled: boolean;

  // 見積書フッターコメント
  quotationFooterComment: string;

  // 諸経費率 (%)
  miscExpensesRate: number;

  // 消費税率 (%)
  taxRate: number;

  // 自社情報
  companyName: string;
  companyNameEn: string;
  representativeName: string;   // 代表者名（再委託用）
  postalCode: string;
  address: string;
  tel: string;
  email: string;
  registrationNumber: string;
  logoDataUrl: string;          // base64ロゴ画像
  sealDataUrl: string;          // base64角印画像
  repSealDataUrl: string;       // base64代表印画像（再委託用）
}

// CSV から読み込んだ橋梁データ
export interface BridgeData {
  name: string;          // 橋梁名
  length: number;        // 橋長 (m)
  specialType?: string;  // 特殊調書タイプID (省略可)
}

// 見積書の明細行
export interface QuotationItem {
  id: string;
  label: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  amount: number;
  isAutoCalculated: boolean;  // CSV/マスタから自動計算された行
  isSeparator?: boolean;      // 空行（セクション区切り）
  note?: string;
}

// 見積書
export interface Quotation {
  id: string;
  quotationNumber: string;
  date: string;                    // YYYY-MM-DD
  inspectionType: InspectionType;
  roadAccessoryCount: number;      // 基数（道路附属物点検のみ）
  roadAccessoryDays: number;       // 点検日数（道路附属物点検のみ）
  ordererCategory: OrdererCategory;
  clientName: string;
  projectName: string;
  surveyDays: number;          // 現地踏査日数
  walkingDays: number;         // 橋梁点検（徒歩・梯子）日数
  btDays: number;              // 橋梁点検（橋梁点検車 BT-200）日数
  ewpDays: number;             // 橋梁点検（高所作業車 12m）日数
  summaryDays: number;         // 現地踏査まとめ日数
  kokusokenEnabled: boolean;   // 国総研様式
  mextEnabled: boolean;        // 国交省様式
  btVehicleEnabled: boolean;        // 橋梁点検車(BT-200)
  btVehicleUnitPrice: number;
  ewpVehicleEnabled: boolean;       // 高所作業車(12m)
  ewpVehicleUnitPrice: number;
  trafficGuardEnabled: boolean;    // 交通誘導員
  trafficGuardUnitPrice: number;
  barrierEnabled: boolean;         // 規制材(車両等含む)
  barrierUnitPrice: number;
  bridges: BridgeData[];
  items: QuotationItem[];
  subtotal: number;
  tax: number;
  total: number;
  submitted: boolean;           // 提出済フラグ
  createdAt: string;
  updatedAt: string;
}
