
import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, ResumeData, DocumentItem } from '../types';
import ResumeEditor from './ResumeEditor';
import ResumePreview from './ResumePreview';
import DocumentLibrary from './DocumentLibrary';
import AIChatAssistant from './AIChatAssistant';
import { parseResumeFromText, updateResumeWithAI } from '../services/geminiService';
import { extractTextFromPDF } from '../services/pdfService';
import { 
    User, Briefcase, FileText, Settings, Upload, ArrowLeft, Save, 
    Linkedin, Globe, MapPin, DollarSign, Calendar, ShieldCheck, Loader2,
    CheckCircle2, AlertCircle, MessageSquarePlus, Bot, Send, Sparkles, Check,
    DownloadCloud, File, Eye, PenTool, LayoutTemplate, Plus, X
} from 'lucide-react';

interface ProfileHubProps {
  profile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  onBack: () => void;
}

const ProfileHub: React.FC<ProfileHubProps> = ({ profile, onUpdateProfile, onBack }) => {
  const [activeTab, setActiveTab] = useState<'resume' | 'preferences' | 'integrations'>('resume');
  const [resumeViewMode, setResumeViewMode] = useState<'edit' | 'preview'>('edit');
  const [isSaving, setIsSaving] = useState(false);
  
  // Import state
  const [importText, setImportText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  // Helper for tag inputs
  const [tagInputs, setTagInputs] = useState({
      tech: '',
      roles: '',
      industries: ''
  });

  const handleUpdateResume = (updatedResume: ResumeData) => {
    onUpdateProfile({
      ...profile,
      masterResume: updatedResume
    });
  };

  const handleUpdatePreferences = (field: keyof UserProfile['preferences'], value: any) => {
    onUpdateProfile({
      ...profile,
      preferences: {
        ...profile.preferences,
        [field]: value
      }
    });
  };

  const handleAddTag = (field: keyof UserProfile['preferences'], value: string) => {
      if (!value.trim()) return;
      const current = profile.preferences[field] as string[] || [];
      if (!current.includes(value.trim())) {
          handleUpdatePreferences(field, [...current, value.trim()]);
      }
  };

  const handleRemoveTag = (field: keyof UserProfile['preferences'], value: string) => {
      const current = profile.preferences[field] as string[] || [];
      handleUpdatePreferences(field, current.filter(t => t !== value));
  };

  const handleSave = () => {
    setIsSaving(true);
    // Simulate API call delay
    setTimeout(() => setIsSaving(false), 800);
  };

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
              alert("Failed to read PDF. Please try copying text manually.");
              setFileName(null);
          } finally {
              setIsImporting(false);
          }
      } else {
          // For txt files
          const reader = new FileReader();
          reader.onload = (ev) => {
              setImportText(ev.target?.result as string);
              setFileName(file.name);
          };
          reader.readAsText(file);
      }
  };

  const handleImport = async () => {
      if(!importText.trim()) return;
      setIsImporting(true);
      try {
          const parsed = await parseResumeFromText(importText);
          handleUpdateResume({ ...parsed, id: profile.masterResume.id });
          setImportText('');
          setFileName(null);
          alert("Resume parsed successfully!");
      } catch (e) {
          alert("Failed to parse resume.");
      } finally {
          setIsImporting(false);
      }
  }

  // Calculate Completeness
  const calculateCompleteness = () => {
      let score = 0;
      const r = profile.masterResume;
      const p = profile.preferences;

      if (!r) return 0; // Guard

      const checks = [
          { val: r.fullName, weight: 10 },
          { val: r.role, weight: 10 },
          { val: r.email, weight: 5 },
          { val: r.phone, weight: 5 },
          { val: r.summary, weight: 15 },
          { val: r.experience?.length > 0, weight: 20 },
          { val: r.skills?.length > 0, weight: 15 },
          { val: r.education, weight: 5 },
          { val: p.salaryExpectation, weight: 5 },
          { val: p.workAuthorization, weight: 5 },
          { val: r.certifications?.length > 0, weight: 5 } 
      ];

      checks.forEach(c => {
          if (c.val) score += c.weight;
      });

      return Math.min(100, score);
  };

  const completeness = calculateCompleteness();

  const tabs = [
      { id: 'resume', label: 'Master Resume', icon: Briefcase },
      { id: 'preferences', label: 'Job Preferences', icon: Settings },
      { id: 'integrations', label: 'Import & Sync', icon: Upload },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-64px-64px)] md:h-[calc(100vh-64px)] overflow-hidden bg-devops-50">
      
      {/* Mobile Top Navigation */}
      <div className="md:hidden bg-devops-900 border-b border-devops-800 flex flex-col shrink-0">
          <div className="flex items-center gap-3 p-4 pb-2">
              <button onClick={onBack} className="p-1 hover:bg-devops-800 rounded text-devops-400 hover:text-white">
                  <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="font-bold text-white text-lg">My Profile</h1>
              <div className="ml-auto flex items-center gap-2">
                  <div className="text-xs text-devops-400">Strength:</div>
                  <div className={`text-xs font-bold ${completeness > 80 ? 'text-green-400' : 'text-yellow-400'}`}>{completeness}%</div>
              </div>
          </div>
          <div className="flex overflow-x-auto no-scrollbar px-2 pb-2 gap-2 justify-around">
              {tabs.map(tab => (
                  <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                          activeTab === tab.id 
                          ? 'bg-hunj-600 text-white' 
                          : 'text-devops-400 bg-devops-800/50 hover:text-white'
                      }`}
                  >
                      <tab.icon className="w-3.5 h-3.5" />
                      {tab.label}
                  </button>
              ))}
          </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar Navigation */}
        <div className="hidden md:flex w-64 bg-devops-900 border-r border-devops-800 flex-col p-4 shrink-0">
            <div className="flex items-center gap-3 mb-8 px-2">
                <button onClick={onBack} className="p-1 hover:bg-devops-800 rounded text-devops-400 hover:text-white">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="font-bold text-white text-lg">My Profile</h1>
            </div>

            {/* Completeness Widget */}
            <div className="mb-6 px-2">
                <div className="flex justify-between items-center mb-1 text-xs text-devops-300">
                    <span>Profile Strength</span>
                    <span className="font-bold text-white">{completeness}%</span>
                </div>
                <div className="h-2 bg-devops-800 rounded-full overflow-hidden">
                    <div 
                        className={`h-full rounded-full transition-all duration-1000 ${
                            completeness > 80 ? 'bg-success' : completeness > 50 ? 'bg-warning' : 'bg-danger'
                        }`} 
                        style={{ width: `${completeness}%` }}
                    ></div>
                </div>
                {completeness < 100 && (
                    <p className="text-[10px] text-devops-400 mt-2 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Add certifications to reach 100%
                    </p>
                )}
            </div>

            <nav className="space-y-2 flex-1">
                {tabs.map(tab => (
                    <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-devops-800 border-l-4 border-hunj-600 text-white' : 'text-devops-400 hover:bg-devops-800 hover:text-white'}`}
                    >
                        <tab.icon className="w-5 h-5" /> {tab.label}
                    </button>
                ))}
            </nav>

            <div className="mt-auto pt-4 border-t border-devops-800">
                <div className="flex items-center gap-3 p-2 bg-devops-800/50 rounded-lg">
                    <div className="w-10 h-10 bg-hunj-600 rounded-full flex items-center justify-center text-white font-bold">
                        {profile.masterResume.fullName?.charAt(0) || 'U'}
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-bold text-white truncate">{profile.masterResume.fullName || 'User Name'}</p>
                        <p className="text-xs text-devops-400 truncate">{profile.masterResume.email || 'No email'}</p>
                    </div>
                </div>
            </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto bg-devops-50 p-4 md:p-8 relative">
            
            {/* TAB: JOB PREFERENCES */}
            {activeTab === 'preferences' && (
                <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 pb-10">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h2 className="text-xl md:text-2xl font-bold text-devops-900 mb-1">Job Preferences</h2>
                            <p className="text-sm text-devops-600">Configure your target roles and availability.</p>
                        </div>
                        <button 
                            onClick={handleSave}
                            className="flex items-center justify-center gap-2 px-6 py-2 bg-success hover:bg-green-600 text-white rounded-lg font-medium transition-all shadow-md text-xs md:text-sm"
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4" />}
                            Save
                        </button>
                    </div>

                    {/* Preferences Card */}
                    <div className="bg-white border border-devops-200 rounded-xl p-4 md:p-6 shadow-sm space-y-6">
                        
                        {/* Target Roles (Tags) */}
                        <div>
                            <label className="text-sm text-devops-700 font-bold mb-2 block">Target Roles</label>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {(profile.preferences.targetRoles || []).map(role => (
                                    <span key={role} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 border border-blue-100">
                                        {role}
                                        <button onClick={() => handleRemoveTag('targetRoles', role)} className="hover:text-blue-900"><X className="w-3 h-3"/></button>
                                    </span>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input 
                                    className="flex-1 bg-devops-50 border border-devops-200 rounded-lg px-3 py-2 text-sm focus:border-hunj-600 outline-none"
                                    placeholder="Add role (e.g. Senior DevOps Engineer)..."
                                    value={tagInputs.roles}
                                    onChange={(e) => setTagInputs({...tagInputs, roles: e.target.value})}
                                    onKeyDown={(e) => {
                                        if(e.key === 'Enter') {
                                            handleAddTag('targetRoles', tagInputs.roles);
                                            setTagInputs({...tagInputs, roles: ''});
                                        }
                                    }}
                                />
                                <button 
                                    onClick={() => {
                                        handleAddTag('targetRoles', tagInputs.roles);
                                        setTagInputs({...tagInputs, roles: ''});
                                    }}
                                    className="bg-devops-900 text-white px-4 rounded-lg text-sm"
                                >
                                    Add
                                </button>
                            </div>
                        </div>

                        {/* Tech Stack (Tags) */}
                        <div>
                            <label className="text-sm text-devops-700 font-bold mb-2 block">Preferred Tech Stack</label>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {(profile.preferences.preferredTechStack || []).map(tech => (
                                    <span key={tech} className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 border border-purple-100">
                                        {tech}
                                        <button onClick={() => handleRemoveTag('preferredTechStack', tech)} className="hover:text-purple-900"><X className="w-3 h-3"/></button>
                                    </span>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input 
                                    className="flex-1 bg-devops-50 border border-devops-200 rounded-lg px-3 py-2 text-sm focus:border-hunj-600 outline-none"
                                    placeholder="Add tech (e.g. Kubernetes, AWS)..."
                                    value={tagInputs.tech}
                                    onChange={(e) => setTagInputs({...tagInputs, tech: e.target.value})}
                                    onKeyDown={(e) => {
                                        if(e.key === 'Enter') {
                                            handleAddTag('preferredTechStack', tagInputs.tech);
                                            setTagInputs({...tagInputs, tech: ''});
                                        }
                                    }}
                                />
                                <button 
                                    onClick={() => {
                                        handleAddTag('preferredTechStack', tagInputs.tech);
                                        setTagInputs({...tagInputs, tech: ''});
                                    }}
                                    className="bg-devops-900 text-white px-4 rounded-lg text-sm"
                                >
                                    Add
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                            <div className="space-y-1.5">
                                <label className="text-xs md:text-sm text-devops-600 font-semibold">Work Authorization</label>
                                <div className="relative">
                                    <ShieldCheck className="absolute left-3 top-3.5 w-4 h-4 text-devops-400" />
                                    <select 
                                        className="w-full bg-devops-50 border border-devops-200 rounded-lg p-3 pl-10 text-sm md:text-base text-devops-900 focus:border-hunj-600 focus:ring-1 focus:ring-hunj-600 outline-none transition-all appearance-none"
                                        value={profile.preferences.workAuthorization || ''}
                                        onChange={(e) => handleUpdatePreferences('workAuthorization', e.target.value)}
                                    >
                                        <option value="US Citizen">US Citizen</option>
                                        <option value="Green Card">Green Card</option>
                                        <option value="H1B Visa">H1B Visa</option>
                                        <option value="EU Citizen">EU Citizen</option>
                                        <option value="Other">Other (Require Sponsorship)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs md:text-sm text-devops-600 font-semibold">Availability</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-3.5 w-4 h-4 text-devops-400" />
                                    <select 
                                        className="w-full bg-devops-50 border border-devops-200 rounded-lg p-3 pl-10 text-sm md:text-base text-devops-900 focus:border-hunj-600 focus:ring-1 focus:ring-hunj-600 outline-none transition-all appearance-none"
                                        value={profile.preferences.availability || ''}
                                        onChange={(e) => handleUpdatePreferences('availability', e.target.value)}
                                    >
                                        <option value="Immediate">Immediate</option>
                                        <option value="2 Weeks">2 Weeks Notice</option>
                                        <option value="1 Month">1 Month Notice</option>
                                        <option value="passive">Passively Looking</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs md:text-sm text-devops-600 font-semibold">Salary Expectation</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-3.5 w-4 h-4 text-devops-400" />
                                    <input 
                                        className="w-full bg-devops-50 border border-devops-200 rounded-lg p-3 pl-10 text-sm md:text-base text-devops-900 focus:border-hunj-600 focus:ring-1 focus:ring-hunj-600 outline-none transition-all"
                                        value={profile.preferences.salaryExpectation || ''}
                                        onChange={(e) => handleUpdatePreferences('salaryExpectation', e.target.value)}
                                        placeholder="e.g. $130k+"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs md:text-sm text-devops-600 font-semibold">Work Style</label>
                                <div className="flex gap-2 p-1 bg-devops-50 border border-devops-200 rounded-lg">
                                    {['Remote', 'Hybrid', 'On-site'].map(style => (
                                        <button
                                            key={style}
                                            onClick={() => handleUpdatePreferences('remotePreference', style)}
                                            className={`flex-1 py-2 text-xs md:text-sm rounded transition-all ${profile.preferences.remotePreference === style ? 'bg-white text-hunj-600 shadow-sm font-bold' : 'text-devops-500 hover:text-devops-900'}`}
                                        >
                                            {style}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 flex items-center gap-3">
                            <input 
                                type="checkbox" 
                                id="relocation"
                                checked={profile.preferences.relocation || false}
                                onChange={(e) => handleUpdatePreferences('relocation', e.target.checked)}
                                className="w-5 h-5 rounded bg-devops-50 border-devops-300 text-hunj-600 focus:ring-hunj-500"
                            />
                            <label htmlFor="relocation" className="text-sm text-devops-700 font-medium cursor-pointer">I am willing to relocate for the right opportunity</label>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: MASTER RESUME */}
            {activeTab === 'resume' && (
                <div className="h-full flex flex-col pb-10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2">
                        <div>
                            <h2 className="text-xl font-bold text-devops-900">Master Resume</h2>
                            <p className="text-xs text-devops-500">Edit your core experience here. This data acts as the source for all AI generations.</p>
                        </div>
                        
                        <div className="flex w-full md:w-auto bg-white border border-devops-200 rounded-lg p-1">
                            <button 
                                onClick={() => setResumeViewMode('edit')}
                                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                                    resumeViewMode === 'edit' 
                                    ? 'bg-hunj-600 text-white shadow-md' 
                                    : 'text-devops-500 hover:bg-devops-50 hover:text-devops-900'
                                }`}
                            >
                                <PenTool className="w-3 h-3" /> Editor
                            </button>
                            <button 
                                onClick={() => setResumeViewMode('preview')}
                                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                                    resumeViewMode === 'preview' 
                                    ? 'bg-hunj-600 text-white shadow-md' 
                                    : 'text-devops-500 hover:bg-devops-50 hover:text-devops-900'
                                }`}
                            >
                                <Eye className="w-3 h-3" /> Live Preview
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-hidden rounded-xl border border-devops-200 bg-white shadow-sm">
                        {resumeViewMode === 'edit' ? (
                            <ResumeEditor 
                                resume={profile.masterResume}
                                job={null} // Master resume editing doesn't need job context
                                onUpdate={handleUpdateResume}
                            />
                        ) : (
                            <ResumePreview 
                                resume={profile.masterResume}
                                job={null}
                                onThemeUpdate={(t) => handleUpdateResume({...profile.masterResume, themeConfig: t})}
                                onApplySuggestion={async (instruction) => {
                                    const updated = await updateResumeWithAI(profile.masterResume, instruction);
                                    handleUpdateResume(updated);
                                }}
                            />
                        )}
                    </div>
                </div>
            )}

            {/* TAB: INTEGRATIONS & IMPORT */}
            {activeTab === 'integrations' && (
                <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 pb-10">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-devops-900 mb-1">Sync & Import</h2>
                            <p className="text-devops-600">Connect external sources to keep your profile updated.</p>
                        </div>
                    </div>

                    {/* LinkedIn Sync */}
                    <div className="bg-white border border-devops-200 rounded-xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-6 shadow-sm">
                        <div className="w-16 h-16 bg-[#0077b5]/10 rounded-xl flex items-center justify-center border border-[#0077b5]/30 flex-shrink-0">
                            <Linkedin className="w-8 h-8 text-[#0077b5]" />
                        </div>
                        <div className="flex-1 w-full">
                            <h3 className="text-lg font-bold text-devops-900">LinkedIn Import</h3>
                            <p className="text-sm text-devops-500 mb-4">Sync your experience, education, and skills directly from your public LinkedIn profile.</p>
                            <div className="flex flex-col md:flex-row gap-2">
                                <input 
                                    placeholder="https://linkedin.com/in/username"
                                    className="flex-1 bg-devops-50 border border-devops-200 rounded-lg px-4 py-2 text-devops-900 focus:border-[#0077b5] outline-none"
                                />
                                <button className="px-6 py-2 bg-[#0077b5] hover:bg-[#006097] text-white rounded-lg font-bold transition-colors w-full md:w-auto">
                                    Sync
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Manual Text Import */}
                    <div className="bg-white border border-devops-200 rounded-xl p-6 md:p-8 shadow-sm">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-devops-100 rounded-full flex items-center justify-center border border-devops-200">
                                <FileText className="w-6 h-6 text-devops-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-devops-900">Import Resume Data</h3>
                                <p className="text-sm text-devops-500">Upload a PDF or paste content to overwrite your Master Profile.</p>
                            </div>
                        </div>
                        
                        {/* File Upload Area */}
                        {!fileName ? (
                            <div className="border-2 border-dashed border-devops-300 rounded-xl p-6 flex flex-col items-center justify-center bg-devops-50 hover:bg-white transition-colors relative group cursor-pointer mb-6">
                                <input 
                                    type="file" 
                                    accept=".pdf,.txt"
                                    onChange={handleFileUpload}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm border border-devops-200 group-hover:scale-110 transition-transform">
                                    {isImporting ? <Loader2 className="w-6 h-6 animate-spin text-hunj-600" /> : <Upload className="w-6 h-6 text-hunj-600" />}
                                </div>
                                <p className="font-bold text-devops-700 text-sm">Click to upload PDF or TXT</p>
                                <p className="text-xs text-devops-400 mt-1">Max 10MB</p>
                            </div>
                        ) : (
                            <div className="bg-hunj-50 border border-hunj-100 rounded-lg p-3 flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-hunj-600" />
                                    <span className="text-sm font-medium text-devops-900">{fileName}</span>
                                </div>
                                <button onClick={() => { setFileName(null); setImportText(''); }} className="text-xs text-devops-400 hover:text-red-500">Remove</button>
                            </div>
                        )}

                        <div className="relative mb-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-devops-200"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-devops-400">or paste text</span>
                            </div>
                        </div>
                        
                        <textarea 
                            className="w-full h-48 bg-devops-50 border border-devops-200 rounded-lg p-4 text-devops-900 font-mono text-sm focus:border-hunj-600 outline-none resize-none mb-4"
                            placeholder="Paste resume content here..."
                            value={importText}
                            onChange={(e) => setImportText(e.target.value)}
                        />
                        
                        <div className="flex justify-end">
                            <button 
                                onClick={handleImport}
                                disabled={isImporting || !importText.trim()}
                                className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-hunj-600 hover:bg-hunj-500 text-white rounded-lg font-medium disabled:opacity-50 transition-colors shadow-lg shadow-hunj-600/20"
                            >
                                {isImporting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Upload className="w-4 h-4"/>}
                                {isImporting ? 'Parsing...' : 'Parse & Overwrite'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Global Profile Chat Assistant (Always available here) */}
            <div className="hidden md:block">
                <AIChatAssistant 
                    resume={profile.masterResume}
                    onUpdate={handleUpdateResume}
                />
            </div>

        </div>
      </div>
    </div>
  );
};

export default ProfileHub;
