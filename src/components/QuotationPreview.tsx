import React, { useLayoutEffect, useRef, useState } from 'react';
import type { Quotation, MasterSettings } from '../types';
import { calculateTotals, formatCurrency } from '../utils/calculations';

/** セル幅に収まらない場合だけ横方向に縮小フィットするコンポーネント */
function FitText({ text }: { text: string }) {
  const outerRef = useRef<HTMLSpanElement>(null);
  const innerRef = useRef<HTMLSpanElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;
    const available = outer.offsetWidth;
    const needed = inner.scrollWidth;
    const next = needed > available && available > 0 ? available / needed : 1;
    setScale(prev => (Math.abs(prev - next) > 0.001 ? next : prev));
  });

  return (
    <span ref={outerRef} style={{ display: 'block', overflow: 'hidden' }}>
      <span
        ref={innerRef}
        style={{
          display: 'inline-block',
          whiteSpace: 'nowrap',
          transformOrigin: 'left center',
          transform: scale < 1 ? `scaleX(${scale})` : 'none',
        }}
      >
        {text}
      </span>
    </span>
  );
}

interface Props {
  quotation: Quotation;
  settings: MasterSettings;
  isSubcontract?: boolean;
  onFooterCommentChange?: (value: string) => void;
  changeRound?: number; // 変更見積の回数（指定時タイトル下に【第N回変更見積】を表示）
  isInterim?: boolean;  // 中間見積書フラグ（trueのとき【中間請求用見積】を表示）
}

export default function QuotationPreview({ quotation, settings, isSubcontract, onFooterCommentChange, changeRound, isInterim }: Props) {
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
      {/* 日付・見積番号・ロゴ（最上部右寄せ） */}
      <div className="doc-date-area">
        <div className="doc-date">{formatDate(quotation.date)}</div>
        <div className="doc-number">見積番号: {quotation.quotationNumber}</div>
        <div className="doc-logo-wrap">
          {settings.logoDataUrl ? (
            <img src={settings.logoDataUrl} alt="ロゴ" className="doc-logo-img" />
          ) : (
            <div className="logo-box">FRe:x Design</div>
          )}
        </div>
      </div>

      {/* タイトル */}
      <h1 className="doc-title">見　積　書</h1>
      {changeRound && (
        <div style={{ textAlign: 'center', fontSize: '17px', fontWeight: 700, color: '#1a1a1a', letterSpacing: '0.1em', marginTop: '2px' }}>【第{changeRound}回変更見積】</div>
      )}
      {isInterim && (
        <div style={{ textAlign: 'center', fontSize: '15px', fontWeight: 700, color: '#1a5276', letterSpacing: '0.08em', marginTop: '2px' }}>【中間請求用見積】</div>
      )}

      {/* ヘッダーグリッド */}
      <div className="doc-header-grid">
        {/* 左：発注者情報 */}
        <div className="doc-client-area">
          <div className="client-name">{quotation.clientName} 御中</div>
          <div className="project-name">件名：{quotation.projectName}</div>
          <div className="doc-intro">下記のとおりお見積申し上げます。</div>
          <div className="total-amount-area">
            <span className="total-label">お見積金額</span>
            <span className="total-value">¥ {formatCurrency(totals.total)} -</span>
            <span className="total-tax-incl">（税込）</span>
          </div>
        </div>

        {/* 右：自社情報 */}
        <div className="doc-company-area">
          <div className="company-info" style={{ position: 'relative' }}>
            <div className="company-name-seal-wrap">
              <div className="company-name-jp">{settings.companyName}</div>
              {settings.sealDataUrl && (
                <img src={settings.sealDataUrl} alt="角印" className="company-seal-img" />
              )}
            </div>
            <div className="company-name-en">{settings.companyNameEn}</div>
            <div className="company-postal">〒{settings.postalCode}</div>
            <div className="company-address">
              {settings.address.split('\n').map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>
            <div className="company-contact" style={{ position: 'relative' }}>
              {isSubcontract && settings.representativeName && (
                <div style={{ position: 'relative' }}>
                  {settings.repSealDataUrl && (
                    <img src={settings.repSealDataUrl} alt="代表印" className="company-rep-seal-img" />
                  )}
                  {settings.representativeName}
                </div>
              )}
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
                <td className="col-name"><FitText text={item.label} /></td>
                <td className="col-qty">{item.quantity.toLocaleString('ja-JP')} {item.unit}</td>
                <td className="col-price">{formatCurrency(item.unitPrice)}</td>
                <td className="col-amount">{formatCurrency(item.amount)}</td>
              </tr>
            );
          })}

          <tr className="spacer-row"><td colSpan={4}></td></tr>

          <tr className="subtotal-before-misc-row">
            <td colSpan={3} className="subtotal-label">直接費計</td>
            <td className="col-amount">{formatCurrency(totals.subtotalBeforeMisc)}</td>
          </tr>

          <tr>
            <td>{miscExpensesItem.label}</td>
            <td className="col-qty">{miscExpensesItem.quantity} {miscExpensesItem.unit}</td>
            <td className="col-price">{formatCurrency(miscExpensesItem.unitPrice)}</td>
            <td className="col-amount">{formatCurrency(miscExpensesItem.amount)}</td>
          </tr>

          {discountItem && (
            <tr>
              <td>{discountItem.label}</td>
              <td className="col-qty">1 式</td>
              <td className="col-price">{formatCurrency(discountItem.unitPrice)}</td>
              <td className="col-amount">{formatCurrency(discountItem.amount)}</td>
            </tr>
          )}

          <tr className="subtotal-row">
            <td colSpan={3} className="subtotal-label">小計</td>
            <td className="col-amount">{formatCurrency(totals.subtotal)}</td>
          </tr>

          <tr className="tax-row">
            <td colSpan={3} className="subtotal-label">消費税 ({settings.taxRate}%)</td>
            <td className="col-amount">{formatCurrency(totals.tax)}</td>
          </tr>

          <tr className="total-row">
            <td colSpan={3} className="subtotal-label">合計</td>
            <td className="col-amount">{formatCurrency(totals.total)}</td>
          </tr>
        </tbody>
      </table>

      {/* フッターコメント */}
      {(() => {
        const effectiveComment = quotation.footerComment ?? settings.quotationFooterComment;
        if (!effectiveComment) return null;

        // インライン編集モード（プレビュー画面から onFooterCommentChange が渡された場合）
        if (onFooterCommentChange) {
          return (
            <div className="quotation-footer-comment">
              <textarea
                className="footer-comment-inline-textarea"
                value={effectiveComment}
                onChange={e => {
                  onFooterCommentChange(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
                ref={el => {
                  if (el) {
                    el.style.height = 'auto';
                    el.style.height = el.scrollHeight + 'px';
                  }
                }}
              />
            </div>
          );
        }

        // 読み取り専用モード（再委託用・印刷・PDF保存など）
        return (
          <div className="quotation-footer-comment">
            {effectiveComment
              .split('\n')
              .filter(line => !isSubcontract || !line.includes('写真整理および損傷図修正含む'))
              .map((line, i) => (
                <div key={i}>{line || ' '}</div>
              ))}
          </div>
        );
      })()}
    </div>
  );
}
