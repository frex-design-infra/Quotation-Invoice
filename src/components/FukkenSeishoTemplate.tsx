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
  // 発行日（年月日ラベル行に合わせる）
  dateY:     60,    // 57→60（+3mm）
  dateYearX: 135,   // 126→135（+9mm: 年ラベル直前に揃える）
  dateMoX:   159,   // 148→159（+11mm: 年ラベルの後ろへ）
  dateDayX:  172,   // 162→171→175→172（-3mm）

  // 件番（NO. 後の値）
  jobNumY:   141,   // 138→141（+3mm）
  jobNumX:   65,    // 47→57→65

  // 件名
  projNameY: 152,   // 150→152（+2mm）
  projNameX: 55,    // 27→37→50→60→55

  // 工期 着工
  startY:    168,   // 163→168（+5mm）
  startYearX: 63,   // 53→63（+10mm）
  startMoX:   85,   // 75→85（+10mm）
  startDayX:  97,   // 87→97（+10mm）

  // 工期 竣工
  endY:      168,   // 163→168（+5mm）
  endYearX:  138,   // 128→138（+10mm）
  endMoX:    159,   // 149→159（+10mm）
  endDayX:   172,   // 162→172（+10mm）

  // 請負金額（一金〜円也 の間、右寄せ）
  totalY:    179,   // 正しい位置
  totalX:    55,
  totalW:    78,

  // 消費税額（右寄せ）
  taxY:      195,   // 正しい位置
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
  fontFamily: '"Meiryo", "Yu Gothic", "游ゴシック", "Hiragino Kaku Gothic ProN", sans-serif',
  fontSize: '10pt',
  lineHeight: 1,
  whiteSpace: 'nowrap',
};

export default function FukkenSeishoTemplate({ quotation, settings }: Props) {
  // 設定画面でアップロードした画像を優先、なければ /templates/seisho.png
  const templateSrc = settings.fukkenSeishoTemplateUrl || '/templates/seisho.png';
  const issue  = dp(quotation.fukkenSeishoDate || quotation.date);
  const start  = dp(quotation.fukkenStartDate || '');
  const end    = dp(quotation.fukkenEndDate || '');

  const totalFmt = quotation.total.toLocaleString('ja-JP');
  const taxFmt   = quotation.tax.toLocaleString('ja-JP');

  return (
    <div
      id="fukken-seisho-print-area"
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
      {issue && (
        <>
          <span style={{ ...TEXT, ...abs(COORD.dateY, COORD.dateYearX), width: '20mm', textAlign: 'right' }}>{issue.y}</span>
          <span style={{ ...TEXT, ...abs(COORD.dateY, COORD.dateMoX),  width: '10mm', textAlign: 'right' }}>{issue.m}</span>
          <span style={{ ...TEXT, ...abs(COORD.dateY, COORD.dateDayX), width: '8mm',  textAlign: 'right' }}>{issue.d}</span>
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
