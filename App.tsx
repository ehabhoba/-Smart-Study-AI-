import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { ApiKeyInput } from './components/ApiKeyInput';
import { FileUpload } from './components/FileUpload';
import { ProcessingArea } from './components/ProcessingArea';
import { ResultsDisplay } from './components/ResultsDisplay';
import { DeepDivePanel } from './components/DeepDivePanel';
import { SeoContent } from './components/SeoContent';
import { HistoryList } from './components/HistoryList';
import { OnboardingTour } from './components/OnboardingTour';
import { AboutPage } from './components/pages/AboutPage';
import { ContactPage } from './components/pages/ContactPage';
import { PrivacyPage } from './components/pages/PrivacyPage';
import { PricingPage } from './components/pages/PricingPage';
import { extractTextFromPDF } from './services/pdfService';
import { extractTextFromPPTX } from './services/pptxService';
import { analyzeText, explainConcept } from './services/geminiService';
import { StudyAnalysisResult, SummaryType, ProcessingStatus, DeepDiveResponse, ComplexityLevel } from './types';
import { BookOpen, Github, Globe, Lock, PenTool, Search, ScanLine, Sparkles, Cpu, Scan, Languages } from 'lucide-react';
import { SubscriptionState, checkAndResetSubscription } from './config/subscriptionConfig';

