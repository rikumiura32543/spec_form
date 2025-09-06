// Output generation hook with constitutional compliance
// T035: Generate 3-format output within 5-second limit

import { useState, useCallback, useRef } from 'react';
import {
  WizardState,
  OutputSpecification,
  QuestionDefinition,
  ConstitutionalViolationError,
} from '../types';
import {
  ConstitutionalValidator,
  PerformanceMonitor,
  ErrorHandler,
} from '../utils';

interface OutputGenerationOptions {
  maxGenerationTime?: number; // milliseconds
  enableSummaryOptimization?: boolean;
  enableStructuredDataValidation?: boolean;
  enableMarkdownFormatting?: boolean;
}

interface UseOutputGenerationReturn {
  // State
  isGenerating: boolean;
  progress: number; // 0-100
  error: string | null;
  generatedOutput: OutputSpecification | null;
  generationTime: number | null;
  
  // Actions
  generateOutput: (wizardState: WizardState, questions: QuestionDefinition[]) => Promise<OutputSpecification | null>;
  clearOutput: () => void;
  regenerateWithOptions: (options?: Partial<OutputGenerationOptions>) => Promise<OutputSpecification | null>;
  
  // Export functions
  exportAsJSON: () => string | null;
  exportAsMarkdown: () => string | null;
  exportSummaryForSpecify: () => string | null;
  
  // Validation
  validateOutput: (output: OutputSpecification) => boolean;
  getGenerationStats: () => {
    totalTime: number;
    summaryTime: number;
    structuredDataTime: number;
    markdownTime: number;
    constitutionalCompliant: boolean;
  } | null;
}

