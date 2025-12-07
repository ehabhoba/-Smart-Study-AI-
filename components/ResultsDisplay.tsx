import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { StudyAnalysisResult } from '../types';
import { FileText, List, HelpCircle, Volume2, Search, Copy, Check, Download, Loader2 } from 'lucide-react';
import { generateSpeech } from '../services/geminiService';
import { playAudioFromBase64 } from '../services/audioService';
import { marked } from 'marked';

interface Props {
  result: StudyAnalysisResult;
  apiKey: string;
  onOpenDeepDive: () => void;
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

  const getActiveContent = () => {
    switch (activeTab) {
      case 'overview': return result.overview;
      case 'summary': return result.summary;
      case 'qa': return result.qa;
      default: return '';
    }
  };

  const handleReadAloud = async () => {
    if (audioState !== 'idle') return; // Prevent multiple clicks
    
    const textToRead = getActiveContent();
    if (!textToRead) {
      alert("لا يوجد محتوى للقراءة.");
      return;
    }

    try {
      setAudioState('generating');
      const audioData = await generateSpeech(apiKey, textToRead, selectedVoice);
      
      setAudioState('playing');
      await playAudioFromBase64(audioData);
    } catch (e: any) {
      console.error(e);
      alert(e.message || "فشل في توليد أو تشغيل الصوت. تحقق من اتصالك أو المفتاح.");
    } finally {
      setAudioState('idle');
    }
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
          
          /* Common Headers */
          h1 { font-size: 24pt; margin-bottom: 20px; font-weight: 800; padding-bottom: 10px; margin-top: 30px; }
          h2 { font-size: 18pt; margin-top: 24px; font-weight: 700; }
          h3 { font-size: 14pt; margin-top: 18px; font-weight: 600; }
          
          /* --- Overview Theme (Slate) --- */
          .tab-overview h2 {
            color: #0f172a;
            border-right: 5px solid #64748b;
            padding-right: 10px;
          }

          /* --- Summary Theme (Blue & Amber) --- */
          .tab-summary h2 {
            background: #f0f9ff;
            border-right: 5px solid #0284c7;
            color: #0c4a6e;
            padding: 10px;
            border-radius: 4px;
          }
          
          .tab-summary h3 {
            color: #0369a1;
            border-bottom: 1px dashed #e0f2fe;
            padding-bottom: 4px;
            display: inline-block;
          }

          .tab-summary blockquote { 
            background-color: #fffbeb; 
            border: 1px solid #fcd34d;
            border-right: 5px solid #f59e0b; 
            color: #92400e; 
            padding: 12px; 
            margin: 15px 0; 
            border-radius: 4px;
          }
          
          /* --- Q&A Theme (Indigo & Green) --- */
          .tab-qa h3 { 
            background-color: #eef2ff; 
            padding: 15px; 
            border: 1px solid #c7d2fe; 
            border-right: 6px solid #4f46e5; 
            color: #312e81; 
            border-radius: 6px; 
            margin-top: 30px;
            margin-bottom: 10px;
            font-weight: 700;
            font-size: 14pt;
          }
          
          .tab-qa blockquote { 
            background-color: #f0fdf4; 
            border: 1px solid #bbf7d0;
            border-right: 6px solid #16a34a; 
            color: #14532d; 
            padding: 15px; 
            margin: 0 0 25px 0; 
            border-radius: 6px;
            font-weight: 500;
            font-size: 12pt;
          }

          /* Tables */
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 1px solid #cbd5e1; }
          thead { background-color: #1e40af; color: white; }
          th { padding: 10px; border: 1px solid #94a3b8; color: white; }
          td { border: 1px solid #cbd5e1; padding: 8px; vertical-align: top; background-color: #fff; }
          tr:nth-child(even) td { background-color: #f8fafc; }
          
          /* Lists */
          ul, ol { margin-bottom: 15px; margin-right: 25px; }
          li { margin-bottom: 6px; }
          
          /* General */
          p { margin-bottom: 12px; }
          strong { color: #111827; font-weight: bold; }
          
          /* Page Breaks & Printing */
          .section { margin-bottom: 30px; }
          .tab-qa h3, .tab-qa blockquote, .tab-summary blockquote, table, tr {
            page-break-inside: avoid;
          }
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
      onClick={() => setActiveTab(id)}
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
            جاري التوليد...
          </>
        );
      case 'playing':
        return (
          <>
            <Volume2 size={18} className="animate-pulse text-green-300" />
            جاري القراءة...
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
             <button onClick={onOpenDeepDive} className="text-sm py-1.5 px-3 bg-purple-50 border border-purple-200 text-purple-700 rounded hover:bg-purple-100 flex items-center gap-2 transition">
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
               disabled={audioState !== 'idle'}
               className="text-sm py-1.5 px-3 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2 transition shadow-sm min-w-[140px] justify-center disabled:opacity-70"
             >
               {getAudioButtonContent()}
             </button>
         </div>
       </div>

       {/* Content */}
       <div className="bg-white p-6 md:p-10 rounded-b-xl border border-gray-200 shadow-sm min-h-[400px]">
          <div className={`markdown-body tab-${activeTab}`}>
            {getActiveContent() ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {getActiveContent()}
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