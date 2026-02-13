
import React, { useState } from 'react';
import { Upload, Link as LinkIcon, FileText, Loader2, ArrowRight, Linkedin, Sparkles, Search } from 'lucide-react';
import { JobAnalysis } from '../types';
import { analyzeJobDescription } from '../services/geminiService';

interface JobInputProps {
  onJobAnalyzed: (analysis: JobAnalysis, text: string) => void;
  onCancel: () => void;
}

const JobInput: React.FC<JobInputProps> = ({ onJobAnalyzed, onCancel }) => {
  const [inputText, setInputText] = useState('');
  const [url, setUrl] = useState('');
  const [inputMode, setInputMode] = useState<'text' | 'url'>('url');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSimulatingConnect, setIsSimulatingConnect] = useState(false);

  const handleSimulateLinkedInConnect = () => {
      if (!url.includes('linkedin.com')) {
          setError("Please enter a valid LinkedIn URL");
          return;
      }
      setIsSimulatingConnect(true);
      setError(null);
      
      setTimeout(() => {
          setIsSimulatingConnect(false);
          setError("LinkedIn Security: Please copy the 'About the job' text below for 100% accuracy.");
          setInputMode('text');
          setInputText("Paste job description here..."); 
      }, 1500);
  };

  const handleAnalyze = async () => {
    let textToAnalyze = inputText;
    
    if (inputMode === 'url' && !inputText) {
        handleSimulateLinkedInConnect();
        return;
    }
    
    if (!textToAnalyze.trim() || textToAnalyze === "Paste job description here...") {
        setError("Please enter the job description text.");
        return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const analysis = await analyzeJobDescription(textToAnalyze);
      onJobAnalyzed(analysis, textToAnalyze);
    } catch (err: any) {
      console.error("Job Analysis Error:", err);
      setError(err.message || "Failed to analyze job. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 min-h-[500px]">
      <div className="w-full max-w-2xl bg-devops-900/80 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl p-8 md:p-12 relative overflow-hidden animate-slide-up">
        
        {/* Background Gradients */}
        <div className="absolute top-[-50%] left-[-20%] w-[500px] h-[500px] bg-hunj-500/10 rounded-full blur-[100px] pointer-events-none animate-pulse-slow"></div>
        <div className="absolute bottom-[-50%] right-[-20%] w-[500px] h-[500px] bg-accent-500/10 rounded-full blur-[100px] pointer-events-none animate-pulse-slow"></div>

        <div className="relative z-10">
            <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-hunj-600 to-indigo-600 text-white mb-6 shadow-lg shadow-hunj-500/30 animate-float border border-white/10">
                    <Sparkles className="w-8 h-8" />
                </div>
                <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-3 tracking-tight">
                    Target a New Role
                </h2>
                <p className="text-devops-400 text-lg">
                    Feed the AI. We'll reverse-engineer the perfect application.
                </p>
            </div>

            <div className="flex justify-center gap-4 mb-8">
                <button 
                    onClick={() => { setInputMode('url'); setError(null); }}
                    className={`px-6 py-3 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
                        inputMode === 'url' 
                        ? 'bg-hunj-600 text-white shadow-lg shadow-hunj-500/30 transform scale-105' 
                        : 'text-devops-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                    <Linkedin className="w-4 h-4"/> LinkedIn URL
                </button>
                <button 
                    onClick={() => { setInputMode('text'); setError(null); }}
                    className={`px-6 py-3 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
                        inputMode === 'text' 
                        ? 'bg-hunj-600 text-white shadow-lg shadow-hunj-500/30 transform scale-105' 
                        : 'text-devops-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                    <FileText className="w-4 h-4"/> Direct Text
                </button>
            </div>

            <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-hunj-500 to-accent-500 rounded-2xl opacity-20 group-focus-within:opacity-100 transition duration-500 blur"></div>
                <div className="relative bg-devops-950 rounded-2xl border border-white/5">
                    {inputMode === 'url' ? (
                        <div className="relative">
                            <input 
                                type="url"
                                placeholder="Paste LinkedIn job URL..."
                                className="w-full bg-transparent border-0 rounded-2xl p-6 pl-14 text-white placeholder-devops-500 focus:ring-0 text-lg transition-all"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                            />
                            <div className="absolute left-5 top-6 text-devops-500 group-focus-within:text-hunj-400 transition-colors">
                                <Search className="w-6 h-6" />
                            </div>
                        </div>
                    ) : (
                        <textarea
                            className="w-full h-48 bg-transparent border-0 rounded-2xl p-6 text-white placeholder-devops-500 focus:ring-0 text-sm resize-none font-mono leading-relaxed"
                            placeholder="Paste the full job description here..."
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onClick={() => { if(inputText === "Paste job description here...") setInputText(""); }}
                        />
                    )}
                </div>
            </div>

            {isSimulatingConnect && (
                <div className="mt-6 flex flex-col items-center justify-center text-hunj-400 gap-3 animate-in fade-in">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="text-sm font-semibold">Handshaking with LinkedIn...</span>
                </div>
            )}

            {error && (
                <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-3 animate-shake">
                    <div className="p-2 bg-red-500/10 rounded-full shadow-sm"><ArrowRight className="w-4 h-4 rotate-180"/></div>
                    {error}
                </div>
            )}

            <div className="mt-10 flex items-center justify-between">
                <button
                    onClick={onCancel}
                    className="px-6 py-3 text-devops-400 hover:text-white font-medium transition-colors hover:bg-white/5 rounded-xl"
                >
                    Cancel
                </button>
                <button
                    onClick={handleAnalyze}
                    disabled={isLoading || isSimulatingConnect}
                    className="group relative px-8 py-4 bg-white text-devops-950 rounded-xl font-bold text-lg shadow-xl hover:shadow-white/10 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent translate-x-[-100%] group-hover:animate-shimmer"></div>
                    <span className="relative flex items-center gap-3">
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                        {isLoading ? 'Decrypting Job...' : 'Start Application'}
                    </span>
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default JobInput;
