
import React, { useState } from 'react';
import { Lead } from '../types';
import { analyzeLeadText, fetchThreadPreview } from '../services/geminiService';

interface LeadCardProps {
  lead: Lead;
}

const LeadCard: React.FC<LeadCardProps> = ({ lead }) => {
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [threadPreview, setThreadPreview] = useState<string[] | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFetchingThread, setIsFetchingThread] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showThread, setShowThread] = useState(false);

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

  const handleFetchThread = async () => {
    if (threadPreview) {
      setShowThread(!showThread);
      return;
    }
    
    setIsFetchingThread(true);
    try {
      const comments = await fetchThreadPreview(lead.url);
      setThreadPreview(comments);
      setShowThread(true);
    } catch (e) {
      console.error(e);
    } finally {
      setIsFetchingThread(false);
    }
  };

  const getTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);

    if (days > 0) return `${days}d ago`;
    if (hrs > 0) return `${hrs}h ago`;
    return `${mins}m ago`;
  };

  const avatarColor = ['bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-emerald-500', 'bg-orange-500'][Math.floor(Math.random() * 5)];

  return (
    <div className="bg-white border border-slate-100 rounded-lg p-6 hover:shadow-md transition-all group relative overflow-hidden flex flex-col h-full">
      {/* Relevance Badge */}
      <div className="absolute top-0 right-0">
        <div className="bg-green-50 text-green-700 px-3 py-1 rounded-bl-lg text-[10px] font-bold border-l border-b border-green-100">
          {lead.relevanceScore}% Score
        </div>
      </div>

      <div className="flex items-start gap-4 mb-4 flex-1">
        {/* Mock Avatar */}
        <div className={`w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-lg shadow-inner ${avatarColor}`}>
          {lead.author ? lead.author[0] : (lead.platform[0] || '?')}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
            <h4 className="font-bold text-slate-800 text-base truncate max-w-[200px]">
              {lead.author || lead.title}
            </h4>
            <span className="text-slate-400 text-sm">•</span>
            <span className="text-indigo-600 font-bold text-xs uppercase tracking-tight">
              {lead.platform}
            </span>
            <span className="text-slate-300 text-sm hidden sm:inline">|</span>
            <span className="text-slate-400 text-xs font-medium">
              {getTimeAgo(lead.detectedAt)}
            </span>
          </div>
          
          <div className="relative">
            <p className={`text-slate-600 text-sm leading-relaxed ${!isExpanded ? 'line-clamp-3' : ''}`}>
              {lead.snippet}
            </p>
            {!isExpanded && lead.snippet.length > 150 && (
              <button 
                onClick={() => setIsExpanded(true)}
                className="text-indigo-600 font-bold text-sm mt-1 hover:text-indigo-800"
              >
                ...more
              </button>
            )}
          </div>

          {/* Thread Preview Section */}
          {showThread && threadPreview && (
            <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"></path></svg>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Thread Context</span>
              </div>
              {threadPreview.map((comment, i) => (
                <div key={i} className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-200 flex-shrink-0"></div>
                  <p className="text-[11px] text-slate-600 leading-tight italic">"{comment}"</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {aiSuggestion && (
        <div className="mb-4 bg-indigo-50 border border-indigo-100 rounded-xl p-4 animate-in fade-in zoom-in duration-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">AI Outreach Strategy</span>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed italic">"{aiSuggestion}"</p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mt-auto pt-4 border-t border-slate-50">
        <a 
          href={lead.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all flex items-center gap-2"
        >
          View Source
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
        </a>
        
        <button 
          onClick={handleFetchThread}
          disabled={isFetchingThread}
          className={`px-3 py-1.5 ${showThread ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'} rounded-lg text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-2`}
        >
          {isFetchingThread ? (
            <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          ) : (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
          )}
          {showThread ? 'Hide Preview' : 'Preview Thread'}
        </button>

        <button 
          onClick={handleGenerateReply}
          disabled={isAnalyzing}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm"
        >
          {isAnalyzing ? (
            <svg className="animate-spin h-3 w-3 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          ) : (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path></svg>
          )}
          {aiSuggestion ? 'New Idea' : 'AI Idea'}
        </button>
      </div>
    </div>
  );
};

export default LeadCard;
