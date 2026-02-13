
import React from 'react';
import { MarketTrends } from '../types';
import { TrendingUp, TrendingDown, Minus, Activity, DollarSign, Users } from 'lucide-react';

interface MarketPulseProps {
  trends: MarketTrends | null;
  role: string;
}

const MarketPulse: React.FC<MarketPulseProps> = ({ trends, role }) => {
  if (!trends) return null;

  const demand = trends.demandLevel || 'Medium';
  const salary = trends.salaryTrend || 'Stable';
  const skills = trends.topSkills || [];

  return (
    <div className="bg-devops-950 border-b border-devops-800 text-white overflow-hidden">
        <div className="max-w-[1600px] mx-auto flex items-center h-12 px-4 gap-8 text-xs font-mono">
            <div className="flex items-center gap-2 text-devops-400 shrink-0">
                <Activity className="w-4 h-4 text-hunj-500" />
                <span className="uppercase tracking-wider font-bold">Market Pulse: {role}</span>
            </div>

            <div className="h-4 w-px bg-devops-800"></div>

            <div className="flex items-center gap-6 overflow-x-auto no-scrollbar flex-1">
                <div className="flex items-center gap-2 whitespace-nowrap">
                    <span className="text-devops-500">Demand</span>
                    <span className={`font-bold flex items-center gap-1 ${
                        demand === 'High' ? 'text-green-400' : 
                        demand === 'Medium' ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                        {demand.toUpperCase()}
                        {demand === 'High' ? <TrendingUp className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                    </span>
                </div>

                <div className="flex items-center gap-2 whitespace-nowrap">
                    <span className="text-devops-500">Salary Trend</span>
                    <span className={`font-bold flex items-center gap-1 ${
                        salary === 'Up' ? 'text-green-400' : 
                        salary === 'Stable' ? 'text-blue-400' : 'text-red-400'
                    }`}>
                        {salary.toUpperCase()}
                        {salary === 'Up' ? <TrendingUp className="w-3 h-3" /> : salary === 'Down' ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                    </span>
                </div>

                <div className="flex items-center gap-2 whitespace-nowrap">
                    <span className="text-devops-500">Hot Skills</span>
                    <div className="flex gap-1">
                        {skills.slice(0, 3).map((skill, i) => (
                            <span key={i} className="px-1.5 py-0.5 bg-devops-800 rounded text-devops-300">
                                {skill}
                            </span>
                        ))}
                    </div>
                </div>
                
                {trends.hiringMomentum && (
                    <div className="flex items-center gap-2 whitespace-nowrap">
                        <span className="text-devops-500">Momentum</span>
                        <div className="w-16 h-1.5 bg-devops-800 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-hunj-500" 
                                style={{ width: `${trends.hiringMomentum}%` }}
                            ></div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default MarketPulse;
