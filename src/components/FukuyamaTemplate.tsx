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
}

// ─── 座標定数（ずれた場合ここを調整） ────────────────────────────
const COORD = {
  // 請求日
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

  // 自社情報（右側）※上から: 郵便番号→住所1行目→住所2行目→会社名→代表者名
  addrX:       147,   // 郵便番号・住所の左端X
  addrW:       55,    // 住所右揃え幅（右端 ~202mm）
  postalY:     56,    // 〒郵便番号 top
  addr1Y:      59,    // 住所1行目 top
  addr2Y:      62,    // 住所2行目 top
  companyX:    137,   // 会社名・代表者名の左端X
  repNameX:    141,   // 代表者名のみ左端X
  companyW:    75,    // 幅
  companyY:    68.15, // 会社名 top
  repNameY:    77,    // 代表者名 top

  // 角印 (sealDataUrl)
  kakuinY:    50,
  kakuinX:    160,
  kakuinSize: 22,

  // 丸印・代表印 (repSealDataUrl)
  maruinY:    55,
  maruinX:    135,
  maruinSize: 22,
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

export default function FukuyamaTemplate({ quotation, settings }: Props) {
  const templateSrc = quotation.fukuyamaTemplateUrl ?? '';
  const issueDate = dp(quotation.fukuyamaIssueDate || quotation.date || '');

  const totalFmt    = quotation.total.toLocaleString('ja-JP');
  const subtotalFmt = quotation.subtotal.toLocaleString('ja-JP');
  const taxFmt      = quotation.tax.toLocaleString('ja-JP');

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

      {/* 発行日 */}
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
          <span key={i} style={{ ...TEXT_SM, ...abs(ys[i], COORD.addrX), width: `${COORD.addrW}mm`, textAlign: 'right' }}>
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
