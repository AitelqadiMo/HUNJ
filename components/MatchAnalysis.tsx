
import React from 'react';
import { ATSScore, JobAnalysis, SkillMatch } from '../types';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { TrendingUp, Activity, AlertCircle, CheckCircle2, Zap } from 'lucide-react';

interface MatchAnalysisProps {
  score: ATSScore | null;
  job: JobAnalysis | null;
  skillMatches: SkillMatch[];
  isLoading: boolean;
}

const MatchAnalysis: React.FC<MatchAnalysisProps> = ({ score, job, skillMatches, isLoading }) => {
  if (isLoading || !score) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-devops-400 gap-3 bg-devops-900/50 rounded-2xl border border-devops-800 animate-pulse">
        <Activity className="w-8 h-8 opacity-50" />
        <span className="text-xs font-mono uppercase tracking-widest">Calculating Vectors...</span>
      </div>
    );
  }

  // Calculate dimensions for Radar Chart
  const skillsScore = Math.round((skillMatches.filter(m => m.status === 'match').length / Math.max(1, skillMatches.length)) * 100);
  const impactScore = score.breakdown.quantifiable * 10; // 0-10 scale -> 0-100
  const atsScore = score.breakdown.structure * 10;
  const relevanceScore = job?.hiringProbability || 50;
  const seniorityScore = 80; // Simulated for demo

  const data = [
    { subject: 'Skills', A: skillsScore, fullMark: 100 },
    { subject: 'Impact', A: impactScore, fullMark: 100 },
    { subject: 'Relevance', A: relevanceScore, fullMark: 100 },
    { subject: 'Seniority', A: seniorityScore, fullMark: 100 },
    { subject: 'ATS Fit', A: atsScore, fullMark: 100 },
  ];

  const overall = score.total;
  const color = overall >= 80 ? '#10b981' : overall >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div className="bg-devops-900 border border-devops-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        {/* Ambient Background */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-hunj-600/10 rounded-full blur-[60px] pointer-events-none"></div>

        {/* Header */}
        <div className="flex justify-between items-start mb-2 relative z-10">
            <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-hunj-500" /> Match Intelligence
                </h3>
                <p className="text-[10px] text-devops-400 mt-1">Multi-vector analysis against JD</p>
            </div>
            <div className="text-right">
                <div className="text-3xl font-display font-bold text-white leading-none">{overall}%</div>
                <div className={`text-[10px] font-bold uppercase tracking-wider flex items-center justify-end gap-1 ${overall >= 80 ? 'text-green-400' : 'text-yellow-400'}`}>
                    {overall >= 80 ? <TrendingUp className="w-3 h-3"/> : <AlertCircle className="w-3 h-3"/>}
                    {overall >= 80 ? 'High Fit' : 'Optimization Req.'}
                </div>
            </div>
        </div>

        {/* Radar Chart */}
        <div className="h-[200px] w-full -ml-4 relative z-10">
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                    <PolarGrid stroke="#334155" strokeDasharray="3 3" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="Current" dataKey="A" stroke={color} fill={color} fillOpacity={0.3} />
                </RadarChart>
            </ResponsiveContainer>
        </div>

        {/* Key Drivers */}
        <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="bg-devops-950/50 p-2 rounded-lg border border-devops-800 flex items-center gap-2">
                <div className={`w-1.5 h-full rounded-full ${skillsScore > 70 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <div>
                    <div className="text-[9px] text-devops-500 uppercase font-bold">Skill Gap</div>
                    <div className="text-xs text-white font-bold">{skillMatches.filter(m => m.status === 'missing').length} Missing</div>
                </div>
            </div>
            <div className="bg-devops-950/50 p-2 rounded-lg border border-devops-800 flex items-center gap-2">
                <div className={`w-1.5 h-full rounded-full ${impactScore > 70 ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <div>
                    <div className="text-[9px] text-devops-500 uppercase font-bold">Impact</div>
                    <div className="text-xs text-white font-bold">{score.breakdown.quantifiable}/10 Score</div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default MatchAnalysis;
