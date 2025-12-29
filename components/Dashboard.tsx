
import React, { useState } from 'react';
import { KeywordFile, Lead } from '../types';
import LeadCard from './LeadCard';

interface DashboardProps {
  activeFile: KeywordFile | null;
  activePlatform: string | null;
  leads: Lead[];
  isLoading: boolean;
  onScanClick: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ activeFile, activePlatform, leads, isLoading, onScanClick }) => {
  const [showBanner, setShowBanner] = useState(true);

  return (
    <div className="max-w-6xl mx-auto">
      {activeFile && showBanner && (
        <div className="mb-8 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
            </div>
            <p className="text-sm font-medium text-blue-800">
              Too many posts? <button onClick={onScanClick} className="underline font-bold hover:text-blue-900">Ask AI to find quality leads</button>
            </p>
          </div>
          <button onClick={() => setShowBanner(false)} className="text-blue-400 hover:text-blue-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
      )}

      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {activeFile ? activeFile.name : activePlatform ? `All ${activePlatform} Leads` : 'Lead Vault'}
          </h2>
          {activeFile && (
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
          )}
        </div>
        <div className="text-left md:text-right">
           <div className="flex flex-wrap gap-2 md:justify-end">
              {activeFile?.keywords.map((kw, i) => (
                <span key={i} className="bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full text-[11px] font-bold text-indigo-600 shadow-sm">
                  {kw}
                </span>
              ))}
              {activePlatform && (
                <span className="bg-slate-100 border border-slate-200 px-3 py-1 rounded-full text-[11px] font-bold text-slate-600 shadow-sm uppercase tracking-widest">
                  {activePlatform}
                </span>
              )}
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              Opportunities History
              <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-xs font-bold">{leads.length}</span>
            </h3>
            {isLoading && (
               <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold">
                 <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                 Searching...
               </div>
            )}
          </div>

          {leads.length > 0 ? (
            <div className="space-y-4">
              {leads.map(lead => (
                <LeadCard key={lead.id} lead={lead} />
              ))}
            </div>
          ) : !isLoading ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-16 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </div>
              <h4 className="font-bold text-slate-800 mb-1">No leads found in this folder</h4>
              <p className="text-sm text-slate-500 mb-6">Run a scan on your keyword collections to find leads for this platform.</p>
            </div>
          ) : (
             <div className="space-y-4">
               {[1, 2, 3].map(i => (
                 <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 animate-pulse h-32"></div>
               ))}
             </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-indigo-900 rounded-3xl p-6 text-white shadow-xl">
             <h4 className="font-bold text-lg mb-4 text-indigo-200">AI Sales Assistant</h4>
             <p className="text-xs text-indigo-100 mb-6 leading-relaxed opacity-80">
               "I've categorized your leads into platform folders to help you focus your outreach strategy. Social platform norms vary, so use the 'AI Idea' button on each lead for tailored advice."
             </p>
             <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <div className="flex justify-between text-xs font-bold mb-2">
                   <span>Lead Health</span>
                   <span className="text-green-400">Stable</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                   <div className="h-full bg-indigo-500 w-2/3"></div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
