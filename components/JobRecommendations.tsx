import React, { useState, useEffect } from 'react';
import { ResumeData, RecommendedJob, JobAnalysis } from '../types';
import { getJobRecommendations, analyzeJobDescription } from '../services/geminiService';
import { Sparkles, Briefcase, ArrowRight, Loader2, Target } from 'lucide-react';

interface JobRecommendationsProps {
  masterResume: ResumeData;
  onApply: (analysis: JobAnalysis, text: string) => void;
}

const JobRecommendations: React.FC<JobRecommendationsProps> = ({ masterResume, onApply }) => {
  const [recommendations, setRecommendations] = useState<RecommendedJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    // Fetch recommendations on mount if we have a resume
    if (masterResume && recommendations.length === 0) {
      loadRecommendations();
    }
  }, [masterResume]);

  const loadRecommendations = async () => {
    setIsLoading(true);
    try {
      const jobs = await getJobRecommendations(masterResume);
      setRecommendations(jobs);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyClick = async (job: RecommendedJob) => {
    setProcessingId(job.id);
    try {
        // We reuse the existing analyze flow, but we skip the scraping since we have the text
        const analysis = await analyzeJobDescription(job.simulatedDescription);
        // Override title/company with the ones from recommendation to ensure consistency
        analysis.title = job.title;
        analysis.company = job.company;
        
        onApply(analysis, job.simulatedDescription);
    } catch (e) {
        console.error(e);
    } finally {
        setProcessingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-devops-800 rounded-xl border border-devops-700 p-6 flex flex-col items-center justify-center h-64 animate-pulse">
        <Sparkles className="w-8 h-8 text-accent-500 mb-3 animate-bounce" />
        <p className="text-devops-400">AI is finding perfect role matches for you...</p>
      </div>
    );
  }

  if (recommendations.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-devops-800 to-devops-900 border border-devops-700 rounded-xl p-6 shadow-xl relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-accent-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>

      <div className="flex justify-between items-center mb-6 relative z-10">
        <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-accent-500" />
                Smart Job Matches
            </h3>
            <p className="text-xs text-devops-400">Curated roles based on your master profile</p>
        </div>
        <button 
            onClick={loadRecommendations}
            className="text-xs text-devops-500 hover:text-white transition-colors"
        >
            Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
        {recommendations.map((job) => (
            <div key={job.id} className="bg-devops-900/80 border border-devops-700 hover:border-accent-500/50 rounded-lg p-4 transition-all hover:-translate-y-1 group flex flex-col h-full">
                <div className="flex justify-between items-start mb-2">
                    <div className="bg-white/10 p-2 rounded-lg">
                        <Briefcase className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xs font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded-full">
                        {job.matchScore}% Match
                    </span>
                </div>
                
                <h4 className="font-bold text-white mb-1 line-clamp-1">{job.title}</h4>
                <p className="text-sm text-devops-300 mb-3">{job.company}</p>
                
                <p className="text-xs text-devops-400 mb-4 line-clamp-2 flex-grow">
                    {job.matchReason}
                </p>

                <button 
                    onClick={() => handleApplyClick(job)}
                    disabled={processingId !== null}
                    className="w-full mt-auto py-2 bg-devops-800 hover:bg-accent-600 text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2 group-hover:bg-accent-600"
                >
                    {processingId === job.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                        <>Apply Now <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" /></>
                    )}
                </button>
            </div>
        ))}
      </div>
    </div>
  );
};

export default JobRecommendations;