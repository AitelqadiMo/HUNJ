
import React, { useState } from 'react';
import { ResumeData } from '../types';
import ResumeEditor from './ResumeEditor';
import { parseResumeFromText } from '../services/geminiService';
import { extractTextFromPDF } from '../services/pdfService';
import { Save, Upload, ArrowLeft, Loader2, FileText, File } from 'lucide-react';

interface ProfileEditorProps {
  resume: ResumeData;
  onUpdate: (resume: ResumeData) => void;
  onBack: () => void;
}

const ProfileEditor: React.FC<ProfileEditorProps> = ({ resume, onUpdate, onBack }) => {
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.type === 'application/pdf') {
          setFileName(file.name);
          setIsImporting(true);
          try {
              const text = await extractTextFromPDF(file);
              setImportText(text);
          } catch (err) {
              setError("Failed to read PDF. Please paste text manually.");
              setFileName(null);
          } finally {
              setIsImporting(false);
          }
      } else {
          const reader = new FileReader();
          reader.onload = (ev) => {
              setImportText(ev.target?.result as string);
              setFileName(file.name);
          };
          reader.readAsText(file);
      }
  };

  const handleImport = async () => {
    if (!importText.trim()) return;
    setIsImporting(true);
    setError(null);
    try {
      const parsedResume = await parseResumeFromText(importText);
      // Preserve ID but update content
      onUpdate({ ...parsedResume, id: resume.id });
      setShowImport(false);
      setImportText('');
      setFileName(null);
    } catch (e) {
      setError("Failed to parse resume text. Please ensure it's readable.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-64px)] flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-white rounded-lg text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Master Profile</h1>
            <p className="text-slate-500 text-sm">This is the source of truth for all your applications.</p>
          </div>
        </div>
        <button 
          onClick={() => setShowImport(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:border-hunj-500 hover:text-hunj-600 transition-all shadow-sm text-slate-700"
        >
          <Upload className="w-4 h-4" /> Import Resume
        </button>
      </div>

      {/* Editor Area */}
      <div className="flex-1 overflow-hidden">
        <ResumeEditor 
          resume={resume} 
          job={null} // No job context for master profile
          onUpdate={onUpdate} 
        />
      </div>

      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-accent-600" />
                Import Resume
              </h3>
              <button 
                onClick={() => setShowImport(false)}
                className="text-slate-400 hover:text-slate-900"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4">
              <p className="text-slate-600 text-sm">
                Upload your PDF resume or paste the content below. Our AI will structure it into your Master Profile.
              </p>

              {!fileName ? (
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors relative group cursor-pointer">
                      <input 
                          type="file" 
                          accept=".pdf,.txt"
                          onChange={handleFileUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm border border-slate-200">
                          {isImporting ? <Loader2 className="w-6 h-6 animate-spin text-hunj-600" /> : <Upload className="w-6 h-6 text-hunj-600" />}
                      </div>
                      <p className="font-bold text-slate-700 text-sm">Upload PDF</p>
                  </div>
              ) : (
                  <div className="bg-hunj-50 border border-hunj-100 rounded-lg p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                          <File className="w-4 h-4 text-hunj-600" />
                          <span className="text-sm font-medium text-slate-900">{fileName}</span>
                      </div>
                      <button onClick={() => { setFileName(null); setImportText(''); }} className="text-xs text-slate-400 hover:text-red-500">Remove</button>
                  </div>
              )}

              <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-slate-400">or paste text</span>
                  </div>
              </div>

              <textarea 
                className="w-full h-48 bg-slate-50 border border-slate-200 rounded-lg p-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-accent-500 font-mono text-sm resize-none"
                placeholder="Paste resume content here..."
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
              />
              {error && (
                <p className="mt-2 text-danger text-sm bg-danger/10 p-2 rounded border border-danger/20">
                  {error}
                </p>
              )}
            </div>

            <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
              <button 
                onClick={() => setShowImport(false)}
                className="px-4 py-2 text-slate-500 hover:text-slate-900"
              >
                Cancel
              </button>
              <button 
                onClick={handleImport}
                disabled={isImporting || !importText.trim()}
                className="flex items-center gap-2 px-6 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md shadow-accent-600/20"
              >
                {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {isImporting ? 'Parsing...' : 'Import & Parse'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileEditor;
