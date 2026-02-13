
import React, { useState, useEffect, useMemo } from 'react';
import { ExternalJob, UserPreferences, JobSearchFilters, MarketTrends, JobSearchHistory } from '../types';
import { findVisaSponsoringJobs, analyzeJobMarketTrends, generateCoverLetter } from '../services/geminiService';
import { storageService } from '../services/storageService';
import MarketPulse from './MarketPulse';
import JobIntelligence from './JobIntelligence';
import { 
    MapPin, Globe, CheckCircle2, Loader2, Search, Zap, Filter, Building2, 
    DollarSign, ArrowUpRight, Plane, Clock, Layout, Briefcase, Plus, ExternalLink, 
    TrendingUp, AlertCircle, X, ArrowLeft, History, SortAsc, Sparkles, FileText, ChevronDown, Wand2, SlidersHorizontal, BrainCircuit
} from 'lucide-react';

interface JobBoardProps {
  preferences: UserPreferences;
  onPersonalize: (job: ExternalJob) => void;
}

const CompanyLogo = ({ name }: { name: string }) => {
    const color = useMemo(() => {
        const colors = ['from-blue-500 to-blue-600', 'from-indigo-500 to-indigo-600', 'from-purple-500 to-purple-600', 'from-pink-500 to-pink-600', 'from-emerald-500 to-emerald-600', 'from-orange-500 to-orange-600'];
        let hash = 0;
        for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
        return colors[Math.abs(hash) % colors.length];
    }, [name]);

    return (
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm bg-gradient-to-br ${color} shrink-0`}>
            {name.substring(0, 2).toUpperCase()}
        </div>
    );
};

const SmartTag = ({ type, text }: { type: 'salary' | 'visa' | 'location' | 'default', text: string }) => {
    let classes = "bg-slate-100 text-slate-600 border-slate-200";
    let icon = null;

    if (type === 'salary') {
        classes = "bg-green-50 text-green-700 border-green-200";
        icon = <DollarSign className="w-3 h-3" />;
    } else if (type === 'visa') {
        classes = "bg-purple-50 text-purple-700 border-purple-200";
        icon = <Plane className="w-3 h-3" />;
    } else if (type === 'location') {
        classes = "bg-blue-50 text-blue-700 border-blue-200";
        icon = <MapPin className="w-3 h-3" />;
    }

    return (
        <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md border ${classes}`}>
            {icon} {text}
        </span>
    );
}

