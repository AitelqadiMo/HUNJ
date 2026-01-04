import React, { useState, useEffect } from 'react';
import { JobAnalysis, NetworkingStrategy } from '../types';
import { generateNetworkingStrategy } from '../services/geminiService';
import { Users, Mail, Copy, Check, Loader2, Search, ArrowUpRight } from 'lucide-react';

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
          <div className="h-full flex flex-col items-center justify-center text-devops-400">
              <Loader2 className="w-10 h-10 animate-spin mb-4 text-accent-500" />
              <p>Generatng networking strategy...</p>
          </div>
      );
  }

  if (!strategy) return null;

  return (
    <div className="h-full overflow-y-auto pr-2 pb-10">
        <div className="bg-devops-800 rounded-xl border border-devops-700 p-6 mb-6">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Users className="w-6 h-6 text-accent-500" />
                        Networking Automation
                    </h2>
                    <p className="text-sm text-devops-400 mt-1">Connect with the right people at {job.company} to increase your chances by 10x.</p>
                </div>
            </div>

            {/* Target Roles */}
            <div className="mb-8">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    <Search className="w-4 h-4 text-devops-400" />
                    Who to connect with
                </h3>
                <div className="flex flex-wrap gap-3">
                    {strategy.targetRoles.map((role, i) => (
                        <a 
                            key={i}
                            href={`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(role + ' ' + job.company)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 bg-devops-900 border border-devops-600 hover:border-accent-500 text-devops-200 hover:text-white px-4 py-2 rounded-lg transition-all group"
                        >
                            <span>{role}</span>
                            <ArrowUpRight className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                        </a>
                    ))}
                </div>
            </div>

            {/* Outreach Templates */}
            <div>
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-devops-400" />
                    Outreach Templates
                </h3>
                <div className="space-y-6">
                    {strategy.outreachTemplates.map((template, i) => (
                        <div key={i} className="bg-devops-900/50 rounded-lg border border-devops-700 p-4 relative group">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-xs font-bold text-accent-400 uppercase tracking-wide bg-accent-500/10 px-2 py-1 rounded">
                                    {template.type}
                                </span>
                                <button 
                                    onClick={() => copyToClipboard(`Subject: ${template.subject}\n\n${template.body}`, `template-${i}`)}
                                    className="text-xs flex items-center gap-1 text-devops-400 hover:text-white transition-colors"
                                >
                                    {copied === `template-${i}` ? <Check className="w-3 h-3 text-success"/> : <Copy className="w-3 h-3"/>}
                                    {copied === `template-${i}` ? 'Copied' : 'Copy'}
                                </button>
                            </div>
                            
                            <div className="space-y-2">
                                <div className="text-sm font-medium text-devops-200 border-b border-devops-700 pb-2">
                                    Subject: <span className="text-white">{template.subject}</span>
                                </div>
                                <div className="text-sm text-devops-300 whitespace-pre-wrap font-serif leading-relaxed">
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