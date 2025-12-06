import React from 'react';
import { X, Search, Sparkles, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  term: string;
  setTerm: (t: string) => void;
  result: string;
  isLoading: boolean;
  onSearch: (term: string) => void;
}

export const DeepDivePanel: React.FC<Props> = ({ 
  isOpen, onClose, term, setTerm, result, isLoading, onSearch 
}) => {
  return (
    <div 
      className={`fixed bottom-0 right-0 left-0 z-50 transform transition-transform duration-300 ease-in-out bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.1)] border-t-4 border-purple-600 h-[70vh] flex flex-col
        ${isOpen ? 'translate-y-0' : 'translate-y-full'}
      `}
    >
      {/* Header */}
      <div className="container mx-auto max-w-5xl px-6 py-4 border-b flex justify-between items-center bg-purple-50">
        <h3 className="text-xl font-bold text-purple-800 flex items-center gap-2">
          <Sparkles className="text-purple-600" />
          شرح مفاهيم الذكاء الاصطناعي (Deep Dive)
        </h3>
        <button onClick={onClose} className="text-gray-500 hover:text-red-600 transition p-2 bg-white rounded-full hover:shadow-md">
          <X size={24} />
        </button>
      </div>

      {/* Body */}
      <div className="container mx-auto max-w-5xl px-6 py-6 flex-grow flex flex-col overflow-hidden">
        {/* Search Bar */}
        <div className="flex gap-2 mb-6">
          <input 
            type="text" 
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch(term)}
            placeholder="اكتب المصطلح أو المفهوم الذي تريد شرحه بالتفصيل..." 
            className="flex-1 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition text-lg"
          />
          <button 
            onClick={() => onSearch(term)}
            disabled={isLoading || !term.trim()}
            className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-8 rounded-lg shadow transition disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : <Search />}
            اشرح لي
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto bg-gray-50 rounded-xl border border-gray-200 p-6">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center text-purple-600 opacity-70">
              <Loader2 size={48} className="animate-spin mb-4" />
              <p>جاري صياغة الشرح بناءً على سياق الكتاب...</p>
            </div>
          ) : result ? (
            <article className="prose prose-purple max-w-none">
              <ReactMarkdown>{result}</ReactMarkdown>
            </article>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <Search size={48} className="mb-4 opacity-20" />
              <p>استخدم البحث أعلاه لشرح أي مفهوم غامض في الكتاب.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
