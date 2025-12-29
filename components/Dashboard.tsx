
import React from 'react';
import { KeywordFile, Lead } from '../types';
import LeadCard from './LeadCard';

interface DashboardProps {
  activeFile: KeywordFile | null;
  leads: Lead[];
  isLoading: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ activeFile, leads, isLoading }) => {
  if (!activeFile) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-6">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Ready to find leads?</h2>
        <p className="text-slate-500 mb-8">Create a new collection or select an existing one from the sidebar to start monitoring organic opportunities.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">{activeFile.name}</h2>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Niche:</span>
              <span className="text-sm font-medium text-slate-600">{activeFile.niche}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Location:</span>
              <span className="text-sm font-medium text-slate-600">{activeFile.location}</span>
            </div>
          </div>
        </div>
        <div className="text-left md:text-right space-y-3">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Included Keywords</p>
            <div className="flex flex-wrap gap-2 md:justify-end">
              {activeFile.keywords.map((kw, i) => (
                <span key={i} className="bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full text-[11px] font-bold text-indigo-600 shadow-sm">
                  {kw}
                </span>
              ))}
            </div>
          </div>
          {activeFile.excludeKeywords?.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Excluded Keywords</p>
              <div className="flex flex-wrap gap-2 md:justify-end">
                {activeFile.excludeKeywords.map((kw, i) => (
                  <span key={i} className="bg-rose-50 border border-rose-100 px-3 py-1 rounded-full text-[11px] font-bold text-rose-600 shadow-sm">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              Recent Opportunities
              <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs">{leads.length}</span>
            </h3>
            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Last 3 Months</span>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 animate-pulse">
                  <div className="h-4 bg-slate-100 rounded w-1/3 mb-4"></div>
                  <div className="h-3 bg-slate-100 rounded w-full mb-2"></div>
                  <div className="h-3 bg-slate-100 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : leads.length > 0 ? (
            <div className="space-y-4">
              {leads.map(lead => (
                <LeadCard key={lead.id} lead={lead} />
              ))}
            </div>
          ) : (
            <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </div>
              <h4 className="font-bold text-slate-800 mb-1">No leads found yet</h4>
              <p className="text-sm text-slate-500 mb-6">Click "Scan for Leads" to search social platforms and the web.</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-indigo-400">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd"></path></svg>
              Strategy Hub
            </h3>
            <div className="space-y-4">
              <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Lead Health</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500" style={{ width: `${Math.min(leads.length * 10, 100)}%` }}></div>
                  </div>
                  <span className="text-xs font-bold">{leads.length > 5 ? 'High' : 'Moderate'}</span>
                </div>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">AI Recommendation</p>
                <p className="text-xs text-slate-300 italic">"Scanning public discussions across X, Reddit, and LinkedIn for ${activeFile.niche} opportunities."</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-indigo-500" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"></path></svg>
              Coverage Matrix
            </h3>
            <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Public X/Twitter</span>
                    <span className="text-green-600 font-bold uppercase">Active</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Reddit Communities</span>
                    <span className="text-green-600 font-bold uppercase">Active</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Public LinkedIn</span>
                    <span className="text-green-600 font-bold uppercase">Active</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Threads & Bluesky</span>
                    <span className="text-green-600 font-bold uppercase">Active</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Public Telegram</span>
                    <span className="text-green-600 font-bold uppercase">Active</span>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100">
                    <p className="text-[10px] text-slate-400 italic">Note: Private Facebook groups and encrypted chats (WhatsApp) are not searchable for privacy compliance.</p>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
