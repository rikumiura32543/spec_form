// 15問3層ウィザードの質問コンポーネント
import React from 'react';
import { Input, Textarea } from '../ui';

interface QuestionData {
  id: string;
  title: string;
  placeholder: string;
  type: 'short-text' | 'long-text' | 'single-choice' | 'multiple-choice';
  required: boolean;
  options?: string[];
}

interface WizardQuestionProps {
  question: QuestionData;
  value: string | string[];
  onChange: (value: string | string[]) => void;
  error?: string;
}

const WizardQuestion: React.FC<WizardQuestionProps> = ({
  question,
  value,
  onChange,
  error,
}) => {
  const renderQuestionContent = () => {
    switch (question.type) {
      case 'short-text':
        return (
          <Input
            id={question.id}
            name={question.id}
            type="text"
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={question.placeholder}
            required={question.required}
            error={error ? { message: error } : undefined}
            className="w-full"
            aria-describedby={`${question.id}-description`}
          />
        );

      case 'long-text':
        return (
          <Textarea
            id={question.id}
            name={question.id}
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={question.placeholder}
            rows={4}
            required={question.required}
            error={error ? { message: error } : undefined}
            className="w-full"
            aria-describedby={`${question.id}-description`}
          />
        );

      case 'single-choice':
        return (
          <fieldset className="space-y-3">
            <legend className="sr-only">{question.title}</legend>
            {question.options?.map((option, index) => (
              <div key={option} className="flex items-center">
                <input
                  id={`${question.id}-${index}`}
                  name={question.id}
                  type="radio"
                  value={option}
                  checked={value === option}
                  onChange={(e) => onChange(e.target.value)}
                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500 focus:ring-2 focus:ring-offset-2"
                  required={question.required}
                  aria-describedby={`${question.id}-description`}
                />
                <label 
                  htmlFor={`${question.id}-${index}`}
                  className="ml-3 block text-sm font-medium text-gray-700 cursor-pointer"
                >
                  {option}
                </label>
              </div>
            ))}
          </fieldset>
        );

      case 'multiple-choice':
        const currentValues = Array.isArray(value) ? value : [];
        return (
          <fieldset className="space-y-3">
            <legend className="sr-only">{question.title}</legend>
            {question.options?.map((option, index) => (
              <div key={option} className="flex items-center">
                <input
                  id={`${question.id}-${index}`}
                  name={`${question.id}[]`}
                  type="checkbox"
                  value={option}
                  checked={currentValues.includes(option)}
                  onChange={(e) => {
                    const newValues = e.target.checked
                      ? [...currentValues, option]
                      : currentValues.filter(v => v !== option);
                    onChange(newValues);
                  }}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 focus:ring-offset-2"
                  aria-describedby={`${question.id}-description`}
                />
                <label 
                  htmlFor={`${question.id}-${index}`}
                  className="ml-3 block text-sm font-medium text-gray-700 cursor-pointer"
                >
                  {option}
                </label>
              </div>
            ))}
          </fieldset>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* 質問タイトル */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {question.title}
        </h2>
        {question.placeholder && question.type !== 'single-choice' && question.type !== 'multiple-choice' && (
          <p 
            id={`${question.id}-description`}
            className="text-sm text-gray-600 mb-4"
          >
            {question.placeholder}
          </p>
        )}
      </div>

      {/* 質問コンテンツ */}
      <div>
        {renderQuestionContent()}
      </div>

      {/* 必須フィールドの表示 */}
      {question.required && (
        <p className="text-sm text-gray-500">
          <span className="text-red-500" aria-hidden="true">*</span>
          {' '}必須項目
        </p>
      )}

      {/* エラーメッセージ */}
      {error && (
        <div 
          role="alert"
          className="text-sm text-red-600 mt-2"
          aria-live="assertive"
        >
          {error}
        </div>
      )}
    </div>
  );
};

export default WizardQuestion;