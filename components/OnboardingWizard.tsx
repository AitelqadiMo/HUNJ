
import React, { useState } from 'react';
import { ResumeData } from '../types';
import { parseResumeFromText, updateResumeWithAI } from '../services/geminiService';
import { extractTextFromPDF } from '../services/pdfService';
import { Target, Upload, FileText, ArrowRight, Loader2, Sparkles, Check, Briefcase, User, File } from 'lucide-react';

interface OnboardingWizardProps {
  initialResume: ResumeData;
  onComplete: (resume: ResumeData, targetRole: string) => void;
}

const COMMON_ROLES = [
    "Software Engineer", "Product Manager", "DevOps Engineer", "Data Scientist", 
    "UX Designer", "Marketing Manager", "Sales Representative", "Customer Success",
    "Business Analyst", "Project Manager", "Executive Assistant", "Accountant"
];

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ initialResume, onComplete }) => {
  const [step, setStep] = useState<'role' | 'method' | 'import' | 'manual' | 'processing'>('role');
  const [targetRole, setTargetRole] = useState('');
  const [importText, setImportText] = useState('');
  const [manualSkills, setManualSkills] = useState('');
  const [manualExp, setManualExp] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  // STEP 1: TARGET ROLE
  const handleRoleSelect = (role: string) => {
      setTargetRole(role);
  };

  const handleRoleSubmit = () => {
      if (targetRole.trim()) setStep('method');
  };

  // STEP 2: FILE UPLOAD HANDLER
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.type === 'application/pdf') {
          setFileName(file.name);
          setIsProcessing(true);
          try {
              const text = await extractTextFromPDF(file);
              setImportText(text);
          } catch (err) {
              alert("Failed to read PDF. Please try copying text manually.");
              setFileName(null);
          } finally {
              setIsProcessing(false);
          }
      } else {
          // For txt files or fallback
          const reader = new FileReader();
          reader.onload = (ev) => {
              setImportText(ev.target?.result as string);
              setFileName(file.name);
          };
          reader.readAsText(file);
      }
  };

  // STEP 3: PROCESS IMPORT
  const handleImportSubmit = async () => {
      if (!importText.trim()) return;
      setIsProcessing(true);
      setStep('processing');
      try {
          const parsed = await parseResumeFromText(importText);
          const merged: ResumeData = {
              ...initialResume,
              ...parsed,
              role: targetRole, // Enforce the target role
              id: initialResume.id // Keep original ID
          };
          // Enhance summary slightly with the target role context
          const enhanced = await updateResumeWithAI(merged, `Ensure the summary mentions targeting a ${targetRole} position.`);
          onComplete(enhanced, targetRole);
      } catch (e) {
          console.error("Import failed", e);
          // Fallback to basic merge if AI fails
          onComplete({ ...initialResume, role: targetRole }, targetRole);
      }
  };

  // STEP 3: PROCESS MANUAL
  const handleManualSubmit = async () => {
      setIsProcessing(true);
      setStep('processing');
      try {
          const prompt = `
            Create a professional resume for a ${targetRole}.
            Candidate has:
            - Experience: ${manualExp}
            - Key Skills: ${manualSkills}
            
            Generate a strong summary, 2 placeholder experience entries relevant to the role, and a skills list.
          `;
          const generated = await updateResumeWithAI(initialResume, prompt);
          onComplete({ ...generated, role: targetRole }, targetRole);
      } catch (e) {
          console.error("Generation failed", e);
          onComplete({ ...initialResume, role: targetRole }, targetRole);
      }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md">
        
        {/* Background blobs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-hunj-600/20 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-neon-cyan/20 rounded-full blur-[80px]"></div>

        <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col min-h-[500px] animate-in fade-in zoom-in-95 duration-300">
            
            {/* Header / Progress */}
            <div className="p-8 pb-0 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="bg-hunj-600 p-2 rounded-lg shadow-lg shadow-hunj-600/20">
                        <Target className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-xl text-slate-900 tracking-tight">Profile Setup</span>
                </div>
                <div className="flex gap-2">
                    {['role', 'method', 'data'].map((s, i) => {
                        const activeIndex = ['role', 'method', 'import', 'manual', 'processing'].indexOf(step);
                        const currentIdx = step === 'role' ? 0 : step === 'method' ? 1 : 2;
                        return (
                            <div key={i} className={`h-1.5 w-8 rounded-full transition-all duration-500 ${i <= currentIdx ? 'bg-hunj-600' : 'bg-slate-200'}`}></div>
                        );
                    })}
                </div>
            </div>

            <div className="flex-1 p-8 flex flex-col">
                
                {/* STEP 1: ROLE */}
                {step === 'role' && (
                    <div className="flex-1 flex flex-col justify-center space-y-6 animate-in slide-in-from-right-8">
                        <div className="text-center space-y-2">
                            <h2 className="text-3xl font-extrabold text-slate-900">What is your target role?</h2>
                            <p className="text-slate-500">We'll tailor your resume and job matches to this position.</p>
                        </div>

                        <div className="relative max-w-md mx-auto w-full">
                            <input 
                                type="text"
                                value={targetRole}
                                onChange={(e) => setTargetRole(e.target.value)}
                                placeholder="e.g. Senior Product Designer"
                                className="w-full bg-slate-50 border-2 border-slate-200 focus:border-hunj-600 focus:bg-white rounded-xl p-4 text-lg text-slate-900 outline-none transition-all text-center placeholder-slate-400"
                                onKeyDown={(e) => e.key === 'Enter' && handleRoleSubmit()}
                                autoFocus
                            />
                        </div>

                        <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
                            {COMMON_ROLES.map(role => (
                                <button
                                    key={role}
                                    onClick={() => handleRoleSelect(role)}
                                    className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${targetRole === role ? 'bg-hunj-600 border-hunj-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:border-hunj-300 hover:text-hunj-600'}`}
                                >
                                    {role}
                                </button>
                            ))}
                        </div>

                        <div className="mt-auto flex justify-center pt-8">
                            <button 
                                onClick={handleRoleSubmit}
                                disabled={!targetRole.trim()}
                                className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-full font-bold text-lg hover:bg-hunj-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-slate-900/10 hover:shadow-hunj-600/30 hover:scale-105"
                            >
                                Next Step <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 2: METHOD */}
                {step === 'method' && (
                    <div className="flex-1 flex flex-col justify-center space-y-8 animate-in slide-in-from-right-8">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">How should we build your profile?</h2>
                            <p className="text-slate-500">Import existing data or let AI generate a starter template.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <button 
                                onClick={() => setStep('import')}
                                className="group bg-slate-50 border border-slate-200 hover:border-hunj-500 hover:bg-white p-6 rounded-2xl text-left transition-all hover:shadow-xl hover:shadow-hunj-500/10 hover:-translate-y-1 relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-hunj-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                                <div className="bg-white w-12 h-12 rounded-xl flex items-center justify-center mb-4 border border-slate-200 group-hover:border-hunj-500/50 shadow-sm">
                                    <Upload className="w-6 h-6 text-hunj-600" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 mb-1">Import Resume</h3>
                                <p className="text-sm text-slate-500">Upload PDF or paste text. We'll parse skills, experience, and education instantly.</p>
                            </button>

                            <button 
                                onClick={() => setStep('manual')}
                                className="group bg-slate-50 border border-slate-200 hover:border-purple-500 hover:bg-white p-6 rounded-2xl text-left transition-all hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1 relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                                <div className="bg-white w-12 h-12 rounded-xl flex items-center justify-center mb-4 border border-slate-200 group-hover:border-purple-500/50 shadow-sm">
                                    <Sparkles className="w-6 h-6 text-purple-600" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 mb-1">Create with AI</h3>
                                <p className="text-sm text-slate-500">Start from scratch. Answer two questions and we'll generate a professional template.</p>
                            </button>
                        </div>
                        
                        <button onClick={() => setStep('role')} className="text-slate-400 hover:text-slate-600 text-sm text-center underline">
                            Back to Role Selection
                        </button>
                    </div>
                )}

                {/* STEP 3: IMPORT */}
                {step === 'import' && (
                    <div className="flex-1 flex flex-col space-y-6 animate-in slide-in-from-right-8">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-slate-900">Import Resume Data</h2>
                            <p className="text-slate-500 text-sm">Upload a PDF or paste text to parse your experience.</p>
                        </div>

                        {!fileName ? (
                            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors relative group cursor-pointer">
                                <input 
                                    type="file" 
                                    accept=".pdf,.txt"
                                    onChange={handleFileUpload}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-slate-200 group-hover:scale-110 transition-transform">
                                    {isProcessing ? <Loader2 className="w-8 h-8 text-hunj-600 animate-spin" /> : <Upload className="w-8 h-8 text-hunj-600" />}
                                </div>
                                <p className="font-bold text-slate-700">Click to upload PDF</p>
                                <p className="text-xs text-slate-400 mt-1">or drag and drop here</p>
                            </div>
                        ) : (
                            <div className="bg-hunj-50 border border-hunj-100 rounded-xl p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="bg-white p-2 rounded-lg">
                                        <File className="w-5 h-5 text-hunj-600" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-slate-900">{fileName}</p>
                                        <p className="text-xs text-slate-500">Ready to parse</p>
                                    </div>
                                </div>
                                <button onClick={() => { setFileName(null); setImportText(''); }} className="text-xs text-slate-400 hover:text-red-500">
                                    Remove
                                </button>
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
                            value={importText}
                            onChange={(e) => setImportText(e.target.value)}
                            placeholder="Paste resume text contents here..."
                            className="flex-1 w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-900 focus:outline-none focus:border-hunj-500 resize-none font-mono min-h-[100px]"
                        />

                        <div className="flex gap-4">
                            <button onClick={() => setStep('method')} className="flex-1 py-3 text-slate-500 hover:text-slate-800 font-medium">
                                Back
                            </button>
                            <button 
                                onClick={handleImportSubmit}
                                disabled={!importText.trim() || isProcessing}
                                className="flex-[2] py-3 bg-hunj-600 hover:bg-hunj-500 text-white rounded-xl font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                {isProcessing ? 'Analyzing...' : 'Analyze & Build Profile'}
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 3: MANUAL / AI GEN */}
                {step === 'manual' && (
                    <div className="flex-1 flex flex-col justify-center space-y-6 animate-in slide-in-from-right-8">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-slate-900">Quick Details</h2>
                            <p className="text-slate-500 text-sm">Help the AI generate a relevant baseline for <span className="text-slate-900 font-bold">{targetRole}</span>.</p>
                        </div>

                        <div className="space-y-4 max-w-md mx-auto w-full">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Years of Experience / Level</label>
                                <input 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-900 focus:border-purple-500 outline-none"
                                    placeholder="e.g. 5 years, Senior Level"
                                    value={manualExp}
                                    onChange={(e) => setManualExp(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Top 3 Skills</label>
                                <textarea 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-900 focus:border-purple-500 outline-none resize-none h-24"
                                    placeholder="e.g. React, Node.js, Team Leadership"
                                    value={manualSkills}
                                    onChange={(e) => setManualSkills(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4 max-w-md mx-auto w-full">
                            <button onClick={() => setStep('method')} className="flex-1 py-3 text-slate-500 hover:text-slate-800 font-medium">
                                Back
                            </button>
                            <button 
                                onClick={handleManualSubmit}
                                disabled={!manualSkills.trim()}
                                className="flex-[2] py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold shadow-lg disabled:opacity-50"
                            >
                                Generate Profile
                            </button>
                        </div>
                    </div>
                )}

                {/* PROCESSING */}
                {step === 'processing' && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in duration-500">
                        <div className="relative">
                            <div className="w-24 h-24 border-4 border-slate-200 border-t-hunj-600 rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Sparkles className="w-10 h-10 text-hunj-600 animate-pulse" />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-2">Building Your Profile</h3>
                            <p className="text-slate-500">AI is structuring your resume for {targetRole}...</p>
                        </div>
                    </div>
                )}

            </div>
        </div>
    </div>
  );
};

export default OnboardingWizard;
