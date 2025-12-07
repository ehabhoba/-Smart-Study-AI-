import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { ApiKeyInput } from './components/ApiKeyInput';
import { FileUpload } from './components/FileUpload';
import { ProcessingArea } from './components/ProcessingArea';
import { ResultsDisplay } from './components/ResultsDisplay';
import { DeepDivePanel } from './components/DeepDivePanel';
import { extractTextFromPDF } from './services/pdfService';
import { extractTextFromPPTX } from './services/pptxService';
import { analyzeText, explainConcept } from './services/geminiService';
import { StudyAnalysisResult, SummaryType, ProcessingStatus } from './types';
import { BookOpen } from 'lucide-react';

const App: React.FC = () => {
  // State
  const [apiKey, setApiKey] = useState<string>('');
  const [sourceText, setSourceText] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [status, setStatus] = useState<ProcessingStatus>({ step: 'idle', message: '', progress: 0 });
  const [analysisResult, setAnalysisResult] = useState<StudyAnalysisResult | null>(null);
  
  // Configuration State
  const [summaryType, setSummaryType] = useState<SummaryType>(SummaryType.MEDIUM);
  const [maxSections, setMaxSections] = useState<number | undefined>(undefined);

  // Deep Dive State
  const [isDeepDiveOpen, setIsDeepDiveOpen] = useState(false);
  const [deepDiveTerm, setDeepDiveTerm] = useState('');
  const [deepDiveResult, setDeepDiveResult] = useState<string>('');
  const [isDeepDiveLoading, setIsDeepDiveLoading] = useState(false);

  // Handlers
  const handleFileLoaded = useCallback(async (file: File) => {
    setFileName(file.name);
    setStatus({ step: 'extracting', message: 'جاري قراءة الملف...', progress: 10 });
    
    try {
      let text = '';
      if (file.name.endsWith('.pptx') || file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
        text = await extractTextFromPPTX(file);
      } else if (file.type === 'application/pdf') {
        text = await extractTextFromPDF(file);
      } else {
        throw new Error('نوع الملف غير مدعوم. يرجى استخدام PDF أو PowerPoint.');
      }

      setSourceText(text);
      setStatus({ step: 'idle', message: 'تم استخراج النص بنجاح', progress: 30 });
    } catch (error: any) {
      console.error(error);
      setStatus({ step: 'error', message: error.message || 'فشل في قراءة الملف.', progress: 0 });
    }
  }, []);

  const handleStartProcessing = useCallback(async () => {
    if (!apiKey) {
      alert('يرجى إدخال مفتاح API');
      return;
    }
    if (!sourceText) {
      alert('يرجى رفع ملف صالح أولاً');
      return;
    }

    setStatus({ step: 'analyzing', message: 'جاري تحليل المحتوى وتلخيصه...', progress: 50 });

    try {
      // Simulate progress updates for UX
      const progressInterval = setInterval(() => {
        setStatus(prev => {
          if (prev.step !== 'analyzing') return prev;
          return { ...prev, progress: Math.min(prev.progress + 5, 90) };
        });
      }, 1000);

      const result = await analyzeText(apiKey, sourceText, summaryType, maxSections);
      
      clearInterval(progressInterval);
      setAnalysisResult(result);
      setStatus({ step: 'completed', message: 'تم التحليل بنجاح!', progress: 100 });
    } catch (error: any) {
      console.error(error);
      setStatus({ step: 'error', message: `حدث خطأ أثناء التحليل: ${error.message}`, progress: 0 });
    }
  }, [apiKey, sourceText, summaryType, maxSections]);

  const handleDeepDive = useCallback(async (term: string) => {
    setDeepDiveTerm(term);
    setIsDeepDiveOpen(true);
    setDeepDiveResult('');
    setIsDeepDiveLoading(true);

    try {
      const explanation = await explainConcept(apiKey, term, sourceText);
      setDeepDiveResult(explanation);
    } catch (error) {
      setDeepDiveResult('حدث خطأ أثناء محاولة شرح المفهوم. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsDeepDiveLoading(false);
    }
  }, [apiKey, sourceText]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-5xl flex-grow">
        
        {/* API Key Section */}
        <section className="mb-8 animate-fade-in-up">
          <ApiKeyInput apiKey={apiKey} setApiKey={setApiKey} />
        </section>

        {/* Upload & Config Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <FileUpload 
            onFileLoaded={handleFileLoaded} 
            fileName={fileName}
            disabled={status.step === 'analyzing' || status.step === 'extracting'}
          />
          
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 flex flex-col justify-between h-full">
            <div>
              <h2 className="text-xl font-bold mb-4 text-blue-800 flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                2. إعدادات التلخيص
              </h2>
              
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">نوع الملخص:</label>
                <select 
                  value={summaryType}
                  onChange={(e) => setSummaryType(e.target.value as SummaryType)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white transition-all"
                  disabled={status.step === 'analyzing'}
                >
                  <option value={SummaryType.EXAM}>🚀 تلخيص مكثف (Exam Capsule)</option>
                  <option value={SummaryType.MEDIUM}>📖 تلخيص متوسط (المفاهيم الأساسية)</option>
                  <option value={SummaryType.FULL}>🎓 تلخيص شامل (تفصيلي)</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">الحد الأقصى للفقرات (اختياري):</label>
                <input 
                  type="number" 
                  value={maxSections || ''}
                  onChange={(e) => setMaxSections(e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="مثال: 10" 
                  min="1" 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white transition-all"
                  disabled={status.step === 'analyzing'}
                />
              </div>
            </div>

            <button 
              onClick={handleStartProcessing}
              disabled={!sourceText || !apiKey || status.step === 'analyzing' || status.step === 'extracting'}
              className={`w-full font-bold py-4 rounded-lg shadow transition transform active:scale-95 flex justify-center items-center gap-2
                ${(!sourceText || !apiKey) ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'}
              `}
            >
               <span>✨ ابدأ التحليل والتلخيص</span>
            </button>
          </div>
        </div>

        {/* Status Area */}
        {status.step !== 'idle' && (
          <ProcessingArea status={status} />
        )}

        {/* Results Area */}
        {analysisResult && (
          <ResultsDisplay 
            result={analysisResult} 
            apiKey={apiKey}
            onOpenDeepDive={() => setIsDeepDiveOpen(true)}
          />
        )}
      </main>

      <DeepDivePanel 
        isOpen={isDeepDiveOpen} 
        onClose={() => setIsDeepDiveOpen(false)}
        term={deepDiveTerm}
        setTerm={setDeepDiveTerm}
        result={deepDiveResult}
        isLoading={isDeepDiveLoading}
        onSearch={handleDeepDive}
      />
    </div>
  );
};

export default App;