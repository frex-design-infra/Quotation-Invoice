import React, { useState } from 'react';
import type { Quotation, MasterSettings } from '../types';
import FukkenSeishoPreview from '../components/FukkenSeishoPreview';
import FukkenDeliveryInvoicePreview from '../components/FukkenDeliveryInvoicePreview';
import DatePicker from '../components/DatePicker';

interface Props {
  quotation: Quotation;
  settings: MasterSettings;
  initialTab?: 'seisho' | 'delivery' | 'invoice';
  onSave: (q: Quotation) => void;
  onCancel: () => void;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function FukkenFormPage({ quotation, settings, initialTab, onSave, onCancel }: Props) {
  const [activeTab, setActiveTab] = useState<DocTab>(initialTab ?? 'seisho');
  const [pdfSaving, setPdfSaving] = useState(false);

  // 編集中フィールド
  const [fukkenJobNumber, setFukkenJobNumber] = useState(quotation.fukkenJobNumber ?? '');
  const [fukkenProjectName, setFukkenProjectName] = useState(quotation.fukkenProjectName ?? quotation.projectName ?? '');
  const [fukkenLocation, setFukkenLocation] = useState(quotation.fukkenLocation ?? '');
  const [fukkenStartDate, setFukkenStartDate] = useState(quotation.fukkenStartDate ?? '');
  const [fukkenEndDate, setFukkenEndDate] = useState(quotation.fukkenEndDate ?? '');
  const [fukkenWorkContent, setFukkenWorkContent] = useState(quotation.fukkenWorkContent ?? '');
  const [fukkenSeishoDate, setFukkenSeishoDate] = useState(quotation.fukkenSeishoDate ?? today());
  const [fukkenDeliveryDate, setFukkenDeliveryDate] = useState(quotation.fukkenDeliveryDate ?? '');
  const [fukkenDeliveryInvoiceDate, setFukkenDeliveryInvoiceDate] = useState(quotation.fukkenDeliveryInvoiceDate ?? today());

  const buildUpdated = (): Quotation => ({
    ...quotation,
    fukkenEnabled: true,
    fukkenJobNumber,
    fukkenProjectName,
    fukkenLocation,
    fukkenStartDate,
    fukkenEndDate,
    fukkenWorkContent,
    fukkenSeishoDate,
    fukkenDeliveryDate,
    fukkenDeliveryInvoiceDate,
    updatedAt: new Date().toISOString(),
  });

  const handleSave = () => {
    onSave(buildUpdated());
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSavePDF = async () => {
    let printAreaId = 'fukken-seisho-print-area';
    let fileName = `請書_${quotation.fukkenJobNumber || quotation.quotationNumber}`;
    if (activeTab === 'delivery') {
      printAreaId = 'fukken-delivery-print-area';
      fileName = `納品書_${quotation.fukkenJobNumber || quotation.quotationNumber}`;
    } else if (activeTab === 'invoice') {
      printAreaId = 'fukken-invoice-print-area';
      fileName = `請求書_${quotation.fukkenJobNumber || quotation.quotationNumber}`;
    }

    const el = document.getElementById(printAreaId);
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
      pdf.save(`${fileName}.pdf`);
    } finally {
      setPdfSaving(false);
    }
  };

  const q = buildUpdated();

  return (
    <div className="fukken-form-page">
      {/* ツールバー */}
      <div className="preview-toolbar no-print">
        <button onClick={onCancel} className="btn-secondary">← 一覧に戻る</button>
        <div className="fukken-tab-group">
          <button
            className={`fukken-tab-btn ${activeTab === 'seisho' ? 'active' : ''}`}
            onClick={() => setActiveTab('seisho')}
          >
            請書
          </button>
          <button
            className={`fukken-tab-btn ${activeTab === 'delivery' ? 'active' : ''}`}
            onClick={() => setActiveTab('delivery')}
          >
            納品書
          </button>
          <button
            className={`fukken-tab-btn ${activeTab === 'invoice' ? 'active' : ''}`}
            onClick={() => setActiveTab('invoice')}
          >
            請求書
          </button>
        </div>
        <button onClick={handlePrint} className="btn-secondary">🖨 印刷</button>
        <button onClick={handleSavePDF} className="btn-primary" disabled={pdfSaving}>
          {pdfSaving ? '生成中...' : '📄 PDF保存'}
        </button>
        <button onClick={handleSave} className="btn-success">保存</button>
      </div>

      <div className="fukken-layout">
        {/* 左: フォーム入力パネル */}
        <div className="fukken-fields-panel no-print">
          <h3 className="fukken-panel-title">復建技術コンサルタント様式</h3>

          <div className="fk-field-group">
            <label className="fk-field-label">件番</label>
            <input
              type="text"
              className="fk-field-input"
              value={fukkenJobNumber}
              onChange={e => setFukkenJobNumber(e.target.value)}
              placeholder="例: 2573300301"
            />
          </div>

          <div className="fk-field-group">
            <label className="fk-field-label">件名</label>
            <input
              type="text"
              className="fk-field-input"
              value={fukkenProjectName}
              onChange={e => setFukkenProjectName(e.target.value)}
              placeholder="例: ○○橋梁定期点検業務"
            />
            <div className="fk-field-hint">注文書に合わせて変更可</div>
          </div>

          <div className="fk-field-group">
            <label className="fk-field-label">施工場所</label>
            <input
              type="text"
              className="fk-field-input"
              value={fukkenLocation}
              onChange={e => setFukkenLocation(e.target.value)}
              placeholder="例: 秋田県秋田市保戸野鉄砲ほか"
            />
          </div>

          <div className="fk-field-group">
            <label className="fk-field-label">工期（着工）</label>
            <DatePicker value={fukkenStartDate} onChange={setFukkenStartDate} />
          </div>

          <div className="fk-field-group">
            <label className="fk-field-label">工期（竣工）</label>
            <DatePicker value={fukkenEndDate} onChange={setFukkenEndDate} />
          </div>

          <div className="fk-field-group">
            <label className="fk-field-label">業務内容</label>
            <textarea
              className="fk-field-textarea"
              value={fukkenWorkContent}
              onChange={e => setFukkenWorkContent(e.target.value)}
              rows={3}
              placeholder="例: 橋梁定期点検 一式"
            />
          </div>

          <div className="fk-field-divider">— 請書 —</div>

          <div className="fk-field-group">
            <label className="fk-field-label">請書発行日</label>
            <DatePicker value={fukkenSeishoDate} onChange={setFukkenSeishoDate} />
          </div>

          <div className="fk-field-divider">— 納品書 / 請求書 —</div>

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

        {/* 右: プレビュー */}
        <div className="fukken-preview-area">
          {activeTab === 'seisho' && (
            <FukkenSeishoPreview quotation={q} settings={settings} />
          )}
          {activeTab === 'delivery' && (
            <FukkenDeliveryInvoicePreview quotation={q} settings={settings} docType="delivery" />
          )}
          {activeTab === 'invoice' && (
            <FukkenDeliveryInvoicePreview quotation={q} settings={settings} docType="invoice" />
          )}
        </div>
      </div>
    </div>
  );
}
