
import React, { useEffect, useState } from 'react';
import { Application, UserProfile, CareerInsights } from '../types';
import { generateCareerInsights } from '../services/geminiService';
import { ArrowRight, Target, TrendingUp, AlertCircle, Briefcase, CheckCircle2, Clock, Calendar, Loader2 } from 'lucide-react';

interface CareerOverviewProps {
  profile: UserProfile;
  onNavigateToApp: (appId: string) => void;
  onFindJobs: () => void;
  onEditProfile: () => void;
}

const CareerOverview: React.FC<CareerOverviewProps> = ({ profile, onNavigateToApp, onFindJobs, onEditProfile }) => {
  const apps = profile.applications;
  const [insights, setInsights] = useState<CareerInsights | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  
  useEffect(() => {
      const fetchInsights = async () => {
          setIsLoadingInsights(true);
          try {
              const data = await generateCareerInsights(profile);
              setInsights(data);
          } catch (e) {
              console.error("Failed to fetch insights", e);
          } finally {
              setIsLoadingInsights(false);
          }
      };
      
      if (!insights) {
          fetchInsights();
      }
  }, []);

  // Analytics
  const totalApps = apps.length;
  const activeApps = apps.filter(a => a.status !== 'Rejected' && a.status !== 'Offer').length;
  const interviews = apps.filter(a => a.status === 'Interviewing').length;
  const offers = apps.filter(a => a.status === 'Offer').length;
  
  // Calculate specific "Success Rate" (Apps that moved past Applied)
  const engagedApps = apps.filter(a => ['Interviewing', 'Offer'].includes(a.status)).length;
  const conversionRate = totalApps > 0 ? Math.round((engagedApps / totalApps) * 100) : 0;

  // Derive "Next Steps"
  const recentDrafts = apps.filter(a => a.status === 'Drafting').slice(0, 3);
  const upcomingInterviews = apps.filter(a => a.status === 'Interviewing').slice(0, 2);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-24 md:pb-8">
        
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Good Morning, {profile.masterResume.fullName.split(' ')[0] || 'Hunter'}</h1>
                <p className="text-slate-500 font-medium">Here's your career trajectory update.</p>
            </div>
            <div className="text-sm font-medium text-slate-500 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
        </div>

        {/* Stats Grid - Bento Style */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Main Stat */}
            <div className="md:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-[80px] group-hover:bg-blue-600/30 transition-colors"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4 text-blue-300">
                        <Target className="w-5 h-5" />
                        <span className="text-xs font-bold uppercase tracking-wider">Pipeline Health</span>
                    </div>
                    <div className="flex items-end gap-2 mb-2">
                        <span className="text-5xl font-bold">{activeApps}</span>
                        <span className="text-lg text-slate-400 mb-1">Active Applications</span>
                    </div>
                    <div className="w-full bg-slate-700/50 h-2 rounded-full overflow-hidden mt-4">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(activeApps * 10, 100)}%` }}></div>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">Target: 10 active applications per week</p>
                </div>
            </div>

            {/* Conversion */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-4 text-green-600">
                    <TrendingUp className="w-5 h-5" />
                    <span className="text-xs font-bold uppercase tracking-wider">Conversion</span>
                </div>
                <span className="text-4xl font-bold text-slate-900">{conversionRate}%</span>
                <p className="text-xs text-slate-500 mt-2">Applications leading to interviews.</p>
            </div>

            {/* Actions Needed */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-4 text-orange-500">
                    <AlertCircle className="w-5 h-5" />
                    <span className="text-xs font-bold uppercase tracking-wider">Action Items</span>
                </div>
                <span className="text-4xl font-bold text-slate-900">
                    {recentDrafts.length + upcomingInterviews.length}
                </span>
                <p className="text-xs text-slate-500 mt-2">Tasks requiring your attention.</p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Priority Feed */}
            <div className="lg:col-span-2 space-y-6">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-blue-600" />
                    Priority Focus
                </h2>

                {apps.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Target className="w-8 h-8 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Your pipeline is empty</h3>
                        <p className="text-slate-500 mb-6 max-w-md mx-auto">Start by finding a job description or pasting a link to begin your first intelligent hunt.</p>
                        <button onClick={onFindJobs} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors">
                            Find Jobs
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {upcomingInterviews.length > 0 && (
                            <div className="bg-purple-50 border border-purple-100 rounded-2xl p-5 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
                                        <Briefcase className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-purple-900">Interview Prep Needed</h3>
                                        <p className="text-sm text-purple-700">You have {upcomingInterviews.length} active interviews. Review AI questions.</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => onNavigateToApp(upcomingInterviews[0].id)}
                                    className="px-4 py-2 bg-purple-600 text-white text-sm font-bold rounded-lg hover:bg-purple-700"
                                >
                                    Prep Now
                                </button>
                            </div>
                        )}

                        {recentDrafts.map(app => (
                            <div key={app.id} className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between hover:border-blue-300 transition-colors group cursor-pointer" onClick={() => onNavigateToApp(app.id)}>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                        <Clock className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900">{app.jobTitle}</h3>
                                        <p className="text-sm text-slate-500">{app.companyName} • <span className="text-orange-500 font-medium">Draft</span></p>
                                    </div>
                                </div>
                                <div className="text-slate-300 group-hover:text-blue-600">
                                    <ArrowRight className="w-5 h-5" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Right Column: AI Insights Aggregated */}
            <div className="space-y-6">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-600" />
                    Market Pulse
                </h2>
                
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm min-h-[160px] flex flex-col justify-center">
                    {isLoadingInsights ? (
                        <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                            <Loader2 className="w-6 h-6 animate-spin" />
                            <span className="text-xs">Analyzing market...</span>
                        </div>
                    ) : insights ? (
                        <>
                            <h3 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wide">Missing High-Value Skills</h3>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {insights.missingSkills.map(skill => (
                                    <span key={skill} className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-100 rounded-lg text-xs font-bold flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" /> {skill}
                                    </span>
                                ))}
                            </div>
                            <p className="text-xs text-slate-500 italic border-t border-slate-100 pt-3">
                                {insights.recommendedAction}
                            </p>
                        </>
                    ) : (
                        <p className="text-xs text-slate-400 text-center">Update your profile to see insights.</p>
                    )}
                </div>

                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg">
                    <h3 className="font-bold text-lg mb-2">Resume Strength</h3>
                    <div className="flex items-end gap-2 mb-4">
                        {isLoadingInsights ? (
                            <div className="h-8 w-16 bg-white/20 rounded animate-pulse"></div>
                        ) : (
                            <span className="text-4xl font-bold">{insights?.resumeStrength || 85}</span>
                        )}
                        <span className="text-blue-200 mb-1">/ 100</span>
                    </div>
                    <p className="text-xs text-blue-100 leading-relaxed mb-4">
                        {insights?.marketOutlook || "Your profile is strong. Keep refining it for specific roles."}
                    </p>
                    <button 
                        onClick={onEditProfile}
                        className="w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-bold backdrop-blur-sm transition-colors"
                    >
                        Review Master
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default CareerOverview;
