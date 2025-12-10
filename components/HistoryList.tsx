
import React, { useRef } from 'react';
import { Clock, FileText, Trash2, ArrowRight, Download, Upload } from 'lucide-react';
import { StudyAnalysisResult } from '../types';

interface Props {
  history: StudyAnalysisResult[];
  onLoad: (item: StudyAnalysisResult) => void;
  onDelete: (id: string) => void;
  onImport?: (data: StudyAnalysisResult[]) => void;
}

export const HistoryList: React.FC<Props> = ({ history, onLoad, onDelete, onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const dataStr = JSON.stringify(history, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smart_study_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
      fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const importedData = JSON.parse(event.target?.result as string);
              if (Array.isArray(importedData) && onImport) {
                  onImport(importedData);
              } else {
                  alert('الملف غير صالح.');
              }
          } catch (err) {
              console.error(err);
              alert('حدث خطأ أثناء قراءة ملف النسخة الاحتياطية.');
          }
      };
      reader.readAsText(file);
      // Reset input
      e.target.value = '';
  };

  if (history.length === 0 && !onImport) return null;

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 mt-8 animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Clock className="text-blue-600" />
            أرشيف الملخصات (محفوظة محلياً)
        </h2>
        
        <div className="flex gap-2">
            <button 
                onClick={handleExport}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm font-medium transition"
                title="تحميل نسخة احتياطية من الأرشيف"
            >
                <Download size={14} /> نسخ احتياطي
            </button>
            <button 
                onClick={handleImportClick}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm font-medium transition"
                title="استعادة أرشيف سابق"
            >
                <Upload size={14} /> استعادة
            </button>
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept=".json"
            />
        </div>
      </div>

      {history.length === 0 ? (
          <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
              لا توجد ملخصات محفوظة بعد.
          </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {history.map((item) => (
            <div 
                key={item.id} 
                className="group relative bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg p-4 transition-all duration-200 flex flex-col justify-between"
            >
                <div>
                    <div className="flex items-start justify-between mb-2">
                        <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                            <FileText size={20} />
                        </div>
                        <span className="text-xs text-gray-400 font-mono bg-white px-2 py-1 rounded border">
                            {new Date(item.date || '').toLocaleDateString('ar-EG')}
                        </span>
                    </div>
                    <h3 className="font-bold text-gray-800 line-clamp-1 mb-1" title={item.fileName}>
                        {item.fileName || 'ملخص بدون عنوان'}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-4">
                        {item.overview.substring(0, 80)}...
                    </p>
                </div>
                
                <div className="flex gap-2 mt-auto">
                    <button 
                        onClick={() => onLoad(item)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 rounded-md font-medium transition flex items-center justify-center gap-1"
                    >
                        عرض <ArrowRight size={14} />
                    </button>
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            if(window.confirm('هل أنت متأكد من حذف هذا الملخص؟')) {
                                onDelete(item.id!);
                            }
                        }}
                        className="px-3 bg-red-100 hover:bg-red-200 text-red-600 rounded-md transition"
                        title="حذف من الأرشيف"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>
            ))}
        </div>
      )}
    </div>
  );
};
