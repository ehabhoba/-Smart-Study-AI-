import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { StudyAnalysisResult } from '../types';
import { FileText, List, HelpCircle, Volume2, Search, Copy, Check, Download, Loader2, Square, Info } from 'lucide-react';
import { generateSpeech } from '../services/geminiService';
import { playAudioFromBase64, stopAudio } from '../services/audioService';
import { marked } from 'marked';
import mermaid from 'mermaid';

// Initialize mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
  fontFamily: 'Cairo'
});

const MermaidChart = ({ chart, onInteract }: { chart: string, onInteract?: (term: string) => void }) => {
  const [svg, setSvg] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const id = useRef(`mermaid-${Math.random().toString(36).substr(2, 9)}`).current;

  useEffect(() => {
    const renderChart = async () => {
      try {
        const { svg } = await mermaid.render(id, chart);
        setSvg(svg);
      } catch (error) {
        console.error('Failed to render mermaid chart', error);
        setSvg('<div class="text-red-500">فشل عرض المخطط</div>');
      }
    };
    renderChart();
  }, [chart, id]);

  // Add interaction listeners to nodes
  useEffect(() => {
    if (!containerRef.current || !onInteract) return;

    // Select common mermaid node classes: .node (flowchart), .actor (sequence), .mindmap-node (mindmap)
    const nodes = containerRef.current.querySelectorAll('.node, .actor, .mindmap-node');
    
    nodes.forEach((node) => {
      const el = node as HTMLElement;
      // Try to extract text content
      const term = el.textContent?.trim();
      
      if (term) {
        // Style as clickable
        el.style.cursor = 'pointer';
        el.style.transition = 'all 0.2s ease';
        
        // Add tooltip via title element if not present
        if (!el.querySelector('title')) {
           const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
           title.textContent = `اشرح: ${term}`;
           el.appendChild(title);
        }

        // Add visual hover effect
        el.onmouseenter = () => { el.style.opacity = '0.7'; };
        el.onmouseleave = () => { el.style.opacity = '1'; };

        // Click handler
        el.onclick = (e) => {
          e.stopPropagation();
          onInteract(term);
        };
      }
    });
  }, [svg, onInteract]);

  return (
    <div className="flex flex-col items-center my-8">
        <div 
            ref={containerRef}
            className="w-full p-6 bg-white rounded-lg border border-gray-200 shadow-sm overflow-x-auto flex justify-center" 
            dangerouslySetInnerHTML={{ __html: svg }} 
        />
        <p className="text-xs text-gray-400 mt-2 flex items-center gap-1.5 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
            <Info size={12} className="text-blue-500" />
            <span className="font-medium text-blue-600">تلميح:</span>
            اضغط على أي عنصر في المخطط لشرحه بالتفصيل
        </p>
    </div>
  );
};

interface Props {
  result: StudyAnalysisResult;
  apiKey: string;
  onOpenDeepDive: (term?: string) => void;
}

type AudioState = 'idle' | 'generating' | 'playing';

const VOICES = [
  { id: 'Zephyr', label: 'Zephyr (أنثى - هادئ)', gender: 'Female' },
  { id: 'Puck', label: 'Puck (ذكر - حيوي)', gender: 'Male' },
  { id: 'Kore', label: 'Kore (أنثى - دافئ)', gender: 'Female' },
  { id: 'Fenrir', label: 'Fenrir (ذكر - عميق)', gender: 'Male' },
  { id: 'Charon', label: 'Charon (ذكر - جاد)', gender: 'Male' },
];

