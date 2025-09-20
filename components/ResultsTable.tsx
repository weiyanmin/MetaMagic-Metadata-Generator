
import React, { useCallback } from 'react';
import type { MetadataResult } from '../types';
import { DownloadIcon } from './icons/DownloadIcon';

interface ResultsTableProps {
  results: MetadataResult[];
}

const LengthIndicator: React.FC<{ length: number; min: number; max: number }> = ({ length, min, max }) => {
  const isWithinRange = length >= min && length <= max;
  const color = isWithinRange ? 'text-green-600' : 'text-red-600';
  return <span className={`font-mono font-semibold ${color}`}>{length}</span>;
};

export const ResultsTable: React.FC<ResultsTableProps> = ({ results }) => {

  const downloadCSV = useCallback(() => {
    const headers = [
      'Page URL',
      'Page Title',
      'Title Length',
      'Page Description',
      'Description Length',
      'Focus Keyword',
    ];

    const csvRows = [
      headers.join(','),
      ...results.map((row) => {
        if(row.error) return null; // skip error rows
        const values = [
          row.url,
          row.title,
          row.titleLength,
          row.description,
          row.descriptionLength,
          row.focusKeyword,
        ].map(value => `"${String(value).replace(/"/g, '""')}"`); // Quote fields and escape double quotes
        return values.join(',');
      }).filter(Boolean)
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'optimized_metadata.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [results]);

  const hasSuccessfulResults = results.some(r => !r.error);

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-slate-800">Processing Results</h3>
        {hasSuccessfulResults && (
            <button
            onClick={downloadCSV}
            className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
            <DownloadIcon className="w-4 h-4" />
            Download CSV
            </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">URL</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Title & Length</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Description & Length</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Focus Keyword</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {results.map((result, index) => (
              <tr key={index} className={result.error ? "bg-red-50" : ""}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                  <a href={result.url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 truncate block max-w-xs">{result.url}</a>
                </td>
                <td className="px-6 py-4 text-sm text-slate-900">
                  <div className="font-medium">{result.title}</div>
                  {!result.error && <div className="text-slate-500 mt-1">Length: <LengthIndicator length={result.titleLength} min={40} max={55} /></div>}
                </td>
                <td className="px-6 py-4 text-sm text-slate-900">
                  <div className="whitespace-normal">{result.description}</div>
                  {!result.error && <div className="text-slate-500 mt-1">Length: <LengthIndicator length={result.descriptionLength} min={140} max={155} /></div>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {result.focusKeyword}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
