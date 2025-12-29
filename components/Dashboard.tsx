
import React, { useState } from 'react';
import { KeywordFile, Lead } from '../types';
import LeadCard from './LeadCard';

interface DashboardProps {
  activeFile: KeywordFile | null;
  leads: Lead[];
  isLoading: boolean;
  onScanClick: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ activeFile, leads, isLoading, onScanClick }) => {
  const [showBanner, setShowBanner] = useState(true);

  if (!activeFile) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-6">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Ready to find leads?</h2>
        <p className="text-slate-500 mb-8">Create a new collection to start monitoring organic opportunities across social media.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {showBanner && (
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
        <div className="text-left md:text-right">
           <div className="flex flex-wrap gap-2 md:justify-end">
              {activeFile.keywords.map((kw, i) => (
                <span key={i} className="bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full text-[11px] font-bold text-indigo-600 shadow-sm">
                  {kw}
                </span>
              ))}
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              Opportunities History
              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-bold">{leads.length}</span>
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
            <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center">
              <h4 className="font-bold text-slate-800 mb-1">No leads saved yet</h4>
              <p className="text-sm text-slate-500 mb-6">Click "Scan New Leads" to populate your history.</p>
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
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-indigo-500" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"></path></svg>
              Platforms Coverage
            </h3>
            <div className="space-y-3">
                {['Reddit', 'X/Twitter', 'LinkedIn', 'Threads', 'Bluesky', 'Telegram'].map(p => (
                   <div key={p} className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-medium">{p}</span>
                      <span className="text-indigo-600 font-bold px-1.5 py-0.5 bg-indigo-50 rounded">MONITORED</span>
                   </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
