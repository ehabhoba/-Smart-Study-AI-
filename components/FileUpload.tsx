
import React, { useCallback, useRef, useState } from 'react';
import { Upload, FileText, Presentation, X, CheckCircle } from 'lucide-react';

interface Props {
  onFileLoaded: (file: File) => void;
  fileName: string;
  disabled: boolean;
  onClear?: () => void;
}

export const FileUpload: React.FC<Props> = ({ onFileLoaded, fileName, disabled, onClear }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const isValidFileType = (file: File) => {
    return file.type === 'application/pdf' || 
           file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
           file.name.endsWith('.pptx') ||
           file.type.startsWith('image/');
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isDragging) setIsDragging(true);
  }, [disabled, isDragging]);

  const processFile = (file: File) => {
    setShowSuccess(true);
    // Show success state briefly before processing
    setTimeout(() => {
      onFileLoaded(file);
      setShowSuccess(false);
    }, 800);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (disabled) return;

    const file = e.dataTransfer.files[0];
    if (file && isValidFileType(file)) {
      processFile(file);
    }
  }, [onFileLoaded, disabled]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      processFile(e.target.files[0]);
    }
  };

  const isPowerPoint = fileName.endsWith('.pptx');
  const isImage = fileName.match(/\.(jpg|jpeg|png|webp)$/i);

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 h-full">
      <h2 className="text-xl font-bold mb-4 text-blue-800 flex items-center gap-2">
        <FileText className="w-5 h-5" />
        1. رفع الملف (PDF / PPTX / صور)
      </h2>
      
      <div 
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && !fileName && fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 relative h-64 flex flex-col items-center justify-center overflow-hidden
          ${disabled 
            ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-300' 
            : showSuccess
              ? 'bg-green-50 border-green-500 scale-[1.02] shadow-md border-solid'
              : isDragging 
                ? 'bg-blue-50 border-blue-500 scale-[1.02] shadow-xl ring-4 ring-blue-100' 
                : 'border-blue-300 hover:bg-blue-50 hover:border-blue-500 cursor-pointer'
          }
        `}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleChange}
          accept=".pdf, .pptx, .png, .jpg, .jpeg, .webp, application/pdf, application/vnd.openxmlformats-officedocument.presentationml.presentation, image/*"
          className="hidden" 
          disabled={disabled}
        />
        
        {/* Success Overlay */}
        {showSuccess ? (
           <div className="flex flex-col items-center justify-center animate-in zoom-in duration-300">
              <div className="bg-green-100 p-4 rounded-full mb-4">
                 <CheckCircle size={48} className="text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-green-700">تم استلام الملف!</h3>
              <p className="text-green-600">جاري المعالجة...</p>
           </div>
        ) : (
           <>
              <div className={`text-blue-500 mb-4 flex gap-2 justify-center transition-all duration-300 ${isDragging ? 'scale-110 -translate-y-2' : ''}`}>
                <Upload size={48} className={isDragging ? 'animate-bounce' : ''} />
              </div>
              
              {fileName ? (
                <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-300">
                  <div className={`
                    px-4 py-2 rounded-full font-medium inline-flex items-center gap-2
                    ${isPowerPoint ? 'bg-orange-100 text-orange-800' : isImage ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}
                  `}>
                    {isPowerPoint ? <Presentation size={16} /> : isImage ? <FileText size={16} /> : <FileText size={16} />}
                    {fileName}
                  </div>
                  {onClear && !disabled && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onClear();
                      }}
                      className="p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition shadow-sm"
                      title="حذف الملف"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <p className={`font-medium text-lg transition-colors ${isDragging ? 'text-blue-800' : 'text-gray-700'}`}>
                    {isDragging ? 'أفلت الملف هنا...' : 'اضغط هنا أو اسحب الملف'}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">يدعم الكتب (PDF)، العروض (PPTX)، والصور</p>
                </>
              )}
           </>
        )}
      </div>
    </div>
  );
};
