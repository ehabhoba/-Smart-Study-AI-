import React, { useState } from 'react';
import { Key, Eye, EyeOff } from 'lucide-react';

interface Props {
  apiKey: string;
  setApiKey: (key: string) => void;
}

export const ApiKeyInput: React.FC<Props> = ({ apiKey, setApiKey }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
        <Key size={16} className="text-blue-600" />
        مفتاح Google Gemini API (مجاني)
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type={isVisible ? "text" : "password"}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="AIzaSy..."
            className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
        </div>
        <button
          onClick={() => setIsVisible(!isVisible)}
          className="text-gray-500 hover:text-blue-600 px-3 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition"
        >
          {isVisible ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>
      <p className="text-xs text-gray-500 mt-2">
        يتم استخدام المفتاح محلياً في متصفحك فقط ولا يتم إرساله لأي سيرفر خارجي.
      </p>
    </div>
  );
};
