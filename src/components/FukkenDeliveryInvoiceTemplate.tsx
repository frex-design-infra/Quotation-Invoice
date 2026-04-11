/**
 * 納品書 / 請求書（提出用）テンプレートオーバーレイ
 * 背景画像:
 *   納品書 → /templates/nouhinnsho.png
 *   請求書 → /templates/seikyusho.png
 *
 * テンプレート画像には住所・社名・代表者名・業者コード・登録番号が
 * 既に印刷されているため、変数データのみを重ねる。
 *
 * 座標調整: 各 COORD_* 定数を変更してください（単位: mm）
 */
import React from 'react';
import type { Quotation, MasterSettings } from '../types';

interface Props {
  quotation: Quotation;
  settings: MasterSettings;
  docType: 'delivery' | 'invoice';
}

// ─── 共通座標（納品書・請求書で同じ位置） ─────────────────────────
const COORD = {
  // 発行日（右上）
  dateY:       36,
  dateYearX:   151,
  dateMoX:     174,
  dateDayX:    188,

  // テーブル行の Y 座標（実測値に合わせて全体 -38mm 補正）
  jobNumY:     121,   // 156→121
  projNameY:   130,   // 167→130
  locationY:   139,   // 179→139

  amountY:     150,   // 190→150
  subtotalY:   161,   // 201→161
  taxY:        172,   // 213→172

  // テーブル左カラム（件番・件名・施工場所）の値 X
  jobNumX:     55,
  projNameX:   55,
  locationX:   55,

  // 金額セル
  valueX:      30,
  valueW:      85,    // 金額セルの幅（右寄せ用）

  // 業務内容（最大5行）
  workX:       20,
  workY0:      193,   // 231→193
  workLineH:    8,    // 行間

  // 納品書: 納期
  deliveryNaikiY:    150,   // 192→150（amountY と同列）
  deliveryYearX:     122,   // リセット
  deliveryMoX:       143,   // リセット
  deliveryDayX:      157,   // リセット

  // 請求書: 振込先テキスト（振込銀行欄の右側）
  bankX:       119,
  bankY:       187,
  bankW:        83,   // 幅（mm）
};
// ─────────────────────────────────────────────────────────────────

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

export default function FukkenDeliveryInvoiceTemplate({ quotation, settings, docType }: Props) {
  const isInvoice  = docType === 'invoice';
  // 設定画面でアップロードした画像を優先、なければ /templates/ のファイル
  const templateSrc = isInvoice
    ? (settings.fukkenSeikyushoTemplateUrl || '/templates/seikyusho.png')
    : (settings.fukkenNouhinTemplateUrl    || '/templates/nouhinnsho.png');
  const printId    = isInvoice ? 'fukken-invoice-print-area' : 'fukken-delivery-print-area';

  const issueDate = isInvoice
    ? dp(quotation.fukkenDeliveryInvoiceDate || quotation.fukkenDeliveryDate || '')
    : dp(quotation.fukkenDeliveryDate || quotation.fukkenDeliveryInvoiceDate || '');

  const deliveryDate = dp(quotation.fukkenDeliveryDate || '');

  const workLines = (quotation.fukkenWorkContent || '').split('\n').slice(0, 5);

  // 金額フォーマット
  const totalFmt   = quotation.total.toLocaleString('ja-JP');
  const subtotalFmt = quotation.subtotal.toLocaleString('ja-JP');
  const taxFmt     = quotation.tax.toLocaleString('ja-JP');

  // 振込先テキスト（請求書のみ）
  const bankInfo = settings.bankAccounts?.[0]?.info ?? '';

  return (
    <div
      id={printId}
      style={{
        width: '210mm',
        height: '297mm',
        position: 'relative',
        backgroundImage: `url(${templateSrc})`,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        overflow: 'hidden',
        backgroundColor: '#fff',
      }}
    >
      {/* 発行日 */}
      {issueDate && (
        <>
          <span style={{ ...TEXT, ...abs(COORD.dateY, COORD.dateYearX), width: '20mm', textAlign: 'right' }}>{issueDate.y}</span>
          <span style={{ ...TEXT, ...abs(COORD.dateY, COORD.dateMoX),   width: '10mm', textAlign: 'right' }}>{issueDate.m}</span>
          <span style={{ ...TEXT, ...abs(COORD.dateY, COORD.dateDayX),  width: '8mm',  textAlign: 'right' }}>{issueDate.d}</span>
        </>
      )}

      {/* 件番 */}
      <span style={{ ...TEXT, ...abs(COORD.jobNumY, COORD.jobNumX) }}>
        {quotation.fukkenJobNumber || ''}
      </span>

      {/* 件名 */}
      <span style={{ ...TEXT, ...abs(COORD.projNameY, COORD.projNameX) }}>
        {quotation.fukkenProjectName || quotation.projectName}
      </span>

      {/* 施工場所 */}
      <span style={{ ...TEXT, ...abs(COORD.locationY, COORD.locationX) }}>
        {quotation.fukkenLocation || ''}
      </span>

      {/* 金額（納品金額 or 請求金額）- 右寄せ */}
      <span style={{ ...TEXT, ...abs(COORD.amountY, COORD.valueX), width: `${COORD.valueW}mm`, textAlign: 'right', fontWeight: 'bold' }}>
        {totalFmt}
      </span>

      {/* 消費税率10%対象 */}
      <span style={{ ...TEXT, ...abs(COORD.subtotalY, COORD.valueX), width: `${COORD.valueW}mm`, textAlign: 'right' }}>
        {subtotalFmt}
      </span>

      {/* 内消費税額(10%) */}
      <span style={{ ...TEXT, ...abs(COORD.taxY, COORD.valueX), width: `${COORD.valueW}mm`, textAlign: 'right' }}>
        {taxFmt}
      </span>

      {/* 業務内容 */}
      {workLines.map((line, i) => (
        <span
          key={i}
          style={{ ...TEXT, ...abs(COORD.workY0 + i * COORD.workLineH, COORD.workX), fontSize: '9.5pt' }}
        >
          {line}
        </span>
      ))}

      {/* 納品書: 納期 */}
      {!isInvoice && deliveryDate && (
        <>
          <span style={{ ...TEXT, ...abs(COORD.deliveryNaikiY, COORD.deliveryYearX), width: '18mm', textAlign: 'right' }}>{deliveryDate.y}</span>
          <span style={{ ...TEXT, ...abs(COORD.deliveryNaikiY, COORD.deliveryMoX),  width: '8mm',  textAlign: 'right' }}>{deliveryDate.m}</span>
          <span style={{ ...TEXT, ...abs(COORD.deliveryNaikiY, COORD.deliveryDayX), width: '8mm',  textAlign: 'right' }}>{deliveryDate.d}</span>
        </>
      )}

      {/* 請求書: 振込先 */}
      {isInvoice && bankInfo && (
        <div
          style={{
            ...abs(COORD.bankY, COORD.bankX),
            width: `${COORD.bankW}mm`,
            fontFamily: '"Meiryo", "Yu Gothic", "游ゴシック", "Hiragino Kaku Gothic ProN", sans-serif',
            fontSize: '7.5pt',
            lineHeight: 1.6,
            whiteSpace: 'pre-line',
          }}
        >
          {bankInfo}
        </div>
      )}
    </div>
  );
}
