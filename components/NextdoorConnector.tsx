
import React, { useState } from 'react';

interface NextdoorConnectorProps {
  onConnect: (data: { name: string, url: string }) => void;
}

const NextdoorConnector: React.FC<NextdoorConnectorProps> = ({ onConnect }) => {
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !name) return;
    setIsConnecting(true);
    // Simulate connection delay
    setTimeout(() => {
      onConnect({ name, url });
      setIsConnecting(false);
    }, 1500);
  };

  return (
    <div className="max-w-2xl mx-auto py-12">
      <div className="bg-white border border-slate-200 rounded-[2.5rem] p-12 shadow-sm text-center">
        <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-sm border border-emerald-100">
          <span className="text-3xl font-black text-emerald-600">n</span>
        </div>
        
        <h2 className="text-3xl font-extrabold text-slate-900 mb-4 tracking-tight">Connect your Nextdoor</h2>
        <p className="text-slate-500 mb-10 max-w-md mx-auto leading-relaxed">
          To find leads in your specific neighborhood, we need to link your local Nextdoor community feed.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6 text-left max-w-sm mx-auto">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Neighborhood Name</label>
            <input 
              type="text" 
              placeholder="e.g. Pine Hills Community"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Neighborhood URL</label>
            <input 
              type="url" 
              placeholder="https://nextdoor.com/neighborhood/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium transition-all"
            />
            <p className="text-[10px] text-slate-400 mt-2 font-medium">Log into Nextdoor and copy the URL of your home feed.</p>
          </div>

          <button 
            type="submit"
            disabled={isConnecting}
            className="w-full h-14 bg-emerald-600 text-white rounded-2xl font-bold text-base hover:bg-emerald-700 flex items-center justify-center gap-3 transition-all shadow-xl shadow-emerald-100 disabled:opacity-50"
          >
            {isConnecting ? (
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : (
              "Link Neighborhood"
            )}
          </button>
        </form>

        <div className="mt-12 pt-8 border-t border-slate-50 flex items-center justify-center gap-8">
          <div className="flex flex-col items-center">
            <span className="text-xl font-bold text-slate-800">100%</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Privacy Safe</span>
          </div>
          <div className="w-px h-8 bg-slate-100"></div>
          <div className="flex flex-col items-center">
            <span className="text-xl font-bold text-slate-800">Local</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Targeting</span>
          </div>
        </div>
      </div>

      <div className="mt-10 p-8 bg-amber-50 rounded-[2rem] border border-amber-100 flex gap-4">
        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0 text-amber-500 shadow-sm border border-amber-50">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </div>
        <div>
          <h4 className="text-sm font-bold text-amber-800 mb-1">Why connect?</h4>
          <p className="text-xs text-amber-700 leading-relaxed">Nextdoor is highly restricted. By providing your neighborhood link, LeadSync AI can calibrate its search engine queries to focus specifically on your area's indexed content, leading to 4x more relevant results.</p>
        </div>
      </div>
    </div>
  );
};

export default NextdoorConnector;
