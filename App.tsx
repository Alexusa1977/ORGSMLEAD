
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { KeywordFile, Lead, LeadStatus, FacebookGroup, PlatformConnection } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import OverviewDashboard from './components/OverviewDashboard';
import CreateFileDialog from './components/CreateFileDialog';
import NextdoorConnector from './components/NextdoorConnector';
import { findLeads } from './services/geminiService';

const App: React.FC = () => {
  const [files, setFiles] = useState<KeywordFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [activePlatform, setActivePlatform] = useState<string | null>(null);
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [connections, setConnections] = useState<PlatformConnection[]>([
    { platform: 'facebook', isConnected: false },
    { platform: 'nextdoor', isConnected: false },
    { platform: 'quora', isConnected: false },
    { platform: 'instagram', isConnected: false },
  ]);
  const [activeView, setActiveView] = useState<'dashboard' | 'outreach' | 'settings' | 'collection' | 'platform'>('dashboard');
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isInitialized = useRef(false);

  // Initialize data
  useEffect(() => {
    const savedFiles = localStorage.getItem('lead_sync_files');
    const savedLeads = localStorage.getItem('lead_sync_leads');
    const savedConnections = localStorage.getItem('lead_sync_connections');
    
    if (savedFiles) {
      try {
        let parsed = JSON.parse(savedFiles);
        setFiles(parsed);
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
        setAllLeads(JSON.parse(savedLeads));
      } catch (e) { console.error(e); }
    }

    if (savedConnections) {
      try {
        setConnections(JSON.parse(savedConnections));
      } catch (e) { console.error(e); }
    }
    
    setTimeout(() => {
      isInitialized.current = true;
    }, 100);
  }, []);

  useEffect(() => {
    if (isInitialized.current) {
      localStorage.setItem('lead_sync_files', JSON.stringify(files));
      localStorage.setItem('lead_sync_leads', JSON.stringify(allLeads));
      localStorage.setItem('lead_sync_connections', JSON.stringify(connections));
    }
  }, [files, allLeads, connections]);

  const activeFile = files.find(f => f.id === activeFileId) || files[0];
  const activeConnection = connections.find(c => c.platform === activePlatform);
  const nextdoorConnection = connections.find(c => c.platform === 'nextdoor');
  
  const getFilteredLeads = () => {
    if (activeView === 'dashboard') return allLeads;
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
    const file: KeywordFile = { ...newFileData, id: `file-${Date.now()}`, createdAt: Date.now() };
    setFiles(prev => [...prev, file]);
    setActiveFileId(file.id);
    setActiveView('collection');
    setDialogMode(null);
  };

  const handleUpdateFile = (updatedData: Omit<KeywordFile, 'id' | 'createdAt'>) => {
    if (!activeFileId) return;
    setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, ...updatedData } : f));
    setDialogMode(null);
  };

  const handleRefreshLeads = useCallback(async (overrides?: Partial<KeywordFile> & { searchGroups?: boolean, targetGroups?: FacebookGroup[] }) => {
    if (!activeFile) return;
    setIsRefreshing(true);
    try {
      const scanFile = { ...activeFile, ...overrides };
      const platformToScan = activeView === 'platform' ? activePlatform : undefined;
      
      // Inject nextdoor context if connected
      if (platformToScan === 'nextdoor' && nextdoorConnection?.isConnected) {
        scanFile.location = `Neighborhood: ${nextdoorConnection.accountName} (${nextdoorConnection.neighborhoodUrl})`;
      }

      const { leads: foundLeads } = await findLeads(scanFile, platformToScan, overrides?.searchGroups, overrides?.targetGroups);
      
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
  }, [activeFile, activeView, activePlatform, activeFileId, nextdoorConnection]);

  const handleNextdoorConnect = (data: { name: string, url: string }) => {
    setConnections(prev => prev.map(c => 
      c.platform === 'nextdoor' 
        ? { ...c, isConnected: true, accountName: data.name, neighborhoodUrl: data.url, lastSyncedAt: Date.now() } 
        : c
    ));
  };

  const handleDisconnect = (platform: string) => {
    setConnections(prev => prev.map(c => 
      c.platform === platform 
        ? { ...c, isConnected: false, accountName: undefined, neighborhoodUrl: undefined } 
        : c
    ));
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar 
        files={files} 
        leads={allLeads}
        connections={connections}
        activeFileId={activeFileId} 
        activePlatform={activePlatform}
        onSelectFile={(id) => { setActiveFileId(id); setActivePlatform(null); setActiveView('collection'); }}
        onSelectPlatform={(p) => { setActivePlatform(p); setActiveFileId(null); setActiveView('platform'); }}
        onCreateClick={() => setDialogMode('create')}
        onDeleteFile={(id) => setFiles(prev => prev.filter(f => f.id !== id))}
        onEditFile={(id) => { setActiveFileId(id); setDialogMode('edit'); }}
        activeView={activeView}
        onNavigate={setActiveView}
      />
      
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <h1 className="text-xl font-bold text-slate-800 capitalize">
            {activeView === 'dashboard' ? 'Overview' : activePlatform || activeFile?.name || 'Leads'}
          </h1>
          <div className="flex items-center gap-4">
            {activePlatform && activeConnection?.isConnected && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-wider border border-emerald-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Linked: {activeConnection.accountName}
                </div>
                <button 
                  onClick={() => handleDisconnect(activePlatform)}
                  className="px-3 py-1 text-[10px] font-bold text-rose-500 hover:text-rose-700 uppercase tracking-wider transition-colors"
                >
                  Disconnect
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          {activeView === 'dashboard' ? (
            <OverviewDashboard leads={allLeads} onPlatformClick={(p) => { setActivePlatform(p); setActiveView('platform'); }} />
          ) : activePlatform === 'nextdoor' && !nextdoorConnection?.isConnected ? (
            <NextdoorConnector onConnect={handleNextdoorConnect} />
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
