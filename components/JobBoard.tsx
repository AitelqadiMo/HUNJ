
import React, { useState, useEffect } from 'react';
import { ExternalJob, UserPreferences, JobSearchFilters, MarketTrends } from '../types';
import { findVisaSponsoringJobs, analyzeJobMarketTrends } from '../services/geminiService';
import { MapPin, Globe, CheckCircle2, Loader2, Search, Zap, Filter, Building2, DollarSign, ArrowUpRight, Plane, Clock, Layout, Briefcase, Plus, ExternalLink, TrendingUp, AlertCircle, X } from 'lucide-react';

interface JobBoardProps {
  preferences: UserPreferences;
  onPersonalize: (job: ExternalJob) => void;
}

const JobBoard: React.FC<JobBoardProps> = ({ preferences, onPersonalize }) => {
  const [jobs, setJobs] = useState<ExternalJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [marketTrends, setMarketTrends] = useState<MarketTrends | null>(null);
  const [trackedIds, setTrackedIds] = useState<Set<string>>(new Set());
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Filters State
  const [filters, setFilters] = useState<JobSearchFilters>({
      query: preferences.targetRoles?.[0] || 'DevOps Engineer',
      location: 'Netherlands',
      remote: 'All',
      datePosted: 'Past Month',
      level: 'Any',
      type: 'Full-time'
  });

  useEffect(() => {
    handleSearch();
  }, []); 

  const handleSearch = async () => {
    setIsLoading(true);
    setError(null);
    setJobs([]); 
    setMarketTrends(null);
    setShowMobileFilters(false); // Close mobile filters on search

    try {
      const results = await findVisaSponsoringJobs(filters);
      setJobs(results);
      analyzeJobMarketTrends(results, filters.query).then(setMarketTrends);
    } catch (e) {
      console.error(e);
      setError("Failed to load jobs. Please try broader filters.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key: keyof JobSearchFilters, value: any) => {
      setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleTrack = (job: ExternalJob) => {
      setTrackedIds(prev => new Set(prev).add(job.id));
      onPersonalize(job); 
  };

  const FilterPanel = () => (
      <div className="space-y-6 md:space-y-8">
        {/* Keywords */}
        <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Role / Keywords</label>
            <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input 
                    type="text" 
                    value={filters.query}
                    onChange={(e) => handleFilterChange('query', e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. React Developer"
                />
            </div>
        </div>

        {/* Location */}
        <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Location</label>
            <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <select 
                    value={filters.location}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                >
                    <option value="All">Worldwide</option>
                    <option value="Netherlands">Netherlands</option>
                    <option value="Germany">Germany</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="USA">USA</option>
                    <option value="Canada">Canada</option>
                    <option value="Remote">Remote Only</option>
                </select>
            </div>
        </div>

        {/* Remote */}
        <div className="space-y-3">
            <label className="text-xs font-bold text-slate-500 uppercase">Work Style</label>
            <div className="flex flex-col gap-2">
                {['All', 'Remote', 'Hybrid', 'On-site'].map(opt => (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer group">
                        <input 
                            type="radio" 
                            name="remote"
                            checked={filters.remote === opt}
                            onChange={() => handleFilterChange('remote', opt)}
                            className="text-blue-600 focus:ring-blue-500" 
                        />
                        <span className={`text-sm ${filters.remote === opt ? 'text-slate-900 font-medium' : 'text-slate-600 group-hover:text-slate-900'}`}>{opt}</span>
                    </label>
                ))}
            </div>
        </div>

        {/* Date Posted */}
        <div className="space-y-3">
            <label className="text-xs font-bold text-slate-500 uppercase">Date Posted</label>
            <select 
                value={filters.datePosted}
                onChange={(e) => handleFilterChange('datePosted', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
                <option value="Any">Any Time</option>
                <option value="Past 24h">Past 24 Hours</option>
                <option value="Past Week">Past Week</option>
                <option value="Past Month">Past Month</option>
            </select>
        </div>

        <button 
            onClick={handleSearch}
            disabled={isLoading}
            className="w-full py-3 bg-slate-900 hover:bg-blue-600 text-white rounded-xl font-bold shadow-lg transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
        >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Search Jobs'}
        </button>
      </div>
  );

  return (
    <div className="flex h-[calc(100vh-64px)] bg-slate-50 overflow-hidden relative">
        
        {/* DESKTOP SIDEBAR FILTERS */}
        <aside className="w-72 bg-white border-r border-slate-200 flex-shrink-0 flex-col overflow-y-auto hidden md:flex">
            <div className="p-6 border-b border-slate-100">
                <h2 className="font-bold text-slate-900 flex items-center gap-2">
                    <Filter className="w-4 h-4 text-blue-600" /> Filters
                </h2>
            </div>
            <div className="p-6">
                <FilterPanel />
            </div>
        </aside>

        {/* MOBILE FILTERS TOGGLE */}
        <button 
            onClick={() => setShowMobileFilters(true)}
            className="md:hidden absolute bottom-24 right-6 z-40 bg-slate-900 text-white p-4 rounded-full shadow-xl flex items-center justify-center hover:bg-blue-600 transition-colors"
        >
            <Filter className="w-6 h-6" />
        </button>

        {/* MOBILE FILTERS DRAWER */}
        {showMobileFilters && (
            <div className="fixed inset-0 z-50 flex justify-end md:hidden">
                <div 
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    onClick={() => setShowMobileFilters(false)}
                ></div>
                <div className="relative w-4/5 max-w-sm bg-white h-full shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right duration-300">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-xl font-bold text-slate-900">Filters</h2>
                        <button onClick={() => setShowMobileFilters(false)} className="p-2 text-slate-400 hover:text-slate-900">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                    <FilterPanel />
                </div>
            </div>
        )}

        {/* MAIN FEED */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
            
            {/* Market Pulse Banner */}
            {marketTrends && (
                <div className="bg-white border-b border-slate-200 p-4 shadow-sm z-10 shrink-0">
                    <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="p-2 bg-blue-50 rounded-lg hidden sm:block">
                            <TrendingUp className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1 w-full">
                            <div className="flex justify-between items-center mb-1">
                                <h3 className="text-sm font-bold text-slate-900">Market Pulse</h3>
                                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                                    marketTrends.salaryTrend === 'Up' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                                }`}>
                                    Salary: {marketTrends.salaryTrend}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 line-clamp-2">{marketTrends.summary}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Job List */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50">
                <div className="max-w-5xl mx-auto space-y-4 pb-20">
                    
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-4">
                            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                            <p className="text-sm animate-pulse">Scouring the web for verified roles...</p>
                        </div>
                    )}

                    {!isLoading && jobs.length === 0 && !error && (
                        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                            <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-slate-900">No jobs found</h3>
                            <p className="text-slate-500 max-w-sm mx-auto mt-2 text-sm">Try broader filters to see more results.</p>
                        </div>
                    )}

                    {jobs.map((job) => (
                        <div key={job.id} className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-lg hover:border-blue-300 transition-all group relative">
                            <div className="flex flex-col gap-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex gap-4">
                                        <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-lg font-bold text-slate-600 shrink-0">
                                            {job.company.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                                                {job.title}
                                            </h3>
                                            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600 mt-1">
                                                <span className="font-medium">{job.company}</span>
                                                <span className="hidden sm:inline">•</span>
                                                <span className="flex items-center gap-1 text-xs"><MapPin className="w-3 h-3" /> {job.location}</span>
                                            </div>
                                        </div>
                                    </div>
                                    {job.matchScore && (
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap ${
                                            job.matchScore > 80 ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-700'
                                        }`}>
                                            {job.matchScore}% Match
                                        </span>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {job.salaryRange && (
                                        <span className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-medium text-slate-600 flex items-center gap-1">
                                            <DollarSign className="w-3 h-3" /> {job.salaryRange}
                                        </span>
                                    )}
                                    <span className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-medium text-slate-600 flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> {job.postedDate}
                                    </span>
                                    {job.tags.slice(0, 3).map(tag => (
                                        <span key={tag} className="px-2 py-1 bg-purple-50 text-purple-700 border border-purple-100 rounded text-xs font-medium">
                                            {tag}
                                        </span>
                                    ))}
                                </div>

                                <p className="text-sm text-slate-500 line-clamp-3 leading-relaxed">
                                    {job.description}
                                </p>

                                <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-slate-100 gap-4">
                                    <a 
                                        href={job.sourceUrl || job.applyLink} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 w-full sm:w-auto"
                                    >
                                        Via {job.source} <ExternalLink className="w-3 h-3" />
                                    </a>
                                    <div className="flex gap-3 w-full sm:w-auto">
                                        <button 
                                            onClick={() => handleTrack(job)}
                                            disabled={trackedIds.has(job.id)}
                                            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                                                trackedIds.has(job.id) 
                                                ? 'bg-green-100 text-green-700 cursor-default' 
                                                : 'bg-white border border-slate-200 text-slate-700 hover:border-blue-500 hover:text-blue-600'
                                            }`}
                                        >
                                            {trackedIds.has(job.id) ? <CheckCircle2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                            {trackedIds.has(job.id) ? 'Tracked' : 'Track'}
                                        </button>
                                        
                                        <a 
                                            href={job.applyLink}
                                            target="_blank"
                                            rel="noreferrer" 
                                            className="flex-1 sm:flex-none px-6 py-2 bg-slate-900 hover:bg-blue-600 text-white rounded-lg text-sm font-bold shadow-md transition-colors flex items-center justify-center gap-2"
                                        >
                                            Apply <ArrowUpRight className="w-4 h-4" />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </main>
    </div>
  );
};

export default JobBoard;
