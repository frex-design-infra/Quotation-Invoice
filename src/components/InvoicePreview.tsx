import React from 'react';
import type { Invoice, MasterSettings } from '../types';
import { formatCurrency } from '../utils/calculations';

interface Props {
  invoice: Invoice;
  settings: MasterSettings;
}

function inclTax(amount: number, taxRate: number): number {
  return Math.round(amount * taxRate / (100 + taxRate));
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

function formatPostal(pc: string): string {
  if (!pc) return '';
  const s = pc.replace(/[^0-9]/g, '');
  if (s.length === 7) return `〒${s.slice(0, 3)}-${s.slice(3)}`;
  return `〒${pc}`;
}

export default function InvoicePreview({ invoice, settings }: Props) {
  const {
    invoiceNumber,
    issueDate,
    clientName,
    clientPostalCode,
    clientAddress,
    projectName,
    originalContractTotal,
    changeAmount,
    deliveryDate,
    deliveryPerson,
    deliveryDescription,
    billingDate,
    previousBillingTotal,
    paymentDueDate,
    taxRate,
  } = invoice;

  const finalContractTotal = originalContractTotal + changeAmount;
  const currentBillingTotal = invoice.currentBillingAmount !== undefined
    ? invoice.currentBillingAmount
    : finalContractTotal - previousBillingTotal;
  const totalBilledAmount = previousBillingTotal + currentBillingTotal;
  const remainingAmount = finalContractTotal - totalBilledAmount;

  const originalTax = inclTax(originalContractTotal, taxRate);
  const changeTax = inclTax(changeAmount, taxRate);
  const finalTax = inclTax(finalContractTotal, taxRate);
  const previousTax = inclTax(previousBillingTotal, taxRate);
  const currentTax = inclTax(currentBillingTotal, taxRate);
  const totalBilledTax = inclTax(totalBilledAmount, taxRate);

  const deliveryLines = deliveryDescription
    ? deliveryDescription.split('\n')
    : [];
  // ensure at least 4 lines
  const displayLines = [...deliveryLines];
  while (displayLines.length < 4) displayLines.push('');

  const resolvedBankInfo = invoice.bankInfo || (settings.bankAccounts?.[0]?.info ?? '');
  const bankLines = resolvedBankInfo ? resolvedBankInfo.split('\n') : [];

  const companyAddress = settings.address
    ? settings.address.split('\n')
    : [];

  return (
    <div className="invoice-preview" id="invoice-print-area">
      {/* ── 1. タイトル行 ── */}
      <div className="inv-top">
        <div className="inv-title">納品書 兼 請求書</div>
        <div className="inv-meta">
          <div>請求書番号：{invoiceNumber}</div>
          <div>発　行　日：{formatDate(issueDate)}</div>
          <div>登録番号：T{settings.registrationNumber || ''}</div>
        </div>
      </div>

      {/* ── 2. ヘッダーグリッド ── */}
      <div className="inv-header-grid">
        {/* LEFT: 発注者 */}
        <div className="inv-client-area">
          {clientPostalCode && (
            <div>{formatPostal(clientPostalCode)}</div>
          )}
          {clientAddress && (
            <div style={{ whiteSpace: 'pre-line' }}>{clientAddress}</div>
          )}
          <div className="inv-client-name-row">
            <span className="inv-client-name">{clientName}&nbsp;御中</span>
          </div>
        </div>

        {/* RIGHT: 自社情報 */}
        <div className="inv-company-area">
          {settings.logoDataUrl && (
            <img src={settings.logoDataUrl} alt="ロゴ" className="inv-logo-img" />
          )}
          <div className="inv-company-name-block">
            <div className="inv-company-name">{settings.companyName}</div>
            {settings.companyNameEn && (
              <div className="inv-company-name-en">{settings.companyNameEn}</div>
            )}
            {settings.sealDataUrl && (
              <img src={settings.sealDataUrl} alt="角印" className="inv-seal-img" />
            )}
          </div>
          <div className="inv-company-details">
            {settings.postalCode && (
              <div>{formatPostal(settings.postalCode)}</div>
            )}
            {companyAddress.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
            {settings.tel && <div>TEL: {settings.tel}</div>}
            {settings.email && <div>{settings.email}</div>}
          </div>
        </div>
      </div>

      {/* ── 3. イントロ ── */}
      <div className="inv-intro">下記の通り成果品を納品しましたので、ご請求申し上げます。</div>

      {/* ── 4. Table 1: 業務名 + ご請求金額 ── */}
      <table className="inv-table" style={{ marginBottom: '6px' }}>
        <tbody>
          <tr>
            <th className="inv-th inv-th-w1">業務名</th>
            <td colSpan={3}>{projectName}</td>
          </tr>
          <tr className="inv-billing-row">
            <th className="inv-th-billing" style={{ background: '#1e3a5f', color: '#fff', textAlign: 'center', padding: '6px 8px', whiteSpace: 'nowrap', width: '80px' }}>
              ご請求金額<br /><span style={{ fontSize: '7pt' }}>(税込)</span>
            </th>
            <td colSpan={3} className="inv-td-billing" style={{ background: '#1e3a5f', color: '#fff', fontSize: '16pt', fontWeight: 700, textAlign: 'center', letterSpacing: '0.05em' }}>
              ¥ {formatCurrency(finalContractTotal)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── 5. Table 2: 注文金額 ── */}
      <table className="inv-table" style={{ marginBottom: '6px' }}>
        <tbody>
          <tr>
            <th className="inv-th-side" rowSpan={3}>注文金額</th>
            <td className="inv-sub-label">最終契約額</td>
            <td className="inv-amount">¥ {formatCurrency(finalContractTotal)}</td>
            <td colSpan={2} className="inv-tax-combined">(消費税({taxRate}%)　¥ {formatCurrency(finalTax)}&nbsp;を含む)</td>
          </tr>
          <tr>
            <td className="inv-sub-label">変更増減額</td>
            <td className="inv-amount">{changeAmount >= 0 ? '' : '▲ '}¥ {formatCurrency(Math.abs(changeAmount))}</td>
            <td colSpan={2} className="inv-tax-combined">(消費税({taxRate}%)　¥ {formatCurrency(Math.abs(changeTax))}&nbsp;を含む)</td>
          </tr>
          <tr>
            <td className="inv-sub-label">当初契約額</td>
            <td className="inv-amount">¥ {formatCurrency(originalContractTotal)}</td>
            <td colSpan={2} className="inv-tax-combined">(消費税({taxRate}%)　¥ {formatCurrency(originalTax)}&nbsp;を含む)</td>
          </tr>
        </tbody>
      </table>

      {/* ── 6. Table 3: 納品 ── */}
      <table className="inv-table" style={{ marginBottom: '6px' }}>
        <tbody>
          <tr>
            <th className="inv-th inv-th-w1">納品日</th>
            <td className="inv-date-cell">{formatDate(deliveryDate)}</td>
            <th className="inv-th inv-th-w2">納品担当者</th>
            <td>{deliveryPerson}</td>
          </tr>
          <tr>
            <th className="inv-th-side inv-th-delivery" style={{ whiteSpace: 'nowrap' }}>納品内容</th>
            <td colSpan={3} className="inv-delivery-content">
              {displayLines.map((line, i) => (
                <div key={i} className="inv-delivery-line">{line || '\u00a0'}</div>
              ))}
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── 7. Table 4: 請求額 ── */}
      <table className="inv-table" style={{ marginBottom: '6px' }}>
        <tbody>
          <tr>
            <th className="inv-th inv-th-w1">請求日</th>
            <td className="inv-date-cell inv-billing-date-cell" colSpan={2}>{formatDate(billingDate)}</td>
            <td colSpan={2} className="inv-billing-date-empty"></td>
          </tr>
          <tr>
            <th className="inv-th-side" rowSpan={4}>請求額</th>
            <td className="inv-sub-label">中間既請求額</td>
            <td className="inv-amount">¥ {formatCurrency(previousBillingTotal)}</td>
            <td colSpan={2} className="inv-tax-combined">(消費税({taxRate}%)　¥ {formatCurrency(previousTax)}&nbsp;を含む)</td>
          </tr>
          <tr className="inv-current-billing-row">
            <td className="inv-sub-label inv-sub-label-bold">今回請求額</td>
            <td className="inv-amount inv-amount-bold">¥ {formatCurrency(currentBillingTotal)}</td>
            <td colSpan={2} className="inv-tax-combined">(消費税({taxRate}%)　¥ {formatCurrency(currentTax)}&nbsp;を含む)</td>
          </tr>
          <tr>
            <td className="inv-sub-label">請求合計額</td>
            <td className="inv-amount">¥ {formatCurrency(totalBilledAmount)}</td>
            <td colSpan={2} className="inv-tax-combined">(消費税({taxRate}%)　¥ {formatCurrency(totalBilledTax)}&nbsp;を含む)</td>
          </tr>
          <tr>
            <td className="inv-sub-label">請求残額</td>
            <td className="inv-amount">¥ {formatCurrency(remainingAmount)}</td>
            <td colSpan={2} style={{ border: 'none' }}></td>
          </tr>
        </tbody>
      </table>

      {/* ── 8. Table 5: 振込先 ── */}
      <table className="inv-table" style={{ marginBottom: '6px' }}>
        <tbody>
          <tr>
            <th className="inv-th-side" style={{ whiteSpace: 'nowrap', verticalAlign: 'middle' }}>お振込先</th>
            <td className="inv-bank-info" style={{ whiteSpace: 'pre-line', textAlign: 'center' }}>
              {resolvedBankInfo}
            </td>
            <th className="inv-th" style={{ whiteSpace: 'nowrap', width: '90px' }}>お支払期限</th>
            <td className="inv-date-cell" style={{ whiteSpace: 'nowrap', textAlign: 'center' }}>
              {formatDate(paymentDueDate)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── 9. フッター ── */}
      <div className="inv-footer">{settings.companyNameEn}</div>
    </div>
  );
}