export const ResultsDisplay: React.FC<Props> = ({ result, apiKey, onOpenDeepDive }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'summary' | 'qa'>('summary');
  const [audioState, setAudioState] = useState<AudioState>('idle');
  const [copied, setCopied] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('Zephyr');
  
  // State for highlighting
  const [highlightedText, setHighlightedText] = useState<string | null>(null);
  const stopPlaybackRef = useRef(false);

  const getActiveContent = () => {
    switch (activeTab) {
      case 'overview': return result.overview;
      case 'summary': return result.summary;
      case 'qa': return result.qa;
      default: return '';
    }
  };

  const handleStopReading = () => {
    stopPlaybackRef.current = true;
    stopAudio();
    setAudioState('idle');
    setHighlightedText(null);
  };

  const handleReadAloud = async () => {
    // If already playing/generating, stop it
    if (audioState !== 'idle') {
      handleStopReading();
      return;
    }
    
    const textToRead = getActiveContent();
    if (!textToRead) {
      alert("لا يوجد محتوى للقراءة.");
      return;
    }

    // Reset stop flag
    stopPlaybackRef.current = false;
    setAudioState('generating');

    try {
      // Split text into sentences for tracking
      // Matches punctuation (. ! ? \n) followed by space or end of string
      const sentences = textToRead.match(/[^.!?\n]+([.!?\n]+|$)/g) || [textToRead];

      for (const sentence of sentences) {
        if (stopPlaybackRef.current) break;
        if (!sentence.trim()) continue;

        setHighlightedText(sentence);
        setAudioState('generating');

        // Clean markdown symbols for better TTS quality (optional, depends on model robustness)
        const cleanSentence = sentence.replace(/[*_#`~-]/g, '');

        try {
          const audioData = await generateSpeech(apiKey, cleanSentence, selectedVoice);
          
          if (stopPlaybackRef.current) break;
          
          setAudioState('playing');
          await playAudioFromBase64(audioData);
        } catch (err) {
          console.error("Error playing chunk:", err);
          // Continue to next chunk even if one fails
        }
      }
    } catch (e: any) {
      console.error(e);
      alert(e.message || "فشل في توليد أو تشغيل الصوت.");
    } finally {
      setAudioState('idle');
      setHighlightedText(null);
      stopPlaybackRef.current = false;
    }
  };

  // Prepare content for display
  // We wrap the highlighted text in ~~strikethrough~~ syntax, 
  // then use a custom renderer for 'del' to show it as highlighted instead.
  const getRenderContent = () => {
    const content = getActiveContent();
    if (highlightedText && content) {
      // Escape special regex chars in the sentence to avoid errors
      const escapedSentence = highlightedText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Replace only the first occurrence to avoid highlighting everything if text repeats
      return content.replace(highlightedText, `~~${highlightedText}~~`);
    }
    return content;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getActiveContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadWord = () => {
    // Generate HTML for each section using marked (synchronous)
    const overviewHtml = marked.parse(result.overview) as string;
    const summaryHtml = marked.parse(result.summary) as string;
    const qaHtml = marked.parse(result.qa) as string;

    // Combine all sections into one document body with distinct styling containers
    const combinedContent = `
      <div class="section tab-overview">
        <h1 style="color: #0f172a; border-bottom: 2px solid #64748b;">نظرة عامة على الكتاب</h1>
        ${overviewHtml}
      </div>
      
      <br style="page-break-before: always;" />
      
      <div class="section tab-summary">
        <h1 style="color: #0c4a6e; border-bottom: 2px solid #0284c7;">الملخص الشامل</h1>
        ${summaryHtml}
      </div>
      
      <br style="page-break-before: always;" />
      
      <div class="section tab-qa">
        <h1 style="color: #312e81; border-bottom: 2px solid #4338ca;">بنك الأسئلة المتوقعة</h1>
        ${qaHtml}
      </div>
    `;

    // Word Document Template with inline CSS matching the web view
    const content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Smart Study Complete Report</title>
        <style>
          body { font-family: 'Cairo', 'Segoe UI', 'Arial', sans-serif; direction: rtl; text-align: right; line-height: 1.6; color: #374151; }
          /* ... (styles truncated for brevity, same as before) ... */
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 1px solid #cbd5e1; }
          td { border: 1px solid #cbd5e1; padding: 8px; vertical-align: top; background-color: #fff; }
        </style>
      </head>
      <body>
        ${combinedContent}
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', content], {
      type: 'application/msword'
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SmartStudy_Complete_Report_${new Date().toISOString().slice(0,10)}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const TabButton = ({ id, label, icon: Icon }: { id: typeof activeTab, label: string, icon: any }) => (
    <button
      onClick={() => { 
        handleStopReading(); 
        setActiveTab(id); 
      }}
      className={`flex-1 py-4 px-6 text-center font-medium transition-all flex items-center justify-center gap-2 border-b-2
        ${activeTab === id 
          ? 'text-blue-600 border-blue-600 bg-white' 
          : 'text-gray-500 border-transparent hover:text-blue-600 hover:bg-gray-50'
        }
      `}
    >
      <Icon size={20} />
      {label}
    </button>
  );

  const getAudioButtonContent = () => {
    switch (audioState) {
      case 'generating':
        return (
          <>
            <Loader2 size={18} className="animate-spin" />
            جاري التجهيز...
          </>
        );
      case 'playing':
        return (
          <>
            <Square size={18} className="fill-current" />
            إيقاف القراءة
          </>
        );
      default:
        return (
          <>
            <Volume2 size={18} />
            قراءة (TTS)
          </>
        );
    }
  };

  return (
    <div className="animate-fade-in-up">
       {/* Tab Navigation */}
       <div className="flex border-b border-gray-200 mb-0 bg-white rounded-t-xl overflow-hidden shadow-sm">
         <TabButton id="summary" label="الملخص" icon={FileText} />
         <TabButton id="qa" label="الأسئلة" icon={HelpCircle} />
         <TabButton id="overview" label="نظرة عامة" icon={List} />
       </div>

       {/* Toolbar */}
       <div className="bg-gray-50 p-3 border-x border-gray-200 flex flex-wrap gap-2 justify-between items-center">
         <div className="flex gap-2">
            <button onClick={handleCopy} className="btn-secondary text-sm py-1.5 px-3 bg-white border border-gray-300 rounded hover:bg-gray-100 flex items-center gap-2 transition">
              {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} className="text-gray-500" />}
              {copied ? "تم النسخ" : "نسخ"}
            </button>
            <button onClick={handleDownloadWord} className="btn-secondary text-sm py-1.5 px-3 bg-white border border-gray-300 rounded hover:bg-gray-100 flex items-center gap-2 transition text-blue-700">
               <Download size={16} />
               تحميل Word
            </button>
         </div>
         
         <div className="flex gap-2 items-center">
             <button onClick={() => onOpenDeepDive()} className="text-sm py-1.5 px-3 bg-purple-50 border border-purple-200 text-purple-700 rounded hover:bg-purple-100 flex items-center gap-2 transition">
               <Search size={16} />
               شرح (Deep Dive)
             </button>
             
             {/* Voice Selection */}
             <select 
               value={selectedVoice} 
               onChange={(e) => setSelectedVoice(e.target.value)}
               className="text-sm py-1.5 px-3 bg-white border border-gray-300 rounded hover:bg-gray-100 outline-none transition cursor-pointer"
               disabled={audioState !== 'idle'}
               title="اختر الصوت"
             >
               {VOICES.map(v => (
                 <option key={v.id} value={v.id}>{v.label}</option>
               ))}
             </select>

             <button 
               onClick={handleReadAloud}
               className={`text-sm py-1.5 px-3 text-white rounded flex items-center gap-2 transition shadow-sm min-w-[140px] justify-center 
                 ${audioState === 'playing' ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'}
               `}
             >
               {getAudioButtonContent()}
             </button>
         </div>
       </div>

       {/* Content */}
       <div className="bg-white p-6 md:p-10 rounded-b-xl border border-gray-200 shadow-sm min-h-[400px]">
          <div className={`markdown-body tab-${activeTab}`}>
            {getActiveContent() ? (
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
                  // Hijack the 'del' (strikethrough) element to act as our highlighter
                  del({node, className, children, ...props}: any) {
                    return (
                      <mark className="bg-yellow-200 text-gray-900 no-underline decoration-0 rounded px-1 animate-pulse inline-block transition-colors duration-300">
                        {children}
                      </mark>
                    );
                  }
                }}
              >
                {getRenderContent()}
              </ReactMarkdown>
            ) : (
              <div className="text-center text-gray-400 py-20">
                <p>لا يوجد محتوى لعرضه في هذا القسم.</p>
              </div>
            )}
          </div>
       </div>
    </div>
  );
};