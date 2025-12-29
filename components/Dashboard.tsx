
import React, { useState, useEffect } from 'react';
import { KeywordFile, Lead, FacebookGroup } from '../types';
import LeadCard from './LeadCard';
import { findFacebookGroups } from '../services/geminiService';

interface DashboardProps {
  activeFile: KeywordFile | null;
  activePlatform: string | null;
  leads: Lead[];
  isLoading: boolean;
  onScanClick: (params?: Partial<KeywordFile> & { searchGroups?: boolean; targetGroups?: FacebookGroup[] }) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ activeFile, activePlatform, leads, isLoading, onScanClick }) => {
  const [isFindingGroups, setIsFindingGroups] = useState(false);
  const [discoveredGroups, setDiscoveredGroups] = useState<FacebookGroup[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isAutoScanEnabled, setIsAutoScanEnabled] = useState(false);
  
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
      setLocalKeywords('');
      setLocalLocation('Orlando, FL');
      setLocalNiche('Business');
    }
    // Reset groups when switching view
    setDiscoveredGroups([]);
    setSelectedGroupIds(new Set());
    setSearchError(null);
  }, [activeFile, activePlatform]);

  const handleRunScan = () => {
    const keywords = localKeywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
    const targetGroups = discoveredGroups.filter(g => selectedGroupIds.has(g.id));
    
    onScanClick({
      keywords,
      location: localLocation,
      niche: activePlatform === 'facebook' ? 'Facebook Community Search' : localNiche,
      searchGroups: activePlatform === 'facebook' ? (targetGroups.length > 0) : false,
      targetGroups: targetGroups.length > 0 ? targetGroups : undefined
    });
  };

  const handleFindGroups = async () => {
    if (!localLocation) {
      setSearchError("Please enter a city/state first to find local groups.");
      return;
    }

    setSearchError(null);
    setIsFindingGroups(true);
    setDiscoveredGroups([]);
    try {
      const groups = await findFacebookGroups(localLocation);
      if (groups.length === 0) {
        setSearchError(`We couldn't find specific community URLs for "${localLocation}" using live search. Try a nearby larger city or skip to manual keyword scanning.`);
      } else {
        setDiscoveredGroups(groups);
        setSelectedGroupIds(new Set(groups.map(g => g.id)));
      }
    } catch (e) {
      console.error(e);
      setSearchError("The search tool is currently unavailable. Please try again in a few moments.");
    } finally {
      setIsFindingGroups(false);
    }
  };

  const toggleGroup = (id: string) => {
    const next = new Set(selectedGroupIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedGroupIds(next);
  };

  const toggleAllGroups = () => {
    if (selectedGroupIds.size === discoveredGroups.length) {
      setSelectedGroupIds(new Set());
    } else {
      setSelectedGroupIds(new Set(discoveredGroups.map(g => g.id)));
    }
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

  const isFacebook = activePlatform === 'facebook';

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
        {/* Step-by-Step Search Panel */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
            <h2 className="text-2xl font-extrabold text-slate-800 mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm">1</span>
              Local Community Discovery
            </h2>
            
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">City / State</label>
                <input 
                  type="text" 
                  value={localLocation}
                  onChange={(e) => setLocalLocation(e.target.value)}
                  placeholder="e.g. Orlando, FL"
                  className="w-full px-5 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium"
                />
              </div>
              <div className="flex items-end">
                <button 
                  onClick={handleFindGroups}
                  disabled={isFindingGroups || !localLocation}
                  className="h-[50px] px-8 bg-indigo-600 text-white rounded-2xl text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-3 shadow-lg shadow-indigo-100"
                >
                  {isFindingGroups ? (
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                  )}
                  Find Target Groups
                </button>
              </div>
            </div>

            {searchError && (
              <div className="mt-4 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-xs font-medium flex items-center gap-3">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                {searchError}
              </div>
            )}

            {discoveredGroups.length > 0 && (
              <div className="mt-8 animate-in fade-in slide-in-from-top-4 duration-300">
                <h3 className="text-xl font-extrabold text-slate-800 mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm">2</span>
                  Select Communities to Scan
                </h3>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{discoveredGroups.length} Groups Found in {localLocation}</span>
                  <button onClick={toggleAllGroups} className="text-[10px] font-bold text-indigo-600 hover:underline uppercase tracking-wider">
                    {selectedGroupIds.size === discoveredGroups.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                  {discoveredGroups.map(group => (
                    <div 
                      key={group.id} 
                      onClick={() => toggleGroup(group.id)}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${selectedGroupIds.has(group.id) ? 'bg-indigo-50/50 border-indigo-200 shadow-sm' : 'bg-white border-slate-100 opacity-60 hover:opacity-100'}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${selectedGroupIds.has(group.id) ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}>
                          {selectedGroupIds.has(group.id) && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                        </div>
                        <span className="text-xs font-bold text-slate-700 truncate">{group.name}</span>
                      </div>
                      <a href={group.url} target="_blank" onClick={(e) => e.stopPropagation()} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                      </a>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-8 border-t border-slate-100 animate-in fade-in slide-in-from-top-4 duration-500">
                  <h3 className="text-xl font-extrabold text-slate-800 mb-6 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm">3</span>
                    Scan Keywords
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Search Keywords (Looking for these inside selected groups)</label>
                      <textarea 
                        value={localKeywords}
                        onChange={(e) => setLocalKeywords(e.target.value)}
                        placeholder="e.g. looking for recommendations, need a tile installer, help with flooring"
                        rows={3}
                        className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium resize-none"
                      />
                      <p className="text-[10px] text-slate-400 mt-2 italic font-medium">Keywords are separated by commas. We search for people asking for these in the community feed.</p>
                    </div>

                    {!isFacebook && (
                      <div className="animate-in fade-in">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Niche / Industry</label>
                        <input 
                          type="text"
                          value={localNiche}
                          onChange={(e) => setLocalNiche(e.target.value)}
                          placeholder="e.g. Home Services"
                          className="w-full px-5 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium"
                        />
                      </div>
                    )}

                    <button 
                      onClick={handleRunScan}
                      disabled={isLoading || selectedGroupIds.size === 0 || !localKeywords}
                      className="w-full h-[56px] bg-slate-900 text-white rounded-2xl text-base font-bold hover:bg-black disabled:opacity-50 transition-all flex items-center justify-center gap-3 shadow-xl"
                    >
                      {isLoading ? (
                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                      )}
                      Start Full Scan
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Info & Controls */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-indigo-900 rounded-3xl p-8 text-white shadow-xl">
             <div className="flex items-center gap-3 mb-6">
               <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                 <svg className="w-6 h-6 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04c-.243.394-.382.859-.382 1.355 0 4.14 2.803 7.625 6.618 8.618A11.95 11.95 0 0012 21.056a11.95 11.95 0 008.618-3.04c.394-.243.859-.382 1.355-.382 4.14 0 7.625-2.803 8.618-6.618A11.95 11.95 0 0012 2.944z"></path></svg>
               </div>
               <div>
                 <h4 className="font-extrabold text-lg">Smart Monitoring</h4>
                 <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider">Automated Intelligence</p>
               </div>
             </div>
             
             <div className="space-y-6">
               <div className="p-5 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-indigo-300 mb-1">Auto-Scan</span>
                    <span className="text-sm font-bold">Hourly Monitoring</span>
                  </div>
                  <button 
                    onClick={() => setIsAutoScanEnabled(!isAutoScanEnabled)}
                    className={`w-12 h-6 rounded-full transition-colors relative flex items-center ${isAutoScanEnabled ? 'bg-indigo-500' : 'bg-white/20'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full absolute transition-all ${isAutoScanEnabled ? 'right-1' : 'left-1'}`}></div>
                  </button>
               </div>
               
               <div className="space-y-3">
                 <p className="text-xs text-indigo-100 leading-relaxed opacity-80">
                   When enabled, LeadSync will automatically re-scan your selected communities every hour for new organic requests matching your keywords.
                 </p>
                 <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-300 uppercase tracking-widest">
                   <span className={`w-2 h-2 rounded-full ${isAutoScanEnabled ? 'bg-green-400 animate-pulse' : 'bg-slate-500'}`}></span>
                   Status: {isAutoScanEnabled ? 'Monitoring Active' : 'Standby Mode'}
                 </div>
               </div>
             </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
             <h4 className="font-bold text-slate-800 mb-4">Discovery Tips</h4>
             <ul className="space-y-4">
               <li className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-slate-500">1</div>
                  <p className="text-xs text-slate-500 leading-relaxed">Search broad city terms like "Orlando" or "Miami" to find the most active hubs.</p>
               </li>
               <li className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-slate-500">2</div>
                  <p className="text-xs text-slate-500 leading-relaxed">Target groups with keywords like "Recommendations" for the highest intent leads.</p>
               </li>
               <li className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-slate-500">3</div>
                  <p className="text-xs text-slate-500 leading-relaxed">Use natural phrasing like "looking for" or "need a" in your scan keywords.</p>
               </li>
             </ul>
          </div>
        </div>
      </div>

      {/* Leads Feed */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 pt-12 border-t border-slate-200">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {activeFile ? activeFile.name : activePlatform ? `${activePlatform.charAt(0).toUpperCase() + activePlatform.slice(1)} Feed` : 'Lead Vault'}
          </h2>
          <div className="flex items-center gap-4 mt-3">
             <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-600">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                {leads.length} Organic Matches
             </div>
             {selectedGroupIds.size > 0 && isFacebook && (
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Scanning {selectedGroupIds.size} Target Communities</span>
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
             Export Results
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-3 space-y-4">
          {leads.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {leads.map(lead => (
                <LeadCard key={lead.id} lead={lead} />
              ))}
            </div>
          ) : !isLoading ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-[2rem] p-24 text-center shadow-sm">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </div>
              <h4 className="text-xl font-bold text-slate-800 mb-2">No results yet</h4>
              <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">Complete the 3 steps above to start discovering high-intent organic leads in your selected local communities.</p>
            </div>
          ) : (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {[1, 2, 3, 4, 5, 6].map(i => (
                 <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 animate-pulse h-48"></div>
               ))}
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
