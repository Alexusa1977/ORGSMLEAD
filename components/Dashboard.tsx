
import React, { useState, useEffect } from 'react';
import { KeywordFile, Lead } from '../types';
import LeadCard from './LeadCard';

interface DashboardProps {
  activeFile: KeywordFile | null;
  activePlatform: string | null;
  leads: Lead[];
  isLoading: boolean;
  onScanClick: (params?: Partial<KeywordFile>) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ activeFile, activePlatform, leads, isLoading, onScanClick }) => {
  const [showBanner, setShowBanner] = useState(true);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  
  // Local state for temporary search overrides
  const [localKeywords, setLocalKeywords] = useState('');
  const [localLocation, setLocalLocation] = useState('');
  const [localNiche, setLocalNiche] = useState('');

  // Sync local state when active target changes
  useEffect(() => {
    if (activeFile) {
      setLocalKeywords(activeFile.keywords.join(', '));
      setLocalLocation(activeFile.location);
      setLocalNiche(activeFile.niche);
    } else {
      // Default placeholders for platform-only views if no collection is active
      setLocalKeywords('organic leads, help needed');
      setLocalLocation('Global');
      setLocalNiche('Business');
    }
  }, [activeFile, activePlatform]);

  const handleRunScan = () => {
    const keywords = localKeywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
    onScanClick({
      keywords,
      location: localLocation,
      niche: localNiche
    });
    setIsConfigOpen(false);
  };

  const downloadCSV = () => {
    if (leads.length === 0) return;
    
    const headers = ['Author', 'Platform', 'Title', 'URL', 'Relevance', 'Date Found', 'Snippet'];
    const rows = leads.map(l => [
      `"${(l.author || 'Unknown').replace(/"/g, '""')}"`,
      `"${l.platform}"`,
      `"${l.title.replace(/"/g, '""')}"`,
      `"${l.url}"`,
      l.relevanceScore,
      `"${new Date(l.detectedAt).toLocaleDateString()}"`,
      `"${l.snippet.replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `leads_${activePlatform || activeFile?.name || 'export'}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto pb-20">
      {/* Search Configuration Panel */}
      <div className="mb-8 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm transition-all">
        <button 
          onClick={() => setIsConfigOpen(!isConfigOpen)}
          className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
            </div>
            <div className="text-left">
              <h3 className="font-bold text-slate-800">Search Parameters</h3>
              <p className="text-xs text-slate-500">Configure keywords and location for this folder</p>
            </div>
          </div>
          <svg className={`w-5 h-5 text-slate-400 transition-transform ${isConfigOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </button>

        {isConfigOpen && (
          <div className="p-6 pt-0 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 pt-6">
              <div className="md:col-span-3">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Keywords (Comma separated)</label>
                <input 
                  type="text"
                  value={localKeywords}
                  onChange={(e) => setLocalKeywords(e.target.value)}
                  placeholder="looking for a plumber, recommendation needed, hire a designer..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">City / State</label>
                <input 
                  type="text"
                  value={localLocation}
                  onChange={(e) => setLocalLocation(e.target.value)}
                  placeholder="e.g. Austin, TX"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Niche</label>
                <input 
                  type="text"
                  value={localNiche}
                  onChange={(e) => setLocalNiche(e.target.value)}
                  placeholder="e.g. Marketing"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all"
                />
              </div>
              <div className="flex items-end">
                <button 
                  onClick={handleRunScan}
                  disabled={isLoading}
                  className="w-full h-[42px] bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-md shadow-indigo-100 flex items-center justify-center gap-2"
                >
                  {isLoading ? 'Scanning...' : `Scan ${activePlatform || 'Folder'}`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {activeFile ? activeFile.name : activePlatform ? `${activePlatform.charAt(0).toUpperCase() + activePlatform.slice(1)} Leads` : 'Lead Vault'}
          </h2>
          <div className="flex items-center gap-4 mt-3">
             <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-600">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                {leads.length} Leads found
             </div>
             {activePlatform && (
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">{activePlatform} Folder</span>
             )}
          </div>
        </div>
        <div className="flex items-center gap-3">
           <button 
             onClick={downloadCSV}
             disabled={leads.length === 0}
             className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 disabled:opacity-50 transition-all flex items-center gap-2 shadow-sm"
           >
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
             Export CSV
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {leads.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {leads.map(lead => (
                <LeadCard key={lead.id} lead={lead} />
              ))}
            </div>
          ) : !isLoading ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-16 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </div>
              <h4 className="font-bold text-slate-800 mb-1">No results yet</h4>
              <p className="text-sm text-slate-500 mb-6">Adjust your parameters above and hit Scan to find new opportunities.</p>
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
          <div className="bg-indigo-900 rounded-3xl p-6 text-white shadow-xl sticky top-8">
             <div className="flex items-center gap-3 mb-4">
               <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                 <svg className="w-5 h-5 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
               </div>
               <h4 className="font-bold text-lg">Lead Intelligence</h4>
             </div>
             <p className="text-xs text-indigo-100 mb-6 leading-relaxed opacity-80">
               Configure your search specifically for <strong>{activePlatform || 'this collection'}</strong>. Use localized keywords for better accuracy in specific cities or states.
             </p>
             <div className="space-y-3">
                <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between">
                   <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">Scanning Scope</span>
                   <span className="text-xs font-bold">{activePlatform || 'Cross-Platform'}</span>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between">
                   <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">Target Location</span>
                   <span className="text-xs font-bold truncate max-w-[100px]">{localLocation}</span>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
