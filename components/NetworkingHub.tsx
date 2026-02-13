
import React, { useState, useEffect } from 'react';
import { JobAnalysis, NetworkingStrategy } from '../types';
import { generateNetworkingStrategy } from '../services/geminiService';
import { Users, Mail, Copy, Check, Loader2, Search, ArrowUpRight, Zap } from 'lucide-react';

interface NetworkingHubProps {
  job: JobAnalysis;
  strategy: NetworkingStrategy | null | undefined;
  onUpdate: (strategy: NetworkingStrategy) => void;
}

const NetworkingHub: React.FC<NetworkingHubProps> = ({ job, strategy, onUpdate }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!strategy && !isLoading) {
        fetchStrategy();
    }
  }, []);

  const fetchStrategy = async () => {
    setIsLoading(true);
    try {
        const result = await generateNetworkingStrategy(job);
        onUpdate(result);
    } catch (e) {
        console.error(e);
    } finally {
        setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
      navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
  };

  if (isLoading) {
      return (
          <div className="h-full flex flex-col items-center justify-center text-devops-400 gap-4">
              <div className="w-16 h-16 bg-devops-800 rounded-full flex items-center justify-center relative">
                  <div className="absolute inset-0 border-4 border-t-accent-500 border-devops-700 rounded-full animate-spin"></div>
                  <Users className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm font-medium animate-pulse">Mapping network graph for {job.company}...</p>
          </div>
      );
  }

  if (!strategy) return null;

  return (
    <div className="h-full overflow-y-auto pr-2 pb-10 custom-scrollbar">
        <div className="space-y-8">
            {/* Header */}
            <div className="bg-gradient-to-br from-green-900/40 to-devops-900 border border-green-500/20 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-[50px]"></div>
                <div className="relative z-10">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
                        <Zap className="w-5 h-5 text-green-400" />
                        Network Graph
                    </h2>
                    <p className="text-sm text-devops-300">
                        Connecting with these specific roles at <span className="text-white font-bold">{job.company}</span> increases interview probability by ~40%.
                    </p>
                </div>
            </div>

            {/* Target Roles */}
            <div>
                <h3 className="text-xs font-bold text-devops-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    High-Value Targets
                </h3>
                <div className="flex flex-wrap gap-3">
                    {strategy.targetRoles.map((role, i) => (
                        <a 
                            key={i}
                            href={`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(role + ' ' + job.company)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="group flex items-center gap-3 bg-devops-800 border border-devops-700 hover:border-green-500/50 hover:bg-devops-700 text-white px-4 py-3 rounded-xl transition-all shadow-sm hover:shadow-lg hover:-translate-y-0.5"
                        >
                            <div className="bg-devops-900 p-1.5 rounded-lg text-devops-400 group-hover:text-green-400 transition-colors">
                                <Search className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-medium">{role}</span>
                            <ArrowUpRight className="w-3 h-3 text-devops-500 group-hover:text-white transition-colors ml-1" />
                        </a>
                    ))}
                </div>
            </div>

            {/* Outreach Templates */}
            <div>
                <h3 className="text-xs font-bold text-devops-400 uppercase tracking-widest mb-4">
                    Outreach Scripts
                </h3>
                <div className="grid grid-cols-1 gap-4">
                    {strategy.outreachTemplates.map((template, i) => (
                        <div key={i} className="group bg-devops-900 border border-devops-700 rounded-2xl p-6 hover:border-devops-500 transition-all shadow-md relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-devops-700 group-hover:bg-green-500 transition-colors"></div>
                            
                            <div className="flex justify-between items-start mb-4 pl-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-devops-900 bg-devops-200 px-2 py-1 rounded uppercase tracking-wide">
                                        {template.type}
                                    </span>
                                </div>
                                <button 
                                    onClick={() => copyToClipboard(`Subject: ${template.subject}\n\n${template.body}`, `template-${i}`)}
                                    className="flex items-center gap-1.5 text-xs font-bold text-devops-400 hover:text-white bg-devops-800 hover:bg-devops-700 px-3 py-1.5 rounded-lg transition-all"
                                >
                                    {copied === `template-${i}` ? <Check className="w-3 h-3 text-green-400"/> : <Copy className="w-3 h-3"/>}
                                    {copied === `template-${i}` ? 'Copied' : 'Copy'}
                                </button>
                            </div>
                            
                            <div className="pl-2 space-y-3">
                                <div className="text-sm text-white font-medium border-b border-devops-800 pb-2">
                                    <span className="text-devops-500 mr-2">Subject:</span> {template.subject}
                                </div>
                                <div className="text-sm text-devops-300 whitespace-pre-wrap font-mono leading-relaxed bg-devops-950/50 p-3 rounded-lg border border-devops-800">
                                    {template.body}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
};

export default NetworkingHub;
