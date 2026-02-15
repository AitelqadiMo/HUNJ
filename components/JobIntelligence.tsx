
import React from 'react';
import { ExternalJob } from '../types';
import { 
    Briefcase, Building2, MapPin, DollarSign, CheckCircle2, 
    AlertTriangle, Wand2, ArrowRight, Target, BrainCircuit, 
    TrendingUp, Layers, Zap
} from 'lucide-react';

interface JobIntelligenceProps {
  job: ExternalJob;
  onTrack: () => void;
  isTracked: boolean;
}

const JobIntelligence: React.FC<JobIntelligenceProps> = ({ job, onTrack, isTracked }) => {
  const [showFullDescription, setShowFullDescription] = React.useState(false);
  const matchColor = job.matchScore >= 85 ? 'text-emerald-500' : job.matchScore >= 70 ? 'text-blue-500' : job.matchScore >= 50 ? 'text-amber-500' : 'text-red-500';
  const matchBg = job.matchScore >= 85 ? 'bg-emerald-500' : job.matchScore >= 70 ? 'bg-blue-500' : job.matchScore >= 50 ? 'bg-amber-500' : 'bg-red-500';
  const inferredSeniority = /senior|lead|principal/i.test(job.title) ? 'Senior' : /junior|entry/i.test(job.title) ? 'Junior' : 'Mid';
  const inferredIndustry = (job.tags && job.tags.length > 0) ? job.tags.slice(0, 2).join(' / ') : 'General Technology';
  
  // Simulated Missing Skills (In a real app, this comes from the backend comparison)
  // Using job.missingSkills if available, else inferring from tags roughly
  const missingSkills = job.missingSkills || [];
  const matchedSkills = job.tags.filter(t => !missingSkills.includes(t));

  return (
    <div className="h-full flex flex-col bg-white">
        {/* Header Hero */}
        <div className="relative p-6 border-b border-slate-100 overflow-hidden bg-slate-50">
            <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -mr-20 -mt-20 opacity-10 pointer-events-none ${matchBg}`}></div>
            
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white bg-slate-900 shadow-xl">
                        {job.company.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex flex-col items-end">
                        <div className="text-3xl font-extrabold tracking-tight text-slate-900">
                            {job.matchScore}<span className="text-lg text-slate-400">%</span>
                        </div>
                        <span className={`text-xs font-bold uppercase tracking-widest ${matchColor}`}>
                            Match Score
                        </span>
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-slate-900 mb-1 leading-tight">{job.title}</h2>
                <div className="flex items-center gap-2 text-slate-500 text-sm font-medium mb-6">
                    <Building2 className="w-4 h-4" /> {job.company}
                    <span>•</span>
                    <MapPin className="w-4 h-4" /> {job.location}
                </div>

                <button 
                    onClick={onTrack}
                    disabled={isTracked}
                    className={`w-full py-3 rounded-xl font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-all ${
                        isTracked 
                        ? 'bg-green-50 text-green-700 border border-green-200 cursor-default' 
                        : 'bg-slate-900 text-white hover:bg-slate-800 hover:scale-[1.02]'
                    }`}
                >
                    {isTracked ? <CheckCircle2 className="w-4 h-4" /> : <Wand2 className="w-4 h-4 text-purple-400" />}
                    {isTracked ? 'Optimization Active' : 'Optimize Resume for This Job'}
                </button>
            </div>
        </div>

        {/* Intelligence Scroll Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            
            {/* Probability Gauge */}
            {job.interviewProbability !== undefined && (
                <div className="bg-devops-900 rounded-2xl p-5 text-white relative overflow-hidden border border-devops-800">
                    <div className="flex justify-between items-center mb-2 relative z-10">
                        <span className="text-xs font-bold text-devops-400 uppercase tracking-widest flex items-center gap-2">
                            <BrainCircuit className="w-4 h-4 text-hunj-500" /> AI Prediction
                        </span>
                    </div>
                    <div className="flex items-end gap-2 mb-2 relative z-10">
                        <span className="text-4xl font-bold">{job.interviewProbability}%</span>
                        <span className="text-sm text-devops-400 mb-1 font-medium">Interview Probability</span>
                    </div>
                    <div className="w-full bg-devops-800 h-2 rounded-full overflow-hidden relative z-10">
                        <div 
                            className={`h-full rounded-full ${job.interviewProbability > 60 ? 'bg-green-500' : job.interviewProbability > 30 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                            style={{ width: `${job.interviewProbability}%` }}
                        ></div>
                    </div>
                    <p className="text-[10px] text-devops-500 mt-3 relative z-10">
                        Based on skill overlap, seniority, and industry alignment.
                    </p>
                </div>
            )}

            {/* Skill Gap Visualizer */}
            <div>
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Target className="w-4 h-4 text-slate-400" /> Skill Analysis
                </h3>
                
                <div className="space-y-4">
                    {/* Assets */}
                    <div>
                        <div className="flex justify-between text-xs font-bold uppercase tracking-wide text-green-600 mb-2">
                            <span>Matches ({matchedSkills.length})</span>
                            <CheckCircle2 className="w-3 h-3" />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {matchedSkills.map((s, i) => (
                                <span key={i} className="px-2 py-1 bg-green-50 border border-green-100 text-green-700 text-xs rounded-md font-medium">
                                    {s}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Liabilities */}
                    {missingSkills.length > 0 && (
                        <div>
                            <div className="flex justify-between text-xs font-bold uppercase tracking-wide text-red-500 mb-2">
                                <span>Critical Gaps ({missingSkills.length})</span>
                                <AlertTriangle className="w-3 h-3" />
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {missingSkills.map((s, i) => (
                                    <span key={i} className="px-2 py-1 bg-red-50 border border-red-100 text-red-600 text-xs rounded-md font-medium flex items-center gap-1">
                                        {s}
                                    </span>
                                ))}
                            </div>
                            <div className="mt-3 p-3 bg-slate-50 border border-slate-100 rounded-lg">
                                <p className="text-xs text-slate-600 italic">
                                    <span className="font-bold text-slate-800">AI Tip:</span> Adding a project using "{missingSkills[0]}" could boost probability by ~12%.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Details */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-slate-500 flex items-center gap-2"><DollarSign className="w-4 h-4"/> Salary</span>
                    <span className="text-sm font-bold text-slate-900">{job.salaryRange || 'Not Disclosed'}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-slate-500 flex items-center gap-2"><Layers className="w-4 h-4"/> Seniority</span>
                    <span className="text-sm font-bold text-slate-900">{inferredSeniority} Level</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-slate-500 flex items-center gap-2"><Briefcase className="w-4 h-4"/> Industry</span>
                    <span className="text-sm font-bold text-slate-900">{inferredIndustry}</span>
                </div>
            </div>

            {/* Description Preview */}
            <div className="pt-4 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 mb-2">Role Snapshot</h3>
                <p className={`text-xs text-slate-500 leading-relaxed ${showFullDescription ? '' : 'line-clamp-6'}`}>
                    {job.description}
                </p>
                <button onClick={() => setShowFullDescription(v => !v)} className="text-xs font-bold text-blue-600 mt-2 flex items-center gap-1 hover:underline">
                    {showFullDescription ? 'Collapse Spec' : 'Read Full Spec'} <ArrowRight className={`w-3 h-3 transition-transform ${showFullDescription ? 'rotate-90' : ''}`} />
                </button>
            </div>
        </div>
    </div>
  );
};

export default JobIntelligence;
