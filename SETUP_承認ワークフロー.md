# 見積書 承認ワークフロー セットアップ手順

実装済みのコードを動かすために必要な「外部設定」3ステップ。
（コードはすべて実装済み。以下はDBとメールの鍵の設定）

---

## ① Supabase：テーブルを作成する

1. Supabase ダッシュボード → 対象プロジェクト（`twolywmokxggjnugzuig`）→ **SQL Editor**
2. 初回セットアップなら `supabase_approval_setup.sql` の中身を全部貼り付けて **Run**
   - 既存の承認データを消したくない場合は、DROP文は実行せず、末尾の `ALTER TABLE approval_flows ADD COLUMN IF NOT EXISTS change_round integer;` を実行する
3. `approval_members` テーブルにメンバー9名が入っていれば成功
   - 表示名（漢字）を入れたい場合は `approval_members.name` をあとで更新可

これで「回覧開始」「確認」「承認」「差し戻し」がDBに記録されるようになる。

---

## ② Resend：メール送信の準備（ドメイン認証）

1. https://resend.com に登録（無料枠：月3,000通）
2. **Domains → Add Domain** で `frex-design.co.jp` を追加
3. Resend画面に表示される **DNSレコード（SPF / DKIM / 場合によりDMARC）** を、
   `frex-design.co.jp` のDNS管理画面に追加する
   - ※ 具体的なレコード値は **Resendが発行する値をそのまま使う**（ここに固定値は書けない）
   - DNS管理がどこか（お名前.com / Cloudflare / ムームー等）は契約先による
4. Resend画面で **Verified（認証済）** になればOK
5. **API Keys → Create API Key** でキーを発行し控える（`re_xxxxx`）

> 認証が済むまでは、Resendのテスト用アドレスからは送れるが、
> `@frex-design.co.jp` を差出人にするにはドメイン認証が必須。

---

## ③ Vercel：環境変数を設定する

Vercel プロジェクト → **Settings → Environment Variables** に追加：

| 変数名 | 値 | 例 |
|---|---|---|
| `RESEND_API_KEY` | ②で発行したキー | `re_xxxxxxxx` |
| `MAIL_FROM` | 差出人 | `FRe:x Design <noreply@frex-design.co.jp>` |
| `TEST_REDIRECT_TO`（テスト時のみ） | 全メールの送信先を上書き | `masahiro-fujishima@frex-design.co.jp` |

設定後、**Redeploy**（再デプロイ）すると `/api/send-email` が有効になる。

### テストモードについて
`TEST_REDIRECT_TO` を設定すると、**確認依頼（所長宛）・承認依頼・提出可（社員宛）の全メールが、そのアドレス1つに届く**。
件名に `[本来の宛先: ...]` が付くので役割が分かる。社長ひとりで全役割を通しテストできる。
**本番運用時はこの環境変数を削除する**（消すだけで実際の所長・社員に届くようになる）。

---

## 動作フロー（完成後）

1. 社長がログイン → 見積一覧で「📨 回覧」→ 担当社員を選んで開始
2. 所長2名に確認依頼メール → リンクから確認/差し戻し
3. 2名OK → 社長に承認依頼メール → 承認/差し戻し
4. 承認 → 担当社員に「提出可」メール → PDF保存してコンサルへ提出

## メモ
- ビューワーは `サイトURL/?token=xxxx` でログイン不要アクセス（リンクを知っている人だけ）
- 所長・社員のアカウント管理は不要（メールアドレス登録のみ）
- ②③が未設定でも「回覧開始・確認・承認」はDB上で動く（メールが飛ばないだけ）
