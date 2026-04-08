import React from 'react';
import type { Quotation } from '../types';
import { formatCurrency } from '../utils/calculations';

interface Props {
  quotations: Quotation[];
  onNew: () => void;
  onEdit: (q: Quotation) => void;
  onDelete: (id: string) => void;
}

export default function QuotationList({ quotations, onNew, onEdit, onDelete }: Props) {
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
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
              <th>発注者区分</th>
              <th>発注者名</th>
              <th>件名</th>
              <th>合計金額</th>
              <th>橋梁数</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {quotations.map(q => (
              <tr key={q.id} onClick={() => onEdit(q)} className="list-row">
                <td className="mono">{q.quotationNumber}</td>
                <td>{formatDate(q.date)}</td>
                <td>
                  <span className={`category-badge cat-${q.ordererCategory}`}>
                    {q.ordererCategory}
                  </span>
                </td>
                <td>{q.clientName}</td>
                <td className="project-name-cell">{q.projectName}</td>
                <td className="amount-cell">¥ {formatCurrency(q.total)}</td>
                <td className="center">{q.bridges.length}</td>
                <td onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => {
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
