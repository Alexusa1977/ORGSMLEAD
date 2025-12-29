
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { KeywordFile, Lead, LeadStatus, FacebookGroup } from './types';
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
  const isInitialized = useRef(false);

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
    
    setTimeout(() => {
      isInitialized.current = true;
    }, 100);
  }, []);

  useEffect(() => {
    if (isInitialized.current && files.length > 0) {
      localStorage.setItem('lead_sync_files', JSON.stringify(files));
    }
  }, [files]);

  useEffect(() => {
    if (isInitialized.current) {
      localStorage.setItem('lead_sync_leads', JSON.stringify(allLeads));
    }
  }, [allLeads]);

  const activeFile = files.find(f => f.id === activeFileId) || files[0];
  
  const getFilteredLeads = () => {
    if (activeView === 'dashboard') return allLeads;
    if (activeView === 'platform' && activePlatform) {
      return allLeads.filter(l => {
        const plat = l.platform.toLowerCase();
        const target = activePlatform.toLowerCase();
        if (target === 'web') return plat === 'web';
        return plat.includes(target);
      });
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

  const handleRefreshLeads = useCallback(async (overrides?: Partial<KeywordFile> & { searchGroups?: boolean, targetGroups?: FacebookGroup[] }) => {
    if (!activeFile) return;
    setIsRefreshing(true);
    try {
      const scanFile = { ...activeFile, ...overrides };
      const platformToScan = activeView === 'platform' ? activePlatform : undefined;
      const searchGroups = overrides?.searchGroups || false;
      const targetGroups = overrides?.targetGroups || [];
      
      const { leads: foundLeads } = await findLeads(scanFile, platformToScan, searchGroups, targetGroups);
      
      setAllLeads(prev => {
        const existingUrls = new Set(prev.map(l => l.url));
        const uniqueNewLeads = foundLeads.filter(l => !existingUrls.has(l.url)).map(l => ({
          ...l,
          fileId: activeFileId || activeFile.id,
          status: 'to_be_outreached' as LeadStatus
        }));
        return [...prev, ...uniqueNewLeads];
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsRefreshing(false);
    }
  }, [activeFile, activeView, activePlatform, activeFileId]);

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
          <div className="flex items-center gap-4 text-slate-400">
            <h1 className="text-xl font-bold text-slate-800">
              {activeView === 'dashboard' ? 'Overview' : 
               activeView === 'platform' && activePlatform ? `${activePlatform === 'web' ? 'General Web' : activePlatform.charAt(0).toUpperCase() + activePlatform.slice(1)} Leads` :
               activeView === 'outreach' ? 'All Leads' :
               files.find(f => f.id === activeFileId)?.name || 'Lead Vault'}
            </h1>
            {activeView === 'platform' && activePlatform && (
              <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                Platform Scan
              </span>
            )}
            {activeView === 'collection' && activeFileId && (
              <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                Collection Scan
              </span>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          {activeView === 'dashboard' ? (
            <OverviewDashboard leads={allLeads} onPlatformClick={handleNavigateToPlatform} />
          ) : (
            <Dashboard 
              activeFile={files.find(f => f.id === activeFileId) || null} 
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
          initialData={dialogMode === 'edit' ? files.find(f => f.id === activeFileId) : undefined}
        />
      )}
    </div>
  );
};

export default App;
