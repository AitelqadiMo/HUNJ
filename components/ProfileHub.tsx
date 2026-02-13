
import React, { useState } from 'react';
import { UserProfile, ResumeData, AchievementEntity, RawDataSource } from '../types';
import ResumeEditor from './ResumeEditor';
import AchievementVault from './AchievementVault';
import DataSourcePanel from './DataSourcePanel';
import { updateMasterProfile, extractAchievements } from '../services/geminiService';
import { 
    LayoutTemplate, FileText, Database, FolderOpen, Settings, 
    ArrowLeft, BrainCircuit, Network, Library, Cpu, Share2 
} from 'lucide-react';

interface ProfileHubProps {
  profile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  onBack: () => void;
}

const ProfileHub: React.FC<ProfileHubProps> = ({ profile, onUpdateProfile, onBack }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'vault' | 'sources' | 'master' | 'graph'>('overview');
  
  // Ensure profile has new fields if upgrading from old version
  const safeProfile = {
      ...profile,
      achievements: profile.achievements || [],
      dataSources: profile.dataSources || []
  };

  const handleUpdateResume = (updatedResume: ResumeData) => {
    onUpdateProfile({ ...safeProfile, masterResume: updatedResume });
  };

  const handleAddSource = async (source: RawDataSource) => {
      // Optimistic update
      const newSources = [...safeProfile.dataSources, source];
      onUpdateProfile({ ...safeProfile, dataSources: newSources });

      if (source.status === 'Processing') {
          try {
              const entities = await extractAchievements(source.content, source);
              const updatedSource = { ...source, status: 'Structured', entityCount: entities.length } as RawDataSource;
              
              // Merge achievements
              const mergedAchievements = [...safeProfile.achievements, ...entities];
              
              onUpdateProfile({
                  ...safeProfile,
                  dataSources: newSources.map(s => s.id === source.id ? updatedSource : s),
                  achievements: mergedAchievements
              });
          } catch (e) {
              console.error("Extraction failed", e);
              onUpdateProfile({
                  ...safeProfile,
                  dataSources: newSources.map(s => s.id === source.id ? { ...source, status: 'Error' } : s)
              });
          }
      }
  };

  const completeness = Math.min(100, (safeProfile.achievements.length * 5) + (safeProfile.masterResume.skills.length * 2));

  return (
    <div className="flex h-[calc(100vh-64px)] bg-slate-50 text-slate-900 font-sans overflow-hidden">
        
        {/* SIDEBAR */}
        <aside className="w-20 md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 z-20 shadow-xl text-slate-300">
            <div className="p-4 md:p-6 border-b border-slate-800 flex items-center gap-3">
                <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="hidden md:block">
                    <h1 className="font-display font-bold text-white tracking-tight">Data Engine</h1>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">Career OS v3.0</p>
                </div>
            </div>

            <nav className="flex-1 p-3 space-y-2">
                {[
                    { id: 'overview', label: 'Engine Status', icon: Cpu },
                    { id: 'vault', label: 'Achievement Vault', icon: Library },
                    { id: 'sources', label: 'Data Sources', icon: Database },
                    { id: 'graph', label: 'Knowledge Graph', icon: Network },
                    { id: 'master', label: 'Master Record', icon: FileText },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                            activeTab === tab.id 
                            ? 'bg-hunj-600 text-white shadow-lg shadow-hunj-900/20' 
                            : 'hover:bg-slate-800 hover:text-white'
                        }`}
                    >
                        <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-white' : 'text-slate-500'}`} />
                        <span className="hidden md:block">{tab.label}</span>
                    </button>
                ))}
            </nav>

            <div className="p-4 border-t border-slate-800 hidden md:block">
                <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dataset Health</span>
                        <span className="text-xs font-bold text-white">{completeness > 100 ? 100 : completeness}%</span>
                    </div>
                    <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <div 
                            className={`h-full transition-all duration-1000 ${completeness > 80 ? 'bg-green-500' : 'bg-hunj-500'}`} 
                            style={{ width: `${Math.min(100, completeness)}%` }}
                        ></div>
                    </div>
                </div>
            </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 overflow-hidden relative bg-slate-50">
            
            {/* OVERVIEW DASHBOARD */}
            {activeTab === 'overview' && (
                <div className="h-full overflow-y-auto p-8">
                    <div className="max-w-5xl mx-auto space-y-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-3xl font-display font-bold text-slate-900">System Overview</h2>
                                <p className="text-slate-500">Managing {safeProfile.achievements.length} structured career entities.</p>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setActiveTab('sources')} className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold text-sm shadow-lg hover:bg-slate-800 transition-colors flex items-center gap-2">
                                    <Database className="w-4 h-4"/> Add Data
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600"><Library className="w-6 h-6"/></div>
                                    <div>
                                        <div className="text-2xl font-bold text-slate-900">{safeProfile.achievements.length}</div>
                                        <div className="text-xs text-slate-500 font-bold uppercase">Atomic Achievements</div>
                                    </div>
                                </div>
                                <div className="h-1 w-full bg-indigo-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500 w-3/4"></div>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600"><Network className="w-6 h-6"/></div>
                                    <div>
                                        <div className="text-2xl font-bold text-slate-900">{safeProfile.masterResume.skills.length}</div>
                                        <div className="text-xs text-slate-500 font-bold uppercase">Verified Skills</div>
                                    </div>
                                </div>
                                <div className="h-1 w-full bg-emerald-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 w-1/2"></div>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-3 bg-purple-50 rounded-xl text-purple-600"><Share2 className="w-6 h-6"/></div>
                                    <div>
                                        <div className="text-2xl font-bold text-slate-900">{safeProfile.dataSources.length}</div>
                                        <div className="text-xs text-slate-500 font-bold uppercase">Connected Sources</div>
                                    </div>
                                </div>
                                <div className="h-1 w-full bg-purple-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-purple-500 w-full"></div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity / Ingestion Log */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><LayoutTemplate className="w-4 h-4 text-slate-400"/> Recent Ingestions</h3>
                            {safeProfile.dataSources.length > 0 ? (
                                <div className="space-y-3">
                                    {safeProfile.dataSources.slice().reverse().slice(0, 5).map(source => (
                                        <div key={source.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2 h-2 rounded-full ${source.status === 'Structured' ? 'bg-green-500' : source.status === 'Processing' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'}`}></div>
                                                <div>
                                                    <div className="text-sm font-bold text-slate-700">{source.name}</div>
                                                    <div className="text-[10px] text-slate-400 uppercase">{source.type}</div>
                                                </div>
                                            </div>
                                            <div className="text-xs font-mono text-slate-500">
                                                {source.entityCount} Entities Extracted
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-slate-400 text-sm">No data sources connected.</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ACHIEVEMENT VAULT */}
            {activeTab === 'vault' && (
                <AchievementVault 
                    achievements={safeProfile.achievements} 
                    onUpdate={(achievements) => onUpdateProfile({ ...safeProfile, achievements })}
                />
            )}

            {/* DATA SOURCES */}
            {activeTab === 'sources' && (
                <DataSourcePanel 
                    sources={safeProfile.dataSources}
                    onAddSource={handleAddSource}
                />
            )}

            {/* KNOWLEDGE GRAPH (Placeholder for visualizer) */}
            {activeTab === 'graph' && (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-900/5">
                    <BrainCircuit className="w-16 h-16 mb-4 opacity-20" />
                    <p className="font-bold text-lg text-slate-600">Knowledge Graph Visualization</p>
                    <p className="text-sm">Mapping {safeProfile.achievements.length} nodes...</p>
                </div>
            )}

            {/* MASTER RESUME EDITOR */}
            {activeTab === 'master' && (
                <div className="h-full p-6 overflow-hidden flex flex-col">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex-1 overflow-hidden">
                        <ResumeEditor resume={safeProfile.masterResume} job={null} onUpdate={handleUpdateResume} />
                    </div>
                </div>
            )}

        </main>
    </div>
  );
};

export default ProfileHub;
