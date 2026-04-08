import { useState, useCallback } from 'react';
import type { MasterSettings, Quotation, OrdererCategory } from '../types';

export const DEFAULT_MASTER_SETTINGS: MasterSettings = {
  laborUnitPrice: 34000,
  setupPlanningDays: 5,

  bridgeLengthTiers: {
    '国': [
      { id: 'k1', label: '15m未満', minLength: 0, maxLength: 15, reportLaborDays: 2.5 },
      { id: 'k2', label: '15m以上100m未満', minLength: 15, maxLength: 100, reportLaborDays: 4.5 },
      { id: 'k3', label: '100m以上200m未満', minLength: 100, maxLength: 200, reportLaborDays: 7.5 },
      { id: 'k4', label: '200m以上300m未満', minLength: 200, maxLength: 300, reportLaborDays: 8.5 },
      { id: 'k5', label: '300m以上', minLength: 300, maxLength: 999999, reportLaborDays: 10.5 },
    ],
    '県': [
      { id: 'p1', label: '15m未満', minLength: 0, maxLength: 15, reportLaborDays: 2.5 },
      { id: 'p2', label: '15m以上100m未満', minLength: 15, maxLength: 100, reportLaborDays: 4.5 },
      { id: 'p3', label: '100m以上200m未満', minLength: 100, maxLength: 200, reportLaborDays: 7.5 },
      { id: 'p4', label: '200m以上300m未満', minLength: 200, maxLength: 300, reportLaborDays: 8.5 },
      { id: 'p5', label: '300m以上', minLength: 300, maxLength: 999999, reportLaborDays: 10.5 },
    ],
    '市町村': [
      { id: 'm1', label: '15m未満', minLength: 0, maxLength: 15, reportLaborDays: 2.5 },
      { id: 'm2', label: '15m以上100m未満', minLength: 15, maxLength: 100, reportLaborDays: 4.5 },
      { id: 'm3', label: '100m以上200m未満', minLength: 100, maxLength: 200, reportLaborDays: 7.5 },
      { id: 'm4', label: '200m以上300m未満', minLength: 200, maxLength: 300, reportLaborDays: 8.5 },
      { id: 'm5', label: '300m以上', minLength: 300, maxLength: 999999, reportLaborDays: 10.5 },
    ],
  },

  specialReportTypes: [
    { id: 's1', label: '橋面のみ', unitPrice: 68000, enabled: false },
    { id: 's2', label: '第三者被害予防措置 定期点検なし', unitPrice: 68000, enabled: false },
    { id: 's3', label: '第三者被害予防措置 定期点検あり', unitPrice: 51000, enabled: false },
  ],

  fuelHoursPerDay: 5,
  fuelLitersPerHour: 5,
  fuelUnitPrice: 155,
  fuelEnabled: true,

  miscExpensesRate: 15,
  taxRate: 10,

  companyName: '株式会社フレックスデザイン',
  companyNameEn: 'FRe:x Design inc.',
  postalCode: '0100904',
  address: '秋田県秋田保戸野原の町7-68\nアトレデルタ4F',
  tel: '050-3091-9584',
  email: 'info@frex-design.co.jp',
  registrationNumber: 'T3410001013320',
};

const STORAGE_KEY_SETTINGS = 'quotation_master_settings';
const STORAGE_KEY_QUOTATIONS = 'quotation_list';

function loadSettings(): MasterSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (!raw) return structuredClone(DEFAULT_MASTER_SETTINGS);
    const parsed = JSON.parse(raw);

    // Migration: old array-format bridgeLengthTiers → delete and use default
    if (Array.isArray(parsed.bridgeLengthTiers)) {
      delete parsed.bridgeLengthTiers;
    }

    // Migration: per-category tiers with unitPrice instead of reportLaborDays
    if (parsed.bridgeLengthTiers && typeof parsed.bridgeLengthTiers === 'object') {
      const cats: OrdererCategory[] = ['国', '県', '市町村'];
      for (const cat of cats) {
        const tiers = parsed.bridgeLengthTiers[cat];
        if (Array.isArray(tiers)) {
          parsed.bridgeLengthTiers[cat] = tiers.map((t: Record<string, unknown>) => {
            if (typeof t.reportLaborDays === 'undefined' && typeof t.unitPrice === 'number') {
              const laborUnitPrice = parsed.laborUnitPrice ?? DEFAULT_MASTER_SETTINGS.laborUnitPrice;
              return { ...t, reportLaborDays: laborUnitPrice > 0 ? Math.round((t.unitPrice as number) / laborUnitPrice * 10) / 10 : 0 };
            }
            return t;
          });
        }
      }
    }

    const merged = { ...structuredClone(DEFAULT_MASTER_SETTINGS), ...parsed };
    // Remove legacy fields
    delete (merged as Record<string, unknown>).discountAmount;
    delete (merged as Record<string, unknown>).inspectionAssistDaysPerBridge;
    return merged;
  } catch {
    return structuredClone(DEFAULT_MASTER_SETTINGS);
  }
}

function loadQuotations(): Quotation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_QUOTATIONS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function useStore() {
  const [settings, setSettingsState] = useState<MasterSettings>(loadSettings);
  const [quotations, setQuotationsState] = useState<Quotation[]>(loadQuotations);

  const saveSettings = useCallback((s: MasterSettings) => {
    setSettingsState(s);
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(s));
  }, []);

  const saveQuotation = useCallback((q: Quotation) => {
    setQuotationsState(prev => {
      const exists = prev.findIndex(x => x.id === q.id);
      const next = exists >= 0
        ? prev.map(x => x.id === q.id ? q : x)
        : [q, ...prev];
      localStorage.setItem(STORAGE_KEY_QUOTATIONS, JSON.stringify(next));
      return next;
    });
  }, []);

  const deleteQuotation = useCallback((id: string) => {
    setQuotationsState(prev => {
      const next = prev.filter(x => x.id !== id);
      localStorage.setItem(STORAGE_KEY_QUOTATIONS, JSON.stringify(next));
      return next;
    });
  }, []);

  return { settings, saveSettings, quotations, saveQuotation, deleteQuotation };
}
