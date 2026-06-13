// 承認ワークフロー：Supabase CRUD ＋ ステータス遷移ロジック
import { supabase } from './supabase';
import { sendApprovalMail } from './email';
import type {
  Member, ApprovalFlow, ApprovalAction, ApprovalToken,
  FlowStatus, ActionType, TokenPurpose,
} from '../types/approval';
import type { Quotation, MasterSettings } from '../types';

/* eslint-disable @typescript-eslint/no-explicit-any */

// ---------- mappers (snake_case row → camelCase) ----------
function mapMember(r: any): Member {
  return { id: r.id, name: r.name, email: r.email, role: r.role, office: r.office, active: r.active };
}
function mapFlow(r: any): ApprovalFlow {
  return {
    id: r.id, quotationId: r.quotation_id, quotationNumber: r.quotation_number,
    projectName: r.project_name, clientName: r.client_name, total: r.total, changeRound: r.change_round ?? null,
    reviewer1Id: r.reviewer1_id, reviewer2Id: r.reviewer2_id, assigneeId: r.assignee_id,
    status: r.status, createdAt: r.created_at, updatedAt: r.updated_at,
  };
}
function mapAction(r: any): ApprovalAction {
  return {
    id: r.id, flowId: r.flow_id, memberId: r.member_id, actorName: r.actor_name,
    action: r.action, comment: r.comment, createdAt: r.created_at,
  };
}
function mapToken(r: any): ApprovalToken {
  return {
    token: r.token, flowId: r.flow_id, memberId: r.member_id,
    purpose: r.purpose, expiresAt: r.expires_at, usedAt: r.used_at,
  };
}

