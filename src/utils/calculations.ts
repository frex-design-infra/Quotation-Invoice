import type { BridgeData, BridgeLengthTier, MasterSettings, OrdererCategory, QuotationItem } from '../types';

function genId() {
  return Math.random().toString(36).slice(2, 9);
}

/** 橋長から該当する区分を返す */
export function getTierForBridge(length: number, tiers: BridgeLengthTier[]): BridgeLengthTier | undefined {
  return tiers.find(t => length >= t.minLength && length < (t.maxLength ?? 999999));
}

/** bridges と settings から見積明細行を自動生成 */
export function calculateItems(
  bridges: BridgeData[],
  settings: MasterSettings,
  workingDays: number,          // 現場稼働日数 (燃料計算用)
  ordererCategory: OrdererCategory,
): QuotationItem[] {
  const items: QuotationItem[] = [];
  const tiers = settings.bridgeLengthTiers[ordererCategory];

  const totalBridges = bridges.length;

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

  // 2. 橋梁点検補助 N=XX
  if (totalBridges > 0) {
    const assistDays = Math.ceil(totalBridges * settings.inspectionAssistDaysPerBridge);
    items.push({
      id: genId(),
      label: `橋梁点検補助 N=${totalBridges}`,
      quantity: assistDays,
      unit: '人工',
      unitPrice: settings.laborUnitPrice,
      amount: assistDays * settings.laborUnitPrice,
      isAutoCalculated: true,
    });
  }

  // 3. 橋梁点検調書作成（橋長区分ごと）
  // 通常の橋長区分集計（specialTypeなし）
  const normalBridges = bridges.filter(b => !b.specialType);
  const tierCounts = new Map<string, number>();
  for (const b of normalBridges) {
    const tier = getTierForBridge(b.length, tiers);
    if (tier) {
      tierCounts.set(tier.id, (tierCounts.get(tier.id) ?? 0) + 1);
    }
  }

  // 区分順に出力
  for (const tier of tiers) {
    const count = tierCounts.get(tier.id) ?? 0;
    if (count > 0) {
      items.push({
        id: genId(),
        label: `橋梁点検調書作成(${tier.label})`,
        quantity: count,
        unit: '橋',
        unitPrice: tier.unitPrice,
        amount: count * tier.unitPrice,
        isAutoCalculated: true,
      });
    }
  }

  // 4. 特殊調書タイプ（specialType で分類された橋）
  const specialBridges = bridges.filter(b => b.specialType);
  const specialCounts = new Map<string, number>();
  for (const b of specialBridges) {
    if (b.specialType) {
      specialCounts.set(b.specialType, (specialCounts.get(b.specialType) ?? 0) + 1);
    }
  }

  for (const sType of settings.specialReportTypes) {
    const count = specialCounts.get(sType.id) ?? 0;
    if (count > 0) {
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

  // 5. 高所作業車燃料
  if (settings.fuelEnabled && workingDays > 0) {
    const liters = settings.fuelHoursPerDay * settings.fuelLitersPerHour * workingDays;
    const label = `高所作業車燃料 ${settings.fuelHoursPerDay}h/1日稼働時間×${settings.fuelLitersPerHour}L/h×日`;
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

  return items;
}

/** 小計・諸経費・値引き・消費税・合計を計算 */
export function calculateTotals(
  items: QuotationItem[],
  settings: MasterSettings,
): { subtotalBeforeMisc: number; miscExpenses: number; discount: number; subtotal: number; tax: number; total: number } {
  const subtotalBeforeMisc = items.reduce((s, i) => s + i.amount, 0);
  const miscExpenses = Math.round(subtotalBeforeMisc * (settings.miscExpensesRate / 100));
  // 諸経費込み合計の百円未満端数を自動値引き
  const sumWithMisc = subtotalBeforeMisc + miscExpenses;
  const discount = sumWithMisc % 100;
  const subtotal = sumWithMisc - discount;
  const tax = Math.round(subtotal * (settings.taxRate / 100));
  const total = subtotal + tax;
  return { subtotalBeforeMisc, miscExpenses, discount, subtotal, tax, total };
}

/** 金額を日本語表記でフォーマット */
export function formatCurrency(amount: number): string {
  return amount.toLocaleString('ja-JP');
}
