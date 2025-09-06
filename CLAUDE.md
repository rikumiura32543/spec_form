# 業務改善システム自動具体化ツール - 開発者向けドキュメント

## 🚀 クイックスタート

### 開発サーバー起動
```bash
npm run dev
```

### ビルド
```bash
npm run build
npm run preview
```

## 📐 アーキテクチャ概要

React 18 + TypeScript + Vite + TailwindCSS による単一ページアプリケーション

```
src/
├── components/
│   ├── ui/              # 汎用UIコンポーネント
│   │   ├── Button.tsx   # ボタンコンポーネント
│   │   └── index.tsx    # UIコンポーネント再エクスポート
│   └── wizard/          # ウィザード機能（将来拡張用）
├── hooks/               # カスタムフック（将来拡張用）
├── types/               # TypeScript型定義（将来拡張用）
└── utils/               # ユーティリティ関数（将来拡張用）
```

## 🎨 デザインシステム

### カラーパレット（6色厳守）
```css
--color-white: #FFFFFF;     /* 背景・テキスト */
--color-black: #222222;     /* メインテキスト */
--color-primary: #4CAF50;   /* プライマリボタン・アクセント */
--color-danger: #D32F2F;    /* エラー・警告 */
--color-gray-light: #F5F5F5; /* 軽いセパレーター */
--color-gray-medium: #E0E0E0; /* ボーダー・無効状態 */
```

### デザイン原則
- **完全フラットデザイン**: `box-shadow: none`, `border-radius: 0`
- **44px最小タッチサイズ**: WCAG 2.1 AA準拠
- **絵文字禁止**: テキストのみ使用

## 📋 機能仕様

### 質問構成（15問固定）
- **Layer 1 (1-5問)**: 目的・目標・期限・予算・優先度
- **Layer 2 (6-10問)**: プロセス・関係者・部署・頻度
- **Layer 3 (11-15問)**: 技術・統合・セキュリティ

### 出力形式
**単一出力のみ**: `/specify "業務改善システムの説明..."` コマンド

## 💾 データ管理

### LocalStorage仕様
```typescript
// 保存データ構造
interface SavedAnswers {
  [questionId: string]: string;
}

// 保存キー
const STORAGE_KEY = 'wizard_answers';
const TIMESTAMP_KEY = 'wizard_timestamp';

// 24時間自動削除
const RETENTION_HOURS = 24;
```

## 🔒 セキュリティ・プライバシー

### PII検出パターン
```typescript
const PII_PATTERNS = [
  /\d{4}-\d{4}-\d{4}-\d{4}/,     // クレジットカード
  /\d{3}-\d{4}-\d{4}/,           // 電話番号
  /[\w\.-]+@[\w\.-]+\.\w+/,      // メールアドレス
  /\d{4}-\d{2}-\d{2}/            // 生年月日
];
```

### データ保護
- 完全ローカル処理（外部送信なし）
- 24時間自動削除
- 暗号化なしの平文保存（機密データを扱わないため）

## ♿ アクセシビリティ（WCAG 2.1 AA準拠）

### 実装要件
```tsx
// 必須属性例
<button 
  aria-label="前のステップに戻る"
  disabled={currentStep === 0}
  style={{ minHeight: '44px', minWidth: '44px' }}
>
  前のステップに戻る
</button>
```

### 対応状況
- ✅ キーボードナビゲーション完全対応
- ✅ スクリーンリーダー対応（aria-label等）
- ✅ 44px最小タッチサイズ
- ✅ 高コントラスト表示対応

## 🛠️ 主要コンポーネント

### App.tsx - メインアプリケーション
```typescript
// 主要state
const [currentStep, setCurrentStep] = useState(0);
const [answers, setAnswers] = useState<Record<string, string>>({});

// 主要関数
const handleNext = () => { /* ステップ進行 */ };
const handlePrev = () => { /* ステップ戻り */ };
const generateSpecifyCommand = () => { /* /specify生成 */ };
```

### Button.tsx - ボタンコンポーネント
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}
```

## 🔧 開発時の注意点

### 1. CSS設計
- **TailwindCSS使用禁止箇所**: デザインシステム色以外
- **カスタムCSS**: `src/index.css`で一元管理
- **レスポンシブ**: 基本的にflexboxで対応

### 2. 状態管理
- **LocalStorage**: ブラウザ標準APIを直接使用
- **State**: React hooksのみ（Redux等不使用）
- **永続化**: 24時間制限付きで自動削除

### 3. パフォーマンス
- **バンドルサイズ**: 外部ライブラリ最小限
- **レンダリング**: 不要な再レンダリング回避
- **メモリ**: useEffect cleanup適切に実装

## 🚨 制約・注意事項

### 変更禁止事項
1. **15問の質問数**: システム設計の根幹
2. **6色のカラーパレット**: ブランドアイデンティティ
3. **フラットデザイン**: shadow/border-radius追加禁止
4. **出力形式**: /specify以外の出力追加禁止

### 拡張可能事項
- UIコンポーネントの追加
- バリデーション強化
- エラーハンドリング改善
- パフォーマンス最適化

## 📝 よくある質問

### Q: なぜ15問固定なのか？
A: GitHub spec-kitでの最適な仕様生成に必要な情報量を、ユーザビリティテストで確定した結果。

### Q: なぜ/specify形式のみなのか？
A: ユーザーが実際に使用するのはGitHub spec-kitのみで、他形式は混乱の原因となるため。

### Q: 国際化対応は？
A: 非エンジニア向け日本語特化ツールのため、他言語対応は行わない。

### Q: データベースを使わない理由は？
A: 個人情報保護とシンプリシティを優先。LocalStorageで十分な機能を提供。

## 🔄 継続開発

### バージョン管理
- セマンティックバージョニング使用
- 機能追加は必ずMinor version up
- 質問変更は必ずMajor version up

### テスト戦略
- **手動テスト**: 15問フル回答テスト必須
- **アクセシビリティ**: axe-core等での自動検証推奨
- **ブラウザテスト**: Chrome/Firefox/Safari/Edge

---

**開発者引き継ぎ完了チェックリスト**
- [ ] `npm run dev` でローカル起動確認
- [ ] 15問すべて回答してコマンド生成確認
- [ ] ブラウザ戻る/進む動作確認
- [ ] LocalStorage保存/削除確認
- [ ] レスポンシブデザイン確認
- [ ] キーボードナビゲーション確認