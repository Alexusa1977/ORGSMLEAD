
import React from 'react';
import { KeywordFile, Lead } from '../types';

interface SidebarProps {
  files: KeywordFile[];
  leads: Lead[];
  activeFileId: string | null;
  activePlatform: string | null;
  onSelectFile: (id: string | null) => void;
  onSelectPlatform: (platform: string) => void;
  onCreateClick: () => void;
  onDeleteFile: (id: string) => void;
  onEditFile: (id: string) => void;
  activeView: 'dashboard' | 'outreach' | 'settings' | 'collection' | 'platform';
  onNavigate: (view: 'dashboard' | 'outreach' | 'settings' | 'collection' | 'platform') => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  files, 
  leads,
  activeFileId, 
  activePlatform,
  onSelectFile, 
  onSelectPlatform,
  onCreateClick, 
  onDeleteFile, 
  onEditFile,
  activeView,
  onNavigate 
}) => {
  const platforms = [
    { name: 'Facebook', id: 'facebook', icon: 'f' },
    { name: 'Instagram', id: 'instagram', icon: 'ig' },
    { name: 'Quora', id: 'quora', icon: 'q' },
    { name: 'X / Twitter', id: 'x', icon: 'x' },
    { name: 'Reddit', id: 'reddit', icon: 'r' },
  ];

  const getPlatformCount = (platformId: string) => {
    return leads.filter(l => {
      const plat = l.platform.toLowerCase();
      const target = platformId.toLowerCase();
      if (target === 'x') return plat === 'x' || plat === 'twitter';
      return plat.includes(target);
    }).length;
  };

  const getCollectionCount = (fileId: string) => {
    return leads.filter(l => l.fileId === fileId).length;
  };

  return (
    <aside className="w-72 bg-white border-r border-slate-200 flex flex-col h-full shadow-sm z-10">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-100">L</div>
          <span className="font-bold text-slate-800 tracking-tight text-xl">LeadSync</span>
        </div>

        {/* Main Nav */}
        <nav className="space-y-1 mb-8">
          <button 
            onClick={() => onNavigate('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeView === 'dashboard' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
            Overview
          </button>
        </nav>

        {/* Platform Folders */}
        <div className="mb-8">
          <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Platform Folders</p>
          <div className="space-y-1">
            {platforms.map(p => {
              const count = getPlatformCount(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => onSelectPlatform(p.id)}
                  className={`w-full text-left px-4 py-2 rounded-xl text-sm transition-all flex items-center justify-between ${
                    activeView === 'platform' && activePlatform === p.id
                      ? 'bg-slate-100 text-slate-900 font-bold' 
                      : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded bg-slate-100 flex items-center justify-center text-[10px] font-bold uppercase">{p.icon}</span>
                    {p.name}
                  </div>
                  {count > 0 && (
                    <span className="text-[10px] font-bold bg-slate-200/50 text-slate-600 px-1.5 py-0.5 rounded-full">
                      {count > 999 ? '1k+' : count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Collections */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-4">
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Keyword Scans</p>
             <button onClick={onCreateClick} className="text-indigo-600 hover:text-indigo-800 transition-colors p-1">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
             </button>
          </div>
          
          <div className="space-y-1">
            {files.map(file => {
              const count = getCollectionCount(file.id);
              return (
                <div key={file.id} className="group relative">
                  <button
                    onClick={() => onSelectFile(file.id)}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all flex items-center justify-between ${
                      activeFileId === file.id && activeView === 'collection'
                        ? 'bg-indigo-50/50 text-indigo-700 font-bold' 
                        : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <span className="truncate pr-8">{file.name}</span>
                    {count > 0 && (
                      <span className="text-[10px] font-bold bg-indigo-100/50 text-indigo-600 px-1.5 py-0.5 rounded-full flex-shrink-0">
                        {count}
                      </span>
                    )}
                  </button>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 flex gap-1 transition-all bg-white/80 rounded-lg p-0.5">
                    <button onClick={(e) => { e.stopPropagation(); onEditFile(file.id); }} className="p-1 text-slate-400 hover:text-indigo-600">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onDeleteFile(file.id); }} className="p-1 text-slate-400 hover:text-red-600">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-auto p-6 border-t border-slate-100">
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="w-10 h-10 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold shadow-sm">JS</div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-700 truncate">Danish Soomro</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Pro Plan active</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
