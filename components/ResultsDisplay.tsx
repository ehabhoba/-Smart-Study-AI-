import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { StudyAnalysisResult } from '../types';
import { FileText, List, HelpCircle, Volume2, Search, Copy, Check, Download } from 'lucide-react';
import { generateSpeech } from '../services/geminiService';
import { playAudioFromBase64 } from '../services/audioService';
import { marked } from 'marked';

interface Props {
  result: StudyAnalysisResult;
  apiKey: string;
  onOpenDeepDive: () => void;
}

export const ResultsDisplay: React.FC<Props> = ({ result, apiKey, onOpenDeepDive }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'summary' | 'qa'>('summary');
  const [isPlaying, setIsPlaying] = useState(false);
  const [copied, setCopied] = useState(false);

  const getActiveContent = () => {
    switch (activeTab) {
      case 'overview': return result.overview;
      case 'summary': return result.summary;
      case 'qa': return result.qa;
      default: return '';
    }
  };

  const handleReadAloud = async () => {
    if (isPlaying) return;
    setIsPlaying(true);
    try {
      const audioData = await generateSpeech(apiKey, getActiveContent());
      await playAudioFromBase64(audioData);
    } catch (e) {
      console.error(e);
      alert("فشل في تشغيل الصوت. تحقق من اتصالك أو المفتاح.");
    } finally {
      setIsPlaying(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getActiveContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadWord = async () => {
    // Generate HTML for each section using marked
    const overviewHtml = await marked.parse(result.overview);
    const summaryHtml = await marked.parse(result.summary);
    const qaHtml = await marked.parse(result.qa);

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
        <h1 style="color: #312e81; border-bottom: 2px solid #4f46e5;">بنك الأسئلة المتوقعة</h1>
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
          body { font-family: 'Cairo', 'Arial', sans-serif; direction: rtl; text-align: right; line-height: 1.6; color: #374151; }
          
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
          
          /* --- Q&A Theme (Indigo & Teal) --- */
          .tab-qa h3 { 
            background-color: #f8fafc; /* Slight grey background */
            padding: 15px; 
            border: 1px solid #e2e8f0; 
            border-right: 6px solid #4f46e5; /* Indigo */
            color: #312e81; 
            border-radius: 6px; 
            margin-top: 30px;
            margin-bottom: 10px;
            font-weight: 700;
          }
          
          .tab-qa blockquote { 
            background-color: #f0fdfa; 
            border: 1px solid #ccfbf1;
            border-right: 6px solid #14b8a6; /* Teal */
            color: #115e59; 
            padding: 15px; 
            margin: 0 0 25px 0; 
            border-radius: 6px;
            font-weight: 500;
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
          
          /* Helper for sections */
          .section { margin-bottom: 30px; }
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

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden min-h-[500px] flex flex-col">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-gray-50 flex-wrap">
        <TabButton id="overview" label="نظرة عامة" icon={FileText} />
        <TabButton id="summary" label="الملخص الشامل" icon={List} />
        <TabButton id="qa" label="بنك الأسئلة" icon={HelpCircle} />
      </div>

      {/* Toolbar */}
      <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex flex-wrap justify-between items-center gap-3">
        <div className="flex gap-2">
            <h3 className="font-bold text-gray-700 hidden md:block">
                {activeTab === 'overview' && 'تحليل الكتاب'}
                {activeTab === 'summary' && 'ملخص المنهج'}
                {activeTab === 'qa' && 'الأسئلة المتوقعة'}
            </h3>
        </div>
        <div className="flex gap-2 flex-wrap">
            <button 
                onClick={handleDownloadWord}
                className="flex items-center gap-1 text-sm bg-green-100 hover:bg-green-200 text-green-800 px-3 py-1.5 rounded border border-green-200 transition font-semibold"
                title="تحميل التقرير الكامل كملف Word"
            >
                <Download size={16} />
                تحميل الملف الكامل (Word)
            </button>
            <button 
                onClick={handleReadAloud}
                disabled={isPlaying}
                className="flex items-center gap-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1.5 rounded border border-blue-200 transition disabled:opacity-50"
            >
                <Volume2 size={16} />
                {isPlaying ? '...' : 'قراءة'}
            </button>
            <button 
                onClick={onOpenDeepDive}
                className="flex items-center gap-1 text-sm bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-1.5 rounded border border-purple-200 transition"
            >
                <Search size={16} />
                شرح
            </button>
            <button 
                onClick={handleCopy}
                className="flex items-center gap-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded border border-gray-200 transition"
            >
                {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                {copied ? 'تم' : 'نسخ'}
            </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-8 bg-white overflow-y-auto max-h-[800px] leading-relaxed flex-grow">
        {/* Dynamic Class based on active tab for scoped CSS in index.html */}
        <article id="markdown-content" className={`prose prose-blue max-w-none prose-headings:font-bold prose-headings:text-blue-900 prose-p:text-gray-700 prose-li:text-gray-700 markdown-body tab-${activeTab}`}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {getActiveContent()}
            </ReactMarkdown>
        </article>
      </div>
    </div>
  );
};