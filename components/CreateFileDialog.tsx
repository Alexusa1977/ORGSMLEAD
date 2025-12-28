
import React, { useState } from 'react';
import { KeywordFile } from '../types';

interface CreateFileDialogProps {
  onClose: () => void;
  onSubmit: (file: Omit<KeywordFile, 'id' | 'createdAt'>) => void;
}

const CreateFileDialog: React.FC<CreateFileDialogProps> = ({ onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [niche, setNiche] = useState('');
  const [location, setLocation] = useState('');
  const [keywordsInput, setKeywordsInput] = useState('');
  const [excludeKeywordsInput, setExcludeKeywordsInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const keywords = keywordsInput.split(',').map(k => k.trim()).filter(k => k.length > 0);
    const excludeKeywords = excludeKeywordsInput.split(',').map(k => k.trim()).filter(k => k.length > 0);
    
    if (!name || !niche || keywords.length === 0) return;
    
    onSubmit({
      name,
      niche,
      location: location || 'Global',
      keywords,
      excludeKeywords
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
        <div className="p-8 border-b border-slate-100 bg-slate-50">
          <h2 className="text-2xl font-bold text-slate-800">New Lead Collection</h2>
          <p className="text-slate-500 text-sm mt-1">Configure your monitor to find specific organic leads.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Collection Name</label>
              <input 
                type="text" 
                placeholder="e.g., SEO Agency Clients"
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-medium"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Niche / Industry</label>
                <input 
                  type="text" 
                  placeholder="e.g., Real Estate"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-medium"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Target Location</label>
                <input 
                  type="text" 
                  placeholder="e.g., Miami, FL"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-medium"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Include Keywords (Required)</label>
              <textarea 
                placeholder="looking for recommendations, need a developer, hiring help..."
                required
                rows={2}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-medium resize-none"
                value={keywordsInput}
                onChange={(e) => setKeywordsInput(e.target.value)}
              ></textarea>
            </div>

            <div>
              <label className="block text-xs font-bold text-rose-400 uppercase tracking-widest mb-1">Exclude Keywords (Optional)</label>
              <textarea 
                placeholder="job, hiring, internship, recruitment, courses..."
                rows={2}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all text-sm font-medium resize-none"
                value={excludeKeywordsInput}
                onChange={(e) => setExcludeKeywordsInput(e.target.value)}
              ></textarea>
              <p className="text-[10px] text-slate-400 mt-2 font-medium">Keywords to filter out results that aren't real customers.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
            >
              Create Collection
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateFileDialog;
