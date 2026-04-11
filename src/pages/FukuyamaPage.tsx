import React, { useState, useRef } from 'react';
import type { Quotation } from '../types';
import FukuyamaTemplate from '../components/FukuyamaTemplate';
import DatePicker from '../components/DatePicker';
import { uploadFukuyamaTemplate, deleteFukuyamaTemplate } from '../lib/storage';

interface Props {
  quotation: Quotation;
  billingType?: 'single' | 'interim' | 'final';
  onSave: (q: Quotation) => void;
  onCancel: () => void;
}

const BILLING_TITLE: Record<string, string> = {
  single:  '納品書兼請求書',
  interim: '中間請求書',
  final:   '最終請求書',
};

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function FukuyamaPage({ quotation, billingType = 'single', onSave, onCancel }: Props) {
  const [pdfSaving,    setPdfSaving]    = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [uploading,    setUploading]    = useState(false);
  const [deleting,     setDeleting]     = useState(false);
  const [uploadError,  setUploadError]  = useState('');

  const [issueDate,    setIssueDate]    = useState(quotation.fukuyamaIssueDate           ?? today());
  const [workContent,  setWorkContent]  = useState(quotation.fukuyamaWorkContent         ?? '');
  const [templateUrl,  setTemplateUrl]  = useState(quotation.fukuyamaTemplateUrl         ?? '');
  const [storagePath,  setStoragePath]  = useState(quotation.fukuyamaTemplateStoragePath ?? '');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const buildUpdated = (): Quotation => ({
    ...quotation,
    fukuyamaEnabled: true,
    fukuyamaIssueDate: issueDate,
    fukuyamaWorkContent: workContent,
    fukuyamaTemplateUrl: templateUrl,
    fukuyamaTemplateStoragePath: storagePath,
    updatedAt: new Date().toISOString(),
  });

  const handleUpload = async (file: File) => {
    setUploading(true);
    setUploadError('');
    try {
      if (storagePath) await deleteFukuyamaTemplate(storagePath);
      const { url, path } = await uploadFukuyamaTemplate(file, quotation.id);
      setTemplateUrl(url);
      setStoragePath(path);
    } catch (e: unknown) {
      setUploadError(e instanceof Error ? e.message : 'アップロード失敗');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteTemplate = async () => {
    if (!confirm('テンプレート画像を削除しますか？\nSupabase Storage からも削除されます。')) return;
    setDeleting(true);
    try {
      if (storagePath) await deleteFukuyamaTemplate(storagePath);
      setTemplateUrl('');
      setStoragePath('');
    } catch (e: unknown) {
      setUploadError(e instanceof Error ? e.message : '削除失敗');
    } finally {
      setDeleting(false);
    }
  };

  const handleSavePDF = async () => {
    const el = document.getElementById('fukuyama-print-area');
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
      pdf.save(`${BILLING_TITLE[billingType]}_${quotation.projectName}.pdf`);
    } finally {
      setPdfSaving(false);
    }
  };

  const handleSave = () => {
    onSave(buildUpdated());
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2500);
  };

  const q = buildUpdated();
  const title = BILLING_TITLE[billingType];

  return (
    <div className="fukken-form-page">
      {toastVisible && <div className="toast-saved">保存しました ✓</div>}
      <div className="preview-toolbar no-print">
        <button onClick={onCancel} className="btn-secondary">← 一覧に戻る</button>
        <button onClick={() => window.print()} className="btn-secondary">🖨 印刷</button>
        <button onClick={handleSavePDF} className="btn-primary" disabled={pdfSaving || !templateUrl}>
          {pdfSaving ? '生成中...' : '📄 PDF保存'}
        </button>
        <button onClick={handleSave} className="btn-success">保存</button>
      </div>

      <div className="fukken-layout">
        <div className="fukken-fields-panel no-print">
          <h3 className="fukken-panel-title">{title} 入力</h3>

          {/* テンプレート画像アップロード */}
          <div className="fk-field-group">
            <label className="fk-field-label">所定様式（画像）</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {templateUrl && (
                <img src={templateUrl} alt="テンプレート" style={{ maxWidth: '100%', maxHeight: '120px', border: '1px solid #ddd', borderRadius: '4px', objectFit: 'contain' }} />
              )}
              <button
                className="btn-outline btn-sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || deleting}
              >
                {uploading ? 'アップロード中...' : templateUrl ? '画像を変更' : '画像をアップロード'}
              </button>
              {templateUrl && (
                <button
                  className="btn-sm"
                  style={{ background: 'none', border: '1px solid #e53e3e', color: '#e53e3e', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px' }}
                  onClick={handleDeleteTemplate}
                  disabled={deleting || uploading}
                >
                  {deleting ? '削除中...' : '画像を削除'}
                </button>
              )}
              {uploadError && <div style={{ color: '#e53e3e', fontSize: '12px' }}>{uploadError}</div>}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) handleUpload(file);
                  e.target.value = '';
                }}
              />
              <div className="fk-field-hint">福山コンサルタントから届いた書式をアップロード</div>
            </div>
          </div>

          <div className="fk-field-group">
            <label className="fk-field-label">請求日</label>
            <DatePicker value={issueDate} onChange={setIssueDate} />
          </div>

          <div className="fk-field-note">
            ※ 請負金額・消費税は見積書の合計から自動取得
          </div>
        </div>

        <div className="fukken-preview-area">
          <FukuyamaTemplate quotation={q} />
        </div>
      </div>
    </div>
  );
}
