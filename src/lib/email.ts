// メール送信のフロント側フック。
// 実体は Vercel Serverless Function（/api/send-email）。
// ※ Resend の APIキーはサーバー側（Vercel環境変数）に置く。クライアントには絶対に置かない。

import type { ApprovalFlow } from '../types/approval';

export interface ApprovalMailParams {
  to: string[];
  subject: string;
  heading: string;   // 本文見出し
  message: string;   // 本文（改行可）
  link: string;      // ビューワーへの専用リンク
  flow: ApprovalFlow;
}

export async function sendApprovalMail(params: ApprovalMailParams): Promise<boolean> {
  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: params.to,
        subject: params.subject,
        heading: params.heading,
        message: params.message,
        link: params.link,
        projectName: params.flow.projectName ?? '',
        quotationNumber: params.flow.quotationNumber ?? '',
        clientName: params.flow.clientName ?? '',
        total: params.flow.total ?? null,
      }),
    });
    return res.ok;
  } catch (e) {
    console.error('メール送信に失敗しました（/api 未デプロイの可能性）', e);
    return false;
  }
}
