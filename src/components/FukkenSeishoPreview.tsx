import React from 'react';
import type { Quotation, MasterSettings } from '../types';
import { formatCurrency } from '../utils/calculations';

interface Props {
  quotation: Quotation;
  settings: MasterSettings;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '　　　年　　月　　日';
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

function formatPostal(pc: string): string {
  if (!pc) return '';
  const s = pc.replace(/[^0-9]/g, '');
  if (s.length === 7) return `〒${s.slice(0, 3)}-${s.slice(3)}`;
  return `〒${pc}`;
}

export default function FukkenSeishoPreview({ quotation, settings }: Props) {
  const addressLines = settings.address ? settings.address.split('\n') : [];

  return (
    <div className="fks-page" id="fukken-seisho-print-area">

      {/* 印紙欄（左上） */}
      <div className="fks-inshi-box">
        <span>印</span>
        <span>紙</span>
      </div>

      {/* タイトル */}
      <div className="fks-title">請　　　　書（提　出　用）</div>

      {/* 発行日（右寄せ） */}
      <div className="fks-date">
        {formatDate(quotation.fukkenSeishoDate || quotation.date)}
      </div>

      {/* 甲 */}
      <div className="fks-kou">
        甲　　<span className="fks-kou-client">株 式 会 社　復建技術コンサルタント　御 中</span>
      </div>

      {/* 乙（ボーダーなし・インデント） */}
      <div className="fks-otsu-area">
        <div className="fks-otsu-content">
          <div className="fks-otsu-heading">乙　請負者</div>
          <div className="fks-otsu-field">
            <span className="fks-otsu-lbl">住　　所</span>
            <span className="fks-otsu-val">
              {settings.postalCode ? formatPostal(settings.postalCode) + '　' : ''}
              {addressLines.join('　')}
            </span>
          </div>
          <div className="fks-otsu-field">
            <span className="fks-otsu-lbl">社　　名</span>
            <span className="fks-otsu-val">{settings.companyName}</span>
          </div>
          <div className="fks-otsu-field">
            <span className="fks-otsu-lbl">代表者名</span>
            <span className="fks-otsu-val">{settings.representativeName}</span>
          </div>
        </div>
        <div className="fks-otsu-seal">
          {settings.repSealDataUrl
            ? <img src={settings.repSealDataUrl} alt="印" className="fks-seal-img" />
            : <span className="fks-seal-circle">㊞</span>
          }
        </div>
      </div>

      {/* 項目テーブル */}
      <table className="fks-table">
        <colgroup>
          <col style={{ width: '28px' }} />
          <col style={{ width: '64px' }} />
          <col />
        </colgroup>
        <tbody>

          {/* 件番（番号なし） */}
          <tr>
            <td className="fks-num"></td>
            <td className="fks-lbl">件　　番</td>
            <td className="fks-val fks-ul">NO,{quotation.fukkenJobNumber || ''}</td>
          </tr>

          {/* 1. 件名 */}
          <tr>
            <td className="fks-num">1.</td>
            <td className="fks-lbl">件　　名</td>
            <td className="fks-val fks-ul">{quotation.fukkenProjectName || quotation.projectName}</td>
          </tr>

          {/* 2. 工期 */}
          <tr>
            <td className="fks-num">2.</td>
            <td className="fks-lbl">工　　期</td>
            <td className="fks-val">
              （着工）<strong className="fks-date-bold">{formatDate(quotation.fukkenStartDate || '')}</strong>
              　　（竣工）<strong className="fks-date-bold">{formatDate(quotation.fukkenEndDate || '')}</strong>
            </td>
          </tr>

          {/* 3. 請負金額 */}
          <tr>
            <td className="fks-num">3.</td>
            <td className="fks-lbl">請負金額</td>
            <td className="fks-val">
              <div className="fks-kinku fks-ul">
                <span className="fks-kinku-hitokane">一金</span>
                <span className="fks-kinku-amount">{formatCurrency(quotation.total)}</span>
                <span className="fks-kinku-yen">円也</span>
              </div>
              <div className="fks-tax-block">
                <div className="fks-tax-label">うち取引に係る<br />消費税等額</div>
                <div className="fks-tax-right">
                  <div className="fks-kinku fks-ul">
                    <span className="fks-kinku-amount">{formatCurrency(quotation.tax)}</span>
                    <span className="fks-kinku-yen">円也</span>
                  </div>
                  <div className="fks-tax-rate">（消費税率　10%）</div>
                </div>
              </div>
            </td>
          </tr>

          {/* 4. 支払条件 */}
          <tr>
            <td className="fks-num">4.</td>
            <td className="fks-lbl">支払条件</td>
            <td className="fks-val">甲の条件による</td>
          </tr>

          {/* 5. その他 */}
          <tr>
            <td className="fks-num">5.</td>
            <td className="fks-lbl">そ の 他</td>
            <td className="fks-val" style={{ height: '24px' }}></td>
          </tr>

        </tbody>
      </table>

      {/* フッター */}
      <div className="fks-footer">
        上記の業務については、貴社の業務諸条件を遵守し、誠意を<br />
        もって施工いたします。<br />
        　よって、請書を提出いたします。
      </div>

    </div>
  );
}
