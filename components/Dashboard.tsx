
import React, { useState, useMemo } from 'react';
import { Application, ResumeData, JobAnalysis, UserProfile } from '../types';
import { Plus, LayoutGrid, Kanban as KanbanIcon, Search, Trophy, ArrowRight, Building2, MapPin, Calendar, Activity, BarChart3, Filter, Zap, TrendingUp, AlertCircle, BrainCircuit } from 'lucide-react';
import KanbanBoard from './KanbanBoard';
import ApplicationIntelligence from './ApplicationIntelligence';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface ExtendedDashboardProps {
  applications: Application[];
  masterResume: ResumeData;
  onNewApplication: () => void;
  onSelectApplication: (id: string) => void;
  onEditProfile: () => void;
  onAnalyzeJob?: (analysis: JobAnalysis, text: string) => void;
  onUpdateStatus?: (id: string, status: Application['status']) => void;
  onNavigateToJobBoard?: () => void;
}

const Dashboard: React.FC<ExtendedDashboardProps> = ({ 
  applications, 
  onNewApplication, 
  onSelectApplication,
  onUpdateStatus
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'kanban'>('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);

  const filteredApps = applications.filter(app => 
    app.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.jobTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedApp = applications.find(a => a.id === selectedAppId);

  // --- STRATEGIC METRICS CALCULATION ---
  const metrics = useMemo(() => {
      const total = applications.length || 1;
      const interviews = applications.filter(a => a.status === 'Interviewing' || a.status === 'Offer').length;
      const offers = applications.filter(a => a.status === 'Offer').length;
      
      const interviewRate = Math.round((interviews / total) * 100);
      const offerRate = Math.round((offers / (interviews || 1)) * 100);
      
      // Determine best performing resume version (mock logic for demo)
      const versionCounts: Record<string, { total: number, interviews: number }> = {};
      applications.forEach(app => {
          const vName = app.resumes.find(r => r.id === app.activeResumeId)?.versionName || 'Unknown';
          if (!versionCounts[vName]) versionCounts[vName] = { total: 0, interviews: 0 };
          versionCounts[vName].total++;
          if (app.status === 'Interviewing' || app.status === 'Offer') versionCounts[vName].interviews++;
      });
      
      let bestVersion = 'N/A';
      let bestRate = -1;
      Object.entries(versionCounts).forEach(([name, stats]) => {
          const rate = stats.interviews / stats.total;
          if (stats.total > 1 && rate > bestRate) {
              bestRate = rate;
              bestVersion = name;
          }
      });

      return { interviewRate, offerRate, bestVersion };
  }, [applications]);

  // Velocity Mock Data
  const velocityData = [
      { day: 'M', apps: 2, score: 70 },
      { day: 'T', apps: 4, score: 75 },
      { day: 'W', apps: 1, score: 60 },
      { day: 'T', apps: 5, score: 85 },
      { day: 'F', apps: 3, score: 80 },
      { day: 'S', apps: 0, score: 0 },
      { day: 'S', apps: 1, score: 90 },
  ];

  return (
    <div className="flex h-[calc(100vh-64px)] bg-slate-50 overflow-hidden">
        
        {/* MAIN DASHBOARD AREA */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
            <div className="max-w-[1800px] mx-auto w-full px-6 py-8 space-y-8">
                
                {/* 1. STRATEGIC HUD */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                    
                    {/* Velocity Chart */}
                    <div className="lg:col-span-1 bg-devops-900 rounded-2xl p-5 border border-devops-800 relative overflow-hidden flex flex-col shadow-lg">
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div>
                                <h3 className="text-xs font-bold text-devops-400 uppercase tracking-widest flex items-center gap-2">
                                    <Activity className="w-3 h-3 text-hunj-500" /> Pipeline Velocity
                                </h3>
                                <div className="text-2xl font-bold text-white mt-1">{applications.length} <span className="text-xs font-normal text-devops-500">Active</span></div>
                            </div>
                            <div className="text-right">
                                <span className="text-xs font-bold text-green-400 flex items-center gap-1"><TrendingUp className="w-3 h-3"/> +12%</span>
                            </div>
                        </div>
                        <div className="flex-1 min-h-[80px] -mx-2 -mb-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={velocityData}>
                                    <defs>
                                        <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <Area type="monotone" dataKey="score" stroke="#8b5cf6" fill="url(#colorApps)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Funnel Metrics */}
                    <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                                <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Filter className="w-5 h-5" /></div>
                                <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded">Week</span>
                            </div>
                            <div>
                                <div className="text-3xl font-display font-bold text-slate-900">{metrics.interviewRate}%</div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Interview Conversion</div>
                            </div>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                                <div className="p-2 bg-purple-50 rounded-lg text-purple-600"><Trophy className="w-5 h-5" /></div>
                                <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded">Global</span>
                            </div>
                            <div>
                                <div className="text-3xl font-display font-bold text-slate-900">{metrics.offerRate}%</div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Offer Yield</div>
                            </div>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 rounded-full blur-2xl -mr-4 -mt-4"></div>
                            <div className="flex justify-between items-start relative z-10">
                                <div className="p-2 bg-green-50 rounded-lg text-green-600"><Zap className="w-5 h-5" /></div>
                            </div>
                            <div className="relative z-10">
                                <div className="text-lg font-bold text-slate-900 truncate">{metrics.bestVersion}</div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Top Performing Resume</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. CONTROLS & BOARD */}
                <div className="flex flex-col h-full space-y-4">
                    <div className="flex justify-between items-center bg-white p-3 rounded-2xl border border-slate-200 shadow-sm sticky top-0 z-10">
                        <div className="relative w-64 md:w-96 group">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 group-focus-within:text-hunj-600 transition-colors" />
                            <input 
                                type="text" 
                                placeholder="Filter by role or company..." 
                                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-hunj-500/20 focus:border-hunj-500 transition-all font-medium" 
                                value={searchTerm} 
                                onChange={(e) => setSearchTerm(e.target.value)} 
                            />
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-100'}`}><LayoutGrid className="w-4 h-4" /></button>
                            <button onClick={() => setViewMode('kanban')} className={`p-2 rounded-lg transition-all ${viewMode === 'kanban' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-100'}`}><KanbanIcon className="w-4 h-4" /></button>
                            <div className="w-px h-8 bg-slate-200 mx-2"></div>
                            <button onClick={onNewApplication} className="flex items-center gap-2 px-4 py-2 bg-hunj-600 hover:bg-hunj-500 text-white rounded-xl font-bold shadow-lg shadow-hunj-500/30 transition-all text-sm">
                                <Plus className="w-4 h-4" /> New App
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 min-h-[500px]">
                        {viewMode === 'kanban' ? (
                            <KanbanBoard 
                                applications={filteredApps} 
                                onSelectApplication={(id) => { 
                                    onSelectApplication(id); // Navigate
                                    setSelectedAppId(id); // Open sidebar
                                }} 
                                onUpdateStatus={onUpdateStatus || (() => {})} 
                                onInspect={(id) => setSelectedAppId(id)}
                            />
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in">
                                {filteredApps.map(app => (
                                    <div key={app.id} onClick={() => onSelectApplication(app.id)} className="bg-white border border-slate-200 p-6 rounded-2xl hover:shadow-lg transition-all cursor-pointer group">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center font-bold text-slate-700 text-lg border border-slate-100">
                                                {app.companyName.charAt(0)}
                                            </div>
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide border ${
                                                app.status === 'Offer' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-500 border-slate-200'
                                            }`}>{app.status}</span>
                                        </div>
                                        <h3 className="font-bold text-slate-900 mb-1">{app.jobTitle}</h3>
                                        <p className="text-slate-500 text-sm mb-4">{app.companyName}</p>
                                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-2">
                                            <div className={`h-full ${ (app.atsScore?.total || 0) > 80 ? 'bg-green-500' : 'bg-orange-500' }`} style={{ width: `${app.atsScore?.total || 0}%` }}></div>
                                        </div>
                                        <div className="flex justify-between text-xs text-slate-400">
                                            <span>Match Score</span>
                                            <span className="font-bold text-slate-700">{app.atsScore?.total || 0}%</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* 3. INTELLIGENCE SIDEBAR (When card "Inspect" clicked) */}
        {selectedApp && (
            <div className="w-[450px] border-l border-slate-200 bg-white shadow-2xl z-30 shrink-0 animate-in slide-in-from-right duration-300 flex flex-col">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                        <BrainCircuit className="w-5 h-5 text-hunj-600" />
                        <h3 className="font-bold text-slate-900">Application Intelligence</h3>
                    </div>
                    <button onClick={() => setSelectedAppId(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><ArrowRight className="w-4 h-4 text-slate-500" /></button>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <ApplicationIntelligence application={selectedApp} />
                </div>
                <div className="p-4 border-t border-slate-200 bg-slate-50">
                    <button onClick={() => onSelectApplication(selectedApp.id)} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg">
                        Open Workspace
                    </button>
                </div>
            </div>
        )}
    </div>
  );
};

export default Dashboard;
