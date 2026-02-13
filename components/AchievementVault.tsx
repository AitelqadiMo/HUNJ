
import React, { useState } from 'react';
import { AchievementEntity } from '../types';
import { Tag, Sparkles, Edit2, Search, Filter, Trash2, EyeOff, Eye } from 'lucide-react';

interface AchievementVaultProps {
  achievements: AchievementEntity[];
  onUpdate: (achievements: AchievementEntity[]) => void;
}

const AchievementVault: React.FC<AchievementVaultProps> = ({ achievements, onUpdate }) => {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  const filtered = achievements.filter(a => {
      const matchesFilter = filter === 'All' || a.category === filter;
      const matchesSearch = a.originalText.toLowerCase().includes(search.toLowerCase()) || a.tags.some(t => t.label.toLowerCase().includes(search.toLowerCase()));
      return matchesFilter && matchesSearch;
  });

  const handleDelete = (id: string) => {
      onUpdate(achievements.filter(a => a.id !== id));
  };

  const handleToggleVisibility = (id: string) => {
      onUpdate(achievements.map(a => a.id === id ? { ...a, hidden: !a.hidden } : a));
  };

  return (
    <div className="h-full flex flex-col p-6 md:p-8 bg-slate-50">
        
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-8">
            <div>
                <h2 className="text-3xl font-display font-bold text-slate-900 mb-2">Achievement Vault</h2>
                <p className="text-slate-500">Atomic career units used to build tailored resumes.</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Search achievements..." 
                        className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm w-full md:w-64 focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex bg-slate-200 p-1 rounded-xl">
                    {['All', 'Technical', 'Leadership', 'Operational'].map(cat => (
                        <button
                            key={cat}
                            onClick={() => setFilter(cat)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${filter === cat ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl">
                    <Sparkles className="w-8 h-8 mb-2 opacity-50" />
                    <p>No achievements found. Connect a data source to populate.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
                    {filtered.map(ach => (
                        <div key={ach.id} className={`group bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all relative ${ach.hidden ? 'opacity-50 grayscale' : ''}`}>
                            <div className="flex justify-between items-start mb-3">
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border ${
                                    ach.category === 'Technical' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                    ach.category === 'Leadership' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                    'bg-slate-100 text-slate-600 border-slate-200'
                                }`}>
                                    {ach.category}
                                </span>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleToggleVisibility(ach.id)} className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-900">
                                        {ach.hidden ? <EyeOff className="w-3.5 h-3.5"/> : <Eye className="w-3.5 h-3.5"/>}
                                    </button>
                                    <button onClick={() => handleDelete(ach.id)} className="p-1.5 hover:bg-red-50 rounded text-slate-400 hover:text-red-500">
                                        <Trash2 className="w-3.5 h-3.5"/>
                                    </button>
                                </div>
                            </div>

                            <p className="text-sm text-slate-800 font-medium leading-relaxed mb-4">
                                {ach.enhancedText || ach.originalText}
                            </p>

                            {ach.metrics.length > 0 && (
                                <div className="flex gap-2 mb-4">
                                    {ach.metrics.map((m, i) => (
                                        <span key={i} className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                            {m}
                                        </span>
                                    ))}
                                </div>
                            )}

                            <div className="flex flex-wrap gap-1.5 pt-3 border-t border-slate-100">
                                {ach.tags.map((tag, i) => (
                                    <span key={i} className="text-[10px] text-slate-500 bg-slate-50 px-2 py-1 rounded flex items-center gap-1">
                                        <Tag className="w-2.5 h-2.5" /> {tag.label}
                                    </span>
                                ))}
                            </div>
                            
                            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-white via-white to-transparent pointer-events-none rounded-tr-2xl"></div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
  );
};

export default AchievementVault;
