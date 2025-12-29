
import React, { useState, useEffect, useCallback } from 'react';
import { KeywordFile, Lead, LeadStatus } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import OverviewDashboard from './components/OverviewDashboard';
import CreateFileDialog from './components/CreateFileDialog';
import { findLeads } from './services/geminiService';

const App: React.FC = () => {
  const [files, setFiles] = useState<KeywordFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [activePlatform, setActivePlatform] = useState<string | null>(null);
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [activeView, setActiveView] = useState<'dashboard' | 'outreach' | 'settings' | 'collection' | 'platform'>('dashboard');
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Initialize data
  useEffect(() => {
    const savedFiles = localStorage.getItem('lead_sync_files');
    const savedLeads = localStorage.getItem('lead_sync_leads');
    
    if (savedFiles) {
      try {
        let parsed = JSON.parse(savedFiles);
        const migrated = parsed.map((f: any) => ({
          ...f,
          keywords: f.keywords || [],
          excludeKeywords: f.excludeKeywords || []
        }));
        setFiles(migrated);
      } catch (e) { console.error(e); }
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
    }

    if (savedLeads) {
      try {
        const parsedLeads = JSON.parse(savedLeads);
        setAllLeads(parsedLeads.map((l: any) => ({ 
          ...l, 
          status: l.status || 'to_be_outreached',
          detectedAt: l.detectedAt || Date.now()
        })));
      } catch (e) { console.error(e); }
    }
  }, []);

  // Save data
  useEffect(() => {
    if (files.length > 0) localStorage.setItem('lead_sync_files', JSON.stringify(files));
  }, [files]);

  useEffect(() => {
    localStorage.setItem('lead_sync_leads', JSON.stringify(allLeads));
  }, [allLeads]);

  const activeFile = files.find(f => f.id === activeFileId);
  
  // Filtering logic
  const getFilteredLeads = () => {
    if (activeView === 'dashboard') return allLeads.sort((a, b) => b.detectedAt - a.detectedAt).slice(0, 10);
    if (activeView === 'platform' && activePlatform) {
      return allLeads.filter(l => l.platform.toLowerCase().includes(activePlatform.toLowerCase()));
    }
    if (activeView === 'collection' && activeFileId) {
      return allLeads.filter(l => l.fileId === activeFileId);
    }
    return allLeads;
  };

  const currentLeads = getFilteredLeads().sort((a, b) => b.detectedAt - a.detectedAt);

  const handleCreateFile = (newFileData: Omit<KeywordFile, 'id' | 'createdAt'>) => {
    const file: KeywordFile = {
      ...newFileData,
      id: `file-${Date.now()}`,
      createdAt: Date.now()
    };
    setFiles(prev => [...prev, file]);
    setActiveFileId(file.id);
    setActiveView('collection');
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
      
      setAllLeads(prev => {
        const existingUrls = new Set(prev.map(l => l.url));
        const uniqueNewLeads = foundLeads.filter(l => !existingUrls.has(l.url)).map(l => ({
          ...l,
          status: 'to_be_outreached' as LeadStatus
        }));
        return [...prev, ...uniqueNewLeads];
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsRefreshing(false);
    }
  }, [activeFile]);

  const handleDeleteFile = (id: string) => {
    const newFiles = files.filter(f => f.id !== id);
    setFiles(newFiles);
    setAllLeads(prev => prev.filter(l => l.fileId !== id));
    if (activeFileId === id) {
      setActiveFileId(null);
      setActiveView('dashboard');
    }
  };

  const handleNavigateToPlatform = (platform: string) => {
    setActivePlatform(platform);
    setActiveFileId(null);
    setActiveView('platform');
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar 
        files={files} 
        leads={allLeads}
        activeFileId={activeFileId} 
        activePlatform={activePlatform}
        onSelectFile={(id) => { setActiveFileId(id); setActivePlatform(null); setActiveView('collection'); }}
        onSelectPlatform={handleNavigateToPlatform}
        onCreateClick={() => setDialogMode('create')}
        onDeleteFile={handleDeleteFile}
        onEditFile={(id) => { setActiveFileId(id); setDialogMode('edit'); }}
        activeView={activeView}
        onNavigate={setActiveView}
      />
      
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-slate-800">
              {activeView === 'dashboard' ? 'Overview' : 
               activeView === 'platform' ? `${activePlatform} Leads` :
               activeView === 'outreach' ? 'All Leads' :
               activeFile?.name}
            </h1>
            {activeView === 'collection' && activeFile && (
              <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-xs font-bold">
                Scanning Keywords
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            {activeView === 'collection' && activeFile && (
              <button 
                onClick={handleRefreshLeads}
                disabled={isRefreshing}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-sm"
              >
                {isRefreshing && (
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {isRefreshing ? 'Scanning...' : 'Scan New Leads'}
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          {activeView === 'dashboard' ? (
            <OverviewDashboard leads={allLeads} />
          ) : (
            <Dashboard 
              activeFile={activeFile || null} 
              activePlatform={activePlatform}
              leads={currentLeads} 
              isLoading={isRefreshing}
              onScanClick={handleRefreshLeads}
            />
          )}
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
