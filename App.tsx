
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
import { BookOpen, Github, Globe, Lock } from 'lucide-react';
import { SubscriptionState, DAILY_FREE_LIMIT, TRIAL_KEY } from './config/subscriptionConfig';

const App: React.FC = () => {
  // Navigation State
  const [currentPage, setCurrentPage] = useState('home');

  // Subscription State Initialization with Daily Reset Check
  const [subscription, setSubscription] = useState<SubscriptionState>(() => {
    const saved = localStorage.getItem('smart_study_sub');
    let initialState: SubscriptionState;

    if (saved) {
      initialState = JSON.parse(saved);
    } else {
      // New user default state
      initialState = {
        hasUsedTrial: false,
        remainingCredits: 0,
        currentTier: 0,
        activeApiKey: '',
        lastDailyReset: undefined
      };
    }
    
    // Check for Daily Reset (Only for Free Tier Users)
    if (initialState.currentTier === 0) {
        const now = new Date();
        const lastReset = initialState.lastDailyReset ? new Date(initialState.lastDailyReset) : new Date(0);
        
        // Calculate difference in hours
        const diffHours = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60);

        // If more than 24 hours have passed OR it's a completely new user
        if (diffHours >= 24 || !initialState.lastDailyReset) {
            initialState = {
                ...initialState,
                remainingCredits: DAILY_FREE_LIMIT, // Reset to 5
                activeApiKey: TRIAL_KEY, // Ensure trial key is set
                lastDailyReset: now.toISOString(),
                hasUsedTrial: true // Flag as "using" the free tier
            };
            // Save immediately to avoid race conditions
            localStorage.setItem('smart_study_sub', JSON.stringify(initialState));
        }
    }

    return initialState;
  });

  // Persist subscription changes
  const updateSubscription = (newState: SubscriptionState) => {
    setSubscription(newState);
    localStorage.setItem('smart_study_sub', JSON.stringify(newState));
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
    // IMPORTANT: Create a lightweight version of the result for history
    // LocalStorage has a 5MB limit. Storing extracted images (Base64) will crash it immediately.
    const historyItem: StudyAnalysisResult = {
        ...result,
        extractedImages: [] // Clear images for storage to save space
    };

    const newHistory = [historyItem, ...history].slice(0, 10); // Keep last 10
    setHistory(newHistory);
    try {
      localStorage.setItem('smart_study_history', JSON.stringify(newHistory));
    } catch (e) {
      console.error("Storage Quota Exceeded. Clearing old history.", e);
      // Fallback: Clear history and try saving just the new one
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

  // Configuration State
  const [summaryType, setSummaryType] = useState<SummaryType>(SummaryType.MEDIUM);
  const [maxSections, setMaxSections] = useState<number | undefined>(undefined);

  // Deep Dive State
  const [isDeepDiveOpen, setIsDeepDiveOpen] = useState(false);
  const [deepDiveTerm, setDeepDiveTerm] = useState('');
  const [deepDiveResult, setDeepDiveResult] = useState<DeepDiveResponse | null>(null);
  const [isDeepDiveLoading, setIsDeepDiveLoading] = useState(false);
  const [deepDiveComplexity, setDeepDiveComplexity] = useState<ComplexityLevel>(ComplexityLevel.INTERMEDIATE);

  // Handlers
  const handleFileLoaded = useCallback(async (file: File) => {
    setFileName(file.name);
    setStatus({ step: 'extracting', message: 'جاري قراءة الملف واستخراج الصور...', progress: 10 });
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
          setStatus({ step: 'idle', message: 'تم تحميل الصورة بنجاح', progress: 30 });
        };
        reader.readAsDataURL(file);
      } else if (file.name.endsWith('.pptx') || file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
        const { text, images } = await extractTextFromPPTX(file);
        setSourceText(text);
        setExtractedFileImages(images);
        setStatus({ step: 'idle', message: `تم استخراج النص و ${images.length} صورة بنجاح`, progress: 30 });
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

  const handleClearFile = useCallback(() => {
    if (window.confirm('هل أنت متأكد من حذف الملف الحالي والنتائج؟')) {
      setFileName('');
      setSourceText('');
      setSourceImage(null);
      setExtractedFileImages([]);
      setStatus({ step: 'idle', message: '', progress: 0 });
      setAnalysisResult(null);
    }
  }, []);

  const handleLoadHistory = (item: StudyAnalysisResult) => {
    setAnalysisResult(item);
    setFileName(item.fileName || 'ملخص محفوظ');
    setSourceText(''); // We might not have source text saved to save space, but we have the result
    setExtractedFileImages(item.extractedImages || []);
    setStatus({ step: 'completed', message: 'تم استرجاع الملخص من الأرشيف', progress: 100 });
    window.scrollTo({ top: 300, behavior: 'smooth' });
    setCurrentPage('home'); // Switch back to home view
  };

  const handleStartProcessing = useCallback(async () => {
    // 1. Check if user has credits
    if (subscription.remainingCredits <= 0) {
      if (subscription.currentTier === 0) {
        alert('لقد استهلكت الـ 5 محاولات اليومية المجانية. يرجى الانتظار 24 ساعة أو شحن رصيد مدفوع.');
      } else {
        alert('عفواً، رصيدك نفذ. يرجى شحن رصيد جديد للمتابعة.');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!subscription.activeApiKey) {
      alert('حدث خطأ في تفعيل الاشتراك. يرجى إعادة إدخال الكود.');
      return;
    }

    if (!sourceText && !sourceImage) {
      alert('يرجى رفع ملف صالح أولاً');
      return;
    }

    // Deduct 1 credit immediately before processing to prevent abuse
    const newCredits = subscription.remainingCredits - 1;
    updateSubscription({
      ...subscription,
      remainingCredits: newCredits
    });

    // Initial status
    setStatus({ step: 'analyzing', message: 'بدء التحليل الذكي للهيكل العام...', progress: 40 });

    const progressInterval = setInterval(() => {
      setStatus(prev => {
        if (prev.step !== 'analyzing') return prev;
        
        const newProgress = Math.min(prev.progress + 1, 98);
        
        let newMessage = prev.message;
        if (newProgress > 45 && newProgress < 60) newMessage = 'جاري استخراج المفاهيم الأساسية والمصطلحات...';
        else if (newProgress >= 60 && newProgress < 75) newMessage = 'جاري رسم المخططات الهندسية والبيانية (Mermaid)...';
        else if (newProgress >= 75 && newProgress < 85) newMessage = 'جاري صياغة أسئلة المراجعة الذكية...';
        else if (newProgress >= 85 && newProgress < 95) newMessage = 'يتم تجميع وتنسيق الملخص النهائي...';
        else if (newProgress >= 95) newMessage = 'لمسات أخيرة...';

        return { ...prev, progress: newProgress, message: newMessage };
      });
    }, 800);

    try {
      const result = await analyzeText(
        subscription.activeApiKey, // Use the managed key
        { text: sourceText, image: sourceImage }, 
        summaryType, 
        maxSections,
        extractedFileImages.length
      );
      
      const finalResult: StudyAnalysisResult = {
        ...result,
        extractedImages: extractedFileImages.length > 0 ? extractedFileImages : undefined,
        id: Date.now().toString(),
        date: new Date().toISOString(),
        fileName: fileName
      };
      
      clearInterval(progressInterval);
      setAnalysisResult(finalResult);
      saveToHistory(finalResult); // Save to history immediately
      setStatus({ step: 'completed', message: 'تم التحليل والتطوير بنجاح!', progress: 100 });
    } catch (error: any) {
      clearInterval(progressInterval);
      console.error(error);
      
      const errMsg = error.message || '';
      
      // Handle Leaked or Quota errors explicitly
      if (errMsg.includes('leaked') || errMsg.includes('Quota') || errMsg.includes('PERMISSION_DENIED') || errMsg.includes('API key')) {
         // 1. Refund the credit since the system failed
         updateSubscription({
            ...subscription,
            remainingCredits: subscription.remainingCredits + 1, // Refund credit
            activeApiKey: '' // Revoke invalid key
         });

         setStatus({ 
           step: 'error', 
           message: 'عفواً، كود التفعيل الحالي لم يعد صالحاً (تم إيقافه). يرجى استخدام كود جديد.', 
           progress: 0 
         });
         
         alert('⚠️ تنبيه هام:\nلقد تم إيقاف كود التفعيل المستخدم حالياً من المصدر (Google) لأسباب أمنية أو تجاوز الحصة.\n\nلا تقلق، لقد قمنا باسترجاع رصيدك لهذه المحاولة.\n\nيرجى إدخال كود تفعيل جديد في خانة الاشتراك للمتابعة.');
         
         const subSection = document.getElementById('subscription-section');
         if (subSection) subSection.scrollIntoView({ behavior: 'smooth' });

      } else {
         setStatus({ step: 'error', message: `حدث خطأ أثناء التحليل: ${errMsg}`, progress: 0 });
      }
    }
  }, [subscription, sourceText, sourceImage, summaryType, maxSections, extractedFileImages, fileName, history]);

  const handleDeepDive = useCallback(async (term: string) => {
    // Deep dive is "Free" as long as they have an active session or key
    if (!subscription.activeApiKey) {
        alert("يرجى تفعيل الاشتراك أولاً.");
        return;
    }

    setDeepDiveTerm(term);
    setIsDeepDiveOpen(true);
    setDeepDiveResult(null);
    setIsDeepDiveLoading(true);

    try {
      const result = await explainConcept(subscription.activeApiKey, term, sourceText || (analysisResult?.summary || ''), deepDiveComplexity);
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
  }, [subscription.activeApiKey, sourceText, deepDiveComplexity, analysisResult]);

  // Handle Navigation
  const handleNavigate = (page: string) => {
     setCurrentPage(page);
     window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'about': return <AboutPage />;
      case 'contact': return <ContactPage />;
      case 'privacy': return <PrivacyPage />;
      case 'pricing': return <PricingPage onNavigateHome={() => handleNavigate('home')} />;
      case 'home':
      default:
        return (
          <main className="container mx-auto px-4 py-8 max-w-5xl flex-grow">
            {/* Subscription / Access Control Section */}
            <section className="mb-8 animate-fade-in-up" id="subscription-section">
              <ApiKeyInput subscription={subscription} updateSubscription={updateSubscription} />
            </section>

            {/* Upload & Config Grid */}
            <div className={`grid md:grid-cols-2 gap-6 mb-8 transition-opacity duration-300 ${subscription.remainingCredits <= 0 ? 'opacity-50 pointer-events-none filter blur-[1px]' : ''}`}>
              <div id="upload-section" className="h-full">
                <FileUpload 
                  onFileLoaded={handleFileLoaded} 
                  fileName={fileName}
                  disabled={status.step === 'analyzing' || status.step === 'extracting'}
                  onClear={handleClearFile}
                />
              </div>
              
              <div id="settings-section" className="bg-white rounded-xl shadow-md p-6 border border-gray-100 flex flex-col justify-between h-full relative">
                 {/* Lock Overlay if no credits */}
                 {subscription.remainingCredits <= 0 && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-50/50">
                        <Lock className="text-gray-400 w-16 h-16" />
                    </div>
                 )}

                <div>
                  <h2 className="text-xl font-bold mb-4 text-blue-800 flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    2. إعدادات التلخيص والرسم
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
                      <option value={SummaryType.FULL}>🎓 تلخيص شامل (تفصيلي وهندسي)</option>
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
                  disabled={(!sourceText && !sourceImage) || subscription.remainingCredits <= 0 || status.step === 'analyzing' || status.step === 'extracting'}
                  className={`w-full font-bold py-4 rounded-lg shadow transition transform active:scale-95 flex justify-center items-center gap-2
                    ${((!sourceText && !sourceImage) || subscription.remainingCredits <= 0) ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'}
                  `}
                >
                   <span>✨ ابدأ التحليل (يخصم 1 رصيد)</span>
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
                apiKey={subscription.activeApiKey}
                onOpenDeepDive={(term) => term ? handleDeepDive(term) : setIsDeepDiveOpen(true)}
              />
            )}

            {/* History Area */}
            {history.length > 0 && (
              <HistoryList history={history} onLoad={handleLoadHistory} onDelete={deleteFromHistory} />
            )}

            {/* SEO Content Section */}
            <SeoContent />
          </main>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Header currentPage={currentPage} onNavigate={handleNavigate} />

      {/* Onboarding Tour Modal */}
      {showTour && currentPage === 'home' && <OnboardingTour onClose={closeTour} />}

      {/* Dynamic Content */}
      {renderContent()}

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

      {/* SEO Footer */}
      <footer className="bg-gray-100 border-t border-gray-200 py-8 mt-auto text-center text-gray-500 text-sm">
        <div className="container mx-auto px-4">
          <div className="flex justify-center gap-6 mb-6 font-medium">
             <button onClick={() => handleNavigate('home')} className="hover:text-blue-600">الرئيسية</button>
             <button onClick={() => handleNavigate('pricing')} className="hover:text-blue-600">الأسعار</button>
             <button onClick={() => handleNavigate('about')} className="hover:text-blue-600">من نحن</button>
             <button onClick={() => handleNavigate('contact')} className="hover:text-blue-600">اتصل بنا</button>
             <button onClick={() => handleNavigate('privacy')} className="hover:text-blue-600">الخصوصية</button>
          </div>
          <p className="mb-4">
            المُلخص الدراسي الذكي © 2024 تم تصميمه وتطويره بواسطة <a href="https://ehabgm.online" className="text-blue-600 hover:underline font-bold" target="_blank" rel="noopener noreferrer">ehabgm.online</a> - مدعوم بواسطة Google Gemini 2.5 Flash
          </p>
          <div className="flex justify-center gap-4 mb-6">
            <span className="flex items-center gap-1 hover:text-blue-600 transition"><Globe size={16} /> تلخيص PDF</span>
            <span className="flex items-center gap-1 hover:text-blue-600 transition"><BookOpen size={16} /> شرح مناهج</span>
            <span className="flex items-center gap-1 hover:text-blue-600 transition"><Github size={16} /> ذكاء اصطناعي</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
