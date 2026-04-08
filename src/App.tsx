import React, { useState } from 'react';
import { useStore } from './stores/useStore';
import QuotationList from './pages/QuotationList';
import QuotationForm from './pages/QuotationForm';
import MasterSettingsPanel from './components/MasterSettings';
import type { Quotation } from './types';
import './App.css';

type Tab = 'list' | 'form' | 'settings';

export default function App() {
  const { settings, saveSettings, quotations, saveQuotation, deleteQuotation } = useStore();
  const [tab, setTab] = useState<Tab>('list');
  const [editingQuotation, setEditingQuotation] = useState<Quotation | undefined>();

  const handleNew = () => {
    setEditingQuotation(undefined);
    setTab('form');
  };

  const handleEdit = (q: Quotation) => {
    setEditingQuotation(q);
    setTab('form');
  };

  const handleSave = (q: Quotation) => {
    saveQuotation(q);
    setTab('list');
  };

  const handleCancel = () => {
    setTab('list');
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
            className={`nav-tab ${tab === 'list' ? 'active' : ''}`}
            onClick={() => setTab('list')}
          >
            見積書一覧
          </button>
          <button
            className={`nav-tab ${tab === 'settings' ? 'active' : ''}`}
            onClick={() => setTab('settings')}
          >
            マスタ設定
          </button>
        </div>
      </nav>

      {/* コンテンツ */}
      <main className="app-main">
        {tab === 'list' && (
          <QuotationList
            quotations={quotations}
            onNew={handleNew}
            onEdit={handleEdit}
            onDelete={deleteQuotation}
          />
        )}
        {tab === 'form' && (
          <QuotationForm
            settings={settings}
            initial={editingQuotation}
            onSave={handleSave}
            onCancel={handleCancel}
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
