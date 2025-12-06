import React from 'react';
import { GraduationCap } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="bg-gradient-to-r from-blue-800 to-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-6 flex flex-col items-center">
        <div className="flex items-center gap-3 mb-2">
          <GraduationCap size={40} className="text-blue-200" />
          <h1 className="text-3xl font-bold text-center">المُلخص الدراسي الذكي</h1>
        </div>
        <p className="text-center text-blue-100 mt-2 text-lg">
          حلل كتبك المدرسية، استخرج الأسئلة، ولخص المنهج بضغطة زر
        </p>
      </div>
    </header>
  );
};
