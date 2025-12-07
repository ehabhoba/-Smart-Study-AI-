import React from 'react';
import { X, Search, Sparkles, Loader2, ArrowRightCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { DeepDiveResponse, ComplexityLevel } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  term: string;
  setTerm: (t: string) => void;
  result: DeepDiveResponse | null;
  isLoading: boolean;
  onSearch: (term: string) => void;
  complexity: ComplexityLevel;
  setComplexity: (c: ComplexityLevel) => void;
}

export const DeepDivePanel: React.FC<Props> = ({ 
  isOpen, onClose, term, setTerm, result, isLoading, onSearch, complexity, setComplexity 
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
        {/* Search & Config Bar */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="flex-1 flex gap-2">
            <input 
              type="text" 
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSearch(term)}
              placeholder="اكتب المصطلح أو المفهوم الذي تريد شرحه بالتفصيل..." 
              className="flex-1 p-3 md:p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition text-lg shadow-sm"
            />
          </div>
          
          <div className="flex gap-2">
            <select 
              value={complexity}
              onChange={(e) => setComplexity(e.target.value as ComplexityLevel)}
              className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white text-gray-700 cursor-pointer shadow-sm min-w-[120px]"
              title="مستوى الشرح"
            >
              <option value={ComplexityLevel.BASIC}>🌱 مبسط</option>
              <option value={ComplexityLevel.INTERMEDIATE}>📘 متوسط</option>
              <option value={ComplexityLevel.ADVANCED}>🎓 متقدم</option>
            </select>

            <button 
              onClick={() => onSearch(term)}
              disabled={isLoading || !term.trim()}
              className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-6 md:px-8 rounded-lg shadow transition disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : <Search />}
              اشرح لي
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto bg-gray-50 rounded-xl border border-gray-200 p-6">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center text-purple-600 opacity-70">
              <Loader2 size={48} className="animate-spin mb-4" />
              <p>جاري صياغة الشرح بناءً على سياق الكتاب...</p>
            </div>
          ) : result ? (
            <>
              <div className="flex items-center gap-2 mb-4">
                 <span className={`text-xs font-bold px-2 py-1 rounded border
                    ${complexity === ComplexityLevel.BASIC ? 'bg-green-100 text-green-700 border-green-200' :
                      complexity === ComplexityLevel.INTERMEDIATE ? 'bg-blue-100 text-blue-700 border-blue-200' :
                      'bg-purple-100 text-purple-700 border-purple-200'}
                 `}>
                   المستوى: {
                     complexity === ComplexityLevel.BASIC ? 'مبسط' : 
                     complexity === ComplexityLevel.INTERMEDIATE ? 'متوسط' : 'متقدم'
                   }
                 </span>
              </div>
              
              <article className="prose prose-purple max-w-none">
                <ReactMarkdown>{result.explanation}</ReactMarkdown>
              </article>
              
              {result.relatedTerms && result.relatedTerms.length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-bold text-gray-500 mb-4 flex items-center gap-2">
                    <Sparkles size={16} />
                    مواضيع ذات صلة قد تهمك:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {result.relatedTerms.map((rt, idx) => (
                      <button
                        key={idx}
                        onClick={() => onSearch(rt)}
                        className="group flex items-center gap-2 px-4 py-2 bg-white border border-purple-200 text-purple-700 rounded-full text-sm hover:bg-purple-50 hover:border-purple-300 transition shadow-sm"
                      >
                        <span>{rt}</span>
                        <ArrowRightCircle size={14} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
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