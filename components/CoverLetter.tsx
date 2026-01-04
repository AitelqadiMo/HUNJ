import React, { useState } from 'react';
import { CoverLetter, JobAnalysis, ResumeData } from '../types';
import { generateCoverLetter } from '../services/geminiService';
import { Loader2, Copy, Download, RefreshCw } from 'lucide-react';

interface CoverLetterProps {
  resume: ResumeData;
  job: JobAnalysis;
  currentLetter: CoverLetter | null;
  onUpdate: (letter: CoverLetter) => void;
}

const CoverLetterEditor: React.FC<CoverLetterProps> = ({ resume, job, currentLetter, onUpdate }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [tone, setTone] = useState<CoverLetter['tone']>('Formal');

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const content = await generateCoverLetter(resume, job, tone);
      onUpdate({ content, tone });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-devops-800 rounded-xl border border-devops-700 shadow-xl overflow-hidden h-full flex flex-col">
      <div className="p-4 border-b border-devops-700 flex justify-between items-center bg-devops-900/50">
        <h2 className="text-lg font-semibold text-white">Cover Letter Architect</h2>
        <div className="flex gap-2">
            <select 
                value={tone}
                onChange={(e) => setTone(e.target.value as any)}
                className="bg-devops-900 border border-devops-600 text-devops-200 text-sm rounded-lg px-3 py-1.5 focus:border-accent-500 outline-none"
            >
                <option value="Formal">Formal</option>
                <option value="Conversational">Conversational</option>
                <option value="Enthusiastic">Enthusiastic</option>
                <option value="Technical">Technical</option>
            </select>
            <button 
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex items-center gap-2 px-3 py-1.5 bg-accent-600 text-white rounded-lg text-sm hover:bg-accent-500 disabled:opacity-50"
            >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                {currentLetter ? 'Regenerate' : 'Generate'}
            </button>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        {currentLetter ? (
            <textarea 
                className="w-full h-full bg-devops-900 border border-devops-700 rounded-lg p-6 text-devops-100 leading-relaxed resize-none focus:ring-2 focus:ring-accent-500 outline-none font-serif"
                value={currentLetter.content}
                onChange={(e) => onUpdate({ ...currentLetter, content: e.target.value })}
            />
        ) : (
            <div className="h-full flex flex-col items-center justify-center text-devops-400 opacity-60">
                <div className="w-16 h-16 border-2 border-dashed border-devops-600 rounded-lg flex items-center justify-center mb-4">
                    <PenTool className="w-8 h-8" />
                </div>
                <p>Select a tone and click Generate to create a tailored cover letter.</p>
            </div>
        )}
      </div>
      
      {currentLetter && (
        <div className="p-4 border-t border-devops-700 bg-devops-900/50 flex justify-end gap-3">
             <button className="flex items-center gap-2 px-4 py-2 text-devops-300 hover:text-white transition-colors">
                <Copy className="w-4 h-4" /> Copy
             </button>
             <button className="flex items-center gap-2 px-4 py-2 bg-devops-700 text-white rounded-lg hover:bg-devops-600 transition-colors">
                <Download className="w-4 h-4" /> Download PDF
             </button>
        </div>
      )}
    </div>
  );
};

import { PenTool } from 'lucide-react';

export default CoverLetterEditor;