const App: React.FC = () => {
  // Navigation & Language State
  const [currentPage, setCurrentPage] = useState('home');
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'ar' ? 'en' : 'ar');
  };

  // Robust Subscription Initialization
  const [subscription, setSubscription] = useState<SubscriptionState>(() => checkAndResetSubscription());

  // Auto-refresh subscription when tab becomes visible (handles overnight open tabs)
  useEffect(() => {
    const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
            const updatedState = checkAndResetSubscription();
            // Only update if something changed
            setSubscription(prev => {
                if (updatedState.lastDailyReset !== prev.lastDailyReset || updatedState.remainingCredits !== prev.remainingCredits) {
                    return updatedState;
                }
                return prev;
            });
        }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Persist subscription changes
  const updateSubscription = (newState: SubscriptionState) => {
    setSubscription(newState);
    try {
        localStorage.setItem('smart_study_sub', JSON.stringify(newState));
    } catch (e) {
        console.error("Failed to save subscription state", e);
    }
  };

  const [sourceText, setSourceText] = useState<string>('');
  const [sourceImage, setSourceImage] = useState<{ data: string, mimeType: string } | null>(null);
  const [extractedFileImages, setExtractedFileImages] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [status, setStatus] = useState<ProcessingStatus>({ step: 'idle', message: '', progress: 0 });
  const [analysisResult, setAnalysisResult] = useState<StudyAnalysisResult | null>(null);
  const [showTour, setShowTour] = useState(false);
  
  // History State
  const [history, setHistory] = useState<StudyAnalysisResult[]>(() => {
    try {
      const saved = localStorage.getItem('smart_study_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load history", e);
      return [];
    }
  });

  // Check for first time visit to show tour
  useEffect(() => {
    const hasSeenTour = localStorage.getItem('smart_study_tour_seen');
    if (!hasSeenTour) {
      setShowTour(true);
    }
  }, []);

  const closeTour = () => {
    setShowTour(false);
    localStorage.setItem('smart_study_tour_seen', 'true');
  };

  const saveToHistory = (result: StudyAnalysisResult) => {
    const historyItem: StudyAnalysisResult = {
        ...result,
        extractedImages: [] // Clear images for storage to save space
    };

    const newHistory = [historyItem, ...history].slice(0, 10);
    setHistory(newHistory);
    try {
      localStorage.setItem('smart_study_history', JSON.stringify(newHistory));
    } catch (e) {
      console.error("Storage Quota Exceeded. Clearing old history.", e);
      const resetHistory = [historyItem];
      setHistory(resetHistory);
      localStorage.setItem('smart_study_history', JSON.stringify(resetHistory));
    }
  };

  const deleteFromHistory = (id: string) => {
    const newHistory = history.filter(h => h.id !== id);
    setHistory(newHistory);
    localStorage.setItem('smart_study_history', JSON.stringify(newHistory));
  };

  const handleImportHistory = (importedHistory: StudyAnalysisResult[]) => {
      setHistory(importedHistory);
      localStorage.setItem('smart_study_history', JSON.stringify(importedHistory));
      alert('تم استعادة الأرشيف بنجاح! 🎉');
  };

  // Configuration State
  const [summaryType, setSummaryType] = useState<SummaryType>(SummaryType.FULL_ANALYSIS);
  const [maxSections, setMaxSections] = useState<number | undefined>(undefined);
  const [targetLanguage, setTargetLanguage] = useState<string>('auto');

  // Deep Dive State
  const [isDeepDiveOpen, setIsDeepDiveOpen] = useState(false);
  const [deepDiveTerm, setDeepDiveTerm] = useState('');
  const [deepDiveResult, setDeepDiveResult] = useState<DeepDiveResponse | null>(null);
  const [isDeepDiveLoading, setIsDeepDiveLoading] = useState(false);
  const [deepDiveComplexity, setDeepDiveComplexity] = useState<ComplexityLevel>(ComplexityLevel.INTERMEDIATE);

  const handleFileLoaded = useCallback(async (file: File) => {
    setFileName(file.name);
    setStatus({ step: 'extracting', message: language === 'ar' ? 'جاري قراءة الملف واستخراج الصور...' : 'Reading file and extracting images...', progress: 10 });
    setSourceText('');
    setSourceImage(null);
    setExtractedFileImages([]);
    setAnalysisResult(null);
    
    try {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          const base64Data = result.split(',')[1];
          setSourceImage({ data: base64Data, mimeType: file.type });
          setStatus({ step: 'idle', message: language === 'ar' ? 'تم تحميل الصورة بنجاح' : 'Image loaded successfully', progress: 30 });
        };
        reader.readAsDataURL(file);
      } else if (file.name.endsWith('.pptx') || file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
        const { text, images } = await extractTextFromPPTX(file);
        setSourceText(text);
        setExtractedFileImages(images);
        setStatus({ step: 'idle', message: language === 'ar' ? `تم استخراج النص و ${images.length} صورة بنجاح` : `Extracted text and ${images.length} images`, progress: 30 });
      } else if (file.type === 'application/pdf') {
        const text = await extractTextFromPDF(file);
        setSourceText(text);
        setStatus({ step: 'idle', message: language === 'ar' ? 'تم استخراج النص بنجاح' : 'Text extracted successfully', progress: 30 });
      } else {
        throw new Error('نوع الملف غير مدعوم. يرجى استخدام PDF أو PowerPoint أو صور.');
      }
    } catch (error: any) {
      console.error(error);
      setStatus({ step: 'error', message: error.message || 'فشل في قراءة الملف.', progress: 0 });
    }
  }, [language]);

  const handleClearFile = useCallback(() => {
    if (window.confirm(language === 'ar' ? 'هل أنت متأكد من حذف الملف الحالي والنتائج؟' : 'Are you sure you want to clear the current file?')) {
      setFileName('');
      setSourceText('');
      setSourceImage(null);
      setExtractedFileImages([]);
      setStatus({ step: 'idle', message: '', progress: 0 });
      setAnalysisResult(null);
    }
  }, [language]);

  const handleLoadHistory = (item: StudyAnalysisResult) => {
    setAnalysisResult(item);
    setFileName(item.fileName || 'ملخص محفوظ');
    setSourceText('');
    setExtractedFileImages(item.extractedImages || []);
    setStatus({ step: 'completed', message: 'تم استرجاع الملخص من الأرشيف', progress: 100 });
    
    if (item.detectedLanguage) {
      setLanguage(item.detectedLanguage === 'ar' ? 'ar' : 'en');
    }
    window.scrollTo({ top: 300, behavior: 'smooth' });
    setCurrentPage('home');
  };

  const handleStartProcessing = useCallback(async () => {
    if (subscription.remainingCredits <= 0) {
      if (subscription.currentTier === 0) {
        alert('لقد استهلكت الـ 5 محاولات اليومية المجانية. يرجى الانتظار 24 ساعة أو شحن رصيد مدفوع.');
      } else {
        alert('عفواً، رصيدك نفذ. يرجى شحن رصيد جديد للمتابعة.');
      }
      document.getElementById('subscription-section')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    if (!sourceText && !sourceImage) {
      alert('يرجى رفع ملف أو صورة أولاً.');
      return;
    }

    if (!subscription.activeApiKey) {
      alert('خطأ في مفتاح API. يرجى تحديث الصفحة.');
      return;
    }

    setStatus({ step: 'analyzing', message: language === 'ar' ? 'جاري تحليل المحتوى وتوليد الملخص...' : 'Analyzing content and generating summary...', progress: 40 });
    setAnalysisResult(null);

    try {
      const result = await analyzeText(
        subscription.activeApiKey,
        { text: sourceText, image: sourceImage || undefined },
        summaryType,
        maxSections,
        extractedFileImages.length,
        targetLanguage
      );

      const finalResult = {
        ...result,
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        fileName: fileName,
        extractedImages: extractedFileImages
      };

      setAnalysisResult(finalResult);
      saveToHistory(finalResult);
      setStatus({ step: 'completed', message: 'تم التحليل بنجاح!', progress: 100 });
      
      if (finalResult.detectedLanguage) {
          setLanguage(finalResult.detectedLanguage === 'ar' ? 'ar' : 'en');
      }

      if (subscription.currentTier !== 999) {
          const newCredits = Math.max(0, subscription.remainingCredits - 1);
          const newState = { ...subscription, remainingCredits: newCredits };
          updateSubscription(newState);
      }

    } catch (error: any) {
      console.error(error);
      setStatus({ step: 'error', message: error.message || 'حدث خطأ أثناء التحليل.', progress: 0 });
    }
  }, [subscription, sourceText, sourceImage, extractedFileImages, fileName, summaryType, maxSections, language, targetLanguage]);

  const handleDeepDive = async (term: string) => {
    setDeepDiveTerm(term);
    setIsDeepDiveOpen(true);
    setDeepDiveResult(null);
    setIsDeepDiveLoading(true);

    try {
        const result = await explainConcept(
            subscription.activeApiKey,
            term,
            sourceText || analysisResult?.summary || '',
            deepDiveComplexity
        );
        setDeepDiveResult(result);
    } catch (error) {
        console.error(error);
    } finally {
        setIsDeepDiveLoading(false);
    }
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'about': return <AboutPage />;
      case 'contact': return <ContactPage />;
      case 'privacy': return <PrivacyPage />;
      case 'pricing': return <PricingPage onNavigateHome={() => setCurrentPage('home')} />;
      case 'home':
      default:
        return (
          <div className="container mx-auto px-4 md:px-6 py-8 max-w-7xl">
            {/* Subscription Status Section */}
            <section id="subscription-section" className="mb-8">
              <ApiKeyInput subscription={subscription} updateSubscription={updateSubscription} />
            </section>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
              
              {/* Left Column: Controls (4/12) */}
              <div className="lg:col-span-4 space-y-6">
                 {/* Upload */}
                 <section id="upload-section">
                    <FileUpload 
                      onFileLoaded={handleFileLoaded} 
                      fileName={fileName} 
                      disabled={status.step === 'analyzing'}
                      onClear={handleClearFile}
                    />
                 </section>

                 {/* Settings */}
                 <section id="settings-section" className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                       <ScanLine size={20} className="text-blue-600" />
                       إعدادات التحليل
                    </h3>
                    
                    <div className="space-y-4">
                       <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">لغة الملخص:</label>
                          <div className="relative">
                            <Languages className="absolute left-3 top-3 text-gray-400" size={16} />
                            <select 
                              value={targetLanguage}
                              onChange={(e) => setTargetLanguage(e.target.value)}
                              className="w-full p-2 pl-10 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                            >
                               <option value="auto">🌐 نفس لغة الكتاب (تلقائي)</option>
                               <option value="ar">🇸🇦 العربية (ترجمة)</option>
                               <option value="en">🇺🇸 English (Translate)</option>
                               <option value="fr">🇫🇷 Français (Traduire)</option>
                            </select>
                          </div>
                       </div>

                       <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">نوع الملخص:</label>
                          <select 
                            value={summaryType}
                            onChange={(e) => setSummaryType(e.target.value as SummaryType)}
                            className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
                          >
                             <option value={SummaryType.FULL_ANALYSIS}>تحليل شامل (أكاديمي)</option>
                             <option value={SummaryType.PRECISE_SUMMARY}>تلخيص دقيق (مركز)</option>
                             <option value={SummaryType.EXAM_CAPSULE}>كبسولة الامتحان (مراجعة نهائية)</option>
                             <option value={SummaryType.MALZAMA}>تحويل لملزمة شرح</option>
                             <option value={SummaryType.WORKSHEET}>ورقة عمل وتدريبات</option>
                             <option value={SummaryType.QA_ONLY}>استخراج أسئلة فقط</option>
                          </select>
                       </div>

                       <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">عدد أقسام الملخص (تقريبي):</label>
                          <div className="flex items-center gap-4">
                              <input 
                                type="range" 
                                min="3" max="15" 
                                value={maxSections || 5} 
                                onChange={(e) => setMaxSections(parseInt(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                              />
                              <span className="text-sm font-bold bg-blue-100 text-blue-800 px-2 py-1 rounded min-w-[30px] text-center">{maxSections || 5}</span>
                          </div>
                       </div>
                    </div>

                    <button
                      onClick={handleStartProcessing}
                      disabled={!fileName || status.step === 'analyzing'}
                      className={`
                        w-full mt-6 py-3 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2
                        ${!fileName || status.step === 'analyzing'
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl'
                        }
                      `}
                    >
                      {status.step === 'analyzing' ? 'جاري التحليل...' : (
                        <>
                          <Sparkles size={20} /> ابدأ التحليل الذكي
                        </>
                      )}
                    </button>
                 </section>

                 {/* History */}
                 <HistoryList 
                    history={history} 
                    onLoad={handleLoadHistory} 
                    onDelete={deleteFromHistory} 
                    onImport={handleImportHistory}
                 />
              </div>

              {/* Right Column: Results (8/12) */}
              <div className="lg:col-span-8">
                 <ProcessingArea status={status} />
                 
                 {analysisResult && (
                    <div id="results-section">
                       <ResultsDisplay 
                          result={analysisResult} 
                          apiKey={subscription.activeApiKey}
                          onOpenDeepDive={handleDeepDive}
                       />
                    </div>
                 )}

                 {!analysisResult && status.step === 'idle' && (
                    <SeoContent />
                 )}
              </div>

            </div>
          </div>
        );
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 flex flex-col font-sans transition-colors duration-300`}>
      <Header 
        currentPage={currentPage} 
        onNavigate={setCurrentPage} 
        language={language}
        onToggleLanguage={toggleLanguage}
      />
      
      <main className="flex-grow pt-4">
        {renderContent()}
      </main>

      <footer className="bg-white border-t py-8 mt-12 no-print">
        <div className="container mx-auto px-4 text-center text-gray-500">
          <p className="flex items-center justify-center gap-2 mb-2">
            تم التطوير بواسطة <a href="https://ehabgm.online" className="text-blue-600 font-bold hover:underline">EhabGM</a> © 2024
          </p>
          <p className="text-xs">جميع الحقوق محفوظة. يستخدم هذا الموقع الذكاء الاصطناعي وقد يحتوي على نسبة خطأ بسيطة.</p>
        </div>
      </footer>

      {/* Deep Dive Modal */}
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

      {/* Tour */}
      {showTour && <OnboardingTour onClose={closeTour} />}
    </div>
  );
};

export default App;