
import React, { useState } from 'react';
import { RawDataSource } from '../types';
import { Upload, Linkedin, Github, Mic, FileText, Plus, Loader2, CheckCircle2 } from 'lucide-react';
import { extractTextFromPDF } from '../services/pdfService';

interface DataSourcePanelProps {
  sources: RawDataSource[];
  onAddSource: (source: RawDataSource) => void;
}

const DataSourcePanel: React.FC<DataSourcePanelProps> = ({ sources, onAddSource }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [textInput, setTextInput] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      setIsProcessing(true);
      try {
          let text = '';
          if (file.type === 'application/pdf') {
              text = await extractTextFromPDF(file);
          } else {
              text = await file.text();
          }

          const newSource: RawDataSource = {
              id: `src-${Date.now()}`,
              type: 'Resume PDF',
              name: file.name,
              content: text,
              dateAdded: Date.now(),
              status: 'Processing',
              entityCount: 0
          };
          onAddSource(newSource);
      } catch (e) {
          console.error(e);
      } finally {
          setIsProcessing(false);
      }
  };

  const handleManualAdd = () => {
      if (!textInput.trim()) return;
      const newSource: RawDataSource = {
          id: `src-${Date.now()}`,
          type: 'Manual Entry',
          name: 'Manual Brain Dump',
          content: textInput,
          dateAdded: Date.now(),
          status: 'Processing',
          entityCount: 0
      };
      onAddSource(newSource);
      setTextInput('');
  };

  return (
    <div className="h-full flex flex-col p-6 md:p-8 bg-slate-50">
        <h2 className="text-3xl font-display font-bold text-slate-900 mb-2">Data Sources</h2>
        <p className="text-slate-500 mb-8">Connect external career data to feed the intelligence engine.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {/* Upload */}
            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 flex flex-col items-center justify-center bg-white hover:border-indigo-500 hover:bg-indigo-50 transition-all cursor-pointer relative group">
                <input type="file" accept=".pdf,.txt" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileUpload} />
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-indigo-100 group-hover:text-indigo-600">
                    <Upload className="w-6 h-6 text-slate-400 group-hover:text-indigo-600" />
                </div>
                <h3 className="font-bold text-slate-700">Upload Resume</h3>
                <p className="text-xs text-slate-400">PDF or TXT</p>
            </div>

            {/* LinkedIn (Simulated) */}
            <button className="border border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center bg-white hover:shadow-md transition-all group">
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Linkedin className="w-6 h-6 text-[#0077b5]" />
                </div>
                <h3 className="font-bold text-slate-700">LinkedIn Sync</h3>
                <p className="text-xs text-slate-400">Import Profile</p>
            </button>

            {/* GitHub (Simulated) */}
            <button className="border border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center bg-white hover:shadow-md transition-all group">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Github className="w-6 h-6 text-slate-800" />
                </div>
                <h3 className="font-bold text-slate-700">GitHub Repos</h3>
                <p className="text-xs text-slate-400">Analyze Code</p>
            </button>

            {/* Voice (Simulated) */}
            <button className="border border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center bg-white hover:shadow-md transition-all group">
                <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Mic className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="font-bold text-slate-700">Voice Memo</h3>
                <p className="text-xs text-slate-400">Tell your story</p>
            </button>
        </div>

        {/* Manual Entry */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-8 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><FileText className="w-4 h-4 text-slate-400"/> Quick Paste</h3>
            <div className="flex gap-4">
                <textarea 
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-24"
                    placeholder="Paste bullet points, performance reviews, or project descriptions here..."
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                />
                <button 
                    onClick={handleManualAdd}
                    className="px-6 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors flex flex-col items-center justify-center gap-1"
                >
                    <Plus className="w-5 h-5" /> Add
                </button>
            </div>
        </div>

        {/* Source List */}
        <div>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Connected Sources</h3>
            <div className="space-y-3">
                {sources.map(source => (
                    <div key={source.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-slate-100 rounded-lg">
                                {source.type === 'Resume PDF' && <FileText className="w-5 h-5 text-slate-500" />}
                                {source.type === 'Manual Entry' && <FileText className="w-5 h-5 text-indigo-500" />}
                                {source.type === 'LinkedIn Import' && <Linkedin className="w-5 h-5 text-[#0077b5]" />}
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800 text-sm">{source.name}</h4>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <span>{new Date(source.dateAdded).toLocaleDateString()}</span>
                                    <span>•</span>
                                    <span className={`${source.status === 'Processing' ? 'text-orange-500' : 'text-green-600'} font-medium`}>{source.status}</span>
                                </div>
                            </div>
                        </div>
                        {source.status === 'Processing' && <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />}
                        {source.status === 'Structured' && (
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                                {source.entityCount} Entities <CheckCircle2 className="w-3 h-3 text-green-500" />
                            </div>
                        )}
                    </div>
                ))}
                {sources.length === 0 && (
                    <div className="text-center py-10 text-slate-400">No data sources added yet.</div>
                )}
            </div>
        </div>
    </div>
  );
};

export default DataSourcePanel;
