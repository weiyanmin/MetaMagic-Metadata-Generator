
import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-slate-800 shadow-lg">
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-4xl font-bold text-white tracking-tight">MetaMagic SEO App</h1>
        <p className="text-slate-300 mt-1">AI-Powered Metadata Generation Workflow</p>
      </div>
    </header>
  );
};
