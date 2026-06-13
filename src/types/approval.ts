// 承認ワークフロー用の型

export type MemberRole = '社長' | '所長' | '社員';

export interface Member {
  id: string;
  name: string;
  email: string;
  role: MemberRole;
  office: string | null; // 横手 / 秋田 / null
  active: boolean;
}

export type FlowStatus = '確認待ち' | '承認待ち' | '承認済' | '差戻し';

export interface ApprovalFlow {
  id: string;
  quotationId: string;
  quotationNumber: string | null;
  projectName: string | null;
  clientName: string | null;
  total: number | null;
  changeRound: number | null; // 変更見積の場合は第N回。通常見積はnull
  reviewer1Id: string | null; // 所長A
  reviewer2Id: string | null; // 所長B
  assigneeId: string | null;  // 担当社員
  status: FlowStatus;
  createdAt: string;
  updatedAt: string;
}

export type TokenPurpose = '確認' | '承認' | '閲覧';

export interface ApprovalToken {
  token: string;
  flowId: string;
  memberId: string | null;
  purpose: TokenPurpose;
  expiresAt: string | null;
  usedAt: string | null;
}

export type ActionType = '確認' | '承認' | '差戻し';

export interface ApprovalAction {
  id: string;
  flowId: string;
  memberId: string | null;
  actorName: string | null;
  action: ActionType;
  comment: string | null;
  createdAt: string;
}
