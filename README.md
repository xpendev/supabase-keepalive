# Supabase KeepAlive (Cloudflare Workers)

定期実行時間ごとに Supabase の任意エンドポイントへ GET を送り、スリープを防止する最小構成の Cloudflare Workers プロジェクトです。

## 前提条件

- Node.jsがインストールされていること
- Cloudflareアカウントを持っていること
- Supabaseプロジェクトが作成済みであること

---

## 1. ローカルでの動作確認

### 1.1 環境変数の設定

まず、`.env.local`ファイルを作成して、Supabaseの情報を設定します。

```bash
# env.exampleをコピー
cp env.example .env.local
```

`.env.local`ファイルを編集して、実際のSupabaseの情報を設定します：

```env
SUPABASE_KEEPALIVE_URL="[あなたのプロジェクトURL]"
SUPABASE_ANON_KEY="[あなたの公開可能キー]"
```

**各値の取得方法：**
- `[あなたのプロジェクトURL]`: Supabaseダッシュボード → Project Settings → Data API → Project URL
- `[あなたの公開可能キー]`: Supabaseダッシュボード → Project Settings → API Keys → Publishable key

### 1.2 依存関係のインストール

```bash
npm install
```

### 1.3 ローカル開発サーバーの起動

```bash
npm run dev
```

このコマンドを実行すると、以下のようなメッセージが表示されます：

```
▲ [WARNING] Scheduled Workers are not automatically triggered during local development.

  To manually trigger a scheduled event, run:
    curl "http://127.0.0.1:8787/cdn-cgi/handler/scheduled"

[wrangler:info] Ready on http://127.0.0.1:8787
```

### 1.4 手動でscheduledイベントをトリガー

ローカル開発環境では、Cronトリガーは自動実行されません。別のターミナルで以下のコマンドを実行して、手動でトリガーします：

**ターミナル**
curl "http://127.0.0.1:8787/cdn-cgi/handler/scheduled"

### 1.5 動作確認

`wrangler dev`を実行しているターミナルに、以下のようなログが表示されれば成功です：

```
Ping status: 200
```

エラーが発生した場合は、環境変数が正しく設定されているか確認してください。

---

## 2. Cloudflare Workersへのデプロイ

### 2.1 Cloudflareアカウントへのログイン

初回デプロイ時は、Cloudflareアカウントへのログインが必要です。デプロイコマンドを実行すると、自動的にブラウザが開いてログインを求められます。

### 2.2 環境変数（Secrets）の設定

本番環境では、`.env.local`の値は使用されません。Cloudflare WorkersのSecretsに環境変数を設定する必要があります。

以下のコマンドを実行して、各Secretを設定します：

```bash
# SupabaseのURLを設定
npx wrangler secret put SUPABASE_KEEPALIVE_URL
# → プロンプトが表示されるので、URLを入力（例: https://xxxxx.supabase.co/rest/v1/ping_log）

# SupabaseのAPIキーを設定
npx wrangler secret put SUPABASE_ANON_KEY
# → プロンプトが表示されるので、APIキーを入力（例: sb_publishable_...）
```

**注意：** 入力した値は表示されません（セキュリティのため）。値は暗号化されて保存され、Worker内でのみ参照可能です。

### 2.3 デプロイの実行

```bash
npm run deploy
```

デプロイが成功すると、以下のようなメッセージが表示されます：

```
⛅️ wrangler 4.53.0
─────────────────────────────────────────────
Successfully logged in.
Total Upload: 0.71 KiB / gzip: 0.37 KiB
Uploaded supabase-keepalive (2.31 sec)
Deployed supabase-keepalive triggers (2.79 sec)
  https://supabase-keepalive.[アカウント名].workers.dev
  schedule: 0 * * * *
Current Version ID: [バージョンID]
```

### 2.4 デプロイ後の確認

#### Cloudflareダッシュボードで確認

1. [Cloudflareダッシュボード](https://dash.cloudflare.com/)にアクセス
2. **Workers & Pages** → **supabase-keepalive** を選択
3. **Observability**で実行ログを確認

#### Supabaseダッシュボードで確認

1. Supabaseダッシュボードにアクセス
2. **Logs** → **API Gateway** でリクエストログを確認
3. `GET /rest/v1/ping_log` へのリクエストが定期実行時間ごとに記録されていることを確認

---

## 3. 設定の変更と再デプロイ

### 3.1 Cronスケジュールの変更

`wrangler.toml`の`crons`を変更した場合：

```toml
[triggers]
crons = ["0 * * * *"]  # 1時間ごと
# crons = ["0 0 * * *"]  # 24時間ごと（毎日0時）
```

変更後は再デプロイが必要です：

```bash
npm run deploy
```

### 3.2 コードの変更

`src/index.ts`を変更した場合も、再デプロイが必要です：

```bash
npm run deploy
```

### 3.3 Secretsの更新

Secretsの値を更新する場合：

```bash
npx wrangler secret put SUPABASE_KEEPALIVE_URL
npx wrangler secret put SUPABASE_ANON_KEY
```

再デプロイは不要です。Secretsの変更は即座に反映されます。

---

## 4. トラブルシューティング

### 4.1 ローカルでエラーが発生する場合

- `.env.local`ファイルが正しく作成されているか確認
- 環境変数の値が正しいか確認（URLの末尾に`/rest/v1/ping_log`が含まれているか）
- SupabaseのAPIキーが正しいか確認

### 4.2 デプロイ後に動作しない場合

- Secretsが正しく設定されているか確認（`npx wrangler secret list`で確認可能）
- CloudflareダッシュボードのLogsでエラーメッセージを確認
- Supabaseのログでリクエストが来ているか確認

### 4.3 Cronが実行されない場合

- `wrangler.toml`の`crons`設定が正しいか確認
- CloudflareダッシュボードでCronトリガーが有効になっているか確認
- デプロイが成功しているか確認（デプロイメッセージに`schedule: 0 * * * *`が表示されているか）

---

## 5. 補足情報

### Cron式の説明

現在の設定（`0 * * * *`）は「毎時0分」を意味します：
- `0` = 分（0分）
- `*` = 時（毎時）
- `*` = 日（毎日）
- `*` = 月（毎月）
- `*` = 曜日（毎日）

### ログの有効化

`wrangler.toml`に以下の設定を追加することで、Workers Logsが有効になります：

```toml
[observability]
enabled = true
head_sampling_rate = 1
```

この設定により、Cloudflareダッシュボードで実行ログを確認できるようになります。

### その他

- TypeScript 100%、最小構成です
- Secrets はリポジトリに含めず、`env.example` に仮の値のみ置いています

---

以上で、ローカルでの動作確認とデプロイの手順は完了です。
