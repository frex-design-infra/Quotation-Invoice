import React from 'react';
import type { Quotation, MasterSettings } from '../types';
import { calculateTotals, formatCurrency } from '../utils/calculations';

interface Props {
  quotation: Quotation;
  settings: MasterSettings;
}

export default function QuotationPreview({ quotation, settings }: Props) {
  const totals = calculateTotals(quotation.items, settings);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const day = d.getDate();
    return `${y}年${String(m).padStart(2, '0')}月${String(day).padStart(2, '0')}日`;
  };

  const miscExpensesItem = {
    label: `諸経費(${settings.miscExpensesRate}%)`,
    quantity: 1,
    unit: '式',
    unitPrice: totals.miscExpenses,
    amount: totals.miscExpenses,
  };

  const discountItem = totals.discount !== 0 ? {
    label: 'お取引値引き',
    quantity: 1,
    unit: '式',
    unitPrice: -totals.discount,
    amount: -totals.discount,
  } : null;

  return (
    <div className="quotation-preview" id="quotation-print-area">
      {/* ヘッダー右上 */}
      <div className="doc-date-area">
        <div className="doc-date">{formatDate(quotation.date)}</div>
        <div className="doc-number">見積番号: {quotation.quotationNumber}</div>
      </div>

      {/* タイトル */}
      <h1 className="doc-title">見積書</h1>

      {/* 発注者 / 自社情報 */}
      <div className="doc-header-grid">
        <div className="doc-client-area">
          <div className="client-name">{quotation.clientName} 御中</div>
          <div className="project-name">件名：{quotation.projectName}</div>
          <div className="doc-intro">下記のとおりお見積申し上げます。</div>
          <div className="total-amount-area">
            <span className="total-label">お見積金額</span>
            <span className="total-value">¥ {formatCurrency(totals.total)} -</span>
          </div>
        </div>

        <div className="doc-company-area">
          <div className="company-logo-placeholder">
            <div className="logo-box">FRe:x Design</div>
          </div>
          <div className="company-info">
            <div className="company-name-jp">{settings.companyName}</div>
            <div className="company-name-en">{settings.companyNameEn}</div>
            <div className="company-postal">〒{settings.postalCode}</div>
            <div className="company-address">
              {settings.address.split('\n').map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>
            <div className="company-contact">
              <div>TEL: {settings.tel}</div>
              <div>{settings.email}</div>
              <div>登録番号: {settings.registrationNumber}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 明細テーブル */}
      <table className="items-table">
        <thead>
          <tr>
            <th className="col-name">品番・品名</th>
            <th className="col-qty">数量</th>
            <th className="col-price">単価</th>
            <th className="col-amount">金額</th>
          </tr>
        </thead>
        <tbody>
          {quotation.items.map(item => {
            if (item.isSeparator) {
              return <tr key={item.id} className="spacer-row"><td colSpan={4}></td></tr>;
            }
            return (
              <tr key={item.id}>
                <td className="col-name">{item.label}</td>
                <td className="col-qty">{item.quantity.toLocaleString('ja-JP')} {item.unit}</td>
                <td className="col-price">{formatCurrency(item.unitPrice)}</td>
                <td className="col-amount">{formatCurrency(item.amount)}</td>
              </tr>
            );
          })}

          {/* 空行（諸経費前） */}
          <tr className="spacer-row"><td colSpan={4}></td></tr>

          {/* 諸経費 */}
          <tr>
            <td>{miscExpensesItem.label}</td>
            <td className="col-qty">{miscExpensesItem.quantity} {miscExpensesItem.unit}</td>
            <td className="col-price">{formatCurrency(miscExpensesItem.unitPrice)}</td>
            <td className="col-amount">{formatCurrency(miscExpensesItem.amount)}</td>
          </tr>

          {/* 値引き */}
          {discountItem && (
            <tr>
              <td>{discountItem.label}</td>
              <td className="col-qty">1 式</td>
              <td className="col-price">{formatCurrency(discountItem.unitPrice)}</td>
              <td className="col-amount">{formatCurrency(discountItem.amount)}</td>
            </tr>
          )}

          {/* 小計 */}
          <tr className="subtotal-row">
            <td colSpan={3} className="subtotal-label">小計</td>
            <td className="col-amount">{formatCurrency(totals.subtotal)}</td>
          </tr>

          {/* 消費税 */}
          <tr className="tax-row">
            <td colSpan={3} className="subtotal-label">消費税 ({settings.taxRate}%)</td>
            <td className="col-amount">{formatCurrency(totals.tax)}</td>
          </tr>

          {/* 合計 */}
          <tr className="total-row">
            <td colSpan={3} className="subtotal-label">合計</td>
            <td className="col-amount">{formatCurrency(totals.total)}</td>
          </tr>
        </tbody>
      </table>

      {/* フッターコメント */}
      {settings.quotationFooterComment && (
        <div className="quotation-footer-comment">
          {settings.quotationFooterComment.split('\n').map((line, i) => (
            <div key={i}>{line || '\u00A0'}</div>
          ))}
        </div>
      )}
    </div>
  );
}
