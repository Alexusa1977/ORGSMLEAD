
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
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isFindingGroups, setIsFindingGroups] = useState(false);
  const [discoveredGroups, setDiscoveredGroups] = useState<FacebookGroup[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());
  const [searchError, setSearchError] = useState<string | null>(null);
  
  // Local state for temporary search overrides
  const [localKeywords, setLocalKeywords] = useState('');
  const [localLocation, setLocalLocation] = useState('');
  const [localNiche, setLocalNiche] = useState('');
  const [searchGroupsToggle, setSearchGroupsToggle] = useState(false);

  // Sync local state when active target changes
  useEffect(() => {
    if (activeFile) {
      setLocalKeywords(activeFile.keywords.join(', '));
      setLocalLocation(activeFile.location);
      setLocalNiche(activeFile.niche);
    } else {
      setLocalKeywords('looking for recommendations, need help with');
      setLocalLocation('Austin, TX');
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
      searchGroups: activePlatform === 'facebook' ? (searchGroupsToggle || targetGroups.length > 0) : false,
      targetGroups: targetGroups.length > 0 ? targetGroups : undefined
    });
    setIsConfigOpen(false);
  };

  const handleFindGroups = async () => {
    if (!localLocation) {
      setSearchError("Please enter a city/state first to find local groups.");
      return;
    }

    setSearchError(null);
    setIsFindingGroups(true);
    try {
      // Find broad community groups in the city
      const groups = await findFacebookGroups(localLocation);
      if (groups.length === 0) {
        setSearchError(`Could not find any public community groups for "${localLocation}". Please check the spelling or try a different city.`);
      } else {
        setDiscoveredGroups(groups);
        // Auto-select all discovered groups by default
        setSelectedGroupIds(new Set(groups.map(g => g.id)));
      }
    } catch (e) {
      console.error(e);
      setSearchError("An error occurred while searching for groups. Please try again.");
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
              <p className="text-xs text-slate-500">Find keywords mentioned in public city communities</p>
            </div>
          </div>
          <svg className={`w-5 h-5 text-slate-400 transition-transform ${isConfigOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </button>

        {isConfigOpen && (
          <div className="p-6 pt-0 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 pt-6">
              <div className="md:col-span-3">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Search Keywords (find these in comments/posts)</label>
                <input 
                  type="text"
                  value={localKeywords}
                  onChange={(e) => setLocalKeywords(e.target.value)}
                  placeholder="e.g. looking for recommendations, need a plumber, hiring help"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                />
              </div>
              <div className={isFacebook ? 'md:col-span-2' : ''}>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Target City / State</label>
                <input 
                  type="text" 
                  value={localLocation}
                  onChange={(e) => setLocalLocation(e.target.value)}
                  placeholder="e.g. Austin, TX"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                />
              </div>
              {!isFacebook && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Niche / Industry</label>
                  <input 
                    type="text"
                    value={localNiche}
                    onChange={(e) => setLocalNiche(e.target.value)}
                    placeholder="e.g. Home Services"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  />
                </div>
              )}
              <div className="flex items-end">
                <button 
                  onClick={handleRunScan}
                  disabled={isLoading}
                  className="w-full h-[42px] bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-100"
                >
                  {isLoading ? (
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  ) : `Start Scanning`}
                </button>
              </div>
            </div>

            {isFacebook && (
              <div className="mt-6 p-5 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                   <div>
                     <h4 className="text-sm font-bold text-slate-800">Discover City Groups</h4>
                     <p className="text-[10px] text-slate-500 font-medium italic">We'll find active public groups in {localLocation || 'your city'} where people ask for help.</p>
                   </div>
                   <button 
                     onClick={handleFindGroups}
                     disabled={isFindingGroups || !localLocation}
                     className="px-4 py-2 bg-white border border-slate-300 text-indigo-600 rounded-lg text-[10px] font-bold hover:bg-indigo-50 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
                   >
                     {isFindingGroups ? (
                       <svg className="animate-spin h-3 w-3 text-indigo-600" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                     ) : (
                       <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                     )}
                     {isFindingGroups ? 'Scanning City...' : 'Find Community Groups'}
                   </button>
                </div>

                {searchError && (
                  <div className="mb-4 p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs font-medium">
                    {searchError}
                  </div>
                )}

                {discoveredGroups.length > 0 && (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{discoveredGroups.length} Local Groups Discovered</span>
                      <button 
                        onClick={toggleAllGroups}
                        className="text-[10px] font-bold text-indigo-600 hover:underline"
                      >
                        {selectedGroupIds.size === discoveredGroups.length ? 'Deselect All' : 'Target All'}
                      </button>
                    </div>
                    {discoveredGroups.map(group => (
                      <div 
                        key={group.id} 
                        onClick={() => toggleGroup(group.id)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${selectedGroupIds.has(group.id) ? 'bg-white border-indigo-200 shadow-sm' : 'bg-transparent border-transparent opacity-60 hover:opacity-100 hover:bg-white/50'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedGroupIds.has(group.id) ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}>
                            {selectedGroupIds.has(group.id) && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                          </div>
                          <span className="text-xs font-bold text-slate-700 truncate max-w-[300px]">{group.name}</span>
                        </div>
                        <a href={group.url} target="_blank" onClick={(e) => e.stopPropagation()} className="text-[10px] text-slate-400 hover:text-indigo-600 underline font-medium">Open Group</a>
                      </div>
                    ))}
                  </div>
                )}
                
                {discoveredGroups.length === 0 && !isFindingGroups && !searchError && (
                  <div className="py-8 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                    <svg className="w-8 h-8 text-slate-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Discover local community groups to find leads within</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {activeFile ? activeFile.name : activePlatform ? `${activePlatform.charAt(0).toUpperCase() + activePlatform.slice(1)} Explorer` : 'Lead Vault'}
          </h2>
          <div className="flex items-center gap-4 mt-3">
             <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-600">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                {leads.length} Organic Matches
             </div>
             {selectedGroupIds.size > 0 && isFacebook && (
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Scanning {selectedGroupIds.size} Communities</span>
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
             Export Leads
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
            <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-16 text-center shadow-sm">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </div>
              <h4 className="font-bold text-slate-800 mb-1">Start your exploration</h4>
              <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">Configure your city and keywords above. We'll search for real people asking questions in public discussions.</p>
            </div>
          ) : (
             <div className="space-y-4">
               {[1, 2, 3].map(i => (
                 <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 animate-pulse h-32 flex items-center gap-4">
                   <div className="w-12 h-12 rounded-full bg-slate-100"></div>
                   <div className="flex-1 space-y-2">
                     <div className="h-4 bg-slate-100 rounded w-1/4"></div>
                     <div className="h-3 bg-slate-100 rounded w-3/4"></div>
                   </div>
                 </div>
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
               <h4 className="font-bold text-lg">Lead Discovery Engine</h4>
             </div>
             <p className="text-xs text-indigo-100 mb-6 leading-relaxed opacity-80">
               We search for your <strong>keywords</strong> inside <strong>public city groups</strong> and community boards. This finds people actively looking for recommendations or services in their local area.
             </p>
             <div className="space-y-3">
                <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between">
                   <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">Active Location</span>
                   <span className="text-xs font-bold truncate max-w-[120px]">{localLocation || 'Set city'}</span>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between">
                   <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">Scanning Scope</span>
                   <span className="text-xs font-bold">{selectedGroupIds.size > 0 ? `${selectedGroupIds.size} Local Groups` : 'Public Feed'}</span>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
