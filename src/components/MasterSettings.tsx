import React, { useState } from 'react';
import type { MasterSettings, BridgeLengthTier, OrdererCategory, SpecialReportType, Client, BankAccount } from '../types';
import { DEFAULT_MASTER_SETTINGS } from '../stores/useStore';

const CATEGORIES: OrdererCategory[] = ['国', '県', '市町村'];

interface Props {
  settings: MasterSettings;
  onSave: (s: MasterSettings) => void;
}

export default function MasterSettingsPanel({ settings, onSave }: Props) {
  const [form, setForm] = useState<MasterSettings>(() => structuredClone(settings));
  const [saved, setSaved] = useState(false);
  const [tierTab, setTierTab] = useState<OrdererCategory>('国');

  function handleSave() {
    onSave(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleReset() {
    if (confirm('マスタ設定を初期値にリセットしますか？')) {
      setForm(structuredClone(DEFAULT_MASTER_SETTINGS));
    }
  }

  function updateTier(cat: OrdererCategory, id: string, field: keyof BridgeLengthTier, value: string | number) {
    setForm(prev => ({
      ...prev,
      bridgeLengthTiers: {
        ...prev.bridgeLengthTiers,
        [cat]: prev.bridgeLengthTiers[cat].map(t =>
          t.id === id ? { ...t, [field]: value } : t
        ),
      },
    }));
  }

  function addTier(cat: OrdererCategory) {
    const newTier: BridgeLengthTier = {
      id: `${cat}-${Math.random().toString(36).slice(2, 7)}`,
      label: '新規区分',
      minLength: 0,
      maxLength: 100,
      reportLaborDays: 0,
    };
    setForm(prev => ({
      ...prev,
      bridgeLengthTiers: {
        ...prev.bridgeLengthTiers,
        [cat]: [...prev.bridgeLengthTiers[cat], newTier],
      },
    }));
  }

  function removeTier(cat: OrdererCategory, id: string) {
    setForm(prev => ({
      ...prev,
      bridgeLengthTiers: {
        ...prev.bridgeLengthTiers,
        [cat]: prev.bridgeLengthTiers[cat].filter(t => t.id !== id),
      },
    }));
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
        </section>

        {/* 諸経費・税 */}
        <section className="settings-section">
          <h3>諸経費・税</h3>
          {numInput('諸経費率', form.miscExpensesRate, v => setForm(p => ({ ...p, miscExpensesRate: v })), '%')}
          {numInput('消費税率', form.taxRate, v => setForm(p => ({ ...p, taxRate: v })), '%')}
          <div className="settings-row">
            <label>お取引値引き</label>
            <span style={{ fontSize: '12px', color: '#888' }}>（小計＋諸経費）の百円未満端数を自動計上</span>
          </div>
        </section>

        {/* 橋梁点検車(BT-200)燃料 */}
        <section className="settings-section">
          <h3>橋梁点検車(BT-200)燃料</h3>
          <div className="settings-row">
            <label>燃料計算</label>
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={form.btFuelEnabled}
                onChange={e => setForm(p => ({ ...p, btFuelEnabled: e.target.checked }))}
              />
              <span>有効</span>
            </label>
          </div>
          {numInput('稼働時間/日', form.btFuelHoursPerDay, v => setForm(p => ({ ...p, btFuelHoursPerDay: v })), 'h')}
          {numInput('燃料消費量', form.btFuelLitersPerHour, v => setForm(p => ({ ...p, btFuelLitersPerHour: v })), 'L/h')}
          {numInput('燃料単価', form.btFuelUnitPrice, v => setForm(p => ({ ...p, btFuelUnitPrice: v })), '円/L')}
        </section>

        {/* 高所作業車(12m)燃料 */}
        <section className="settings-section">
          <h3>高所作業車(12m)燃料</h3>
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
          {textInput('代表者名（再委託用）', form.representativeName ?? '', v => setForm(p => ({ ...p, representativeName: v })))}
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
          <div className="settings-row" style={{ alignItems: 'flex-start' }}>
            <label>振込先口座</label>
            <div style={{ flex: 1 }}>
              {(form.bankAccounts ?? []).map((ba, i) => (
                <div key={ba.id} className="client-list-row" style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '4px', alignItems: 'center' }}>
                    <input
                      type="text"
                      value={ba.label}
                      placeholder="表示名（例: 秋田銀行）"
                      style={{ flex: 1, padding: '5px 8px', border: '1px solid #dde2e8', borderRadius: '5px', fontSize: '13px' }}
                      onChange={e => {
                        const next = [...form.bankAccounts] as BankAccount[];
                        next[i] = { ...next[i], label: e.target.value };
                        setForm(p => ({ ...p, bankAccounts: next }));
                      }}
                    />
                    <button
                      className="btn-danger btn-sm"
                      onClick={() => setForm(p => ({ ...p, bankAccounts: p.bankAccounts.filter((_, j) => j !== i) }))}
                    >削除</button>
                  </div>
                  <textarea
                    value={ba.info}
                    placeholder="銀行名・支店・口座番号など"
                    rows={4}
                    style={{ width: '100%', padding: '6px 8px', border: '1px solid #dde2e8', borderRadius: '5px', fontSize: '13px', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }}
                    onChange={e => {
                      const next = [...form.bankAccounts] as BankAccount[];
                      next[i] = { ...next[i], info: e.target.value };
                      setForm(p => ({ ...p, bankAccounts: next }));
                    }}
                  />
                </div>
              ))}
              <button
                className="btn-outline btn-sm"
                onClick={() => setForm(p => ({
                  ...p,
                  bankAccounts: [...(p.bankAccounts ?? []), { id: `bank-${Date.now()}`, label: '', info: '' }],
                }))}
              >＋ 振込先を追加</button>
            </div>
          </div>
          <div className="settings-row" style={{ alignItems: 'flex-start' }}>
            <label>納品担当者リスト</label>
            <div style={{ flex: 1 }}>
              {(form.deliveryPersons ?? []).map((person, i) => (
                <div key={i} className="client-list-row" style={{ marginBottom: '6px' }}>
                  <input
                    type="text"
                    value={person}
                    placeholder="担当者名"
                    onChange={e => {
                      const next = [...(form.deliveryPersons ?? [])];
                      next[i] = e.target.value;
                      setForm(p => ({ ...p, deliveryPersons: next }));
                    }}
                  />
                  <button
                    className="btn-danger btn-sm"
                    onClick={() => setForm(p => ({ ...p, deliveryPersons: (p.deliveryPersons ?? []).filter((_, j) => j !== i) }))}
                  >削除</button>
                </div>
              ))}
              <button
                className="btn-outline btn-sm"
                onClick={() => setForm(p => ({ ...p, deliveryPersons: [...(p.deliveryPersons ?? []), ''] }))}
              >＋ 担当者を追加</button>
            </div>
          </div>

          <div className="settings-row">
            <label>復建 業者コード</label>
            <input
              type="text"
              value={form.fukkenVendorCode ?? ''}
              onChange={e => setForm(p => ({ ...p, fukkenVendorCode: e.target.value }))}
              placeholder="例: G-000029"
              style={{ flex: 1, maxWidth: '200px' }}
            />
          </div>

          {/* 復建 テンプレート画像 */}
          {(['seisho', 'seikyusho', 'nouhinnsho'] as const).map(key => {
            const fieldKey = key === 'seisho'
              ? 'fukkenSeishoTemplateUrl'
              : key === 'seikyusho'
              ? 'fukkenSeikyushoTemplateUrl'
              : 'fukkenNouhinTemplateUrl';
            const label = key === 'seisho' ? '復建 請書テンプレート' : key === 'seikyusho' ? '復建 請求書テンプレート' : '復建 納品書テンプレート';
            const inputId = `fukken-template-${key}`;
            const dataUrl = (form as Record<string, unknown>)[fieldKey] as string | undefined;
            return (
              <div className="settings-row" key={key} style={{ alignItems: 'flex-start' }}>
                <label style={{ paddingTop: '6px' }}>{label}</label>
                <div className="logo-upload-area">
                  {dataUrl && (
                    <img src={dataUrl} alt={label} style={{ maxWidth: '120px', maxHeight: '80px', border: '1px solid #ddd', borderRadius: '4px' }} />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    id={inputId}
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = ev => {
                        setForm(p => ({ ...p, [fieldKey]: ev.target?.result as string }));
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                  <label htmlFor={inputId} className="btn-secondary btn-sm" style={{ cursor: 'pointer', display: 'inline-block' }}>
                    {dataUrl ? '画像を変更' : '画像をアップロード'}
                  </label>
                  {dataUrl && (
                    <button className="btn-danger btn-sm" onClick={() => setForm(p => ({ ...p, [fieldKey]: '' }))}>
                      削除
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          <div className="settings-row">
            <label>会社ロゴ</label>
            <div className="logo-upload-area">
              {form.logoDataUrl && (
                <img src={form.logoDataUrl} alt="ロゴ" className="logo-preview-img" />
              )}
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                id="logo-file-input"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = ev => {
                    setForm(p => ({ ...p, logoDataUrl: ev.target?.result as string }));
                  };
                  reader.readAsDataURL(file);
                }}
              />
              <label htmlFor="logo-file-input" className="btn-secondary btn-sm" style={{ cursor: 'pointer', display: 'inline-block' }}>
                {form.logoDataUrl ? '画像を変更' : '画像をアップロード'}
              </label>
              {form.logoDataUrl && (
                <button className="btn-danger btn-sm" onClick={() => setForm(p => ({ ...p, logoDataUrl: '' }))}>
                  削除
                </button>
              )}
            </div>
          </div>

          <div className="settings-row">
            <label>角印</label>
            <div className="logo-upload-area">
              {form.sealDataUrl && (
                <img src={form.sealDataUrl} alt="角印" className="logo-preview-img" />
              )}
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                id="seal-file-input"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = ev => {
                    setForm(p => ({ ...p, sealDataUrl: ev.target?.result as string }));
                  };
                  reader.readAsDataURL(file);
                }}
              />
              <label htmlFor="seal-file-input" className="btn-secondary btn-sm" style={{ cursor: 'pointer', display: 'inline-block' }}>
                {form.sealDataUrl ? '画像を変更' : '画像をアップロード'}
              </label>
              {form.sealDataUrl && (
                <button className="btn-danger btn-sm" onClick={() => setForm(p => ({ ...p, sealDataUrl: '' }))}>
                  削除
                </button>
              )}
            </div>
          </div>

          <div className="settings-row">
            <label>代表印（再委託用）</label>
            <div className="logo-upload-area">
              {form.repSealDataUrl && (
                <img src={form.repSealDataUrl} alt="代表印" className="logo-preview-img" />
              )}
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                id="rep-seal-file-input"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = ev => {
                    setForm(p => ({ ...p, repSealDataUrl: ev.target?.result as string }));
                  };
                  reader.readAsDataURL(file);
                }}
              />
              <label htmlFor="rep-seal-file-input" className="btn-secondary btn-sm" style={{ cursor: 'pointer', display: 'inline-block' }}>
                {form.repSealDataUrl ? '画像を変更' : '画像をアップロード'}
              </label>
              {form.repSealDataUrl && (
                <button className="btn-danger btn-sm" onClick={() => setForm(p => ({ ...p, repSealDataUrl: '' }))}>
                  削除
                </button>
              )}
            </div>
          </div>
        </section>

        {/* 発注者リスト */}
        <section className="settings-section">
          <h3>発注者リスト</h3>
          <div className="client-list">
            {(form.clients ?? []).map((client, i) => (
              <div key={client.id} className="client-list-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '4px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={client.name}
                    onChange={e => {
                      const next = [...form.clients] as Client[];
                      next[i] = { ...next[i], name: e.target.value };
                      setForm(p => ({ ...p, clients: next }));
                    }}
                    placeholder="発注者名"
                    style={{ flex: 1 }}
                  />
                  <button
                    className="btn-danger btn-sm"
                    onClick={() => setForm(p => ({ ...p, clients: p.clients.filter((_, j) => j !== i) }))}
                  >
                    削除
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    value={client.postalCode}
                    onChange={e => {
                      const next = [...form.clients] as Client[];
                      next[i] = { ...next[i], postalCode: e.target.value };
                      setForm(p => ({ ...p, clients: next }));
                    }}
                    placeholder="郵便番号（例: 010-0904）"
                    style={{ width: '160px' }}
                  />
                  <input
                    type="text"
                    value={client.address}
                    onChange={e => {
                      const next = [...form.clients] as Client[];
                      next[i] = { ...next[i], address: e.target.value };
                      setForm(p => ({ ...p, clients: next }));
                    }}
                    placeholder="住所"
                    style={{ flex: 1 }}
                  />
                </div>
              </div>
            ))}
            <button
              className="btn-secondary btn-sm"
              style={{ marginTop: '6px' }}
              onClick={() => setForm(p => ({
                ...p,
                clients: [...(p.clients ?? []), {
                  id: `c${Date.now()}`,
                  name: '',
                  postalCode: '',
                  address: '',
                }],
              }))}
            >
              ＋ 追加
            </button>
          </div>
        </section>

        {/* 見積書フッターコメント */}
        <section className="settings-section">
          <h3>見積書フッターコメント</h3>
          <p className="section-hint">見積書プレビューの合計の下に表示されます。</p>
          <textarea
            className="footer-comment-textarea"
            value={form.quotationFooterComment}
            onChange={e => setForm(p => ({ ...p, quotationFooterComment: e.target.value }))}
            rows={8}
          />
        </section>
      </div>

      {/* 橋長区分マスタ（カテゴリ別） */}
      <section className="settings-section full-width">
        <h3>橋長区分・単価マスタ</h3>
        <p className="section-hint">発注者区分（国/県/市町村）ごとに単価を設定します。minLength ≤ 橋長 &lt; maxLength で判定します。</p>

        {/* カテゴリタブ */}
        <div className="tier-tabs">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setTierTab(cat)}
              className={`tier-tab-btn ${tierTab === cat ? 'active' : ''} cat-btn-${cat}`}
            >
              {cat}
            </button>
          ))}
          <button onClick={() => addTier(tierTab)} className="btn-secondary btn-sm" style={{ marginLeft: 'auto' }}>
            ＋ 区分追加
          </button>
        </div>

        <table className="tier-table">
          <thead>
            <tr>
              <th>表示ラベル</th>
              <th>最小橋長 (m以上)</th>
              <th>最大橋長 (m未満)</th>
              <th>調書人工数</th>
              <th>単価（自動計算）</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {form.bridgeLengthTiers[tierTab].map(tier => {
              const unitPrice = Math.round(tier.reportLaborDays * form.laborUnitPrice);
              return (
                <tr key={tier.id}>
                  <td>
                    <input
                      type="text"
                      value={tier.label}
                      onChange={e => updateTier(tierTab, tier.id, 'label', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={tier.minLength}
                      onChange={e => updateTier(tierTab, tier.id, 'minLength', parseFloat(e.target.value) || 0)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={tier.maxLength >= 999999 ? '' : tier.maxLength}
                      placeholder="∞（上限なし）"
                      onChange={e => updateTier(tierTab, tier.id, 'maxLength', e.target.value === '' ? 999999 : parseFloat(e.target.value) || 0)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.1"
                      value={tier.reportLaborDays}
                      onChange={e => updateTier(tierTab, tier.id, 'reportLaborDays', parseFloat(e.target.value) || 0)}
                    />
                  </td>
                  <td className="computed-price">
                    ¥ {unitPrice.toLocaleString('ja-JP')}
                  </td>
                  <td>
                    <button onClick={() => removeTier(tierTab, tier.id)} className="btn-danger btn-sm">削除</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="section-hint" style={{ marginTop: '8px' }}>
          単価 = 調書人工数 × 人工単価（¥{form.laborUnitPrice.toLocaleString('ja-JP')}）
        </p>
      </section>

      {/* 特殊調書タイプ */}
      <section className="settings-section full-width">
        <h3>特殊調書タイプ（CSVで指定可能）</h3>
        <p className="section-hint">CSVに「調書タイプ」列を追加することで、各橋梁に特殊な調書タイプを割り当てられます。</p>
        <table className="tier-table">
          <thead>
            <tr>
              <th>有効</th>
              <th>ラベル</th>
              <th>単価 (円/橋)</th>
            </tr>
          </thead>
          <tbody>
            {form.specialReportTypes.map(s => (
              <tr key={s.id}>
                <td style={{ textAlign: 'center', width: '60px' }}>
                  <input
                    type="checkbox"
                    checked={s.enabled}
                    onChange={e => updateSpecial(s.id, 'enabled', e.target.checked)}
                  />
                </td>
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
