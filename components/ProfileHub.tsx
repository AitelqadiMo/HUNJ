
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { UserProfile, ResumeData, AchievementEntity, RawDataSource } from '../types';
import ResumeEditor from './ResumeEditor';
import AchievementVault from './AchievementVault';
import DataSourcePanel from './DataSourcePanel';
import DocumentLibrary from './DocumentLibrary';
import { updateMasterProfile, extractAchievements } from '../services/geminiService';
import { 
    LayoutTemplate, FileText, Database, 
    ArrowLeft, BrainCircuit, Network, Library, Cpu, Share2, Sparkles, CheckCircle2, Wand2, TrendingUp
} from 'lucide-react';

interface ProfileHubProps {
  profile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  onBack: () => void;
}

const ProfileHub: React.FC<ProfileHubProps> = ({ profile, onUpdateProfile, onBack }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'vault' | 'sources' | 'documents' | 'master' | 'graph'>('overview');
  const [isEnhancingProfile, setIsEnhancingProfile] = useState(false);
  const [enhanceInstruction, setEnhanceInstruction] = useState('Improve my summary and bullets to be more outcomes-focused and ATS-friendly.');
  
  // Ensure profile has new fields if upgrading from old version
  const safeProfile = {
      ...profile,
      achievements: profile.achievements || [],
      dataSources: profile.dataSources || []
  };
  const profileRef = useRef(safeProfile);
  useEffect(() => { profileRef.current = safeProfile; }, [safeProfile]);

  const mergeUniqueAchievements = (existing: AchievementEntity[], incoming: AchievementEntity[]): AchievementEntity[] => {
      const map = new Map<string, AchievementEntity>();
      [...existing, ...incoming].forEach((a) => {
          const key = (a.originalText || '').toLowerCase().trim();
          if (!key) return;
          if (!map.has(key)) {
              map.set(key, a);
              return;
          }
          const old = map.get(key)!;
          map.set(key, {
              ...old,
              enhancedText: old.enhancedText || a.enhancedText,
              metrics: Array.from(new Set([...(old.metrics || []), ...(a.metrics || [])])),
              tags: Array.from(new Set([...(old.tags || []).map(t => t.label), ...(a.tags || []).map(t => t.label)])).map(label => ({ label }))
          });
      });
      return Array.from(map.values());
  };

  const readinessChecks = useMemo(() => {
      const resume = safeProfile.masterResume;
      const bulletsCount = resume.experience.reduce((sum, exp) => sum + (exp.bullets?.filter(b => b.text.trim()).length || 0), 0);
      const hasMetrics = resume.experience.some(exp => exp.bullets?.some(b => /\d+%|\$\d+|\d+[xX]/.test(b.text)));
      const checks = [
          { label: 'Headline profile details', done: Boolean(resume.fullName && resume.role && resume.email), weight: 15 },
          { label: 'Professional summary', done: resume.summary.trim().length >= 80, weight: 15 },
          { label: 'Experience depth', done: resume.experience.length >= 2 && bulletsCount >= 4, weight: 20 },
          { label: 'Skills coverage', done: resume.skills.length >= 8, weight: 15 },
          { label: 'Career targeting', done: safeProfile.preferences.targetRoles.length > 0 && safeProfile.preferences.targetIndustries.length > 0, weight: 15 },
          { label: 'Compensation & availability', done: Boolean(safeProfile.preferences.salaryExpectation && safeProfile.preferences.availability), weight: 10 },
          { label: 'Quantified achievements', done: hasMetrics || safeProfile.achievements.length >= 3, weight: 10 }
      ];
      const totalWeight = checks.reduce((sum, c) => sum + c.weight, 0);
      const score = Math.round((checks.reduce((sum, c) => sum + (c.done ? c.weight : 0), 0) / totalWeight) * 100);
      return { checks, score, missing: checks.filter(c => !c.done).map(c => c.label) };
  }, [safeProfile]);

  const handleUpdateResume = (updatedResume: ResumeData) => {
    onUpdateProfile({ ...safeProfile, masterResume: updatedResume });
  };

  const handleAddSource = async (source: RawDataSource) => {
      // Optimistic update
      const optimisticProfile = profileRef.current;
      const newSources = [...optimisticProfile.dataSources, source];
      onUpdateProfile({ ...optimisticProfile, dataSources: newSources });

      if (source.status === 'Processing') {
          try {
              const entities = await extractAchievements(source.content, source);
              const updatedSource = { ...source, status: 'Structured', entityCount: entities.length } as RawDataSource;
              const latest = profileRef.current;
              const mergedAchievements = mergeUniqueAchievements(latest.achievements, entities);

              onUpdateProfile({
                  ...latest,
                  dataSources: (latest.dataSources || []).map(s => s.id === source.id ? updatedSource : s),
                  achievements: mergedAchievements
              });
          } catch (e) {
              console.error("Extraction failed", e);
              const latest = profileRef.current;
              onUpdateProfile({
                  ...latest,
                  dataSources: (latest.dataSources || []).map(s => s.id === source.id ? { ...source, status: 'Error' } : s)
              });
          }
      }
  };

  const handlePreferenceListUpdate = (field: 'targetRoles' | 'targetIndustries' | 'preferredTechStack' | 'companySize', value: string) => {
      const list = value.split(',').map(v => v.trim()).filter(Boolean);
      onUpdateProfile({ ...safeProfile, preferences: { ...safeProfile.preferences, [field]: list } });
  };

  const handleEnhanceProfile = async (instructionOverride?: string) => {
      setIsEnhancingProfile(true);
      try {
          const improved = await updateMasterProfile(safeProfile.masterResume, instructionOverride || enhanceInstruction);
          onUpdateProfile({ ...profileRef.current, masterResume: improved });
      } finally {
          setIsEnhancingProfile(false);
      }
  };
  const handleRunQuickAction = async (label: string) => {
      const map: Record<string, string> = {
          'Headline profile details': 'Improve headline contact section and role positioning for recruiter readability.',
          'Professional summary': 'Rewrite summary to be executive, measurable, and ATS friendly.',
          'Experience depth': 'Strengthen experience bullets with business impact and ownership clarity.',
          'Skills coverage': 'Expand and normalize skill list based on current role targets.',
          'Career targeting': 'Adjust profile language for target roles and target industries.',
          'Compensation & availability': 'Add concise availability and compensation expectation phrasing.',
          'Quantified achievements': 'Rewrite bullets to include measurable outcomes where possible.'
      };
      const instruction = map[label] || `Improve this area: ${label}`;
      setEnhanceInstruction(instruction);
      await handleEnhanceProfile(instruction);
  };

  const completeness = readinessChecks.score;
  const tabTone: Record<string, string> = {
      overview: 'from-violet-600/35 to-indigo-600/20 border-violet-400',
      vault: 'from-fuchsia-600/30 to-violet-600/20 border-fuchsia-400',
      sources: 'from-emerald-600/30 to-teal-600/20 border-emerald-400',
      documents: 'from-sky-600/30 to-blue-600/20 border-sky-400',
      graph: 'from-cyan-600/30 to-indigo-600/20 border-cyan-400',
      master: 'from-amber-600/30 to-orange-600/20 border-amber-400'
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-[#F9FAFB] text-slate-900 font-sans overflow-hidden">
        
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
                    { id: 'documents', label: 'Documents', icon: FileText },
                    { id: 'graph', label: 'Knowledge Graph', icon: Network },
                    { id: 'master', label: 'Master Record', icon: FileText },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm font-bold transition-all duration-300 border-l-2 ${
                            activeTab === tab.id 
                            ? `bg-gradient-to-r ${tabTone[tab.id]} text-white` 
                            : 'hover:bg-slate-800 hover:text-white border-transparent'
                        }`}
                    >
                        <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.25)]' : 'text-slate-500'}`} />
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
                {safeProfile.billing?.plan === 'free' && (
                    <div className="mt-3 bg-slate-800/60 rounded-2xl p-3 border border-slate-700">
                        <div className="text-[10px] font-bold text-amber-300 uppercase tracking-widest mb-2">Free Plan Limits</div>
                        <div className="text-[11px] text-slate-300 mb-2">AI actions today: {safeProfile.usageStats?.aiActions || 0}/20</div>
                        <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-400" style={{ width: `${Math.min(100, ((safeProfile.usageStats?.aiActions || 0) / 20) * 100)}%` }}></div>
                        </div>
                    </div>
                )}
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
                                <h2 className="text-4xl font-display font-extrabold tracking-tight text-slate-900">System Overview</h2>
                                <p className="text-slate-500">Managing {safeProfile.achievements.length} structured career entities.</p>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setActiveTab('sources')} className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold text-sm shadow-lg hover:bg-slate-800 transition-colors flex items-center gap-2">
                                    <Database className="w-4 h-4"/> Add Data
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-[0_10px_25px_rgba(0,0,0,0.05)] hover:shadow-[0_14px_30px_rgba(0,0,0,0.08)] transition-all">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600"><Library className="w-6 h-6"/></div>
                                    <div>
                                        <div className="text-2xl font-bold text-slate-900">{safeProfile.achievements.length}</div>
                                        <div className="text-xs text-slate-500 font-bold uppercase">Atomic Achievements</div>
                                    </div>
                                </div>
                                <div className="h-1 w-full bg-indigo-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500" style={{ width: `${Math.min(100, safeProfile.achievements.length * 10)}%` }}></div>
                                </div>
                                {safeProfile.achievements.length === 0 && <p className="text-xs text-slate-500 mt-2">Get started by importing data.</p>}
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-[0_10px_25px_rgba(0,0,0,0.05)] hover:shadow-[0_14px_30px_rgba(0,0,0,0.08)] transition-all">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600"><Network className="w-6 h-6"/></div>
                                    <div>
                                        <div className="text-2xl font-bold text-slate-900">{safeProfile.masterResume.skills.length}</div>
                                        <div className="text-xs text-slate-500 font-bold uppercase">Verified Skills</div>
                                    </div>
                                </div>
                                <div className="h-1 w-full bg-emerald-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, safeProfile.masterResume.skills.length * 8)}%` }}></div>
                                </div>
                                {safeProfile.masterResume.skills.length === 0 && <p className="text-xs text-slate-500 mt-2">Add skills to unlock matching.</p>}
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-[0_10px_25px_rgba(0,0,0,0.05)] hover:shadow-[0_14px_30px_rgba(0,0,0,0.08)] transition-all">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-3 bg-purple-50 rounded-xl text-purple-600"><Share2 className="w-6 h-6"/></div>
                                    <div>
                                        <div className="text-2xl font-bold text-slate-900">{safeProfile.dataSources.length}</div>
                                        <div className="text-xs text-slate-500 font-bold uppercase">Connected Sources</div>
                                    </div>
                                </div>
                                <div className="h-1 w-full bg-purple-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-purple-500" style={{ width: `${Math.min(100, safeProfile.dataSources.length * 25)}%` }}></div>
                                </div>
                                {safeProfile.dataSources.length === 0 && <p className="text-xs text-slate-500 mt-2">Connect your first source.</p>}
                            </div>
                        </div>

                        {safeProfile.achievements.length === 0 && safeProfile.dataSources.length === 0 && (
                            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-[0_10px_25px_rgba(0,0,0,0.05)] flex items-center gap-5">
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-100 to-sky-100 flex items-center justify-center">
                                    <BrainCircuit className="w-10 h-10 text-indigo-500" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">Your career engine is idle</h3>
                                    <p className="text-sm text-slate-500">Let’s add some fuel. Import profile data to activate AI insights and recommendations.</p>
                                    <button onClick={() => setActiveTab('sources')} className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-500">
                                        <TrendingUp className="w-4 h-4" /> Add first data source
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-[0_10px_25px_rgba(0,0,0,0.05)] space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-slate-900">Profile Readiness</h3>
                                    <div className={`text-xs font-bold px-2 py-1 rounded-full ${readinessChecks.score >= 80 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {readinessChecks.score}% Ready
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    {readinessChecks.checks.map(check => (
                                        <div key={check.label} className="group flex items-center justify-between text-sm rounded-lg px-2 py-1.5 hover:bg-slate-50">
                                            <span className="text-slate-600">{check.label}</span>
                                            {check.done ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : (
                                                <button onClick={() => handleRunQuickAction(check.label)} className="inline-flex items-center gap-1 text-xs text-violet-600 font-semibold hover:text-violet-500">
                                                    <Wand2 className="w-3.5 h-3.5" /> Quick Fix
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                {readinessChecks.missing.length > 0 && (
                                    <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-3">
                                        Priority gaps: {readinessChecks.missing.slice(0, 3).join(', ')}.
                                    </div>
                                )}
                            </div>

                            <div className="rounded-2xl p-[1px] bg-gradient-to-r from-violet-500/60 to-sky-500/60 shadow-[0_10px_25px_rgba(0,0,0,0.05)]">
                            <div className="bg-white border border-white rounded-2xl p-6 space-y-4">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-hunj-600" />
                                    <h3 className="font-bold text-slate-900">AI Master Profile Enhancer</h3>
                                </div>
                                <textarea
                                    value={enhanceInstruction}
                                    onChange={(e) => setEnhanceInstruction(e.target.value)}
                                    className="w-full h-24 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-hunj-500/20 focus:border-hunj-500"
                                    placeholder="Example: Rewrite my profile for senior platform engineering roles with leadership emphasis."
                                />
                                <button
                                    onClick={handleEnhanceProfile}
                                    disabled={isEnhancingProfile || !enhanceInstruction.trim()}
                                    className="w-full px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isEnhancingProfile ? 'Enhancing profile...' : 'Run AI Profile Enhancement'}
                                </button>
                                <p className="text-xs text-slate-500">
                                    Premium-ready feature: lets users run targeted profile rewrites for specific role tracks.
                                </p>
                            </div>
                            </div>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-[0_10px_25px_rgba(0,0,0,0.05)]">
                            <h3 className="font-bold text-slate-900 mb-4">Career Targeting Preferences</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Target Roles</label>
                                    <input
                                        value={safeProfile.preferences.targetRoles.join(', ')}
                                        onChange={(e) => handlePreferenceListUpdate('targetRoles', e.target.value)}
                                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hunj-500/20 focus:border-hunj-500"
                                        placeholder="Platform Engineer, DevOps Engineer"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Target Industries</label>
                                    <input
                                        value={safeProfile.preferences.targetIndustries.join(', ')}
                                        onChange={(e) => handlePreferenceListUpdate('targetIndustries', e.target.value)}
                                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hunj-500/20 focus:border-hunj-500"
                                        placeholder="Fintech, SaaS, Healthcare"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Preferred Tech Stack</label>
                                    <input
                                        value={safeProfile.preferences.preferredTechStack.join(', ')}
                                        onChange={(e) => handlePreferenceListUpdate('preferredTechStack', e.target.value)}
                                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hunj-500/20 focus:border-hunj-500"
                                        placeholder="AWS, Kubernetes, Terraform"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Company Size</label>
                                    <input
                                        value={safeProfile.preferences.companySize.join(', ')}
                                        onChange={(e) => handlePreferenceListUpdate('companySize', e.target.value)}
                                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hunj-500/20 focus:border-hunj-500"
                                        placeholder="Startup, Mid-size, Enterprise"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Work Authorization</label>
                                    <input
                                        value={safeProfile.preferences.workAuthorization}
                                        onChange={(e) => onUpdateProfile({ ...safeProfile, preferences: { ...safeProfile.preferences, workAuthorization: e.target.value } })}
                                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hunj-500/20 focus:border-hunj-500"
                                        placeholder="US Citizen, H1B, etc."
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Salary Expectation</label>
                                    <input
                                        value={safeProfile.preferences.salaryExpectation}
                                        onChange={(e) => onUpdateProfile({ ...safeProfile, preferences: { ...safeProfile.preferences, salaryExpectation: e.target.value } })}
                                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hunj-500/20 focus:border-hunj-500"
                                        placeholder="$130k - $160k"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity / Ingestion Log */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-[0_10px_25px_rgba(0,0,0,0.05)]">
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

            {/* DOCUMENT LIBRARY */}
            {activeTab === 'documents' && (
                <DocumentLibrary
                    documents={safeProfile.documents || []}
                    onAddDocument={(doc) => onUpdateProfile({ ...safeProfile, documents: [...(safeProfile.documents || []), doc] })}
                    onDeleteDocument={(id) => onUpdateProfile({ ...safeProfile, documents: (safeProfile.documents || []).filter(d => d.id !== id) })}
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
