
import React from 'react';
import { Lead } from '../types';
import LeadCard from './LeadCard';

interface OverviewDashboardProps {
  leads: Lead[];
  onPlatformClick: (platform: string) => void;
}

const OverviewDashboard: React.FC<OverviewDashboardProps> = ({ leads, onPlatformClick }) => {
  const getCountByPlatform = (platformId: string) => {
    return leads.filter(l => l.platform.toLowerCase().includes(platformId.toLowerCase())).length;
  };

  const getCountByStatus = (status: string) => leads.filter(l => l.status === status).length;

  const platforms = [
    { name: 'Facebook', id: 'facebook', count: getCountByPlatform('facebook'), icon: 'F', color: 'bg-blue-600' },
    { name: 'Quora', id: 'quora', count: getCountByPlatform('quora'), icon: 'Q', color: 'bg-red-700' },
    { name: 'Instagram', id: 'instagram', count: getCountByPlatform('instagram'), icon: 'Ig', color: 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600' },
    { name: 'General Web', id: 'web', count: getCountByPlatform('web'), icon: 'W', color: 'bg-slate-700' },
  ];

  const stats = [
    { label: 'Outreach Todo', value: getCountByStatus('to_be_outreached'), sub: 'Pending' },
    { label: 'Outreached', value: getCountByStatus('outreached'), sub: 'Initial' },
    { label: 'Followed-up', value: getCountByStatus('followed_up'), sub: 'Sequences' },
    { label: 'Replied', value: getCountByStatus('replied'), sub: 'Hot leads' },
  ];

  const recentLeads = [...leads].sort((a, b) => b.detectedAt - a.detectedAt).slice(0, 6);

  return (
    <div className="max-w-6xl mx-auto space-y-12 py-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Leads Section */}
        <section>
          <h3 className="text-lg font-medium text-slate-500 mb-6 flex items-baseline gap-2">
            Leads <span className="text-xs text-slate-400 font-normal">(To be outreached)</span>
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {platforms.map((p) => (
              <button 
                key={p.id} 
                onClick={() => onPlatformClick(p.id)}
                className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all text-left group"
              >
                <div className="flex items-baseline gap-2 mb-4">
                   <span className="text-2xl font-bold text-indigo-900 group-hover:text-indigo-600 transition-colors">
                     {p.count > 1000 ? (p.count / 1000).toFixed(1) + 'K' : p.count}
                   </span>
                   <span className="text-sm font-semibold text-indigo-800 opacity-60">leads</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full ${p.color} flex items-center justify-center text-white text-[10px] font-bold shadow-sm`}>
                    {p.icon}
                  </div>
                  <span className="text-xs font-bold text-slate-600 truncate">{p.name}</span>
                </div>
              </button>
            ))}
            
            {/* Connect placeholders */}
            <div className="bg-white/50 p-5 rounded-2xl border border-dashed border-slate-200 flex flex-col justify-center items-start group hover:bg-white transition-all cursor-not-allowed opacity-60">
              <span className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">Connect</span>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-[10px] font-bold uppercase shadow-sm">n</div>
                <span className="text-xs font-medium text-slate-400">Nextdoor</span>
              </div>
            </div>
          </div>
        </section>

        {/* Outreach Statistics */}
        <section>
          <h3 className="text-lg font-medium text-slate-500 mb-6 flex items-baseline gap-2">
            Outreach statistics <span className="text-xs text-slate-400 font-normal">(Last 7 days)</span>
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {stats.map((s) => (
              <div key={s.label} className="bg-white p-6 rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center shadow-sm">
                <span className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider">{s.label}</span>
                <span className="text-3xl font-bold text-indigo-900 mb-1">{s.value > 1000 ? (s.value / 1000).toFixed(1) + 'K' : s.value}</span>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">{s.sub}</span>
              </div>
            ))}
          </div>
        </section>

      </div>

      {/* Recent Activity Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
           <h3 className="text-lg font-bold text-slate-800">Latest Discoveries</h3>
           <p className="text-xs font-medium text-slate-400">Showing top {recentLeads.length} matches across all folders</p>
        </div>
        {recentLeads.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentLeads.map(lead => (
              <LeadCard key={lead.id} lead={lead} />
            ))}
          </div>
        ) : (
          <div className="bg-white border border-dashed border-slate-200 rounded-3xl p-12 text-center text-slate-400 italic">
            No leads captured yet. Start a scan from one of your keyword collections.
          </div>
        )}
      </section>

      {/* Quick Action Banner */}
      <div className="bg-indigo-600 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl shadow-indigo-200">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-xl">
            <h4 className="text-2xl font-bold mb-2">Build your organic sales engine.</h4>
            <p className="text-indigo-100 text-sm opacity-90">LeadSync works in the background (when scanning) to find the conversations that matter. All discovered leads are saved in your Platform Folders and Keyword Collections automatically.</p>
          </div>
          <button className="bg-white text-indigo-600 px-8 py-3 rounded-2xl font-bold hover:bg-indigo-50 transition-all shadow-lg shadow-black/10 flex-shrink-0">
            Export Leads (.csv)
          </button>
        </div>
        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-indigo-400/20 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
};

export default OverviewDashboard;
