import React from 'react';
import { Loader2 } from 'lucide-react';
import { ProcessingStatus } from '../types';

interface Props {
  status: ProcessingStatus;
}

export const ProcessingArea: React.FC<Props> = ({ status }) => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 mb-6 text-center animate-pulse">
      <div className="flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <h3 className="font-bold text-blue-800 text-xl mb-2">{status.message}</h3>
        
        <div className="w-full bg-gray-200 rounded-full h-3 mt-4 max-w-lg overflow-hidden">
          <div 
            className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out" 
            style={{ width: `${status.progress}%` }}
          ></div>
        </div>
        <p className="text-sm text-blue-600 mt-2 font-mono">{status.progress}%</p>
      </div>
    </div>
  );
};