const JobBoard: React.FC<JobBoardProps> = ({ preferences, onPersonalize }) => {
  // Data State
  const [jobs, setJobs] = useState<ExternalJob[]>([]);
  const [marketTrends, setMarketTrends] = useState<MarketTrends | null>(null);
  const [searchHistory, setSearchHistory] = useState<JobSearchHistory[]>([]);
  
  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [isBackgroundFetching, setIsBackgroundFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<ExternalJob | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [trackedIds, setTrackedIds] = useState<Set<string>>(new Set());
  const [sortMode, setSortMode] = useState<'Smart Rank' | 'Date' | 'Salary'>('Smart Rank');

  // Filters State
  const [filters, setFilters] = useState<JobSearchFilters>({
      query: preferences.targetRoles?.[0] || 'DevOps Engineer',
      location: 'Netherlands',
      remote: 'All',
      datePosted: 'Past Month',
      level: 'Any',
      type: 'Full-time'
  });

  // Initial Load
  useEffect(() => {
      setSearchHistory(storageService.getSearchHistory());
      const cached = storageService.getJobCache(filters);
      if (cached) {
          setJobs(enhanceJobsWithIntelligence(cached));
          handleSearch(true);
      } else {
          handleSearch();
      }
  }, []);

  // --- MOCK INTELLIGENCE ENGINE ---
  // In a real app, this would happen on the backend with embeddings
  const enhanceJobsWithIntelligence = (rawJobs: ExternalJob[]): ExternalJob[] => {
      return rawJobs.map(job => {
          // Mock Calculation for "Personalized" scores
          const nameHash = job.id.split('').reduce((a,b)=>a+b.charCodeAt(0),0);
          const probability = Math.min(95, Math.max(20, (job.matchScore || 50) - (nameHash % 20)));
          
          // Mock Missing Skills
          const allSkills = ["Kubernetes", "AWS", "Python", "React", "Docker", "Terraform", "CI/CD"];
          const existing = job.tags || [];
          const missing = allSkills.filter(s => !existing.includes(s) && (nameHash % s.length === 0)).slice(0, 2);

          return {
              ...job,
              interviewProbability: probability,
              missingSkills: missing
          };
      });
  };

  const handleSearch = async (background = false) => {
    if (!background) setIsLoading(true);
    else setIsBackgroundFetching(true);
    setError(null);
    setShowMobileFilters(false); 

    try {
      const results = await findVisaSponsoringJobs(filters);
      
      const enhancedResults = enhanceJobsWithIntelligence(results);

      setJobs(prev => {
          const existingIds = new Set(prev.map(j => j.id));
          const newJobs = enhancedResults.filter(j => !existingIds.has(j.id));
          const merged = background ? [...newJobs, ...prev] : enhancedResults;
          // Sort implicitly by match score first
          return merged.sort((a,b) => b.matchScore - a.matchScore);
      });

      storageService.addToSearchHistory(filters, results.length);
      setSearchHistory(storageService.getSearchHistory());

      analyzeJobMarketTrends(results, filters.query).then(t => setMarketTrends({...t, hiringMomentum: 78})); // Mock momentum

    } catch (e) {
      console.error(e);
      if (!background) setError("Failed to load jobs. Please try broader filters.");
    } finally {
      setIsLoading(false);
      setIsBackgroundFetching(false);
    }
  };

  const handleTrack = (job: ExternalJob) => {
      setTrackedIds(prev => new Set(prev).add(job.id));
      onPersonalize(job); 
  };

  const sortedJobs = useMemo(() => {
      const list = [...jobs];
      if (sortMode === 'Smart Rank') return list.sort((a, b) => b.matchScore - a.matchScore);
      if (sortMode === 'Date') return list; // Assumed roughly sorted by API
      if (sortMode === 'Salary') return list.sort((a, b) => (b.salaryRange ? 1 : -1)); 
      return list;
  }, [jobs, sortMode]);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-100 text-slate-900 font-sans overflow-hidden">
        
        {/* TOP: Market Pulse HUD */}
        <MarketPulse trends={marketTrends} role={filters.query} />

        <div className="flex flex-1 overflow-hidden">
            
            {/* LEFT: Faceted Search (Desktop) */}
            <aside className="w-72 bg-white border-r border-slate-200 hidden md:flex flex-col z-20">
                <div className="p-5 border-b border-slate-100">
                    <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wide">
                        <SlidersHorizontal className="w-4 h-4 text-hunj-600" /> Search Vector
                    </h2>
                </div>
                
                <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Role</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                            <input 
                                type="text" 
                                value={filters.query}
                                onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-hunj-500/20 focus:border-hunj-500 transition-all font-medium"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Region</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                            <select 
                                value={filters.location}
                                onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none appearance-none font-medium cursor-pointer"
                            >
                                <option value="All">Worldwide</option>
                                <option value="Netherlands">Netherlands</option>
                                <option value="Germany">Germany</option>
                                <option value="United Kingdom">United Kingdom</option>
                                <option value="USA">USA</option>
                                <option value="Remote">Remote Only</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-3 w-3 h-3 text-slate-400 pointer-events-none" />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Work Mode</label>
                        <div className="flex flex-wrap gap-2">
                            {['Remote', 'Hybrid', 'On-site'].map(opt => (
                                <button 
                                    key={opt}
                                    onClick={() => setFilters(prev => ({ ...prev, remote: opt as any }))}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                        filters.remote === opt 
                                        ? 'bg-slate-900 text-white border-slate-900 shadow-md' 
                                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                                    }`}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button 
                        onClick={() => handleSearch()}
                        className="w-full py-3 bg-hunj-600 hover:bg-hunj-500 text-white rounded-xl font-bold shadow-lg shadow-hunj-500/20 transition-all flex items-center justify-center gap-2"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Update Feed'}
                    </button>
                </div>
            </aside>

            {/* CENTER: Opportunity Feed */}
            <main className="flex-1 flex flex-col min-w-0 bg-slate-50 border-r border-slate-200">
                <div className="h-14 border-b border-slate-200 bg-white/80 backdrop-blur flex items-center justify-between px-6 sticky top-0 z-10">
                    <div className="flex items-center gap-2">
                        <h2 className="font-bold text-slate-900 text-sm md:text-base">Opportunities</h2>
                        <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-xs font-bold">{jobs.length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setShowMobileFilters(true)} className="md:hidden p-2 rounded-lg bg-white border border-slate-200"><Filter className="w-4 h-4"/></button>
                        <div className="hidden sm:flex bg-slate-100 p-1 rounded-lg">
                            {['Smart Rank', 'Date', 'Salary'].map(mode => (
                                <button 
                                    key={mode} 
                                    onClick={() => setSortMode(mode as any)}
                                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${sortMode === mode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    {mode}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {isLoading && jobs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-hunj-500" />
                            <p className="text-sm font-medium">Analyzing opportunities...</p>
                        </div>
                    ) : jobs.length === 0 && !error ? (
                        <div className="text-center py-20 opacity-50">
                            <Briefcase className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                            <p className="text-slate-500">No jobs found matching your criteria.</p>
                        </div>
                    ) : (
                        sortedJobs.map(job => (
                            <div 
                                key={job.id}
                                onClick={() => setSelectedJob(job)}
                                className={`group p-4 bg-white border rounded-xl cursor-pointer transition-all hover:shadow-lg relative overflow-hidden ${
                                    selectedJob?.id === job.id ? 'border-hunj-500 shadow-md ring-1 ring-hunj-500/20' : 'border-slate-200 hover:border-hunj-300'
                                }`}
                            >
                                <div className={`absolute top-0 left-0 bottom-0 w-1 ${
                                    job.matchScore >= 85 ? 'bg-emerald-500' : job.matchScore >= 60 ? 'bg-blue-500' : 'bg-amber-500'
                                }`}></div>

                                <div className="flex justify-between items-start mb-3 pl-3">
                                    <div className="flex gap-3">
                                        <CompanyLogo name={job.company} />
                                        <div>
                                            <h3 className={`font-bold text-sm leading-tight line-clamp-1 ${selectedJob?.id === job.id ? 'text-hunj-700' : 'text-slate-900 group-hover:text-hunj-600'}`}>{job.title}</h3>
                                            <p className="text-xs text-slate-500 font-medium">{job.company}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-lg font-extrabold leading-none ${
                                            job.matchScore >= 85 ? 'text-emerald-600' : 'text-slate-700'
                                        }`}>
                                            {job.matchScore}%
                                        </div>
                                        <div className="text-[9px] text-slate-400 font-bold uppercase">Match</div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 pl-3 mb-2">
                                    <SmartTag type="location" text={job.location} />
                                    {job.salaryRange && <SmartTag type="salary" text={job.salaryRange} />}
                                    {job.visaSupport && <SmartTag type="visa" text="Sponsor" />}
                                </div>

                                {job.interviewProbability && (
                                    <div className="pl-3 mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                                            <BrainCircuit className="w-3 h-3 text-purple-500" />
                                            Probability: <span className={job.interviewProbability > 60 ? 'text-green-600' : 'text-amber-600'}>{job.interviewProbability}%</span>
                                        </div>
                                        <span className="text-[10px] text-slate-400">{job.postedDate}</span>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </main>

            {/* RIGHT: Intelligence Pane */}
            {selectedJob ? (
                <aside className="w-[400px] border-l border-slate-200 bg-white hidden lg:flex flex-col z-20 shadow-xl animate-in slide-in-from-right duration-300">
                    <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-white sticky top-0 z-10">
                        <h2 className="font-bold text-slate-900 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-hunj-600" /> Intelligence
                        </h2>
                        <button onClick={() => setSelectedJob(null)} className="p-1 hover:bg-slate-100 rounded text-slate-400"><X className="w-5 h-5"/></button>
                    </div>
                    <JobIntelligence job={selectedJob} onTrack={() => handleTrack(selectedJob)} isTracked={trackedIds.has(selectedJob.id)} />
                </aside>
            ) : (
                <aside className="w-[400px] border-l border-slate-200 bg-slate-50 hidden lg:flex flex-col items-center justify-center text-center p-8 opacity-60">
                    <div className="w-20 h-20 bg-white border border-slate-200 rounded-full flex items-center justify-center mb-4 shadow-sm">
                        <Layout className="w-10 h-10 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Select a Role</h3>
                    <p className="text-sm text-slate-500 max-w-xs">Click on any job card to view the deep-dive intelligence analysis and optimization tools.</p>
                </aside>
            )}

            {/* Mobile Detail Overlay */}
            {selectedJob && (
                <div className="fixed inset-0 z-50 lg:hidden bg-white flex flex-col animate-in slide-in-from-right">
                    <div className="flex items-center justify-between p-4 border-b border-slate-100">
                        <button onClick={() => setSelectedJob(null)} className="p-2 -ml-2"><ArrowLeft className="w-6 h-6 text-slate-600"/></button>
                        <h2 className="font-bold">Job Analysis</h2>
                        <div className="w-6"></div>
                    </div>
                    <JobIntelligence job={selectedJob} onTrack={() => handleTrack(selectedJob)} isTracked={trackedIds.has(selectedJob.id)} />
                </div>
            )}
        </div>
    </div>
  );
};

export default JobBoard;
