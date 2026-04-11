import React, { useState } from 'react';
import type { Quotation, MasterSettings } from '../types';
import FukkenSeishoTemplate from '../components/FukkenSeishoTemplate';
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

export default function FukkenSeishoPage({ quotation, settings, onSave, onCancel }: Props) {
  const [pdfSaving, setPdfSaving] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [submitted, setSubmitted] = useState(quotation.fukkenSeishoSubmitted ?? false);
  const [pikoon, setPikoon] = useState(false);
  const [fukkenJobNumber,   setFukkenJobNumber]   = useState(quotation.fukkenJobNumber   ?? '');
  const [fukkenProjectName, setFukkenProjectName] = useState(quotation.fukkenProjectName ?? quotation.projectName ?? '');
  const [fukkenStartDate,   setFukkenStartDate]   = useState(quotation.fukkenStartDate   ?? '');
  const [fukkenEndDate,     setFukkenEndDate]     = useState(quotation.fukkenEndDate     ?? '');
  const [fukkenSeishoDate,  setFukkenSeishoDate]  = useState(quotation.fukkenSeishoDate  ?? today());

  const buildUpdated = (): Quotation => ({
    ...quotation,
    fukkenEnabled: true,
    fukkenJobNumber,
    fukkenProjectName,
    fukkenStartDate,
    fukkenEndDate,
    fukkenSeishoDate,
    fukkenSeishoSubmitted: submitted,
    updatedAt: new Date().toISOString(),
  });

  const handleToggleSubmitted = () => {
    const next = !submitted;
    setSubmitted(next);
    setPikoon(true);
    setTimeout(() => setPikoon(false), 600);
    onSave({ ...buildUpdated(), fukkenSeishoSubmitted: next });
  };

  const handleSavePDF = async () => {
    const el = document.getElementById('fukken-seisho-print-area');
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
      pdf.save(`請書_${fukkenJobNumber || quotation.quotationNumber}.pdf`);
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
        <span className="fukken-page-title">請書（提出用）</span>
        <button onClick={() => window.print()} className="btn-secondary">🖨 印刷</button>
        <button onClick={handleSavePDF} className="btn-primary" disabled={pdfSaving}>
          {pdfSaving ? '生成中...' : '📄 PDF保存'}
        </button>
        <button onClick={() => { onSave(buildUpdated()); setToastVisible(true); setTimeout(() => setToastVisible(false), 2500); }} className="btn-success">保存</button>
        <button
          className={`status-btn ${submitted ? 'submitted' : 'not-submitted'} ${pikoon ? 'pikoon' : ''}`}
          onClick={handleToggleSubmitted}
        >
          {submitted ? '提出済' : '未提出'}
        </button>
      </div>

      <div className="fukken-layout">
        <div className="fukken-fields-panel no-print">
          <h3 className="fukken-panel-title">請書 入力</h3>

          <div className="fk-field-group">
            <label className="fk-field-label">請書発行日</label>
            <DatePicker value={fukkenSeishoDate} onChange={setFukkenSeishoDate} />
          </div>

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
            <label className="fk-field-label">工期（着工）</label>
            <DatePicker value={fukkenStartDate} onChange={setFukkenStartDate} />
          </div>

          <div className="fk-field-group">
            <label className="fk-field-label">工期（竣工）</label>
            <DatePicker value={fukkenEndDate} onChange={setFukkenEndDate} />
          </div>

          <div className="fk-field-note">
            ※ 請負金額・消費税は見積書の合計から自動取得
          </div>
        </div>

        <div className="fukken-preview-area">
          <FukkenSeishoTemplate quotation={q} settings={settings} />
        </div>
      </div>
    </div>
  );
}
