
import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { StudyAnalysisResult } from '../types';
import { FileText, List, HelpCircle, Volume2, Search, Copy, Check, Download, Loader2, Square, Info, Image as ImageIcon, ZoomIn, AlertTriangle, Printer, Camera, FileQuestion, FileDown, Gauge, Maximize2, Layers, BrainCircuit, RefreshCw, Trophy, ChevronDown, ChevronUp, ChevronsDown, ChevronsUp, Eye } from 'lucide-react';
import { generateSpeech } from '../services/geminiService';
import { playAudioFromBase64, stopAudio } from '../services/audioService';
import { marked } from 'marked';
import mermaid from 'mermaid';
import html2canvas from 'html2canvas';

// Initialize mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  themeVariables: {
    fontFamily: 'Cairo, Arial, sans-serif',
    primaryColor: '#e0e7ff', 
    primaryTextColor: '#1e3a8a', 
    primaryBorderColor: '#4338ca', 
    lineColor: '#64748b', 
    secondaryColor: '#f0fdf4', 
    tertiaryColor: '#fffbeb', 
  },
  securityLevel: 'loose',
  flowchart: { htmlLabels: true, curve: 'basis' }
});

const MermaidChart = ({ chart, onInteract }: { chart: string, onInteract?: (term: string) => void }) => {
  const [svg, setSvg] = useState('');
  const [isError, setIsError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const id = useRef(`mermaid-${Math.random().toString(36).substr(2, 9)}`).current;

  useEffect(() => {
    const renderChart = async () => {
      try {
        setIsError(false);
        const cleanChart = chart.replace(/```mermaid|```/g, '').trim();
        const { svg } = await mermaid.render(id, cleanChart);
        setSvg(svg);
      } catch (error) {
        console.error('Mermaid Render Failed:', error);
        setIsError(true);
      }
    };
    renderChart();
  }, [chart, id]);

  useEffect(() => {
    if (!containerRef.current || isError) return;
    const svgElement = containerRef.current.querySelector('svg');
    if (svgElement) {
      svgElement.style.width = '100%';
      svgElement.style.maxWidth = '100%';
      svgElement.style.height = 'auto';
      svgElement.removeAttribute('height'); 
      svgElement.style.display = 'block';
      svgElement.style.margin = '0 auto';
    }

    if (!onInteract) return;

    const nodes = containerRef.current.querySelectorAll('.node, .actor, .mindmap-node, .classTitle, .state, .entityBox');
    nodes.forEach((node) => {
      const el = node as HTMLElement;
      const term = el.textContent?.trim();
      if (term) {
        el.style.cursor = 'pointer';
        if (!el.querySelector('title')) {
           const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
           title.textContent = `اضغط لشرح: ${term}`;
           el.appendChild(title);
        }
        el.onmouseenter = () => { el.style.opacity = '0.8'; el.style.filter = 'drop-shadow(0 0 2px rgba(37, 99, 235, 0.5))'; };
        el.onmouseleave = () => { el.style.opacity = '1'; el.style.filter = 'none'; };
        el.onclick = (e) => { e.preventDefault(); e.stopPropagation(); onInteract(term); };
      }
    });
  }, [svg, onInteract, isError]);

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-red-50 border border-red-100 rounded-lg my-8 text-center no-print">
        <AlertTriangle className="text-red-500 w-6 h-6 mb-2" />
        <p className="text-red-800 font-bold text-sm">تعذر رسم المخطط البياني</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center my-8 w-full group relative page-break-inside-avoid">
        <div 
            ref={containerRef}
            className="mermaid-wrapper w-full p-4 md:p-8 bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 shadow-sm overflow-x-auto flex justify-center" 
            dangerouslySetInnerHTML={{ __html: svg }} 
        />
    </div>
  );
};

