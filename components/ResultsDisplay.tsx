import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { StudyAnalysisResult } from '../types';
import { FileText, List, HelpCircle, Volume2, Search, Copy, Check, Download } from 'lucide-react';
import { generateSpeech } from '../services/geminiService';
import { playAudioFromBase64 } from '../services/audioService';

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

  const handleDownloadWord = () => {
    // Get the HTML content of the markdown container
    const element = document.getElementById('markdown-content');
    if (!element) return;

    // Create a complete HTML document structure with RTL support and improved table styling for Word
    const content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Smart Study Summary</title>
        <style>
          body { font-family: 'Cairo', 'Arial', sans-serif; direction: rtl; text-align: right; line-height: 1.6; }
          
          /* Headers */
          h1 { color: #1e3a8a; font-size: 24pt; margin-bottom: 20px; border-bottom: 2px solid #1e3a8a; padding-bottom: 10px; }
          h2 { color: #1e40af; font-size: 18pt; margin-top: 20px; margin-bottom: 15px; }
          h3 { color: #2563eb; font-size: 14pt; margin-top: 15px; }
          
          /* Tables */
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 1px solid #d1d5db; }
          th { background-color: #f3f4f6; color: #111827; font-weight: bold; border: 1px solid #9ca3af; padding: 10px; }
          td { border: 1px solid #d1d5db; padding: 8px; vertical-align: top; }
          tr:nth-child(even) { background-color: #f9fafb; }
          
          /* Other elements */
          blockquote { border-right: 5px solid #2563eb; padding: 10px; background: #eff6ff; margin: 15px 0; color: #1e40af; }
          p { margin-bottom: 10px; }
          ul, ol { margin-bottom: 15px; margin-right: 20px; }
        </style>
      </head>
      <body>
        ${element.innerHTML}
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', content], {
      type: 'application/msword'
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SmartStudy_${activeTab}_${new Date().toISOString().slice(0,10)}.doc`;
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
                className="flex items-center gap-1 text-sm bg-green-100 hover:bg-green-200 text-green-800 px-3 py-1.5 rounded border border-green-200 transition"
                title="تحميل كملف Word"
            >
                <Download size={16} />
                تحميل Word
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
        <article id="markdown-content" className="prose prose-blue max-w-none prose-headings:font-bold prose-headings:text-blue-900 prose-p:text-gray-700 prose-li:text-gray-700 markdown-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {getActiveContent()}
            </ReactMarkdown>
        </article>
      </div>
    </div>
  );
};