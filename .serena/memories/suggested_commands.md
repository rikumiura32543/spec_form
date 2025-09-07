# 業務改善システム自動具体化ツール - 推奨コマンド

## 開発環境
```bash
# 開発サーバー起動（ポート5173）
npm run dev

# 本番ビルド
npm run build

# ビルド結果プレビュー
npm run preview
```

## テスト関連
```bash
# 全テスト実行
npm run test

# テストUI起動
npm run test:ui

# テスト実行（CI用）
npm run test:run

# 契約テスト
npm run test:contract

# 統合テスト
npm run test:integration

# ユニットテスト
npm run test:unit

# E2Eテスト（Playwright）
npm run test:e2e

# アクセシビリティテスト
npm run test:a11y

# パフォーマンステスト
npm run test:performance
```

## コード品質
```bash
# ESLint実行
npm run lint

# Prettierフォーマット
npm run format
```

## システムコマンド（macOS/Darwin）
```bash
# ファイル一覧
ls -la

# ディレクトリ移動
cd <directory>

# パターン検索（ripgrep推奨）
rg <pattern>

# Git操作
git status
git add .
git commit -m "message"
git push origin develop
```

## 主要ファイル
- `src/App.tsx`: メインアプリケーション
- `src/components/ui/`: UIコンポーネント
- `src/types/`: TypeScript型定義
- `CLAUDE.md`: 開発者向け詳細ドキュメント
- `package.json`: 依存関係とスクリプト