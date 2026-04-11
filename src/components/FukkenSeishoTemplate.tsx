/**
 * 請書（提出用）テンプレートオーバーレイ
 * 背景画像: /templates/seisho.png（公式書式）
 * 変数テキストを mm 座標で絶対配置する
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
  // 発行日
  dateY:     47,
  dateYearX: 126,   // 年の数値左端
  dateMoX:   148,   // 月の数値左端
  dateDayX:  162,   // 日の数値左端

  // 乙 - 住所（郵便番号+住所）
  addrY:     83,
  addrX:     75,

  // 乙 - 社名
  companyY:  90,
  companyX:  75,

  // 乙 - 代表者名
  repY:      97,
  repX:      75,

  // 印（代表印画像）
  sealY:     82,
  sealX:     173,
  sealSize:  18,    // mm

  // 件番（NO. 後の値）
  jobNumY:   132,
  jobNumX:   47,

  // 件名
  projNameY: 147,
  projNameX: 27,

  // 工期 着工
  startY:    163,
  startYearX: 53,
  startMoX:   75,
  startDayX:  87,

  // 工期 竣工
  endY:      163,
  endYearX:  128,
  endMoX:    149,
  endDayX:   162,

  // 請負金額（一金〜円也 の間、右寄せ）
  totalY:    179,
  totalX:    55,
  totalW:    78,    // 金額フィールドの幅

  // 消費税額（右寄せ）
  taxY:      195,
  taxX:      55,
  taxW:      78,
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
  fontFamily: '"MS Mincho", "游明朝", "Yu Mincho", "IPAMincho", serif',
  fontSize: '10pt',
  lineHeight: 1,
  whiteSpace: 'nowrap',
};

export default function FukkenSeishoTemplate({ quotation, settings }: Props) {
  const issue  = dp(quotation.fukkenSeishoDate || quotation.date);
  const start  = dp(quotation.fukkenStartDate || '');
  const end    = dp(quotation.fukkenEndDate || '');

  const postalStr = settings.postalCode
    ? '〒' + settings.postalCode.replace(/^(\d{3})(\d+)$/, '$1-$2') + '　'
    : '';
  const addrStr = postalStr + (settings.address || '').replace('\n', '　');

  const totalFmt = quotation.total.toLocaleString('ja-JP');
  const taxFmt   = quotation.tax.toLocaleString('ja-JP');

  return (
    <div
      id="fukken-seisho-print-area"
      style={{
        width: '210mm',
        height: '297mm',
        position: 'relative',
        backgroundImage: 'url(/templates/seisho.png)',
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        overflow: 'hidden',
        backgroundColor: '#fff',
      }}
    >
      {/* 発行日 */}
      {issue && (
        <>
          <span style={{ ...TEXT, ...abs(COORD.dateY, COORD.dateYearX), width: '20mm', textAlign: 'right' }}>{issue.y}</span>
          <span style={{ ...TEXT, ...abs(COORD.dateY, COORD.dateMoX),  width: '10mm', textAlign: 'right' }}>{issue.m}</span>
          <span style={{ ...TEXT, ...abs(COORD.dateY, COORD.dateDayX), width: '8mm',  textAlign: 'right' }}>{issue.d}</span>
        </>
      )}

      {/* 住所 */}
      <span style={{ ...TEXT, ...abs(COORD.addrY, COORD.addrX), fontSize: '8.5pt' }}>{addrStr}</span>

      {/* 社名 */}
      <span style={{ ...TEXT, ...abs(COORD.companyY, COORD.companyX) }}>{settings.companyName}</span>

      {/* 代表者名 */}
      <span style={{ ...TEXT, ...abs(COORD.repY, COORD.repX) }}>{settings.representativeName}</span>

      {/* 代表印 */}
      {settings.repSealDataUrl
        ? <img src={settings.repSealDataUrl} alt="印"
            style={{ ...abs(COORD.sealY, COORD.sealX), width: `${COORD.sealSize}mm`, height: `${COORD.sealSize}mm`, objectFit: 'contain' }} />
        : null
      }

      {/* 件番 */}
      <span style={{ ...TEXT, ...abs(COORD.jobNumY, COORD.jobNumX) }}>
        {quotation.fukkenJobNumber || ''}
      </span>

      {/* 件名 */}
      <span style={{ ...TEXT, ...abs(COORD.projNameY, COORD.projNameX) }}>
        {quotation.fukkenProjectName || quotation.projectName}
      </span>

      {/* 工期 着工 */}
      {start && (
        <>
          <span style={{ ...TEXT, ...abs(COORD.startY, COORD.startYearX), width: '18mm', textAlign: 'right' }}>{start.y}</span>
          <span style={{ ...TEXT, ...abs(COORD.startY, COORD.startMoX),  width: '8mm',  textAlign: 'right' }}>{start.m}</span>
          <span style={{ ...TEXT, ...abs(COORD.startY, COORD.startDayX), width: '8mm',  textAlign: 'right' }}>{start.d}</span>
        </>
      )}

      {/* 工期 竣工 */}
      {end && (
        <>
          <span style={{ ...TEXT, ...abs(COORD.endY, COORD.endYearX), width: '18mm', textAlign: 'right' }}>{end.y}</span>
          <span style={{ ...TEXT, ...abs(COORD.endY, COORD.endMoX),  width: '8mm',  textAlign: 'right' }}>{end.m}</span>
          <span style={{ ...TEXT, ...abs(COORD.endY, COORD.endDayX), width: '8mm',  textAlign: 'right' }}>{end.d}</span>
        </>
      )}

      {/* 請負金額 */}
      <span style={{ ...TEXT, ...abs(COORD.totalY, COORD.totalX), width: `${COORD.totalW}mm`, textAlign: 'right', fontWeight: 'bold', fontSize: '11pt' }}>
        {totalFmt}
      </span>

      {/* 消費税額 */}
      <span style={{ ...TEXT, ...abs(COORD.taxY, COORD.taxX), width: `${COORD.taxW}mm`, textAlign: 'right' }}>
        {taxFmt}
      </span>
    </div>
  );
}
