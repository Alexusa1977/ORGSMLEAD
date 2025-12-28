
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
  const [isCreatingFile, setIsCreatingFile] = useState(false);
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

  const handleCreateFile = (newFile: Omit<KeywordFile, 'id' | 'createdAt'>) => {
    const file: KeywordFile = {
      ...newFile,
      id: `file-${Date.now()}`,
      createdAt: Date.now()
    };
    setFiles(prev => [...prev, file]);
    setActiveFileId(file.id);
    setIsCreatingFile(false);
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
  }, [activeFileId]); // Deliberately only when ID changes

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
        onCreateClick={() => setIsCreatingFile(true)}
        onDeleteFile={handleDeleteFile}
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

      {isCreatingFile && (
        <CreateFileDialog 
          onClose={() => setIsCreatingFile(false)} 
          onSubmit={handleCreateFile} 
        />
      )}
    </div>
  );
};

export default App;
