
import React, { useState, useEffect, useCallback } from 'react';
import { KeywordFile, Lead } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import CreateFileDialog from './components/CreateFileDialog';
import { findLeads } from './services/geminiService';

const App: React.FC = () => {
  const [files, setFiles] = useState<KeywordFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Initialize with some dummy data if empty
  useEffect(() => {
    const savedFiles = localStorage.getItem('lead_sync_files');
    if (savedFiles) {
      const parsed = JSON.parse(savedFiles);
      setFiles(parsed);
      if (parsed.length > 0) setActiveFileId(parsed[0].id);
    } else {
      const defaultFile: KeywordFile = {
        id: 'default-1',
        name: 'SaaS Leads',
        keywords: ['CRM for startups', 'marketing automation'],
        excludeKeywords: ['jobs', 'internship'],
        niche: 'B2B Software',
        location: 'California, USA',
        createdAt: Date.now()
      };
      setFiles([defaultFile]);
      setActiveFileId(defaultFile.id);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('lead_sync_files', JSON.stringify(files));
  }, [files]);

  const activeFile = files.find(f => f.id === activeFileId);

  const handleCreateFile = (newFileData: Omit<KeywordFile, 'id' | 'createdAt'>) => {
    const file: KeywordFile = {
      ...newFileData,
      id: `file-${Date.now()}`,
      createdAt: Date.now()
    };
    setFiles(prev => [...prev, file]);
    setActiveFileId(file.id);
    setDialogMode(null);
  };

  const handleUpdateFile = (updatedData: Omit<KeywordFile, 'id' | 'createdAt'>) => {
    if (!activeFileId) return;
    setFiles(prev => prev.map(f => 
      f.id === activeFileId ? { ...f, ...updatedData } : f
    ));
    setDialogMode(null);
  };

  const handleRefreshLeads = useCallback(async () => {
    if (!activeFile) return;
    setIsRefreshing(true);
    try {
      const { leads: foundLeads } = await findLeads(activeFile);
      setLeads(foundLeads);
    } catch (error) {
      console.error(error);
    } finally {
      setIsRefreshing(false);
    }
  }, [activeFile]);

  useEffect(() => {
    if (activeFileId) {
      handleRefreshLeads();
    }
  }, [activeFileId]);

  const handleDeleteFile = (id: string) => {
    const newFiles = files.filter(f => f.id !== id);
    setFiles(newFiles);
    if (activeFileId === id) {
      setActiveFileId(newFiles.length > 0 ? newFiles[0].id : null);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar 
        files={files} 
        activeFileId={activeFileId} 
        onSelectFile={setActiveFileId} 
        onCreateClick={() => setDialogMode('create')}
        onDeleteFile={handleDeleteFile}
        onEditFile={(id) => {
            setActiveFileId(id);
            setDialogMode('edit');
        }}
      />
      
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-indigo-600">LeadSync AI</h1>
            {activeFile && (
              <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-medium">
                {activeFile.name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            {activeFile && (
                <button 
                  onClick={() => setDialogMode('edit')}
                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors"
                  title="Edit Collection Settings"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                </button>
            )}
            <button 
              onClick={handleRefreshLeads}
              disabled={isRefreshing || !activeFile}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {isRefreshing ? (
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : null}
              {isRefreshing ? 'Searching...' : 'Scan for Leads'}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <Dashboard 
            activeFile={activeFile || null} 
            leads={leads} 
            isLoading={isRefreshing}
          />
        </div>
      </main>

      {dialogMode && (
        <CreateFileDialog 
          onClose={() => setDialogMode(null)} 
          onSubmit={dialogMode === 'create' ? handleCreateFile : handleUpdateFile} 
          initialData={dialogMode === 'edit' ? activeFile : undefined}
        />
      )}
    </div>
  );
};

export default App;
