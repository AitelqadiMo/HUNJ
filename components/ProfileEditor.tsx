import React, { useState } from 'react';
import { ResumeData } from '../types';
import ResumeEditor from './ResumeEditor';
import { parseResumeFromText } from '../services/geminiService';
import { Save, Upload, ArrowLeft, Loader2, FileText } from 'lucide-react';

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
            className="p-2 hover:bg-devops-800 rounded-lg text-devops-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Master Profile</h1>
            <p className="text-devops-400 text-sm">This is the source of truth for all your applications.</p>
          </div>
        </div>
        <button 
          onClick={() => setShowImport(true)}
          className="flex items-center gap-2 px-4 py-2 bg-devops-800 border border-devops-600 rounded-lg hover:bg-devops-700 text-white transition-all"
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-devops-800 rounded-xl border border-devops-700 shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-devops-700 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-accent-500" />
                Import Resume
              </h3>
              <button 
                onClick={() => setShowImport(false)}
                className="text-devops-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <p className="text-devops-300 mb-4 text-sm">
                Paste the text content of your current resume below. Our AI will analyze and structure it into your Master Profile.
              </p>
              <textarea 
                className="w-full h-64 bg-devops-900 border border-devops-600 rounded-lg p-4 text-devops-100 placeholder-devops-500 focus:outline-none focus:ring-2 focus:ring-accent-500 font-mono text-sm resize-none"
                placeholder="Paste resume content here..."
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
              />
              {error && (
                <p className="mt-3 text-danger text-sm bg-danger/10 p-2 rounded border border-danger/20">
                  {error}
                </p>
              )}
            </div>

            <div className="p-6 border-t border-devops-700 flex justify-end gap-3">
              <button 
                onClick={() => setShowImport(false)}
                className="px-4 py-2 text-devops-300 hover:text-white"
              >
                Cancel
              </button>
              <button 
                onClick={handleImport}
                disabled={isImporting || !importText.trim()}
                className="flex items-center gap-2 px-6 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-500 disabled:opacity-50 disabled:cursor-not-allowed"
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