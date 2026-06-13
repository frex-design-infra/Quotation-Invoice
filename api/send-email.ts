// Vercel Serverless Function：承認ワークフローの通知メール送信
// Resend API を使用。APIキーは Vercel 環境変数（RESEND_API_KEY）に置く。
// ※ このファイルはサーバー側で実行される。APIキーはクライアントに露出しない。

/* eslint-disable @typescript-eslint/no-explicit-any */

function esc(s: string): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildHtml(p: any): string {
  const yen = typeof p.total === 'number' ? `¥${Number(p.total).toLocaleString('ja-JP')}` : '';
  const rows = [
    p.quotationNumber ? `<tr><td style="color:#888;padding:2px 12px 2px 0;">見積番号</td><td>${esc(p.quotationNumber)}</td></tr>` : '',
    p.clientName ? `<tr><td style="color:#888;padding:2px 12px 2px 0;">発注者</td><td>${esc(p.clientName)}</td></tr>` : '',
    yen ? `<tr><td style="color:#888;padding:2px 12px 2px 0;">金額</td><td>${esc(yen)}</td></tr>` : '',
  ].join('');
  return `<!DOCTYPE html><html lang="ja"><body style="margin:0;background:#f5f4f2;font-family:'Hiragino Kaku Gothic ProN','Meiryo',sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:24px;">
    <div style="background:#fff;border-radius:12px;padding:28px;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
      <p style="color:#7c3aed;font-weight:700;font-size:12px;margin:0 0 4px;">FRe:x Design inc.</p>
      <h1 style="font-size:18px;color:#292827;margin:0 0 16px;">${esc(p.heading || '見積書のお知らせ')}</h1>
      <p style="color:#444;font-size:14px;line-height:1.7;white-space:pre-wrap;margin:0 0 16px;">${esc(p.message || '')}</p>
      <div style="background:#faf9f7;border-radius:8px;padding:12px 16px;margin:0 0 20px;">
        <div style="font-weight:700;color:#292827;font-size:14px;margin-bottom:6px;">${esc(p.projectName || '')}</div>
        <table style="font-size:13px;color:#444;border-collapse:collapse;">${rows}</table>
      </div>
      <a href="${esc(p.link)}" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:700;font-size:14px;">見積書を開く</a>
      <p style="color:#aaa;font-size:11px;margin:20px 0 0;line-height:1.6;">このリンクはあなた専用です。第三者へ転送しないでください。<br>株式会社フレックスデザイン｜見積書 承認システム</p>
    </div>
  </div></body></html>`;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM || 'FRe:x Design <noreply@frex-design.co.jp>';
  if (!apiKey) {
    res.status(500).json({ error: 'RESEND_API_KEY が設定されていません（Vercel環境変数を確認してください）' });
    return;
  }

  let p: any;
  try {
    p = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    res.status(400).json({ error: 'invalid JSON' });
    return;
  }
  if (!p || !p.to || !Array.isArray(p.to) || p.to.length === 0) {
    res.status(400).json({ error: 'to が必要です' });
    return;
  }

  // テスト用リダイレクト：TEST_REDIRECT_TO が設定されていれば、
  // 全メールの宛先をそのアドレスに差し替える（少佐ひとりで全役割をテストするため）。
  // 件名に本来の宛先を付記。本番では環境変数を削除すればOK。
  const redirect = process.env.TEST_REDIRECT_TO;
  const realTo = p.to as string[];
  const to = redirect ? [redirect] : realTo;
  const subject = redirect
    ? `[テスト→本来: ${realTo.join(', ')}] ${p.subject || '見積書のお知らせ'}`
    : (p.subject || '見積書のお知らせ');

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to,
        subject,
        html: buildHtml(p),
      }),
    });
    if (!r.ok) {
      const text = await r.text();
      res.status(502).json({ error: 'Resend送信失敗', detail: text });
      return;
    }
    res.status(200).json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: 'send failed', detail: String(e?.message ?? e) });
  }
}
