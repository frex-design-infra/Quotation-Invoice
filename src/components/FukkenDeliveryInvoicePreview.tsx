import React from 'react';
import type { Quotation, MasterSettings } from '../types';
import { formatCurrency } from '../utils/calculations';

interface Props {
  quotation: Quotation;
  settings: MasterSettings;
  /** 'delivery' = 納品書, 'invoice' = 請求書 */
  docType: 'delivery' | 'invoice';
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '　　　年　　月　　日';
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

function formatDateParts(dateStr: string): { y: string; m: string; d: string } {
  if (!dateStr) return { y: '', m: '', d: '' };
  const dt = new Date(dateStr + 'T00:00:00');
  return {
    y: String(dt.getFullYear()),
    m: String(dt.getMonth() + 1),
    d: String(dt.getDate()),
  };
}

function formatPostal(pc: string): string {
  if (!pc) return '';
  const s = pc.replace(/[^0-9]/g, '');
  if (s.length === 7) return `〒${s.slice(0, 3)}-${s.slice(3)}`;
  return `〒${pc}`;
}

export default function FukkenDeliveryInvoicePreview({ quotation, settings, docType }: Props) {
  const isDelivery = docType === 'delivery';
  const issueDate = isDelivery
    ? (quotation.fukkenDeliveryDate || quotation.fukkenDeliveryInvoiceDate || '')
    : (quotation.fukkenDeliveryInvoiceDate || quotation.fukkenDeliveryDate || '');
  const addressLines = settings.address ? settings.address.split('\n') : [];
  const workLines = quotation.fukkenWorkContent ? quotation.fukkenWorkContent.split('\n') : [''];

  // 振込先（請求書のみ・最初の銀行口座）
  const bankInfo = settings.bankAccounts?.[0]?.info ?? '';

  // 金額
  const totalAmount = quotation.total;
  const subtotal = quotation.subtotal;
  const tax = quotation.tax;

  const deliveryParts = formatDateParts(quotation.fukkenDeliveryDate || '');

  return (
    <div className="fukken-page" id={isDelivery ? 'fukken-delivery-print-area' : 'fukken-invoice-print-area'}>
      {/* タイトル */}
      <div className="fk-title-row">
        <div className="fk-title">
          {isDelivery ? '納　品　書（提出用）' : '請　求　書（提出用）'}
        </div>
        <div className="fk-issue-date">{formatDate(issueDate)}</div>
      </div>

      {/* 宛先 + 自社情報 */}
      <div className="fkdi-header-grid">
        {/* 左: 宛先 */}
        <div className="fkdi-client-area">
          <div className="fkdi-client-name">株式会社　復建技術コンサルタント　御中</div>
        </div>

        {/* 右: 業者コード + 登録番号 */}
        <div className="fkdi-vendor-area">
          <div className="fkdi-vendor-row">
            <span className="fkdi-vendor-key">業者コード</span>
            <span className="fkdi-vendor-val">
              {settings.fukkenVendorCode || 'G-　　　　'}
            </span>
          </div>
          <div className="fkdi-vendor-row">
            <span className="fkdi-vendor-key">登録番号</span>
            <span className="fkdi-vendor-val">
              T{settings.registrationNumber || ''}
            </span>
          </div>
        </div>
      </div>

      {/* 自社情報（住所・会社名・代表者） */}
      <div className="fkdi-company-area">
        <div className="fkdi-company-row">
          <span className="fkdi-company-key">住　　所</span>
          <span className="fkdi-company-val">
            {settings.postalCode && <>{formatPostal(settings.postalCode)}&nbsp;</>}
            {addressLines.join('　')}
          </span>
        </div>
        <div className="fkdi-company-row">
          <span className="fkdi-company-key">会　社　名</span>
          <div className="fkdi-name-seal">
            <span className="fkdi-company-val">{settings.companyName}</span>
            {settings.repSealDataUrl ? (
              <img src={settings.repSealDataUrl} alt="代表印" className="fk-seal-img" />
            ) : (
              <div className="fk-seal-placeholder">㊞</div>
            )}
          </div>
        </div>
        <div className="fkdi-company-row">
          <span className="fkdi-company-key">代表者名</span>
          <span className="fkdi-company-val">{settings.representativeName}</span>
        </div>
      </div>

      {/* 案内文 */}
      <div className="fkdi-intro">
        下記の通り{isDelivery ? 'ご納品申し上げます' : 'ご請求申し上げます'}
      </div>

      {/* メインテーブル */}
      <table className="fkdi-table">
        <tbody>
          {/* 件番 */}
          <tr>
            <td className="fkdi-th" style={{ width: '80px' }}>件番</td>
            <td colSpan={3}>No.&nbsp;{quotation.fukkenJobNumber || ''}</td>
          </tr>

          {/* 件名 */}
          <tr>
            <td className="fkdi-th">件名</td>
            <td colSpan={3}>{quotation.fukkenProjectName || quotation.projectName}</td>
          </tr>

          {/* 施工場所 */}
          <tr>
            <td className="fkdi-th">施工場所</td>
            <td colSpan={3}>{quotation.fukkenLocation || ''}</td>
          </tr>

          {/* 金額行 */}
          {isDelivery ? (
            <tr>
              <td className="fkdi-th">納品金額</td>
              <td className="fkdi-amount">{formatCurrency(totalAmount)}</td>
              <td className="fkdi-th" style={{ width: '60px', whiteSpace: 'nowrap' }}>納品</td>
              <td className="fkdi-date-cell">
                {deliveryParts.y ? (
                  <>{deliveryParts.y}年&nbsp;{deliveryParts.m}月&nbsp;{deliveryParts.d}日</>
                ) : (
                  '　　年　　月　　日'
                )}
              </td>
            </tr>
          ) : (
            <tr>
              <td className="fkdi-th">請求金額</td>
              <td className="fkdi-amount">{formatCurrency(totalAmount)}</td>
              <td className="fkdi-th" rowSpan={3} style={{ whiteSpace: 'nowrap', verticalAlign: 'top', paddingTop: '4px' }}>振込先</td>
              <td className="fkdi-bank-cell" rowSpan={3} style={{ whiteSpace: 'pre-line', fontSize: '7.5pt', verticalAlign: 'top', padding: '4px' }}>
                {bankInfo}
              </td>
            </tr>
          )}

          {/* 消費税10%対象 */}
          <tr>
            <td className="fkdi-th" style={{ whiteSpace: 'nowrap' }}>消費税10%対象</td>
            <td className="fkdi-amount">{formatCurrency(subtotal)}</td>
            {isDelivery && <><td></td><td></td></>}
          </tr>

          {/* 内消費税額 */}
          <tr>
            <td className="fkdi-th" style={{ whiteSpace: 'nowrap' }}>内消費税額(10%)</td>
            <td className="fkdi-amount">{formatCurrency(tax)}</td>
            {isDelivery && <><td></td><td></td></>}
          </tr>

          {/* 業務内容 */}
          <tr>
            <td className="fkdi-th" style={{ verticalAlign: 'top', paddingTop: '6px' }}>業務内容</td>
            <td colSpan={3} className="fkdi-work-content">
              {workLines.map((line, i) => (
                <div key={i}>{line || '\u00a0'}</div>
              ))}
              {/* 余白行 */}
              {workLines.length < 4 && Array.from({ length: 4 - workLines.length }).map((_, i) => (
                <div key={`empty-${i}`}>&nbsp;</div>
              ))}
            </td>
          </tr>
        </tbody>
      </table>

      {/* 請求書のみ: 注意書き */}
      {!isDelivery && (
        <div className="fkdi-notice">
          ①請求書は毎月1日までに提出して下さい。<br />
          ②請求書は、注文番号に添えて提出下さい。
        </div>
      )}

      {/* 承認欄テーブル */}
      {isDelivery ? (
        <table className="fkdi-approval-table">
          <tbody>
            <tr>
              <td className="fkdi-ap-th">担当部署</td>
              <td className="fkdi-ap-th">担当課長</td>
              <td className="fkdi-ap-th">担当者</td>
              <td className="fkdi-ap-th">確認書</td>
              <td className="fkdi-ap-th" style={{ whiteSpace: 'nowrap' }}>納品受領日</td>
              <td className="fkdi-ap-date">年　　月　　日</td>
            </tr>
            <tr>
              <td className="fkdi-ap-body">&nbsp;</td>
              <td className="fkdi-ap-body">&nbsp;</td>
              <td className="fkdi-ap-body">&nbsp;</td>
              <td className="fkdi-ap-body">&nbsp;</td>
              <td className="fkdi-ap-th" style={{ whiteSpace: 'nowrap' }}>帳　印　番　号</td>
              <td className="fkdi-ap-date">&nbsp;</td>
            </tr>
          </tbody>
        </table>
      ) : (
        <table className="fkdi-approval-table">
          <tbody>
            <tr>
              <td className="fkdi-ap-th">起案部署</td>
              <td className="fkdi-ap-th">起案課長</td>
              <td className="fkdi-ap-th">経理担当</td>
              <td className="fkdi-ap-th">担当役員</td>
              <td className="fkdi-ap-th">部長課長</td>
              <td className="fkdi-ap-th">担当者</td>
              <td className="fkdi-ap-th">担当日</td>
            </tr>
            <tr>
              <td className="fkdi-ap-th" style={{ whiteSpace: 'nowrap' }}>起　日</td>
              <td className="fkdi-ap-date" colSpan={6}>年　　月　　日</td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
}
