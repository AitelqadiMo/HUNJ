import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, ResumeData, DocumentItem } from '../types';
import ResumeEditor from './ResumeEditor';
import DocumentLibrary from './DocumentLibrary';
import AIChatAssistant from './AIChatAssistant';
import { parseResumeFromText, chatWithProfileBuilder } from '../services/geminiService';
import { 
    User, Briefcase, FileText, Settings, Upload, ArrowLeft, Save, 
    Linkedin, Globe, MapPin, DollarSign, Calendar, ShieldCheck, Loader2,
    CheckCircle2, AlertCircle, MessageSquarePlus, Bot, Send, Sparkles, Check
} from 'lucide-react';

interface ProfileHubProps {
  profile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  onBack: () => void;
}

interface BuilderMessage {
    id: string;
    role: 'user' | 'ai';
    content: string;
    updateInfo?: string; // e.g. "Added Project: XYZ"
}

const ProfileHub: React.FC<ProfileHubProps> = ({ profile, onUpdateProfile, onBack }) => {
  const [activeTab, setActiveTab] = useState<'identity' | 'resume' | 'docs' | 'integrations' | 'builder'>('identity');
  const [isSaving, setIsSaving] = useState(false);
  
  // Import state
  const [importText, setImportText] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  // Profile Builder Chat State
  const [builderMessages, setBuilderMessages] = useState<BuilderMessage[]>([
      { id: '1', role: 'ai', content: "Hi! I'm your Profile Architect. Tell me about your recent work experiences, projects, or skills, and I'll automatically add them to your Master Profile." }
  ]);
  const [builderInput, setBuilderInput] = useState('');
  const [isBuilding, setIsBuilding] = useState(false);
  const builderScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      if (builderScrollRef.current) {
          builderScrollRef.current.scrollTop = builderScrollRef.current.scrollHeight;
      }
  }, [builderMessages]);

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

  const handleAddDocument = (doc: DocumentItem) => {
    onUpdateProfile({
      ...profile,
      documents: [doc, ...profile.documents]
    });
  };

  const handleDeleteDocument = (id: string) => {
    onUpdateProfile({
      ...profile,
      documents: profile.documents.filter(d => d.id !== id)
    });
  };

  const handleSave = () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => setIsSaving(false), 800);
  };

  const handleImport = async () => {
      if(!importText.trim()) return;
      setIsImporting(true);
      try {
          const parsed = await parseResumeFromText(importText);
          handleUpdateResume({ ...parsed, id: profile.masterResume.id });
          setImportText('');
          alert("Resume parsed successfully!");
      } catch (e) {
          alert("Failed to parse resume.");
      } finally {
          setIsImporting(false);
      }
  }

  // --- Profile Builder Logic ---
  const handleBuilderSend = async () => {
      if (!builderInput.trim()) return;
      
      const userMsg: BuilderMessage = { id: Date.now().toString(), role: 'user', content: builderInput };
      setBuilderMessages(prev => [...prev, userMsg]);
      setBuilderInput('');
      setIsBuilding(true);

      try {
          const { textResponse, dataUpdate } = await chatWithProfileBuilder(
              profile.masterResume, 
              userMsg.content, 
              builderMessages.map(m => ({ role: m.role, content: m.content }))
          );

          let updateNote = undefined;

          // Apply updates if any
          if (dataUpdate) {
              const current = profile.masterResume;
              const next = { ...current };

              if (dataUpdate.experience && dataUpdate.experience.length > 0) {
                  // Normalize and append
                  const newExps = dataUpdate.experience.map((e, i) => ({
                      ...e, 
                      id: `exp-new-${Date.now()}-${i}`,
                      visible: true,
                      bullets: e.bullets?.map((b: any, bi: number) => 
                          typeof b === 'string' ? { id: `b-${Date.now()}-${bi}`, text: b, visible: true } : b
                      ) || []
                  }));
                  next.experience = [...newExps, ...current.experience]; // Add to top
                  updateNote = `Added ${newExps.length} Experience item(s)`;
              }

              if (dataUpdate.projects && dataUpdate.projects.length > 0) {
                  const newProjs = dataUpdate.projects.map((p, i) => ({
                      ...p,
                      id: `proj-new-${Date.now()}-${i}`,
                      visible: true
                  }));
                  next.projects = [...newProjs, ...(current.projects || [])];
                  updateNote = updateNote ? `${updateNote}, Projects` : `Added ${newProjs.length} Project(s)`;
              }

              if (dataUpdate.skills && dataUpdate.skills.length > 0) {
                  // Unique merge
                  const skillSet = new Set([...current.skills, ...dataUpdate.skills]);
                  next.skills = Array.from(skillSet);
                  updateNote = updateNote ? `${updateNote}, Skills` : `Added Skills: ${dataUpdate.skills.join(', ')}`;
              }

              if (dataUpdate.certifications && dataUpdate.certifications.length > 0) {
                  const newCerts = dataUpdate.certifications.map((c, i) => ({
                      ...c,
                      id: `cert-new-${Date.now()}-${i}`,
                      visible: true
                  }));
                  next.certifications = [...newCerts, ...(current.certifications || [])];
                  updateNote = updateNote ? `${updateNote}, Certifications` : `Added Certification(s)`;
              }

              handleUpdateResume(next);
          }

          const aiMsg: BuilderMessage = { 
              id: (Date.now() + 1).toString(), 
              role: 'ai', 
              content: textResponse,
              updateInfo: updateNote
          };
          setBuilderMessages(prev => [...prev, aiMsg]);

      } catch (e) {
          console.error(e);
      } finally {
          setIsBuilding(false);
      }
  };

  // Calculate Completeness
  const calculateCompleteness = () => {
      let score = 0;
      let total = 0;
      const r = profile.masterResume;
      const p = profile.preferences;

      const checks = [
          { val: r.fullName, weight: 10, label: "Full Name" },
          { val: r.role, weight: 10, label: "Role Title" },
          { val: r.email, weight: 5, label: "Email" },
          { val: r.phone, weight: 5, label: "Phone" },
          { val: r.summary, weight: 15, label: "Summary" },
          { val: r.experience.length > 0, weight: 20, label: "Experience" },
          { val: r.skills.length > 0, weight: 15, label: "Skills" },
          { val: r.education, weight: 5, label: "Education" },
          { val: p.salaryExpectation, weight: 5, label: "Salary Pref" },
          { val: p.workAuthorization, weight: 5, label: "Visa Status" },
          { val: r.certifications?.length > 0, weight: 5, label: "Certifications" } // Bonus basically
      ];

      checks.forEach(c => {
          if (c.val) score += c.weight;
          total += c.weight; // Normalize to 100 later if needed, but weights roughly sum to 100
      });

      return Math.min(100, score);
  };

  const completeness = calculateCompleteness();

  return (
    <div className="h-[calc(100vh-64px)] flex overflow-hidden">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-devops-900 border-r border-devops-800 flex flex-col p-4">
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
            <button 
                onClick={() => setActiveTab('identity')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'identity' ? 'bg-accent-600/10 text-accent-500 border border-accent-600/20' : 'text-devops-400 hover:bg-devops-800 hover:text-white'}`}
            >
                <User className="w-5 h-5" /> Identity & Prefs
            </button>
            <button 
                onClick={() => setActiveTab('builder')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'builder' ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' : 'text-devops-400 hover:bg-devops-800 hover:text-white'}`}
            >
                <MessageSquarePlus className="w-5 h-5" /> AI Interview
            </button>
            <button 
                onClick={() => setActiveTab('resume')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'resume' ? 'bg-accent-600/10 text-accent-500 border border-accent-600/20' : 'text-devops-400 hover:bg-devops-800 hover:text-white'}`}
            >
                <Briefcase className="w-5 h-5" /> Master Resume
            </button>
            <button 
                onClick={() => setActiveTab('docs')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'docs' ? 'bg-accent-600/10 text-accent-500 border border-accent-600/20' : 'text-devops-400 hover:bg-devops-800 hover:text-white'}`}
            >
                <FileText className="w-5 h-5" /> Document Library
            </button>
            <button 
                onClick={() => setActiveTab('integrations')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'integrations' ? 'bg-accent-600/10 text-accent-500 border border-accent-600/20' : 'text-devops-400 hover:bg-devops-800 hover:text-white'}`}
            >
                <Settings className="w-5 h-5" /> Sync & Import
            </button>
        </nav>

        <div className="mt-auto pt-4 border-t border-devops-800">
             <div className="flex items-center gap-3 p-2 bg-devops-800/50 rounded-lg">
                 <div className="w-10 h-10 bg-accent-600 rounded-full flex items-center justify-center text-white font-bold">
                     {profile.masterResume.fullName.charAt(0)}
                 </div>
                 <div className="overflow-hidden">
                     <p className="text-sm font-bold text-white truncate">{profile.masterResume.fullName}</p>
                     <p className="text-xs text-devops-400 truncate">{profile.masterResume.email}</p>
                 </div>
             </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto bg-devops-900/50 p-8 relative">
        
        {/* TAB: IDENTITY & PREFERENCES */}
        {activeTab === 'identity' && (
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1">Personal Identity</h2>
                        <p className="text-devops-400">Manage your core information and job preferences.</p>
                    </div>
                    <button 
                        onClick={handleSave}
                        className="flex items-center gap-2 px-6 py-2 bg-success hover:bg-green-600 text-white rounded-lg font-medium transition-all"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4" />}
                        Save Changes
                    </button>
                </div>

                {/* Core Info Card */}
                <div className="bg-devops-800 border border-devops-700 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2 border-b border-devops-700 pb-2">
                        <User className="w-5 h-5 text-accent-500" /> Basic Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm text-devops-300">Full Name</label>
                            <input 
                                className="w-full bg-devops-900 border border-devops-600 rounded-lg p-3 text-white focus:border-accent-500 outline-none"
                                value={profile.masterResume.fullName}
                                onChange={(e) => handleUpdateResume({...profile.masterResume, fullName: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm text-devops-300">Role Title</label>
                            <input 
                                className="w-full bg-devops-900 border border-devops-600 rounded-lg p-3 text-white focus:border-accent-500 outline-none"
                                value={profile.masterResume.role}
                                onChange={(e) => handleUpdateResume({...profile.masterResume, role: e.target.value})}
                            />
                        </div>
                         <div className="space-y-2">
                            <label className="text-sm text-devops-300">Email Address</label>
                            <input 
                                className="w-full bg-devops-900 border border-devops-600 rounded-lg p-3 text-white focus:border-accent-500 outline-none"
                                value={profile.masterResume.email}
                                onChange={(e) => handleUpdateResume({...profile.masterResume, email: e.target.value})}
                            />
                        </div>
                         <div className="space-y-2">
                            <label className="text-sm text-devops-300">Phone Number</label>
                            <input 
                                className="w-full bg-devops-900 border border-devops-600 rounded-lg p-3 text-white focus:border-accent-500 outline-none"
                                value={profile.masterResume.phone}
                                onChange={(e) => handleUpdateResume({...profile.masterResume, phone: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm text-devops-300">Location</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-devops-500" />
                                <input 
                                    className="w-full bg-devops-900 border border-devops-600 rounded-lg p-3 pl-10 text-white focus:border-accent-500 outline-none"
                                    value={profile.masterResume.location}
                                    onChange={(e) => handleUpdateResume({...profile.masterResume, location: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm text-devops-300">Portfolio / Website</label>
                            <div className="relative">
                                <Globe className="absolute left-3 top-3.5 w-4 h-4 text-devops-500" />
                                <input 
                                    className="w-full bg-devops-900 border border-devops-600 rounded-lg p-3 pl-10 text-white focus:border-accent-500 outline-none"
                                    value={profile.masterResume.website}
                                    onChange={(e) => handleUpdateResume({...profile.masterResume, website: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Preferences Card */}
                <div className="bg-devops-800 border border-devops-700 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2 border-b border-devops-700 pb-2">
                        <Briefcase className="w-5 h-5 text-accent-500" /> Job Preferences
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                             <label className="text-sm text-devops-300">Work Authorization</label>
                             <div className="relative">
                                <ShieldCheck className="absolute left-3 top-3.5 w-4 h-4 text-devops-500" />
                                <select 
                                    className="w-full bg-devops-900 border border-devops-600 rounded-lg p-3 pl-10 text-white focus:border-accent-500 outline-none appearance-none"
                                    value={profile.preferences.workAuthorization}
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
                        <div className="space-y-2">
                             <label className="text-sm text-devops-300">Availability</label>
                             <div className="relative">
                                <Calendar className="absolute left-3 top-3.5 w-4 h-4 text-devops-500" />
                                <select 
                                    className="w-full bg-devops-900 border border-devops-600 rounded-lg p-3 pl-10 text-white focus:border-accent-500 outline-none appearance-none"
                                    value={profile.preferences.availability}
                                    onChange={(e) => handleUpdatePreferences('availability', e.target.value)}
                                >
                                    <option value="Immediate">Immediate</option>
                                    <option value="2 Weeks">2 Weeks Notice</option>
                                    <option value="1 Month">1 Month Notice</option>
                                    <option value="passive">Passively Looking</option>
                                </select>
                             </div>
                        </div>
                        <div className="space-y-2">
                             <label className="text-sm text-devops-300">Salary Expectation</label>
                             <div className="relative">
                                <DollarSign className="absolute left-3 top-3.5 w-4 h-4 text-devops-500" />
                                <input 
                                    className="w-full bg-devops-900 border border-devops-600 rounded-lg p-3 pl-10 text-white focus:border-accent-500 outline-none"
                                    value={profile.preferences.salaryExpectation}
                                    onChange={(e) => handleUpdatePreferences('salaryExpectation', e.target.value)}
                                    placeholder="e.g. $130k+"
                                />
                             </div>
                        </div>
                         <div className="space-y-2">
                             <label className="text-sm text-devops-300">Work Style</label>
                             <div className="flex gap-2 p-1 bg-devops-900 border border-devops-600 rounded-lg">
                                 {['Remote', 'Hybrid', 'On-site'].map(style => (
                                     <button
                                        key={style}
                                        onClick={() => handleUpdatePreferences('remotePreference', style)}
                                        className={`flex-1 py-2 text-sm rounded transition-colors ${profile.preferences.remotePreference === style ? 'bg-devops-700 text-white shadow' : 'text-devops-400 hover:text-white'}`}
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
                            checked={profile.preferences.relocation}
                            onChange={(e) => handleUpdatePreferences('relocation', e.target.checked)}
                            className="w-5 h-5 rounded bg-devops-900 border-devops-600 text-accent-600 focus:ring-accent-500"
                        />
                        <label htmlFor="relocation" className="text-sm text-white font-medium">I am willing to relocate for the right opportunity</label>
                    </div>
                </div>
            </div>
        )}

        {/* TAB: PROFILE BUILDER */}
        {activeTab === 'builder' && (
            <div className="h-full flex flex-col max-w-4xl mx-auto bg-devops-900 border border-devops-700 rounded-2xl overflow-hidden shadow-2xl relative">
                {/* Chat Header */}
                <div className="p-4 border-b border-devops-700 bg-devops-800 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-600/20 border border-purple-500/30 rounded-full flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">AI Profile Architect</h3>
                            <p className="text-xs text-devops-400">Tell me your story, I'll update your resume.</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => {
                            if(confirm("Clear chat history?")) {
                                setBuilderMessages([{ id: '1', role: 'ai', content: "History cleared. What should we add next?" }]);
                            }
                        }}
                        className="text-xs text-devops-500 hover:text-white transition-colors"
                    >
                        Clear Chat
                    </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6" ref={builderScrollRef}>
                    {builderMessages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`flex gap-3 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'ai' ? 'bg-devops-700' : 'bg-accent-600'}`}>
                                    {msg.role === 'ai' ? <Bot className="w-4 h-4 text-white" /> : <User className="w-4 h-4 text-white" />}
                                </div>
                                
                                <div className="flex flex-col gap-2">
                                    <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                                        msg.role === 'user' 
                                        ? 'bg-accent-600 text-white rounded-tr-none' 
                                        : 'bg-devops-800 border border-devops-700 text-devops-100 rounded-tl-none'
                                    }`}>
                                        {msg.content}
                                    </div>
                                    
                                    {/* AI Update Notification */}
                                    {msg.updateInfo && (
                                        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                                            <div className="bg-green-500/20 p-1.5 rounded-full">
                                                <Check className="w-3 h-3 text-green-400" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-green-400 uppercase tracking-wide">Profile Updated</p>
                                                <p className="text-xs text-devops-300">{msg.updateInfo}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    {isBuilding && (
                        <div className="flex justify-start gap-3 pl-2">
                            <div className="w-8 h-8 rounded-full bg-devops-700 flex items-center justify-center">
                                <Bot className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex items-center gap-2 text-devops-400 text-xs bg-devops-800/50 px-4 py-2 rounded-full border border-devops-700">
                                <Loader2 className="w-3 h-3 animate-spin" /> Processing & Updating...
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-4 bg-devops-800 border-t border-devops-700">
                    <div className="relative flex items-end gap-2 bg-devops-900 border border-devops-600 rounded-xl p-2 transition-all focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-500/50">
                        <textarea
                            value={builderInput}
                            onChange={(e) => setBuilderInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleBuilderSend();
                                }
                            }}
                            placeholder="Example: I worked at Amazon as a Cloud Architect from 2020 to 2022. I led the migration of..."
                            className="w-full bg-transparent text-white placeholder-devops-500 text-sm p-2 outline-none resize-none max-h-32 min-h-[44px]"
                            rows={1}
                            disabled={isBuilding}
                        />
                        <button
                            onClick={handleBuilderSend}
                            disabled={!builderInput.trim() || isBuilding}
                            className="p-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-0.5"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                    <p className="text-[10px] text-center text-devops-500 mt-2">
                        Tip: Provide as much detail as possible (dates, technologies, metrics) for better results.
                    </p>
                </div>
            </div>
        )}

        {/* TAB: MASTER RESUME */}
        {activeTab === 'resume' && (
             <div className="h-full">
                 <ResumeEditor 
                    resume={profile.masterResume}
                    job={null} // Master resume editing doesn't need job context
                    onUpdate={handleUpdateResume}
                 />
             </div>
        )}

        {/* TAB: DOCUMENT LIBRARY */}
        {activeTab === 'docs' && (
            <div className="max-w-5xl mx-auto h-full">
                <DocumentLibrary 
                    documents={profile.documents} 
                    onAddDocument={handleAddDocument}
                    onDeleteDocument={handleDeleteDocument}
                />
            </div>
        )}

        {/* TAB: INTEGRATIONS & IMPORT */}
        {activeTab === 'integrations' && (
             <div className="max-w-4xl mx-auto space-y-8">
                 <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1">Sync & Import</h2>
                        <p className="text-devops-400">Connect external sources to keep your profile updated.</p>
                    </div>
                </div>

                {/* LinkedIn Sync */}
                <div className="bg-devops-800 border border-devops-700 rounded-xl p-8 flex items-center gap-6">
                     <div className="w-16 h-16 bg-[#0077b5]/10 rounded-xl flex items-center justify-center border border-[#0077b5]/30 flex-shrink-0">
                         <Linkedin className="w-8 h-8 text-[#0077b5]" />
                     </div>
                     <div className="flex-1">
                         <h3 className="text-lg font-bold text-white">LinkedIn Import</h3>
                         <p className="text-sm text-devops-400 mb-4">Sync your experience, education, and skills directly from your public LinkedIn profile.</p>
                         <div className="flex gap-2">
                             <input 
                                placeholder="https://linkedin.com/in/username"
                                className="flex-1 bg-devops-900 border border-devops-600 rounded-lg px-4 py-2 text-white focus:border-[#0077b5] outline-none"
                             />
                             <button className="px-6 py-2 bg-[#0077b5] hover:bg-[#006097] text-white rounded-lg font-bold transition-colors">
                                 Sync
                             </button>
                         </div>
                     </div>
                </div>

                {/* Manual Text Import */}
                <div className="bg-devops-800 border border-devops-700 rounded-xl p-8">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-devops-900 rounded-full flex items-center justify-center border border-devops-600">
                            <FileText className="w-6 h-6 text-devops-200" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Parse from Resume Text</h3>
                            <p className="text-sm text-devops-400">Paste your existing resume content to overwrite your Master Profile data.</p>
                        </div>
                    </div>
                    
                    <textarea 
                        className="w-full h-48 bg-devops-900 border border-devops-600 rounded-lg p-4 text-devops-100 font-mono text-sm focus:border-accent-500 outline-none resize-none mb-4"
                        placeholder="Paste resume content here..."
                        value={importText}
                        onChange={(e) => setImportText(e.target.value)}
                    />
                    
                    <div className="flex justify-end">
                        <button 
                            onClick={handleImport}
                            disabled={isImporting || !importText.trim()}
                            className="flex items-center gap-2 px-6 py-3 bg-devops-700 hover:bg-devops-600 text-white rounded-lg font-medium disabled:opacity-50"
                        >
                            {isImporting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Upload className="w-4 h-4"/>}
                            Parse & Overwrite
                        </button>
                    </div>
                </div>
             </div>
        )}

        {/* Global Profile Chat Assistant (Only show if NOT in builder mode to avoid clutter) */}
        {activeTab !== 'builder' && (
            <AIChatAssistant 
                resume={profile.masterResume}
                onUpdate={handleUpdateResume}
            />
        )}

      </div>
    </div>
  );
};

export default ProfileHub;