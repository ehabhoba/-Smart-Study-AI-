export interface StudyAnalysisResult {
  overview: string;
  summary: string;
  qa: string;
}

export enum SummaryType {
  EXAM = 'exam',
  MEDIUM = 'medium',
  FULL = 'full',
}

export enum ComplexityLevel {
  BASIC = 'basic',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

export interface ProcessingStatus {
  step: 'idle' | 'extracting' | 'analyzing' | 'completed' | 'error';
  message: string;
  progress: number;
}

export interface DeepDiveResponse {
  explanation: string;
  relatedTerms: string[];
}

export interface DeepDiveRequest {
  term: string;
  context: string;
}

export interface TtsRequest {
  text: string;
  voiceName?: string;
}