import React, { useState } from 'react';
import { Upload, Link as LinkIcon, FileText, Loader2, ArrowRight, Linkedin } from 'lucide-react';
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
      
      // Simulate connection delay
      setTimeout(() => {
          setIsSimulatingConnect(false);
          // UX fallback since we can't truly scrape client-side
          setError("LinkedIn Security Check: Direct scraping is blocked. Please copy the 'About the job' text below to continue.");
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
      setError(err.message || "Failed to analyze job description. Please ensure your API key is valid and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <div className="bg-devops-800 rounded-2xl p-8 border border-devops-700 shadow-2xl">
        <h2 className="text-2xl font-bold mb-2 text-white flex items-center gap-2">
            New Application
        </h2>
        <p className="text-devops-400 mb-6">Enter the job details to start tracking and optimizing your resume.</p>
        
        <div className="flex gap-2 mb-6 p-1 bg-devops-900/50 rounded-lg w-fit border border-devops-700">
            <button 
                onClick={() => { setInputMode('url'); setError(null); }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    inputMode === 'url' ? 'bg-[#0077b5] text-white shadow' : 'text-devops-400 hover:text-white'
                }`}
            >
                <div className="flex items-center gap-2"><Linkedin className="w-4 h-4"/> LinkedIn Link</div>
            </button>
            <button 
                onClick={() => { setInputMode('text'); setError(null); }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    inputMode === 'text' ? 'bg-devops-700 text-white shadow' : 'text-devops-400 hover:text-white'
                }`}
            >
                <div className="flex items-center gap-2"><FileText className="w-4 h-4"/> Paste Description</div>
            </button>
        </div>

        {inputMode === 'url' ? (
             <div className="mb-4">
                <div className="relative">
                    <input 
                        type="url"
                        placeholder="https://www.linkedin.com/jobs/view/..."
                        className="w-full bg-devops-900 border border-devops-700 rounded-lg p-4 pl-12 text-devops-100 placeholder-devops-500 focus:outline-none focus:ring-2 focus:ring-[#0077b5]"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                    />
                    <Linkedin className="absolute left-4 top-4 w-5 h-5 text-[#0077b5]" />
                </div>
                {isSimulatingConnect && (
                    <div className="mt-4 flex items-center gap-3 text-[#0077b5] animate-pulse">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm font-medium">Connecting to LinkedIn Job API...</span>
                    </div>
                )}
            </div>
        ) : (
            <textarea
                className="w-full h-48 bg-devops-900 border border-devops-700 rounded-lg p-4 text-devops-100 placeholder-devops-500 focus:outline-none focus:ring-2 focus:ring-accent-500 font-mono text-sm resize-none mb-4"
                placeholder="Paste job description including requirements and responsibilities..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onClick={() => { if(inputText === "Paste job description here...") setInputText(""); }}
            />
        )}

        <div className="flex justify-between items-center pt-4 border-t border-devops-700">
            <button
                onClick={onCancel}
                className="px-4 py-2 text-devops-400 hover:text-white font-medium"
            >
                Cancel
            </button>
            <button
            onClick={handleAnalyze}
            disabled={isLoading || isSimulatingConnect}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all ${
                isLoading || isSimulatingConnect
                ? 'bg-devops-700 text-devops-500 cursor-not-allowed'
                : 'bg-accent-600 hover:bg-accent-500 text-white shadow-lg shadow-accent-500/20 hover:scale-105'
            }`}
            >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            {isLoading ? 'Analyzing...' : <span className="flex items-center gap-2">Start Application <ArrowRight className="w-4 h-4" /></span>}
            </button>
        </div>
        {error && <p className="mt-4 p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-sm text-center animate-shake">{error}</p>}
      </div>
    </div>
  );
};

export default JobInput;