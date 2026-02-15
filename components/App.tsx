
import React, { useState, useEffect, useRef } from 'react';
import { JobAnalysis, ResumeData, ATSScore, SkillMatch, UserProfile, Application, BiasAnalysis, InterviewMessage, LinkedInProfile, SalaryInsight, NetworkingStrategy, DocumentItem, ResumeThemeConfig, ExternalJob, User } from '../types';
import JobInput from './JobInput';
import ResumeEditor from './ResumeEditor';
import MatchAnalysis from './MatchAnalysis';
import ActionCenter from './ActionCenter';
import SkillsMatcher from './SkillsMatcher';
import BiasChecker from './BiasChecker';
import Dashboard from './Dashboard';
import CareerOverview from './CareerOverview';
import StageTracker from './StageTracker';
import CoverLetterEditor from './CoverLetter';
import ProfileHub from './ProfileHub';
import ResumePreview from './ResumePreview';
import AIChatAssistant from './AIChatAssistant';
import InterviewPrep from './InterviewPrep';
import LinkedInOptimizer from './LinkedInOptimizer';
import SalaryInsights from './SalaryInsights';
import NetworkingHub from './NetworkingHub';
import PrivacyControl from './PrivacyControl';
import JobBoard from './JobBoard';
import AuthScreen from './AuthScreen';
import LandingPage from './LandingPage';
import OnboardingTour from './OnboardingTour';
import OnboardingWizard from './OnboardingWizard';
import { calculateATSScore, generateTailoredResume, assembleSmartResume, analyzeSkillsGap, analyzeBias, updateResumeWithAI, analyzeJobDescription, sanitizeResumeData } from '../services/geminiService';
import { storageService } from '../services/storageService';
import { logger } from '../services/loggingService';
import { anonymizeResume, restorePII } from '../utils/privacy';
import { Target, Eye, MessageSquare, Linkedin, PenTool, Globe, ArrowLeft, LogOut, RefreshCw, AlertTriangle, Cloud, DollarSign, Users, FileText, Sparkles, BrainCircuit, LayoutGrid, Home, Menu, X, Minimize2, Maximize2, PanelRightClose, PanelRightOpen, Bell, ArrowRight } from 'lucide-react';
import ATSScoreChart from './ATSScoreChart';

const INITIAL_RESUME: ResumeData = {
  id: 'master',
  versionName: 'Master v1',
  timestamp: Date.now(),
  style: 'Base',
  design: 'Executive',
  themeConfig: {
      layout: 'Executive',
      font: 'Inter',
      accentColor: '#334155', // Slate
      pageSize: 'A4',
      density: 'Standard',
      targetPageCount: 2
  },
  sectionOrder: ['summary', 'experience', 'education', 'skills', 'projects', 'certifications', 'languages', 'awards', 'interests'],
  visibleSections: {
      summary: true,
      experience: true,
      education: true,
      skills: true,
      projects: true,
      certifications: true,
      languages: true,
      awards: true,
      interests: true,
      affiliations: true
  },
  fullName: 'Your Name', 
  role: '', 
  email: 'email@example.com',
  phone: '',
  location: '',
  linkedin: '',
  website: '',
  contactInfo: '',
  summary: '',
  summaryVisible: true,
  skills: [],
  languages: [],
  achievements: [],
  awards: [],
  interests: [],
  strengths: [],
  personalKnowledgeBase: [],
  education: '',
  educationVisible: true,
  experience: [],
  projects: [],
  certifications: [],
  publications: [],
  affiliations: []
};

const INITIAL_DOCS: DocumentItem[] = [];

type WorkspaceTab = 'editor' | 'preview' | 'interview' | 'cover-letter' | 'networking' | 'salary' | 'linkedin';

