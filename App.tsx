
import React, { useState, useEffect, useRef } from 'react';
import { JobAnalysis, ResumeData, ATSScore, SkillMatch, UserProfile, Application, BiasAnalysis, InterviewMessage, LinkedInProfile, SalaryInsight, NetworkingStrategy, DocumentItem, ResumeThemeConfig, ExternalJob, User } from './types';
import JobInput from './components/JobInput';
import ResumeEditor from './components/ResumeEditor';
import ATSScoreChart from './components/ATSScoreChart';
import SkillsMatcher from './components/SkillsMatcher';
import BiasChecker from './components/BiasChecker';
import Dashboard from './components/Dashboard';
import CareerOverview from './components/CareerOverview';
import StageTracker from './components/StageTracker';
import CoverLetterEditor from './components/CoverLetter';
import ProfileHub from './components/ProfileHub';
import ResumePreview from './components/ResumePreview';
import AIChatAssistant from './components/AIChatAssistant';
import InterviewPrep from './components/InterviewPrep';
import LinkedInOptimizer from './components/LinkedInOptimizer';
import SalaryInsights from './components/SalaryInsights';
import NetworkingHub from './components/NetworkingHub';
import PrivacyControl from './components/PrivacyControl';
import DiffViewer from './components/DiffViewer';
import DeepDiveProber from './components/DeepDiveProber';
import JobBoard from './components/JobBoard';
import AuthScreen from './components/AuthScreen';
import LandingPage from './components/LandingPage';
import OnboardingTour from './components/OnboardingTour';
import OnboardingWizard from './components/OnboardingWizard';
import { calculateATSScore, generateTailoredResume, analyzeSkillsGap, analyzeBias, updateResumeWithAI, analyzeJobDescription } from './services/geminiService';
import { storageService } from './services/storageService';
import { logger } from './services/loggingService';
import { anonymizeResume, restorePII } from './utils/privacy';
import { Target, GitCompare, Printer, Eye, MessageSquare, Linkedin, PenTool, Globe, ArrowLeft, LogOut, RefreshCw, AlertTriangle, PlusCircle, LayoutGrid, Check, Cloud, Bell, DollarSign, Users, FileText, Sparkles, BrainCircuit, BarChart3, Briefcase, Home, Menu, X, ChevronRight, Layers } from 'lucide-react';

