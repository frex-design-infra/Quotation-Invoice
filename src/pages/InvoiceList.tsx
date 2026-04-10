import React, { useState } from 'react';
import type { Invoice } from '../types';
import { formatCurrency } from '../utils/calculations';

interface Props {
  invoices: Invoice[];
  onNew: () => void;
  onEdit: (inv: Invoice) => void;
  onPreview: (inv: Invoice) => void;
  onDelete: (id: string) => void;
  onToggleSubmitted: (id: string) => void;
}

const BILLING_LABEL: Record<string, string> = {
  interim: '中間',
  final: '最終',
  single: '',
};

export default function InvoiceList({ invoices, onNew, onEdit, onPreview, onDelete, onToggleSubmitted }: Props) {
  const [animatingIds, setAnimatingIds] = useState<Set<string>>(new Set());

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  };

  const handleToggle = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onToggleSubmitted(id);
    setAnimatingIds(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    setTimeout(() => {
      setAnimatingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 400);
  };

  return (
    <div className="quotation-list">
      <div className="list-header">
        <h2>請求書一覧</h2>
        <button onClick={onNew} className="btn-primary">＋ 新規請求書作成</button>
      </div>

      {invoices.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🧾</div>
          <p>請求書がありません</p>
          <button onClick={onNew} className="btn-primary">最初の請求書を作成</button>
        </div>
      ) : (
        <table className="list-table">
          <thead>
            <tr>
              <th>請求書番号</th>
              <th>発行日</th>
              <th>発注者名</th>
              <th>業務名</th>
              <th>種別</th>
              <th>今回請求額</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {invoices.map(inv => {
              const finalContractTotal = inv.originalContractTotal + inv.changeAmount;
              const billingAmount = inv.billingType === 'interim'
                ? (inv.currentBillingAmount ?? 0)
                : finalContractTotal - inv.previousBillingTotal;
              const typeLabel = BILLING_LABEL[inv.billingType ?? 'single'];
              return (
                <tr key={inv.id} onClick={() => onEdit(inv)} className="list-row">
                  <td className="mono">{inv.invoiceNumber}</td>
                  <td>{formatDate(inv.issueDate)}</td>
                  <td>{inv.clientName}</td>
                  <td className="project-name-cell">{inv.projectName}</td>
                  <td className="center">
                    {typeLabel && (
                      <span className={`billing-type-badge billing-type-${inv.billingType}`}>{typeLabel}</span>
                    )}
                  </td>
                  <td className="amount-cell">¥ {formatCurrency(billingAmount)}</td>
                  <td onClick={e => e.stopPropagation()} className="action-cell">
                    <button
                      className={`status-btn ${inv.submitted ? 'submitted' : 'not-submitted'} ${animatingIds.has(inv.id) ? 'pikoon' : ''}`}
                      onClick={e => handleToggle(e, inv.id)}
                    >
                      {inv.submitted ? '提出済' : '未提出'}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onEdit(inv); }}
                      className="btn-outline btn-sm"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => onPreview(inv)}
                      className="btn-outline btn-sm"
                    >
                      プレビュー
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`「${inv.invoiceNumber}」を削除しますか？`)) {
                          onDelete(inv.id);
                        }
                      }}
                      className="btn-danger btn-sm"
                    >
                      削除
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