const App: React.FC = () => {
  // --- USER STATE ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showLanding, setShowLanding] = useState(true);
  const [showTour, setShowTour] = useState(false);
  const [isDataSaved, setIsDataSaved] = useState(true);
  
  // --- APP STATE ---
  const [profile, setProfile] = useState<UserProfile>({
    masterResume: INITIAL_RESUME,
    applications: [],
    privacyMode: false,
    preferences: {
      workAuthorization: 'US Citizen',
      availability: '1 Month',
      salaryExpectation: '',
      relocation: false,
      remotePreference: 'Hybrid',
      targetRoles: [],
      targetIndustries: [],
      preferredTechStack: [],
      companySize: []
    },
    documents: INITIAL_DOCS,
    onboardingSeen: false,
    profileComplete: false,
    xp: 0,
    streak: 1,
    level: 1,
    dailyGoals: [
        { id: '1', text: 'Apply to 3 jobs', completed: false, xp: 50 },
        { id: '2', text: 'Update master resume', completed: false, xp: 30 },
        { id: '3', text: 'Connect with 2 recruiters', completed: false, xp: 40 }
    ],
    achievements: [],
    dataSources: []
  });

  const [view, setView] = useState<'home' | 'apps' | 'new-app' | 'application' | 'profile' | 'job-board'>('home');
  const [activeAppId, setActiveAppId] = useState<string | null>(null);
  
  // Application View States
  const [activeTool, setActiveTool] = useState<string | null>(null); 
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>('editor'); 
  const [rightPanelOpen, setRightPanelOpen] = useState(true); 
  const [focusMode, setFocusMode] = useState(false);

  // Generation States
  const [isGenerating, setIsGenerating] = useState(false);
  const [isScoring, setIsScoring] = useState(false);
  const [isCheckingBias, setIsCheckingBias] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // --- INITIALIZATION & STORAGE EFFECTS ---
  useEffect(() => {
      const activeSession = storageService.getSession();
      if (activeSession) {
          setCurrentUser(activeSession);
          setShowLanding(false);
          try {
              const storedProfile = storageService.loadUserProfile(activeSession.id);
              if (storedProfile) {
                  const migratedProfile: UserProfile = {
                      ...profile, 
                      ...storedProfile, 
                      preferences: { ...profile.preferences, ...(storedProfile.preferences || {}) },
                      masterResume: sanitizeResumeData(storedProfile.masterResume || INITIAL_RESUME),
                      applications: Array.isArray(storedProfile.applications) 
                          ? storedProfile.applications.map(app => ({
                              ...app,
                              resumes: Array.isArray(app.resumes) ? app.resumes.map(r => sanitizeResumeData(r)) : []
                          })) 
                          : [],
                      xp: storedProfile.xp || 0,
                      streak: storedProfile.streak || 1,
                      level: storedProfile.level || 1,
                      dailyGoals: storedProfile.dailyGoals || profile.dailyGoals,
                      achievements: storedProfile.achievements || [],
                      dataSources: storedProfile.dataSources || []
                  };
                  setProfile(migratedProfile);
              }
          } catch (e) {
              console.error("CRITICAL: Failed to load/migrate profile.", e);
              storageService.clearSession();
              localStorage.clear();
              setShowLanding(true);
              setCurrentUser(null);
          }
      }
  }, []);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
      if (currentUser && profile) {
          setIsDataSaved(false);
          if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
          saveTimeoutRef.current = setTimeout(() => {
              storageService.saveUserProfile(currentUser.id, profile);
              setIsDataSaved(true);
          }, 1000);
      }
  }, [profile, currentUser]);

  const activeApp = profile.applications.find(app => app.id === activeAppId);
  const activeResume = activeApp?.resumes.find(r => r.id === activeApp.activeResumeId);

  const handleLandingStart = () => { setShowLanding(false); };

  const handleLogin = (user: User, isNewUser: boolean) => {
      setCurrentUser(user);
      storageService.saveSession(user); 
      try {
          const storedProfile = storageService.loadUserProfile(user.id);
          if (storedProfile) {
              const migratedProfile = {
                  ...profile, ...storedProfile,
                  preferences: { ...profile.preferences, ...(storedProfile.preferences || {}) },
                  masterResume: sanitizeResumeData(storedProfile.masterResume || INITIAL_RESUME),
                  applications: Array.isArray(storedProfile.applications) ? storedProfile.applications.map(app => ({...app, resumes: Array.isArray(app.resumes) ? app.resumes.map(r => sanitizeResumeData(r)) : []})) : [],
                  achievements: storedProfile.achievements || [],
                  dataSources: storedProfile.dataSources || []
              };
              setProfile(migratedProfile);
              if (!storedProfile.onboardingSeen && storedProfile.profileComplete) setShowTour(true);
          } else {
              const newProfile = { ...profile };
              if (isNewUser) { newProfile.masterResume.fullName = user.name; newProfile.masterResume.email = user.email; }
              setProfile(newProfile);
              storageService.saveUserProfile(user.id, newProfile);
          }
      } catch (e) {
          const newProfile = { ...profile };
          newProfile.masterResume.fullName = user.name;
          setProfile(newProfile);
      }
  };

  const handleProfileWizardComplete = (resume: ResumeData, targetRole: string) => {
      setProfile(prev => ({ ...prev, masterResume: resume, preferences: { ...prev.preferences, targetRoles: [targetRole] }, profileComplete: true, onboardingSeen: false }));
      setShowTour(true);
  };

  const handleSkipOnboarding = () => { setProfile(prev => ({ ...prev, profileComplete: true, onboardingSeen: true })); };
  const handleOnboardingComplete = () => { setShowTour(false); setProfile(prev => ({ ...prev, onboardingSeen: true })); };

  const handleLogout = () => {
      setCurrentUser(null);
      storageService.clearSession(); 
      setProfile({ masterResume: INITIAL_RESUME, applications: [], privacyMode: false, preferences: profile.preferences, documents: [], onboardingSeen: false, profileComplete: false, achievements: [], dataSources: [] });
      setView('home');
      setShowLanding(true);
  };

  const handleTogglePrivacy = (enabled: boolean) => { setProfile(prev => ({ ...prev, privacyMode: enabled })); };
  const prepareResumeForAI = (resume: ResumeData): ResumeData => profile.privacyMode ? anonymizeResume(resume) : resume;
  const handleNewApplicationStart = () => { setView('new-app'); };

  const handleJobAnalyzed = async (analysis: JobAnalysis, originalText: string) => {
    const newApp: Application = {
        id: `app-${Date.now()}`,
        jobTitle: analysis.title,
        companyName: analysis.company,
        jobDescription: originalText,
        status: 'Drafting',
        dateCreated: new Date().toISOString(),
        jobAnalysis: analysis,
        resumes: [],
        activeResumeId: '',
        coverLetter: null,
        atsScore: null,
        biasAnalysis: null,
        skillMatches: [],
        interviewSession: [],
        linkedInProfile: null,
        salaryInsight: null,
        networkingStrategy: null
    };

    setIsGenerating(true);
    setIsScoring(true);
    setGenerationError(null);
    
    setProfile(prev => ({ ...prev, applications: [newApp, ...prev.applications] }));
    setActiveAppId(newApp.id);
    setView('application');
    setWorkspaceTab('editor');

    try {
      const inputResume = prepareResumeForAI(profile.masterResume);
      
      const hasStructuredData = profile.achievements && profile.achievements.length > 0;
      let tailoredResumes: ResumeData[] = [];
      let skillsResult: SkillMatch[] = [];

      if (hasStructuredData) {
          [tailoredResumes, skillsResult] = await Promise.all([
              assembleSmartResume(profile, analysis),
              analyzeSkillsGap(inputResume.skills, analysis.requiredSkills)
          ]);
      } else {
          // Construct temp profile for generation to support both signatures (privacy respected via inputResume in temp object)
          const tempProfile: UserProfile = { ...profile, masterResume: inputResume };
          [tailoredResumes, skillsResult] = await Promise.all([
              generateTailoredResume(tempProfile, analysis),
              analyzeSkillsGap(inputResume.skills, analysis.requiredSkills)
          ]);
      }
      
      if (!tailoredResumes || tailoredResumes.length === 0) throw new Error("Failed to generate resumes.");

      const restoredResumes = tailoredResumes.map(r => profile.privacyMode ? restorePII(r, profile.masterResume) : r);
      const initialVariant = restoredResumes[0];
      const scoreResult = await calculateATSScore(initialVariant, analysis);

      setProfile(prev => ({
          ...prev,
          applications: prev.applications.map(app => {
              if (app.id === newApp.id) {
                  return { ...app, resumes: restoredResumes, activeResumeId: initialVariant.id, atsScore: scoreResult, skillMatches: skillsResult };
              }
              return app;
          })
      }));
    } catch (error: any) {
      console.error("Application Generation Error:", error);
      setGenerationError(error.message || "An unexpected error occurred while generating the resume.");
    } finally {
      setIsGenerating(false);
      setIsScoring(false);
    }
  };

  const handlePersonalizeFromJobBoard = async (job: ExternalJob) => {
      const jobText = `Title: ${job.title}\nCompany: ${job.company}\nLocation: ${job.location}\nDescription: ${job.description}\nRequirements: ${job.requirements.join(', ')}`;
      try {
          setIsGenerating(true);
          setView('application'); 
          const analysis = await analyzeJobDescription(jobText);
          analysis.title = job.title;
          analysis.company = job.company;
          await handleJobAnalyzed(analysis, jobText);
      } catch (e) {
          console.error("Failed to start application from job board", e);
      }
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

  const handleRunBiasCheck = async () => {
      if (!activeResume) return;
      setIsCheckingBias(true);
      try {
          const result = await analyzeBias(activeResume);
          setProfile(prev => ({
              ...prev,
              applications: prev.applications.map(a => a.id === activeAppId ? { ...a, biasAnalysis: result } : a)
          }));
      } catch (e) { console.error("Bias check failed", e); } finally { setIsCheckingBias(false); }
  };

  const handleApplyATSSuggestion = async (suggestion: string) => {
      if (!activeResume) return;
      setIsGenerating(true);
      try {
          const updated = await updateResumeWithAI(activeResume, `Implement this specific ATS improvement: ${suggestion}`);
          handleResumeUpdate(updated);
      } catch(e) { console.error(e); } finally { setIsGenerating(false); }
  };

  const handleUpdateStatus = (appId: string, status: Application['status']) => {
      setProfile(prev => ({
          ...prev,
          applications: prev.applications.map(app => {
              if (app.id === appId) return { ...app, status };
              return app;
          })
      }));
  }

  // --- INTELLIGENCE PANEL (Dark Mode, HUD Style) ---
  const InsightsPanel = () => (
      <div className="h-full overflow-y-auto bg-[#0f172a] border-l border-slate-800 w-96 flex flex-col shadow-2xl z-20 transition-all duration-300 custom-scrollbar text-slate-300">
          <div className="p-4 border-b border-slate-800 bg-[#0f172a]/95 sticky top-0 z-10 flex justify-between items-center backdrop-blur-sm">
              <h3 className="font-bold text-white flex items-center gap-2">
                  <BrainCircuit className="w-4 h-4 text-hunj-500" /> Mission Intelligence
              </h3>
              <button onClick={() => setRightPanelOpen(false)} className="text-slate-500 hover:text-white md:hidden">
                  <X className="w-4 h-4"/>
              </button>
          </div>
          
          <div className="p-4 space-y-6">
              {/* 1. Radar Analysis */}
              <MatchAnalysis 
                  score={activeApp?.atsScore || null} 
                  job={activeApp?.jobAnalysis || null}
                  skillMatches={activeApp?.skillMatches || []} 
                  isLoading={isScoring} 
              />

              {/* 2. Smart Action Center */}
              <ActionCenter 
                  score={activeApp?.atsScore || null}
                  skillMatches={activeApp?.skillMatches || []}
                  onApplyFix={handleApplyATSSuggestion}
              />

              {/* 3. Deep Dive Modules */}
              <div className="space-y-4">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Deep Diagnostics</div>
                  <SkillsMatcher matches={activeApp?.skillMatches || []} isLoading={isScoring} />
                  <BiasChecker analysis={activeApp?.biasAnalysis || null} isLoading={isCheckingBias} onAnalyze={handleRunBiasCheck} resume={activeResume} />
              </div>
          </div>
      </div>
  );

  if (showLanding) { return <LandingPage onStart={handleLandingStart} />; }
  if (!currentUser) { return <AuthScreen onLogin={handleLogin} />; }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-hunj-100 flex flex-col overflow-hidden">
      
      {!profile.profileComplete && (
          <OnboardingWizard initialResume={profile.masterResume} onComplete={handleProfileWizardComplete} onSkip={handleSkipOnboarding} />
      )}
      {showTour && profile.profileComplete && <OnboardingTour onComplete={handleOnboardingComplete} />}

      {/* Main Header - Only visible outside app mode */}
      {view !== 'application' && (
        <div className="sticky top-0 z-50 px-4 pt-4 pb-0">
            <header className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-2xl shadow-tactile print:hidden h-16 shrink-0 transition-all duration-200">
                <div className="max-w-[1600px] mx-auto px-6 h-full flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setView('home')}>
                            <div className="bg-hunj-600 p-1.5 rounded-lg shadow-lg shadow-hunj-600/30 group-hover:scale-105 transition-transform duration-200">
                                <Target className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-extrabold text-lg tracking-tight text-slate-900 font-display">HUNJ</span>
                        </div>
                        <nav className="hidden md:flex items-center gap-1 bg-slate-100/50 p-1 rounded-xl">
                            {[
                                { id: 'home', label: 'Command Center', icon: Home },
                                { id: 'apps', label: 'Applications', icon: LayoutGrid },
                                { id: 'job-board', label: 'Job Board', icon: Globe },
                                { id: 'profile', label: 'Profile', icon: Users }
                            ].map(navItem => (
                                <button
                                    key={navItem.id}
                                    onClick={() => setView(navItem.id as any)}
                                    className={`px-4 py-2 text-sm font-bold rounded-lg transition-all duration-200 flex items-center gap-2 ${
                                        view === navItem.id 
                                        ? 'text-slate-900 bg-white shadow-sm' 
                                        : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
                                    }`}
                                >
                                    <navItem.icon className={`w-4 h-4 ${view === navItem.id ? 'text-hunj-600' : 'opacity-70'}`} />
                                    {navItem.label}
                                </button>
                            ))}
                        </nav>
                    </div>
                    <div className="flex items-center gap-4 md:gap-6">
                        <div className="hidden md:flex items-center gap-2 text-xs font-bold text-white bg-gradient-to-r from-hunj-600 to-purple-600 px-3 py-1.5 rounded-full border border-white/20 shadow-md">
                            <Sparkles className="w-3 h-3 text-white" />
                            Lvl {profile.level || 1}
                        </div>
                        <div className="hidden md:flex items-center gap-1.5 text-xs font-medium text-slate-500">
                            {isDataSaved ? (<><Cloud className="w-3 h-3 text-green-600" /><span className="text-green-700">Saved</span></>) : (<><RefreshCw className="w-3 h-3 animate-spin text-hunj-500" /><span>Saving...</span></>)}
                        </div>
                        <div className="hidden sm:block"><PrivacyControl enabled={profile.privacyMode} onToggle={handleTogglePrivacy} /></div>
                        <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-slate-400 hover:text-red-500 transition-colors border-l border-slate-200 pl-4" title="Logout"><LogOut className="w-4 h-4" /></button>
                    </div>
                </div>
            </header>
        </div>
      )}

      {/* Main Views */}
      <div className="flex-1 w-full pt-4">
        {view === 'home' && (
            <CareerOverview 
                profile={profile} 
                onNavigateToApp={(id) => { setActiveAppId(id); setView('application'); }} 
                onFindJobs={() => setView('job-board')} 
                onEditProfile={() => setView('profile')} 
                onUpdateProfile={(p) => setProfile(p)}
            />
        )}
        {view === 'apps' && <div className="w-full h-full overflow-x-hidden"><Dashboard applications={profile.applications} masterResume={profile.masterResume} onNewApplication={handleNewApplicationStart} onSelectApplication={(id) => { setActiveAppId(id); setView('application'); }} onEditProfile={() => setView('profile')} onAnalyzeJob={handleJobAnalyzed} onUpdateStatus={handleUpdateStatus} onNavigateToJobBoard={() => setView('job-board')} /></div>}
        {view === 'job-board' && <JobBoard preferences={profile.preferences} onPersonalize={handlePersonalizeFromJobBoard} />}
        {view === 'profile' && <ProfileHub profile={profile} onUpdateProfile={(p) => setProfile(p)} onBack={() => setView('home')} />}
        {view === 'new-app' && <JobInput onJobAnalyzed={handleJobAnalyzed} onCancel={() => setView('apps')} />}
      </div>

      {/* APPLICATION WORKSPACE */}
      {view === 'application' && (
        <>
            {!isGenerating && generationError && (
                <div className="flex flex-col items-center justify-center h-screen bg-slate-50/80 backdrop-blur-sm p-4 fixed inset-0 z-50">
                    <div className="bg-white p-8 rounded-2xl shadow-tactile max-w-md text-center animate-in zoom-in-95 duration-200 border border-red-100">
                        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-slate-900 mb-2">Generation Failed</h2>
                        <p className="text-slate-500 mb-6">{generationError}</p>
                        <button onClick={() => setView('new-app')} className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-bold">Try Again</button>
                    </div>
                </div>
            )}

            {(isGenerating || (!activeResume && !generationError)) && (
                <div className="flex flex-col items-center justify-center h-screen bg-slate-50 z-50 fixed inset-0 animate-in fade-in duration-500">
                    <div className="relative">
                        <div className="w-24 h-24 border-4 border-slate-200 border-t-hunj-600 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Sparkles className="w-10 h-10 text-hunj-600 animate-pulse" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mt-6 animate-pulse font-display">Constructing Application...</h2>
                    <p className="text-slate-500 mt-2 text-center max-w-md px-4">Parsing intent • Aligning semantic vectors • Optimizing layout</p>
                </div>
            )}

            {activeApp && activeResume && !isGenerating && !generationError && (
                <div className="fixed inset-0 flex h-screen bg-slate-50 overflow-hidden relative z-[60]">
                    
                    {/* LEFT RAIL (Navigation & Tools) */}
                    <aside className="w-20 flex flex-col items-center py-6 bg-white border-r border-slate-200 z-30 shrink-0 shadow-sm">
                        <button onClick={() => setView('apps')} className="p-3 mb-6 rounded-2xl bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-sm" title="Back to Dashboard">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        
                        <div className="flex-1 flex flex-col gap-6 w-full items-center overflow-y-auto no-scrollbar pb-4">
                            {/* Editor Tools */}
                            <div className="flex flex-col gap-3 items-center w-full">
                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 rotate-[-90deg] h-4 w-4 flex items-center justify-center">Craft</div>
                                <button onClick={() => setWorkspaceTab('editor')} className={`p-3.5 rounded-2xl transition-all duration-300 ${workspaceTab === 'editor' ? 'bg-hunj-600 text-white shadow-lg shadow-hunj-600/30 scale-105' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'}`} title="Editor"><PenTool className="w-5 h-5" /></button>
                                <button onClick={() => setWorkspaceTab('preview')} className={`p-3.5 rounded-2xl transition-all duration-300 ${workspaceTab === 'preview' ? 'bg-hunj-600 text-white shadow-lg shadow-hunj-600/30 scale-105' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'}`} title="Preview"><Eye className="w-5 h-5" /></button>
                            </div>
                            
                            <div className="w-10 h-px bg-slate-100"></div>
                            
                            {/* Prep Tools */}
                            <div className="flex flex-col gap-3 items-center w-full">
                                <button onClick={() => setActiveTool('interview')} className={`p-3.5 rounded-2xl transition-all duration-300 ${activeTool === 'interview' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 scale-105' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'}`} title="Mock Interview"><MessageSquare className="w-5 h-5" /></button>
                                <button onClick={() => setActiveTool('cover-letter')} className={`p-3.5 rounded-2xl transition-all duration-300 ${activeTool === 'cover-letter' ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30 scale-105' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'}`} title="Cover Letter"><FileText className="w-5 h-5" /></button>
                            </div>
                            
                            <div className="w-10 h-px bg-slate-100"></div>
                            
                            {/* Strategy Tools */}
                            <div className="flex flex-col gap-3 items-center w-full">
                                <button onClick={() => setActiveTool('networking')} className={`p-3.5 rounded-2xl transition-all duration-300 ${activeTool === 'networking' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 scale-105' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'}`} title="Networking"><Users className="w-5 h-5" /></button>
                                <button onClick={() => setActiveTool('salary')} className={`p-3.5 rounded-2xl transition-all duration-300 ${activeTool === 'salary' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 scale-105' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'}`} title="Salary Intel"><DollarSign className="w-5 h-5" /></button>
                            </div>
                        </div>

                        <button onClick={() => setFocusMode(!focusMode)} className="mt-2 p-3 rounded-2xl hover:bg-slate-50 text-slate-400 hover:text-slate-900 transition-colors" title="Focus Mode">
                            {focusMode ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                        </button>
                    </aside>

                    {/* CENTER STAGE */}
                    <main className="flex-1 flex flex-col relative overflow-hidden bg-slate-50">
                        {/* Toolbar */}
                        <div className="h-20 border-b border-slate-200 bg-white/90 backdrop-blur-sm flex items-center justify-between px-8 shrink-0 z-20 shadow-sm">
                            <div className="flex items-center gap-4 overflow-hidden">
                                <div>
                                    <div className="flex items-baseline gap-2">
                                        <h2 className="font-bold text-slate-900 truncate max-w-[200px] md:max-w-md text-xl font-display tracking-tight">{activeApp.jobTitle}</h2>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <span className="font-semibold text-slate-700">{activeApp.companyName}</span>
                                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                        <StageTracker status={activeApp.status} />
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="hidden md:flex items-center gap-3 mr-4 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest pl-2">V1.0</span>
                                    <div className={`px-3 py-1 rounded-lg text-sm font-bold border shadow-sm ${activeApp.atsScore?.total && activeApp.atsScore.total >= 80 ? 'bg-white text-green-600 border-green-200' : 'bg-white text-orange-600 border-orange-200'}`}>
                                        {activeApp.atsScore?.total || 0}%
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setRightPanelOpen(!rightPanelOpen)}
                                    className={`p-2.5 rounded-xl border transition-all flex items-center gap-2 ${rightPanelOpen ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'text-slate-400 border-transparent hover:bg-white hover:shadow-sm'}`}
                                >
                                    {rightPanelOpen ? <><PanelRightClose className="w-5 h-5"/> <span className="text-xs font-bold hidden xl:block">Intel</span></> : <PanelRightOpen className="w-5 h-5"/>}
                                </button>
                            </div>
                        </div>

                        {/* WORKSPACE AREA */}
                        <div className="flex-1 overflow-hidden relative">
                            {(workspaceTab === 'editor' || workspaceTab === 'preview') && (
                                <div className="h-full w-full relative">
                                    {workspaceTab === 'editor' && (
                                        <div className="h-full p-4 md:p-8 overflow-hidden max-w-5xl mx-auto animate-in slide-in-from-bottom-4 duration-300">
                                            <ResumeEditor resume={activeResume} job={activeApp.jobAnalysis} onUpdate={handleResumeUpdate} />
                                        </div>
                                    )}
                                    {workspaceTab === 'preview' && (
                                        <div className="h-full w-full animate-in fade-in duration-300">
                                            <ResumePreview 
                                                resume={activeResume} 
                                                job={activeApp.jobAnalysis}
                                                onUpdate={handleResumeUpdate}
                                                onThemeUpdate={(t) => handleResumeUpdate({...activeResume, themeConfig: t})}
                                                onApplySuggestion={async (instruction) => {
                                                    const updated = await updateResumeWithAI(activeResume, instruction);
                                                    handleResumeUpdate(updated);
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Floating Tool Modal */}
                            {activeTool && (
                                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-40 flex items-center justify-center p-4 animate-in fade-in duration-200">
                                    <div className="bg-white w-full max-w-5xl h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 ring-1 ring-white/20">
                                        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
                                            <h3 className="font-bold text-xl text-slate-900 capitalize flex items-center gap-3">
                                                {activeTool === 'interview' && <div className="p-2 bg-purple-100 rounded-xl"><MessageSquare className="w-6 h-6 text-purple-600"/></div>}
                                                {activeTool === 'cover-letter' && <div className="p-2 bg-pink-100 rounded-xl"><FileText className="w-6 h-6 text-pink-600"/></div>}
                                                {activeTool === 'networking' && <div className="p-2 bg-emerald-100 rounded-xl"><Users className="w-6 h-6 text-emerald-600"/></div>}
                                                {activeTool === 'salary' && <div className="p-2 bg-green-100 rounded-xl"><DollarSign className="w-6 h-6 text-green-600"/></div>}
                                                {activeTool.replace('-', ' ')}
                                            </h3>
                                            <button onClick={() => setActiveTool(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X className="w-6 h-6 text-slate-400 hover:text-slate-900"/></button>
                                        </div>
                                        <div className="flex-1 overflow-hidden bg-slate-50 p-6">
                                            {activeTool === 'interview' && <InterviewPrep job={activeApp.jobAnalysis!} session={activeApp.interviewSession} onUpdateSession={(s) => setProfile(prev => ({...prev, applications: prev.applications.map(a => a.id === activeAppId ? { ...a, interviewSession: s } : a)}))} />}
                                            {activeTool === 'cover-letter' && <CoverLetterEditor resume={activeResume} job={activeApp.jobAnalysis!} currentLetter={activeApp.coverLetter} onUpdate={(letter) => setProfile(prev => ({...prev, applications: prev.applications.map(a => a.id === activeAppId ? { ...a, coverLetter: letter } : a)}))} />}
                                            {activeTool === 'networking' && <NetworkingHub job={activeApp.jobAnalysis!} strategy={activeApp.networkingStrategy} onUpdate={(s) => setProfile(prev => ({...prev, applications: prev.applications.map(a => a.id === activeAppId ? { ...a, networkingStrategy: s } : a)}))} />}
                                            {activeTool === 'salary' && <SalaryInsights job={activeApp.jobAnalysis!} insight={activeApp.salaryInsight} onUpdate={(s) => setProfile(prev => ({...prev, applications: prev.applications.map(a => a.id === activeAppId ? { ...a, salaryInsight: s } : a)}))} />}
                                            {activeTool === 'linkedin' && <LinkedInOptimizer resume={activeResume} profile={activeApp.linkedInProfile} onUpdate={(p) => setProfile(prev => ({...prev, applications: prev.applications.map(a => a.id === activeAppId ? { ...a, linkedInProfile: p } : a)}))} />}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Floating Copilot */}
                        <div className="absolute bottom-8 right-8 z-30">
                            <AIChatAssistant resume={activeResume} onUpdate={handleResumeUpdate} mode="widget" />
                        </div>
                    </main>

                    {/* RIGHT PANEL (Intelligence HUD) */}
                    {rightPanelOpen && (
                        <aside className="w-[400px] border-l border-slate-200 shrink-0 hidden lg:block shadow-2xl relative z-20 animate-in slide-in-from-right duration-300">
                            <InsightsPanel />
                        </aside>
                    )}
                </div>
            )}
        </>
      )}

      {/* Global Mobile Nav (Hidden in Application Mode) */}
      {view !== 'application' && (
        <div className="md:hidden fixed bottom-0 left-0 w-full bg-slate-900 border-t border-slate-800 flex justify-around items-center h-16 z-[60] shadow-lg">
            <button onClick={() => { setView('home'); setActiveAppId(null); }} className={`flex flex-col items-center gap-1 w-full h-full justify-center transition-colors ${view === 'home' ? 'text-blue-400' : 'text-slate-400'}`}><Home className="w-5 h-5" /><span className="text-[10px] font-medium">Home</span></button>
            <button onClick={() => { setView('apps'); setActiveAppId(null); }} className={`flex flex-col items-center gap-1 w-full h-full justify-center transition-colors ${view === 'apps' ? 'text-blue-400' : 'text-slate-400'}`}><LayoutGrid className="w-5 h-5" /><span className="text-[10px] font-medium">Apps</span></button>
            <button onClick={() => { setView('job-board')} className={`flex flex-col items-center gap-1 w-full h-full justify-center transition-colors ${view === 'job-board' ? 'text-blue-400' : 'text-slate-400'}`}><Globe className="w-5 h-5" /><span className="text-[10px] font-medium">Jobs</span></button>
            <button onClick={() => setView('profile')} className={`flex flex-col items-center gap-1 w-full h-full justify-center transition-colors ${view === 'profile' ? 'text-blue-400' : 'text-slate-400'}`}><Users className="w-5 h-5" /><span className="text-[10px] font-medium">Profile</span></button>
        </div>
      )}
    </div>
  );
};

export default App;