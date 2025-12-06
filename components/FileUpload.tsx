import React, { useCallback, useRef } from 'react';
import { Upload, FileText } from 'lucide-react';

interface Props {
  onFileLoaded: (file: File) => void;
  fileName: string;
  disabled: boolean;
}

export const FileUpload: React.FC<Props> = ({ onFileLoaded, fileName, disabled }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      onFileLoaded(file);
    }
  }, [onFileLoaded, disabled]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      onFileLoaded(e.target.files[0]);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 h-full">
      <h2 className="text-xl font-bold mb-4 text-blue-800 flex items-center gap-2">
        <FileText className="w-5 h-5" />
        1. رفع الكتاب (PDF)
      </h2>
      
      <div 
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition cursor-pointer relative h-64 flex flex-col items-center justify-center
          ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'border-blue-300 hover:bg-blue-50 hover:border-blue-500'}
        `}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleChange}
          accept="application/pdf" 
          className="hidden" 
          disabled={disabled}
        />
        
        <div className="text-blue-500 mb-4">
          <Upload size={48} className="mx-auto" />
        </div>
        
        {fileName ? (
          <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full font-medium inline-flex items-center gap-2">
            <FileText size={16} />
            {fileName}
          </div>
        ) : (
          <>
            <p className="font-medium text-gray-700 text-lg">اضغط هنا أو اسحب الملف</p>
            <p className="text-sm text-gray-500 mt-2">يدعم الكتب الكبيرة (PDF)</p>
          </>
        )}
      </div>
    </div>
  );
};
