import React, { useState } from 'react';
import type { Quotation, MasterSettings } from '../types';
import FukkenDeliveryInvoiceTemplate from '../components/FukkenDeliveryInvoiceTemplate';
import DatePicker from '../components/DatePicker';

type DocTab = 'delivery' | 'invoice';

interface Props {
  quotation: Quotation;
  settings: MasterSettings;
  initialTab?: DocTab;
  onSave: (q: Quotation) => void;
  onCancel: () => void;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function FukkenDeliveryInvoicePage({ quotation, settings, initialTab, onSave, onCancel }: Props) {
  const [activeTab,                setActiveTab]                = useState<DocTab>(initialTab ?? 'delivery');
  const [pdfSaving,                setPdfSaving]                = useState(false);
  const [toastVisible,             setToastVisible]             = useState(false);
  const [fukkenJobNumber,          setFukkenJobNumber]          = useState(quotation.fukkenJobNumber          ?? '');
  const [fukkenProjectName,        setFukkenProjectName]        = useState(quotation.fukkenProjectName        ?? quotation.projectName ?? '');
  const [fukkenLocation,           setFukkenLocation]           = useState(quotation.fukkenLocation           ?? '');
  const [fukkenWorkContent,        setFukkenWorkContent]        = useState(quotation.fukkenWorkContent        ?? '');
  const [fukkenDeliveryDate,       setFukkenDeliveryDate]       = useState(quotation.fukkenDeliveryDate       ?? '');
  const [fukkenDeliveryInvoiceDate, setFukkenDeliveryInvoiceDate] = useState(quotation.fukkenDeliveryInvoiceDate ?? today());

  const buildUpdated = (): Quotation => ({
    ...quotation,
    fukkenEnabled: true,
    fukkenJobNumber,
    fukkenProjectName,
    fukkenLocation,
    fukkenWorkContent,
    fukkenDeliveryDate,
    fukkenDeliveryInvoiceDate,
    updatedAt: new Date().toISOString(),
  });

  const handleSavePDF = async () => {
    const printId = activeTab === 'delivery' ? 'fukken-delivery-print-area' : 'fukken-invoice-print-area';
    const fileName = activeTab === 'delivery'
      ? `納品書_${fukkenJobNumber || quotation.quotationNumber}`
      : `請求書_${fukkenJobNumber || quotation.quotationNumber}`;
    const el = document.getElementById(printId);
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
      const imgW = 210;
      const imgH = (canvas.height / canvas.width) * imgW;
      pdf.addImage(imgData, 'JPEG', 0, 0, imgW, imgH);
      pdf.save(`${fileName}.pdf`);
    } finally {
      setPdfSaving(false);
    }
  };

  const q = buildUpdated();

  return (
    <div className="fukken-form-page">
      {toastVisible && <div className="toast-saved">保存しました ✓</div>}
      <div className="preview-toolbar no-print">
        <button onClick={onCancel} className="btn-secondary">← 一覧に戻る</button>
        <div className="fukken-tab-group">
          <button
            className={`fukken-tab-btn ${activeTab === 'delivery' ? 'active' : ''}`}
            onClick={() => setActiveTab('delivery')}
          >納品書</button>
          <button
            className={`fukken-tab-btn ${activeTab === 'invoice' ? 'active' : ''}`}
            onClick={() => setActiveTab('invoice')}
          >請求書</button>
        </div>
        <button onClick={() => window.print()} className="btn-secondary">🖨 印刷</button>
        <button onClick={handleSavePDF} className="btn-primary" disabled={pdfSaving}>
          {pdfSaving ? '生成中...' : '📄 PDF保存'}
        </button>
        <button onClick={() => { onSave(buildUpdated()); setToastVisible(true); setTimeout(() => setToastVisible(false), 2500); }} className="btn-success">保存</button>
      </div>

      <div className="fukken-layout">
        <div className="fukken-fields-panel no-print">
          <h3 className="fukken-panel-title">納品書 / 請求書 入力</h3>

          <div className="fk-field-group">
            <label className="fk-field-label">件番</label>
            <input type="text" className="fk-field-input" value={fukkenJobNumber}
              onChange={e => setFukkenJobNumber(e.target.value)} placeholder="例: 2573300301" />
          </div>

          <div className="fk-field-group">
            <label className="fk-field-label">件名</label>
            <input type="text" className="fk-field-input" value={fukkenProjectName}
              onChange={e => setFukkenProjectName(e.target.value)} placeholder="例: ○○橋梁定期点検業務" />
            <div className="fk-field-hint">注文書に合わせて変更可</div>
          </div>

          <div className="fk-field-group">
            <label className="fk-field-label">施工場所</label>
            <input type="text" className="fk-field-input" value={fukkenLocation}
              onChange={e => setFukkenLocation(e.target.value)} placeholder="例: 秋田県秋田市保戸野鉄砲ほか" />
          </div>

          <div className="fk-field-group">
            <label className="fk-field-label">業務内容</label>
            <textarea className="fk-field-textarea" value={fukkenWorkContent}
              onChange={e => setFukkenWorkContent(e.target.value)}
              rows={3} placeholder="例: 橋梁定期点検 一式" />
          </div>

          <div className="fk-field-group">
            <label className="fk-field-label">納品日</label>
            <DatePicker value={fukkenDeliveryDate} onChange={setFukkenDeliveryDate} />
          </div>

          <div className="fk-field-group">
            <label className="fk-field-label">納品書/請求書 発行日</label>
            <DatePicker value={fukkenDeliveryInvoiceDate} onChange={setFukkenDeliveryInvoiceDate} />
          </div>

          <div className="fk-field-note">
            ※ 請負金額・消費税は見積書の合計から自動取得
          </div>
        </div>

        <div className="fukken-preview-area">
          <FukkenDeliveryInvoiceTemplate quotation={q} settings={settings} docType={activeTab} />
        </div>
      </div>
    </div>
  );
}
