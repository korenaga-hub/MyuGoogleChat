# MyuGoogleChat - Google Chat タスク管理Bot

## 概要

Google Chatのメッセージにタスクボタンをつけてタスクを管理するBotシステム。
メッセージを「全体タスク」または「個人タスク」として登録でき、Googleスプレッドシートで管理する。

## システム構成

```
Google Chat メッセージ
    ↓ 右クリック or メッセージアクション
[👥 全体タスク化] または [👤 個人タスク化] ボタン
    ↓
GAS（ChatApp.gs）がPOSTを受信
    ↓
Googleスプレッドシート（全体タスク / 個人タスク シート）に保存
    ↓
Google Chatにタスクカードを返信（完了ボタン付き）
```

## スラッシュコマンド

| コマンド | 内容 |
|---------|------|
| `/tasks` | 未完了の全体タスク一覧を表示 |
| `/mytasks` | 自分の未完了個人タスク一覧を表示 |

## メッセージアクション

| アクション名 | 内容 |
|------------|------|
| 全体タスク化 | スペース全員が見られる全体タスクに登録 |
| 個人タスク化 | 自分だけが見られる個人タスクに登録 |

## GASファイル構成

GitHubリポジトリ：https://github.com/korenaga-hub/MyuGoogleChat

| ファイル | 内容 |
|---------|------|
| ChatApp.gs | doPost メイン処理・イベントルーティング |
| TaskManager.gs | タスクのCRUD処理（スプレッドシート操作） |
| CardBuilder.gs | Google Chatカード（UI）の生成 |
| setup_properties.gs | PropertiesService初期設定（1回のみ実行） |
| appsscript.json | GASマニフェスト |

## スプレッドシート構成

### 全体タスクシート

| 列 | フィールド名 | 内容 |
|----|------------|------|
| A | taskId | UUID |
| B | spaceId | Google ChatスペースID |
| C | spaceName | スペース名 |
| D | messageId | 元メッセージID |
| E | messageText | メッセージ本文（最大50文字） |
| F | registeredBy | 登録者のユーザーID |
| G | registeredByName | 登録者の表示名 |
| H | status | 未完了 / 完了 |
| I | createdAt | 登録日時 |
| J | completedAt | 完了日時 |
| K | completedBy | 完了者の表示名 |

### 個人タスクシート

| 列 | フィールド名 | 内容 |
|----|------------|------|
| A | taskId | UUID |
| B | userId | 登録者のユーザーID |
| C | userName | 登録者の表示名 |
| D | spaceId | Google ChatスペースID |
| E | messageId | 元メッセージID |
| F | messageText | メッセージ本文（最大50文字） |
| G | status | 未完了 / 完了 |
| H | createdAt | 登録日時 |
| I | completedAt | 完了日時 |

## GAS PropertiesService（秘密情報）

以下のキーをGASのPropertiesServiceに登録する：
- SPREADSHEET_ID（Googleスプレッドシートのファイルキー）

## セットアップ手順

### ステップ1：スプレッドシートを作成

1. Googleドライブで新しいスプレッドシートを作成
2. URLから `https://docs.google.com/spreadsheets/d/【ここ】/edit` のIDをコピー

### ステップ2：GASプロジェクトを作成

1. script.google.com でプロジェクトを新規作成
2. 各 `.gs` ファイルの内容を貼り付け
3. `setup_properties.gs` の `SPREADSHEET_ID` を入力
4. `setupProperties()` を1回実行
5. `initializeSpreadsheet()` を1回実行（シート初期化）

### ステップ3：GASをウェブアプリとしてデプロイ

1. デプロイ → 新しいデプロイ → ウェブアプリ
2. 「次のユーザーとして実行」→ 自分
3. 「アクセスできるユーザー」→ 全員
4. デプロイURLをコピー

### ステップ4：Google Cloud ConsoleでChat Appを設定

1. console.cloud.google.com → APIとサービス → Chat API を有効化
2. Chat API → 構成
3. 以下を設定：
   - アプリ名：MyuTask Bot
   - 接続設定：HTTPエンドポイントURL → GASのデプロイURL
4. スラッシュコマンドを追加：
   - `/tasks`（コマンドID: 1）
   - `/mytasks`（コマンドID: 2）
5. メッセージアクションを追加：
   - 全体タスク化（actionMethodName: addGroupTask）
   - 個人タスク化（actionMethodName: addPersonalTask）

### ステップ5：スペースにBotを追加

Google Chatのスペースで「ユーザーとボットを追加」→ MyuTask Bot を追加