export function useOutputGeneration({
  maxGenerationTime = 5000, // Constitutional requirement: 5 seconds max
  enableSummaryOptimization = true,
  enableStructuredDataValidation = true,
  enableMarkdownFormatting = true,
}: OutputGenerationOptions = {}): UseOutputGenerationReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [generatedOutput, setGeneratedOutput] = useState<OutputSpecification | null>(null);
  const [generationTime, setGenerationTime] = useState<number | null>(null);
  
  const lastWizardStateRef = useRef<WizardState | null>(null);
  const lastQuestionsRef = useRef<QuestionDefinition[] | null>(null);
  const generationStatsRef = useRef<{
    totalTime: number;
    summaryTime: number;
    structuredDataTime: number;
    markdownTime: number;
    constitutionalCompliant: boolean;
  } | null>(null);
  
  // Generate output in three formats
  const generateOutput = useCallback(async (
    wizardState: WizardState,
    questions: QuestionDefinition[]
  ): Promise<OutputSpecification | null> => {
    try {
      setIsGenerating(true);
      setProgress(0);
      setError(null);
      
      // Constitutional compliance check: start performance monitoring
      const startTime = new Date();
      PerformanceMonitor.startMeasurement('outputGeneration');
      
      // Store references for regeneration
      lastWizardStateRef.current = wizardState;
      lastQuestionsRef.current = questions;
      
      // Validate wizard completion
      if (!wizardState.isComplete) {
        throw new Error('Wizard must be completed before generating output');
      }
      
      if (Object.keys(wizardState.answers).length < 12) {
        throw new Error('Insufficient answers provided (minimum 12 required)');
      }
      
      // Step 1: Generate summary (for /specify command)
      setProgress(10);
      const summaryStartTime = performance.now();
      
      const summary = await generateSummary(wizardState, questions);
      
      const summaryTime = performance.now() - summaryStartTime;
      setProgress(35);
      
      // Step 2: Generate structured data
      const structuredDataStartTime = performance.now();
      
      const structuredData = await generateStructuredData(wizardState, questions);
      
      const structuredDataTime = performance.now() - structuredDataStartTime;
      setProgress(70);
      
      // Step 3: Generate markdown specification
      const markdownStartTime = performance.now();
      
      const markdownSpec = await generateMarkdownSpec(wizardState, questions, summary, structuredData);
      
      const markdownTime = performance.now() - markdownStartTime;
      setProgress(100);
      
      // Combine into final output
      const output: OutputSpecification = {
        summary,
        structuredData,
        markdownSpec,
      };
      
      // Validate output
      if (enableStructuredDataValidation && !validateOutputStructure(output)) {
        throw new Error('Generated output failed validation');
      }
      
      // Constitutional compliance check: verify generation time
      const endTime = new Date();
      const totalGenerationTime = PerformanceMonitor.endMeasurement('outputGeneration');
      
      if (!ConstitutionalValidator.validateOutputGenerationTime(startTime, endTime)) {
        throw new ConstitutionalViolationError(
          `Output generation exceeded 5 seconds: ${totalGenerationTime}ms`,
          'outputGenerationTime'
        );
      }
      
      // Store generation stats
      generationStatsRef.current = {
        totalTime: totalGenerationTime,
        summaryTime,
        structuredDataTime,
        markdownTime,
        constitutionalCompliant: totalGenerationTime <= maxGenerationTime,
      };
      
      setGeneratedOutput(output);
      setGenerationTime(totalGenerationTime);
      
      return output;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError(errorMessage);
      
      ErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'Output generation failed'
      );
      
      return null;
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  }, [maxGenerationTime, enableStructuredDataValidation]);
  
  // Generate summary for /specify command (50-500 characters)
  const generateSummary = async (
    wizardState: WizardState,
    questions: QuestionDefinition[]
  ): Promise<OutputSpecification['summary']> => {
    const answers = wizardState.answers;
    
    // Extract key information
    const purpose = answers['layer1_purpose'] || '';
    const kpi = answers['layer1_kpi'] || '';
    const actors = answers['layer2_actors'] || '';
    const ui = answers['layer3_ui'] || '';
    
    // Generate concise summary
    let summaryText = '';
    
    if (purpose) {
      const purposeText = typeof purpose === 'string' ? purpose : String(purpose);
      summaryText += purposeText.slice(0, 100);
    }
    
    if (kpi) {
      const kpiText = typeof kpi === 'string' ? kpi : String(kpi);
      summaryText += summaryText ? ` (${kpiText.slice(0, 50)})` : kpiText.slice(0, 100);
    }
    
    // Ensure length constraints (50-500 characters)
    if (summaryText.length < 50) {
      summaryText += 'を目的とした業務改善システム';
    }
    
    if (summaryText.length > 500) {
      summaryText = summaryText.slice(0, 497) + '...';
    }
    
    // Extract key terms
    const keyTerms: string[] = [];
    
    // Parse key terms from purpose and KPI
    const allText = [purpose, kpi, actors, ui]
      .filter(Boolean)
      .map(v => typeof v === 'string' ? v : String(v))
      .join(' ');
    
    // Simple keyword extraction (in production, would use NLP)
    const commonTerms = [
      '自動化', '効率化', '改善', 'システム', 'データ', '管理',
      '処理', '分析', 'レポート', 'ダッシュボード', '連携'
    ];
    
    commonTerms.forEach(term => {
      if (allText.includes(term) && !keyTerms.includes(term)) {
        keyTerms.push(term);
      }
    });
    
    // Calculate confidence based on answer completeness
    const totalQuestions = questions.length;
    const answeredQuestions = Object.keys(answers).length;
    const confidence = Math.min(answeredQuestions / totalQuestions, 1.0);
    
    return {
      text: summaryText,
      keyTerms,
      confidence,
    };
  };
  
  // Generate structured data
  const generateStructuredData = async (
    wizardState: WizardState,
    questions: QuestionDefinition[]
  ): Promise<OutputSpecification['structuredData']> => {
    const answers = wizardState.answers;
    
    return {
      purpose: {
        primary: String(answers['layer1_purpose'] || ''),
        secondary: answers['layer1_constraints'] ? [String(answers['layer1_constraints'])] : undefined,
      },
      stakeholders: {
        primary: answers['layer2_actors'] 
          ? String(answers['layer2_actors']).split(/[、,]/).map(s => s.trim()) 
          : [],
        secondary: answers['layer2_input_data']
          ? String(answers['layer2_input_data']).split(/[、,]/).map(s => s.trim())
          : undefined,
      },
      requirements: {
        functional: [
          answers['layer2_output_data'] ? `出力: ${answers['layer2_output_data']}` : '',
          answers['layer3_ui'] ? `UI: ${answers['layer3_ui']}` : '',
          answers['layer3_automation'] ? `自動化: ${answers['layer3_automation']}` : '',
        ].filter(Boolean),
        nonFunctional: [
          answers['layer1_kpi'] ? `性能要件: ${answers['layer1_kpi']}` : '',
          answers['layer3_permissions'] ? `権限管理: ${answers['layer3_permissions']}` : '',
        ].filter(Boolean),
      },
      constraints: answers['layer1_constraints'] 
        ? [String(answers['layer1_constraints'])]
        : [],
      success_criteria: answers['layer1_success_criteria']
        ? [String(answers['layer1_success_criteria'])]
        : [],
    };
  };
  
  // Generate markdown specification
  const generateMarkdownSpec = async (
    wizardState: WizardState,
    questions: QuestionDefinition[],
    summary: OutputSpecification['summary'],
    structuredData: OutputSpecification['structuredData']
  ): Promise<OutputSpecification['markdownSpec']> => {
    const sections = [
      '# システム仕様書',
      '',
      '## 概要',
      summary.text,
      '',
      '## 目的・目標',
      `**主要目的:** ${structuredData.purpose.primary}`,
      '',
      structuredData.purpose.secondary?.map(s => `**制約条件:** ${s}`).join('\n') || '',
      '',
      '## 関係者',
      `**主要関係者:** ${structuredData.stakeholders.primary.join('、')}`,
      '',
      structuredData.stakeholders.secondary?.length ? 
        `**関連データ:** ${structuredData.stakeholders.secondary.join('、')}` : '',
      '',
      '## 機能要件',
      ...structuredData.requirements.functional.map(req => `- ${req}`),
      '',
      '## 非機能要件', 
      ...structuredData.requirements.nonFunctional.map(req => `- ${req}`),
      '',
      structuredData.constraints.length ? '## 制約条件' : '',
      ...structuredData.constraints.map(constraint => `- ${constraint}`),
      '',
      structuredData.success_criteria.length ? '## 成功基準' : '',
      ...structuredData.success_criteria.map(criteria => `- ${criteria}`),
      '',
      '---',
      `*生成日時: ${new Date().toLocaleString('ja-JP')}*`,
      `*キーワード: ${summary.keyTerms.join('、')}*`,
    ];
    
    const content = sections.filter(Boolean).join('\n');
    const wordCount = content.replace(/[#*\-\n]/g, '').trim().length;
    const sectionNames = [
      '概要', '目的・目標', '関係者', '機能要件', '非機能要件'
    ];
    
    if (structuredData.constraints.length > 0) {
      sectionNames.push('制約条件');
    }
    if (structuredData.success_criteria.length > 0) {
      sectionNames.push('成功基準');
    }
    
    return {
      content,
      wordCount,
      sections: sectionNames,
    };
  };
  
  // Validate output structure
  const validateOutputStructure = (output: OutputSpecification): boolean => {
    try {
      // Validate summary
      if (!output.summary.text || 
          output.summary.text.length < 50 || 
          output.summary.text.length > 500) {
        return false;
      }
      
      // Validate structured data
      if (!output.structuredData.purpose.primary) {
        return false;
      }
      
      // Validate markdown
      if (!output.markdownSpec.content || 
          output.markdownSpec.wordCount < 100) {
        return false;
      }
      
      return true;
    } catch (error) {
      return false;
    }
  };
  
  // Clear generated output
  const clearOutput = useCallback(() => {
    setGeneratedOutput(null);
    setGenerationTime(null);
    setError(null);
    setProgress(0);
    generationStatsRef.current = null;
  }, []);
  
  // Regenerate with new options
  const regenerateWithOptions = useCallback(async (
    options?: Partial<OutputGenerationOptions>
  ): Promise<OutputSpecification | null> => {
    if (!lastWizardStateRef.current || !lastQuestionsRef.current) {
      setError('No previous generation data available');
      return null;
    }
    
    return generateOutput(lastWizardStateRef.current, lastQuestionsRef.current);
  }, [generateOutput]);
  
  // Export functions
  const exportAsJSON = useCallback((): string | null => {
    if (!generatedOutput) return null;
    return JSON.stringify(generatedOutput, null, 2);
  }, [generatedOutput]);
  
  const exportAsMarkdown = useCallback((): string | null => {
    if (!generatedOutput) return null;
    return generatedOutput.markdownSpec.content;
  }, [generatedOutput]);
  
  const exportSummaryForSpecify = useCallback((): string | null => {
    if (!generatedOutput) return null;
    return generatedOutput.summary.text;
  }, [generatedOutput]);
  
  // Validate output
  const validateOutput = useCallback((output: OutputSpecification): boolean => {
    return validateOutputStructure(output);
  }, []);
  
  // Get generation statistics
  const getGenerationStats = useCallback(() => {
    return generationStatsRef.current;
  }, []);
  
  return {
    // State
    isGenerating,
    progress,
    error,
    generatedOutput,
    generationTime,
    
    // Actions
    generateOutput,
    clearOutput,
    regenerateWithOptions,
    
    // Export functions
    exportAsJSON,
    exportAsMarkdown,
    exportSummaryForSpecify,
    
    // Validation
    validateOutput,
    getGenerationStats,
  };
}