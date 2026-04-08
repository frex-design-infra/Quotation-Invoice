import type { BridgeData, BridgeLengthTier, MasterSettings, OrdererCategory, QuotationItem } from '../types';

export interface WorkParams {
  surveyDays: number;
  walkingDays: number;       // 橋梁点検（徒歩・梯子）
  btDays: number;            // 橋梁点検（橋梁点検車 BT-200）
  ewpDays: number;           // 橋梁点検（高所作業車 12m）
  summaryDays: number;
  kokusokenEnabled: boolean;
  mextEnabled: boolean;
  btVehicleEnabled: boolean;
  btVehicleUnitPrice: number;
  ewpVehicleEnabled: boolean;
  ewpVehicleUnitPrice: number;
  trafficGuardEnabled: boolean;
  trafficGuardUnitPrice: number;
  barrierEnabled: boolean;
  barrierUnitPrice: number;
}

function genId() {
  return Math.random().toString(36).slice(2, 9);
}

function separator(): QuotationItem {
  return {
    id: genId(),
    label: '',
    quantity: 0,
    unit: '',
    unitPrice: 0,
    amount: 0,
    isAutoCalculated: true,
    isSeparator: true,
  };
}

/** 橋長から該当する区分を返す */
export function getTierForBridge(length: number, tiers: BridgeLengthTier[]): BridgeLengthTier | undefined {
  return tiers.find(t => length >= t.minLength && length < (t.maxLength ?? 999999));
}

