import React, { useEffect, useState, useCallback } from 'react';
import QuotationPreview from '../components/QuotationPreview';
import { loadByToken, getSettings, submitAction, listMembers, type TokenContext } from '../lib/approval';
import type { MasterSettings } from '../types';
import type { ActionType, FlowStatus, Member } from '../types/approval';

const STATUS_COLOR: Record<FlowStatus, { bg: string; fg: string }> = {
  確認待ち: { bg: '#38bdf8', fg: '#fff' },
  承認待ち: { bg: '#6366f1', fg: '#fff' },
  承認済: { bg: '#22c55e', fg: '#fff' },
  差戻し: { bg: '#f43f5e', fg: '#fff' },
};

export default function ApprovalViewer({ token }: { token: string }) {
  const [loading, setLoading] = useState(true);
  const [ctx, setCtx] = useState<TokenContext | null>(null);
  const [settings, setSettings] = useState<MasterSettings | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [comment, setComment] = useState('');
  const [showReturn, setShowReturn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [doneMsg, setDoneMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [c, s, m] = await Promise.all([loadByToken(token), getSettings(), listMembers()]);
      setCtx(c);
      setSettings(s);
      setMembers(m);
    } catch {
      setCtx(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const handleAction = async (action: ActionType) => {
    if (!ctx) return;
    if (action === '差戻し' && !comment.trim()) {
      alert('差し戻しの理由・修正内容をコメントに入力してください。');
      return;
    }
    setSubmitting(true);
    try {
      const result = await submitAction({ flow: ctx.flow, member: ctx.member, action, comment: comment.trim(), token });
      setComment('');
      setShowReturn(false);
      // 担当者の受領確認は、印刷ボタンを残すため完了メッセージを出さず再読込のみ
      if (!(action === '確認' && ctx.tokenRow.purpose === '閲覧')) {
        const msg = action === '確認' ? '確認を登録しました。ありがとうございました。'
          : action === '承認' ? '承認しました。担当者へ通知されます。'
          : '差し戻しました。社長へ通知されます。';
        setDoneMsg(result.mailOk ? msg : `${msg}（ただしメール送信に失敗しました。管理者に連絡してください。）`);
      }
      await load();
    } catch (e) {
      alert('処理に失敗しました。時間をおいて再度お試しください。');
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const wrap: React.CSSProperties = {
    minHeight: '100vh', background: '#f5f4f2',
    fontFamily: "'Hiragino Kaku Gothic ProN', 'Meiryo', 'Yu Gothic', sans-serif",
    padding: '0 0 60px',
  };

  if (loading) {
    return <div style={{ ...wrap, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#888' }}>読み込み中...</p>
    </div>;
  }

  if (!ctx || !ctx.flow) {
    return <div style={{ ...wrap, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
      <h2 style={{ color: '#292827' }}>リンクが無効です</h2>
      <p style={{ color: '#888' }}>このリンクは期限切れか、無効になっています。送信元にお問い合わせください。</p>
    </div>;
  }

  const { flow, member, quotation, actions } = ctx;
  const purpose = ctx.tokenRow.purpose;
  const changeForFlow = quotation && flow.changeRound
    ? quotation.changeQuotations?.find(c => c.round === flow.changeRound) ?? null
    : null;
  const displayQuotation = quotation && changeForFlow
    ? { ...quotation, quotationNumber: changeForFlow.quotationNumber ?? quotation.quotationNumber, date: changeForFlow.issueDate, items: changeForFlow.items }
    : quotation;
  const alreadyActed = !!member && actions.some(a => a.memberId === member.id && a.action === purpose);
  const canReview = purpose === '確認' && flow.status === '確認待ち' && !alreadyActed;
  const canApprove = purpose === '承認' && flow.status === '承認待ち';
  const sc = STATUS_COLOR[flow.status];

  return (
    <div style={wrap}>
      {/* ヘッダ */}
      <div className="no-print" style={{ background: '#292827', color: '#fff', padding: '14px 20px' }}>
        <div style={{ maxWidth: 920, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 12, color: '#fff', fontWeight: 400, letterSpacing: '0.03em', fontFamily: "'Yu Mincho', 'YuMincho', '游明朝', serif" }}>
              FRe:<span style={{ color: '#38bdf8', fontWeight: 600 }}>x</span> Design inc.｜見積書 確認・承認
            </div>
            <div style={{ fontSize: 17, fontWeight: 300, marginTop: 3, letterSpacing: '0.05em' }}>業務名：{flow.projectName || '（案件名未設定）'}</div>
          </div>
          <span style={{ background: sc.bg, color: sc.fg, padding: '6px 16px', borderRadius: 999, fontSize: 13, fontWeight: 400, fontFamily: "'Yu Gothic', 'YuGothic', '游ゴシック', sans-serif", letterSpacing: '0.05em' }}>{flow.status}</span>
        </div>
      </div>

      <div style={{ maxWidth: 920, margin: '0 auto', padding: '20px 16px' }}>
        {member && <p style={{ color: '#444', marginBottom: 12 }}>{member.name} 様（{member.role}）</p>}

        {/* アクションパネル */}
        <div className="no-print" style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 20 }}>
          {doneMsg ? (
            <p style={{ color: '#166534', fontWeight: 700, margin: 0 }}>✅ {doneMsg}</p>
          ) : canReview ? (
            <ActionBlock label="この見積書の内容を確認しました。" primary="✓ 確認する" onPrimary={() => handleAction('確認')}
              showReturn={showReturn} setShowReturn={setShowReturn} comment={comment} setComment={setComment}
              onReturn={() => handleAction('差戻し')} submitting={submitting} />
          ) : canApprove ? (
            <ActionBlock label="この見積書を承認します。" primary="✓ 承認する" onPrimary={() => handleAction('承認')}
              showReturn={showReturn} setShowReturn={setShowReturn} comment={comment} setComment={setComment}
              onReturn={() => handleAction('差戻し')} submitting={submitting} />
          ) : flow.status === '承認済' ? (
            <div>
              <p style={{ color: '#166534', fontWeight: 700, marginTop: 0 }}>✅ この見積書は承認済みです。</p>
              <FlowSteps
                reviewers={[
                  { name: members.find(m => m.id === flow.reviewer1Id)?.name || '所長', done: actions.some(a => a.memberId === flow.reviewer1Id && a.action === '確認') },
                  { name: members.find(m => m.id === flow.reviewer2Id)?.name || '所長', done: actions.some(a => a.memberId === flow.reviewer2Id && a.action === '確認') },
                ]}
                approverDone={actions.some(a => a.action === '承認')}
                assignee={{ name: members.find(m => m.id === flow.assigneeId)?.name || '担当', done: actions.some(a => a.memberId === flow.assigneeId && a.action === '確認') }}
              />
              {purpose === '閲覧' && !actions.some(a => a.memberId === flow.assigneeId && a.action === '確認') && (
                <button disabled={submitting} onClick={() => handleAction('確認')} style={{ ...btnStyle('#7c3aed'), marginRight: 10 }}>{submitting ? '送信中...' : '✓ 確認する'}</button>
              )}
              <button onClick={() => window.print()} style={btnStyle('#292827')}>🖨 印刷</button>
            </div>
          ) : alreadyActed ? (
            <p style={{ color: '#555', margin: 0 }}>あなたの{purpose}は登録済みです。他の方の対応をお待ちください。</p>
          ) : flow.status === '差戻し' ? (
            <p style={{ color: '#991b1b', margin: 0, fontWeight: 700 }}>この見積書は差し戻されています。社長の再回覧をお待ちください。</p>
          ) : (
            <p style={{ color: '#555', margin: 0 }}>現在この見積書で対応いただく操作はありません。</p>
          )}
        </div>

        {/* 見積プレビュー */}
        {displayQuotation && settings ? (
          <div style={{ background: '#fff', borderRadius: 12, padding: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflowX: 'auto' }}>
            <QuotationPreview quotation={displayQuotation} settings={settings} changeRound={changeForFlow?.round} />
          </div>
        ) : (
          <p style={{ color: '#991b1b' }}>見積データを読み込めませんでした。</p>
        )}

        {/* 承認履歴 */}
        <div className="no-print" style={{ marginTop: 20, background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 15, color: '#292827' }}>承認履歴</h3>
          {actions.length === 0 ? (
            <p style={{ color: '#999', fontSize: 14, margin: 0 }}>まだ操作はありません。</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {actions.map(a => (
                <li key={a.id} style={{ borderLeft: `3px solid ${a.action === '差戻し' ? '#ef4444' : '#a78bfa'}`, paddingLeft: 12 }}>
                  <div style={{ fontSize: 14, color: '#292827' }}>
                    <b>{(() => { const mem = members.find(m => m.id === a.memberId); if (!mem) return a.actorName || '担当者'; return mem.role === '社長' ? '社長' : `${mem.name}（${mem.role}）`; })()}</b> が <b>{a.action}</b>
                    <span style={{ color: '#999', fontSize: 12, marginLeft: 8 }}>{new Date(a.createdAt).toLocaleString('ja-JP')}</span>
                  </div>
                  {a.comment && <div style={{ fontSize: 13, color: '#555', marginTop: 2, whiteSpace: 'pre-wrap' }}>💬 {a.comment}</div>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function btnStyle(bg: string): React.CSSProperties {
  return { padding: '11px 22px', background: bg, color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' };
}

// 進捗ステップ表示：確認（所長2名・並列）→ 承認（社長）→ 確認（担当）
function StepNode({ label, sub, done }: { label: string; sub: string; done: boolean }) {
  return (
    <div style={{ textAlign: 'center', minWidth: 60 }}>
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        background: done ? '#22c55e' : '#e5e7eb', color: done ? '#fff' : '#9ca3af',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, margin: '0 auto',
      }}>{done ? '✓' : '…'}</div>
      <div style={{ fontSize: 12, color: '#444', marginTop: 4, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 10, color: '#999' }}>{sub}</div>
    </div>
  );
}

function FlowSteps({ reviewers, approverDone, assignee }: {
  reviewers: Array<{ name: string; done: boolean }>;
  approverDone: boolean;
  assignee: { name: string; done: boolean };
}) {
  const arrow = <span style={{ color: '#cbd5e1', fontSize: 18, margin: '0 2px' }}>→</span>;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, margin: '14px 0 18px', flexWrap: 'wrap' }}>
      {/* 作成（社長）：回覧開始時点で完了済み */}
      <StepNode label="作成" sub="社長" done={true} />
      {arrow}
      {/* 所長2名：並列（縦並び・コンパクト） */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {reviewers.map((r, i) => <StepNode key={i} label="確認" sub={r.name} done={r.done} />)}
      </div>
      {arrow}
      <StepNode label="承認" sub="社長" done={approverDone} />
      {arrow}
      <StepNode label="確認" sub={assignee.name} done={assignee.done} />
    </div>
  );
}

function ActionBlock(props: {
  label: string; primary: string; onPrimary: () => void;
  showReturn: boolean; setShowReturn: (v: boolean) => void;
  comment: string; setComment: (v: string) => void;
  onReturn: () => void; submitting: boolean;
}) {
  const { label, primary, onPrimary, showReturn, setShowReturn, comment, setComment, onReturn, submitting } = props;
  return (
    <div>
      <p style={{ marginTop: 0, color: '#444' }}>{label}</p>
      {!showReturn ? (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button disabled={submitting} onClick={onPrimary} style={btnStyle('#7c3aed')}>{submitting ? '送信中...' : primary}</button>
          <button disabled={submitting} onClick={() => setShowReturn(true)} style={{ ...btnStyle('#fff'), color: '#991b1b', border: '1.5px solid #fca5a5' }}>↩ 差し戻し</button>
        </div>
      ) : (
        <div>
          <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="差し戻しの理由・修正してほしい点を入力してください（必須）"
            rows={3} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1.5px solid #fca5a5', fontFamily: 'inherit', fontSize: 14, boxSizing: 'border-box' }} />
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button disabled={submitting} onClick={onReturn} style={btnStyle('#e08a6b')}>{submitting ? '送信中...' : 'コメントを付けて差し戻す'}</button>
            <button disabled={submitting} onClick={() => setShowReturn(false)} style={{ ...btnStyle('#fff'), color: '#555', border: '1.5px solid #ddd' }}>キャンセル</button>
          </div>
        </div>
      )}
    </div>
  );
}
