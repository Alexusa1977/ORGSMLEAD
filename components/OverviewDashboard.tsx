
import React from 'react';
import { Lead } from '../types';

interface OverviewDashboardProps {
  leads: Lead[];
}

const OverviewDashboard: React.FC<OverviewDashboardProps> = ({ leads }) => {
  const getCountByPlatform = (platform: string) => leads.filter(l => l.platform.toLowerCase().includes(platform.toLowerCase())).length;
  const getCountByStatus = (status: string) => leads.filter(l => l.status === status).length;

  const platforms = [
    { name: 'Facebook', count: getCountByPlatform('facebook'), icon: 'F', color: 'bg-blue-600' },
    { name: 'LinkedIn', count: getCountByPlatform('linkedin'), icon: 'In', color: 'bg-blue-700' },
    { name: 'Twitter/X', count: getCountByPlatform('x') || getCountByPlatform('twitter'), icon: 'X', color: 'bg-slate-900' },
    { name: 'Reddit', count: getCountByPlatform('reddit'), icon: 'R', color: 'bg-orange-600' },
  ];

  const stats = [
    { label: 'Outreach Todo', value: getCountByStatus('to_be_outreached'), sub: 'Pending' },
    { label: 'Outreached', value: getCountByStatus('outreached'), sub: 'Initial' },
    { label: 'Followed-up', value: getCountByStatus('followed_up'), sub: 'Sequences' },
    { label: 'Replied', value: getCountByStatus('replied'), sub: 'Hot leads' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-12 py-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Leads Section */}
        <section>
          <h3 className="text-lg font-medium text-slate-500 mb-6 flex items-baseline gap-2">
            Leads <span className="text-xs text-slate-400 font-normal">(To be outreached)</span>
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {platforms.map((p) => (
              <div key={p.name} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-baseline gap-2 mb-4">
                   <span className="text-2xl font-bold text-indigo-900">{p.count > 1000 ? (p.count / 1000).toFixed(1) + 'K' : p.count}</span>
                   <span className="text-sm font-semibold text-indigo-800">leads</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full ${p.color} flex items-center justify-center text-white text-xs font-bold`}>
                    {p.icon}
                  </div>
                  <span className="text-sm font-medium text-slate-600">{p.name}</span>
                </div>
              </div>
            ))}
            
            {/* Connect placeholders */}
            <div className="bg-white/50 p-6 rounded-2xl border border-dashed border-slate-200 flex flex-col justify-center items-start group hover:bg-white transition-all cursor-pointer">
              <span className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-widest">Connect</span>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">n</div>
                <span className="text-sm font-medium text-slate-400 group-hover:text-slate-600">Nextdoor</span>
              </div>
            </div>
            <div className="bg-white/50 p-6 rounded-2xl border border-dashed border-slate-200 flex flex-col justify-center items-start group hover:bg-white transition-all cursor-pointer">
              <span className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-widest">Connect</span>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">w</div>
                <span className="text-sm font-medium text-slate-400 group-hover:text-slate-600">Whatsapp</span>
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
              <div key={s.label} className="bg-white/40 p-6 rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center">
                <span className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider">{s.label}</span>
                <span className="text-3xl font-bold text-indigo-900 mb-1">{s.value > 1000 ? (s.value / 1000).toFixed(1) + 'K' : s.value}</span>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">{s.sub}</span>
              </div>
            ))}
          </div>
        </section>

      </div>

      {/* Quick Action Banner */}
      <div className="bg-indigo-600 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-lg">
            <h4 className="text-2xl font-bold mb-2">Grow your business organically.</h4>
            <p className="text-indigo-100 text-sm opacity-90">LeadSync uses AI to monitor communities where your customers hang out. Stop paying for ads and start participating in conversations.</p>
          </div>
          <button className="bg-white text-indigo-600 px-8 py-3 rounded-xl font-bold hover:bg-indigo-50 transition-colors shadow-lg shadow-black/10">
            Export Lead Report
          </button>
        </div>
        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-indigo-400/20 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
};

export default OverviewDashboard;
