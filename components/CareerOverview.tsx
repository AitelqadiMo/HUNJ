import React, { useEffect, useState } from 'react';
import { UserProfile, CareerInsights, Application, JobAnalysis } from '../types';
import { generateCareerInsights } from '../services/geminiService';
import JobRecommendations from './JobRecommendations';
import { 
    ArrowRight, Target, TrendingUp, TrendingDown, Activity, Zap, 
    CheckCircle2, AlertCircle, BarChart3, Layers, Calendar, 
    ArrowUpRight, BrainCircuit, Crosshair, Briefcase, Award, MoveRight, Sparkles 
} from 'lucide-react';
import { 
    Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, 
    AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, Cell 
} from 'recharts';

interface CareerOverviewProps {
  profile: UserProfile;
  onNavigateToApp: (appId: string) => void;
  onFindJobs: () => void;
  onEditProfile: () => void;
  onUpdateProfile: (p: UserProfile) => void;
  onAnalyzeJob?: (analysis: JobAnalysis, text: string) => void;
}

// --- SUB-COMPONENTS ---

const CountUp = ({ end, suffix = '', color = 'text-slate-900' }: { end: number, suffix?: string, color?: string }) => {
    const [count, setCount] = useState(0);
    useEffect(() => {
        let start = 0;
        const duration = 1500;
        const increment = end / (duration / 16);
        const timer = setInterval(() => {
            start += increment;
            if (start >= end) {
                setCount(end);
                clearInterval(timer);
            } else {
                setCount(Math.floor(start));
            }
        }, 16);
        return () => clearInterval(timer);
    }, [end]);
    return <span className={`font-display tracking-tight ${color}`}>{count}{suffix}</span>;
};

const StatusMetric = ({ label, value, sub, trend, inverse = false }: { label: string, value: number, sub?: string, trend?: 'up' | 'down', inverse?: boolean }) => (
    <div className={`flex flex-col px-4 py-2 border-r border-slate-200 last:border-0 ${inverse ? 'bg-devops-900 text-white' : ''}`}>
        <span className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${inverse ? 'text-devops-400' : 'text-slate-400'}`}>{label}</span>
        <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold"><CountUp end={value} suffix={sub || ''} color={inverse ? 'text-white' : 'text-slate-900'} /></span>
            {trend && (
                <span className={`text-xs font-bold flex items-center ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                    {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                </span>
            )}
        </div>
    </div>
);

const InsightCard = ({ title, desc, action, type }: { title: string, desc: string, action: string, type: 'opportunity' | 'risk' | 'success' }) => (
    <div className={`p-4 rounded-xl border-l-4 transition-all hover:scale-[1.02] cursor-pointer group ${
        type === 'opportunity' ? 'bg-blue-50 border-blue-500' : 
        type === 'risk' ? 'bg-red-50 border-red-500' : 
        'bg-green-50 border-green-500'
    }`}>
        <div className="flex justify-between items-start mb-1">
            <h4 className={`text-xs font-bold uppercase tracking-wide ${
                type === 'opportunity' ? 'text-blue-700' : 
                type === 'risk' ? 'text-red-700' : 
                'text-green-700'
            }`}>{title}</h4>
            {type === 'opportunity' && <Zap className="w-3 h-3 text-blue-500" />}
            {type === 'risk' && <AlertCircle className="w-3 h-3 text-red-500" />}
            {type === 'success' && <TrendingUp className="w-3 h-3 text-green-500" />}
        </div>
        <p className="text-sm text-slate-700 font-medium mb-3 leading-snug">{desc}</p>
        <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-slate-900 transition-colors">
            Fix Now <ArrowRight className="w-3 h-3" />
        </div>
    </div>
);

// --- MAIN COMPONENT ---

