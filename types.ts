
export interface Flashcard {
  term: string;
  definition: string;
}

export interface QuizItem {
  question: string;
  options: string[];
  correctAnswer: string; // The text of the correct answer
  explanation?: string; // Why is it correct?
}

export interface StudyAnalysisResult {
  id?: string; // Unique ID for history
  date?: string; // Timestamp
  fileName?: string; // Name of the source file
  overview: string;
  summary: string;
  qa: string;
  flashcards?: Flashcard[]; // New: Structured Flashcards
  quiz?: QuizItem[];        // New: Structured Interactive Quiz
  extractedImages?: string[]; // Array of Base64 image strings extracted from the file
  detectedLanguage?: string; // The language detected from the source file (e.g., 'ar', 'en')
}

export enum SummaryType {
  FULL_ANALYSIS = 'full_analysis', // تحليل شامل (الوضع الافتراضي القديم)
  PRECISE_SUMMARY = 'precise_summary', // تلخيص دقيق (25% من المحتوى)
  EXAM_CAPSULE = 'exam_capsule', // كبسولة الامتحان (مركز جداً)
  MALZAMA = 'malzama',           // تحويل لملزمة شرح (Study Guide)
  WORKSHEET = 'worksheet',       // ورقة عمل وتدريبات
  QA_ONLY = 'qa_only',           // استخراج أسئلة فقط
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
