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
    <div className="fukken-page" id="fukken-seisho-print-area">
      {/* タイトル */}
      <div className="fk-title-row">
        <div className="fk-title">請　　書（提出用）</div>
        <div className="fk-issue-date">{formatDate(quotation.fukkenSeishoDate || quotation.date)}</div>
      </div>

      {/* 甲 */}
      <div className="fk-kou-line">
        甲　　株式会社　復建技術コンサルタント　御中
      </div>

      {/* 乙（自社情報ボックス） */}
      <div className="fk-otsu-box">
        <div className="fk-otsu-label">乙</div>
        <div className="fk-otsu-fields">
          <div className="fk-otsu-row">
            <span className="fk-otsu-key">住　　所</span>
            <span className="fk-otsu-val">
              {settings.postalCode && <>{formatPostal(settings.postalCode)}&nbsp;</>}
              {addressLines.join('　')}
            </span>
          </div>
          <div className="fk-otsu-row">
            <span className="fk-otsu-key">会　社　名</span>
            <div className="fk-otsu-name-seal">
              <span className="fk-otsu-val">{settings.companyName}</span>
              {settings.repSealDataUrl ? (
                <img src={settings.repSealDataUrl} alt="代表印" className="fk-seal-img" />
              ) : (
                <div className="fk-seal-placeholder">㊞</div>
              )}
            </div>
          </div>
          <div className="fk-otsu-row">
            <span className="fk-otsu-key">代表者名</span>
            <span className="fk-otsu-val">{settings.representativeName}</span>
          </div>
        </div>
      </div>

      {/* 本文 */}
      <div className="fk-body">
        {/* 1. 件番 */}
        <div className="fk-item">
          <span className="fk-num">1．</span>
          <span className="fk-item-label">件　　番</span>
          <span className="fk-item-val">
            NO.{quotation.fukkenJobNumber || '　　　　　　　　　'}
          </span>
        </div>

        {/* 2. 件名 */}
        <div className="fk-item">
          <span className="fk-num">2．</span>
          <span className="fk-item-label">件　　名</span>
          <span className="fk-item-val">{quotation.projectName}</span>
        </div>
        <div className="fk-item-sub">
          （工期（着工）{formatDate(quotation.fukkenStartDate || '')}　（竣工）{formatDate(quotation.fukkenEndDate || '')}）
        </div>

        {/* 3. 請負金額 */}
        <div className="fk-item">
          <span className="fk-num">3．</span>
          <span className="fk-item-label">請負金額</span>
          <span className="fk-item-val fk-amount-line">
            一金　{formatCurrency(quotation.total)}　円也
          </span>
        </div>
        <div className="fk-item-sub2">
          <div>5%取引に係る</div>
          <div className="fk-tax-line">
            消費税額　{formatCurrency(quotation.tax)}　円也
          </div>
          <div>（消費税10%）</div>
        </div>

        {/* 4. 支払条件 */}
        <div className="fk-item">
          <span className="fk-num">4．</span>
          <span className="fk-item-label">支払条件</span>
          <span className="fk-item-val">甲の条件による</span>
        </div>

        {/* 5. その他 */}
        <div className="fk-item">
          <span className="fk-num">5．</span>
          <span className="fk-item-label">そ の 他</span>
        </div>
      </div>

      {/* フッターテキスト */}
      <div className="fk-footer-text">
        上記の業務について、弊社の業務遂行条件を遵守し、誠意をもって施工いたします。<br />
        よって、請書を提出いたします。
      </div>
    </div>
  );
}
