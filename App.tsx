
import React, { useState, useEffect, useRef } from 'react';
import { JobAnalysis, ResumeData, ATSScore, SkillMatch, UserProfile, Application, BiasAnalysis, InterviewMessage, LinkedInProfile, SalaryInsight, NetworkingStrategy, DocumentItem, ResumeThemeConfig, ExternalJob, User, SubscriptionTier } from './types';
import JobInput from './components/JobInput';
import ResumeEditor from './components/ResumeEditor';
import MatchAnalysis from './components/MatchAnalysis';
import ActionCenter from './components/ActionCenter';
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
import DeepDiveProber from './components/DeepDiveProber';
import AutofillAssistant from './components/AutofillAssistant';
import JobBoard from './components/JobBoard';
import AuthScreen from './components/AuthScreen';
import LandingPage from './components/LandingPage';
import OnboardingTour from './components/OnboardingTour';
import OnboardingWizard from './components/OnboardingWizard';
import PricingModal from './components/PricingModal';
import { calculateATSScore, generateTailoredResume, assembleSmartResume, analyzeSkillsGap, analyzeBias, updateResumeWithAI, analyzeJobDescription, sanitizeResumeData } from './services/geminiService';
import { storageService } from './services/storageService';
import { logger } from './services/loggingService';
import { anonymizeResume, restorePII } from './utils/privacy';
import { Target, Eye, MessageSquare, Linkedin, PenTool, Globe, ArrowLeft, RefreshCw, AlertTriangle, Cloud, DollarSign, Users, FileText, Sparkles, BrainCircuit, LayoutGrid, Home, Menu, X, Minimize2, Maximize2, PanelRightClose, PanelRightOpen, Bell, ArrowRight, Lock, Download, CheckCircle2, Languages, LifeBuoy, Mail } from 'lucide-react';
import ATSScoreChart from './components/ATSScoreChart';
import { ensureDailyUsage, FREE_LIMITS, getEffectivePlan, hasFeatureAccess, PLAN_LABEL, PremiumFeature } from './services/planService';
import { billingService } from './services/billingService';
import { backendDataService } from './services/backendDataService';

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
  const [isProfileHydrated, setIsProfileHydrated] = useState(false);
  
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
    dataSources: [],
    billing: { plan: 'free', status: 'active' },
    usageStats: ensureDailyUsage()
  });

  const [view, setView] = useState<'home' | 'apps' | 'new-app' | 'application' | 'profile' | 'job-board' | 'help' | 'contact' | 'language' | 'settings' | 'subscription'>('home');
  const [activeAppId, setActiveAppId] = useState<string | null>(null);
  const [language, setLanguage] = useState<'English' | 'Spanish'>('English');
  
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
  const [pricingOpen, setPricingOpen] = useState(false);
  const [pricingReason, setPricingReason] = useState<string>('');
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isBillingActionLoading, setIsBillingActionLoading] = useState(false);

  const migrateProfile = (storedProfile: any): UserProfile => ({
      ...profile,
      ...storedProfile,
      preferences: { ...profile.preferences, ...(storedProfile?.preferences || {}) },
      masterResume: sanitizeResumeData(storedProfile?.masterResume || INITIAL_RESUME),
      applications: Array.isArray(storedProfile?.applications)
          ? storedProfile.applications.map((app: any) => ({
              ...app,
              resumes: Array.isArray(app.resumes) ? app.resumes.map((r: any) => sanitizeResumeData(r)) : []
          }))
          : [],
      xp: storedProfile?.xp || 0,
      streak: storedProfile?.streak || 1,
      level: storedProfile?.level || 1,
      dailyGoals: storedProfile?.dailyGoals || profile.dailyGoals,
      achievements: storedProfile?.achievements || [],
      dataSources: storedProfile?.dataSources || [],
      billing: storedProfile?.billing || { plan: 'free', status: 'active' },
      usageStats: ensureDailyUsage(storedProfile?.usageStats)
  });

  // --- INITIALIZATION & STORAGE EFFECTS ---
  useEffect(() => {
      const run = async () => {
          const activeSession = storageService.getSession();
          if (!activeSession) {
              setIsProfileHydrated(true);
              return;
          }
          setCurrentUser(activeSession);
          setShowLanding(false);
          try {
              const localProfile = storageService.loadUserProfile(activeSession.id);
              if (localProfile) {
                  setProfile(migrateProfile(localProfile));
              }

              // Firestore profile is source of truth when available.
              const cloudProfile = await backendDataService.getProfile(activeSession.id);
              if (cloudProfile) {
                  const merged = migrateProfile(cloudProfile);
                  setProfile(merged);
                  storageService.saveUserProfile(activeSession.id, merged);
              }
          } catch (e) {
              console.error("CRITICAL: Failed to load/migrate profile.", e);
              storageService.clearSession();
              localStorage.clear();
              setShowLanding(true);
              setCurrentUser(null);
          } finally {
              setIsProfileHydrated(true);
          }
      };
      run();
  }, []);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
      if (currentUser && profile && isProfileHydrated) {
          setIsDataSaved(false);
          if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
          saveTimeoutRef.current = setTimeout(async () => {
              try {
                  storageService.saveUserProfile(currentUser.id, profile);
                  await backendDataService.saveProfile(currentUser.id, profile);
              } catch (error) {
                  logger.error('Failed to persist profile to backend', error);
              } finally {
                  setIsDataSaved(true);
              }
          }, 1000);
      }
  }, [profile, currentUser, isProfileHydrated]);

  const activeApp = profile.applications.find(app => app.id === activeAppId);
  const activeResume = activeApp?.resumes.find(r => r.id === activeApp.activeResumeId);
  const effectivePlan = getEffectivePlan(profile.billing);

  useEffect(() => {
      if (view === 'application' && !isGenerating && !generationError && (!activeAppId || !activeApp)) {
          setView('apps');
      }
  }, [view, isGenerating, generationError, activeAppId, activeApp]);

  useEffect(() => {
      if (!currentUser) return;
      const run = async () => {
          const billing = await billingService.syncSubscription(currentUser);
          if (!billing) return;
          setProfile(prev => ({ ...prev, billing: { ...prev.billing, ...billing } }));
      };
      run();
  }, [currentUser]);

  const handleLandingStart = () => { setShowLanding(false); };

  const handleLogin = async (user: User, isNewUser: boolean) => {
      setIsProfileHydrated(false);
      setCurrentUser(user);
      storageService.saveSession(user); 
      await backendDataService.upsertUser(user);
      try {
          const cloudProfile = await backendDataService.getProfile(user.id);
          if (cloudProfile) {
              const migratedCloud = migrateProfile(cloudProfile);
              setProfile(migratedCloud);
              storageService.saveUserProfile(user.id, migratedCloud);
              if (!cloudProfile.onboardingSeen && cloudProfile.profileComplete) setShowTour(true);
          } else {
              const storedProfile = storageService.loadUserProfile(user.id);
              if (storedProfile) {
                  const migratedProfile = migrateProfile(storedProfile);
                  setProfile(migratedProfile);
                  await backendDataService.saveProfile(user.id, migratedProfile);
                  if (!storedProfile.onboardingSeen && storedProfile.profileComplete) setShowTour(true);
              } else {
                  const newProfile = { ...profile };
                  if (isNewUser) { newProfile.masterResume.fullName = user.name; newProfile.masterResume.email = user.email; }
                  setProfile(newProfile);
                  storageService.saveUserProfile(user.id, newProfile);
                  await backendDataService.saveProfile(user.id, newProfile);
              }
          }
      } catch (e) {
          const newProfile = { ...profile };
          newProfile.masterResume.fullName = user.name;
          setProfile(newProfile);
      } finally {
          setIsProfileHydrated(true);
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
      setProfile({ masterResume: INITIAL_RESUME, applications: [], privacyMode: false, preferences: profile.preferences, documents: [], onboardingSeen: false, profileComplete: false, achievements: [], dataSources: [], billing: { plan: 'free', status: 'active' }, usageStats: ensureDailyUsage() });
      setView('home');
      setShowLanding(true);
  };

  const handleTogglePrivacy = (enabled: boolean) => { setProfile(prev => ({ ...prev, privacyMode: enabled })); };
  const prepareResumeForAI = (resume: ResumeData): ResumeData => profile.privacyMode ? anonymizeResume(resume) : resume;
  const openPricing = (reason: string) => {
      setPricingReason(reason);
      setPricingOpen(true);
  };

  const handleStartCheckout = (tier: SubscriptionTier) => {
      if (!currentUser) return;
      billingService.openCheckout(currentUser, tier);
  };

  const handleRefreshSubscription = async () => {
      if (!currentUser) return;
      const billing = await billingService.syncSubscription(currentUser);
      if (billing) {
          setProfile(prev => ({ ...prev, billing: { ...prev.billing, ...billing } }));
      }
  };

  const handleCancelSubscription = async (immediate = false) => {
      if (!currentUser) return;
      const confirmation = immediate
          ? 'Cancel immediately? You will lose premium access now.'
          : 'Cancel at period end? You keep premium access until renewal date.';
      if (!window.confirm(confirmation)) return;
      setIsBillingActionLoading(true);
      try {
          const billing = await billingService.cancelSubscription(currentUser, immediate);
          if (billing) setProfile(prev => ({ ...prev, billing: { ...prev.billing, ...billing } }));
      } finally {
          setIsBillingActionLoading(false);
      }
  };

  const handleReactivateSubscription = async () => {
      if (!currentUser) return;
      setIsBillingActionLoading(true);
      try {
          const billing = await billingService.reactivateSubscription(currentUser);
          if (billing) setProfile(prev => ({ ...prev, billing: { ...prev.billing, ...billing } }));
      } finally {
          setIsBillingActionLoading(false);
      }
  };

  const consumeUsage = (key: 'aiActions' | 'resumesGenerated' | 'jobSearches', amount = 1) => {
      setProfile(prev => {
          const todayUsage = ensureDailyUsage(prev.usageStats);
          return {
              ...prev,
              usageStats: {
                  ...todayUsage,
                  [key]: (todayUsage[key] || 0) + amount
              }
          };
      });
  };

  const hasQuota = (kind: 'aiActions' | 'resumesGenerated' | 'jobSearches') => {
      if (effectivePlan !== 'free') return true;
      const usage = ensureDailyUsage(profile.usageStats);
      if (kind === 'aiActions') return usage.aiActions < FREE_LIMITS.aiActionsPerDay;
      if (kind === 'resumesGenerated') return usage.resumesGenerated < FREE_LIMITS.resumesGeneratedPerDay;
      return usage.jobSearches < FREE_LIMITS.jobSearchesPerDay;
  };

  const canUseFeature = (feature: PremiumFeature, reason: string) => {
      if (!hasFeatureAccess(effectivePlan, feature)) {
          openPricing(reason);
          return false;
      }
      return true;
  };

  const handleNewApplicationStart = () => {
      if (effectivePlan === 'free' && profile.applications.length >= FREE_LIMITS.maxApplications) {
          openPricing(`Free plan supports up to ${FREE_LIMITS.maxApplications} applications. Upgrade to unlock unlimited applications.`);
          return;
      }
      setView('new-app');
  };

  const handleJobAnalyzed = async (analysis: JobAnalysis, originalText: string) => {
    if (!hasQuota('aiActions') || !hasQuota('resumesGenerated')) {
      openPricing('Daily AI or resume-generation quota reached on Free. Upgrade for higher limits.');
      return;
    }

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
      consumeUsage('aiActions', 2);
      consumeUsage('resumesGenerated', 1);
    } catch (error: any) {
      console.error("Application Generation Error:", error);
      setGenerationError(error.message || "An unexpected error occurred while generating the resume.");
    } finally {
      setIsGenerating(false);
      setIsScoring(false);
    }
  };

  const handlePersonalizeFromJobBoard = async (job: ExternalJob) => {
      if (!hasQuota('jobSearches')) {
          openPricing('Daily job personalization quota reached on Free. Upgrade for higher limits.');
          return;
      }
      const jobText = `Title: ${job.title}\nCompany: ${job.company}\nLocation: ${job.location}\nDescription: ${job.description}\nRequirements: ${job.requirements.join(', ')}`;
      try {
          setIsGenerating(true);
          setView('application'); 
          const analysis = await analyzeJobDescription(jobText);
          analysis.title = job.title;
          analysis.company = job.company;
          await handleJobAnalyzed(analysis, jobText);
          consumeUsage('jobSearches', 1);
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

  const handleAddBulletFromProber = (section: string, relatedId: string | undefined, bullet: string) => {
      if (!activeResume) return;
      const trimmed = bullet.trim();
      if (!trimmed) return;
      const updatedResume = {
          ...activeResume,
          experience: activeResume.experience.map(exp => {
              const shouldAppend = relatedId ? exp.id === relatedId : exp.id === activeResume.experience[0]?.id;
              if (!shouldAppend) return exp;
              return {
                  ...exp,
                  bullets: [...exp.bullets, { id: `b-${Date.now()}`, text: trimmed, visible: true }]
              };
          })
      };
      handleResumeUpdate(updatedResume);
  };

  const handleRunBiasCheck = async () => {
      if (!activeResume) return;
      if (!canUseFeature('bias-audit', 'Bias audits are available on Pro plans.')) return;
      setIsCheckingBias(true);
      try {
          const result = await analyzeBias(activeResume);
          setProfile(prev => ({
              ...prev,
              applications: prev.applications.map(a => a.id === activeAppId ? { ...a, biasAnalysis: result } : a)
          }));
          consumeUsage('aiActions', 1);
      } catch (e) { console.error("Bias check failed", e); } finally { setIsCheckingBias(false); }
  };

  const handleApplyATSSuggestion = async (suggestion: string) => {
      if (!activeResume) return;
      if (!hasQuota('aiActions')) {
          openPricing('Daily AI quota reached on Free. Upgrade for unlimited optimization actions.');
          return;
      }
      setIsGenerating(true);
      try {
          const updated = await updateResumeWithAI(activeResume, `Implement this specific ATS improvement: ${suggestion}`);
          handleResumeUpdate(updated);
          consumeUsage('aiActions', 1);
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

  const handleDuplicateApplication = (appId: string) => {
      setProfile(prev => {
          const source = prev.applications.find(a => a.id === appId);
          if (!source) return prev;
          const duplicated: Application = {
              ...source,
              id: `app-${Date.now()}`,
              jobTitle: `${source.jobTitle} (Copy)`,
              dateCreated: new Date().toISOString(),
              status: 'Drafting'
          };
          return { ...prev, applications: [duplicated, ...prev.applications] };
      });
  };

  const handleDeleteApplication = (appId: string) => {
      setProfile(prev => ({
          ...prev,
          applications: prev.applications.filter(app => app.id !== appId)
      }));
      if (activeAppId === appId) {
          setActiveAppId(null);
          setView('apps');
      }
  };

  const handleOpenTool = (tool: NonNullable<typeof activeTool>) => {
      const premiumTools: Record<string, PremiumFeature> = {
          interview: 'interview',
          'deep-dive': 'interview',
          'cover-letter': 'cover-letter',
          networking: 'networking',
          salary: 'salary',
          linkedin: 'linkedin'
      };
      const required = premiumTools[tool];
      if (required && !canUseFeature(required, `${tool.replace('-', ' ')} is available on Pro plans.`)) return;
      setActiveTool(tool);
  };

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

  const UtilityPage = ({ title, subtitle, icon, children }: { title: string; subtitle: string; icon: React.ReactNode; children: React.ReactNode }) => (
      <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-100 bg-slate-50">
                  <div className="inline-flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">{icon}</div>
                      <h1 className="text-3xl font-display font-bold text-slate-900">{title}</h1>
                  </div>
                  <p className="text-slate-600">{subtitle}</p>
              </div>
              <div className="p-8">{children}</div>
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
                                { id: 'home', label: 'Home', icon: Home },
                                { id: 'apps', label: 'Documents', icon: LayoutGrid },
                                { id: 'job-board', label: 'Jobs', icon: Globe },
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
                        <div className="hidden md:flex items-center gap-1.5 text-xs font-medium text-slate-500">
                            {isDataSaved ? (<><Cloud className="w-3 h-3 text-green-600" /><span className="text-green-700">Saved</span></>) : (<><RefreshCw className="w-3 h-3 animate-spin text-hunj-500" /><span>Saving...</span></>)}
                        </div>
                        <div className="relative border-l border-slate-200 pl-4">
                            <button
                                onClick={() => setProfileMenuOpen(prev => !prev)}
                                className="w-9 h-9 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center hover:bg-slate-300 transition-colors"
                                title="Account menu"
                            >
                                {currentUser?.name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || 'U'}
                            </button>
                            {profileMenuOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-50">
                                    <div className="px-4 py-2.5 border-b border-slate-100 text-[11px] text-slate-500">
                                        Plan: {PLAN_LABEL[effectivePlan]} | Lvl {profile.level || 1}
                                    </div>
                                    <div className="px-4 py-2.5 border-b border-slate-100 text-[11px] text-slate-500">
                                        AI usage today: {ensureDailyUsage(profile.usageStats).aiActions}/{FREE_LIMITS.aiActionsPerDay}
                                    </div>
                                    <button onClick={() => { setProfileMenuOpen(false); setView('subscription'); }} className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50">Plans</button>
                                    <button onClick={() => { setProfileMenuOpen(false); setView('profile'); }} className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50">Account</button>
                                    <button onClick={() => { setProfileMenuOpen(false); setView('settings'); }} className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50">Settings</button>
                                    <button onClick={() => { setProfileMenuOpen(false); setView('help'); }} className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50">Help Center</button>
                                    <button onClick={() => { setProfileMenuOpen(false); setView('contact'); }} className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50">Contact Us</button>
                                    <button onClick={() => { setProfileMenuOpen(false); handleTogglePrivacy(!profile.privacyMode); }} className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50">
                                        Privacy: {profile.privacyMode ? 'On' : 'Off'}
                                    </button>
                                    <button onClick={() => { setProfileMenuOpen(false); setView('language'); }} className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50">Language: {language}</button>
                                    <button onClick={() => { setProfileMenuOpen(false); handleLogout(); }} className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50">Log Out</button>
                                </div>
                            )}
                        </div>
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
                onAnalyzeJob={handleJobAnalyzed}
            />
        )}
        {view === 'apps' && <div className="w-full h-full overflow-x-hidden"><Dashboard applications={profile.applications} masterResume={profile.masterResume} onNewApplication={handleNewApplicationStart} onSelectApplication={(id) => { setActiveAppId(id); setView('application'); }} onEditProfile={() => setView('profile')} onAnalyzeJob={handleJobAnalyzed} onUpdateStatus={handleUpdateStatus} onNavigateToJobBoard={() => setView('job-board')} onDuplicateApplication={handleDuplicateApplication} onDeleteApplication={handleDeleteApplication} /></div>}
        {view === 'job-board' && <JobBoard preferences={profile.preferences} onPersonalize={handlePersonalizeFromJobBoard} />}
        {view === 'profile' && <ProfileHub profile={profile} onUpdateProfile={(p) => setProfile(p)} onBack={() => setView('home')} />}
        {view === 'help' && (
            <UtilityPage
                title="Help Center"
                subtitle="Find quick answers and guidance for building stronger applications with HUNJ."
                icon={<LifeBuoy className="w-5 h-5" />}
            >
                <div className="space-y-4 text-sm text-slate-700">
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                        <p className="font-semibold text-slate-900 mb-1">Getting started</p>
                        <p>Complete your profile in <span className="font-semibold">Profile Hub</span>, then create your first application from <span className="font-semibold">Documents</span>.</p>
                    </div>
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                        <p className="font-semibold text-slate-900 mb-1">Why no job matches?</p>
                        <p>Add target roles, industries, and key skills in your profile. The job board suggestions rely on those signals.</p>
                    </div>
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                        <p className="font-semibold text-slate-900 mb-1">Need advanced support?</p>
                        <p>Contact help@enhancv.com and include your account email plus a brief issue description.</p>
                    </div>
                </div>
            </UtilityPage>
        )}
        {view === 'contact' && (
            <UtilityPage
                title="Contact Us"
                subtitle="Reach our team for billing, product feedback, or technical support."
                icon={<Mail className="w-5 h-5" />}
            >
                <div className="space-y-4 text-sm text-slate-700">
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                        <p className="font-semibold text-slate-900">Support</p>
                        <p>help@enhancv.com</p>
                    </div>
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                        <p className="font-semibold text-slate-900">Business / Organization Accounts</p>
                        <p>Contact help@enhancv.com to set up team onboarding and shared reporting.</p>
                    </div>
                </div>
            </UtilityPage>
        )}
        {view === 'language' && (
            <UtilityPage
                title="Language Preferences"
                subtitle="Select your display language for navigation and system labels."
                icon={<Languages className="w-5 h-5" />}
            >
                <div className="flex items-center gap-3">
                    {(['English', 'Spanish'] as const).map((option) => (
                        <button
                            key={option}
                            onClick={() => setLanguage(option)}
                            className={`px-5 py-3 rounded-xl border font-semibold transition-colors ${
                                language === option
                                    ? 'bg-slate-900 text-white border-slate-900'
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            }`}
                        >
                            {option}
                        </button>
                    ))}
                </div>
            </UtilityPage>
        )}
        {view === 'settings' && (
            <UtilityPage
                title="Settings"
                subtitle="Manage privacy, usage defaults, and account-level preferences."
                icon={<Bell className="w-5 h-5" />}
            >
                <div className="space-y-4">
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                        <div>
                            <p className="font-semibold text-slate-900">Privacy Mode</p>
                            <p className="text-sm text-slate-600">Hide personal identifiers before AI processing.</p>
                        </div>
                        <button
                            onClick={() => handleTogglePrivacy(!profile.privacyMode)}
                            className={`px-4 py-2 rounded-lg font-semibold ${profile.privacyMode ? 'bg-slate-900 text-white' : 'bg-white border border-slate-300 text-slate-700'}`}
                        >
                            {profile.privacyMode ? 'On' : 'Off'}
                        </button>
                    </div>
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                        <div>
                            <p className="font-semibold text-slate-900">Current Plan</p>
                            <p className="text-sm text-slate-600">{PLAN_LABEL[effectivePlan]} ({profile.billing.status})</p>
                        </div>
                        <button
                            onClick={() => setView('subscription')}
                            className="px-4 py-2 rounded-lg bg-slate-900 text-white font-semibold"
                        >
                            Manage Plan
                        </button>
                    </div>
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                        <p className="font-semibold text-slate-900 mb-1">Daily AI Usage</p>
                        <p className="text-sm text-slate-600">
                            {ensureDailyUsage(profile.usageStats).aiActions} / {FREE_LIMITS.aiActionsPerDay} actions used today.
                        </p>
                    </div>
                </div>
            </UtilityPage>
        )}
        {view === 'subscription' && (
            <UtilityPage
                title="Manage Subscription"
                subtitle="Control your current plan, renewal, and cancellation options."
                icon={<DollarSign className="w-5 h-5" />}
            >
                <div className="space-y-4">
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white border border-slate-200 text-slate-700">
                                Plan: {PLAN_LABEL[effectivePlan]}
                            </span>
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white border border-slate-200 text-slate-700">
                                Status: {profile.billing.status}
                            </span>
                            {profile.billing.cancelAtPeriodEnd && (
                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 border border-amber-200 text-amber-700">
                                    Canceling at period end
                                </span>
                            )}
                        </div>
                        <div className="mt-3 text-sm text-slate-600">
                            {profile.billing.renewsAt
                                ? `Renews on ${new Date(profile.billing.renewsAt).toLocaleDateString()}.`
                                : 'No renewal date available yet.'}
                        </div>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 bg-white flex flex-wrap gap-3">
                        <button
                            onClick={() => openPricing('Upgrade your plan for premium features and higher limits.')}
                            className="px-4 py-2 rounded-lg bg-slate-900 text-white font-semibold"
                        >
                            Change Plan
                        </button>
                        <button
                            onClick={handleRefreshSubscription}
                            disabled={isBillingActionLoading}
                            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 disabled:opacity-60"
                        >
                            Refresh Status
                        </button>
                        {effectivePlan !== 'free' && !profile.billing.cancelAtPeriodEnd && (
                            <button
                                onClick={() => handleCancelSubscription(false)}
                                disabled={isBillingActionLoading}
                                className="px-4 py-2 rounded-lg bg-amber-500 text-white font-semibold hover:bg-amber-600 disabled:opacity-60"
                            >
                                Cancel At Period End
                            </button>
                        )}
                        {effectivePlan !== 'free' && profile.billing.cancelAtPeriodEnd && (
                            <button
                                onClick={handleReactivateSubscription}
                                disabled={isBillingActionLoading}
                                className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-60"
                            >
                                Reactivate Subscription
                            </button>
                        )}
                        {effectivePlan !== 'free' && (
                            <button
                                onClick={() => handleCancelSubscription(true)}
                                disabled={isBillingActionLoading}
                                className="px-4 py-2 rounded-lg bg-rose-600 text-white font-semibold hover:bg-rose-700 disabled:opacity-60"
                            >
                                Cancel Now
                            </button>
                        )}
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-600">
                        Cancel at period end keeps premium access until your renewal date. Cancel now removes premium access immediately.
                    </div>
                </div>
            </UtilityPage>
        )}
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
                    <aside className="w-64 flex flex-col py-4 bg-white border-r border-slate-200 z-30 shrink-0 shadow-sm">
                        <button onClick={() => setView('apps')} className="p-3 mb-6 rounded-2xl bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-sm" title="Back to Dashboard">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        
                        <div className="flex-1 flex flex-col gap-2 w-full overflow-y-auto no-scrollbar pb-4 px-3">
                            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-2 pb-1">Creation Engine</div>
                            <button onClick={() => setWorkspaceTab('editor')} className={`w-full p-3 rounded-xl transition-all duration-300 flex items-center justify-start gap-2 text-sm font-semibold ${workspaceTab === 'editor' ? 'bg-hunj-600 text-white shadow-lg shadow-hunj-600/30' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`} title="Rearrange"><PenTool className="w-4 h-4" /> Rearrange</button>
                            <button onClick={() => setWorkspaceTab('preview')} className={`w-full p-3 rounded-xl transition-all duration-300 flex items-center justify-start gap-2 text-sm font-semibold ${workspaceTab === 'preview' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`} title="Templates"><LayoutGrid className="w-4 h-4" /> Templates</button>
                            <button onClick={() => setWorkspaceTab('preview')} className="w-full p-3 rounded-xl transition-all duration-300 flex items-center justify-start gap-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900" title="Design & Font"><Sparkles className="w-4 h-4" /> Design & Font</button>
                            <button onClick={() => setWorkspaceTab('editor')} className="w-full p-3 rounded-xl transition-all duration-300 flex items-center justify-start gap-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900" title="Improve Text"><MessageSquare className="w-4 h-4" /> Improve Text</button>
                            <button onClick={() => setRightPanelOpen(true)} className={`w-full p-3 rounded-xl transition-all duration-300 flex items-center justify-start gap-2 text-sm font-semibold ${rightPanelOpen ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`} title="ATS Check"><CheckCircle2 className="w-4 h-4" /> ATS Check</button>

                            <div className="w-full h-px bg-slate-100 my-3"></div>

                            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-2 pb-1">AI Tools</div>
                                <button onClick={() => handleOpenTool('interview')} className={`relative w-full p-3 rounded-xl transition-all duration-300 flex items-center justify-start gap-2 text-sm font-semibold ${activeTool === 'interview' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`} title="Mock Interview"><MessageSquare className="w-4 h-4" /> Interview Prep{effectivePlan === 'free' && <Lock className="w-3 h-3 absolute top-2 right-2 text-amber-500" />}</button>
                                <button onClick={() => handleOpenTool('deep-dive')} className={`relative w-full p-3 rounded-xl transition-all duration-300 flex items-center justify-start gap-2 text-sm font-semibold ${activeTool === 'deep-dive' ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`} title="Deep Dive Prober"><BrainCircuit className="w-4 h-4" /> Deep Dive Prober{effectivePlan === 'free' && <Lock className="w-3 h-3 absolute top-2 right-2 text-amber-500" />}</button>
                                <button onClick={() => handleOpenTool('cover-letter')} className={`relative w-full p-3 rounded-xl transition-all duration-300 flex items-center justify-start gap-2 text-sm font-semibold ${activeTool === 'cover-letter' ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`} title="Cover Letter"><FileText className="w-4 h-4" /> Cover Letter{effectivePlan === 'free' && <Lock className="w-3 h-3 absolute top-2 right-2 text-amber-500" />}</button>
                                <button onClick={() => handleOpenTool('autofill')} className={`w-full p-3 rounded-xl transition-all duration-300 flex items-center justify-start gap-2 text-sm font-semibold ${activeTool === 'autofill' ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/30' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`} title="Autofill Assistant"><FileText className="w-4 h-4" /> Autofill Assistant</button>
                                <button onClick={() => handleOpenTool('networking')} className={`relative w-full p-3 rounded-xl transition-all duration-300 flex items-center justify-start gap-2 text-sm font-semibold ${activeTool === 'networking' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`} title="Networking"><Users className="w-4 h-4" /> Networking{effectivePlan === 'free' && <Lock className="w-3 h-3 absolute top-2 right-2 text-amber-500" />}</button>
                            <button onClick={() => handleOpenTool('salary')} className={`relative w-full p-3 rounded-xl transition-all duration-300 flex items-center justify-start gap-2 text-sm font-semibold ${activeTool === 'salary' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`} title="Salary Intel"><DollarSign className="w-4 h-4" /> Salary Intel{effectivePlan === 'free' && <Lock className="w-3 h-3 absolute top-2 right-2 text-amber-500" />}</button>
                            <button onClick={() => handleOpenTool('linkedin')} className={`relative w-full p-3 rounded-xl transition-all duration-300 flex items-center justify-start gap-2 text-sm font-semibold ${activeTool === 'linkedin' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`} title="LinkedIn"><Linkedin className="w-4 h-4" /> LinkedIn Optimizer{effectivePlan === 'free' && <Lock className="w-3 h-3 absolute top-2 right-2 text-amber-500" />}</button>

                            <div className="w-full h-px bg-slate-100 my-3"></div>
                            <button
                                onClick={() => { setWorkspaceTab('preview'); setTimeout(() => window.print(), 200); }}
                                className="w-full p-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 text-sm font-bold bg-emerald-500 text-white hover:bg-emerald-400"
                                title="Download"
                            >
                                <Download className="w-4 h-4" /> Download
                            </button>
                            <button onClick={() => setFocusMode(!focusMode)} className="w-full p-3 rounded-xl hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors flex items-center justify-center gap-2 text-sm font-semibold" title="Focus Mode">
                                {focusMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                                {focusMode ? 'Exit Focus' : 'Focus Mode'}
                            </button>
                        </div>
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
                                                    if (!hasQuota('aiActions')) {
                                                        openPricing('Daily AI quota reached on Free. Upgrade for unlimited refinement.');
                                                        return;
                                                    }
                                                    const updated = await updateResumeWithAI(activeResume, instruction);
                                                    handleResumeUpdate(updated);
                                                    consumeUsage('aiActions', 1);
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
                                                {activeTool === 'deep-dive' && <div className="p-2 bg-violet-100 rounded-xl"><BrainCircuit className="w-6 h-6 text-violet-600"/></div>}
                                                {activeTool === 'cover-letter' && <div className="p-2 bg-pink-100 rounded-xl"><FileText className="w-6 h-6 text-pink-600"/></div>}
                                                {activeTool === 'autofill' && <div className="p-2 bg-slate-100 rounded-xl"><FileText className="w-6 h-6 text-slate-700"/></div>}
                                                {activeTool === 'networking' && <div className="p-2 bg-emerald-100 rounded-xl"><Users className="w-6 h-6 text-emerald-600"/></div>}
                                                {activeTool === 'salary' && <div className="p-2 bg-green-100 rounded-xl"><DollarSign className="w-6 h-6 text-green-600"/></div>}
                                                {activeTool.replace('-', ' ')}
                                            </h3>
                                            <button onClick={() => setActiveTool(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X className="w-6 h-6 text-slate-400 hover:text-slate-900"/></button>
                                        </div>
                                        <div className="flex-1 overflow-hidden bg-slate-50 p-6">
                                            {activeTool === 'interview' && <InterviewPrep job={activeApp.jobAnalysis!} session={activeApp.interviewSession} onUpdateSession={(s) => setProfile(prev => ({...prev, applications: prev.applications.map(a => a.id === activeAppId ? { ...a, interviewSession: s } : a)}))} />}
                                            {activeTool === 'deep-dive' && <DeepDiveProber resume={activeResume} job={activeApp.jobAnalysis!} onAddBullet={handleAddBulletFromProber} />}
                                            {activeTool === 'cover-letter' && <CoverLetterEditor resume={activeResume} job={activeApp.jobAnalysis!} currentLetter={activeApp.coverLetter} onUpdate={(letter) => setProfile(prev => ({...prev, applications: prev.applications.map(a => a.id === activeAppId ? { ...a, coverLetter: letter } : a)}))} />}
                                            {activeTool === 'autofill' && <AutofillAssistant resume={activeResume} />}
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
            <button onClick={() => { setView('job-board'); }} className={`flex flex-col items-center gap-1 w-full h-full justify-center transition-colors ${view === 'job-board' ? 'text-blue-400' : 'text-slate-400'}`}><Globe className="w-5 h-5" /><span className="text-[10px] font-medium">Jobs</span></button>
            <button onClick={() => setView('profile')} className={`flex flex-col items-center gap-1 w-full h-full justify-center transition-colors ${view === 'profile' ? 'text-blue-400' : 'text-slate-400'}`}><Users className="w-5 h-5" /><span className="text-[10px] font-medium">Profile</span></button>
        </div>
      )}
      <PricingModal
          isOpen={pricingOpen}
          reason={pricingReason}
          billing={profile.billing}
          effectivePlan={effectivePlan}
          isBillingActionLoading={isBillingActionLoading}
          onClose={() => setPricingOpen(false)}
          onCheckout={handleStartCheckout}
          onRefreshSubscription={handleRefreshSubscription}
          onCancelSubscription={handleCancelSubscription}
          onReactivateSubscription={handleReactivateSubscription}
      />
    </div>
  );
};

export default App;
