import type { Quotation } from '../types';

function escapeCell(value: string | number): string {
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function buildQuotationListCSV(quotations: Quotation[]): string {
  const headers = [
    '見積番号', '見積日', '点検種別', '発注者区分', '発注者名',
    '件名', '橋梁数/基数', '合計金額（税込）', '提出状況', '作成日',
  ];

  const rows = quotations.map(q => [
    q.quotationNumber,
    q.date,
    q.inspectionType ?? '橋梁点検',
    q.ordererCategory,
    q.clientName,
    q.projectName,
    q.inspectionType === '道路附属物点検' ? q.roadAccessoryCount : q.bridges.length,
    q.total,
    q.submitted ? '提出済' : '未提出',
    q.createdAt.slice(0, 10),
  ]);

  const lines = [headers, ...rows].map(row => row.map(escapeCell).join(','));
  // UTF-8 BOM付き（Excelで文字化けしないように）
  return '\uFEFF' + lines.join('\r\n');
}

export async function downloadCSV(content: string, filename: string): Promise<void> {
  if ('showSaveFilePicker' in window) {
    try {
      const handle = await (window as Window & typeof globalThis & {
        showSaveFilePicker: (opts?: object) => Promise<FileSystemFileHandle>;
      }).showSaveFilePicker({
        suggestedName: filename,
        types: [{ description: 'CSVファイル', accept: { 'text/csv': ['.csv'] } }],
      });
      const writable = await handle.createWritable();
      await writable.write(new Blob([content], { type: 'text/csv;charset=utf-8;' }));
      await writable.close();
      return;
    } catch (e) {
      if ((e as Error).name === 'AbortError') return; // ユーザーがキャンセル
    }
  }
  // フォールバック：通常のダウンロード
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
