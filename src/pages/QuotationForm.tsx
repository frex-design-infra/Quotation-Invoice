import React, { useState, useRef, useCallback } from 'react';
import type { Quotation, QuotationItem, BridgeData, MasterSettings, OrdererCategory } from '../types';
import { calculateItems, calculateTotals, formatCurrency, type WorkParams } from '../utils/calculations';
import { parseBridgeCSV } from '../utils/csvParser';
import QuotationPreview from '../components/QuotationPreview';

interface Props {
  settings: MasterSettings;
  initial?: Quotation;
  onSave: (q: Quotation) => void;
  onCancel: () => void;
}

function genId() {
  return Math.random().toString(36).slice(2, 9);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function generateNumber(): string {
  const d = new Date();
  const yyyymmdd = d.toISOString().slice(0, 10).replace(/-/g, '');
  return `${yyyymmdd}-001`;
}

const ORDERER_CATEGORIES: OrdererCategory[] = ['国', '県', '市町村'];

export default function QuotationForm({ settings, initial, onSave, onCancel }: Props) {
  const [view, setView] = useState<'form' | 'preview'>('form');
  const [date, setDate] = useState(initial?.date ?? today());
  const [quotationNumber, setQuotationNumber] = useState(initial?.quotationNumber ?? generateNumber());
  const [ordererCategory, setOrdererCategory] = useState<OrdererCategory>(initial?.ordererCategory ?? '県');
  const [clientName, setClientName] = useState(initial?.clientName ?? '');
  const [projectName, setProjectName] = useState(initial?.projectName ?? '');
  const [bridges, setBridges] = useState<BridgeData[]>(initial?.bridges ?? []);
  const [surveyDays, setSurveyDays] = useState(initial?.surveyDays ?? 0);
  const [walkingDays, setWalkingDays] = useState(initial?.walkingDays ?? 0);
  const [btDays, setBtDays] = useState(initial?.btDays ?? 0);
  const [ewpDays, setEwpDays] = useState(initial?.ewpDays ?? 0);
  const [summaryDays, setSummaryDays] = useState(initial?.summaryDays ?? 0);
  const [trafficGuardEnabled, setTrafficGuardEnabled] = useState(initial?.trafficGuardEnabled ?? false);
  const [trafficGuardUnitPrice, setTrafficGuardUnitPrice] = useState(initial?.trafficGuardUnitPrice ?? 0);
  const [barrierEnabled, setBarrierEnabled] = useState(initial?.barrierEnabled ?? false);
  const [barrierUnitPrice, setBarrierUnitPrice] = useState(initial?.barrierUnitPrice ?? 0);
  const [kokusokenEnabled, setKokusokenEnabled] = useState(initial?.kokusokenEnabled ?? false);
  const [mextEnabled, setMextEnabled] = useState(initial?.mextEnabled ?? false);
  const [items, setItems] = useState<QuotationItem[]>(initial?.items ?? []);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [csvFileName, setCsvFileName] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 明細の再計算
  const buildParams = useCallback((overrides?: Partial<WorkParams>): WorkParams => ({
    surveyDays,
    walkingDays,
    btDays,
    ewpDays,
    summaryDays,
    kokusokenEnabled,
    mextEnabled,
    trafficGuardEnabled,
    trafficGuardUnitPrice,
    barrierEnabled,
    barrierUnitPrice,
    ...overrides,
  }), [surveyDays, walkingDays, btDays, ewpDays, summaryDays, kokusokenEnabled, mextEnabled,
       trafficGuardEnabled, trafficGuardUnitPrice, barrierEnabled, barrierUnitPrice]);

  const recalculate = useCallback((
    bridgeList: BridgeData[],
    paramOverrides?: Partial<WorkParams>,
    category?: OrdererCategory,
  ) => {
    const calculated = calculateItems(
      bridgeList, settings, buildParams(paramOverrides), category ?? ordererCategory
    );
    setItems(calculated);
  }, [settings, ordererCategory, buildParams]);

  const handleCSVUpload = useCallback(async (file: File) => {
    setCsvFileName(file.name);
    const { data, errors } = await parseBridgeCSV(file);
    setCsvErrors(errors);
    if (data.length > 0) {
      setBridges(data);
      recalculate(data);
    }
  }, [recalculate]);

  const handleOrdererCategoryChange = useCallback((cat: OrdererCategory) => {
    setOrdererCategory(cat);
    recalculate(bridges, undefined, cat);
  }, [bridges, recalculate]);

  const handleRecalculate = useCallback(() => {
    recalculate(bridges);
  }, [bridges, recalculate]);

  // 明細行の編集
  const updateItem = (id: string, field: keyof QuotationItem, value: string | number) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };
      if (field === 'quantity' || field === 'unitPrice') {
        updated.amount = updated.quantity * updated.unitPrice;
      }
      return updated;
    }));
  };

  const addItem = () => {
    setItems(prev => [...prev, {
      id: genId(),
      label: '',
      quantity: 1,
      unit: '式',
      unitPrice: 0,
      amount: 0,
      isAutoCalculated: false,
    }]);
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const totals = calculateTotals(items, settings);

  const buildQuotation = (): Quotation => ({
    id: initial?.id ?? genId(),
    quotationNumber,
    date,
    ordererCategory,
    clientName,
    projectName,
    surveyDays,
    walkingDays,
    btDays,
    ewpDays,
    summaryDays,
    kokusokenEnabled,
    mextEnabled,
    trafficGuardEnabled,
    trafficGuardUnitPrice,
    barrierEnabled,
    barrierUnitPrice,
    bridges,
    items,
    subtotal: totals.subtotal,
    tax: totals.tax,
    total: totals.total,
    createdAt: initial?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const handleSave = () => {
    onSave(buildQuotation());
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  if (view === 'preview') {
    const q = buildQuotation();
    return (
      <div>
        {toastVisible && (
          <div className="toast-saved">保存しました ✓</div>
        )}
        <div className="preview-toolbar no-print">
          <button onClick={() => setView('form')} className="btn-secondary">← 編集に戻る</button>
          <button onClick={handlePrint} className="btn-primary">🖨 PDF出力（印刷）</button>
          <button onClick={handleSave} className="btn-success">保存</button>
        </div>
        <QuotationPreview quotation={q} settings={settings} />
      </div>
    );
  }

  return (
    <div className="quotation-form">
      {toastVisible && (
        <div className="toast-saved">保存しました ✓</div>
      )}
      <div className="form-toolbar">
        <button onClick={onCancel} className="btn-secondary">← 一覧に戻る</button>
        <div className="form-toolbar-right">
          <button onClick={() => setView('preview')} className="btn-outline">プレビュー</button>
          <button onClick={handleSave} className="btn-primary">保存</button>
        </div>
      </div>

      <div className="form-grid">
        {/* 基本情報 */}
        <section className="form-section">
          <h3>基本情報</h3>
          <div className="field-row">
            <label>見積日</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="field-row">
            <label>見積番号</label>
            <input type="text" value={quotationNumber} onChange={e => setQuotationNumber(e.target.value)} />
          </div>
          <div className="field-row">
            <label>発注者区分</label>
            <div className="radio-group">
              {ORDERER_CATEGORIES.map(cat => (
                <label key={cat} className="radio-label">
                  <input
                    type="radio"
                    name="ordererCategory"
                    value={cat}
                    checked={ordererCategory === cat}
                    onChange={() => handleOrdererCategoryChange(cat)}
                  />
                  {cat}
                </label>
              ))}
            </div>
          </div>
          <div className="field-row">
            <label>発注者名</label>
            <input
              type="text"
              value={clientName}
              onChange={e => setClientName(e.target.value)}
              placeholder="例: 株式会社福山コンサルタント"
            />
          </div>
          <div className="field-row">
            <label>件名</label>
            <input
              type="text"
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
              placeholder="例: 令和8年度 秋田・湯沢管内橋梁点検業務"
            />
          </div>
        </section>

        {/* CSVインポート（右寄せ） */}
        <section className="form-section csv-section csv-compact">
          <h3>橋梁データ（CSV読込）</h3>

          <div className="csv-row">
            <div className="csv-upload-area-compact"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file) handleCSVUpload(file);
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                style={{ display: 'none' }}
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) handleCSVUpload(file);
                }}
              />
              <span className="csv-icon">📂</span>
              <span className="csv-label">{csvFileName || 'CSVを選択 / ドロップ'}</span>
            </div>
            {bridges.length > 0 && (
              <span className="bridge-badge">{bridges.length} 橋</span>
            )}
          </div>

          {csvErrors.length > 0 && (
            <div className="error-box">{csvErrors.map((e, i) => <div key={i}>{e}</div>)}</div>
          )}

          <p className="hint" style={{ marginTop: '6px' }}>「橋長」列必須（m単位）。「橋梁名」列も使用可。</p>
        </section>
      </div>

      {/* 現場設定 ＋ 内業設定 */}
      <div className="form-grid">
        {/* 現場設定 */}
        <section className="form-section">
          <h3>現場設定</h3>
          <div className="field-row">
            <label>現地踏査日数</label>
            <div className="input-with-suffix">
              <input
                type="number"
                min="0"
                value={surveyDays}
                onChange={e => setSurveyDays(parseInt(e.target.value) || 0)}
              />
              <span className="suffix">日 → {surveyDays * 2} 人工</span>
            </div>
          </div>
          <div className="field-row">
            <label>点検（徒歩・梯子）</label>
            <div className="input-with-suffix">
              <input
                type="number"
                min="0"
                value={walkingDays}
                onChange={e => setWalkingDays(parseInt(e.target.value) || 0)}
              />
              <span className="suffix">日 → {walkingDays * 2} 人工</span>
            </div>
          </div>
          <div className="field-row">
            <label>点検（BT-200）</label>
            <div className="input-with-suffix">
              <input
                type="number"
                min="0"
                value={btDays}
                onChange={e => setBtDays(parseInt(e.target.value) || 0)}
              />
              <span className="suffix">日 → {btDays * 2} 人工</span>
            </div>
          </div>
          <div className="field-row">
            <label>点検（高所作業車）</label>
            <div className="input-with-suffix">
              <input
                type="number"
                min="0"
                value={ewpDays}
                onChange={e => setEwpDays(parseInt(e.target.value) || 0)}
              />
              <span className="suffix">日 → {ewpDays * 2} 人工</span>
            </div>
          </div>
          <p className="hint" style={{ marginBottom: '12px' }}>各日数 × 2人工 で計上。燃料は各点検日数ベース。</p>

          <div className="field-row">
            <label className="checkbox-label">
              <input type="checkbox" checked={trafficGuardEnabled}
                onChange={e => setTrafficGuardEnabled(e.target.checked)} />
              <span>交通誘導員</span>
            </label>
            <input
              type="number"
              min="0"
              value={trafficGuardUnitPrice || ''}
              placeholder="単価（円）"
              disabled={!trafficGuardEnabled}
              onChange={e => setTrafficGuardUnitPrice(parseFloat(e.target.value) || 0)}
              style={{ opacity: trafficGuardEnabled ? 1 : 0.4 }}
            />
          </div>

          <div className="field-row">
            <label className="checkbox-label">
              <input type="checkbox" checked={barrierEnabled}
                onChange={e => setBarrierEnabled(e.target.checked)} />
              <span>規制材(車両等含む)</span>
            </label>
            <input
              type="number"
              min="0"
              value={barrierUnitPrice || ''}
              placeholder="単価（円）"
              disabled={!barrierEnabled}
              onChange={e => setBarrierUnitPrice(parseFloat(e.target.value) || 0)}
              style={{ opacity: barrierEnabled ? 1 : 0.4 }}
            />
          </div>
        </section>

        {/* 内業設定 */}
        <section className="form-section">
          <h3>内業設定</h3>
          <div className="field-row">
            <label>現地踏査まとめ</label>
            <div className="input-with-suffix">
              <input
                type="number"
                min="0"
                value={summaryDays}
                onChange={e => setSummaryDays(parseInt(e.target.value) || 0)}
              />
              <span className="suffix">日 → {summaryDays} 人工{summaryDays === 0 ? '（非表示）' : ''}</span>
            </div>
          </div>

          <div className="field-row" style={{ marginTop: '12px' }}>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={kokusokenEnabled}
                onChange={e => setKokusokenEnabled(e.target.checked)}
              />
              <span>国総研様式</span>
            </label>
          </div>
          {kokusokenEnabled && (
            <div className="office-item-preview">
              国総研様式作成(新様式含む) &nbsp;
              {bridges.length} 橋 × ¥{(settings.laborUnitPrice * 1.8).toLocaleString('ja-JP')}
            </div>
          )}

          <div className="field-row" style={{ marginTop: '8px' }}>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={mextEnabled}
                onChange={e => setMextEnabled(e.target.checked)}
              />
              <span>国交省様式</span>
            </label>
          </div>
          {mextEnabled && (
            <div className="office-item-preview">
              国交省様式作成 &nbsp;
              {bridges.length} 橋 × ¥{(settings.laborUnitPrice * 0.8).toLocaleString('ja-JP')}
            </div>
          )}

          <div className="recalc-area" style={{ marginTop: '16px' }}>
            <button onClick={handleRecalculate} className="btn-outline">
              🔄 明細を再計算
            </button>
            <span className="hint">※ 入力後に再計算ボタンを押してください</span>
          </div>
        </section>
      </div>

      {/* 明細 */}
      <section className="form-section items-section">
        <div className="section-header">
          <h3>見積明細</h3>
          <button onClick={addItem} className="btn-secondary btn-sm">＋ 行を追加</button>
        </div>

        <table className="edit-items-table">
          <thead>
            <tr>
              <th className="col-auto">自動</th>
              <th className="col-name">品名</th>
              <th className="col-qty">数量</th>
              <th className="col-unit">単位</th>
              <th className="col-price">単価</th>
              <th className="col-amount">金額</th>
              <th className="col-del"></th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => {
              if (item.isSeparator) {
                return (
                  <tr key={item.id} className="separator-row">
                    <td colSpan={7}></td>
                  </tr>
                );
              }
              return (
                <tr key={item.id} className={item.isAutoCalculated ? 'auto-row' : ''}>
                  <td className="col-auto">
                    {item.isAutoCalculated ? <span className="auto-badge">自動</span> : ''}
                  </td>
                  <td className="col-name">
                    <input
                      type="text"
                      value={item.label}
                      onChange={e => updateItem(item.id, 'label', e.target.value)}
                    />
                  </td>
                  <td className="col-qty">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                    />
                  </td>
                  <td className="col-unit">
                    <input
                      type="text"
                      value={item.unit}
                      onChange={e => updateItem(item.id, 'unit', e.target.value)}
                    />
                  </td>
                  <td className="col-price">
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={e => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                    />
                  </td>
                  <td className="col-amount amount-cell">
                    {formatCurrency(item.amount)}
                  </td>
                  <td className="col-del">
                    <button onClick={() => removeItem(item.id)} className="btn-danger btn-sm">×</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* 合計サマリ */}
        <div className="totals-summary">
          <div className="total-line">
            <span>小計</span>
            <span>¥ {formatCurrency(totals.subtotal)}</span>
          </div>
          <div className="total-line">
            <span>消費税 ({settings.taxRate}%)</span>
            <span>¥ {formatCurrency(totals.tax)}</span>
          </div>
          <div className="total-line grand-total">
            <span>合計</span>
            <span>¥ {formatCurrency(totals.total)}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
