-- ============================================================
-- 見積書 承認ワークフロー  テーブル定義
-- Supabase ダッシュボード → SQL Editor で実行してください
-- ============================================================

-- 前回作成した承認用テーブル（空・旧membersを参照するFKを持つ）を作り直す。
-- ※ ここでDROPするのは承認ワークフロー専用の4テーブルのみ。
--   既存の「members」（Bridges and Approvals Schema由来）には一切触れない。
DROP TABLE IF EXISTS approval_actions CASCADE;
DROP TABLE IF EXISTS approval_tokens  CASCADE;
DROP TABLE IF EXISTS approval_flows   CASCADE;
DROP TABLE IF EXISTS approval_members CASCADE;

-- メンバー（社長・所長・社員）
CREATE TABLE IF NOT EXISTS approval_members (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text,                       -- 表示名（漢字。未確定時は暫定でローカル部）
  email      text NOT NULL UNIQUE,
  role       text NOT NULL CHECK (role IN ('社長','所長','社員')),
  office     text,                       -- 横手 / 秋田 / NULL
  active      boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 承認フロー（見積1件に1フロー）
CREATE TABLE IF NOT EXISTS approval_flows (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id     text NOT NULL,        -- app_data の quotations[].id を参照（FK無し）
  quotation_number text,
  project_name     text,
  client_name      text,
  total            numeric,
  change_round     integer,              -- 変更見積の場合は第N回。通常見積はNULL
  reviewer1_id     uuid REFERENCES approval_members(id),  -- 確認：所長A
  reviewer2_id     uuid REFERENCES approval_members(id),  -- 確認：所長B
  assignee_id      uuid REFERENCES approval_members(id),  -- 担当：社員（提出者）
  status           text NOT NULL DEFAULT '確認待ち'
                   CHECK (status IN ('確認待ち','承認待ち','承認済','差戻し')),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_approval_flows_quotation ON approval_flows(quotation_id);

-- アクセストークン（メールに載せる専用リンクの本体）
CREATE TABLE IF NOT EXISTS approval_tokens (
  token      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id    uuid NOT NULL REFERENCES approval_flows(id) ON DELETE CASCADE,
  member_id  uuid REFERENCES approval_members(id),
  purpose    text NOT NULL CHECK (purpose IN ('確認','承認','閲覧')),
  expires_at timestamptz,                -- NULL = 無期限
  used_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_approval_tokens_flow ON approval_tokens(flow_id);

-- 承認アクション履歴（確認・承認・差戻し）
CREATE TABLE IF NOT EXISTS approval_actions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id    uuid NOT NULL REFERENCES approval_flows(id) ON DELETE CASCADE,
  member_id  uuid REFERENCES approval_members(id),
  actor_name text,                       -- 操作者の表示名（履歴の可読性用）
  action     text NOT NULL CHECK (action IN ('確認','承認','差戻し')),
  comment    text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_approval_actions_flow ON approval_actions(flow_id);

-- ------------------------------------------------------------
-- RLS：既存 app_data と同じ「社内共有・誰でも読み書き」方針。
-- ビューワーは未ログイン(anon)でアクセスするため anon 許可が必要。
-- 実質的なアクセス制御は「推測不可能なトークンを知っているか」で行う
-- （PINなし＝リンクを知っている人だけ開ける、という少佐の決定に基づく）。
-- ------------------------------------------------------------
ALTER TABLE approval_members          ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_flows   ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_tokens  ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_actions ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['approval_members','approval_flows','approval_tokens','approval_actions'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS allow_all_select ON %I;', t);
    EXECUTE format('DROP POLICY IF EXISTS allow_all_insert ON %I;', t);
    EXECUTE format('DROP POLICY IF EXISTS allow_all_update ON %I;', t);
    EXECUTE format('DROP POLICY IF EXISTS allow_all_delete ON %I;', t);
    EXECUTE format('CREATE POLICY allow_all_select ON %I FOR SELECT USING (true);', t);
    EXECUTE format('CREATE POLICY allow_all_insert ON %I FOR INSERT WITH CHECK (true);', t);
    EXECUTE format('CREATE POLICY allow_all_update ON %I FOR UPDATE USING (true) WITH CHECK (true);', t);
    EXECUTE format('CREATE POLICY allow_all_delete ON %I FOR DELETE USING (true);', t);
  END LOOP;
END $$;

-- ------------------------------------------------------------
-- 初期メンバー（2026-06-06 メールアドレス.xlsx より）
-- name は漢字未確定のため暫定でローカル部。後でUPDATE可。
-- ------------------------------------------------------------
INSERT INTO approval_members (name, email, role, office) VALUES
  ('藤嶋 正博', 'masahiro-fujishima@frex-design.co.jp', '社長', NULL),
  ('加瀬谷',    'takeru-kaseya@frex-design.co.jp',      '所長', '横手'),
  ('二木',      'ryotaro-futagi@frex-design.co.jp',     '所長', '秋田'),
  ('星野',      'kenta-hoshino@frex-design.co.jp',      '社員', '横手'),
  ('佐藤',      'yuta-sato@frex-design.co.jp',          '社員', '横手'),
  ('渡部',      'tomoya-watanabe@frex-design.co.jp',    '社員', '秋田'),
  ('藤岡',      'yu-fujioka@frex-design.co.jp',         '社員', '秋田'),
  ('本間',      'yuta-honma@frex-design.co.jp',         '社員', '秋田'),
  ('堀井',      'hiroyuki-horii@frex-design.co.jp',     '社員', '秋田')
ON CONFLICT (email) DO NOTHING;

-- ------------------------------------------------------------
-- 2026-06-12 追補：変更見積回の保持
-- 既存テーブルへ後から適用する場合もDROP不要で安全に追加できる。
-- ------------------------------------------------------------
ALTER TABLE approval_flows
  ADD COLUMN IF NOT EXISTS change_round integer;
