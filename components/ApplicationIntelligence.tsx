
import React, { useState } from 'react';
import { Application } from '../types';
import { BrainCircuit, AlertTriangle, CheckCircle2, TrendingUp, GitCompare, ArrowRight, ShieldCheck, Target, Layers } from 'lucide-react';

interface ApplicationIntelligenceProps {
  application: Application;
}

const ApplicationIntelligence: React.FC<ApplicationIntelligenceProps> = ({ application }) => {
  const [activeTab, setActiveTab] = useState<'insights' | 'gaps' | 'version'>('insights');
  const score = application.atsScore?.total || 0;
  const analysis = application.jobAnalysis;
  const resume = application.resumes.find(r => r.id === application.activeResumeId);

  // Mock comparison logic (in a real app, this would be computed)
  const missingSkills = application.skillMatches.filter(m => m.status === 'missing');
  const strongSkills = application.skillMatches.filter(m => m.status === 'match');

  return (
    <div className="h-full bg-white flex flex-col">
        
        {/* Score Hero */}
        <div className="p-6 bg-slate-50 border-b border-slate-100 text-center">
            <div className="relative inline-block">
                <svg className="w-32 h-32 transform -rotate-90">
                    <circle cx="64" cy="64" r="60" stroke="#e2e8f0" strokeWidth="8" fill="transparent" />
                    <circle 
                        cx="64" cy="64" r="60" 
                        stroke={score >= 80 ? '#10b981' : score >= 60 ? '#3b82f6' : '#f59e0b'} 
                        strokeWidth="8" 
                        fill="transparent" 
                        strokeDasharray={377} 
                        strokeDashoffset={377 - (377 * score) / 100} 
                        className="transition-all duration-1000 ease-out"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-slate-900">{score}</span>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Match</span>
                </div>
            </div>
            <div className="mt-4 flex justify-center gap-4 text-xs font-medium text-slate-600">
                <div className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-slate-400"/> ATS Optimized</div>
                <div className="flex items-center gap-1"><Target className="w-3 h-3 text-slate-400"/> Role Aligned</div>
            </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100">
            <button 
                onClick={() => setActiveTab('insights')} 
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide border-b-2 transition-colors ${activeTab === 'insights' ? 'border-hunj-600 text-hunj-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
                Analysis
            </button>
            <button 
                onClick={() => setActiveTab('gaps')} 
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide border-b-2 transition-colors ${activeTab === 'gaps' ? 'border-hunj-600 text-hunj-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
                Skill Gaps
            </button>
            <button 
                onClick={() => setActiveTab('version')} 
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide border-b-2 transition-colors ${activeTab === 'version' ? 'border-hunj-600 text-hunj-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
                Resume
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            
            {activeTab === 'insights' && (
                <div className="space-y-6">
                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                        <h4 className="text-sm font-bold text-indigo-900 mb-2 flex items-center gap-2">
                            <BrainCircuit className="w-4 h-4 text-indigo-600" />
                            Why this score?
                        </h4>
                        <p className="text-xs text-indigo-800 leading-relaxed">
                            This role heavily emphasizes <strong>{analysis?.requiredSkills.slice(0,2).join(' & ')}</strong>. 
                            Your resume version <span className="font-mono bg-white px-1 rounded border border-indigo-200 text-indigo-600">{resume?.versionName}</span> successfully highlights these in the summary and experience, increasing interview probability by ~25%.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Ranking Factors</h4>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg">
                                <span className="text-sm font-medium text-slate-700">Industry Fit</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="bg-green-500 h-full" style={{width: '90%'}}></div>
                                    </div>
                                    <span className="text-xs font-bold text-green-600">High</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg">
                                <span className="text-sm font-medium text-slate-700">Seniority Match</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="bg-blue-500 h-full" style={{width: '75%'}}></div>
                                    </div>
                                    <span className="text-xs font-bold text-blue-600">Good</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg">
                                <span className="text-sm font-medium text-slate-700">Keyword Density</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="bg-amber-500 h-full" style={{width: '50%'}}></div>
                                    </div>
                                    <span className="text-xs font-bold text-amber-600">Avg</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'gaps' && (
                <div className="space-y-6">
                    {missingSkills.length > 0 && (
                        <div>
                            <h4 className="text-xs font-bold text-red-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <AlertTriangle className="w-3 h-3" /> Missing Critical Skills
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {missingSkills.map((m, i) => (
                                    <span key={i} className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-100 rounded-lg text-xs font-bold">
                                        {m.skill}
                                    </span>
                                ))}
                            </div>
                            <p className="text-xs text-slate-500 mt-2 italic">Adding these could boost your match score by ~15%.</p>
                        </div>
                    )}

                    <div>
                        <h4 className="text-xs font-bold text-green-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <CheckCircle2 className="w-3 h-3" /> Strong Matches
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {strongSkills.map((m, i) => (
                                <span key={i} className="px-3 py-1.5 bg-green-50 text-green-600 border border-green-100 rounded-lg text-xs font-bold">
                                    {m.skill}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'version' && (
                <div className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="flex items-center gap-2 mb-2">
                            <Layers className="w-4 h-4 text-slate-500" />
                            <span className="text-xs font-bold text-slate-500 uppercase">Active Version</span>
                        </div>
                        <h3 className="font-bold text-slate-900">{resume?.versionName}</h3>
                        <p className="text-xs text-slate-500">Created on {new Date(resume?.timestamp || 0).toLocaleDateString()}</p>
                    </div>

                    <div className="border-t border-slate-100 pt-4">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Performance History</h4>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-slate-600">Interview Rate</span>
                            <span className="text-xs font-bold text-green-600">12%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-green-500 h-full" style={{width: '12%'}}></div>
                        </div>
                    </div>

                    <button className="w-full py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-2">
                        <GitCompare className="w-3 h-3" /> Compare Versions
                    </button>
                </div>
            )}

        </div>
    </div>
  );
};

export default ApplicationIntelligence;
