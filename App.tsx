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
import { StudyAnalysisResult, SummaryType, ProcessingStatus, DeepDiveResponse, ComplexityLevel } from './types';
import { BookOpen } from 'lucide-react';

const App: React.FC = () => {
  // State
  // Initialize API Key from LocalStorage if available
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('gemini_api_key') || '';
  });

  const [sourceText, setSourceText] = useState<string>('');
  const [sourceImage, setSourceImage] = useState<{ data: string, mimeType: string } | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [status, setStatus] = useState<ProcessingStatus>({ step: 'idle', message: '', progress: 0 });
  const [analysisResult, setAnalysisResult] = useState<StudyAnalysisResult | null>(null);
  
  // Configuration State
  const [summaryType, setSummaryType] = useState<SummaryType>(SummaryType.MEDIUM);
  const [maxSections, setMaxSections] = useState<number | undefined>(undefined);

  // Deep Dive State
  const [isDeepDiveOpen, setIsDeepDiveOpen] = useState(false);
  const [deepDiveTerm, setDeepDiveTerm] = useState('');
  const [deepDiveResult, setDeepDiveResult] = useState<DeepDiveResponse | null>(null);
  const [isDeepDiveLoading, setIsDeepDiveLoading] = useState(false);
  const [deepDiveComplexity, setDeepDiveComplexity] = useState<ComplexityLevel>(ComplexityLevel.INTERMEDIATE);

  // API Key Handlers with LocalStorage Persistence
  const handleSetApiKey = (key: string) => {
    setApiKey(key);
    if (key) {
      localStorage.setItem('gemini_api_key', key);
    } else {
      localStorage.removeItem('gemini_api_key');
    }
  };

  // Handlers
  const handleFileLoaded = useCallback(async (file: File) => {
    setFileName(file.name);
    setStatus({ step: 'extracting', message: 'جاري قراءة الملف...', progress: 10 });
    setSourceText('');
    setSourceImage(null);
    
    try {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          // Extract base64 data (remove data:image/xxx;base64, prefix)
          const base64Data = result.split(',')[1];
          setSourceImage({ data: base64Data, mimeType: file.type });
          setStatus({ step: 'idle', message: 'تم تحميل الصورة بنجاح', progress: 30 });
        };
        reader.readAsDataURL(file);
      } else if (file.name.endsWith('.pptx') || file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
        const text = await extractTextFromPPTX(file);
        setSourceText(text);
        setStatus({ step: 'idle', message: 'تم استخراج النص بنجاح', progress: 30 });
      } else if (file.type === 'application/pdf') {
        const text = await extractTextFromPDF(file);
        setSourceText(text);
        setStatus({ step: 'idle', message: 'تم استخراج النص بنجاح', progress: 30 });
      } else {
        throw new Error('نوع الملف غير مدعوم. يرجى استخدام PDF أو PowerPoint أو صور.');
      }
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
    if (!sourceText && !sourceImage) {
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

      const result = await analyzeText(apiKey, { text: sourceText, image: sourceImage }, summaryType, maxSections);
      
      clearInterval(progressInterval);
      setAnalysisResult(result);
      setStatus({ step: 'completed', message: 'تم التحليل بنجاح!', progress: 100 });
    } catch (error: any) {
      console.error(error);
      setStatus({ step: 'error', message: `حدث خطأ أثناء التحليل: ${error.message}`, progress: 0 });
    }
  }, [apiKey, sourceText, sourceImage, summaryType, maxSections]);

  const handleDeepDive = useCallback(async (term: string) => {
    setDeepDiveTerm(term);
    setIsDeepDiveOpen(true);
    setDeepDiveResult(null);
    setIsDeepDiveLoading(true);

    try {
      const result = await explainConcept(apiKey, term, sourceText, deepDiveComplexity);
      setDeepDiveResult(result);
    } catch (error) {
      console.error(error);
      setDeepDiveResult({
        explanation: 'حدث خطأ أثناء محاولة شرح المفهوم. يرجى المحاولة مرة أخرى.',
        relatedTerms: []
      });
    } finally {
      setIsDeepDiveLoading(false);
    }
  }, [apiKey, sourceText, deepDiveComplexity]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-5xl flex-grow">
        
        {/* API Key Section */}
        <section className="mb-8 animate-fade-in-up">
          <ApiKeyInput apiKey={apiKey} setApiKey={handleSetApiKey} />
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
              disabled={(!sourceText && !sourceImage) || !apiKey || status.step === 'analyzing' || status.step === 'extracting'}
              className={`w-full font-bold py-4 rounded-lg shadow transition transform active:scale-95 flex justify-center items-center gap-2
                ${((!sourceText && !sourceImage) || !apiKey) ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'}
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
            onOpenDeepDive={(term) => term ? handleDeepDive(term) : setIsDeepDiveOpen(true)}
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
        complexity={deepDiveComplexity}
        setComplexity={setDeepDiveComplexity}
      />
    </div>
  );
};

export default App;