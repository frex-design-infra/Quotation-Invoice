import React, { useState } from 'react';
import type { Quotation } from '../types';
import { formatCurrency } from '../utils/calculations';

interface Props {
  quotations: Quotation[];
  onNew: () => void;
  onEdit: (q: Quotation) => void;
  onPreview: (q: Quotation) => void;
  onDelete: (id: string) => void;
  onToggleSubmitted: (id: string) => void;
  onCreateInvoice: (q: Quotation, billingType: 'single' | 'interim' | 'final') => void;
}

export default function QuotationList({ quotations, onNew, onEdit, onPreview, onDelete, onToggleSubmitted, onCreateInvoice }: Props) {
  const [animatingIds, setAnimatingIds] = useState<Set<string>>(new Set());

  const formatDate = (dateStr: string) => {
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
        <h2>見積書一覧</h2>
        <button onClick={onNew} className="btn-primary">＋ 新規見積書作成</button>
      </div>

      {quotations.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📄</div>
          <p>見積書がありません</p>
          <button onClick={onNew} className="btn-primary">最初の見積書を作成</button>
        </div>
      ) : (
        <table className="list-table">
          <thead>
            <tr>
              <th>見積番号</th>
              <th>見積日</th>
              <th>発注者名</th>
              <th>件名</th>
              <th>合計金額</th>
              <th>橋数/基数</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {quotations.map(q => (
              <tr key={q.id} onClick={() => onEdit(q)} className="list-row">
                <td className="mono">{q.quotationNumber}</td>
                <td>{formatDate(q.date)}</td>
                <td>{q.clientName}</td>
                <td className="project-name-cell">{q.projectName}</td>
                <td className="amount-cell">¥ {formatCurrency(q.total)}</td>
                <td className="center">
                  {q.inspectionType === '道路附属物点検'
                    ? q.roadAccessoryCount || 0
                    : q.bridges.length}
                </td>
                <td onClick={e => e.stopPropagation()} className="action-cell">
                  <button
                    className={`status-btn ${q.submitted ? 'submitted' : 'not-submitted'} ${animatingIds.has(q.id) ? 'pikoon' : ''}`}
                    onClick={e => handleToggle(e, q.id)}
                  >
                    {q.submitted ? '提出済' : '未提出'}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onPreview(q); }}
                    className="btn-outline btn-sm"
                  >
                    プレビュー
                  </button>
                  {q.submitted && !q.hasInterimBilling && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onCreateInvoice(q, 'single'); }}
                      className="btn-invoice btn-sm"
                    >
                      請求書作成
                    </button>
                  )}
                  {q.submitted && q.hasInterimBilling && (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); onCreateInvoice(q, 'interim'); }}
                        className="btn-invoice btn-sm"
                      >
                        中間請求
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onCreateInvoice(q, 'final'); }}
                        className="btn-invoice btn-sm"
                      >
                        最終請求
                      </button>
                    </>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`「${q.quotationNumber}」を削除しますか？`)) {
                        onDelete(q.id);
                      }
                    }}
                    className="btn-danger btn-sm"
                  >
                    削除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
