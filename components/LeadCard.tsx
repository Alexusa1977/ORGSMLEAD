
import React, { useState } from 'react';
import { Lead } from '../types';
import { analyzeLeadText } from '../services/geminiService';

interface LeadCardProps {
  lead: Lead;
}

const LeadCard: React.FC<LeadCardProps> = ({ lead }) => {
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleGenerateReply = async () => {
    setIsAnalyzing(true);
    try {
      const suggestion = await analyzeLeadText(lead.snippet);
      setAiSuggestion(suggestion);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg hover:shadow-indigo-50/50 transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
            {lead.platform === 'LinkedIn' && <svg className="w-5 h-5 text-blue-700" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>}
            {lead.platform === 'Reddit' && <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 24 24"><path d="M24 11.5c0-1.654-1.346-3-3-3-.964 0-1.817.466-2.36 1.185-2.094-1.486-4.935-2.433-8.064-2.536l1.724-5.41 5.378 1.144c.12 1.05 1.008 1.867 2.083 1.867 1.16 0 2.101-.94 2.101-2.101S19.92 .55 18.761.55c-1.026 0-1.884.738-2.073 1.714l-5.965-1.268c-.28-.06-.554.125-.62.404L8.138 7.15c-3.16.077-6.035 1.022-8.15 2.518C-.55 8.947-1.403 8.5-2.367 8.5c-1.654 0-3 1.346-3 3 0 1.077.57 2.016 1.424 2.548-.04.24-.06.48-.06.72 0 4.214 4.814 7.632 10.74 7.632 5.926 0 10.74-3.418 10.74-7.632 0-.24-.02-.48-.06-.72.854-.532 1.424-1.47 1.424-2.548zM10.74 17.3c-5.12 0-9.24-2.7-9.24-6.03 0-.15.01-.3.03-.45 1.62-1.35 4.04-2.19 6.78-2.31l1.41-4.44 4.41.94c-.01.07-.02.14-.02.21 0 .88.72 1.6 1.6 1.6s1.6-.72 1.6-1.6-.72-1.6-1.6-1.6c-.73 0-1.34.49-1.53 1.16l-5.04-1.07-1.56 4.9c2.72.14 5.12.98 6.73 2.32.02.15.03.3.03.45 0 3.33-4.12 6.03-9.24 6.03zm4.5-5.53c0 .82-.67 1.5-1.5 1.5s-1.5-.68-1.5-1.5.67-1.5 1.5-1.5 1.5.67 1.5 1.5zm-9 0c0 .82-.67 1.5-1.5 1.5s-1.5-.68-1.5-1.5.67-1.5 1.5-1.5 1.5.67 1.5 1.5z"/></svg>}
            {(lead.platform !== 'LinkedIn' && lead.platform !== 'Reddit') && <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path></svg>}
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-base leading-tight">{lead.title}</h4>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-1">{lead.platform} • {new Date(lead.detectedAt).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className="bg-green-50 text-green-700 px-2 py-1 rounded-lg text-[10px] font-bold border border-green-100 mb-1">
            {lead.relevanceScore}% Relevant
          </div>
          <div className="flex gap-1">
             <div className="w-2 h-2 rounded-full bg-green-500"></div>
             <div className="w-2 h-2 rounded-full bg-slate-200"></div>
             <div className="w-2 h-2 rounded-full bg-slate-200"></div>
          </div>
        </div>
      </div>

      <p className="text-sm text-slate-600 mb-6 line-clamp-2 leading-relaxed italic">
        "{lead.snippet}"
      </p>

      {aiSuggestion ? (
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 bg-indigo-600 rounded flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"></path></svg>
            </div>
            <span className="text-xs font-bold text-indigo-700 uppercase tracking-widest">AI Response Strategy</span>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed font-medium">{aiSuggestion}</p>
        </div>
      ) : null}

      <div className="flex items-center gap-3">
        <a 
          href={lead.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex-1 text-center py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
        >
          View Original Post
        </a>
        <button 
          onClick={handleGenerateReply}
          disabled={isAnalyzing}
          className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-100 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isAnalyzing ? (
            <svg className="animate-spin h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : null}
          {aiSuggestion ? 'Regenerate Strategy' : 'Get AI Strategy'}
        </button>
      </div>
    </div>
  );
};

export default LeadCard;
