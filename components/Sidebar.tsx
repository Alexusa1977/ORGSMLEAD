
import React from 'react';
import { KeywordFile } from '../types';

interface SidebarProps {
  files: KeywordFile[];
  activeFileId: string | null;
  onSelectFile: (id: string | null) => void;
  onCreateClick: () => void;
  onDeleteFile: (id: string) => void;
  onEditFile: (id: string) => void;
  activeView: 'dashboard' | 'outreach' | 'settings' | 'collection';
  onNavigate: (view: 'dashboard' | 'outreach' | 'settings' | 'collection') => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  files, 
  activeFileId, 
  onSelectFile, 
  onCreateClick, 
  onDeleteFile, 
  onEditFile,
  activeView,
  onNavigate 
}) => {
  return (
    <aside className="w-72 bg-white border-r border-slate-200 flex flex-col h-full">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-10">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">L</div>
          <span className="font-bold text-slate-800 tracking-tight text-lg">LeadSync</span>
        </div>

        {/* Main Nav */}
        <nav className="space-y-1 mb-10">
          <button 
            onClick={() => onNavigate('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeView === 'dashboard' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
            Dashboard
          </button>
          <button 
            onClick={() => onNavigate('outreach')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeView === 'outreach' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
            Leads & Outreach
          </button>
          <button 
            onClick={() => onNavigate('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeView === 'settings' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            Settings
          </button>
        </nav>

        {/* Collections */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-3">
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Keyword Collections</p>
             <button onClick={onCreateClick} className="text-indigo-600 hover:text-indigo-800 transition-colors">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
             </button>
          </div>
          
          <div className="space-y-1">
            {files.map(file => (
              <div key={file.id} className="group relative">
                <button
                  onClick={() => {
                    onSelectFile(file.id);
                    onNavigate('collection');
                  }}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-xs transition-all flex items-center justify-between ${
                    activeFileId === file.id && activeView === 'collection'
                      ? 'bg-slate-100 text-slate-900 font-bold' 
                      : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <span className="truncate pr-4">{file.name}</span>
                </button>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 flex gap-1 transition-all">
                  <button onClick={(e) => { e.stopPropagation(); onEditFile(file.id); }} className="p-1 text-slate-400 hover:text-indigo-600">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); onDeleteFile(file.id); }} className="p-1 text-slate-400 hover:text-red-600">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-auto p-6 border-t border-slate-100">
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
          <div className="w-10 h-10 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold">JS</div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-700 truncate">Danish Soomro</p>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-tighter">Enterprise Plan</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
