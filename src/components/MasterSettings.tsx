import React, { useState } from 'react';
import type { MasterSettings, BridgeLengthTier, SpecialReportType } from '../types';
import { DEFAULT_MASTER_SETTINGS } from '../stores/useStore';

interface Props {
  settings: MasterSettings;
  onSave: (s: MasterSettings) => void;
}

export default function MasterSettingsPanel({ settings, onSave }: Props) {
  const [form, setForm] = useState<MasterSettings>(() => JSON.parse(JSON.stringify(settings)));
  const [saved, setSaved] = useState(false);

  function handleSave() {
    onSave(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleReset() {
    if (confirm('マスタ設定を初期値にリセットしますか？')) {
      setForm(JSON.parse(JSON.stringify(DEFAULT_MASTER_SETTINGS)));
    }
  }

  function updateTier(id: string, field: keyof BridgeLengthTier, value: string | number) {
    setForm(prev => ({
      ...prev,
      bridgeLengthTiers: prev.bridgeLengthTiers.map(t =>
        t.id === id ? { ...t, [field]: value } : t
      ),
    }));
  }

  function addTier() {
    const newTier: BridgeLengthTier = {
      id: Math.random().toString(36).slice(2, 9),
      label: '新規区分',
      minLength: 0,
      maxLength: 100,
      unitPrice: 0,
    };
    setForm(prev => ({ ...prev, bridgeLengthTiers: [...prev.bridgeLengthTiers, newTier] }));
  }

  function removeTier(id: string) {
    setForm(prev => ({ ...prev, bridgeLengthTiers: prev.bridgeLengthTiers.filter(t => t.id !== id) }));
  }

  function updateSpecial(id: string, field: keyof SpecialReportType, value: string | number | boolean) {
    setForm(prev => ({
      ...prev,
      specialReportTypes: prev.specialReportTypes.map(s =>
        s.id === id ? { ...s, [field]: value } : s
      ),
    }));
  }

  const numInput = (label: string, value: number, onChange: (v: number) => void, suffix?: string) => (
    <div className="settings-row">
      <label>{label}</label>
      <div className="input-with-suffix">
        <input
          type="number"
          value={value}
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
        />
        {suffix && <span className="suffix">{suffix}</span>}
      </div>
    </div>
  );

  const textInput = (label: string, value: string, onChange: (v: string) => void) => (
    <div className="settings-row">
      <label>{label}</label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} />
    </div>
  );

  return (
    <div className="master-settings">
      <div className="settings-header">
        <h2>マスタ設定</h2>
        <div className="settings-actions">
          <button onClick={handleReset} className="btn-secondary">初期値リセット</button>
          <button onClick={handleSave} className="btn-primary">
            {saved ? '保存しました ✓' : '保存'}
          </button>
        </div>
      </div>

      <div className="settings-grid">
        {/* 人工単価 */}
        <section className="settings-section">
          <h3>人工・労務単価</h3>
          {numInput('人工単価', form.laborUnitPrice, v => setForm(p => ({ ...p, laborUnitPrice: v })), '円/人工')}
          {numInput('準備計画 人工数', form.setupPlanningDays, v => setForm(p => ({ ...p, setupPlanningDays: v })), '人工')}
          {numInput('点検補助 人工数/橋', form.inspectionAssistDaysPerBridge, v => setForm(p => ({ ...p, inspectionAssistDaysPerBridge: v })), '人工/橋')}
        </section>

        {/* 諸経費・税 */}
        <section className="settings-section">
          <h3>諸経費・税</h3>
          {numInput('諸経費率', form.miscExpensesRate, v => setForm(p => ({ ...p, miscExpensesRate: v })), '%')}
          {numInput('お取引値引き', form.discountAmount, v => setForm(p => ({ ...p, discountAmount: v })), '円')}
          {numInput('消費税率', form.taxRate, v => setForm(p => ({ ...p, taxRate: v })), '%')}
        </section>

        {/* 高所作業車燃料 */}
        <section className="settings-section">
          <h3>高所作業車燃料</h3>
          <div className="settings-row">
            <label>燃料計算</label>
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={form.fuelEnabled}
                onChange={e => setForm(p => ({ ...p, fuelEnabled: e.target.checked }))}
              />
              <span>有効</span>
            </label>
          </div>
          {numInput('稼働時間/日', form.fuelHoursPerDay, v => setForm(p => ({ ...p, fuelHoursPerDay: v })), 'h')}
          {numInput('燃料消費量', form.fuelLitersPerHour, v => setForm(p => ({ ...p, fuelLitersPerHour: v })), 'L/h')}
          {numInput('燃料単価', form.fuelUnitPrice, v => setForm(p => ({ ...p, fuelUnitPrice: v })), '円/L')}
        </section>

        {/* 自社情報 */}
        <section className="settings-section">
          <h3>自社情報</h3>
          {textInput('会社名（日本語）', form.companyName, v => setForm(p => ({ ...p, companyName: v })))}
          {textInput('会社名（英語）', form.companyNameEn, v => setForm(p => ({ ...p, companyNameEn: v })))}
          {textInput('郵便番号', form.postalCode, v => setForm(p => ({ ...p, postalCode: v })))}
          <div className="settings-row">
            <label>住所</label>
            <textarea
              value={form.address}
              onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
              rows={2}
            />
          </div>
          {textInput('TEL', form.tel, v => setForm(p => ({ ...p, tel: v })))}
          {textInput('メール', form.email, v => setForm(p => ({ ...p, email: v })))}
          {textInput('登録番号', form.registrationNumber, v => setForm(p => ({ ...p, registrationNumber: v })))}
        </section>
      </div>

      {/* 橋長区分マスタ */}
      <section className="settings-section full-width">
        <div className="section-header">
          <h3>橋長区分・単価マスタ</h3>
          <button onClick={addTier} className="btn-secondary btn-sm">＋ 区分追加</button>
        </div>
        <p className="section-hint">橋長に応じた調書作成の単価を設定します。minLength ≤ 橋長 &lt; maxLength で判定します。</p>
        <table className="tier-table">
          <thead>
            <tr>
              <th>表示ラベル</th>
              <th>最小橋長 (m以上)</th>
              <th>最大橋長 (m未満)</th>
              <th>単価 (円/橋)</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {form.bridgeLengthTiers.map(tier => (
              <tr key={tier.id}>
                <td>
                  <input
                    type="text"
                    value={tier.label}
                    onChange={e => updateTier(tier.id, 'label', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={tier.minLength}
                    onChange={e => updateTier(tier.id, 'minLength', parseFloat(e.target.value) || 0)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={tier.maxLength === Infinity ? '' : tier.maxLength}
                    placeholder="∞"
                    onChange={e => updateTier(tier.id, 'maxLength', e.target.value === '' ? Infinity : parseFloat(e.target.value) || 0)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={tier.unitPrice}
                    onChange={e => updateTier(tier.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                  />
                </td>
                <td>
                  <button onClick={() => removeTier(tier.id)} className="btn-danger btn-sm">削除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* 特殊調書タイプ */}
      <section className="settings-section full-width">
        <h3>特殊調書タイプ（CSVで指定可能）</h3>
        <p className="section-hint">CSVに「調書タイプ」列を追加することで、各橋梁に特殊な調書タイプを割り当てられます。</p>
        <table className="tier-table">
          <thead>
            <tr>
              <th>ラベル</th>
              <th>単価 (円/橋)</th>
            </tr>
          </thead>
          <tbody>
            {form.specialReportTypes.map(s => (
              <tr key={s.id}>
                <td>
                  <input
                    type="text"
                    value={s.label}
                    onChange={e => updateSpecial(s.id, 'label', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={s.unitPrice}
                    onChange={e => updateSpecial(s.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
