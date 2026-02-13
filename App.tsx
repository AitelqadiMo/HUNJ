
import React, { useState, useEffect, useRef } from 'react';
import { JobAnalysis, ResumeData, ATSScore, SkillMatch, UserProfile, Application, User } from './types';
import JobInput from './components/JobInput';
import ResumeEditor from './components/ResumeEditor';
import MatchAnalysis from './components/MatchAnalysis';
import ActionCenter from './components/ActionCenter';
import SkillsMatcher from './components/SkillsMatcher';
import Dashboard from './components/Dashboard';
import CareerOverview from './components/CareerOverview';
import ResumePreview from './components/ResumePreview';
import AIChatAssistant from './components/AIChatAssistant';
import PrivacyControl from './components/PrivacyControl';
import JobBoard from './components/JobBoard';
import AuthScreen from './components/AuthScreen';
import LandingPage from './components/LandingPage';
import OnboardingWizard from './components/OnboardingWizard';
import { calculateATSScore, assembleSmartResume, analyzeSkillsGap, updateResumeWithAI, analyzeJobDescription, sanitizeResumeData } from './services/geminiService';
import { storageService } from './services/storageService';
import { anonymizeResume, restorePII } from './utils/privacy';
import { Target, Eye, PenTool, Globe, ArrowLeft, LogOut, RefreshCw, AlertTriangle, Cloud, DollarSign, Users, FileText, Sparkles, BrainCircuit, LayoutGrid, Home, X, Minimize2, Maximize2, PanelRightClose, PanelRightOpen } from 'lucide-react';

