import React, { useState } from 'react';
import type { Quotation, MasterSettings } from '../types';
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

export default function FukuyamaInterimQuotationPage({ quotation, settings, onSave, onCancel }: Props) {
  const [pdfSaving, setPdfSaving]   = useState(false);
  const [issueDate, setIssueDate]   = useState(quotation.fukuyamaInterimQuotationIssueDate ?? quotation.date ?? today());
  const [submitted, setSubmitted]   = useState(quotation.fukuyamaInterimQuotationSubmitted ?? false);

  // 見積書プレビューに渡す quotation（見積日を中間見積書用日付で上書き）
  const displayQ: Quotation = {
    ...quotation,
    date: issueDate,
  };

  const buildUpdated = (): Quotation => ({
    ...quotation,
    fukuyamaEnabled: true,
    fukuyamaInterimQuotationIssueDate: issueDate,
    fukuyamaInterimQuotationSubmitted: submitted,
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
            ※ 弊社様式で出力されます
          </div>
        </div>

        <div className="fukken-preview-area">
          <QuotationPreview quotation={displayQ} settings={settings} />
        </div>
      </div>
    </div>
  );
}
