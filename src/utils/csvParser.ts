import Papa from 'papaparse';
import type { BridgeData } from '../types';

/** CSVファイルを解析して橋梁データを返す
 *  必須列: 橋長 (数値、m)
 *  任意列: 橋梁名, 橋名, name など
 */
export function parseBridgeCSV(file: File): Promise<{ data: BridgeData[]; errors: string[] }> {
  return new Promise(resolve => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const errors: string[] = [];
        const data: BridgeData[] = [];

        if (!result.data || result.data.length === 0) {
          resolve({ data: [], errors: ['CSVデータが空です'] });
          return;
        }

        const sample = result.data[0] as Record<string, string>;
        const headers = Object.keys(sample);

        // ヘッダーを正規化（全角・半角スペース除去）
        const normalize = (s: string) => s.trim().replace(/[\s\u3000]+/g, '');

        // 橋長列を探す
        const lengthCol = headers.find(h => {
          const n = normalize(h);
          return n === '橋長' || n === '橋長(m)' || n === '橋長（m）' || n.toLowerCase() === 'length';
        });
        if (!lengthCol) {
          resolve({ data: [], errors: [`橋長列が見つかりません。列名: ${headers.join(', ')}`] });
          return;
        }

        // 橋名列を探す（なければ連番）
        const nameCol = headers.find(h =>
          ['橋梁名', '橋名', '名称', 'name', '橋梁名称'].includes(normalize(h))
        );

        (result.data as Record<string, string>[]).forEach((row, idx) => {
          const rawLength = row[lengthCol]?.trim();
          if (!rawLength) return;
          const length = parseFloat(rawLength.replace(/[^\d.]/g, ''));
          if (isNaN(length) || length <= 0) {
            errors.push(`行 ${idx + 2}: 橋長が無効な値です (${rawLength})`);
            return;
          }
          const name = nameCol ? row[nameCol]?.trim() || `橋梁${idx + 1}` : `橋梁${idx + 1}`;
          data.push({ name, length });
        });

        resolve({ data, errors });
      },
      error: (err) => {
        resolve({ data: [], errors: [err.message] });
      },
    });
  });
}
