import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { Quotation, QuotationItem, BridgeData, MasterSettings, OrdererCategory, InspectionType } from '../types';
import { calculateItems, calculateTotals, formatCurrency, buildSubcontractQuotation, type WorkParams } from '../utils/calculations';
import { parseBridgeCSV } from '../utils/csvParser';
import QuotationPreview from '../components/QuotationPreview';
import DatePicker from '../components/DatePicker';

interface Props {
  settings: MasterSettings;
  initial?: Quotation;
  initialView?: 'form' | 'preview';
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

export default function QuotationForm({ settings, initial, initialView, onSave, onCancel }: Props) {
  const [view, setView] = useState<'form' | 'preview'>(initialView ?? 'form');
  const [date, setDate] = useState(initial?.date ?? today());
  const [quotationNumber, setQuotationNumber] = useState(initial?.quotationNumber ?? generateNumber());
  const isFirstRender = useRef(true);

  // 日付変更時に見積番号をリアルタイム更新（初回はスキップ）
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    setQuotationNumber(`${date.replace(/-/g, '')}-001`);
  }, [date]);
  const [ordererCategory, setOrdererCategory] = useState<OrdererCategory>(initial?.ordererCategory ?? '県');
  const [clientName, setClientName] = useState(initial?.clientName ?? '');
  const [projectName, setProjectName] = useState(initial?.projectName ?? '');
  const [bridges, setBridges] = useState<BridgeData[]>(initial?.bridges ?? []);
  const [surveyDays, setSurveyDays] = useState(initial?.surveyDays ?? 0);
  const [walkingDays, setWalkingDays] = useState(initial?.walkingDays ?? 0);
  const [btDays, setBtDays] = useState(initial?.btDays ?? 0);
  const [ewpDays, setEwpDays] = useState(initial?.ewpDays ?? 0);
  const [summaryDays, setSummaryDays] = useState(initial?.summaryDays ?? 0);
  const [btVehicleEnabled, setBtVehicleEnabled] = useState(initial?.btVehicleEnabled ?? false);
  const [btVehicleUnitPrice, setBtVehicleUnitPrice] = useState(initial?.btVehicleUnitPrice ?? 0);
  const [ewpVehicleEnabled, setEwpVehicleEnabled] = useState(initial?.ewpVehicleEnabled ?? false);
  const [ewpVehicleUnitPrice, setEwpVehicleUnitPrice] = useState(initial?.ewpVehicleUnitPrice ?? 0);
  const [trafficGuardEnabled, setTrafficGuardEnabled] = useState(initial?.trafficGuardEnabled ?? false);
  const [trafficGuardUnitPrice, setTrafficGuardUnitPrice] = useState(initial?.trafficGuardUnitPrice ?? 0);
  const [barrierEnabled, setBarrierEnabled] = useState(initial?.barrierEnabled ?? false);
  const [barrierUnitPrice, setBarrierUnitPrice] = useState(initial?.barrierUnitPrice ?? 0);
  const [safetyCoordinationEnabled, setSafetyCoordinationEnabled] = useState(initial?.safetyCoordinationEnabled ?? false);
  const [submitted, setSubmitted] = useState(initial?.submitted ?? false);
  const [submitAnimating, setSubmitAnimating] = useState(false);
  const [inspectionType, setInspectionType] = useState<InspectionType>(initial?.inspectionType ?? '橋梁点検');
  const [roadAccessoryCount, setRoadAccessoryCount] = useState(initial?.roadAccessoryCount ?? 0);
  const [roadAccessoryDays, setRoadAccessoryDays] = useState(initial?.roadAccessoryDays ?? 0);
  const [kokusokenEnabled, setKokusokenEnabled] = useState(initial?.kokusokenEnabled ?? false);
  const [mextEnabled, setMextEnabled] = useState(initial?.mextEnabled ?? false);
  const [items, setItems] = useState<QuotationItem[]>(initial?.items ?? []);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [csvFileName, setCsvFileName] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [subcontractMode, setSubcontractMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // roadAccessoryCount 変更時に roadAccessoryDays を自動計算
  useEffect(() => {
    setRoadAccessoryDays(Math.ceil(roadAccessoryCount / 12) || 0);
  }, [roadAccessoryCount]);

  // 明細の再計算
  const buildParams = useCallback((overrides?: Partial<WorkParams>): WorkParams => ({
    surveyDays,
    walkingDays,
    btDays,
    ewpDays,
    summaryDays,
    kokusokenEnabled,
    mextEnabled,
    btVehicleEnabled,
    btVehicleUnitPrice,
    ewpVehicleEnabled,
    ewpVehicleUnitPrice,
    trafficGuardEnabled,
    trafficGuardUnitPrice,
    barrierEnabled,
    barrierUnitPrice,
    safetyCoordinationEnabled,
    inspectionType,
    roadAccessoryCount,
    roadAccessoryDays,
    ...overrides,
  }), [surveyDays, walkingDays, btDays, ewpDays, summaryDays, kokusokenEnabled, mextEnabled,
       btVehicleEnabled, btVehicleUnitPrice, ewpVehicleEnabled, ewpVehicleUnitPrice,
       trafficGuardEnabled, trafficGuardUnitPrice, barrierEnabled, barrierUnitPrice,
       safetyCoordinationEnabled, inspectionType, roadAccessoryCount, roadAccessoryDays]);

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
    recalculate(bridges, { inspectionType, roadAccessoryCount, roadAccessoryDays });
  }, [bridges, recalculate, inspectionType, roadAccessoryCount, roadAccessoryDays]);

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
    inspectionType,
    roadAccessoryCount,
    roadAccessoryDays,
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
    btVehicleEnabled,
    btVehicleUnitPrice,
    ewpVehicleEnabled,
    ewpVehicleUnitPrice,
    trafficGuardEnabled,
    trafficGuardUnitPrice,
    barrierEnabled,
    barrierUnitPrice,
    safetyCoordinationEnabled,
    submitted,
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

  const [pdfSaving, setPdfSaving] = useState(false);

  const handleSavePDF = async () => {
    const el = document.getElementById('quotation-print-area');
    if (!el || pdfSaving) return;
    setPdfSaving(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);
      const canvas = await html2canvas(el, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const imgW = 210;
      const imgH = (canvas.height / canvas.width) * imgW;
      pdf.addImage(imgData, 'JPEG', 0, 0, imgW, imgH);
      pdf.save(`見積書_${quotationNumber}.pdf`);
    } finally {
      setPdfSaving(false);
    }
  };

  if (view === 'preview') {
    const q = buildQuotation();
    const displayQ = subcontractMode ? buildSubcontractQuotation(q, settings) : q;
    return (
      <div>
        {toastVisible && (
          <div className="toast-saved">保存しました ✓</div>
        )}
        <div className="preview-toolbar no-print">
          <button onClick={() => { setView('form'); setSubcontractMode(false); }} className="btn-secondary">← 編集に戻る</button>
          <button
            onClick={() => setSubcontractMode(v => !v)}
            className={subcontractMode ? 'btn-subcontract active' : 'btn-subcontract'}
          >
            {subcontractMode ? '通常表示に戻る' : '再委託用'}
          </button>
          <button onClick={handlePrint} className="btn-secondary">🖨 印刷</button>
          <button onClick={handleSavePDF} className="btn-primary" disabled={pdfSaving}>
            {pdfSaving ? '生成中...' : '📄 PDF保存'}
          </button>
          <button onClick={handleSave} className="btn-success">保存</button>
        </div>
        <QuotationPreview quotation={displayQ} settings={settings} isSubcontract={subcontractMode} />
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
            <DatePicker value={date} onChange={setDate} />
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
          <div className="field-row">
            <label>提出状況</label>
            <button
              className={`status-btn ${submitted ? 'submitted' : 'not-submitted'} ${submitAnimating ? 'pikoon' : ''}`}
              onClick={() => {
                setSubmitAnimating(true);
                setSubmitted(v => !v);
                setTimeout(() => setSubmitAnimating(false), 600);
              }}
            >
              {submitted ? '提出済' : '未提出'}
            </button>
          </div>
          <div className="field-row">
            <label>点検種別</label>
            <div className="radio-group">
              {(['橋梁点検', '道路附属物点検'] as InspectionType[]).map(type => (
                <label key={type} className="radio-label">
                  <input
                    type="radio"
                    name="inspectionType"
                    value={type}
                    checked={inspectionType === type}
                    onChange={() => { setInspectionType(type); recalculate(bridges, { inspectionType: type }); }}
                  />
                  {type}
                </label>
              ))}
            </div>
          </div>
        </section>

        {/* CSVインポート（橋梁点検のみ） */}
        {inspectionType === '橋梁点検' && (
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
        )}
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
          {inspectionType === '橋梁点検' && (
            <>
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
                <label className="checkbox-label">
                  <input type="checkbox" checked={btVehicleEnabled}
                    onChange={e => setBtVehicleEnabled(e.target.checked)} />
                  <span>橋梁点検車(BT-200)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={btVehicleUnitPrice || ''}
                  placeholder="単価（円）"
                  disabled={!btVehicleEnabled}
                  onChange={e => setBtVehicleUnitPrice(parseFloat(e.target.value) || 0)}
                  style={{ opacity: btVehicleEnabled ? 1 : 0.4 }}
                />
              </div>
            </>
          )}

          {inspectionType === '道路附属物点検' && (
            <>
              <div className="field-row">
                <label>点検基数</label>
                <div className="input-with-suffix">
                  <input
                    type="number"
                    min="0"
                    value={roadAccessoryCount}
                    onChange={e => setRoadAccessoryCount(parseInt(e.target.value) || 0)}
                  />
                  <span className="suffix">基</span>
                </div>
              </div>
              <div className="field-row">
                <label>点検日数</label>
                <div className="input-with-suffix">
                  <input
                    type="number"
                    min="0"
                    value={roadAccessoryDays}
                    onChange={e => setRoadAccessoryDays(parseInt(e.target.value) || 0)}
                  />
                  <span className="suffix">日 → {roadAccessoryDays * 2} 人工（初期値: 12基/日）</span>
                </div>
              </div>
            </>
          )}

          {/* 高所作業車（両モード共通） */}
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
          <div className="field-row">
            <label className="checkbox-label">
              <input type="checkbox" checked={ewpVehicleEnabled}
                onChange={e => setEwpVehicleEnabled(e.target.checked)} />
              <span>高所作業車(12m)</span>
            </label>
            <input
              type="number"
              min="0"
              value={ewpVehicleUnitPrice || ''}
              placeholder="単価（円）"
              disabled={!ewpVehicleEnabled}
              onChange={e => setEwpVehicleUnitPrice(parseFloat(e.target.value) || 0)}
              style={{ opacity: ewpVehicleEnabled ? 1 : 0.4 }}
            />
          </div>

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
              <span>保安資材(車両等含む)</span>
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

          <div className="field-row">
            <label className="checkbox-label">
              <input type="checkbox" checked={safetyCoordinationEnabled}
                onChange={e => setSafetyCoordinationEnabled(e.target.checked)} />
              <span>規制保安連絡調整</span>
            </label>
            {safetyCoordinationEnabled && (
              <span className="suffix" style={{ fontSize: '0.85em', color: '#555' }}>3 人工 自動計上</span>
            )}
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

          {inspectionType === '橋梁点検' && (
            <>
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
            </>
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
