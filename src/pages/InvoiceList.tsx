import React from 'react';
import type { Invoice } from '../types';
import { formatCurrency } from '../utils/calculations';

interface Props {
  invoices: Invoice[];
  onNew: () => void;
  onEdit: (inv: Invoice) => void;
  onPreview: (inv: Invoice) => void;
  onDelete: (id: string) => void;
}

export default function InvoiceList({ invoices, onNew, onEdit, onPreview, onDelete }: Props) {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
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
              <th>ご請求金額</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {invoices.map(inv => {
              const finalContractTotal = inv.originalContractTotal + inv.changeAmount;
              return (
                <tr key={inv.id} onClick={() => onEdit(inv)} className="list-row">
                  <td className="mono">{inv.invoiceNumber}</td>
                  <td>{formatDate(inv.issueDate)}</td>
                  <td>{inv.clientName}</td>
                  <td className="project-name-cell">{inv.projectName}</td>
                  <td className="amount-cell">¥ {formatCurrency(finalContractTotal)}</td>
                  <td onClick={e => e.stopPropagation()} className="action-cell">
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
