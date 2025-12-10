
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
import { BookOpen, Github, Globe, Lock, PenTool, Search, ScanLine, Sparkles, Cpu, Scan } from 'lucide-react';
import { SubscriptionState, DAILY_FREE_LIMIT, TRIAL_KEY } from './config/subscriptionConfig';

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

  // Import History Handler
  const handleImportHistory = (importedHistory: StudyAnalysisResult[]) => {
      setHistory(importedHistory);
      localStorage.setItem('smart_study_history', JSON.stringify(importedHistory));
      alert('تم استعادة الأرشيف بنجاح! 🎉');
  };

  // Configuration State
  const [summaryType, setSummaryType] = useState<SummaryType>(SummaryType.FULL_ANALYSIS);
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
    setStatus({ step: 'analyzing', message: 'بدء التحليل الذكي وتحديد نوع المادة...', progress: 40 });

    const progressInterval = setInterval(() => {
      setStatus(prev => {
        if (prev.step !== 'analyzing') return prev;
        
        const newProgress = Math.min(prev.progress + 1, 98);
        
        let newMessage = prev.message;
        if (newProgress > 45 && newProgress < 60) newMessage = 'جاري استخراج المفاهيم الأساسية والمصطلحات...';
        else if (newProgress >= 60 && newProgress < 75) newMessage = 'جاري رسم المخططات الهندسية والبيانية (Mermaid)...';
        else if (newProgress >= 75 && newProgress < 85) newMessage = 'جاري صياغة الأسئلة وفق نمط الامتحانات...';
        else if (newProgress >= 85 && newProgress < 95) newMessage = 'يتم تجميع وتنسيق الملف النهائي...';
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
      if (errMsg.includes('leaked') || errMsg.includes('Quota') || errMsg.includes('PERMISSION_DENIED') || errMsg.includes('API key') || errMsg.includes('403') || errMsg.includes('429')) {
         // 1. Refund the credit since the system failed
         updateSubscription({
            ...subscription,
            remainingCredits: subscription.remainingCredits + 1, // Refund credit
            activeApiKey: '' // Revoke invalid key so user sees input again
         });

         setStatus({ 
           step: 'error', 
           message: 'عفواً، المفتاح المستخدم لم يعد صالحاً. يرجى إدخال كود جديد.', 
           progress: 0 
         });
         
         alert('⚠️ تنبيه هام: مشكلة في مفتاح التفعيل\n\nلقد تم رفض مفتاح API المستخدم حالياً من قبل Google (ربما انتهت صلاحيته أو تم حظره).\n\n✅ لا تقلق: تم استرجاع الرصيد المخصوم لهذه المحاولة.\n\n👇 الإجراء المطلوب:\nيرجى الانتقال لخانة الاشتراك بالأعلى وإدخال كود تفعيل جديد أو مفتاح API خاص بك.');
         
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
            <section className="mb-12 animate-fade-in-up" id="subscription-section">
              <ApiKeyInput subscription={subscription} updateSubscription={updateSubscription} />
            </section>

            {/* Dazzling Holographic Work Area */}
            <section className="relative mb-16 py-4 group isolate">
                
                {/* 1. Magical Background Glows */}
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 rounded-[30px] blur-3xl -z-10 transform scale-105 opacity-50 transition-all duration-1000 group-hover:opacity-100 group-hover:scale-110"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.1),transparent_60%)] -z-10 animate-pulse-slow"></div>

                {/* 2. Floating 3D Elements (Decorations) */}
                <div className="absolute -top-10 -left-10 z-20 animate-float hidden xl:block drop-shadow-2xl">
                    <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-[0_10px_40px_rgba(37,99,235,0.2)] border border-white/60">
                        <PenTool size={40} className="text-blue-600" />
                    </div>
                </div>
                <div className="absolute -bottom-10 -right-10 z-20 animate-float animation-delay-2000 hidden xl:block drop-shadow-2xl">
                     <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-[0_10px_40px_rgba(147,51,234,0.2)] border border-white/60">
                        <Search size={40} className="text-purple-600" />
                    </div>
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 opacity-5 pointer-events-none scale-150">
                     <ScanLine size={400} className="text-blue-900 animate-spin-slow" />
                </div>

                {/* 3. The Functional Grid */}
                <div className={`relative z-10 grid md:grid-cols-2 gap-8 transition-all duration-300 ${subscription.remainingCredits <= 0 ? 'opacity-50 pointer-events-none filter blur-[1px]' : ''}`}>
                  
                  {/* Left Side: Upload with Scanner Effect */}
                  <div id="upload-section" className="relative h-full group/card perspective-1000">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-600 rounded-2xl blur opacity-25 group-hover/card:opacity-60 transition duration-500 animate-pulse-slow"></div>
                    <div className="relative h-full bg-white/80 backdrop-blur-xl rounded-2xl p-1 shadow-2xl ring-1 ring-white/50 overflow-hidden">
                        {/* Scanner Beam */}
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_rgba(34,211,238,0.8)] z-20 animate-scan pointer-events-none opacity-0 group-hover/card:opacity-100"></div>
                        
                        <div className="relative h-full bg-white/50 rounded-xl">
                           <FileUpload 
                              onFileLoaded={handleFileLoaded} 
                              fileName={fileName}
                              disabled={status.step === 'analyzing' || status.step === 'extracting'}
                              onClear={handleClearFile}
                            />
                        </div>
                    </div>
                  </div>
                  
                  {/* Right Side: Settings with Tech Glow */}
                  <div id="settings-section" className="relative h-full group/card">
                     <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-400 to-purple-600 rounded-2xl blur opacity-25 group-hover/card:opacity-60 transition duration-500 animate-pulse-slow"></div>
                     <div className="relative bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 flex flex-col justify-between h-full p-6 ring-1 ring-white/60">
                         {/* Lock Overlay if no credits */}
                         {subscription.remainingCredits <= 0 && (
                            <div className="absolute inset-0 z-30 flex items-center justify-center bg-gray-50/50 backdrop-blur-sm rounded-2xl">
                                <Lock className="text-gray-400 w-16 h-16" />
                            </div>
                         )}

                        <div className="relative z-10">
                          <h2 className="text-xl font-bold mb-4 text-blue-800 flex items-center gap-2">
                            <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><Cpu size={20} /></div>
                            {language === 'ar' ? '2. إعدادات المدرس الذكي' : '2. Analysis Settings'}
                          </h2>
                          
                          <div className="mb-4">
                            <label className="block text-gray-700 font-medium mb-2 flex items-center gap-2">
                              {language === 'ar' ? 'ماذا تريد من الذكاء الاصطناعي؟' : 'What kind of summary do you need?'}
                            </label>
                            <select 
                              value={summaryType}
                              onChange={(e) => setSummaryType(e.target.value as SummaryType)}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white transition-all text-gray-800 font-medium hover:border-blue-400"
                              disabled={status.step === 'analyzing'}
                            >
                              <option value={SummaryType.FULL_ANALYSIS}>🧠 {language === 'ar' ? 'تحليل شامل ومفصل (افتراضي)' : 'Detailed Analysis (Default)'}</option>
                              <option value={SummaryType.PRECISE_SUMMARY}>🔍 {language === 'ar' ? 'تلخيص دقيق (شامل - 25% من المحتوى)' : 'Precise Summary (25% volume)'}</option>
                              <option value={SummaryType.EXAM_CAPSULE}>💊 {language === 'ar' ? 'كبسولة الامتحان (ملخص المراجعة النهائية)' : 'Exam Capsule (Review)'}</option>
                              <option value={SummaryType.MALZAMA}>📚 {language === 'ar' ? 'تحويل إلى ملزمة (Study Guide)' : 'Study Guide (Malzama)'}</option>
                              <option value={SummaryType.WORKSHEET}>📝 {language === 'ar' ? 'ورقة عمل وتدريبات (Worksheet)' : 'Student Worksheet'}</option>
                              <option value={SummaryType.QA_ONLY}>❓ {language === 'ar' ? 'استخراج أسئلة وأجوبة فقط' : 'Q&A Bank Only'}</option>
                            </select>
                            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                                {summaryType === SummaryType.PRECISE_SUMMARY && (language === 'ar' ? "يحافظ على 25% من المحتوى الأصلي بدقة، مثالي للكتب الكبيرة والمراجع." : "Keeps 25% of content fidelity, great for textbooks.")}
                                {summaryType === SummaryType.FULL_ANALYSIS && (language === 'ar' ? "تحليل متوازن يجمع بين الشرح والتلخيص." : "Balanced analysis with summary and explanation.")}
                                {summaryType === SummaryType.EXAM_CAPSULE && (language === 'ar' ? "سيركز على أهم التعريفات، القوانين، وما يتكرر في الامتحانات." : "Focuses on high-yield definitions and exam questions.")}
                            </p>
                          </div>

                          <div className="mb-4">
                            <label className="block text-gray-700 font-medium mb-2">
                                {language === 'ar' ? 'الحد الأقصى للأقسام (اختياري):' : 'Max Sections (Optional):'}
                            </label>
                            <input 
                              type="number" 
                              value={maxSections || ''}
                              onChange={(e) => setMaxSections(e.target.value ? parseInt(e.target.value) : undefined)}
                              placeholder={language === 'ar' ? "اتركه فارغاً للتحليل التلقائي" : "Leave empty for auto"}
                              min="1" 
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white transition-all hover:border-blue-400"
                              disabled={status.step === 'analyzing'}
                            />
                          </div>
                        </div>

                        <button 
                          onClick={handleStartProcessing}
                          disabled={(!sourceText && !sourceImage) || subscription.remainingCredits <= 0 || status.step === 'analyzing' || status.step === 'extracting'}
                          className={`w-full font-bold py-4 rounded-xl shadow-lg transition-all transform active:scale-95 flex justify-center items-center gap-2 relative overflow-hidden group/btn
                            ${((!sourceText && !sourceImage) || subscription.remainingCredits <= 0) ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'}
                          `}
                        >
                           <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
                           <Sparkles size={20} className={status.step === 'analyzing' ? 'animate-spin' : 'animate-pulse'} />
                           <span className="relative z-10">{language === 'ar' ? 'ابدأ التحليل (يخصم 1 رصيد)' : 'Start Analysis (1 Credit)'}</span>
                        </button>
                     </div>
                  </div>
                </div>
            </section>

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
            <HistoryList 
                history={history} 
                onLoad={handleLoadHistory} 
                onDelete={deleteFromHistory} 
                onImport={handleImportHistory} // New Prop
            />

            {/* SEO Content Section */}
            <SeoContent />
          </main>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans transition-all" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <Header 
        currentPage={currentPage} 
        onNavigate={handleNavigate} 
        language={language} 
        onToggleLanguage={toggleLanguage} 
      />

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
