import { useState, useCallback } from 'react';
import type { MasterSettings, Quotation } from '../types';

export const DEFAULT_MASTER_SETTINGS: MasterSettings = {
  laborUnitPrice: 34000,
  setupPlanningDays: 5,
  inspectionAssistDaysPerBridge: 1.674,  // 72人工 / 43橋 ≈ 1.674

  bridgeLengthTiers: {
    '国': [
      { id: 'kuni-t1', label: '15m未満',          minLength: 0,   maxLength: 15,       unitPrice: 85000 },
      { id: 'kuni-t2', label: '15m以上100m未満',   minLength: 15,  maxLength: 100,      unitPrice: 153000 },
      { id: 'kuni-t3', label: '100m以上200m未満',  minLength: 100, maxLength: 200,      unitPrice: 255000 },
      { id: 'kuni-t4', label: '200m以上300m未満',  minLength: 200, maxLength: 300,      unitPrice: 289000 },
      { id: 'kuni-t5', label: '300m以上',          minLength: 300, maxLength: Infinity, unitPrice: 357000 },
    ],
    '県': [
      { id: 'ken-t1', label: '15m未満',          minLength: 0,   maxLength: 15,       unitPrice: 85000 },
      { id: 'ken-t2', label: '15m以上100m未満',   minLength: 15,  maxLength: 100,      unitPrice: 153000 },
      { id: 'ken-t3', label: '100m以上200m未満',  minLength: 100, maxLength: 200,      unitPrice: 255000 },
      { id: 'ken-t4', label: '200m以上300m未満',  minLength: 200, maxLength: 300,      unitPrice: 289000 },
      { id: 'ken-t5', label: '300m以上',          minLength: 300, maxLength: Infinity, unitPrice: 357000 },
    ],
    '市町村': [
      { id: 'shi-t1', label: '15m未満',          minLength: 0,   maxLength: 15,       unitPrice: 85000 },
      { id: 'shi-t2', label: '15m以上100m未満',   minLength: 15,  maxLength: 100,      unitPrice: 153000 },
      { id: 'shi-t3', label: '100m以上200m未満',  minLength: 100, maxLength: 200,      unitPrice: 255000 },
      { id: 'shi-t4', label: '200m以上300m未満',  minLength: 200, maxLength: 300,      unitPrice: 289000 },
      { id: 'shi-t5', label: '300m以上',          minLength: 300, maxLength: Infinity, unitPrice: 357000 },
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
    if (raw) return { ...DEFAULT_MASTER_SETTINGS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_MASTER_SETTINGS;
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
