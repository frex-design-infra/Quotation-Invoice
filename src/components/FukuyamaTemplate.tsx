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
  billingType?: 'single' | 'interim' | 'final'; // 完了時最終請求(final)のみ既請求額=中間・今回=契約-中間・残額=0
  interimBillingTotal?: number;   // 中間請求額（税込）＝福山中間見積の税込合計。final時の既請求額に使用
}

// ─── 座標定数（ずれた場合ここを調整） ────────────────────────────
const COORD = {
  // 請求日（日付一式 +15mm下・+2mm右 2026-07-17 ※福山 納品書兼請求書）
  dateY:      200.2, // 181.2→200.2 (+15,追加+4mm下 計+19mm 2026-07-17)
  dateYearX:  26.0,  // 23→25→24.5→25.5→26.0 (年のみ最終調整 2026-07-17)
  dateMoX:    50,    // 48→50 (+2mm右)
  dateDayX:   66.5,  // 64.5→66.5 (+2mm右)

  // 第[ ]回 請求分（回数）: 完了final=2 / 中間interim=1 / 一括single=空。位置は推定・要目視調整
  billingRoundX: 110,   // 回数の左端X（推定）
  billingRoundY: 200.5, // 回数 top（199.5→201.5→200.5 実質+1mm下 2026-07-17）

  // ── 納品情報（納品日・担当者・品目）2026-07-17 追加 ※座標は推定・要目視調整 ──
  deliveryDateY:      151.5, // 納品日 行 top（150→151.5 下+1.5mm 2026-07-17）
  deliveryYearX:      50,   // 納品日 年
  deliveryMoX:        72,   // 納品日 月
  deliveryDayX:       92,   // 納品日 日
  deliveryPersonY:    151.5, // 納品担当者 top（150→151.5 下+1.5mm 2026-07-17）
  deliveryPersonX:    155,  // 納品担当者 左端X
  deliveryItemsX:     45,   // 納品品目・内訳 左端X
  deliveryItemsY:     165,  // 納品品目 1行目 top
  deliveryItemsLineH: 8,    // 納品品目 行間

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

export default function FukuyamaTemplate({ quotation, settings, originalContractTotal, billingType, interimBillingTotal }: Props) {
  const templateSrc = quotation.fukuyamaTemplateUrl ?? '';
  const issueDate = dp(quotation.fukuyamaIssueDate || quotation.date || '');
  const deliveryDate = dp(quotation.fukuyamaDeliveryDate || '');
  const deliveryItemLines = (quotation.fukuyamaDeliveryItems || '').split('\n').slice(0, 3);

  const origTotal = originalContractTotal ?? quotation.total; // 最終契約額（税込）

  // ── 金額計算 ──────────────────────────────────────────────
  // 完了時最終請求(final): 既請求額=中間請求額 / 今回=最終契約額−中間 / うち消費税=今回(税込)の10% / 残額=0
  // それ以外(single・中間請求書interim): 従来どおり（q.total を今回請求額に使用）
  let currBill: number;  // 今回請求額（税込）
  let currTax: number;   // うち消費税
  let prevBill: number;  // 既請求額
  if (billingType === 'final') {
    prevBill = interimBillingTotal ?? 0;              // 既請求額 = 中間請求額（税込）
    currBill = origTotal - prevBill;                  // 今回請求額 = 最終契約額 − 中間請求額
    currTax  = currBill - Math.round(currBill / 1.1); // うち消費税 = 今回請求額(税込)から10%抽出
  } else {
    currBill = quotation.total;                       // 中間請求書は中間見積金額に上書き済み
    currTax  = quotation.tax;
    prevBill = 0;
  }
  const totalBill = prevBill + currBill;              // 請求合計
  const remain    = origTotal - totalBill;            // 請求残額（final時は0）

  const fmt = (n: number) => n.toLocaleString('ja-JP');

  // 第[ ]回 請求分の回数: 完了(final)=2 / 中間請求(interim)=1 / それ以外(一括single)=空
  const billingRound = billingType === 'final' ? '2' : billingType === 'interim' ? '1' : '';

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

      {/* 第[ ]回 請求分（回数）: 完了=2 / 中間=1 / 一括=空 */}
      {billingRound && (
        <span style={{ ...TEXT, ...abs(COORD.billingRoundY, COORD.billingRoundX), width: '8mm', textAlign: 'center' }}>
          {billingRound}
        </span>
      )}

      {/* 納品日（年月日） */}
      {deliveryDate && (
        <>
          <span style={{ ...TEXT, ...abs(COORD.deliveryDateY, COORD.deliveryYearX), width: '18mm', textAlign: 'right' }}>{deliveryDate.y}</span>
          <span style={{ ...TEXT, ...abs(COORD.deliveryDateY, COORD.deliveryMoX),  width: '8mm',  textAlign: 'right' }}>{deliveryDate.m}</span>
          <span style={{ ...TEXT, ...abs(COORD.deliveryDateY, COORD.deliveryDayX), width: '8mm',  textAlign: 'right' }}>{deliveryDate.d}</span>
        </>
      )}

      {/* 納品担当者 */}
      {quotation.fukuyamaDeliveryPerson && (
        <span style={{ ...TEXT, ...abs(COORD.deliveryPersonY, COORD.deliveryPersonX), width: '48mm' }}>
          {quotation.fukuyamaDeliveryPerson}
        </span>
      )}

      {/* 納品品目・内訳（最大3行） */}
      {deliveryItemLines.map((line, i) => (
        <span
          key={i}
          style={{ ...TEXT, ...abs(COORD.deliveryItemsY + i * COORD.deliveryItemsLineH, COORD.deliveryItemsX), fontSize: '9.5pt' }}
        >
          {line}
        </span>
      ))}

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
