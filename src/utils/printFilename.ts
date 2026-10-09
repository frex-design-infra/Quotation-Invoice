// 印刷→「PDFに保存」時のデフォルトファイル名を制御するユーティリティ。
//
// 仕組み: ブラウザの印刷ダイアログは、開いた瞬間の document.title を
// 「PDFに保存」の候補ファイル名として使う。そこで印刷直前に document.title を
// 目的のファイル名へ差し替え、印刷後（afterprint）に元へ復元する。

/** ファイル名に使えない文字をアンダースコアへ置換し、余分な空白を整理する */
export function sanitizeFilename(name: string): string {
  return name
    .replace(/[\\/:*?"<>|]/g, '_') // Windows/macで不正なファイル名文字
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * document.title を一時的に name へ差し替えてから印刷ダイアログを開く。
 * 印刷ダイアログを閉じると afterprint で元のタイトルへ復元する。
 * afterprint が発火しない環境のための保険として setTimeout でも復元する
 * （ダイアログは開いた瞬間の title を使うため、後から戻しても候補名は変わらない）。
 */
export function printWithFilename(name: string): void {
  const original = document.title;
  const next = sanitizeFilename(name);
  document.title = next || original;

  let done = false;
  const restore = () => {
    if (done) return;
    done = true;
    document.title = original;
    window.removeEventListener('afterprint', restore);
  };

  window.addEventListener('afterprint', restore);
  setTimeout(restore, 1500);

  window.print();
}
