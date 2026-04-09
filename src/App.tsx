import React, { useState, useRef } from 'react';
import { useStore } from './stores/useStore';
import QuotationList from './pages/QuotationList';
import QuotationForm from './pages/QuotationForm';
import InvoiceList from './pages/InvoiceList';
import InvoiceForm from './pages/InvoiceForm';
import MasterSettingsPanel from './components/MasterSettings';
import type { Quotation, Invoice } from './types';
import './App.css';

type Tab = 'list' | 'form' | 'invoice-list' | 'invoice-form' | 'settings';

export default function App() {
  const { settings, saveSettings, quotations, saveQuotation, deleteQuotation, invoices, saveInvoice, deleteInvoice, exportData, importData } = useStore();
  const importInputRef = useRef<HTMLInputElement>(null);
  const [importMsg, setImportMsg] = useState('');
  const [tab, setTab] = useState<Tab>('list');
  const [editingQuotation, setEditingQuotation] = useState<Quotation | undefined>();
  const [formInitialView, setFormInitialView] = useState<'form' | 'preview'>('form');
  const [editingInvoice, setEditingInvoice] = useState<Invoice | undefined>();
  const [invoiceSourceQuotation, setInvoiceSourceQuotation] = useState<Quotation | undefined>();
  const [invoiceInitialView, setInvoiceInitialView] = useState<'form' | 'preview'>('form');

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

  // Invoice handlers
  const handleNewInvoice = () => {
    setEditingInvoice(undefined);
    setInvoiceSourceQuotation(undefined);
    setInvoiceInitialView('form');
    setTab('invoice-form');
  };

  const handleEditInvoice = (inv: Invoice) => {
    setEditingInvoice(inv);
    setInvoiceSourceQuotation(undefined);
    setInvoiceInitialView('form');
    setTab('invoice-form');
  };

  const handlePreviewInvoice = (inv: Invoice) => {
    setEditingInvoice(inv);
    setInvoiceSourceQuotation(undefined);
    setInvoiceInitialView('preview');
    setTab('invoice-form');
  };

  const handleCreateInvoiceFromQuotation = (q: Quotation) => {
    setEditingInvoice(undefined);
    setInvoiceSourceQuotation(q);
    setInvoiceInitialView('form');
    setTab('invoice-form');
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
          <span>見積書・請求書管理</span>
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
          />
        )}
        {tab === 'invoice-form' && (
          <InvoiceForm
            settings={settings}
            initial={editingInvoice}
            sourceQuotation={invoiceSourceQuotation}
            initialView={invoiceInitialView}
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
      </main>
    </div>
  );
}
