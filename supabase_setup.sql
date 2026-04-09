-- Supabaseのダッシュボード → SQL Editor で実行してください

CREATE TABLE IF NOT EXISTS app_data (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- 誰でも読み書きできるように（社内共有用途）
ALTER TABLE app_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_select" ON app_data FOR SELECT USING (true);
CREATE POLICY "allow_all_insert" ON app_data FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_all_update" ON app_data FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_delete" ON app_data FOR DELETE USING (true);
