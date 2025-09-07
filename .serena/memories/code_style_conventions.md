# コードスタイル・規約

## Prettier設定
- **セミコロン**: あり (`"semi": true`)
- **クォート**: シングルクォート (`"singleQuote": true`)
- **行幅**: 80文字 (`"printWidth": 80`)
- **インデント**: スペース2つ (`"tabWidth": 2`, `"useTabs": false`)
- **末尾カンマ**: ES5準拠 (`"trailingComma": "es5"`)

## TypeScript設定
- 厳密な型チェック有効
- プロジェクト参照方式（`tsconfig.app.json`, `tsconfig.node.json`）
- `@/` エイリアス設定（`src/`へのパス）

## 命名規約
- **コンポーネント**: PascalCase (`Button.tsx`, `WizardQuestion.tsx`)
- **フック**: camelCase + `use` prefix (`useWizardState.ts`)
- **ユーティリティ**: camelCase (`validation.ts`, `storage.ts`)
- **型定義**: PascalCase (`QuestionData`, `WizardState`)

## ファイル構成規約
- **コンポーネント**: `src/components/`
- **UI部品**: `src/components/ui/`
- **カスタムフック**: `src/hooks/`
- **型定義**: `src/types/`
- **ユーティリティ**: `src/utils/`

## デザインシステム制約
- **6色厳守**: white, black, primary(#4CAF50), danger(#D32F2F), gray-light(#F5F5F5), gray-medium(#E0E0E0)
- **完全フラットデザイン**: `box-shadow: none`, `border-radius: 0`
- **44px最小タッチサイズ**: WCAG 2.1 AA準拠
- **絵文字禁止**: テキストのみ使用

## アクセシビリティ要件
- `aria-label` 必須
- キーボードナビゲーション対応
- スクリーンリーダー対応
- 高コントラスト対応

## 禁止事項
- 15問の質問数変更禁止
- カラーパレット以外の色使用禁止
- フラットデザイン以外のスタイル禁止
- `/specify`以外の出力形式追加禁止