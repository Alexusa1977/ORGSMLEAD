
import React from 'react';
import { KeywordFile } from '../types';

interface SidebarProps {
  files: KeywordFile[];
  activeFileId: string | null;
  onSelectFile: (id: string) => void;
  onCreateClick: () => void;
  onDeleteFile: (id: string) => void;
  onEditFile: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ files, activeFileId, onSelectFile, onCreateClick, onDeleteFile, onEditFile }) => {
  return (
    <aside className="w-72 bg-white border-r border-slate-200 flex flex-col">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">L</div>
          <span className="font-bold text-slate-800 tracking-tight text-lg">LeadSync</span>
        </div>

        <button 
          onClick={onCreateClick}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-all mb-8 border border-slate-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          New Lead Collection
        </button>

        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">My Collections</p>
          {files.map(file => (
            <div 
              key={file.id} 
              className="group relative"
            >
              <button
                onClick={() => onSelectFile(file.id)}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all flex items-center justify-between ${
                  activeFileId === file.id 
                    ? 'bg-indigo-50 text-indigo-700 font-semibold border-l-4 border-indigo-600' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <svg className={`w-4 h-4 flex-shrink-0 ${activeFileId === file.id ? 'text-indigo-600' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg>
                  <span className="truncate pr-8">{file.name}</span>
                </div>
              </button>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 flex gap-1 transition-all">
                <button 
                  onClick={(e) => { e.stopPropagation(); onEditFile(file.id); }}
                  className="p-1.5 hover:bg-indigo-50 hover:text-indigo-600 rounded-md text-slate-400 transition-colors"
                  title="Edit"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onDeleteFile(file.id); }}
                  className="p-1.5 hover:bg-red-50 hover:text-red-600 rounded-md text-slate-400 transition-colors"
                  title="Delete"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
              </div>
            </div>
          ))}
          {files.length === 0 && (
            <p className="text-xs text-slate-400 px-3 italic">No collections yet.</p>
          )}
        </div>
      </div>

      <div className="mt-auto p-6 border-t border-slate-100">
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
          <div className="w-10 h-10 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold">JS</div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-700 truncate">Demo User</p>
            <p className="text-[10px] text-slate-500 font-medium">Pro Plan</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
