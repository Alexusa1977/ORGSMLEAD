
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
  
  const [discoveryMode, setDiscoveryMode] = useState<'auto' | 'manual'>('auto');
  const [manualLinks, setManualLinks] = useState('');
  
  const [localKeywords, setLocalKeywords] = useState('');
  const [localLocation, setLocalLocation] = useState('');

  useEffect(() => {
    if (activeFile) {
      setLocalKeywords(activeFile.keywords.join(', '));
      setLocalLocation(activeFile.location);
    }
  }, [activeFile]);

  const handleRunScan = () => {
    const keywords = localKeywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
    const targetGroups = discoveredGroups.filter(g => selectedGroupIds.has(g.id));
    
    onScanClick({
      keywords,
      location: localLocation,
      searchGroups: activePlatform === 'facebook',
      targetGroups: targetGroups.length > 0 ? targetGroups : undefined
    });
  };

  const handleFindGroups = async () => {
    if (!localLocation) return;
    setSearchError(null);
    setIsFindingGroups(true);
    try {
      const groups = await findFacebookGroups(localLocation);
      if (groups.length === 0) {
        setSearchError("No public groups indexed for this location. This usually means local groups are set to 'Private'. Try a larger nearby city or enter group links manually.");
      } else {
        setDiscoveredGroups(groups);
        setSelectedGroupIds(new Set(groups.map(g => g.id)));
      }
    } catch (e) {
      setSearchError("Search failed. Please check your API connection.");
    } finally {
      setIsFindingGroups(false);
    }
  };

  const handleAddManualGroups = () => {
    const urls = manualLinks.split('\n').map(u => u.trim()).filter(u => u.includes('facebook.com/groups/') || u.includes('nextdoor.com/news_feed/'));
    const newGroups = urls.map((url, i) => ({
      id: `man-${Date.now()}-${i}`,
      name: "Custom Target",
      url,
      niche: "Manual"
    }));
    setDiscoveredGroups([...discoveredGroups, ...newGroups]);
    setSelectedGroupIds(new Set([...Array.from(selectedGroupIds), ...newGroups.map(g => g.id)]));
    setManualLinks('');
    setDiscoveryMode('auto');
  };

  const isFacebook = activePlatform === 'facebook';
  const isNextdoor = activePlatform === 'nextdoor';

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold">1</span>
                Targeting Parameters
              </h2>
            </div>
            
            <div className="space-y-6">
              {/* Location Input - Now visible for Nextdoor too */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                    {isNextdoor ? 'Target Neighborhood / City / State' : 'City / Region'}
                  </label>
                  <input 
                    type="text" 
                    value={localLocation}
                    onChange={(e) => setLocalLocation(e.target.value)}
                    placeholder={isNextdoor ? "e.g. Austin, TX" : "e.g. Orlando, FL"}
                    className="w-full px-5 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium"
                  />
                </div>
                
                {isFacebook && (
                  <div className="flex items-end">
                    <button 
                      onClick={handleFindGroups}
                      disabled={isFindingGroups || !localLocation}
                      className="h-[50px] w-full px-8 bg-indigo-600 text-white rounded-2xl text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
                    >
                      {isFindingGroups ? "Searching Groups..." : "Auto-Find Public Groups"}
                    </button>
                  </div>
                )}
              </div>

              {/* Manual Links Section */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                  {isNextdoor ? 'Manual Nextdoor URLs (Optional)' : 'Manual Group URLs (Optional)'}
                </label>
                <textarea 
                  value={manualLinks}
                  onChange={(e) => setManualLinks(e.target.value)}
                  placeholder={isNextdoor ? "Paste specific Nextdoor post URLs here..." : "Paste Facebook Group URLs here..."}
                  rows={2}
                  className="w-full px-5 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium font-mono"
                />
                <button onClick={handleAddManualGroups} className="mt-2 text-xs font-bold text-indigo-600 hover:text-indigo-700">Add to Scan Targets</button>
              </div>

              {/* Keyword Section */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[10px] font-bold">2</span>
                  Keywords to Monitor
                </h3>
                <textarea 
                  value={localKeywords}
                  onChange={(e) => setLocalKeywords(e.target.value)}
                  placeholder="Enter keywords (e.g. plumber, need help, recommendations)..."
                  rows={2}
                  className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium"
                />
              </div>

              {/* Facebook Group Selection (Only if groups were found) */}
              {isFacebook && discoveredGroups.length > 0 && (
                <div className="pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                     <h3 className="text-lg font-bold text-slate-800">Target Specific Groups</h3>
                     <span className="text-[10px] font-bold text-slate-400 uppercase">{selectedGroupIds.size} Selected</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                    {discoveredGroups.map(g => (
                      <div key={g.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                         <input 
                           type="checkbox" 
                           checked={selectedGroupIds.has(g.id)} 
                           onChange={() => {
                             const next = new Set(selectedGroupIds);
                             if (next.has(g.id)) next.delete(g.id);
                             else next.add(g.id);
                             setSelectedGroupIds(next);
                           }}
                           className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                         />
                         <span className="text-xs font-bold text-slate-700 truncate">{g.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Button */}
              <button 
                onClick={handleRunScan}
                disabled={isLoading || !localKeywords}
                className={`w-full h-14 ${isNextdoor ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-50' : 'bg-slate-900 hover:bg-black shadow-slate-100'} text-white rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all shadow-lg`}
              >
                {isLoading ? "Deep Scanning Platform..." : "Launch Scraper"}
              </button>
            </div>

            {searchError && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-100 rounded-2xl text-amber-700 text-xs font-medium flex items-center gap-3">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                {searchError}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-8 sticky top-8">
            <h4 className="font-bold text-slate-800 mb-6">Platform Insights</h4>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className={`w-8 h-8 rounded-lg ${isNextdoor ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'} flex items-center justify-center flex-shrink-0`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700 mb-1">{isNextdoor ? 'Hyper-Local Search' : 'Public vs Private'}</p>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    {isNextdoor 
                      ? "Nextdoor scans use your location and keywords to find community recommendations. Adding a city/state helps focus the search results." 
                      : "We scan the indexed web. Public content is visible; private content requires manual link targeting for best results."}
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04c-.243.394-.382.859-.382 1.355 0 4.14 2.803 7.625 6.618 8.618A11.95 11.95 0 0012 21.056a11.95 11.95 0 008.618-3.04c.394-.243.859-.382 1.355-.382 4.14 0 7.625-2.803 8.618-6.618A11.95 11.95 0 0012 2.944z"></path></svg>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700 mb-1">AI Lead Scoring</p>
                  <p className="text-[10px] text-slate-500 leading-relaxed">Every match is analyzed for 'Intent to Buy'. We hide general chat and focus on help requests.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 pt-12">
        <div className="flex items-center justify-between mb-8">
           <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Lead Stream</h2>
           <div className={`flex items-center gap-2 px-3 py-1 ${isNextdoor ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'} rounded-full text-xs font-bold`}>
             <span className={`w-2 h-2 rounded-full ${isNextdoor ? 'bg-emerald-400' : 'bg-indigo-400'} animate-pulse`}></span>
             {leads.length} Identified Opportunities
           </div>
        </div>
        
        {leads.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {leads.map(lead => <LeadCard key={lead.id} lead={lead} />)}
          </div>
        ) : (
          <div className="bg-white border border-dashed border-slate-200 rounded-[3rem] p-32 text-center">
             <p className="text-slate-400 font-medium italic mb-2">The stream is currently empty.</p>
             <p className="text-[10px] text-slate-300 max-w-xs mx-auto">Try adding more specific keywords or broaden your target location.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
