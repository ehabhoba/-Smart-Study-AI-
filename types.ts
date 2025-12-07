export interface StudyAnalysisResult {
  id?: string; // Unique ID for history
  date?: string; // Timestamp
  fileName?: string; // Name of the source file
  overview: string;
  summary: string;
  qa: string;
  extractedImages?: string[]; // Array of Base64 image strings extracted from the file
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