import React, { useState } from 'react';
import type { Quotation, MasterSettings, QuotationItem, ChangeQuotation } from '../types';
import QuotationPreview from '../components/QuotationPreview';
import DatePicker from '../components/DatePicker';

interface Props {
  quotation: Quotation;
  settings: MasterSettings;
  round: number; // 第N回
  allQuotations?: Quotation[];
  onSave: (q: Quotation) => void;
  onCancel: () => void;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function generateChangeQuotationNumber(
  dateStr: string | undefined,
  allQuotations: Quotation[] | undefined,
  currentQuotationId: string,
  currentRound: number,
): string {
  const yyyymmdd = (dateStr ?? today()).replace(/-/g, '');
  const usedNumbers: string[] = [];

  for (const q of allQuotations ?? []) {
    if (q.quotationNumber) usedNumbers.push(q.quotationNumber);
    for (const c of q.changeQuotations ?? []) {
      if (q.id === currentQuotationId && c.round === currentRound) continue;
      if (c.quotationNumber) usedNumbers.push(c.quotationNumber);
    }
  }

  const sameBase = usedNumbers
    .filter(n => n.startsWith(`${yyyymmdd}-`))
    .map(n => parseInt(n.slice(-3), 10))
    .filter(n => !isNaN(n));
  const seq = sameBase.length > 0 ? Math.max(...sameBase) + 1 : 1;
  return `${yyyymmdd}-${String(seq).padStart(3, '0')}`;
}

export default function ChangeQuotationPage({ quotation, settings, round, allQuotations, onSave, onCancel }: Props) {
  const [pdfSaving, setPdfSaving] = useState(false);

  const existing = quotation.changeQuotations?.find(c => c.round === round);
  const prev = quotation.changeQuotations?.find(c => c.round === round - 1);

  const [issueDate, setIssueDate] = useState(existing?.issueDate ?? today());
  const [quotationNumber, setQuotationNumber] = useState(
    existing?.quotationNumber ?? generateChangeQuotationNumber(existing?.issueDate ?? today(), allQuotations ?? [quotation], quotation.id, round)
  );
  const [quotationNumberEdited, setQuotationNumberEdited] = useState(false);
  const [submitted, setSubmitted] = useState(existing?.submitted ?? false);

  const handleIssueDateChange = (nextDate: string) => {
    setIssueDate(nextDate);
    if (!quotationNumberEdited) {
      setQuotationNumber(generateChangeQuotationNumber(nextDate, allQuotations ?? [quotation], quotation.id, round));
    }
  };
  // 初期明細：この回の保存済み → 前回の変更見積 → 元見積、の順でコピー
  const [items, setItems] = useState<QuotationItem[]>(() =>
    existing?.items ?? prev?.items ?? quotation.items
  );

  const updateQuantity = (id: string, newQty: number) => {
    setItems(prev => prev.map(item =>
      item.id === id
        ? { ...item, quantity: newQty, amount: Math.round(newQty * item.unitPrice) }
        : item
    ));
  };

  const updateLabel = (id: string, newLabel: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, label: newLabel } : item));
  };

  const deleteItem = (id: string) => {
    setItems(prev => {
      const next = prev.filter(item => item.id !== id);
      return next.filter((item, idx, arr) => {
        if (!item.isSeparator) return true;
        const prevItem = arr[idx - 1];
        const nextItem = arr[idx + 1];
        if (!prevItem || !nextItem) return false;
        if (prevItem.isSeparator) return false;
        return true;
      });
    });
  };

  // プレビュー用：日付・明細を変更見積用に上書き
  const displayQ: Quotation = {
    ...quotation,
    quotationNumber,
    date: issueDate,
    items,
  };

  const buildUpdated = (): Quotation => {
    const others = (quotation.changeQuotations ?? []).filter(c => c.round !== round);
    const updated: ChangeQuotation = { round, quotationNumber, issueDate, items, submitted };
    return {
      ...quotation,
      changeQuotations: [...others, updated].sort((a, b) => a.round - b.round),
      updatedAt: new Date().toISOString(),
    };
  };

  const handleSavePDF = async () => {
    const el = document.getElementById('quotation-print-area');
    if (!el || pdfSaving) return;
    setPdfSaving(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false });
      const imgData = canvas.toDataURL('image/jpeg', 0.88);
      const imgW = 210;
      const imgH = (canvas.height / canvas.width) * imgW;
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: imgH > 297 ? [imgW, imgH] : 'a4' });
      pdf.addImage(imgData, 'JPEG', 0, 0, imgW, imgH);
      pdf.save(`変更見積書_第${round}回_${quotationNumber}.pdf`);
    } finally {
      setPdfSaving(false);
    }
  };

  return (
    <div className="fukken-form-page">
      <div className="preview-toolbar no-print">
        <button onClick={onCancel} className="btn-secondary">← 一覧に戻る</button>
        <button onClick={() => window.print()} className="btn-secondary">🖨 印刷</button>
        <button onClick={handleSavePDF} className="btn-primary" disabled={pdfSaving}>
          {pdfSaving ? '生成中...' : '📄 PDF保存'}
        </button>
        <button onClick={() => onSave(buildUpdated())} className="btn-success">保存</button>
      </div>

      <div className="fukken-layout">
        <div className="fukken-fields-panel no-print">
          <h3 className="fukken-panel-title">変更見積書 入力（第{round}回）</h3>

          <div className="fk-field-group">
            <label className="fk-field-label">発行日</label>
            <DatePicker value={issueDate} onChange={handleIssueDateChange} />
          </div>

          <div className="fk-field-group">
            <label className="fk-field-label">見積番号</label>
            <input
              type="text"
              value={quotationNumber}
              onChange={e => {
                setQuotationNumber(e.target.value);
                setQuotationNumberEdited(true);
              }}
              style={{ width: '100%', border: '1px solid #d7d2ca', borderRadius: '7px', padding: '8px 10px', fontSize: '14px', boxSizing: 'border-box' }}
            />
            <div style={{ marginTop: '5px', color: '#888', fontSize: '11px', lineHeight: 1.5 }}>
              発行日から自動採番します（例：20260612-001）。必要に応じて手入力で修正できます。
            </div>
          </div>

          {/* 数量編集テーブル */}
          <div className="fk-field-group">
            <label className="fk-field-label">数量修正</label>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#f5f5f5' }}>
                    <th style={thStyle}>項目</th>
                    <th style={{ ...thStyle, width: '56px', textAlign: 'center' }}>数量</th>
                    <th style={{ ...thStyle, width: '28px' }}>単位</th>
                    <th style={{ ...thStyle, width: '28px', textAlign: 'center' }}>削除</th>
                  </tr>
                </thead>
                <tbody>
                  {items.filter(i => !i.isSeparator).map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ ...tdStyle, padding: '2px' }}>
                        <input
                          type="text"
                          value={item.label}
                          onChange={e => updateLabel(item.id, e.target.value)}
                          style={{ width: '100%', minWidth: '120px', border: '1px solid #ccc', borderRadius: '3px', padding: '2px 4px', fontSize: '12px', boxSizing: 'border-box' }}
                        />
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center', padding: '2px' }}>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={item.quantity === 0 ? '' : item.quantity}
                          placeholder="0"
                          onChange={e => {
                            const raw = e.target.value.replace(/[^0-9.]/g, '');
                            updateQuantity(item.id, raw === '' ? 0 : parseFloat(raw) || 0);
                          }}
                          style={{ width: '52px', textAlign: 'right', border: '1px solid #ccc', borderRadius: '3px', padding: '2px 4px', fontSize: '12px' }}
                        />
                      </td>
                      <td style={{ ...tdStyle, color: '#666' }}>{item.unit}</td>
                      <td style={{ ...tdStyle, textAlign: 'center', padding: '2px' }}>
                        <button
                          onClick={() => deleteItem(item.id)}
                          title="この項目を削除"
                          style={{ background: 'none', border: 'none', color: '#cc3333', fontSize: '16px', cursor: 'pointer', lineHeight: 1, padding: '0 4px', borderRadius: '3px' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#fde8e8')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                        >×</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="fk-field-group">
            <label className="fk-field-label">提出状況</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" checked={submitted} onChange={e => setSubmitted(e.target.checked)} style={{ width: '16px', height: '16px' }} />
              <span style={{ fontSize: '14px' }}>提出済にする</span>
            </label>
          </div>

          <div className="fk-field-note">
            ※ 元の見積をコピーして数量を変更できます。タイトル下に【第{round}回変更見積】と表示されます。
          </div>
        </div>

        <div className="fukken-preview-area">
          <QuotationPreview quotation={displayQ} settings={settings} changeRound={round} />
        </div>
      </div>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: '4px 6px',
  textAlign: 'left',
  fontWeight: 600,
  borderBottom: '2px solid #ddd',
  whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  padding: '3px 6px',
  verticalAlign: 'middle',
};
