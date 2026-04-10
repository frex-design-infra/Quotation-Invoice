import React, { useState, useEffect, useRef } from 'react';
import type { Invoice, MasterSettings, Quotation } from '../types';
import { formatCurrency } from '../utils/calculations';
import InvoicePreview from '../components/InvoicePreview';
import DatePicker from '../components/DatePicker';

interface Props {
  settings: MasterSettings;
  initial?: Invoice;
  sourceQuotation?: Quotation;
  initialView?: 'form' | 'preview';
  onSave: (inv: Invoice) => void;
  onCancel: () => void;
}

function genId() {
  return Math.random().toString(36).slice(2, 9);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function calcEndOfNextMonth(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  const last = new Date(d.getFullYear(), d.getMonth() + 2, 0);
  return last.toISOString().slice(0, 10);
}

export default function InvoiceForm({ settings, initial, sourceQuotation, initialView, onSave, onCancel }: Props) {
  const [view, setView] = useState<'form' | 'preview'>(initialView ?? 'form');
  const [toastVisible, setToastVisible] = useState(false);
  const [pdfSaving, setPdfSaving] = useState(false);
  const isFirstIssueDate = useRef(true);

  // ── フォームフィールド ──
  const initIssueDate = initial?.issueDate ?? today();
  const [issueDate, setIssueDate] = useState(initIssueDate);
  const [invoiceNumber, setInvoiceNumber] = useState(
    initial?.invoiceNumber ?? (initIssueDate.replace(/-/g, '') + '001')
  );

  // 発注者: select or free-text
  const [clientSelectId, setClientSelectId] = useState(() => {
    if (initial) {
      const found = (settings.clients ?? []).find(c => c.name === initial.clientName);
      return found?.id ?? '';
    }
    if (sourceQuotation) {
      const found = (settings.clients ?? []).find(c => c.name === sourceQuotation.clientName);
      return found?.id ?? '';
    }
    return '';
  });
  const [clientName, setClientName] = useState(
    initial?.clientName ?? sourceQuotation?.clientName ?? ''
  );
  const [clientPostalCode, setClientPostalCode] = useState(
    initial?.clientPostalCode ?? (() => {
      if (sourceQuotation) {
        const found = (settings.clients ?? []).find(c => c.name === sourceQuotation.clientName);
        return found?.postalCode ?? '';
      }
      return '';
    })()
  );
  const [clientAddress, setClientAddress] = useState(
    initial?.clientAddress ?? (() => {
      if (sourceQuotation) {
        const found = (settings.clients ?? []).find(c => c.name === sourceQuotation.clientName);
        return found?.address ?? '';
      }
      return '';
    })()
  );

  const [projectName, setProjectName] = useState(
    initial?.projectName ?? sourceQuotation?.projectName ?? ''
  );
  const [originalContractTotal, setOriginalContractTotal] = useState(
    initial?.originalContractTotal ?? sourceQuotation?.total ?? 0
  );
  const [changeAmount, setChangeAmount] = useState(initial?.changeAmount ?? 0);
  const [deliveryDate, setDeliveryDate] = useState(initial?.deliveryDate ?? today());
  const [deliveryPerson, setDeliveryPerson] = useState(
    initial?.deliveryPerson ?? (settings.deliveryPersons?.[0] ?? '')
  );
  const [deliveryDescription, setDeliveryDescription] = useState(initial?.deliveryDescription ?? '');
  const [billingDate, setBillingDate] = useState(initial?.billingDate ?? today());
  const [previousBillingTotal, setPreviousBillingTotal] = useState(initial?.previousBillingTotal ?? 0);
  const [paymentDueDate, setPaymentDueDate] = useState(
    initial?.paymentDueDate ?? calcEndOfNextMonth(initIssueDate)
  );
  const bankAccounts = settings.bankAccounts ?? [];
  const defaultBankInfo = initial?.bankInfo ?? bankAccounts[0]?.info ?? '';
  const [bankInfo, setBankInfo] = useState(defaultBankInfo);
  const [bankSelectId, setBankSelectId] = useState(() => {
    if (initial?.bankInfo) {
      return bankAccounts.find(b => b.info === initial.bankInfo)?.id ?? '';
    }
    return bankAccounts[0]?.id ?? '';
  });

  // 発行日変更時に請求書番号・支払期限を更新（初回スキップ）
  useEffect(() => {
    if (isFirstIssueDate.current) { isFirstIssueDate.current = false; return; }
    setInvoiceNumber(issueDate.replace(/-/g, '') + '001');
    setPaymentDueDate(calcEndOfNextMonth(issueDate));
  }, [issueDate]);

  // 発注者選択変更時に住所を自動入力
  const handleClientSelect = (id: string) => {
    setClientSelectId(id);
    const found = (settings.clients ?? []).find(c => c.id === id);
    if (found) {
      setClientName(found.name);
      setClientPostalCode(found.postalCode);
      setClientAddress(found.address);
    }
  };

  const buildInvoice = (): Invoice => ({
    id: initial?.id ?? genId(),
    invoiceNumber,
    issueDate,
    quotationId: initial?.quotationId ?? sourceQuotation?.id,
    clientName,
    clientPostalCode,
    clientAddress,
    projectName,
    originalContractTotal,
    changeAmount,
    deliveryDate,
    deliveryPerson,
    deliveryDescription,
    billingDate,
    previousBillingTotal,
    paymentDueDate,
    bankInfo,
    taxRate: settings.taxRate,
    createdAt: initial?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const handleSave = () => {
    onSave(buildInvoice());
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSavePDF = async () => {
    const el = document.getElementById('invoice-print-area');
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
      pdf.save(`請求書_${invoiceNumber}.pdf`);
    } finally {
      setPdfSaving(false);
    }
  };

  const finalContractTotal = originalContractTotal + changeAmount;
  const currentBillingTotal = finalContractTotal - previousBillingTotal;

  if (view === 'preview') {
    const inv = buildInvoice();
    return (
      <div>
        {toastVisible && <div className="toast-saved">保存しました ✓</div>}
        <div className="preview-toolbar no-print">
          <button onClick={() => setView('form')} className="btn-secondary">← 編集に戻る</button>
          <button onClick={handlePrint} className="btn-secondary">🖨 印刷</button>
          <button onClick={handleSavePDF} className="btn-primary" disabled={pdfSaving}>
            {pdfSaving ? '生成中...' : '📄 PDF保存'}
          </button>
          <button onClick={handleSave} className="btn-success">保存</button>
        </div>
        <InvoicePreview invoice={inv} settings={settings} />
      </div>
    );
  }

  return (
    <div className="quotation-form">
      {toastVisible && <div className="toast-saved">保存しました ✓</div>}

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
            <label>発行日</label>
            <DatePicker value={issueDate} onChange={setIssueDate} />
          </div>
          <div className="field-row">
            <label>請求書番号</label>
            <input
              type="text"
              value={invoiceNumber}
              onChange={e => setInvoiceNumber(e.target.value)}
            />
          </div>

          <div className="field-row">
            <label>発注先</label>
            <select
              value={clientSelectId}
              onChange={e => handleClientSelect(e.target.value)}
              style={{ flex: 1 }}
            >
              <option value="">-- 選択してください --</option>
              {(settings.clients ?? [])
                .filter(c => c.name.trim())
                .map(c => <option key={c.id} value={c.id}>{c.name}</option>)
              }
            </select>
          </div>
          <div className="field-row">
            <label>発注者名</label>
            <input
              type="text"
              value={clientName}
              onChange={e => setClientName(e.target.value)}
              placeholder="発注者名"
            />
          </div>
          <div className="field-row">
            <label>郵便番号</label>
            <input
              type="text"
              value={clientPostalCode}
              onChange={e => setClientPostalCode(e.target.value)}
              placeholder="例: 010-0904"
            />
          </div>
          <div className="field-row">
            <label>住所</label>
            <textarea
              value={clientAddress}
              onChange={e => setClientAddress(e.target.value)}
              rows={2}
              style={{ flex: 1, padding: '7px 10px', border: '1.5px solid #dde2e8', borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical' }}
              placeholder="住所"
            />
          </div>
          <div className="field-row">
            <label>業務名</label>
            <input
              type="text"
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
              placeholder="業務名"
            />
          </div>
        </section>

        {/* 契約金額 */}
        <section className="form-section">
          <h3>契約金額</h3>

          <div className="field-row">
            <label>当初契約額（税込）</label>
            <input
              type="number"
              value={originalContractTotal}
              onChange={e => setOriginalContractTotal(parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="field-row">
            <label>変更増減額（税込）</label>
            <input
              type="number"
              value={changeAmount}
              onChange={e => setChangeAmount(parseFloat(e.target.value) || 0)}
            />
          </div>

          <div style={{ background: '#f0f4f8', borderRadius: '6px', padding: '10px 14px', marginTop: '8px' }}>
            <div className="total-line" style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '13px' }}>
              <span>最終契約額（税込）</span>
              <span style={{ fontWeight: 700 }}>¥ {formatCurrency(finalContractTotal)}</span>
            </div>
            <div className="total-line" style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '13px' }}>
              <span>今回請求額（税込）</span>
              <span style={{ fontWeight: 700, color: '#1e3a5f' }}>¥ {formatCurrency(currentBillingTotal)}</span>
            </div>
          </div>
        </section>

        {/* 納品情報 */}
        <section className="form-section">
          <h3>納品情報</h3>

          <div className="field-row">
            <label>納品日</label>
            <DatePicker value={deliveryDate} onChange={setDeliveryDate} />
          </div>
          <div className="field-row">
            <label>納品担当者</label>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {(settings.deliveryPersons?.length ?? 0) > 0 && (
                <select
                  value={settings.deliveryPersons?.includes(deliveryPerson) ? deliveryPerson : ''}
                  onChange={e => { if (e.target.value) setDeliveryPerson(e.target.value); }}
                  style={{ width: '100%' }}
                >
                  <option value="">-- 登録済みから選択 --</option>
                  {settings.deliveryPersons?.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              )}
              <input
                type="text"
                value={deliveryPerson}
                onChange={e => setDeliveryPerson(e.target.value)}
                placeholder="担当者名"
              />
            </div>
          </div>
          <div className="field-row">
            <label>納品内容</label>
            <textarea
              value={deliveryDescription}
              onChange={e => setDeliveryDescription(e.target.value)}
              rows={5}
              style={{ flex: 1, padding: '7px 10px', border: '1.5px solid #dde2e8', borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical' }}
              placeholder="納品物の内容（改行区切り）"
            />
          </div>
        </section>

        {/* 請求情報 */}
        <section className="form-section">
          <h3>請求情報</h3>

          <div className="field-row">
            <label>請求日</label>
            <DatePicker value={billingDate} onChange={setBillingDate} />
          </div>
          <div className="field-row">
            <label>中間既請求額（税込）</label>
            <input
              type="number"
              value={previousBillingTotal}
              onChange={e => setPreviousBillingTotal(parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="field-row">
            <label>お支払期限</label>
            <DatePicker value={paymentDueDate} onChange={setPaymentDueDate} />
          </div>
          {bankAccounts.length > 0 && (
            <div className="field-row">
              <label>振込先口座</label>
              <select
                value={bankSelectId}
                onChange={e => {
                  const id = e.target.value;
                  setBankSelectId(id);
                  const found = bankAccounts.find(b => b.id === id);
                  if (found) setBankInfo(found.info);
                }}
                style={{ flex: 1 }}
              >
                <option value="">-- 選択してください --</option>
                {bankAccounts.map(b => (
                  <option key={b.id} value={b.id}>{b.label}</option>
                ))}
              </select>
            </div>
          )}
          <div className="field-row" style={{ alignItems: 'flex-start' }}>
            <label>振込先内容</label>
            <textarea
              value={bankInfo}
              onChange={e => setBankInfo(e.target.value)}
              rows={4}
              style={{ flex: 1, padding: '7px 10px', border: '1.5px solid #dde2e8', borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical' }}
              placeholder="銀行名・支店・口座番号など"
            />
          </div>
        </section>
      </div>
    </div>
  );
}
