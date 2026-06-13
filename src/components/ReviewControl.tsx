import React, { useState } from 'react';
import { startFlow, type RejectInfo } from '../lib/approval';
import { calculateTotals } from '../utils/calculations';
import type { ApprovalFlow, Member, FlowStatus } from '../types/approval';
import type { MasterSettings, Quotation } from '../types';

const BADGE: Record<FlowStatus, { bg: string; fg: string }> = {
  確認待ち: { bg: '#38bdf8', fg: '#fff' },
  承認待ち: { bg: '#6366f1', fg: '#fff' },
  承認済: { bg: '#22c55e', fg: '#fff' },
  差戻し: { bg: '#f43f5e', fg: '#fff' },
};

interface Props {
  quotation: Quotation;
  settings: MasterSettings;
  flow: ApprovalFlow | undefined;
  members: Member[];
  reject?: RejectInfo;
  onChanged: () => void;
}

export default function ReviewControl({ quotation, settings, flow, members, reject, onChanged }: Props) {
  const [open, setOpen] = useState(false);
  const [assigneeId, setAssigneeId] = useState('');
  const [busy, setBusy] = useState(false);
  const [showReject, setShowReject] = useState(false);

  const reviewers = members.filter(m => m.role === '所長');
  // 担当者は社員＋所長から選べる（所長が担当を兼ねるケースに対応）
  const staff = members.filter(m => m.role === '社員' || m.role === '所長');
  const latestChange = quotation.changeQuotations?.length
    ? [...quotation.changeQuotations].sort((a, b) => b.round - a.round)[0]
    : null;
  const approvalQuotationNumber = latestChange?.quotationNumber ?? quotation.quotationNumber ?? null;
  const approvalTotal = latestChange ? calculateTotals(latestChange.items, settings).total : (quotation.total ?? null);

  const start = async () => {
    if (reviewers.length < 2) { alert('確認者となる所長が2名登録されていません。'); return; }
    if (!assigneeId) { alert('担当社員を選んでください。'); return; }
    setBusy(true);
    try {
      const result = await startFlow({
        quotationId: quotation.id,
        quotationNumber: approvalQuotationNumber,
        projectName: quotation.projectName ?? null,
        clientName: quotation.clientName ?? null,
        total: approvalTotal,
        changeRound: latestChange?.round ?? null,
        reviewer1Id: reviewers[0].id,
        reviewer2Id: reviewers[1].id,
        assigneeId,
      });
      setOpen(false);
      setAssigneeId('');
      onChanged();
      if (!result.mailOk) {
        alert('回覧は開始しましたが、メール送信に失敗しました。VercelのRESEND_API_KEY / MAIL_FROM設定を確認してください。');
      }
    } catch (e) {
      alert('回覧開始に失敗しました。Supabaseのテーブル作成が済んでいるか確認してください。');
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  // 進行中フローあり：ステータスバッジ（差戻し時は再回覧ボタン）
  if (flow && flow.status !== '差戻し') {
    const c = BADGE[flow.status];
    return <span style={{ background: c.bg, color: c.fg, padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 400, fontFamily: "'Yu Gothic', 'YuGothic', '游ゴシック', sans-serif", letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{flow.status}</span>;
  }

  if (open) {
    return (
      <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
        <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)} style={{ fontSize: 12, padding: '4px 6px', borderRadius: 6, border: '1px solid #ccc' }}>
          <option value="">担当社員を選択</option>
          {staff.map(m => <option key={m.id} value={m.id}>{m.name}（{m.role}{m.office ? `・${m.office}` : ''}）</option>)}
        </select>
        <button disabled={busy} onClick={start} className="btn-sm" style={{ background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
          {busy ? '...' : '開始'}
        </button>
        <button disabled={busy} onClick={() => setOpen(false)} className="btn-sm" style={{ background: 'transparent', color: '#888', border: '1px solid #ddd', borderRadius: 6, padding: '5px 8px', fontSize: 12, cursor: 'pointer' }}>×</button>
      </span>
    );
  }

  return (
    <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center', position: 'relative' }}>
      {flow?.status === '差戻し' && (
        <span
          onClick={() => reject?.comment && setShowReject(v => !v)}
          title={reject?.comment ? 'クリックで差戻し理由を表示' : undefined}
          style={{ background: BADGE.差戻し.bg, color: BADGE.差戻し.fg, padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 400, fontFamily: "'Yu Gothic', 'YuGothic', '游ゴシック', sans-serif", letterSpacing: '0.05em', cursor: reject?.comment ? 'pointer' : 'default' }}
        >差戻し{reject?.comment ? ' 💬' : ''}</span>
      )}
      <button onClick={() => setOpen(true)} className="btn-outline btn-sm" style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, whiteSpace: 'nowrap' }}>
        {flow?.status === '差戻し' ? '再回覧' : latestChange ? `📨 回覧（第${latestChange.round}回変更）` : '📨 回覧'}
      </button>
      {showReject && reject?.comment && (
        <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 6, zIndex: 30, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, boxShadow: '0 6px 24px rgba(0,0,0,0.15)', padding: '12px 14px', width: 250, textAlign: 'left' }}>
          <div style={{ fontSize: 11, color: '#991b1b', fontWeight: 700, marginBottom: 5 }}>差戻し理由{reject.actorName ? `（${reject.actorName}）` : ''}</div>
          <div style={{ fontSize: 12.5, color: '#444', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{reject.comment}</div>
          <button onClick={() => setShowReject(false)} style={{ marginTop: 9, fontSize: 11, color: '#888', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>閉じる</button>
        </div>
      )}
    </span>
  );
}