/** bridges と settings から見積明細行を自動生成 */
export function calculateItems(
  bridges: BridgeData[],
  settings: MasterSettings,
  params: WorkParams,
  ordererCategory: OrdererCategory,
): QuotationItem[] {
  const { surveyDays, walkingDays, btDays, ewpDays, summaryDays, kokusokenEnabled, mextEnabled,
          btVehicleEnabled, btVehicleUnitPrice, ewpVehicleEnabled, ewpVehicleUnitPrice,
          trafficGuardEnabled, trafficGuardUnitPrice, barrierEnabled, barrierUnitPrice } = params;
  const items: QuotationItem[] = [];
  const tiers = settings.bridgeLengthTiers[ordererCategory];
  const totalBridges = bridges.length;

  // ── 外業グループ ────────────────────────────────
  // 1. 準備計画
  const setupDays = settings.setupPlanningDays;
  items.push({
    id: genId(),
    label: '準備計画',
    quantity: setupDays,
    unit: '人工',
    unitPrice: settings.laborUnitPrice,
    amount: setupDays * settings.laborUnitPrice,
    isAutoCalculated: true,
  });

  // 2. 現地踏査（日数 × 2人工）
  if (surveyDays > 0) {
    const qty = surveyDays * 2;
    items.push({
      id: genId(),
      label: '現地踏査',
      quantity: qty,
      unit: '人工',
      unitPrice: settings.laborUnitPrice,
      amount: qty * settings.laborUnitPrice,
      isAutoCalculated: true,
    });
  }

  // 3. 現地踏査まとめ（日数 = 1人工）
  if (summaryDays > 0) {
    items.push({
      id: genId(),
      label: '現地踏査まとめ',
      quantity: summaryDays,
      unit: '人工',
      unitPrice: settings.laborUnitPrice,
      amount: summaryDays * settings.laborUnitPrice,
      isAutoCalculated: true,
    });
  }

  // 空行
  items.push(separator());

  // ── 点検グループ ────────────────────────────────
  // 4a. 橋梁点検（徒歩・梯子）
  if (walkingDays > 0) {
    const qty = walkingDays * 2;
    items.push({
      id: genId(),
      label: '橋梁点検 (徒歩・梯子)',
      quantity: qty,
      unit: '人工',
      unitPrice: settings.laborUnitPrice,
      amount: qty * settings.laborUnitPrice,
      isAutoCalculated: true,
    });
  }

  // 4b. 橋梁点検（橋梁点検車 BT-200）
  if (btDays > 0) {
    const qty = btDays * 2;
    items.push({
      id: genId(),
      label: '橋梁点検 (橋梁点検車 BT-200)',
      quantity: qty,
      unit: '人工',
      unitPrice: settings.laborUnitPrice,
      amount: qty * settings.laborUnitPrice,
      isAutoCalculated: true,
    });
  }

  // 4c. 橋梁点検（高所作業車 12m）
  if (ewpDays > 0) {
    const qty = ewpDays * 2;
    items.push({
      id: genId(),
      label: '橋梁点検 (高所作業車 12m)',
      quantity: qty,
      unit: '人工',
      unitPrice: settings.laborUnitPrice,
      amount: qty * settings.laborUnitPrice,
      isAutoCalculated: true,
    });
  }

  // 空行
  items.push(separator());

  // ── 調書作成グループ ──────────────────────────────
  // 5. 橋梁点検調書作成（橋長区分ごと）
  const normalBridges = bridges.filter(b => !b.specialType);
  const tierCounts = new Map<string, number>();
  for (const b of normalBridges) {
    const tier = getTierForBridge(b.length, tiers);
    if (tier) {
      tierCounts.set(tier.id, (tierCounts.get(tier.id) ?? 0) + 1);
    }
  }

  for (const tier of tiers) {
    const count = tierCounts.get(tier.id) ?? 0;
    if (count > 0) {
      const unitPrice = Math.round(tier.reportLaborDays * settings.laborUnitPrice);
      items.push({
        id: genId(),
        label: `橋梁点検調書作成(${tier.label})`,
        quantity: count,
        unit: '橋',
        unitPrice,
        amount: count * unitPrice,
        isAutoCalculated: true,
      });
    }
  }

  // 特殊調書タイプ
  const specialBridges = bridges.filter(b => b.specialType);
  const specialCounts = new Map<string, number>();
  for (const b of specialBridges) {
    if (b.specialType) {
      specialCounts.set(b.specialType, (specialCounts.get(b.specialType) ?? 0) + 1);
    }
  }

  for (const sType of settings.specialReportTypes) {
    const count = specialCounts.get(sType.id) ?? 0;
    // 国の場合: 有効な特殊タイプを数量0で常に表示（ユーザーが手入力）
    // 他の場合: CSV由来でcountが1以上のときのみ表示
    if (ordererCategory === '国' ? sType.enabled : count > 0) {
      items.push({
        id: genId(),
        label: `橋梁点検調書作成 ${sType.label}`,
        quantity: count,
        unit: '橋',
        unitPrice: sType.unitPrice,
        amount: count * sType.unitPrice,
        isAutoCalculated: true,
      });
    }
  }

  // 空行
  items.push(separator());

  // ── 様式グループ ──────────────────────────────────
  // 6. 国総研様式作成（橋数 × 人工単価 × 1.8）
  if (kokusokenEnabled && totalBridges > 0) {
    const unitPrice = Math.round(settings.laborUnitPrice * 1.8);
    items.push({
      id: genId(),
      label: '国総研様式作成(新様式含む)',
      quantity: totalBridges,
      unit: '橋',
      unitPrice,
      amount: totalBridges * unitPrice,
      isAutoCalculated: true,
    });
  }

  // 7. 国交省様式作成（橋数 × 人工単価 × 0.8）
  if (mextEnabled && totalBridges > 0) {
    const unitPrice = Math.round(settings.laborUnitPrice * 0.8);
    items.push({
      id: genId(),
      label: '国交省様式作成',
      quantity: totalBridges,
      unit: '橋',
      unitPrice,
      amount: totalBridges * unitPrice,
      isAutoCalculated: true,
    });
  }

  // 空行（様式グループと燃料グループの間）
  items.push(separator());

  // ── 燃料グループ ──────────────────────────────────
  // 8a. 橋梁点検車(BT-200) 本体
  if (btVehicleEnabled && btDays > 0) {
    items.push({
      id: genId(),
      label: '橋梁点検車(BT-200)',
      quantity: 1,
      unit: '式',
      unitPrice: btVehicleUnitPrice,
      amount: btVehicleUnitPrice,
      isAutoCalculated: true,
    });
  }

  // 8a-1. 橋梁点検車 運転手（橋梁点検車(BT-200)の直下）
  if (btDays > 0) {
    items.push({
      id: genId(),
      label: '橋梁点検車 運転手(1名/日) 運搬含む',
      quantity: btDays,
      unit: '人工',
      unitPrice: 31000,
      amount: btDays * 31000,
      isAutoCalculated: true,
    });
  }

  // 8a-2. 高所作業車(12m) 本体
  if (ewpVehicleEnabled && ewpDays > 0) {
    items.push({
      id: genId(),
      label: '高所作業車(12m)',
      quantity: 1,
      unit: '式',
      unitPrice: ewpVehicleUnitPrice,
      amount: ewpVehicleUnitPrice,
      isAutoCalculated: true,
    });
  }

  // 8b. 橋梁点検車(BT-200)燃料
  if (settings.btFuelEnabled && btDays > 0) {
    const liters = settings.btFuelHoursPerDay * settings.btFuelLitersPerHour * btDays;
    const label = `橋梁点検車(BT-200)燃料 ${settings.btFuelHoursPerDay}h/1日稼働時間×${settings.btFuelLitersPerHour}L/h×日`;
    items.push({
      id: genId(),
      label,
      quantity: liters,
      unit: 'L',
      unitPrice: settings.btFuelUnitPrice,
      amount: liters * settings.btFuelUnitPrice,
      isAutoCalculated: true,
    });
  }

  // 9. 橋梁点検(高所作業車 12m)燃料
  if (settings.fuelEnabled && ewpDays > 0) {
    const liters = settings.fuelHoursPerDay * settings.fuelLitersPerHour * ewpDays;
    const label = `橋梁点検(高所作業車 12m)燃料 ${settings.fuelHoursPerDay}h/1日稼働時間×${settings.fuelLitersPerHour}L/h×日`;
    items.push({
      id: genId(),
      label,
      quantity: liters,
      unit: 'L',
      unitPrice: settings.fuelUnitPrice,
      amount: liters * settings.fuelUnitPrice,
      isAutoCalculated: true,
    });
  }

  // 10. 交通誘導員
  if (trafficGuardEnabled) {
    items.push({
      id: genId(),
      label: '交通誘導員',
      quantity: 1,
      unit: '式',
      unitPrice: trafficGuardUnitPrice,
      amount: trafficGuardUnitPrice,
      isAutoCalculated: true,
    });
  }

  // 11. 規制材(車両等含む)
  if (barrierEnabled) {
    items.push({
      id: genId(),
      label: '規制材(車両等含む)',
      quantity: 1,
      unit: '式',
      unitPrice: barrierUnitPrice,
      amount: barrierUnitPrice,
      isAutoCalculated: true,
    });
  }

  return items;
}

/** 小計・諸経費・値引き・消費税・合計を計算 */
export function calculateTotals(
  items: QuotationItem[],
  settings: MasterSettings,
): { subtotalBeforeMisc: number; miscExpenses: number; discount: number; subtotal: number; tax: number; total: number } {
  const subtotalBeforeMisc = items.reduce((s, i) => s + i.amount, 0);
  const miscExpenses = Math.round(subtotalBeforeMisc * (settings.miscExpensesRate / 100));
  // 諸経費込み合計の千円未満（100円の位まで）を自動値引き
  const sumWithMisc = subtotalBeforeMisc + miscExpenses;
  const discount = sumWithMisc % 1000;
  const subtotal = sumWithMisc - discount;
  const tax = Math.round(subtotal * (settings.taxRate / 100));
  const total = subtotal + tax;
  return { subtotalBeforeMisc, miscExpenses, discount, subtotal, tax, total };
}

/** 金額を日本語表記でフォーマット */
export function formatCurrency(amount: number): string {
  return amount.toLocaleString('ja-JP');
}