// --- FLASHCARD COMPONENT ---
const FlashcardDeck = ({ flashcards, isRtl }: { flashcards: any[], isRtl: boolean }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    if (!flashcards || flashcards.length === 0) return (
        <div className="text-center py-20 text-gray-500">لا توجد بطاقات تعليمية متاحة لهذا الملف.</div>
    );

    const handleNext = () => {
        setIsFlipped(false);
        setTimeout(() => setCurrentIndex((prev) => (prev + 1) % flashcards.length), 200);
    };

    const handlePrev = () => {
        setIsFlipped(false);
        setTimeout(() => setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length), 200);
    };

    const card = flashcards[currentIndex];

    return (
        <div className="flex flex-col items-center justify-center py-10" dir={isRtl ? 'rtl' : 'ltr'}>
            <div className="mb-4 text-sm text-gray-500 font-bold bg-gray-100 px-3 py-1 rounded-full">
                {isRtl ? `بطاقة ${currentIndex + 1} من ${flashcards.length}` : `Card ${currentIndex + 1} of ${flashcards.length}`}
            </div>

            <div 
                className="group w-full max-w-md h-64 perspective-1000 cursor-pointer"
                onClick={() => setIsFlipped(!isFlipped)}
            >
                <div className={`relative w-full h-full duration-500 transform-style-3d transition-all ${isFlipped ? 'rotate-y-180' : ''}`}>
                    {/* Front */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-2xl shadow-xl flex flex-col items-center justify-center p-8 backface-hidden">
                        <h3 className="text-2xl font-bold text-center">{card.term}</h3>
                        <p className="mt-4 text-blue-200 text-sm">{isRtl ? 'اضغط لإظهار التعريف' : 'Click to flip'}</p>
                    </div>
                    
                    {/* Back */}
                    <div className="absolute inset-0 bg-white border-2 border-blue-100 rounded-2xl shadow-xl flex flex-col items-center justify-center p-8 rotate-y-180 backface-hidden">
                        <p className="text-gray-800 text-lg text-center font-medium leading-relaxed">{card.definition}</p>
                    </div>
                </div>
            </div>

            <div className="flex gap-4 mt-8">
                <button onClick={handlePrev} className="px-6 py-2 bg-white border border-gray-300 rounded-full hover:bg-gray-50 font-bold text-gray-700 shadow-sm">
                    {isRtl ? 'السابق' : 'Prev'}
                </button>
                <button onClick={handleNext} className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 font-bold shadow-md">
                    {isRtl ? 'التالي' : 'Next'}
                </button>
            </div>
        </div>
    );
};

