import React, { useState, useEffect } from 'react';
import { ExternalJob, UserPreferences } from '../types';
import { findVisaSponsoringJobs } from '../services/geminiService';
import { MapPin, Globe, CheckCircle2, Loader2, Search, Zap, Filter, Building2, DollarSign, ArrowUpRight, Plane, Clock } from 'lucide-react';

interface JobBoardProps {
  preferences: UserPreferences;
  onPersonalize: (job: ExternalJob) => void;
}

const JobBoard: React.FC<JobBoardProps> = ({ preferences, onPersonalize }) => {
  const [jobs, setJobs] = useState<ExternalJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Initial load
  useEffect(() => {
    loadJobs(selectedCountry, '');
  }, []); 

  const handleSearch = () => {
      loadJobs(selectedCountry, searchQuery);
  };

  const loadJobs = async (country: string, query: string) => {
    setIsLoading(true);
    setError(null);
    setJobs([]); 
    try {
      const results = await findVisaSponsoringJobs(preferences, country, query);
      setJobs(results);
    } catch (e) {
      console.error(e);
      setError("Failed to load jobs. The search service might be busy. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newCountry = e.target.value;
      setSelectedCountry(newCountry);
      loadJobs(newCountry, searchQuery);
  };

  const getCompanyInitial = (name: string) => name.charAt(0).toUpperCase();

  const getSearchUrl = (job: ExternalJob) => {
      return `https://www.google.com/search?q=${encodeURIComponent(`Apply to ${job.title} at ${job.company}`)}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-64px)] flex flex-col">
      
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3 mb-2">
            <Globe className="w-8 h-8 text-accent-500" />
            Global Tech Opportunities
        </h1>
        <p className="text-devops-400 text-sm max-w-2xl">
            Discover roles tailored for <span className="text-white font-medium">{preferences.targetRoles[0]}s</span> with verified visa sponsorship potential.
        </p>
      </div>

      {/* Control Bar */}
      <div className="bg-devops-800 border border-devops-700 p-2 rounded-xl shadow-lg mb-8 flex flex-col md:flex-row gap-2">
            <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-devops-400" />
                <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Search roles (e.g. 'Kubernetes', 'SRE')"
                    className="w-full pl-10 pr-4 py-2.5 bg-devops-900 border border-devops-600 rounded-lg text-white focus:outline-none focus:border-accent-500 placeholder-devops-500 transition-colors"
                />
            </div>
            
            <div className="relative md:w-56">
                <Filter className="absolute left-3 top-3 w-4 h-4 text-devops-400" />
                <select 
                    value={selectedCountry}
                    onChange={handleCountryChange}
                    className="w-full pl-10 pr-8 py-2.5 bg-devops-900 border border-devops-600 rounded-lg text-white focus:outline-none focus:border-accent-500 appearance-none cursor-pointer hover:bg-devops-800 transition-colors"
                >
                    <option value="All">🌍 All Regions</option>
                    <option value="nl">🇳🇱 Netherlands</option>
                    <option value="de">🇩🇪 Germany</option>
                    <option value="uk">🇬🇧 United Kingdom</option>
                    <option value="ie">🇮🇪 Ireland</option>
                    <option value="se">🇸🇪 Sweden</option>
                    <option value="fr">🇫🇷 France</option>
                    <option value="ch">🇨🇭 Switzerland</option>
                    <option value="us">🇺🇸 USA</option>
                    <option value="ca">🇨🇦 Canada</option>
                </select>
            </div>

            <button 
                onClick={handleSearch}
                disabled={isLoading}
                className="px-8 py-2.5 bg-accent-600 hover:bg-accent-500 text-white rounded-lg font-bold shadow-lg shadow-accent-600/20 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[120px]"
            >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Find Jobs'}
            </button>
      </div>

      {/* Results Area */}
      {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-devops-400 space-y-6">
              <div className="relative">
                  <div className="w-20 h-20 border-4 border-devops-800 border-t-accent-500 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                      <Plane className="w-8 h-8 text-accent-500 opacity-50" />
                  </div>
              </div>
              <div className="text-center">
                  <p className="text-lg font-medium text-white">Scouting top opportunities...</p>
                  <p className="text-sm mt-2 text-devops-500">Checking visa policies & active listings in {selectedCountry === 'All' ? 'Europe & NA' : selectedCountry.toUpperCase()}</p>
              </div>
          </div>
      ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="bg-red-500/10 p-4 rounded-full mb-4">
                  <Filter className="w-8 h-8 text-red-400" />
              </div>
              <p className="text-white text-lg font-medium mb-2">We hit a snag finding jobs</p>
              <p className="text-devops-400 max-w-md mb-6">{error}</p>
              <button onClick={handleSearch} className="px-6 py-2 bg-devops-800 border border-devops-600 hover:border-white rounded-lg text-white transition-colors">
                  Try Again
              </button>
          </div>
      ) : jobs.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-devops-400">
              <div className="bg-devops-800 p-6 rounded-full mb-4 border border-devops-700">
                  <Search className="w-8 h-8 text-devops-600" />
              </div>
              <p className="text-lg text-white font-medium">No matching jobs found</p>
              <p className="text-sm mt-2">Try adjusting your filters or broaden your search terms.</p>
          </div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pb-10 custom-scrollbar pr-2">
              {jobs.map((job) => {
                  // Determine link type
                  const isSearchLink = job.applyLink.includes('google.com/search');
                  const domain = !isSearchLink ? new URL(job.applyLink).hostname.replace('www.', '') : 'Google Search';

                  return (
                  <div key={job.id} className="bg-devops-800 border border-devops-700 hover:border-accent-500/50 rounded-xl p-5 transition-all hover:shadow-xl hover:-translate-y-1 group flex flex-col relative h-full">
                      
                      <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-lg font-bold text-devops-900 shadow-inner overflow-hidden">
                                  {getCompanyInitial(job.company)}
                              </div>
                              <div>
                                  <h3 className="font-bold text-white text-sm line-clamp-1 group-hover:text-accent-400 transition-colors">
                                      {job.company}
                                  </h3>
                                  <div className="flex items-center gap-1 text-xs text-devops-400">
                                      <MapPin className="w-3 h-3" /> {job.location}
                                  </div>
                              </div>
                          </div>
                          {job.visaSupport && (
                            <span className="bg-green-500/10 text-green-400 text-[10px] font-bold px-2 py-1 rounded-full border border-green-500/20 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> VISA
                            </span>
                          )}
                      </div>

                      <h4 className="font-bold text-lg text-white mb-3 line-clamp-2 leading-tight">
                          {job.title}
                      </h4>

                      <div className="flex flex-wrap gap-2 mb-4">
                            {job.salaryRange && (
                                <span className="text-[10px] font-medium text-devops-300 bg-devops-900 px-2 py-1 rounded border border-devops-700 flex items-center gap-1">
                                    <DollarSign className="w-3 h-3" /> {job.salaryRange}
                                </span>
                            )}
                            <span className="text-[10px] font-medium text-devops-300 bg-devops-900 px-2 py-1 rounded border border-devops-700 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {job.postedDate}
                            </span>
                      </div>

                      <p className="text-xs text-devops-400 line-clamp-3 mb-6 flex-grow leading-relaxed">
                          {job.description}
                      </p>

                      <div className="pt-4 border-t border-devops-700/50 flex items-center gap-2 mt-auto">
                          <button 
                              onClick={() => onPersonalize(job)}
                              className="flex-1 px-3 py-2 bg-devops-700 hover:bg-devops-600 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2"
                          >
                              <Zap className="w-3 h-3 text-yellow-400" /> Optimize Resume
                          </button>
                          
                          <a 
                              href={job.applyLink} 
                              target="_blank" 
                              rel="noreferrer"
                              className="px-3 py-2 bg-accent-600 hover:bg-accent-500 text-white rounded-lg text-xs font-bold transition-colors shadow-lg shadow-accent-600/10"
                              title={isSearchLink ? 'Search Job' : 'Apply Now'}
                          >
                              <ArrowUpRight className="w-4 h-4" />
                          </a>
                      </div>
                  </div>
              )})}
          </div>
      )}
    </div>
  );
};

export default JobBoard;