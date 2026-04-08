import React, { useState, useRef, useCallback } from 'react';
import type { Quotation, QuotationItem, BridgeData, MasterSettings, OrdererCategory } from '../types';
import { calculateItems, calculateTotals, formatCurrency } from '../utils/calculations';
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
  const [workingDays, setWorkingDays] = useState(0);
  const [items, setItems] = useState<QuotationItem[]>(initial?.items ?? []);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [csvFileName, setCsvFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 橋梁データが変わったら自動計算
  const recalculate = useCallback((bridgeList: BridgeData[], days: number) => {
    const calculated = calculateItems(bridgeList, settings, days);
    setItems(calculated);
  }, [settings]);

  const handleCSVUpload = useCallback(async (file: File) => {
    setCsvFileName(file.name);
    const { data, errors } = await parseBridgeCSV(file);
    setCsvErrors(errors);
    if (data.length > 0) {
      setBridges(data);
      recalculate(data, workingDays);
    }
  }, [workingDays, recalculate]);

  const handleWorkingDaysChange = useCallback((days: number) => {
    setWorkingDays(days);
    recalculate(bridges, days);
  }, [bridges, recalculate]);

  const handleRecalculate = useCallback(() => {
    recalculate(bridges, workingDays);
  }, [bridges, workingDays, recalculate]);

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
  };

  const handlePrint = () => {
    window.print();
  };

  if (view === 'preview') {
    const q = buildQuotation();
    return (
      <div>
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
                    onChange={() => setOrdererCategory(cat)}
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

        {/* CSVインポート */}
        <section className="form-section">
          <h3>橋梁データ（CSV読込）</h3>
          <p className="hint">CSVに「橋長」列（m単位）を含めてください。「橋梁名」列も使用可能です。</p>

          <div className="csv-upload-area"
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
            <div className="csv-upload-icon">📂</div>
            <div>{csvFileName || 'CSVファイルをドロップ、またはクリックして選択'}</div>
          </div>

          {csvErrors.length > 0 && (
            <div className="error-box">
              {csvErrors.map((e, i) => <div key={i}>{e}</div>)}
            </div>
          )}

          {bridges.length > 0 && (
            <div className="bridge-summary">
              <div className="bridge-count">橋梁数: <strong>{bridges.length} 橋</strong></div>
              <div className="bridge-table-wrapper">
                <table className="bridge-table">
                  <thead>
                    <tr><th>橋梁名</th><th>橋長 (m)</th></tr>
                  </thead>
                  <tbody>
                    {bridges.slice(0, 5).map((b, i) => (
                      <tr key={i}><td>{b.name}</td><td>{b.length}</td></tr>
                    ))}
                    {bridges.length > 5 && (
                      <tr><td colSpan={2} style={{ textAlign: 'center', color: '#888' }}>... 他 {bridges.length - 5} 橋</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* 現場設定 */}
        <section className="form-section">
          <h3>現場設定</h3>
          <div className="field-row">
            <label>現場稼働日数</label>
            <div className="input-with-suffix">
              <input
                type="number"
                value={workingDays}
                onChange={e => handleWorkingDaysChange(parseInt(e.target.value) || 0)}
              />
              <span className="suffix">日（燃料計算用）</span>
            </div>
          </div>
          <div className="recalc-area">
            <button onClick={handleRecalculate} className="btn-outline">
              🔄 明細を再計算
            </button>
            <span className="hint">※ 設定変更後に再計算ボタンを押してください</span>
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
            {items.map(item => (
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
            ))}
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