function tokenUrl(token: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/?token=${token}`;
}

// ---------- members ----------
export async function listMembers(): Promise<Member[]> {
  const { data, error } = await supabase.from('approval_members').select('*').eq('active', true).order('role');
  if (error) throw error;
  return (data ?? []).map(mapMember);
}

async function getMembersByIds(ids: string[]): Promise<Member[]> {
  const valid = ids.filter(Boolean);
  if (valid.length === 0) return [];
  const { data } = await supabase.from('approval_members').select('*').in('id', valid);
  return (data ?? []).map(mapMember);
}

async function getPresident(): Promise<Member | null> {
  const { data } = await supabase.from('approval_members').select('*').eq('role', '社長').limit(1).maybeSingle();
  return data ? mapMember(data) : null;
}

// ---------- tokens ----------
async function createToken(flowId: string, memberId: string | null, purpose: TokenPurpose): Promise<string> {
  const { data, error } = await supabase
    .from('approval_tokens')
    .insert({ flow_id: flowId, member_id: memberId, purpose })
    .select('token')
    .single();
  if (error) throw error;
  return data.token;
}

// ---------- flows ----------
export async function getFlowByQuotationId(quotationId: string): Promise<ApprovalFlow | null> {
  const { data } = await supabase
    .from('approval_flows')
    .select('*')
    .eq('quotation_id', quotationId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ? mapFlow(data) : null;
}

export async function listFlows(): Promise<ApprovalFlow[]> {
  const { data, error } = await supabase.from('approval_flows').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapFlow);
}

export interface CreateFlowInput {
  quotationId: string;
  quotationNumber: string | null;
  projectName: string | null;
  clientName: string | null;
  total: number | null;
  changeRound?: number | null;
  reviewer1Id: string;
  reviewer2Id: string;
  assigneeId: string;
}

// 回覧開始：フロー作成 → 所長2名へ確認トークン＋メール
export async function startFlow(input: CreateFlowInput): Promise<{ flow: ApprovalFlow; mailOk: boolean }> {
  const { data, error } = await supabase
    .from('approval_flows')
    .insert({
      quotation_id: input.quotationId,
      quotation_number: input.quotationNumber,
      project_name: input.projectName,
      client_name: input.clientName,
      total: input.total,
      change_round: input.changeRound ?? null,
      reviewer1_id: input.reviewer1Id,
      reviewer2_id: input.reviewer2Id,
      assignee_id: input.assigneeId,
      status: '確認待ち',
    })
    .select()
    .single();
  if (error) throw error;
  const flow = mapFlow(data);

  const reviewers = await getMembersByIds([input.reviewer1Id, input.reviewer2Id]);
  let mailOk = true;
  for (const m of reviewers) {
    const tk = await createToken(flow.id, m.id, '確認');
    const sent = await sendApprovalMail({
      to: [m.email],
      subject: `【確認依頼】${flow.projectName ?? '見積書'}`,
      heading: '見積書の確認依頼',
      message: `${m.name} 様

下記の見積書について内容のご確認をお願いします。
問題があれば「差し戻し」からコメントを添えてお戻しください。`,
      link: tokenUrl(tk),
      flow,
    });
    if (!sent) mailOk = false;
  }
  return { flow, mailOk };
}

// ---------- actions ----------
export async function listActions(flowId: string): Promise<ApprovalAction[]> {
  const { data, error } = await supabase
    .from('approval_actions')
    .select('*')
    .eq('flow_id', flowId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapAction);
}

export interface SubmitParams {
  flow: ApprovalFlow;
  member: Member | null;
  action: ActionType;
  comment: string;
  token: string;
}

// 確認 / 承認 / 差戻し を記録し、ステータスを遷移させる
export async function submitAction(p: SubmitParams): Promise<{ status: FlowStatus; mailOk: boolean }> {
  // 1) 履歴を記録
  await supabase.from('approval_actions').insert({
    flow_id: p.flow.id,
    member_id: p.member?.id ?? null,
    actor_name: p.member?.name ?? null,
    action: p.action,
    comment: p.comment || null,
  });
  // 2) トークンを使用済みに
  await supabase.from('approval_tokens').update({ used_at: new Date().toISOString() }).eq('token', p.token);

  let newStatus: FlowStatus = p.flow.status;
  let mailOk = true;

  if (p.action === '差戻し') {
    newStatus = '差戻し';
    const pres = await getPresident();
    if (pres) {
      const sent = await sendApprovalMail({
        to: [pres.email],
        subject: `【差し戻し】${p.flow.projectName ?? '見積書'}`,
        heading: '見積書が差し戻されました',
        message: `${p.member?.name ?? '担当者'} から差し戻しがありました。

コメント：
${p.comment || '(コメントなし)'}

見積を修正のうえ、再度回覧を開始してください。`,
        link: tokenUrl(p.token),
        flow: p.flow,
      });
      if (!sent) mailOk = false;
    }
  } else if (p.action === '確認' && p.flow.status === '確認待ち') {
    // 所長2名が両方「確認」したか判定（担当者の受領確認では遷移させない）
    const { data } = await supabase
      .from('approval_actions')
      .select('member_id')
      .eq('flow_id', p.flow.id)
      .eq('action', '確認');
    const doneIds = new Set((data ?? []).map((r: any) => r.member_id));
    const need = [p.flow.reviewer1Id, p.flow.reviewer2Id].filter(Boolean) as string[];
    if (need.every((id) => doneIds.has(id))) {
      newStatus = '承認待ち';
      const pres = await getPresident();
      if (pres) {
        const tk = await createToken(p.flow.id, pres.id, '承認');
        const sent = await sendApprovalMail({
          to: [pres.email],
          subject: `【承認依頼】${p.flow.projectName ?? '見積書'}`,
          heading: '見積書の承認依頼',
          message: '所長2名の確認が完了しました。最終承認をお願いします。',
          link: tokenUrl(tk),
          flow: p.flow,
        });
        if (!sent) mailOk = false;
      }
    }
  } else if (p.action === '承認') {
    newStatus = '承認済';
    if (p.flow.assigneeId) {
      const [assignee] = await getMembersByIds([p.flow.assigneeId]);
      if (assignee) {
        const tk = await createToken(p.flow.id, assignee.id, '閲覧');
        const sent = await sendApprovalMail({
          to: [assignee.email],
          subject: `【提出可】${p.flow.projectName ?? '見積書'}`,
          heading: '見積書が承認されました',
          message: `${assignee.name} 様

承認済みの見積書です。リンクからPDFをダウンロードし、コンサルへご提出ください。`,
          link: tokenUrl(tk),
          flow: p.flow,
        });
        if (!sent) mailOk = false;
      }
    }
  }

  if (newStatus !== p.flow.status) {
    await supabase
      .from('approval_flows')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', p.flow.id);
  }
  return { status: newStatus, mailOk };
}

// ---------- token access (ビューワー) ----------
export interface TokenContext {
  tokenRow: ApprovalToken;
  flow: ApprovalFlow;
  member: Member | null;
  quotation: Quotation | null;
  actions: ApprovalAction[];
}

export async function loadByToken(token: string): Promise<TokenContext | null> {
  const { data: tk } = await supabase.from('approval_tokens').select('*').eq('token', token).maybeSingle();
  if (!tk) return null;
  const { data: f } = await supabase.from('approval_flows').select('*').eq('id', tk.flow_id).maybeSingle();
  if (!f) return null;
  const flow = mapFlow(f);

  let member: Member | null = null;
  if (tk.member_id) {
    const { data: m } = await supabase.from('approval_members').select('*').eq('id', tk.member_id).maybeSingle();
    if (m) member = mapMember(m);
  }

  const quotation = await getQuotationById(flow.quotationId);
  const actions = await listActions(flow.id);
  return { tokenRow: mapToken(tk), flow, member, quotation, actions };
}

// app_data(key='quotations') の jsonb 配列から該当見積を取得
export async function getQuotationById(quotationId: string): Promise<Quotation | null> {
  const { data } = await supabase.from('app_data').select('value').eq('key', 'quotations').maybeSingle();
  const list = (data?.value ?? []) as Quotation[];
  return list.find((q) => q.id === quotationId) ?? null;
}

// マスタ設定（会社情報・税率など）を取得：ビューワーのプレビュー表示に必要
export async function getSettings(): Promise<MasterSettings | null> {
  const { data } = await supabase.from('app_data').select('value').eq('key', 'settings').maybeSingle();
  return (data?.value ?? null) as MasterSettings | null;
}

// 各フローの最新の差し戻しコメント（誰が・何を）をまとめて取得：見積一覧の表示用
export interface RejectInfo { flowId: string; comment: string; actorName: string | null; }
export async function listLatestRejects(flowIds: string[]): Promise<Record<string, RejectInfo>> {
  if (flowIds.length === 0) return {};
  const { data } = await supabase
    .from('approval_actions')
    .select('flow_id, comment, actor_name, member_id, created_at')
    .in('flow_id', flowIds)
    .eq('action', '差戻し')
    .order('created_at', { ascending: false });
  const map: Record<string, RejectInfo> = {};
  for (const r of (data ?? []) as any[]) {
    if (!map[r.flow_id]) map[r.flow_id] = { flowId: r.flow_id, comment: r.comment ?? '', actorName: r.actor_name };
  }
  return map;
}
