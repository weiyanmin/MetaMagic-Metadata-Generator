
import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { UrlInput } from './components/UrlInput';
import { ResultsTable } from './components/ResultsTable';
import { Loader } from './components/Loader';
import { generateMetadataForUrl } from './services/geminiService';
import type { MetadataResult } from './types';

const App: React.FC = () => {
  const [results, setResults] = useState<MetadataResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleProcessUrls = useCallback(async (urls: string[]) => {
    if (urls.length === 0) {
      setError("Please provide at least one URL.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults([]);

    try {
      const metadataPromises = urls.map(async (url) => {
        try {
          const generatedData = await generateMetadataForUrl(url);
          return {
            ...generatedData,
            url,
            titleLength: generatedData.title.length,
            descriptionLength: generatedData.description.length,
          };
        } catch (e) {
          console.error(`Failed to process URL ${url}:`, e);
          // Return a specific error object for this URL
          return {
            url,
            title: "Error processing URL",
            description: e instanceof Error ? e.message : "An unknown error occurred.",
            focusKeyword: "-",
            titleLength: 0,
            descriptionLength: 0,
            error: true
          };
        }
      });

      const settledResults = await Promise.all(metadataPromises);
      setResults(settledResults);

    } catch (e) {
      console.error("An unexpected error occurred during processing:", e);
      setError(e instanceof Error ? e.message : "An unknown error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <UrlInput onProcessUrls={handleProcessUrls} isLoading={isLoading} />
          
          {isLoading && <Loader />}

          {error && (
            <div className="mt-8 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg" role="alert">
              <p className="font-bold">Error</p>
              <p>{error}</p>
            </div>
          )}

          {!isLoading && results.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-slate-700 mb-4">Generated Metadata</h2>
              <ResultsTable results={results} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
