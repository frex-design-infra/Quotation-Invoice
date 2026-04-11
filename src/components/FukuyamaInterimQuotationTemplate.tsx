/**
 * 福山コンサルタント 中間見積書テンプレートオーバーレイ
 * 背景画像: 業務ごとにアップロードした画像（Supabase Storage）
 * 変数データ（金額・日付）のみを重ねる
 */
import React from 'react';
import type { Quotation } from '../types';

interface Props {
  quotation: Quotation;
}

// ─── 座標定数（ずれた場合ここを調整） ────────────────────────────
const COORD = {
  // 見積日
  dateY:      213,
  dateYearX:  100,
  dateMoX:    122,
  dateDayX:   135,

  // 金額（合計）
  totalY:     150,
  totalX:     30,
  totalW:     85,

  // 消費税率10%対象
  subtotalY:  161,
  subtotalX:  30,
  subtotalW:  85,

  // 内消費税額
  taxY:       172,
  taxX:       30,
  taxW:       85,
};
// ────────────────────────────────────────────────────────────────

function dp(str: string) {
  if (!str) return null;
  const d = new Date(str + 'T00:00:00');
  return { y: String(d.getFullYear()), m: String(d.getMonth() + 1), d: String(d.getDate()) };
}

function abs(top: number, left: number, extra?: React.CSSProperties): React.CSSProperties {
  return { position: 'absolute', top: `${top}mm`, left: `${left}mm`, ...extra };
}

const TEXT: React.CSSProperties = {
  fontFamily: '"Meiryo", "Yu Gothic", "游ゴシック", "Hiragino Kaku Gothic ProN", sans-serif',
  fontSize: '10pt',
  lineHeight: 1,
  whiteSpace: 'nowrap',
};

export default function FukuyamaInterimQuotationTemplate({ quotation }: Props) {
  const templateSrc = quotation.fukuyamaInterimQuotationTemplateUrl ?? '';
  const issueDate = dp(quotation.fukuyamaInterimQuotationIssueDate || quotation.date || '');

  const totalFmt    = quotation.total.toLocaleString('ja-JP');
  const subtotalFmt = quotation.subtotal.toLocaleString('ja-JP');
  const taxFmt      = quotation.tax.toLocaleString('ja-JP');

  return (
    <div
      id="fukuyama-interim-print-area"
      style={{
        width: '210mm',
        height: '297mm',
        position: 'relative',
        backgroundImage: templateSrc ? `url(${templateSrc})` : 'none',
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        overflow: 'hidden',
        backgroundColor: '#fff',
        border: templateSrc ? 'none' : '1px dashed #ccc',
      }}
    >
      {!templateSrc && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#aaa', fontSize: '14pt' }}>
          テンプレート画像をアップロードしてください
        </div>
      )}

      {/* 見積日 */}
      {issueDate && (
        <>
          <span style={{ ...TEXT, ...abs(COORD.dateY, COORD.dateYearX), width: '20mm', textAlign: 'right' }}>{issueDate.y}</span>
          <span style={{ ...TEXT, ...abs(COORD.dateY, COORD.dateMoX),   width: '10mm', textAlign: 'right' }}>{issueDate.m}</span>
          <span style={{ ...TEXT, ...abs(COORD.dateY, COORD.dateDayX),  width: '8mm',  textAlign: 'right' }}>{issueDate.d}</span>
        </>
      )}

      {/* 合計金額 */}
      <span style={{ ...TEXT, ...abs(COORD.totalY, COORD.totalX), width: `${COORD.totalW}mm`, textAlign: 'right', fontWeight: 'bold' }}>
        {totalFmt}
      </span>

      {/* 消費税率10%対象 */}
      <span style={{ ...TEXT, ...abs(COORD.subtotalY, COORD.subtotalX), width: `${COORD.subtotalW}mm`, textAlign: 'right' }}>
        {subtotalFmt}
      </span>

      {/* 内消費税額 */}
      <span style={{ ...TEXT, ...abs(COORD.taxY, COORD.taxX), width: `${COORD.taxW}mm`, textAlign: 'right' }}>
        {taxFmt}
      </span>

    </div>
  );
}
