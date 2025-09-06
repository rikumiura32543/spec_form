// Main application component - Japanese Business Improvement System
// 業務改善システム自動具体化ツール

import React, { useState } from 'react';
import { Button, ProgressBar, Card } from './components/ui';
import { WizardQuestion } from './components/wizard';

interface QuestionData {
  id: string;
  title: string;
  placeholder: string;
  type: 'short-text' | 'long-text' | 'single-choice' | 'multiple-choice';
  required: boolean;
  options?: string[];
}

// 15問のウィザード質問定義（3層構造）
const WIZARD_QUESTIONS: QuestionData[] = [
  // Layer 1: 目的・目標 (1-5問)
  {
    id: 'purpose',
    title: '質問 1: 業務改善の目的は何ですか？',
    placeholder: '例：コスト削減、効率向上、品質改善など',
    type: 'long-text',
    required: true,
  },
  {
    id: 'goals',
    title: '質問 2: 具体的な目標を教えてください',
    placeholder: '例：処理時間を50%短縮、エラー率を10%以下に削減など',
    type: 'long-text',
    required: true,
  },
  {
    id: 'timeline',
    title: '質問 3: いつまでに実現したいですか？',
    placeholder: '例：3ヶ月以内、2024年末まで など',
    type: 'short-text',
    required: true,
  },
  {
    id: 'budget',
    title: '質問 4: 予算の規模はどの程度ですか？',
    placeholder: '',
    type: 'single-choice',
    required: true,
    options: ['10万円以下', '10-50万円', '50-100万円', '100万円以上', '予算は未定']
  },
  {
    id: 'priority',
    title: '質問 5: 優先度が高い改善ポイントは？（複数選択可）',
    placeholder: '',
    type: 'multiple-choice',
    required: true,
    options: ['作業時間の短縮', 'ヒューマンエラーの削減', 'データ管理の改善', 'コミュニケーション改善', '品質向上']
  },

  // Layer 2: プロセス・関係者 (6-10問)
  {
    id: 'current_process',
    title: '質問 6: 現在のプロセスを詳しく教えてください',
    placeholder: '現在どのような手順で業務を行っているか具体的に記述',
    type: 'long-text',
    required: true,
  },
  {
    id: 'pain_points',
    title: '質問 7: 最も困っている問題点は何ですか？',
    placeholder: '例：手作業が多い、データが分散している、承認に時間がかかるなど',
    type: 'long-text',
    required: true,
  },
  {
    id: 'stakeholders',
    title: '質問 8: 関係者は何人程度ですか？',
    placeholder: '',
    type: 'single-choice',
    required: true,
    options: ['1-5人', '6-20人', '21-50人', '51-100人', '100人以上']
  },
  {
    id: 'departments',
    title: '質問 9: どの部署が関わりますか？（複数選択可）',
    placeholder: '',
    type: 'multiple-choice',
    required: true,
    options: ['営業部', '経理部', '人事部', '総務部', 'IT部', 'その他']
  },
  {
    id: 'frequency',
    title: '質問 10: この業務の頻度はどの程度ですか？',
    placeholder: '',
    type: 'single-choice',
    required: true,
    options: ['毎日', '週に数回', '週1回', '月1回', '不定期']
  },

  // Layer 3: 技術・統合 (11-15問)
  {
    id: 'current_tools',
    title: '質問 11: 現在使用しているツールやシステムは？',
    placeholder: '例：Excel、Slack、Salesforce、独自システムなど',
    type: 'long-text',
    required: true,
  },
  {
    id: 'data_format',
    title: '質問 12: 主に扱うデータの形式は？（複数選択可）',
    placeholder: '',
    type: 'multiple-choice',
    required: true,
    options: ['Excel/CSV', 'PDF', 'データベース', 'API連携', 'その他']
  },
  {
    id: 'technical_skill',
    title: '質問 13: チームの技術レベルはどの程度ですか？',
    placeholder: '',
    type: 'single-choice',
    required: true,
    options: ['基本的なPC操作のみ', 'Excel関数は使える', '簡単なツール設定可能', 'プログラミング経験あり', '技術チームがいる']
  },
  {
    id: 'integration_needs',
    title: '質問 14: 他システムとの連携は必要ですか？',
    placeholder: '例：会計システム、CRM、在庫管理システムなど',
    type: 'long-text',
    required: false,
  },
  {
    id: 'security_requirements',
    title: '質問 15: セキュリティ要件はありますか？',
    placeholder: '例：個人情報の取扱い、社外秘データ、アクセス制限など',
    type: 'long-text',
    required: false,
  },
];

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [showResult, setShowResult] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDraftSaved, setIsDraftSaved] = useState(false);

  // ドラフト保存・読み込み機能（憲法準拠：24時間保持）
  const DRAFT_KEY = 'business-improvement-draft';
  const DRAFT_TIMESTAMP_KEY = 'business-improvement-draft-timestamp';

  // ドラフトをLocalStorageに保存
  const saveDraft = () => {
    const draftData = {
      currentStep,
      answers,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
    localStorage.setItem(DRAFT_TIMESTAMP_KEY, new Date().toISOString());
    setIsDraftSaved(true);
    
    // 3秒後に保存表示を消す
    setTimeout(() => setIsDraftSaved(false), 3000);
  };

  // ドラフトをLocalStorageから読み込み
  const loadDraft = () => {
    try {
      const draftData = localStorage.getItem(DRAFT_KEY);
      const timestamp = localStorage.getItem(DRAFT_TIMESTAMP_KEY);
      
      if (draftData && timestamp) {
        const saveTime = new Date(timestamp);
        const now = new Date();
        const hoursDiff = (now.getTime() - saveTime.getTime()) / (1000 * 60 * 60);
        
        // 24時間以内の場合のみ読み込み（憲法準拠）
        if (hoursDiff < 24) {
          const parsed = JSON.parse(draftData);
          setCurrentStep(parsed.currentStep || 0);
          setAnswers(parsed.answers || {});
          return true;
        } else {
          // 24時間経過した場合は削除
          localStorage.removeItem(DRAFT_KEY);
          localStorage.removeItem(DRAFT_TIMESTAMP_KEY);
        }
      }
    } catch (error) {
      console.error('ドラフト読み込みエラー:', error);
      localStorage.removeItem(DRAFT_KEY);
      localStorage.removeItem(DRAFT_TIMESTAMP_KEY);
    }
    return false;
  };

  // コンポーネント初期化時にドラフト読み込み
  React.useEffect(() => {
    loadDraft();
  }, []);

  // 回答変更時に自動保存
  React.useEffect(() => {
    if (Object.keys(answers).length > 0) {
      const timer = setTimeout(saveDraft, 2000); // 2秒後に自動保存
      return () => clearTimeout(timer);
    }
  }, [answers, currentStep]);

  const handleAnswer = (questionId: string, answer: string | string[]) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleNext = () => {
    if (currentStep < WIZARD_QUESTIONS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleFinish = async () => {
    setIsGenerating(true);
    
    // 3秒のシミュレーション生成時間
    setTimeout(() => {
      setIsGenerating(false);
      setShowResult(true);
    }, 3000);
  };

  // /specify形式の一文生成
  const generateSpecifyCommand = () => {
    const purpose = answers.purpose || '業務効率化';
    const goals = answers.goals || '効率向上';
    const currentProcess = answers.current_process || '手動プロセス';
    const painPoints = answers.pain_points || '作業負荷';
    const stakeholders = answers.stakeholders || '複数名';
    const departments = Array.isArray(answers.departments) ? answers.departments.join('・') : (answers.departments || '複数部署');
    const frequency = answers.frequency || '定期的';
    const currentTools = answers.current_tools || '既存ツール';
    const integration = answers.integration_needs || 'システム連携';
    
    return `/specify "${purpose}を目的とした業務改善システムを構築する。${goals}を実現するため、${currentProcess}における${painPoints}を解決し、${stakeholders}の${departments}間での${frequency}な業務を効率化。${currentTools}から${integration}への移行を含む包括的なソリューション。"`;
  };

  // 構造化JSON生成
  const generateStructuredJSON = () => {
    return {
      "project": {
        "name": "業務改善システム",
        "purpose": answers.purpose || "",
        "goals": answers.goals || "",
        "timeline": answers.timeline || "",
        "budget": answers.budget || ""
      },
      "stakeholders": {
        "count": answers.stakeholders || "",
        "departments": Array.isArray(answers.departments) ? answers.departments : (answers.departments ? [answers.departments] : []),
        "frequency": answers.frequency || ""
      },
      "current_state": {
        "process": answers.current_process || "",
        "pain_points": answers.pain_points || "",
        "tools": answers.current_tools || "",
        "data_format": answers.data_format || ""
      },
      "technical_requirements": {
        "tech_level": answers.technical_skill || "",
        "integration": answers.integration_needs || "",
        "security": answers.security_requirements || ""
      },
      "priorities": Array.isArray(answers.priority) ? answers.priority : (answers.priority ? [answers.priority] : [])
    };
  };

  // Markdown仕様書生成
  const generateMarkdownSpec = () => {
    const json = generateStructuredJSON();
    return `# ${json.project.name}

## 目的
${json.project.purpose}

## KPI・成功指標
${json.project.goals}

## プロセス・現状
${json.current_state.process}

### 課題・ペインポイント
${json.current_state.pain_points}

## UI・画面要件
- ダッシュボード画面
- データ入力画面
- レポート画面
- 設定画面

## システム連携
${json.technical_requirements.integration}

### Google Workspace連携
- Google Sheets: データ管理
- Google Calendar: スケジュール連携
- Gmail: 通知配信
- Google Drive: ファイル保存

## 権限・認可
${json.technical_requirements.security}

### 最小権限スコープ
- 読み取り専用権限
- 必要最小限のAPI権限
- ユーザー別アクセス制御

## ログ・監査
- アクセスログ記録
- 操作履歴管理
- エラーログ監視

## 例外・再実行
- エラーハンドリング
- リトライ機能
- 障害復旧手順

---
*生成日時: ${new Date().toLocaleString('ja-JP')}*
*このドラフトは24時間保存されます*`;
  };

  const currentQuestion = WIZARD_QUESTIONS[currentStep];
  const progress = ((currentStep + 1) / WIZARD_QUESTIONS.length) * 100;

  if (isGenerating) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <div className="mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
          <h2 className="text-xl font-bold mb-2">仕様書を生成中...</h2>
          <p className="text-gray-600">お答えいただいた内容を分析しています</p>
        </Card>
      </div>
    );
  }

  if (showResult) {
    const specifyCommand = generateSpecifyCommand();
    const structuredJSON = generateStructuredJSON();
    const markdownSpec = generateMarkdownSpec();
    
    const copyToClipboard = async (text: string, type: string) => {
      try {
        await navigator.clipboard.writeText(text);
        alert(`${type}をクリップボードにコピーしました！`);
      } catch (err) {
        console.error('Failed to copy text: ', err);
      }
    };
    
    const downloadFile = (content: string, filename: string, contentType: string) => {
      const blob = new Blob([content], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    };
    
    return (
      <div style={{backgroundColor: 'var(--color-gray-light)'}} className="min-h-screen py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div style={{backgroundColor: 'var(--color-white)'}} className="p-8 border-0">
            <h1 className="text-2xl font-bold mb-6" style={{color: 'var(--color-primary)'}}>
              業務改善システム仕様書が完成しました
            </h1>
            
            {/* /specify コマンド */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-3" style={{color: 'var(--color-black)'}}>/specify コマンド</h2>
              <p className="text-sm mb-2" style={{color: 'var(--color-black)', opacity: '0.8'}}>GitHub spec-kitで使用するコマンド形式です</p>
              <div style={{backgroundColor: 'var(--color-gray-light)'}} className="p-4 mb-4 font-mono text-sm">
                {specifyCommand}
              </div>
              <div className="btn-group">
                <button 
                  onClick={() => copyToClipboard(specifyCommand, '/specifyコマンド')}
                  className="btn btn-primary btn-full-width"
                >
                  /specifyコマンドをコピー
                </button>
              </div>
            </div>
            
            <div className="btn-group">
              <button 
                onClick={() => {
                  setCurrentStep(0);
                  setAnswers({});
                  setShowResult(false);
                }}
                className="btn btn-full-width"
              >
                最初から作り直す
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{backgroundColor: 'var(--color-gray-light)'}} className="min-h-screen">
      <div style={{backgroundColor: 'var(--color-primary)', color: 'var(--color-white)'}} className="py-6">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-2xl font-bold">業務改善システム自動具体化ツール</h1>
          <p style={{color: 'var(--color-white)', opacity: '0.9'}} className="mt-2">15の質問にお答えいただくと、AI実装可能な仕様書を生成します</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <ProgressBar 
            value={progress}
            showPercentage={true}
            label={`ステップ ${currentStep + 1} / ${WIZARD_QUESTIONS.length}`}
            className="mb-4"
          />
          <div className="flex justify-between items-center">
            <p className="text-gray-600">
              {currentStep < 5 && "Layer 1: 目的・目標"}
              {currentStep >= 5 && currentStep < 10 && "Layer 2: プロセス・関係者"}  
              {currentStep >= 10 && "Layer 3: 技術・統合"}
            </p>
            {/* ドラフト保存インジケーター */}
            {isDraftSaved && (
              <div className="flex items-center text-green-600 text-sm">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                下書き保存済み
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 text-center mt-2">
            💾 回答は自動保存されます（24時間保持）
          </p>
        </div>

        <Card className="p-8 mb-8">
          <WizardQuestion
            question={currentQuestion}
            value={answers[currentQuestion.id] || ''}
            onChange={(value) => handleAnswer(currentQuestion.id, value)}
          />
        </Card>

        <div className="flex gap-4">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="btn flex-1"
          >
            前のステップに戻る
          </button>
          
          <button
            onClick={handleNext}
            disabled={currentQuestion.required && !answers[currentQuestion.id]}
            className="btn btn-primary flex-1"
          >
            {currentStep === WIZARD_QUESTIONS.length - 1 ? '業務改善仕様書を生成' : '次のステップへ進む'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;