// --- INITIAL RESUME DATA (Generic Template) ---
const INITIAL_RESUME: ResumeData = {
  id: 'master',
  versionName: 'Master v1',
  timestamp: Date.now(),
  style: 'Base',
  design: 'Sidebar',
  themeConfig: {
      template: 'Minimalist',
      font: 'Inter',
      accentColor: '#334155', // Slate
      fontSize: 'medium',
      spacing: 'normal'
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
  interests: [],
  strengths: [],
  education: '',
  educationVisible: true,
  experience: [],
  projects: [],
  certifications: [],
  publications: [],
  affiliations: []
};

const INITIAL_DOCS: DocumentItem[] = [];

type AppViewMode = 'workspace' | 'deep-dive' | 'compare' | 'interview' | 'linkedin' | 'cover-letter' | 'salary' | 'networking';
type WorkspaceTab = 'analysis' | 'editor' | 'preview';

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
      targetRoles: []
    },
    documents: INITIAL_DOCS,
    onboardingSeen: false,
    profileComplete: false
  });

  const [view, setView] = useState<'home' | 'apps' | 'new-app' | 'application' | 'profile' | 'job-board'>('home');
  const [activeAppId, setActiveAppId] = useState<string | null>(null);
  
  // Application View States
  const [appViewMode, setAppViewMode] = useState<AppViewMode>('workspace');
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>('analysis');
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  // Generation States
  const [isGenerating, setIsGenerating] = useState(false);
  const [isScoring, setIsScoring] = useState(false);
  const [isCheckingBias, setIsCheckingBias] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [compareVersionId, setCompareVersionId] = useState<string | null>(null);

  // --- INITIALIZATION & STORAGE EFFECTS ---
  
  useEffect(() => {
      const activeSession = storageService.getSession();
      if (activeSession) {
          setCurrentUser(activeSession);
          setShowLanding(false);
          
          const storedProfile = storageService.loadUserProfile(activeSession.id);
          if (storedProfile) {
              setProfile(storedProfile);
          }
      }
  }, []);

  // Persist Profile Changes
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

  // --- DERIVED STATE ---
  const activeApp = profile.applications.find(app => app.id === activeAppId);
  const activeResume = activeApp?.resumes.find(r => r.id === activeApp.activeResumeId);
  const compareResume = activeApp?.resumes.find(r => r.id === compareVersionId);

  // --- HANDLERS ---

  const handleLandingStart = () => {
      setShowLanding(false);
  };

  const handleLogin = (user: User, isNewUser: boolean) => {
      setCurrentUser(user);
      storageService.saveSession(user); 
      
      const storedProfile = storageService.loadUserProfile(user.id);
      
      if (storedProfile) {
          setProfile(storedProfile);
          if (!storedProfile.onboardingSeen && storedProfile.profileComplete) {
              setShowTour(true);
          }
      } else {
          // Initialize for new user
          const newProfile = { ...profile };
          if (isNewUser) {
              newProfile.masterResume.fullName = user.name;
              newProfile.masterResume.email = user.email;
          }
          setProfile(newProfile);
          storageService.saveUserProfile(user.id, newProfile);
      }
      logger.info("User session started", { userId: user.id });
  };

  const handleProfileWizardComplete = (resume: ResumeData, targetRole: string) => {
      setProfile(prev => ({
          ...prev,
          masterResume: resume,
          preferences: { ...prev.preferences, targetRoles: [targetRole] },
          profileComplete: true,
          onboardingSeen: false 
      }));
      setShowTour(true);
  };

  const handleOnboardingComplete = () => {
      setShowTour(false);
      setProfile(prev => ({ ...prev, onboardingSeen: true }));
  };

  const handleLogout = () => {
      setCurrentUser(null);
      storageService.clearSession(); 
      setProfile({
        masterResume: INITIAL_RESUME,
        applications: [],
        privacyMode: false,
        preferences: profile.preferences,
        documents: [],
        onboardingSeen: false,
        profileComplete: false
      });
      setView('home');
      setShowLanding(true);
  };

  const handleTogglePrivacy = (enabled: boolean) => {
    setProfile(prev => ({ ...prev, privacyMode: enabled }));
  };

  const prepareResumeForAI = (resume: ResumeData): ResumeData => {
    return profile.privacyMode ? anonymizeResume(resume) : resume;
  };

  const handleNewApplicationStart = () => {
    setView('new-app');
  };

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
    
    setProfile(prev => ({
        ...prev,
        applications: [newApp, ...prev.applications]
    }));
    setActiveAppId(newApp.id);
    setView('application');
    setAppViewMode('workspace');
    setWorkspaceTab('analysis');

    try {
      const inputResume = prepareResumeForAI(profile.masterResume);
      
      const [tailoredResumes, skillsResult] = await Promise.all([
        generateTailoredResume(inputResume, analysis),
        analyzeSkillsGap(inputResume.skills, analysis.requiredSkills)
      ]);
      
      const restoredResumes = tailoredResumes.map(r => profile.privacyMode ? restorePII(r, profile.masterResume) : r);
      const initialVariant = restoredResumes[0];

      const scoreResult = await calculateATSScore(initialVariant, analysis);

      setProfile(prev => ({
          ...prev,
          applications: prev.applications.map(app => {
              if (app.id === newApp.id) {
                  return {
                      ...app,
                      resumes: restoredResumes,
                      activeResumeId: initialVariant.id,
                      atsScore: scoreResult,
                      skillMatches: skillsResult
                  };
              }
              return app;
          })
      }));

    } catch (error: any) {
      setGenerationError(error.message || "An unexpected error occurred while generating the resume.");
    } finally {
      setIsGenerating(false);
      setIsScoring(false);
    }
  };

  const handlePersonalizeFromJobBoard = async (job: ExternalJob) => {
      const jobText = `
          Title: ${job.title}
          Company: ${job.company}
          Location: ${job.location}
          Description: ${job.description}
          Requirements: ${job.requirements.join(', ')}
      `;
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
                return {
                    ...app,
                    resumes: app.resumes.map(r => r.id === updatedResume.id ? updatedResume : r)
                };
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
      } catch (e) {
          console.error("Bias check failed", e);
      } finally {
          setIsCheckingBias(false);
      }
  };

  const handleApplyATSSuggestion = async (suggestion: string) => {
      if (!activeResume) return;
      setIsGenerating(true);
      try {
          const updated = await updateResumeWithAI(activeResume, `Implement this specific ATS improvement: ${suggestion}`);
          handleResumeUpdate(updated);
      } catch(e) {
          console.error(e);
      } finally {
          setIsGenerating(false);
      }
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

  // --- REUSABLE COMPONENT: AI INSIGHTS TAB ---
  const InsightsView = () => (
      <div className="h-full overflow-y-auto p-4 md:p-6 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-devops-100 p-4 mb-4">
              <h3 className="text-lg font-bold text-devops-900 mb-2">AI Analysis Dashboard</h3>
              <p className="text-sm text-devops-500">Real-time feedback on your resume's performance.</p>
          </div>
          <ATSScoreChart 
              score={activeApp?.atsScore || null} 
              isLoading={isScoring}
              onApplySuggestion={handleApplyATSSuggestion}
          />
          
          <SkillsMatcher 
              matches={activeApp?.skillMatches || []} 
              isLoading={isScoring} 
          />
          
          <BiasChecker 
              analysis={activeApp?.biasAnalysis || null} 
              isLoading={isCheckingBias} 
              onAnalyze={handleRunBiasCheck} 
          />
      </div>
  );

  // --- VIEW RENDERING ---

  if (showLanding) {
      return <LandingPage onStart={handleLandingStart} />;
  }

  if (!currentUser) {
      return <AuthScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 print:bg-white flex flex-col pb-20 md:pb-0">
      
      {/* Onboarding Wizard */}
      {(!profile.profileComplete || !profile.masterResume.role) && (
          <OnboardingWizard 
            initialResume={profile.masterResume}
            onComplete={handleProfileWizardComplete}
          />
      )}

      {/* Main Tour */}
      {showTour && profile.profileComplete && <OnboardingTour onComplete={handleOnboardingComplete} />}

      {/* Header - Visible in Dashboard Modes (Desktop Nav added here) */}
      {view !== 'application' && (
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 print:hidden shadow-sm">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setView('home')}>
                        <div className="bg-slate-900 p-1.5 rounded-lg shadow-lg group-hover:scale-105 transition-transform">
                            <Target className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-extrabold text-lg tracking-tight text-slate-900">HUNJ</span>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-1">
                        <button 
                            onClick={() => setView('home')} 
                            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${view === 'home' ? 'text-blue-600 bg-blue-50' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
                        >
                            Overview
                        </button>
                        <button 
                            onClick={() => setView('apps')} 
                            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${view === 'apps' ? 'text-blue-600 bg-blue-50' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
                        >
                            Applications
                        </button>
                        <button 
                            onClick={() => setView('job-board')} 
                            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${view === 'job-board' ? 'text-blue-600 bg-blue-50' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
                        >
                            Job Board
                        </button>
                        <button 
                            onClick={() => setView('profile')} 
                            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${view === 'profile' ? 'text-blue-600 bg-blue-50' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
                        >
                            Profile
                        </button>
                    </nav>
                </div>
            
                <div className="flex items-center gap-4 md:gap-6">
                    <div className="hidden md:flex items-center gap-1.5 text-xs font-medium text-slate-500">
                        {isDataSaved ? (
                            <><Cloud className="w-3 h-3 text-green-600" /><span className="text-green-700">Saved</span></>
                        ) : (
                            <><RefreshCw className="w-3 h-3 animate-spin text-blue-600" /><span>Saving...</span></>
                        )}
                    </div>

                    <div className="hidden sm:block">
                        <PrivacyControl enabled={profile.privacyMode} onToggle={handleTogglePrivacy} />
                    </div>

                    <button 
                        onClick={handleLogout}
                        className="flex items-center gap-2 text-sm text-slate-400 hover:text-red-500 transition-colors border-l border-slate-200 pl-4"
                        title="Logout"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </header>
      )}

      {/* VIEW: HOME / OVERVIEW */}
      {view === 'home' && (
          <CareerOverview 
            profile={profile} 
            onNavigateToApp={(id) => { setActiveAppId(id); setView('application'); setAppViewMode('workspace'); setWorkspaceTab('analysis'); }}
            onFindJobs={() => setView('job-board')}
            onEditProfile={() => setView('profile')}
          />
      )}

      {/* VIEW: APPS DASHBOARD */}
      {view === 'apps' && (
          <div className="flex-1 bg-slate-50 w-full overflow-x-hidden">
            <Dashboard 
                applications={profile.applications} 
                masterResume={profile.masterResume}
                onNewApplication={handleNewApplicationStart}
                onSelectApplication={(id) => { setActiveAppId(id); setView('application'); setAppViewMode('workspace'); setWorkspaceTab('analysis'); }}
                onEditProfile={() => setView('profile')}
                onAnalyzeJob={handleJobAnalyzed}
                onUpdateStatus={handleUpdateStatus}
                onNavigateToJobBoard={() => setView('job-board')}
            />
          </div>
      )}

      {/* VIEW: JOB BOARD */}
      {view === 'job-board' && (
          <JobBoard preferences={profile.preferences} onPersonalize={handlePersonalizeFromJobBoard} />
      )}

      {/* VIEW: PROFILE HUB */}
      {view === 'profile' && (
        <ProfileHub profile={profile} onUpdateProfile={(p) => setProfile(p)} onBack={() => setView('home')} />
      )}

      {/* VIEW: NEW APPLICATION */}
      {view === 'new-app' && (
          <JobInput onJobAnalyzed={handleJobAnalyzed} onCancel={() => setView('apps')} />
      )}

      {/* VIEW: APPLICATION WORKSPACE */}
      {view === 'application' && activeApp && activeResume && (
        <div className="flex h-[100dvh] bg-slate-50 relative overflow-hidden">
            
            {/* MOBILE SIDEBAR OVERLAY */}
            {showMobileSidebar && (
                <div 
                    className="fixed inset-0 bg-black/50 z-[70] md:hidden backdrop-blur-sm"
                    onClick={() => setShowMobileSidebar(false)}
                />
            )}

            {/* LEFT NAVIGATION SIDEBAR (Collapsible on Mobile) */}
            <aside className={`
                fixed md:relative top-0 left-0 h-full w-72 bg-devops-900 border-r border-devops-800 z-[80] transition-transform duration-300 flex flex-col
                ${showMobileSidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                <div className="p-4 border-b border-devops-800 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-white font-bold cursor-pointer" onClick={() => setView('apps')}>
                        <div className="bg-blue-600 p-1 rounded">
                            <Target className="w-4 h-4 text-white" />
                        </div>
                        HUNJ
                    </div>
                    <button onClick={() => setShowMobileSidebar(false)} className="md:hidden text-devops-400">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 border-b border-devops-800">
                    <h2 className="text-sm font-bold text-white line-clamp-1">{activeApp.jobTitle}</h2>
                    <p className="text-xs text-devops-400 line-clamp-1">{activeApp.companyName}</p>
                    <div className="mt-3">
                        <StageTracker status={activeApp.status} probability={activeApp.jobAnalysis?.hiringProbability} />
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto p-3 space-y-1">
                    <button 
                        onClick={() => { setAppViewMode('workspace'); setShowMobileSidebar(false); }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${appViewMode === 'workspace' ? 'bg-blue-600 text-white shadow-md' : 'text-devops-300 hover:bg-devops-800 hover:text-white'}`}
                    >
                        <Layers className="w-4 h-4" /> Core Workspace
                    </button>
                    
                    <div className="pt-4 pb-2 px-3 text-[10px] font-bold text-devops-500 uppercase tracking-wider">Advanced Tools</div>
                    
                    {[
                        { id: 'deep-dive', label: 'Deep Dive Prober', icon: Target },
                        { id: 'compare', label: 'Compare Versions', icon: GitCompare },
                        { id: 'interview', label: 'Mock Interview', icon: MessageSquare },
                        { id: 'cover-letter', label: 'Cover Letter', icon: FileText },
                        { id: 'linkedin', label: 'LinkedIn Optimization', icon: Linkedin },
                        { id: 'salary', label: 'Salary Insights', icon: DollarSign },
                        { id: 'networking', label: 'Networking', icon: Users }
                    ].map(item => (
                        <button
                            key={item.id}
                            onClick={() => { setAppViewMode(item.id as AppViewMode); setShowMobileSidebar(false); }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${appViewMode === item.id ? 'bg-devops-800 text-white border-l-2 border-accent-500' : 'text-devops-300 hover:bg-devops-800 hover:text-white'}`}
                        >
                            <item.icon className="w-4 h-4" /> {item.label}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-devops-800">
                    <button onClick={() => setView('apps')} className="flex items-center gap-2 text-xs text-devops-500 hover:text-white transition-colors">
                        <ArrowLeft className="w-3 h-3" /> Back to Apps
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 flex flex-col h-full overflow-hidden w-full">
                
                {/* Mobile Header (Sidebar Toggle) */}
                <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setShowMobileSidebar(true)} className="p-1 text-slate-600">
                            <Menu className="w-6 h-6" />
                        </button>
                        <span className="font-bold text-slate-900 truncate max-w-[200px]">{activeApp.companyName}</span>
                    </div>
                    {/* Show active mode label */}
                    <span className="text-xs font-bold px-2 py-1 bg-slate-100 rounded text-slate-600 capitalize">
                        {appViewMode.replace('-', ' ')}
                    </span>
                </div>

                {/* WORKSPACE VIEW (Tabs for Analysis/Editor/Preview) */}
                {appViewMode === 'workspace' && (
                    <div className="flex flex-col h-full">
                        {/* Workspace Tabs */}
                        <div className="bg-white border-b border-slate-200 px-4 pt-4 pb-0 flex gap-4 overflow-x-auto no-scrollbar shrink-0 shadow-sm z-10">
                            {[
                                { id: 'analysis', label: 'AI Insights', icon: BrainCircuit },
                                { id: 'editor', label: 'Editor', icon: PenTool },
                                { id: 'preview', label: 'Preview', icon: Eye }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setWorkspaceTab(tab.id as WorkspaceTab)}
                                    className={`flex items-center gap-2 px-4 py-3 border-b-2 font-semibold text-sm whitespace-nowrap transition-colors ${workspaceTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
                                >
                                    <tab.icon className="w-4 h-4" /> {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Workspace Content */}
                        <div className="flex-1 overflow-hidden bg-slate-50 relative">
                            {workspaceTab === 'analysis' && <InsightsView />}
                            
                            {workspaceTab === 'editor' && (
                                <div className="h-full p-0 md:p-6 overflow-hidden">
                                    <ResumeEditor 
                                        resume={activeResume} 
                                        job={activeApp.jobAnalysis} 
                                        onUpdate={handleResumeUpdate}
                                    />
                                </div>
                            )}
                            
                            {workspaceTab === 'preview' && (
                                <ResumePreview 
                                    resume={activeResume} 
                                    job={activeApp.jobAnalysis}
                                    onThemeUpdate={(t) => handleResumeUpdate({...activeResume, themeConfig: t})}
                                    onApplySuggestion={async (instruction) => {
                                        const updated = await updateResumeWithAI(activeResume, instruction);
                                        handleResumeUpdate(updated);
                                    }}
                                />
                            )}
                        </div>
                    </div>
                )}

                {/* ADVANCED TOOLS VIEWS */}
                {appViewMode !== 'workspace' && (
                    <div className="flex-1 overflow-hidden bg-slate-50 p-0 md:p-6 relative">
                        {appViewMode === 'deep-dive' && activeApp.jobAnalysis && (
                             <DeepDiveProber 
                                resume={activeResume} 
                                job={activeApp.jobAnalysis} 
                                onAddBullet={(section, id, text) => { 
                                    if (section === 'experience') {
                                        const updatedExp = activeResume.experience.map(exp => {
                                            if ((id && exp.id === id) || (!id && activeResume.experience.length > 0 && exp.id === activeResume.experience[0].id)) { 
                                                return { ...exp, bullets: [...exp.bullets, { id: `gen-bull-${Date.now()}`, text, visible: true }] };
                                            }
                                            return exp;
                                        });
                                        handleResumeUpdate({ ...activeResume, experience: updatedExp });
                                    }
                                }} 
                            />
                        )}
                        {appViewMode === 'compare' && (
                             <div className="h-full bg-white md:rounded-xl shadow-sm overflow-hidden p-4">
                                {compareResume ? (
                                    <DiffViewer oldResume={compareResume} newResume={activeResume} />
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                        <GitCompare className="w-12 h-12 mb-4 opacity-20" />
                                        <p>Go to sidebar to select a version to compare.</p>
                                        {/* Simple version selector for demo */}
                                        <div className="mt-4 flex flex-wrap gap-2 justify-center">
                                            {activeApp.resumes.map((v, i) => (
                                                <button key={v.id} onClick={() => setCompareVersionId(v.id)} className="px-3 py-1 bg-slate-100 rounded text-xs text-slate-700">
                                                    {v.versionName || `Version ${i+1}`}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                             </div>
                        )}
                        {appViewMode === 'interview' && activeApp.jobAnalysis && (
                             <InterviewPrep 
                                job={activeApp.jobAnalysis} 
                                session={activeApp.interviewSession} 
                                onUpdateSession={(s) => setProfile(prev => ({...prev, applications: prev.applications.map(a => a.id === activeAppId ? { ...a, interviewSession: s } : a)}))} 
                            />
                        )}
                        {appViewMode === 'cover-letter' && activeApp.jobAnalysis && (
                            <CoverLetterEditor 
                                resume={activeResume} 
                                job={activeApp.jobAnalysis} 
                                currentLetter={activeApp.coverLetter}
                                onUpdate={(letter) => setProfile(prev => ({...prev, applications: prev.applications.map(a => a.id === activeAppId ? { ...a, coverLetter: letter } : a)}))}
                            />
                        )}
                        {appViewMode === 'linkedin' && (
                             <LinkedInOptimizer 
                                resume={activeResume} 
                                profile={activeApp.linkedInProfile} 
                                onUpdate={(p) => setProfile(prev => ({...prev, applications: prev.applications.map(a => a.id === activeAppId ? { ...a, linkedInProfile: p } : a)}))} 
                            />
                        )}
                        {appViewMode === 'salary' && activeApp.jobAnalysis && (
                            <SalaryInsights 
                                job={activeApp.jobAnalysis} 
                                insight={activeApp.salaryInsight} 
                                onUpdate={(insight) => setProfile(prev => ({...prev, applications: prev.applications.map(a => a.id === activeAppId ? { ...a, salaryInsight: insight } : a)}))}
                            />
                        )}
                        {appViewMode === 'networking' && activeApp.jobAnalysis && (
                            <NetworkingHub 
                                job={activeApp.jobAnalysis} 
                                strategy={activeApp.networkingStrategy} 
                                onUpdate={(strategy) => setProfile(prev => ({...prev, applications: prev.applications.map(a => a.id === activeAppId ? { ...a, networkingStrategy: strategy } : a)}))}
                            />
                        )}
                    </div>
                )}

                {/* Copilot Floating Button */}
                <div className="absolute bottom-6 right-6 z-50">
                    <AIChatAssistant 
                        resume={activeResume} 
                        onUpdate={handleResumeUpdate} 
                        mode="widget"
                    />
                </div>

            </main>
        </div>
      )}

      {/* GLOBAL MOBILE BOTTOM NAVIGATION (4 Tabs) */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-slate-900 border-t border-slate-800 flex justify-around items-center h-16 z-[60] shadow-lg">
          <button 
              onClick={() => { setView('home'); setActiveAppId(null); }}
              className={`flex flex-col items-center gap-1 w-full h-full justify-center ${view === 'home' ? 'text-blue-400' : 'text-slate-400'}`}
          >
              <Home className="w-5 h-5" />
              <span className="text-[10px] font-medium">Home</span>
          </button>
          <button 
              onClick={() => { setView('apps'); setActiveAppId(null); }}
              className={`flex flex-col items-center gap-1 w-full h-full justify-center ${view === 'apps' || view === 'application' ? 'text-blue-400' : 'text-slate-400'}`}
          >
              <LayoutGrid className="w-5 h-5" />
              <span className="text-[10px] font-medium">Apps</span>
          </button>
          <button 
              onClick={() => setView('job-board')}
              className={`flex flex-col items-center gap-1 w-full h-full justify-center ${view === 'job-board' ? 'text-blue-400' : 'text-slate-400'}`}
          >
              <Globe className="w-5 h-5" />
              <span className="text-[10px] font-medium">Jobs</span>
          </button>
          <button 
              onClick={() => setView('profile')}
              className={`flex flex-col items-center gap-1 w-full h-full justify-center ${view === 'profile' ? 'text-blue-400' : 'text-slate-400'}`}
          >
              <Users className="w-5 h-5" />
              <span className="text-[10px] font-medium">Profile</span>
          </button>
      </div>

    </div>
  );
};

export default App;
