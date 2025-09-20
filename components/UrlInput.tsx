import React, { useState, useCallback, useRef } from 'react';
import { UploadIcon } from './icons/UploadIcon';

interface UrlInputProps {
  onProcessUrls: (urls: string[]) => void;
  isLoading: boolean;
}

enum InputMode {
  Paste,
  Upload,
}

export const UrlInput: React.FC<UrlInputProps> = ({ onProcessUrls, isLoading }) => {
  const [mode, setMode] = useState<InputMode>(InputMode.Paste);
  const [textValue, setTextValue] = useState<string>('');
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setTextValue(text);
      };
      reader.readAsText(file);
    }
  }, []);
  
  const validateAndExtractUrls = (text: string): string[] => {
      return text
        .split(/[\n,]+/) // Split by newlines or commas
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .filter(line => {
            // Very basic URL validation
            try {
                new URL(line);
                return true;
            } catch (_) {
                return false;
            }
        });
  };

  const handleSubmit = useCallback(() => {
    const urls = validateAndExtractUrls(textValue);
    onProcessUrls(urls);
  }, [textValue, onProcessUrls]);

  const canSubmit = !isLoading && validateAndExtractUrls(textValue).length > 0;

  const renderPaste = () => (
    <div>
      <label htmlFor="url-paste" className="block text-sm font-medium text-slate-600 mb-2">
        Paste URLs (one per line)
      </label>
      <textarea
        id="url-paste"
        rows={8}
        className="w-full p-3 bg-white border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
        placeholder="https://example.com/page1&#10;https://example.com/page2"
        value={textValue}
        onChange={(e) => setTextValue(e.target.value)}
        disabled={isLoading}
      />
    </div>
  );

  const renderUpload = () => (
    <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded-lg h-full">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".csv, .txt"
        onChange={handleFileChange}
        disabled={isLoading}
      />
      <UploadIcon className="w-12 h-12 text-slate-400 mb-2" />
      <button 
        type="button" 
        onClick={() => fileInputRef.current?.click()}
        className="text-sm font-semibold text-blue-600 hover:text-blue-800"
        disabled={isLoading}
      >
        Click to upload
      </button>
      <p className="text-xs text-slate-500 mt-1">CSV or TXT file</p>
      {fileName && <p className="text-sm text-slate-600 mt-4 font-medium">Selected: {fileName}</p>}
    </div>
  );

  return (
    <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg">
      <div className="mb-6">
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => { setMode(InputMode.Paste); setFileName(null); setTextValue('');}}
            className={`px-4 py-2 text-sm font-medium transition-colors ${mode === InputMode.Paste ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Manual Paste
          </button>
          <button
            onClick={() => { setMode(InputMode.Upload); setFileName(null); setTextValue(''); }}
            className={`px-4 py-2 text-sm font-medium transition-colors ${mode === InputMode.Upload ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            CSV Upload
          </button>
        </div>
      </div>
      
      {mode === InputMode.Paste ? renderPaste() : renderUpload()}
      
      <div className="mt-6">
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-400 disabled:cursor-not-allowed transition duration-150 ease-in-out"
        >
          {isLoading ? 'Processing...' : 'Generate Metadata'}
        </button>
      </div>
    </div>
  );
};