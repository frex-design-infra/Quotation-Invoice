import React, { useState, useRef } from 'react';
import { useStore } from './stores/useStore';
import QuotationList from './pages/QuotationList';
import QuotationForm from './pages/QuotationForm';
import InvoiceList from './pages/InvoiceList';
import InvoiceForm from './pages/InvoiceForm';
import MasterSettingsPanel from './components/MasterSettings';
import FukkenSeishoPage from './pages/FukkenSeishoPage';
import FukkenDeliveryInvoicePage from './pages/FukkenDeliveryInvoicePage';
import type { Quotation, Invoice, MasterSettings } from './types';
import './App.css';

function buildFukkenInvoice(q: Quotation, settings: MasterSettings, allInvoices: Invoice[], existing?: Invoice): Invoice {
  const now = new Date().toISOString();
  const dateBase = (q.fukkenDeliveryInvoiceDate || now.slice(0, 10)).replace(/-/g, '');
  // 同じ日付ベースの番号を持つ他のレコードを探し、最大連番+1を使う
  const sameBase = allInvoices
    .filter(inv => inv.id !== existing?.id && inv.invoiceNumber?.startsWith(dateBase + '-'))
    .map(inv => parseInt(inv.invoiceNumber.slice(-3), 10))
    .filter(n => !isNaN(n));
  const seq = sameBase.length > 0 ? Math.max(...sameBase) + 1 : 1;
  const invoiceNumber = existing?.invoiceNumber?.startsWith(dateBase + '-')
    ? existing.invoiceNumber
    : `${dateBase}-${String(seq).padStart(3, '0')}`;
  return {
    id: existing?.id ?? (q.id + '-fukken'),
    invoiceNumber,
    issueDate: q.fukkenDeliveryInvoiceDate || now.slice(0, 10),
    quotationId: q.id,
    billingType: 'single',
    isFukken: true,
    submitted: existing?.submitted ?? false,
    clientName: q.clientName,
    clientPostalCode: '',
    clientAddress: '',
    projectName: q.fukkenProjectName || q.projectName,
    originalContractTotal: q.total,
    changeAmount: 0,
    deliveryDate: q.fukkenDeliveryDate || '',
    deliveryPerson: '',
    deliveryDescription: q.fukkenWorkContent || '',
    billingDate: q.fukkenDeliveryInvoiceDate || now.slice(0, 10),
    previousBillingTotal: 0,
    paymentDueDate: '',
    bankInfo: settings.bankAccounts?.[0]?.info ?? '',
    taxRate: settings.taxRate,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}

type Tab = 'list' | 'form' | 'invoice-list' | 'invoice-form' | 'settings' | 'fukken-seisho' | 'fukken-delivery';

export default function App() {
  const { settings, saveSettings, quotations, saveQuotation, deleteQuotation, invoices, saveInvoice, deleteInvoice, exportData, importData, syncing, syncError } = useStore();
  const importInputRef = useRef<HTMLInputElement>(null);
  const [importMsg, setImportMsg] = useState('');
  const [tab, setTab] = useState<Tab>('list');
  const [editingQuotation, setEditingQuotation] = useState<Quotation | undefined>();
  const [formInitialView, setFormInitialView] = useState<'form' | 'preview'>('form');
  const [editingInvoice, setEditingInvoice] = useState<Invoice | undefined>();
  const [invoiceSourceQuotation, setInvoiceSourceQuotation] = useState<Quotation | undefined>();
  const [invoiceInitialView, setInvoiceInitialView] = useState<'form' | 'preview'>('form');
  const [invoiceBillingType, setInvoiceBillingType] = useState<'single' | 'interim' | 'final'>('single');
  const [interimInvoiceForFinal, setInterimInvoiceForFinal] = useState<Invoice | undefined>();
  const [fukkenDeliveryInitialTab, setFukkenDeliveryInitialTab] = useState<'delivery' | 'invoice'>('delivery');

  // Quotation handlers
  const handleNew = () => {
    setEditingQuotation(undefined);
    setFormInitialView('form');
    setTab('form');
  };

  const handleEdit = (q: Quotation) => {
    setEditingQuotation(q);
    setFormInitialView('form');
    setTab('form');
  };

  const handlePreview = (q: Quotation) => {
    setEditingQuotation(q);
    setFormInitialView('preview');
    setTab('form');
  };

  const handleSave = (q: Quotation) => {
    saveQuotation(q);
  };

  const handleToggleSubmitted = (id: string) => {
    const q = quotations.find(x => x.id === id);
    if (!q) return;
    saveQuotation({ ...q, submitted: !q.submitted });
  };

  const handleCancel = () => {
    setTab('list');
  };

  // Fukken handlers
  const handleOpenFukken = (q: Quotation, tab: 'seisho' | 'delivery' | 'invoice' = 'seisho') => {
    setEditingQuotation(q);
    if (tab === 'seisho') {
      setTab('fukken-seisho');
    } else {
      setFukkenDeliveryInitialTab(tab === 'invoice' ? 'invoice' : 'delivery');
      setTab('fukken-delivery');
    }
  };

  // Invoice handlers
  const handleNewInvoice = () => {
    setEditingInvoice(undefined);
    setInvoiceSourceQuotation(undefined);
    setInvoiceBillingType('single');
    setInterimInvoiceForFinal(undefined);
    setInvoiceInitialView('form');
    setTab('invoice-form');
  };

  const handleEditInvoice = (inv: Invoice) => {
    if (inv.isFukken) {
      const q = quotations.find(x => x.id === inv.quotationId);
      if (q) { setEditingQuotation(q); setFukkenDeliveryInitialTab('invoice'); setTab('fukken-delivery'); return; }
    }
    setEditingInvoice(inv);
    setInvoiceSourceQuotation(undefined);
    setInvoiceBillingType(inv.billingType ?? 'single');
    setInterimInvoiceForFinal(undefined);
    setInvoiceInitialView('form');
    setTab('invoice-form');
  };

  const handlePreviewInvoice = (inv: Invoice) => {
    if (inv.isFukken) {
      const q = quotations.find(x => x.id === inv.quotationId);
      if (q) { setEditingQuotation(q); setFukkenDeliveryInitialTab('invoice'); setTab('fukken-delivery'); return; }
    }
    setEditingInvoice(inv);
    setInvoiceSourceQuotation(undefined);
    setInvoiceBillingType(inv.billingType ?? 'single');
    setInterimInvoiceForFinal(undefined);
    setInvoiceInitialView('preview');
    setTab('invoice-form');
  };

  const handleCreateInvoiceFromQuotation = (q: Quotation, billingType: 'single' | 'interim' | 'final' = 'single') => {
    setEditingInvoice(undefined);
    setInvoiceSourceQuotation(q);
    setInvoiceBillingType(billingType);
    const interim = billingType === 'final'
      ? invoices.find(inv => inv.quotationId === q.id && inv.billingType === 'interim')
      : undefined;
    setInterimInvoiceForFinal(interim);
    setInvoiceInitialView('form');
    setTab('invoice-form');
  };

  const handleToggleInvoiceSubmitted = (id: string) => {
    const inv = invoices.find(x => x.id === id);
    if (!inv) return;
    saveInvoice({ ...inv, submitted: !inv.submitted });
  };

  const handleCancelInvoice = () => {
    setTab('invoice-list');
  };

  return (
    <div className="app">
      {/* ナビゲーション */}
      <nav className="app-nav no-print">
        <div className="nav-brand">
          <span className="nav-logo">📋</span>
          <span>見積書/請求書管理システム | FRe:x Design inc.</span>
        </div>
        <div className="nav-tabs">
          <button
            className={`nav-tab ${tab === 'list' || tab === 'form' ? 'active' : ''}`}
            onClick={() => setTab('list')}
          >
            見積書一覧
          </button>
          <button
            className={`nav-tab ${tab === 'invoice-list' || tab === 'invoice-form' ? 'active' : ''}`}
            onClick={() => setTab('invoice-list')}
          >
            請求書一覧
          </button>
          <button
            className={`nav-tab ${tab === 'settings' ? 'active' : ''}`}
            onClick={() => setTab('settings')}
          >
            マスタ設定
          </button>
        </div>
        <div className="nav-data-actions">
          {syncing && <span className="sync-indicator syncing">同期中...</span>}
          {!syncing && !syncError && <span className="sync-indicator synced">● 同期済</span>}
          {syncError && <span className="sync-indicator sync-err">⚠ オフライン</span>}
          {importMsg && <span className="import-msg">{importMsg}</span>}
          <button className="btn-data" onClick={exportData} title="全データをJSONファイルとして保存">
            エクスポート
          </button>
          <button className="btn-data" onClick={() => importInputRef.current?.click()} title="JSONファイルからデータを復元">
            インポート
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                await importData(file);
                setImportMsg('インポート完了');
                setTimeout(() => setImportMsg(''), 3000);
              } catch {
                setImportMsg('エラー: 不正なファイルです');
                setTimeout(() => setImportMsg(''), 4000);
              }
              e.target.value = '';
            }}
          />
        </div>
      </nav>

      {/* コンテンツ */}
      <main className="app-main">
        {tab === 'list' && (
          <QuotationList
            quotations={quotations}
            onNew={handleNew}
            onEdit={handleEdit}
            onPreview={handlePreview}
            onDelete={deleteQuotation}
            onToggleSubmitted={handleToggleSubmitted}
            onCreateInvoice={handleCreateInvoiceFromQuotation}
            onOpenFukken={handleOpenFukken}
          />
        )}
        {tab === 'form' && (
          <QuotationForm
            settings={settings}
            initial={editingQuotation}
            initialView={formInitialView}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        )}
        {tab === 'invoice-list' && (
          <InvoiceList
            invoices={invoices}
            onNew={handleNewInvoice}
            onEdit={handleEditInvoice}
            onPreview={handlePreviewInvoice}
            onDelete={deleteInvoice}
            onToggleSubmitted={handleToggleInvoiceSubmitted}
          />
        )}
        {tab === 'invoice-form' && (
          <InvoiceForm
            settings={settings}
            initial={editingInvoice}
            sourceQuotation={invoiceSourceQuotation}
            initialView={invoiceInitialView}
            billingType={invoiceBillingType}
            interimInvoice={interimInvoiceForFinal}
            onSave={saveInvoice}
            onCancel={handleCancelInvoice}
          />
        )}
        {tab === 'settings' && (
          <MasterSettingsPanel
            settings={settings}
            onSave={saveSettings}
          />
        )}
        {tab === 'fukken-seisho' && editingQuotation && (
          <FukkenSeishoPage
            quotation={editingQuotation}
            settings={settings}
            onSave={(q) => { saveQuotation(q); setEditingQuotation(q); }}
            onCancel={() => setTab('list')}
          />
        )}
        {tab === 'fukken-delivery' && editingQuotation && (
          <FukkenDeliveryInvoicePage
            quotation={editingQuotation}
            settings={settings}
            initialTab={fukkenDeliveryInitialTab}
            onSave={(q) => {
              saveQuotation(q);
              setEditingQuotation(q);
              const existing = invoices.find(inv => inv.quotationId === q.id && inv.isFukken);
              saveInvoice(buildFukkenInvoice(q, settings, invoices, existing));
            }}
            onCancel={() => setTab('list')}
          />
        )}
      </main>
    </div>
  );
}