const INITIAL_RESUME: ResumeData = {
  id: 'master',
  versionName: 'Master v1',
  timestamp: Date.now(),
  style: 'Base',
  design: 'Executive',
  themeConfig: {
      layout: 'Executive',
      font: 'Inter',
      accentColor: '#334155',
      pageSize: 'A4',
      density: 'Standard',
      targetPageCount: 1
  },
  sectionOrder: ['summary', 'experience', 'education', 'skills'],
  visibleSections: {},
  fullName: 'Your Name', 
  role: '', 
  email: 'email@example.com',
  phone: '',
  location: '',
  linkedin: '',
  website: '',
  contactInfo: '',
  summary: '',
  skills: [],
  experience: [],
  projects: [],
  certifications: [],
  education: '',
  languages: [],
  achievements: [],
  awards: [],
  interests: [],
  strengths: []
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showLanding, setShowLanding] = useState(true);
  const [isDataSaved, setIsDataSaved] = useState(true);
  
  const [profile, setProfile] = useState<UserProfile>({
    masterResume: INITIAL_RESUME,
    applications: [],
    privacyMode: false,
    preferences: {
      workAuthorization: 'US Citizen',
      targetRoles: [],
    },
    documents: [],
    profileComplete: false,
    level: 1,
    dailyGoals: []
  });

  const [view, setView] = useState<'home' | 'apps' | 'new-app' | 'application' | 'profile' | 'job-board'>('home');
  const [activeAppId, setActiveAppId] = useState<string | null>(null);
  const [workspaceTab, setWorkspaceTab] = useState<'editor' | 'preview'>('editor'); 
  const [rightPanelOpen, setRightPanelOpen] = useState(true); 
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
      const session = storageService.getSession();
      if (session) {
          setCurrentUser(session);
          setShowLanding(false);
          const stored = storageService.loadUserProfile(session.id);
          if (stored) setProfile({ ...profile, ...stored });
      }
  }, []);

  useEffect(() => {
      if (currentUser) storageService.saveUserProfile(currentUser.id, profile);
  }, [profile, currentUser]);

  const handleLogin = (user: User) => {
      setCurrentUser(user);
      storageService.saveSession(user);
      const stored = storageService.loadUserProfile(user.id);
      if (stored) setProfile({ ...profile, ...stored });
      setShowLanding(false);
  };

  const handleResumeUpdate = (updatedResume: ResumeData) => {
    if (!activeAppId) return;
    setProfile(prev => ({
        ...prev,
        applications: prev.applications.map(app => {
            if (app.id === activeAppId) {
                return { ...app, resumes: app.resumes.map(r => r.id === updatedResume.id ? updatedResume : r) };
            }
            return app;
        })
    }));
  };

  const activeApp = profile.applications.find(app => app.id === activeAppId);
  const activeResume = activeApp?.resumes[0];

  if (showLanding) return <LandingPage onStart={() => setShowLanding(false)} />;
  if (!currentUser) return <AuthScreen onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col overflow-hidden">
      
      {view !== 'application' && (
        <header className="bg-white border-b border-slate-200 h-16 shrink-0 flex items-center px-8 justify-between sticky top-0 z-50">
            <div className="flex items-center gap-8">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('home')}>
                    <Target className="w-6 h-6 text-indigo-600" />
                    <span className="font-bold text-xl tracking-tight">HUNJ</span>
                </div>
                <nav className="flex gap-1">
                    <button onClick={() => setView('home')} className={`px-4 py-2 text-sm font-bold rounded-lg ${view === 'home' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50'}`}>Home</button>
                    <button onClick={() => setView('apps')} className={`px-4 py-2 text-sm font-bold rounded-lg ${view === 'apps' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50'}`}>Board</button>
                    <button onClick={() => setView('job-board')} className={`px-4 py-2 text-sm font-bold rounded-lg ${view === 'job-board' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50'}`}>Market</button>
                </nav>
            </div>
            <div className="flex items-center gap-6">
                <PrivacyControl enabled={profile.privacyMode} onToggle={(v) => setProfile({...profile, privacyMode: v})} />
                <button onClick={() => { storageService.clearSession(); setCurrentUser(null); setShowLanding(true); }} className="text-slate-400 hover:text-red-500"><LogOut className="w-5 h-5" /></button>
            </div>
        </header>
      )}

      <main className="flex-1 relative overflow-hidden">
        {view === 'home' && <CareerOverview profile={profile} onNavigateToApp={(id) => { setActiveAppId(id); setView('application'); }} onFindJobs={() => setView('job-board')} onEditProfile={() => setView('profile')} onUpdateProfile={setProfile} />}
        
        {view === 'application' && activeApp && activeResume && (
            <div className="absolute inset-0 flex bg-slate-50">
                <aside className="w-20 border-r border-slate-200 bg-white flex flex-col items-center py-6 gap-6">
                    <button onClick={() => setView('apps')} className="p-3 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-slate-900"><ArrowLeft className="w-5 h-5" /></button>
                    <div className="h-px w-10 bg-slate-100"></div>
                    <button onClick={() => setWorkspaceTab('editor')} className={`p-3 rounded-xl transition-all ${workspaceTab === 'editor' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-400 hover:bg-slate-50'}`}><PenTool className="w-5 h-5" /></button>
                    <button onClick={() => setWorkspaceTab('preview')} className={`p-3 rounded-xl transition-all ${workspaceTab === 'preview' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-400 hover:bg-slate-50'}`}><Eye className="w-5 h-5" /></button>
                </aside>

                <div className="flex-1 flex flex-col relative overflow-hidden">
                    <div className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur flex items-center justify-between px-8">
                        <div>
                            <h2 className="font-bold text-slate-900">{activeApp.jobTitle}</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{activeApp.companyName}</p>
                        </div>
                        <button onClick={() => setRightPanelOpen(!rightPanelOpen)} className={`p-2 rounded-lg border transition-all ${rightPanelOpen ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-400'}`}>
                            {rightPanelOpen ? <PanelRightClose className="w-5 h-5"/> : <PanelRightOpen className="w-5 h-5"/>}
                        </button>
                    </div>

                    <div className="flex-1 relative overflow-hidden">
                        {workspaceTab === 'editor' ? (
                            <div className="h-full p-8 max-w-4xl mx-auto overflow-y-auto custom-scrollbar">
                                <ResumeEditor resume={activeResume} job={activeApp.jobAnalysis} onUpdate={handleResumeUpdate} />
                            </div>
                        ) : (
                            <ResumePreview resume={activeResume} job={activeApp.jobAnalysis} onUpdate={handleResumeUpdate} />
                        )}
                    </div>
                </div>

                {rightPanelOpen && (
                    <aside className="w-96 border-l border-slate-200 bg-slate-900 text-white overflow-y-auto custom-scrollbar flex flex-col p-6 gap-8">
                        <div className="flex items-center gap-2">
                            <BrainCircuit className="w-5 h-5 text-indigo-400" />
                            <h3 className="font-bold text-sm uppercase tracking-widest">Intelligence HUD</h3>
                        </div>
                        <MatchAnalysis score={activeApp.atsScore} job={activeApp.jobAnalysis} skillMatches={activeApp.skillMatches} isLoading={false} />
                        <ActionCenter score={activeApp.atsScore} skillMatches={activeApp.skillMatches} onApplyFix={async (s) => {
                            const updated = await updateResumeWithAI(activeResume, s);
                            handleResumeUpdate(updated);
                        }} />
                    </aside>
                )}
            </div>
        )}
      </main>
    </div>
  );
};

export default App;
