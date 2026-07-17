/**
 * 福山コンサルタント 納品書兼請求書テンプレートオーバーレイ
 * 背景画像: 業務ごとにアップロードした画像（Supabase Storage）
 * 変数データ（金額・日付・自社情報・印影）のみを重ねる
 *
 * 座標調整: 各 COORD_* 定数を変更してください（単位: mm）
 */
import React from 'react';
import type { Quotation, MasterSettings } from '../types';

interface Props {
  quotation: Quotation;
  settings: MasterSettings;
  originalContractTotal?: number; // 契約金額（変更見積がある場合は最新変更見積合計、なければ元見積合計）。請求残額 = 契約金額 - 今回請求額
}

// ─── 座標定数（ずれた場合ここを調整） ────────────────────────────
const COORD = {
  // 請求日（日付一式 +15mm下・+2mm右 2026-07-17 ※福山 納品書兼請求書）
  dateY:      200.2, // 181.2→200.2 (+15,追加+4mm下 計+19mm 2026-07-17)
  dateYearX:  25,    // 23→25 (+2mm右)
  dateMoX:    50,    // 48→50 (+2mm右)
  dateDayX:   66.5,  // 64.5→66.5 (+2mm右)

  // ── 金額テーブル ─────────────────────────────────────────────
  // 共通：金額列（右揃え）
  amtX:       -3,    // -5→-3 (各金額一式 +2mm右 2026-07-17)
  amtW:       100,

  // 1. 既請求額
  prevBillY:  222.4, // 205.4→222.4 (+15,追加+2mm下 計+17mm 2026-07-17)

  // 2. 今回請求額 / うち消費税
  currBillY:  232.9, // 217.9→232.9 (+15mm下)
  taxColX:    117,   // うち消費税 列 X（115→117 +2mm右）
  taxColW:    50,    // うち消費税 列 幅

  // 3. 請求合計
  totalBillY: 244.5, // 229.5→244.5 (+15mm下)

  // 4. 請求残額
  remainY:    252.3, // 238.3→252.3 (+15下,追加-1mm上 計+14mm 2026-07-17)

  // 自社情報（右側）※上から: 郵便番号→住所1行目→住所2行目→会社名→代表者名
  addrX:       137,   // 郵便番号・住所の左端X
  addrW:       55,    // 住所右揃え幅（右端 ~202mm）
  postalY:     51.0,  // 〒郵便番号 top（58→51.0 合計-7.0mm上げ: -3.5,-1.5,-2.0 2026-07-17）
  addr1Y:      54.0,  // 住所1行目 top（61→54.0 -7.0mm）
  addr2Y:      57.0,  // 住所2行目 top（64→57.0 -7.0mm）
  companyX:    137,   // 会社名・代表者名の左端X
  repNameX:    141,   // 代表者名のみ左端X
  companyW:    75,    // 幅
  companyY:    60.15, // 会社名 top（67.15→60.15 -7.0mm）
  repNameY:    68.0,  // 代表者名 top（75→68.0 -7.0mm）

  // 角印 (sealDataUrl) ※他様式(112px≒30mm)に合わせてサイズUP。中心維持のためX/Yを-4mm補正
  kakuinY:    45.0,   // 角印 top（52→45.0 合計-7.0mm上げ 2026-07-17）
  kakuinX:    142,
  kakuinSize: 30,

  // 丸印・代表印 (repSealDataUrl) ※他様式(96px≒25mm)に合わせてサイズUP。中心維持のためX/Yを-1.5mm補正
  maruinY:    58.5,   // 丸印 top（65.5→58.5 合計-7.0mm上げ 2026-07-17）
  maruinX:    167.5,  // ちょっとだけ右に移動（+2mm）
  maruinSize: 25,
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

const TEXT_SM: React.CSSProperties = {
  ...TEXT,
  fontSize: '8pt',
};

const AMT: React.CSSProperties = { ...TEXT, textAlign: 'right' };

export default function FukuyamaTemplate({ quotation, settings, originalContractTotal }: Props) {
  const templateSrc = quotation.fukuyamaTemplateUrl ?? '';
  const issueDate = dp(quotation.fukuyamaIssueDate || quotation.date || '');

  // 今回請求額 = q.total（中間請求書の場合は中間見積金額に上書き済み）
  const currBill   = quotation.total;
  const currTax    = quotation.tax;
  const prevBill   = 0;
  const totalBill  = prevBill + currBill;
  const origTotal  = originalContractTotal ?? quotation.total;
  const remain     = origTotal - currBill;

  const fmt = (n: number) => n.toLocaleString('ja-JP');

  return (
    <div
      id="fukuyama-print-area"
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

      {/* 請求日 */}
      {issueDate && (
        <>
          <span style={{ ...TEXT, ...abs(COORD.dateY, COORD.dateYearX), width: '20mm', textAlign: 'right' }}>{issueDate.y}</span>
          <span style={{ ...TEXT, ...abs(COORD.dateY, COORD.dateMoX),   width: '10mm', textAlign: 'right' }}>{issueDate.m}</span>
          <span style={{ ...TEXT, ...abs(COORD.dateY, COORD.dateDayX),  width: '8mm',  textAlign: 'right' }}>{issueDate.d}</span>
        </>
      )}

      {/* 1. 既請求額 */}
      <span style={{ ...AMT, ...abs(COORD.prevBillY, COORD.amtX), width: `${COORD.amtW}mm` }}>
        {fmt(prevBill)}
      </span>

      {/* 2. 今回請求額 */}
      <span style={{ ...AMT, ...abs(COORD.currBillY, COORD.amtX), width: `${COORD.amtW}mm`, fontWeight: 'bold' }}>
        {fmt(currBill)}
      </span>
      {/* うち消費税 */}
      <span style={{ ...AMT, ...abs(COORD.currBillY, COORD.taxColX), width: `${COORD.taxColW}mm` }}>
        {fmt(currTax)}
      </span>

      {/* 3. 請求合計 */}
      <span style={{ ...AMT, ...abs(COORD.totalBillY, COORD.amtX), width: `${COORD.amtW}mm` }}>
        {fmt(totalBill)}
      </span>

      {/* 4. 請求残額 */}
      <span style={{ ...AMT, ...abs(COORD.remainY, COORD.amtX), width: `${COORD.amtW}mm` }}>
        {fmt(remain)}
      </span>

      {/* 自社情報 — 郵便番号・住所2行（右揃え） */}
      {settings.postalCode && (
        <span style={{ ...TEXT_SM, ...abs(COORD.postalY, COORD.addrX), width: `${COORD.addrW}mm` }}>
          〒{settings.postalCode}
        </span>
      )}
      {settings.address && (() => {
        const lines = settings.address.split('\n');
        const ys = [COORD.addr1Y, COORD.addr2Y];
        return lines.slice(0, 2).map((line, i) => (
          <span key={i} style={{ ...TEXT_SM, ...abs(ys[i], COORD.addrX), width: `${COORD.addrW}mm`, textAlign: i === 1 ? 'right' : 'left' }}>
            {line}
          </span>
        ));
      })()}
      {settings.companyName && (
        <span style={{ ...TEXT, ...abs(COORD.companyY, COORD.companyX), width: `${COORD.companyW}mm`, fontWeight: 'bold' }}>
          {settings.companyName}
        </span>
      )}
      {settings.representativeName && (
        <span style={{ ...TEXT_SM, ...abs(COORD.repNameY, COORD.repNameX), width: `${COORD.companyW}mm` }}>
          {settings.representativeName}
        </span>
      )}

      {/* 角印 */}
      {settings.sealDataUrl && (
        <img
          src={settings.sealDataUrl}
          alt="角印"
          style={{
            ...abs(COORD.kakuinY, COORD.kakuinX),
            width: `${COORD.kakuinSize}mm`,
            height: `${COORD.kakuinSize}mm`,
            objectFit: 'contain',
            opacity: 0.85,
          }}
        />
      )}

      {/* 丸印（代表印） */}
      {settings.repSealDataUrl && (
        <img
          src={settings.repSealDataUrl}
          alt="代表印"
          style={{
            ...abs(COORD.maruinY, COORD.maruinX),
            width: `${COORD.maruinSize}mm`,
            height: `${COORD.maruinSize}mm`,
            objectFit: 'contain',
            opacity: 0.85,
          }}
        />
      )}

    </div>
  );
}