const CareerOverview: React.FC<CareerOverviewProps> = ({ profile, onNavigateToApp, onFindJobs, onEditProfile, onUpdateProfile, onAnalyzeJob }) => {
  const [insights, setInsights] = useState<CareerInsights | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);

  // Computed Metrics
  const apps = profile.applications;
  const activeApps = apps.filter(a => a.status !== 'Rejected' && a.status !== 'Offer');
  const interviews = apps.filter(a => a.status === 'Interviewing');
  const offers = apps.filter(a => a.status === 'Offer');
  
  const totalApps = apps.length || 1; // Prevent div by zero
  const interviewRate = Math.round((interviews.length / totalApps) * 100);
  const offerRate = Math.round((offers.length / totalApps) * 100);
  
  const weeklyGoal = 10;
  const weeklyProgress = apps.filter(a => {
      const created = new Date(a.dateCreated).getTime();
      return created >= Date.now() - (7 * 24 * 60 * 60 * 1000);
  }).length;
  const networkingGoal = 3;
  const networkingProgress = profile.dailyGoals?.filter(g => /connect|network/i.test(g.text) && g.completed).length || 0;
  const avgATS = apps.length > 0
      ? Math.round(apps.reduce((sum, app) => sum + (app.atsScore?.total || 0), 0) / apps.length)
      : 0;
  const resumeStrength = avgATS > 0
      ? avgATS
      : Math.min(100, 20 + (profile.masterResume.skills.length * 4) + (profile.masterResume.experience.length * 8));
  const marketMatch = Math.max(0, Math.min(100, insights?.resumeStrength || Math.round(
      apps.length > 0
          ? apps.reduce((sum, app) => sum + (app.jobAnalysis?.hiringProbability || 50), 0) / apps.length
          : 50
  )));
  const reviewedCount = apps.filter(a => ['Applied', 'Interviewing', 'Offer', 'Rejected'].includes(a.status)).length;
  const insightCards = [
      {
          title: 'Optimization Opportunity',
          desc: insights?.recommendedAction || 'Improve summary specificity and quantified outcomes to increase screening quality.',
          action: 'View Analysis',
          type: 'opportunity' as const
      },
      {
          title: 'Keyword Gap',
          desc: (insights?.missingSkills?.length || 0) > 0
              ? `Missing skills detected: ${(insights?.missingSkills || []).slice(0, 2).join(', ')}.`
              : 'No major keyword gaps detected in the current profile baseline.',
          action: 'Fix Resume',
          type: (insights?.missingSkills?.length || 0) > 0 ? 'risk' as const : 'success' as const
      },
      {
          title: 'Momentum',
          desc: `${weeklyProgress} applications this week with ${interviewRate}% interview conversion.`,
          action: 'See Details',
          type: interviewRate >= 15 ? 'success' as const : 'opportunity' as const
      }
  ];

  useEffect(() => {
      const fetchInsights = async () => {
          setIsLoadingInsights(true);
          try {
              const data = await generateCareerInsights(profile);
              setInsights(data);
          } catch (e) {
              console.error(e);
          } finally {
              setIsLoadingInsights(false);
          }
      };
      if (profile.masterResume.skills.length > 0) fetchInsights();
  }, [profile.masterResume.skills.length, profile.masterResume.experience.length, apps.length]);

  // --- CHARTS DATA ---
  
  const funnelData = [
      { name: 'Applied', value: apps.length, fill: '#64748b' },
      { name: 'Reviewed', value: reviewedCount, fill: '#3b82f6' },
      { name: 'Interview', value: interviews.length, fill: '#8b5cf6' },
      { name: 'Offer', value: offers.length, fill: '#10b981' },
  ];

  const leadershipMentions = profile.masterResume.experience.flatMap(e => e.bullets).filter(b => /(led|managed|owned|mentored|coordinated)/i.test(b.text)).length;
  const quantifiedBullets = profile.masterResume.experience.flatMap(e => e.bullets).filter(b => /(\d+%|\$\d+|\d+[xX])/.test(b.text)).length;
  const totalBullets = Math.max(1, profile.masterResume.experience.flatMap(e => e.bullets).length);
  const radarData = [
      { subject: 'Tech Skills', A: Math.min(100, profile.masterResume.skills.length * 8), fullMark: 100 },
      { subject: 'Leadership', A: Math.min(100, leadershipMentions * 14), fullMark: 100 },
      { subject: 'Impact', A: Math.min(100, Math.round((quantifiedBullets / totalBullets) * 100)), fullMark: 100 },
      { subject: 'Education', A: profile.masterResume.education.trim().length > 40 ? 85 : profile.masterResume.education.trim().length > 5 ? 65 : 30, fullMark: 100 },
      { subject: 'Market Fit', A: marketMatch, fullMark: 100 },
  ];
  const impactSeries = apps
      .slice(0, 7)
      .map((app) => app.atsScore?.total || 40)
      .reverse();

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
        
        {/* 1. STICKY COMMAND STRIP */}
        <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-20 flex items-center justify-between overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-6">
                    <StatusMetric label="Resume Strength" value={resumeStrength} trend={resumeStrength >= 70 ? 'up' : 'down'} />
                    <StatusMetric label="Market Match" value={marketMatch} sub="%" trend={marketMatch >= 70 ? 'up' : 'down'} />
                    <StatusMetric label="Interview Rate" value={interviewRate} sub="%" trend={interviewRate > 10 ? 'up' : 'down'} />
                    <StatusMetric label="Active Pipeline" value={activeApps.length} />
                </div>
                
                <div className="flex items-center gap-4 pl-6 border-l border-slate-200">
                    <div className="text-right hidden md:block">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Momentum</div>
                        <div className="text-sm font-bold text-slate-900">{weeklyProgress >= 5 ? 'High Velocity' : weeklyProgress >= 2 ? 'Building' : 'Needs Action'}</div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-green-100 border border-green-200 flex items-center justify-center">
                        <Activity className="w-5 h-5 text-green-600 animate-pulse" />
                    </div>
                </div>
            </div>
        </div>

        <div className="max-w-[1600px] mx-auto px-6 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* 2. LEFT COLUMN: STRATEGY (Col-3) */}
                <div className="lg:col-span-3 space-y-6">
                    
                    {/* Daily Missions */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Target className="w-4 h-4 text-hunj-600" /> Action Loop
                            </h3>
                            <span className="text-[10px] bg-slate-100 px-2 py-1 rounded text-slate-500 font-bold">{profile.dailyGoals?.filter(g=>g.completed).length}/{profile.dailyGoals?.length}</span>
                        </div>
                        <div className="space-y-3">
                            {profile.dailyGoals?.map(goal => (
                                <div key={goal.id} className="flex items-start gap-3 group cursor-pointer" onClick={() => {
                                    const updated = profile.dailyGoals?.map(g => g.id === goal.id ? {...g, completed: !g.completed} : g);
                                    onUpdateProfile({...profile, dailyGoals: updated});
                                }}>
                                    <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors ${goal.completed ? 'bg-green-500 border-green-500' : 'border-slate-300 group-hover:border-hunj-500'}`}>
                                        {goal.completed && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                    </div>
                                    <div>
                                        <p className={`text-sm font-medium transition-colors ${goal.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{goal.text}</p>
                                        <p className="text-[10px] text-slate-400">+{goal.xp} XP</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* AI Strategic Insights */}
                    <div className="bg-devops-900 rounded-2xl border border-devops-800 p-5 shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 opacity-10"><BrainCircuit className="w-24 h-24 text-white" /></div>
                        <h3 className="text-white font-bold flex items-center gap-2 mb-6 relative z-10">
                            <Sparkles className="w-4 h-4 text-hunj-400" /> Strategic Intel
                        </h3>
                        <div className="space-y-3 relative z-10">
                            {insightCards.map(card => (
                                <InsightCard key={card.title} title={card.title} desc={card.desc} action={card.action} type={card.type} />
                            ))}
                        </div>
                    </div>
                </div>

                {/* 3. CENTER COLUMN: INTELLIGENCE (Col-6) */}
                <div className="lg:col-span-6 space-y-6">
                    {onAnalyzeJob && (
                        <JobRecommendations masterResume={profile.masterResume} onApply={onAnalyzeJob} />
                    )}
                    
                    {/* Pipeline Funnel */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                        <div className="flex justify-between items-end mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Application Funnel</h3>
                                <p className="text-xs text-slate-500">Conversion efficiency per stage</p>
                            </div>
                            <div className="flex gap-2">
                                {(profile.preferences.targetIndustries || []).slice(0, 2).map(ind => (
                                    <span key={ind} className="text-xs font-bold px-2 py-1 bg-blue-50 text-blue-600 rounded">{ind}</span>
                                ))}
                                {(profile.preferences.targetIndustries || []).length === 0 && (
                                    <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-500 rounded">General</span>
                                )}
                            </div>
                        </div>
                        
                        <div className="h-48 w-full flex items-end justify-between gap-2 px-4 relative">
                            {/* Connecting Lines (Simulated with absolute borders or SVG if needed, simplified here) */}
                            {funnelData.map((stage, i) => (
                                <div key={i} className="flex flex-col items-center gap-2 w-full group relative">
                                    <div className="text-xs font-bold text-slate-500 absolute -top-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {i > 0 ? `${Math.round((stage.value / funnelData[0].value) * 100)}%` : '100%'}
                                    </div>
                                    <div 
                                        className="w-full rounded-t-lg transition-all duration-500 hover:opacity-80 relative"
                                        style={{ height: `${(stage.value / (funnelData[0].value || 1)) * 150}px`, backgroundColor: stage.fill }}
                                    >
                                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-sm font-bold text-slate-900">{stage.value}</div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stage.name}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Resume Performance Analytics */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <BarChart3 className="w-4 h-4 text-slate-400" /> Resume Impact
                            </h3>
                            <div className="h-32 flex items-end gap-1">
                                {impactSeries.length > 0 ? impactSeries.map((val, i) => (
                                    <div key={i} className="flex-1 bg-slate-100 rounded-t-sm relative group overflow-hidden">
                                        <div 
                                            className="absolute bottom-0 left-0 w-full bg-hunj-500 transition-all duration-1000 group-hover:bg-hunj-400" 
                                            style={{ height: `${val}%` }}
                                        ></div>
                                    </div>
                                )) : [50, 50, 50, 50, 50, 50, 50].map((val, i) => (
                                    <div key={i} className="flex-1 bg-slate-100 rounded-t-sm relative group overflow-hidden">
                                        <div className="absolute bottom-0 left-0 w-full bg-hunj-300" style={{ height: `${val}%` }}></div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between mt-2 text-[10px] text-slate-400 uppercase font-bold">
                                <span>V1</span>
                                <span>Current</span>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-center items-center text-center">
                            <div className="relative w-32 h-32 mb-4">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="64" cy="64" r="60" stroke="#f1f5f9" strokeWidth="8" fill="transparent" />
                                    <circle cx="64" cy="64" r="60" stroke="#10b981" strokeWidth="8" fill="transparent" strokeDasharray={377} strokeDashoffset={377 - (377 * (marketMatch / 100))} className="transition-all duration-1000 ease-out" />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-3xl font-bold text-slate-900">{marketMatch}</span>
                                    <span className="text-[10px] text-slate-400 uppercase font-bold">Market Fit</span>
                                </div>
                            </div>
                            <p className="text-xs text-slate-500 max-w-[180px]">Your profile aligns with <strong className="text-slate-900">{profile.preferences.targetRoles?.[0] || 'target role'}</strong> requirements.</p>
                        </div>
                    </div>
                </div>

                {/* 4. RIGHT COLUMN: POSITIONING (Col-3) */}
                <div className="lg:col-span-3 space-y-6">
                    
                    {/* Weekly Momentum */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-slate-400" /> Weekly Momentum
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="font-bold text-slate-600">Applications</span>
                                    <span className="text-slate-400">{weeklyProgress}/{weeklyGoal}</span>
                                </div>
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                    <div className="bg-hunj-500 h-full rounded-full" style={{ width: `${Math.min(100, Math.round((weeklyProgress / weeklyGoal) * 100))}%` }}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="font-bold text-slate-600">Networking</span>
                                    <span className="text-slate-400">{networkingProgress}/{networkingGoal}</span>
                                </div>
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                    <div className="bg-accent-500 h-full rounded-full" style={{ width: `${Math.min(100, Math.round((networkingProgress / networkingGoal) * 100))}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Skill Radar */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-1 shadow-sm relative">
                        <div className="absolute top-4 left-4 z-10">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Skill Matrix</h3>
                        </div>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
                                    <PolarGrid stroke="#e2e8f0" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 9, fontWeight: 700 }} />
                                    <Radar name="Profile" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Positioning Tags */}
                    <div className="bg-devops-900 rounded-2xl border border-devops-800 p-5 shadow-lg">
                        <h3 className="text-xs font-bold text-devops-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Crosshair className="w-3 h-3" /> Positioning
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            <span className="px-3 py-1 bg-devops-800 text-white text-xs font-bold rounded-lg border border-devops-700">{profile.preferences.targetRoles?.[0] || 'Role Targeting'}</span>
                            <span className="px-3 py-1 bg-devops-800 text-white text-xs font-bold rounded-lg border border-devops-700">{profile.preferences.remotePreference || 'Work Mode'}</span>
                            <span className="px-3 py-1 bg-hunj-600 text-white text-xs font-bold rounded-lg border border-hunj-500 shadow-glow">{marketMatch >= 80 ? 'Top 20% Match' : 'Improving Match'}</span>
                        </div>
                        <button onClick={onEditProfile} className="w-full mt-4 py-2 bg-devops-800 hover:bg-devops-700 text-devops-300 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2">
                            Adjust Settings <MoveRight className="w-3 h-3" />
                        </button>
                    </div>

                </div>
            </div>
        </div>
    </div>
  );
};

export default CareerOverview;