// --- QUIZ COMPONENT ---
const InteractiveQuiz = ({ quiz, isRtl }: { quiz: any[], isRtl: boolean }) => {
    const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
    const [showResults, setShowResults] = useState(false);

    if (!quiz || quiz.length === 0) return (
        <div className="text-center py-20 text-gray-500">لا يوجد اختبار تفاعلي متاح لهذا الملف.</div>
    );

    const handleSelect = (qIndex: number, option: string) => {
        if (showResults) return;
        setUserAnswers(prev => ({ ...prev, [qIndex]: option }));
    };

    const calculateScore = () => {
        let score = 0;
        quiz.forEach((q, i) => {
            if (userAnswers[i] === q.correctAnswer) score++;
        });
        return score;
    };

    const resetQuiz = () => {
        setUserAnswers({});
        setShowResults(false);
    };

    return (
        <div className="max-w-3xl mx-auto py-6" dir={isRtl ? 'rtl' : 'ltr'}>
            {!showResults ? (
                <div className="space-y-8">
                    {quiz.map((q, i) => (
                        <div key={i} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex gap-2">
                                <span className="bg-blue-100 text-blue-800 w-8 h-8 flex items-center justify-center rounded-full text-sm shrink-0">{i + 1}</span>
                                {q.question}
                            </h3>
                            <div className="space-y-2">
                                {q.options.map((opt: string, idx: number) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleSelect(i, opt)}
                                        className={`w-full text-start p-3 rounded-lg border transition-all ${
                                            userAnswers[i] === opt 
                                            ? 'bg-blue-50 border-blue-500 text-blue-800 font-bold shadow-inner' 
                                            : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                                        }`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                    <button 
                        onClick={() => setShowResults(true)}
                        disabled={Object.keys(userAnswers).length < quiz.length}
                        className="w-full py-4 bg-green-600 text-white rounded-xl font-bold text-lg hover:bg-green-700 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        {isRtl ? 'تسليم الإجابات وعرض النتيجة' : 'Submit Answers'}
                    </button>
                </div>
            ) : (
                <div className="animate-in zoom-in duration-300">
                    <div className="text-center mb-10 bg-gradient-to-br from-indigo-600 to-purple-700 text-white p-10 rounded-2xl shadow-xl">
                        <Trophy size={48} className="mx-auto text-yellow-300 mb-4" />
                        <h2 className="text-3xl font-bold mb-2">{isRtl ? 'النتيجة النهائية' : 'Final Score'}</h2>
                        <div className="text-6xl font-extrabold mb-2">{calculateScore()} <span className="text-2xl text-indigo-200">/ {quiz.length}</span></div>
                        <p className="text-indigo-100">
                            {calculateScore() === quiz.length ? (isRtl ? "ممتاز! أنت عبقري 🌟" : "Perfect! You are a genius 🌟") : 
                             calculateScore() > quiz.length / 2 ? (isRtl ? "جيد جداً! استمر في المحاولة 👍" : "Great job! Keep trying 👍") : (isRtl ? "تحتاج للمزيد من المذاكرة 📚" : "Needs more study 📚")}
                        </p>
                        <button onClick={resetQuiz} className="mt-6 px-6 py-2 bg-white/20 hover:bg-white/30 rounded-full font-bold flex items-center gap-2 mx-auto backdrop-blur-sm">
                            <RefreshCw size={16} /> {isRtl ? 'إعادة الاختبار' : 'Retry Quiz'}
                        </button>
                    </div>

                    <div className="space-y-6">
                        {quiz.map((q, i) => {
                            const isCorrect = userAnswers[i] === q.correctAnswer;
                            return (
                                <div key={i} className={`p-6 rounded-xl border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                    <div className="flex items-start gap-3">
                                        <div className={`p-2 rounded-full ${isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                            {isCorrect ? <Check size={20} /> : <AlertTriangle size={20} />}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 mb-2">{q.question}</h3>
                                            <p className="text-sm text-gray-600 mb-1">{isRtl ? 'إجابتك:' : 'Your Answer:'} <span className={isCorrect ? 'text-green-700 font-bold' : 'text-red-700 font-bold line-through'}>{userAnswers[i]}</span></p>
                                            {!isCorrect && <p className="text-sm text-green-700 mb-2">{isRtl ? 'الإجابة الصحيحة:' : 'Correct Answer:'} <strong>{q.correctAnswer}</strong></p>}
                                            {q.explanation && (
                                                <div className="mt-3 bg-white p-3 rounded border border-gray-200 text-sm text-gray-600">
                                                    <strong>💡 {isRtl ? 'الشرح' : 'Explanation'}:</strong> {q.explanation}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

// --- COLLAPSIBLE SECTION COMPONENT ---
interface CollapsibleSectionProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  isRtl: boolean;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, isOpen, onToggle, children, isRtl }) => {
    return (
        <div className="border border-gray-200 rounded-xl mb-4 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <button 
                onClick={onToggle}
                className={`w-full flex items-center justify-between p-4 ${isRtl ? 'text-right' : 'text-left'} transition-colors ${isOpen ? 'bg-blue-50 text-blue-900' : 'bg-white text-gray-800 hover:bg-gray-50'}`}
            >
                <div className="flex items-center gap-3">
                    <span className={`p-1 rounded-full ${isOpen ? 'bg-blue-200' : 'bg-gray-100'}`}>
                        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </span>
                    <h3 className="font-bold text-lg md:text-xl">{title}</h3>
                </div>
            </button>
            
            {isOpen && (
                <div className="p-6 bg-white animate-in slide-in-from-top-2 border-t border-gray-100">
                    {children}
                </div>
            )}
        </div>
    );
};

// --- LAZY RENDER LIST COMPONENT ---
// Simulates virtual scrolling by rendering items as user scrolls
const LazyRenderList = ({ items, renderItem }: { items: any[], renderItem: (item: any, index: number) => React.ReactNode }) => {
    const [visibleCount, setVisibleCount] = useState(3);
    const observerTarget = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setVisibleCount(prev => Math.min(prev + 3, items.length));
                }
            },
            { threshold: 0.1 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => observer.disconnect();
    }, [items.length]);

    return (
        <div className="space-y-2">
            {items.slice(0, visibleCount).map((item, index) => renderItem(item, index))}
            {visibleCount < items.length && (
                <div ref={observerTarget} className="h-20 flex items-center justify-center p-4">
                    <Loader2 className="animate-spin text-blue-500" />
                    <span className="text-gray-500 text-sm mr-2">...</span>
                </div>
            )}
        </div>
    );
};


interface Props {
  result: StudyAnalysisResult;
  apiKey: string;
  onOpenDeepDive: (term?: string) => void;
}

type AudioState = 'idle' | 'generating' | 'playing';

export const ResultsDisplay: React.FC<Props> = ({ result, apiKey, onOpenDeepDive }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'summary' | 'flashcards' | 'quiz' | 'qa' | 'figures'>('summary');
  const [audioState, setAudioState] = useState<AudioState>('idle');
  const [selectedVoice, setSelectedVoice] = useState('Zephyr');
  const [readingSpeed, setReadingSpeed] = useState(1.0);
  const [isPrinting, setIsPrinting] = useState(false);
  
  const [highlightedText, setHighlightedText] = useState<string | null>(null);
  const stopPlaybackRef = useRef(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Detect direction from API result or default to RTL (Arabic) if not specified
  // We check if the detected language is one of the known LTR languages
  const detectedLang = result.detectedLanguage?.toLowerCase() || 'ar';
  const isLtr = ['en', 'fr', 'es', 'de', 'it', 'pt', 'ru'].some(l => detectedLang.startsWith(l));
  const isRtl = !isLtr; // Default to RTL for Arabic and others
  const direction = isRtl ? 'rtl' : 'ltr';

  // Parsed sections state
  const [summarySections, setSummarySections] = useState<{title: string, content: string, isOpen: boolean}[]>([]);
  const [qaSections, setQaSections] = useState<{title: string, content: string, isOpen: boolean}[]>([]);

  // Parse markdown into sections on load
  useEffect(() => {
    if (result.summary) {
        // Split by H2 (##)
        const parts = result.summary.split(/(?=^## )/gm);
        const sections = parts.map(part => {
            const titleMatch = part.match(/^## (.*)$/m);
            const title = titleMatch ? titleMatch[1].replace(/\*\*/g, '').trim() : (isRtl ? 'مقدمة / ملخص عام' : 'Introduction');
            const content = part.replace(/^## .*$/m, '').trim(); // Remove the header from content body
            return { title, content, isOpen: false };
        }).filter(s => s.content.trim().length > 0);
        
        // Always open the first section
        if (sections.length > 0) sections[0].isOpen = true;
        setSummarySections(sections);
    }
    
    if (result.qa) {
        // Split by H3 (###) for questions
        const parts = result.qa.split(/(?=^### )/gm);
        const sections = parts.map(part => {
             const titleMatch = part.match(/^### (.*)$/m);
             const title = titleMatch ? titleMatch[1].replace(/\*\*/g, '').trim() : (isRtl ? 'سؤال' : 'Question');
             const content = part.replace(/^### .*$/m, '').trim();
             return { title, content, isOpen: false };
        }).filter(s => s.content.trim().length > 0);
         // Always open the first few questions
         if (sections.length > 0) {
             sections.slice(0, 3).forEach(s => s.isOpen = true);
         }
        setQaSections(sections);
    }
  }, [result, isRtl]);

  useEffect(() => {
    if (highlightedText && contentRef.current) {
      const timer = setTimeout(() => {
        const markedElement = contentRef.current?.querySelector('mark');
        if (markedElement) markedElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [highlightedText]);

  const handleStopReading = () => {
    stopPlaybackRef.current = true;
    stopAudio();
    setAudioState('idle');
    setHighlightedText(null);
  };

  const handleReadAloud = async () => {
    if (audioState !== 'idle') { handleStopReading(); return; }
    
    // Determine text to read based on active tab
    // For collapsed sections, we read the full raw text (result.summary)
    const textToRead = activeTab === 'summary' ? result.summary : result.overview;
    if (!textToRead) { alert("يرجى الانتقال لتبويب الملخص للقراءة."); return; }

    stopPlaybackRef.current = false;
    setAudioState('generating');

    try {
      // Simple sentence splitting
      const sentences = textToRead.match(/[^.!?\n]+([.!?\n]+|$)/g) || [textToRead];
      for (const sentence of sentences) {
        if (stopPlaybackRef.current) break;
        if (!sentence.trim() || sentence.trim().length < 3) continue;
        
        setHighlightedText(sentence.trim());
        setAudioState('generating');
        const cleanSentence = sentence.replace(/[*_#`~-]/g, '');
        const audioData = await generateSpeech(apiKey, cleanSentence, selectedVoice);
        
        if (stopPlaybackRef.current) break;
        
        setAudioState('playing');
        await playAudioFromBase64(audioData, 24000, readingSpeed);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAudioState('idle');
      setHighlightedText(null);
      stopPlaybackRef.current = false;
    }
  };

  const getRenderContent = (content: string) => {
    if (highlightedText && content.includes(highlightedText)) {
         return content.replace(highlightedText, `~~${highlightedText}~~`);
    }
    return content;
  };

  const MarkdownRenderer = ({ content }: { content: string }) => (
    <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
            code({node, inline, className, children, ...props}: any) {
                const match = /language-(\w+)/.exec(className || '');
                if (!inline && match && match[1] === 'mermaid') {
                    return <MermaidChart chart={String(children).replace(/\n$/, '')} onInteract={onOpenDeepDive} />;
                }
                return <code className={className} {...props}>{children}</code>;
            },
            del({node, children}: any) {
                return <mark className="bg-yellow-200 text-gray-900 rounded px-1 animate-pulse inline-block">{children}</mark>;
            },
            img({node, src, alt}: any) {
                let imageSrc = src;
                if (result.extractedImages && /^\d+$/.test(src)) {
                    const index = parseInt(src, 10);
                    if (index >= 0 && index < result.extractedImages.length) imageSrc = result.extractedImages[index];
                }
                return <img src={imageSrc} alt={alt} className="max-w-full h-auto rounded-lg shadow-md mx-auto my-4" />;
            },
            // Override headings in parsed mode since we use them as accordion titles
            h2({node, children}: any) { return <h3 className="text-xl font-bold text-blue-800 mt-4 mb-2">{children}</h3>; },
            h3({node, children}: any) { return <h4 className="text-lg font-bold text-blue-700 mt-3 mb-1">{children}</h4>; }
        }}
    >
        {content}
    </ReactMarkdown>
  );

  const handleExportPdf = () => {
    setIsPrinting(true);
    setTimeout(() => { window.print(); setIsPrinting(false); }, 2000);
  };

  const handleToggleSection = (index: number, type: 'summary' | 'qa') => {
      if (type === 'summary') {
          const newSections = [...summarySections];
          newSections[index].isOpen = !newSections[index].isOpen;
          setSummarySections(newSections);
      } else {
          const newSections = [...qaSections];
          newSections[index].isOpen = !newSections[index].isOpen;
          setQaSections(newSections);
      }
  };

  const handleBulkToggle = (expand: boolean, type: 'summary' | 'qa') => {
       if (type === 'summary') {
          setSummarySections(summarySections.map(s => ({ ...s, isOpen: expand })));
      } else {
          setQaSections(qaSections.map(s => ({ ...s, isOpen: expand })));
      }
  };

  // --- PRINT MODE ---
  if (isPrinting) {
    return (
        <div className="fixed inset-0 bg-white z-[100] overflow-auto" dir={direction}>
            <div className="max-w-4xl mx-auto p-8">
                 <h1 className="text-4xl font-bold text-center mb-10">{result.fileName || 'ملخص دراسي'}</h1>
                 <div className="markdown-body font-[Arial,sans-serif]"><MarkdownRenderer content={result.summary} /></div>
                 <div className="break-before-page mt-10"><MarkdownRenderer content={result.qa} /></div>
            </div>
        </div>
    );
  }

  // --- INTERACTIVE MODE ---
  const TabButton = ({ id, label, icon: Icon }: any) => (
    <button
      onClick={() => { handleStopReading(); setActiveTab(id); }}
      className={`flex-1 py-3 px-4 font-bold text-sm md:text-base flex items-center justify-center gap-2 border-b-4 transition-all
        ${activeTab === id ? 'text-blue-700 border-blue-600 bg-blue-50' : 'text-gray-500 border-transparent hover:bg-gray-50'}
      `}
    >
      <Icon size={18} /> <span className="hidden md:inline">{label}</span>
    </button>
  );

  return (
    <div className="animate-fade-in-up" dir={direction}>
       {detectedLang && (
           <div className={`
             px-4 py-2 mb-4 rounded-lg text-sm flex items-center gap-2
             ${detectedLang === 'ar' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-blue-50 text-blue-800 border border-blue-200'}
           `}>
               <Info size={16} />
               {detectedLang === 'ar' ? 'تم اكتشاف المحتوى باللغة العربية' : `Detected Language: ${detectedLang.toUpperCase()}`}
           </div>
       )}

       <div className="flex bg-white rounded-t-xl overflow-x-auto border border-b-0 border-gray-200 shadow-sm no-print">
         <TabButton id="summary" label={isRtl ? "الملخص والشرح" : "Summary"} icon={FileText} />
         <TabButton id="flashcards" label={isRtl ? "بطاقات الحفظ" : "Flashcards"} icon={Layers} />
         <TabButton id="quiz" label={isRtl ? "اختبار تفاعلي" : "Quiz"} icon={BrainCircuit} />
         <TabButton id="qa" label={isRtl ? "بنك الأسئلة" : "Q&A Bank"} icon={FileQuestion} />
         <TabButton id="figures" label={isRtl ? "الأشكال" : "Images"} icon={ImageIcon} />
       </div>

       {/* Toolbar */}
       <div className="bg-gray-50 p-2 border border-gray-200 flex flex-wrap gap-2 justify-between items-center no-print">
         <div className="flex gap-2">
            <button onClick={() => navigator.clipboard.writeText(result.summary)} className="btn-icon bg-white" title={isRtl ? "نسخ" : "Copy"}><Copy size={16} /></button>
            <button onClick={handleExportPdf} className="btn-icon bg-white text-red-600" title={isRtl ? "طباعة PDF" : "Print PDF"}><Printer size={16} /></button>
         </div>
         
         <div className="flex gap-2 items-center">
             <button onClick={() => onOpenDeepDive()} className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded text-sm font-bold flex items-center gap-2">
               <Search size={16} /> {isRtl ? "اشرح لي" : "Explain"}
             </button>
             {activeTab === 'summary' && (
                 <button onClick={handleReadAloud} className={`px-3 py-1.5 rounded text-sm font-bold text-white flex gap-2 ${audioState === 'playing' ? 'bg-red-500' : 'bg-blue-600'}`}>
                    {audioState === 'playing' ? <Square size={16} fill="white"/> : <Volume2 size={16} />}
                 </button>
             )}
         </div>
       </div>

       {/* Content Area */}
       <div ref={contentRef} className="bg-white p-4 md:p-8 rounded-b-xl border border-gray-200 shadow-sm min-h-[500px]">
          
          {/* SUMMARY TAB: Collapsible Sections */}
          {activeTab === 'summary' && (
              <div className="font-[Arial]">
                  {summarySections.length > 0 ? (
                      <>
                        <div className="flex justify-end gap-2 mb-4 text-xs">
                             <button onClick={() => handleBulkToggle(true, 'summary')} className="flex items-center gap-1 text-blue-600 hover:bg-blue-50 px-2 py-1 rounded">
                                 <ChevronsDown size={14}/> {isRtl ? "توسيع الكل" : "Expand All"}
                             </button>
                             <button onClick={() => handleBulkToggle(false, 'summary')} className="flex items-center gap-1 text-gray-600 hover:bg-gray-50 px-2 py-1 rounded">
                                 <ChevronsUp size={14}/> {isRtl ? "طي الكل" : "Collapse All"}
                             </button>
                        </div>
                        <LazyRenderList 
                            items={summarySections}
                            renderItem={(section: any, index: number) => (
                                <CollapsibleSection 
                                    key={index} 
                                    title={section.title} 
                                    isOpen={section.isOpen} 
                                    onToggle={() => handleToggleSection(index, 'summary')}
                                    isRtl={isRtl}
                                >
                                    <div className="markdown-body">
                                        <MarkdownRenderer content={getRenderContent(section.content)} />
                                    </div>
                                </CollapsibleSection>
                            )}
                        />
                      </>
                  ) : (
                      // Fallback for non-parsed summary
                      <div className="markdown-body"><MarkdownRenderer content={getRenderContent(result.summary)} /></div>
                  )}
              </div>
          )}
          
          {activeTab === 'flashcards' && <FlashcardDeck flashcards={result.flashcards || []} isRtl={isRtl} />}
          
          {activeTab === 'quiz' && <InteractiveQuiz quiz={result.quiz || []} isRtl={isRtl} />}
          
          {/* Q&A TAB: Collapsible Sections */}
          {activeTab === 'qa' && (
              <div className="font-[Arial]">
                  {qaSections.length > 0 ? (
                      <>
                        <div className="flex justify-end gap-2 mb-4 text-xs">
                             <button onClick={() => handleBulkToggle(true, 'qa')} className="flex items-center gap-1 text-blue-600 hover:bg-blue-50 px-2 py-1 rounded">
                                 <ChevronsDown size={14}/> {isRtl ? "توسيع الكل" : "Expand All"}
                             </button>
                             <button onClick={() => handleBulkToggle(false, 'qa')} className="flex items-center gap-1 text-gray-600 hover:bg-gray-50 px-2 py-1 rounded">
                                 <ChevronsUp size={14}/> {isRtl ? "طي الكل" : "Collapse All"}
                             </button>
                        </div>
                        <LazyRenderList 
                            items={qaSections}
                            renderItem={(section: any, index: number) => (
                                <CollapsibleSection 
                                    key={index} 
                                    title={section.title} 
                                    isOpen={section.isOpen} 
                                    onToggle={() => handleToggleSection(index, 'qa')}
                                    isRtl={isRtl}
                                >
                                    <div className="markdown-body">
                                        <MarkdownRenderer content={section.content} />
                                    </div>
                                </CollapsibleSection>
                            )}
                        />
                      </>
                  ) : (
                      <div className="markdown-body"><MarkdownRenderer content={result.qa} /></div>
                  )}
              </div>
          )}
          
          {activeTab === 'figures' && (
             <div className="grid grid-cols-2 gap-4">
                {result.extractedImages?.map((img, i) => (
                    <div key={i} className="border p-2 rounded"><img src={img} className="max-w-full h-auto" /></div>
                ))}
             </div>
          )}
          
          {activeTab === 'overview' && <div className="markdown-body"><MarkdownRenderer content={result.overview} /></div>}
       </div>
    </div>
  );
};