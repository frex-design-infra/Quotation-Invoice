import React, { useState } from 'react';
import type { Quotation, MasterSettings, QuotationItem } from '../types';
import QuotationPreview from '../components/QuotationPreview';
import DatePicker from '../components/DatePicker';

interface Props {
  quotation: Quotation;
  settings: MasterSettings;
  onSave: (q: Quotation) => void;
  onCancel: () => void;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** 調書作成項目を除外 */
function filterItems(items: QuotationItem[]): QuotationItem[] {
  return items.filter(item => {
    if (item.isSeparator) return true;
    const l = item.label ?? '';
    return !l.startsWith('橋梁点検調書作成') && !l.startsWith('道路附属物点検調書作成');
  });
}

export default function FukuyamaInterimQuotationPage({ quotation, settings, onSave, onCancel }: Props) {
  const [pdfSaving, setPdfSaving] = useState(false);
  const [issueDate, setIssueDate] = useState(quotation.fukuyamaInterimQuotationIssueDate ?? quotation.date ?? today());
  const [submitted, setSubmitted] = useState(quotation.fukuyamaInterimQuotationSubmitted ?? false);

  // 中間見積書用アイテム: 保存済みがあればそれを、なければ調書作成を除いた項目で初期化
  const [items, setItems] = useState<QuotationItem[]>(() =>
    quotation.fukuyamaInterimQuotationItems ?? filterItems(quotation.items)
  );

  const updateQuantity = (id: string, newQty: number) => {
    setItems(prev => prev.map(item =>
      item.id === id
        ? { ...item, quantity: newQty, amount: Math.round(newQty * item.unitPrice) }
        : item
    ));
  };

  // QuotationPreview に渡す quotation（日付・アイテムを中間見積書用に上書き）
  const displayQ: Quotation = {
    ...quotation,
    date: issueDate,
    items,
  };

  const buildUpdated = (): Quotation => ({
    ...quotation,
    fukuyamaEnabled: true,
    fukuyamaInterimQuotationIssueDate: issueDate,
    fukuyamaInterimQuotationSubmitted: submitted,
    fukuyamaInterimQuotationItems: items,
    updatedAt: new Date().toISOString(),
  });

  const handleSavePDF = async () => {
    const el = document.getElementById('quotation-print-area');
    if (!el || pdfSaving) return;
    setPdfSaving(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);
      const canvas = await html2canvas(el, { scale: 3, useCORS: true, backgroundColor: '#ffffff', logging: false });
      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      pdf.addImage(imgData, 'JPEG', 0, 0, 210, (canvas.height / canvas.width) * 210);
      pdf.save(`中間見積書_${quotation.projectName}.pdf`);
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
          <h3 className="fukken-panel-title">中間見積書 入力</h3>

          <div className="fk-field-group">
            <label className="fk-field-label">見積日</label>
            <DatePicker value={issueDate} onChange={setIssueDate} />
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
                  </tr>
                </thead>
                <tbody>
                  {items.filter(i => !i.isSeparator).map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={tdStyle}>{item.label}</td>
                      <td style={{ ...tdStyle, textAlign: 'center', padding: '2px' }}>
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={item.quantity}
                          onChange={e => updateQuantity(item.id, parseFloat(e.target.value) || 0)}
                          style={{
                            width: '52px',
                            textAlign: 'right',
                            border: '1px solid #ccc',
                            borderRadius: '3px',
                            padding: '2px 4px',
                            fontSize: '12px',
                          }}
                        />
                      </td>
                      <td style={{ ...tdStyle, color: '#666' }}>{item.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="fk-field-group">
            <label className="fk-field-label">提出状況</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={submitted}
                onChange={e => setSubmitted(e.target.checked)}
                style={{ width: '16px', height: '16px' }}
              />
              <span style={{ fontSize: '14px' }}>提出済にする</span>
            </label>
          </div>

          <div className="fk-field-note">
            ※ 調書作成は除外済み。弊社様式で出力されます。
          </div>
        </div>

        <div className="fukken-preview-area">
          <QuotationPreview quotation={displayQ} settings={settings} />
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
