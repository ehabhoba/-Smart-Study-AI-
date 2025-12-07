import React, { useState } from 'react';
import { GraduationCap } from 'lucide-react';

export const Header: React.FC = () => {
  const [logoError, setLogoError] = useState(false);

  return (
    <header className="bg-gradient-to-r from-blue-800 to-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-6 flex flex-col items-center">
        <div className="flex items-center gap-3 mb-2">
          {/* Try to load logo.png, fallback to Icon if missing */}
          {!logoError ? (
            <img 
              src="./logo.png" 
              alt="Smart Study AI Logo" 
              className="w-16 h-16 object-contain bg-white rounded-xl p-1 shadow-md"
              onError={() => setLogoError(true)}
            />
          ) : (
            <GraduationCap size={40} className="text-blue-200" />
          )}
          <h1 className="text-3xl font-bold text-center">المُلخص الدراسي الذكي</h1>
        </div>
        <p className="text-center text-blue-100 mt-2 text-lg">
          حلل كتبك المدرسية، استخرج الأسئلة، ولخص المنهج بضغطة زر
        </p>
      </div>
    </header>
  );
};