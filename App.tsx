
import React, { useState, useEffect, useRef } from 'react';
import { JobAnalysis, ResumeData, ATSScore, SkillMatch, UserProfile, Application, BiasAnalysis, InterviewMessage, LinkedInProfile, SalaryInsight, NetworkingStrategy, DocumentItem, ResumeThemeConfig, ExternalJob, User } from './types';
import JobInput from './components/JobInput';
import ResumeEditor from './components/ResumeEditor';
import ATSScoreChart from './components/ATSScoreChart';
import SkillsMatcher from './components/SkillsMatcher';
import BiasChecker from './components/BiasChecker';
import Dashboard from './components/Dashboard';
import StageTracker from './components/StageTracker';
import CoverLetterEditor from './components/CoverLetter';
import ProfileHub from './components/ProfileHub';
import ResumePreview from './components/ResumePreview';
import AIChatAssistant from './components/AIChatAssistant';
import InterviewPrep from './components/InterviewPrep';
import LinkedInOptimizer from './components/LinkedInOptimizer';
import SalaryInsights from './components/SalaryInsights';
import NetworkingHub from './components/NetworkingHub';
import AutofillAssistant from './components/AutofillAssistant';
import PrivacyControl from './components/PrivacyControl';
import DiffViewer from './components/DiffViewer';
import DeepDiveProber from './components/DeepDiveProber';
import JobBoard from './components/JobBoard';
import AuthScreen from './components/AuthScreen';
import { calculateATSScore, generateTailoredResume, analyzeSkillsGap, analyzeBias, updateResumeWithAI, analyzeJobDescription } from './services/geminiService';
import { storageService } from './services/storageService';
import { logger } from './services/loggingService';
import { anonymizeResume, restorePII } from './utils/privacy';
import { Layout, Cpu, Layers, GitBranch, Share2, FileDown, ArrowLeft, PenTool, LayoutTemplate, Printer, Eye, MessageSquare, Linkedin, DollarSign, Users, ClipboardList, History, PlusCircle, GitCompare, Target, Loader2, AlertTriangle, RefreshCw, Globe, LogOut } from 'lucide-react';

// --- INITIAL RESUME DATA (Default Template) ---
const INITIAL_RESUME: ResumeData = {
  id: 'master',
  versionName: 'Master v1',
  timestamp: Date.now(),
  style: 'Base',
  design: 'Sidebar',
  themeConfig: {
      template: 'Modern',
      font: 'Inter',
      accentColor: '#2563eb', // Blue-600
      fontSize: 'medium',
      spacing: 'normal'
  },
  fullName: 'Your Name',
  role: 'DevOps Engineer',
  email: 'email@example.com',
  phone: '+1 234 567 890',
  location: 'City, Country',
  linkedin: 'https://linkedin.com/in/yourprofile',
  website: 'https://github.com/yourusername',
  contactInfo: '',
  summary: 'Experienced DevOps Engineer with a focus on automation, CI/CD, and cloud infrastructure. Proven track record of improving deployment frequency and system reliability.',
  summaryVisible: true,
  skills: [
    'Cloud: AWS, Azure',
    'IaC: Terraform, Ansible',
    'CI/CD: Jenkins, GitLab CI',
    'Containers: Docker, Kubernetes',
    'Scripting: Python, Bash'
  ],
  languages: ['English'],
  achievements: [],
  interests: [],
  strengths: [],
  education: 'University Name\nDegree in Computer Science',
  educationVisible: true,
  experience: [
    {
      id: 'exp1',
      role: 'DevOps Engineer',
      company: 'Tech Corp',
      period: 'Jan 2022 – Present',
      visible: true,
      bullets: [
        { id: 'b1', text: 'Implemented CI/CD pipelines reducing deployment time by 40%.', visible: true },
        { id: 'b2', text: 'Managed AWS infrastructure using Terraform.', visible: true }
      ]
    }
  ],
  projects: [],
  certifications: [],
  publications: [],
  affiliations: []
};

const INITIAL_DOCS: DocumentItem[] = [];

const App: React.FC = () => {
  // --- USER STATE ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // --- APP STATE ---
  const [profile, setProfile] = useState<UserProfile>({
    masterResume: INITIAL_RESUME,
    applications: [],
    privacyMode: false,
    preferences: {
      workAuthorization: 'EU Citizen',
      availability: '1 Month',
      salaryExpectation: '$50k - $70k',
      relocation: true,
      remotePreference: 'Hybrid',
      targetRoles: ['DevOps Engineer', 'Cloud Engineer']
    },
    documents: INITIAL_DOCS
  });

  const [view, setView] = useState<'dashboard' | 'new-app' | 'application' | 'profile' | 'job-board'>('dashboard');
  const [activeAppId, setActiveAppId] = useState<string | null>(null);
  
  // Generation States
  const [isGenerating, setIsGenerating] = useState(false);
  const [isScoring, setIsScoring] = useState(false);
  const [isCheckingBias, setIsCheckingBias] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  
  // UI States within Application View
  const [activeTab, setActiveTab] = useState<'resume' | 'preview' | 'deep-dive' | 'cover-letter' | 'interview' | 'linkedin' | 'salary' | 'networking' | 'autofill' | 'compare'>('resume');
  const [compareVersionId, setCompareVersionId] = useState<string | null>(null);

  // --- STORAGE EFFECTS ---
  
  // Load user from session logic (Simulated check)
  useEffect(() => {
      // Check if we have a "last active user" in simple storage if implementing session persistence
      // For now, we start at AuthScreen.
  }, []);

  // Save profile whenever it changes (Debounced)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
      if (currentUser && profile) {
          if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
          saveTimeoutRef.current = setTimeout(() => {
              storageService.saveUserProfile(currentUser.id, profile);
          }, 1000);
      }
  }, [profile, currentUser]);

  // --- DERIVED STATE ---
  const activeApp = profile.applications.find(app => app.id === activeAppId);
  const activeResume = activeApp?.resumes.find(r => r.id === activeApp.activeResumeId);
  const compareResume = activeApp?.resumes.find(r => r.id === compareVersionId);

  // --- HANDLERS ---

  const handleLogin = (user: User, isNewUser: boolean) => {
      setCurrentUser(user);
      
      // Load Data
      const storedProfile = storageService.loadUserProfile(user.id);
      
      if (storedProfile) {
          setProfile(storedProfile);
      } else {
          // Initialize for new user (or existing user without profile data)
          const newProfile = { ...profile };
          // Personalize Master Resume
          if (isNewUser) {
              newProfile.masterResume.fullName = user.name;
              newProfile.masterResume.email = user.email;
              newProfile.masterResume.contactInfo = `${user.name} | ${user.email} | Location`;
          }
          setProfile(newProfile);
          storageService.saveUserProfile(user.id, newProfile);
      }
      logger.info("User session started", { userId: user.id });
  };

  const handleLogout = () => {
      if (currentUser) {
          logger.info("User logged out", { userId: currentUser.id });
      }
      setCurrentUser(null);
      setProfile({ // Reset to defaults to avoid flashing old data on next login
        masterResume: INITIAL_RESUME,
        applications: [],
        privacyMode: false,
        preferences: profile.preferences,
        documents: []
      });
      setView('dashboard');
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
    // 1. Create new application object
    const newApp: Application = {
        id: `app-${Date.now()}`,
        jobTitle: analysis.title,
        companyName: analysis.company,
        jobDescription: originalText,
        status: 'Drafting',
        dateCreated: new Date().toISOString(),
        jobAnalysis: analysis,
        resumes: [], // Will generate
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

    // 2. Optimistic Update
    setIsGenerating(true);
    setIsScoring(true);
    setGenerationError(null);
    
    // Save preliminary app state
    setProfile(prev => ({
        ...prev,
        applications: [newApp, ...prev.applications]
    }));
    setActiveAppId(newApp.id);
    setView('application');
    logger.info("Started new application analysis", { company: analysis.company });

    try {
      // 3. Generate content based on MASTER resume (Anonymized if needed)
      const inputResume = prepareResumeForAI(profile.masterResume);
      
      const [tailoredResumes, skillsResult] = await Promise.all([
        generateTailoredResume(inputResume, analysis),
        analyzeSkillsGap(inputResume.skills, analysis.requiredSkills)
      ]);
      
      // If Privacy is ON, variantsResult has "Candidate Name". We should restore real PII for the user's view.
      const restoredResumes = tailoredResumes.map(r => profile.privacyMode ? restorePII(r, profile.masterResume) : r);
      
      const initialVariant = restoredResumes[0]; // Take the first one as active

      const scoreResult = await calculateATSScore(initialVariant, analysis);

      // 4. Update Application with generated data (multiple variants)
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
      logger.info("Application generated successfully", { appId: newApp.id });

    } catch (error: any) {
      console.error("Analysis failed", error);
      setGenerationError(error.message || "An unexpected error occurred while generating the resume.");
      logger.error("Application generation failed", error);
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

  const handleRetryGeneration = () => {
      if (activeApp && activeApp.jobAnalysis && activeApp.jobDescription) {
          handleJobAnalyzed(activeApp.jobAnalysis, activeApp.jobDescription);
      }
  };

  const handleCancelApplication = () => {
      if (activeAppId) {
          setProfile(prev => ({
              ...prev,
              applications: prev.applications.filter(app => app.id !== activeAppId)
          }));
      }
      setView('dashboard');
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

  const handleCreateSnapshot = () => {
      if(!activeAppId || !activeResume) return;
      const newVersion = {
          ...activeResume,
          id: `ver-${Date.now()}`,
          versionName: `${activeResume.style} - ${new Date().toLocaleTimeString()}`,
          timestamp: Date.now()
      };
      
      setProfile(prev => ({
          ...prev,
          applications: prev.applications.map(app => {
              if (app.id === activeAppId) {
                  return {
                      ...app,
                      resumes: [...app.resumes, newVersion],
                      activeResumeId: newVersion.id
                  };
              }
              return app;
          })
      }));
      logger.info("Snapshot created", { originalId: activeResume.id });
  };

  const handleAddDeepDiveBullet = (section: string, id: string | undefined, bulletText: string) => {
      if (!activeResume) return;

      const updatedResume = { ...activeResume };

      if (section === 'experience' && id) {
          const expIndex = updatedResume.experience.findIndex(e => e.id === id);
          if (expIndex !== -1) {
              const newBullet = { id: `b-${Date.now()}`, text: bulletText, visible: true };
              const newBullets = [...updatedResume.experience[expIndex].bullets, newBullet];
              updatedResume.experience[expIndex] = { ...updatedResume.experience[expIndex], bullets: newBullets };
          } else if (updatedResume.experience.length > 0) {
             const newBullet = { id: `b-${Date.now()}`, text: bulletText, visible: true };
             const newBullets = [...updatedResume.experience[0].bullets, newBullet];
             updatedResume.experience[0] = { ...updatedResume.experience[0], bullets: newBullets };
          }
      } else if (section === 'projects') {
           updatedResume.summary += ` ${bulletText}`;
      } else {
           updatedResume.summary += ` ${bulletText}`;
      }

      handleResumeUpdate(updatedResume);
  };

  const handleApplySuggestion = async (suggestion: string) => {
      if (!activeAppId || !activeResume || !activeApp?.jobAnalysis) return;
      
      try {
          const inputResume = prepareResumeForAI(activeResume);
          const aiUpdatedResume = await updateResumeWithAI(inputResume, `Please implement this specific improvement to the resume: "${suggestion}". Ensure the changes improve the ATS score.`);
          
          const finalResume = profile.privacyMode ? restorePII(aiUpdatedResume, activeResume) : aiUpdatedResume;
          handleResumeUpdate(finalResume);

          setIsScoring(true);
          const [newScore, newSkills] = await Promise.all([
              calculateATSScore(finalResume, activeApp.jobAnalysis),
              analyzeSkillsGap(finalResume.skills, activeApp.jobAnalysis.requiredSkills)
          ]);

          setProfile(prev => ({
              ...prev,
              applications: prev.applications.map(app => {
                  if (app.id === activeAppId) {
                      return { 
                          ...app, 
                          atsScore: newScore,
                          skillMatches: newSkills
                      };
                  }
                  return app;
              })
          }));
          logger.info("AI suggestion applied");

      } catch (e) {
          console.error("Failed to apply suggestion", e);
          logger.error("Suggestion application failed", e);
      } finally {
          setIsScoring(false);
      }
  };

  const handleAnalyzeBias = async () => {
      if (!activeAppId || !activeResume) return;
      setIsCheckingBias(true);
      try {
          const analysis = await analyzeBias(activeResume);
          setProfile(prev => ({
              ...prev,
              applications: prev.applications.map(app => {
                  if (app.id === activeAppId) {
                      return { ...app, biasAnalysis: analysis };
                  }
                  return app;
              })
          }));
      } catch (e) {
          console.error("Bias check failed", e);
      } finally {
          setIsCheckingBias(false);
      }
  };

  const handleUpdateInterviewSession = (session: InterviewMessage[]) => {
      if (!activeAppId) return;
      setProfile(prev => ({
          ...prev,
          applications: prev.applications.map(app => {
              if (app.id === activeAppId) {
                  return { ...app, interviewSession: session };
              }
              return app;
          })
      }));
  }

  const handleUpdateLinkedIn = (linkedInProfile: LinkedInProfile) => {
    if (!activeAppId) return;
    setProfile(prev => ({
        ...prev,
        applications: prev.applications.map(app => {
            if (app.id === activeAppId) {
                return { ...app, linkedInProfile };
            }
            return app;
        })
    }));
  }

  const handleUpdateSalary = (salaryInsight: SalaryInsight) => {
    if (!activeAppId) return;
    setProfile(prev => ({
        ...prev,
        applications: prev.applications.map(app => {
            if (app.id === activeAppId) {
                return { ...app, salaryInsight };
            }
            return app;
        })
    }));
  }

  const handleUpdateNetworking = (networkingStrategy: NetworkingStrategy) => {
    if (!activeAppId) return;
    setProfile(prev => ({
        ...prev,
        applications: prev.applications.map(app => {
            if (app.id === activeAppId) {
                return { ...app, networkingStrategy };
            }
            return app;
        })
    }));
  }


  const handleProfileUpdate = (updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
  };

  const handleVariantChange = (variantId: string) => {
      setProfile(prev => ({
          ...prev,
          applications: prev.applications.map(app => {
              if (app.id === activeAppId) {
                  return { ...app, activeResumeId: variantId };
              }
              return app;
          })
      }));
  };

  const handleThemeUpdate = (theme: ResumeThemeConfig) => {
      if(!activeResume || !activeAppId) return;
      handleResumeUpdate({ ...activeResume, themeConfig: theme });
  }

  const handleStatusChange = (status: Application['status']) => {
      if(!activeAppId) return;
      handleUpdateStatus(activeAppId, status);
  }

  const handleUpdateStatus = (appId: string, status: Application['status']) => {
      setProfile(prev => ({
          ...prev,
          applications: prev.applications.map(app => {
              if (app.id === appId) return { ...app, status };
              return app;
          })
      }));
  }

  const handleDownloadPDF = () => {
      if (activeResume) {
          const originalTitle = document.title;
          document.title = `${activeResume.fullName.replace(/\s+/g, '_')}_Resume`;
          window.print();
          document.title = originalTitle;
          logger.info("PDF Downloaded", { resumeId: activeResume.id });
      } else {
          window.print();
      }
  };

  // --- AUTH CHECK ---
  if (!currentUser) {
      return <AuthScreen onLogin={handleLogin} />;
  }

  // --- RENDER ---

  return (
    <div className="min-h-screen bg-devops-900 text-devops-50 font-sans selection:bg-accent-500/30 print:bg-white">
      
      {/* Header (Hidden on Print) */}
      <header className="bg-devops-900 border-b border-devops-800 sticky top-0 z-50 backdrop-blur-md bg-opacity-80 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('dashboard')}>
            <Cpu className="w-6 h-6 text-accent-500" />
            <span className="font-bold text-lg tracking-tight">DevOps<span className="text-devops-400">Architect</span></span>
          </div>
          
          <div className="flex items-center gap-6">
             <button 
                onClick={() => setView('job-board')}
                className={`text-sm font-medium transition-colors flex items-center gap-1 ${view === 'job-board' ? 'text-accent-500' : 'text-devops-400 hover:text-white'}`}
             >
                 <Globe className="w-4 h-4" /> Job Board
             </button>

             {/* Privacy Control - Global Setting */}
             <PrivacyControl 
                enabled={profile.privacyMode} 
                onToggle={handleTogglePrivacy} 
             />

             {(view === 'application' || view === 'profile' || view === 'job-board') && (
                 <button onClick={() => setView('dashboard')} className="flex items-center gap-2 text-sm text-devops-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Dashboard
                 </button>
             )}

             <button 
                onClick={handleLogout}
                className="flex items-center gap-2 text-sm text-devops-400 hover:text-danger transition-colors border-l border-devops-700 pl-4"
                title="Logout"
             >
                 <LogOut className="w-4 h-4" />
             </button>
          </div>
        </div>
      </header>

      {/* VIEW: DASHBOARD */}
      {view === 'dashboard' && (
          <Dashboard 
            applications={profile.applications} 
            masterResume={profile.masterResume}
            onNewApplication={handleNewApplicationStart}
            onSelectApplication={(id) => { setActiveAppId(id); setView('application'); }}
            onEditProfile={() => setView('profile')}
            onAnalyzeJob={handleJobAnalyzed}
            onUpdateStatus={handleUpdateStatus}
            onNavigateToJobBoard={() => setView('job-board')}
          />
      )}

      {/* VIEW: JOB BOARD */}
      {view === 'job-board' && (
          <JobBoard 
            preferences={profile.preferences}
            onPersonalize={handlePersonalizeFromJobBoard}
          />
      )}

      {/* VIEW: PROFILE HUB (Replaces ProfileEditor) */}
      {view === 'profile' && (
        <ProfileHub 
          profile={profile}
          onUpdateProfile={handleProfileUpdate}
          onBack={() => setView('dashboard')}
        />
      )}

      {/* VIEW: NEW APPLICATION */}
      {view === 'new-app' && (
          <JobInput 
            onJobAnalyzed={handleJobAnalyzed} 
            onCancel={() => setView('dashboard')}
          />
      )}

      {/* VIEW: APPLICATION WORKSPACE */}
      {view === 'application' && activeApp && (
        <>
        {generationError ? (
            <div className="h-[calc(100vh-64px)] flex flex-col items-center justify-center bg-devops-900 text-white">
                <div className="flex flex-col items-center space-y-6 max-w-md text-center p-8 bg-devops-800 rounded-2xl border border-danger/30 shadow-2xl">
                    <div className="w-16 h-16 bg-danger/10 rounded-full flex items-center justify-center">
                        <AlertTriangle className="w-8 h-8 text-danger" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold mb-2">Generation Failed</h2>
                        <p className="text-devops-300 text-sm mb-4">{generationError}</p>
                        <p className="text-devops-400 text-xs">This can happen if the AI service is overloaded or the job description is too vague.</p>
                    </div>
                    <div className="flex gap-3 w-full">
                        <button 
                            onClick={handleCancelApplication}
                            className="flex-1 px-4 py-2 bg-devops-700 hover:bg-devops-600 rounded-lg text-sm font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleRetryGeneration}
                            className="flex-1 px-4 py-2 bg-accent-600 hover:bg-accent-500 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" /> Retry
                        </button>
                    </div>
                </div>
            </div>
        ) : !activeResume ? (
            <div className="h-[calc(100vh-64px)] flex flex-col items-center justify-center bg-devops-900 text-white">
                <div className="flex flex-col items-center space-y-4 max-w-md text-center p-8">
                    <Loader2 className="w-12 h-12 text-accent-500 animate-spin" />
                    <h2 className="text-2xl font-bold">Generating Resume Versions...</h2>
                    <p className="text-devops-400">
                        Analyzing role at {activeApp.companyName} and creating multiple optimized variants using Gemini 3 Pro.
                    </p>
                    <div className="w-full bg-devops-800 h-2 rounded-full mt-4 overflow-hidden">
                        <div className="h-full bg-accent-500 animate-pulse w-2/3 rounded-full"></div>
                    </div>
                </div>
            </div>
        ) : (
        <div className="flex flex-col h-[calc(100vh-64px)] print:h-auto print:block">
            
            {/* Stage Tracker (Hidden on Print) */}
            <div className="print:hidden">
                <StageTracker 
                    status={activeApp.status} 
                    probability={activeApp.jobAnalysis?.hiringProbability}
                />
            </div>

            {/* Application Toolbar (Hidden on Print) */}
            <div className="bg-devops-800 border-b border-devops-700 px-8 py-3 flex justify-between items-center print:hidden overflow-x-auto">
                <div className="flex items-center gap-4">
                     <div>
                         <h2 className="font-bold text-white leading-tight whitespace-nowrap">{activeApp.jobTitle}</h2>
                         <p className="text-xs text-devops-400">{activeApp.companyName}</p>
                     </div>
                     <div className="h-8 w-px bg-devops-600 mx-2 hidden md:block"></div>
                     
                     <div className="flex gap-2">
                        <button 
                            onClick={() => setActiveTab('resume')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'resume' ? 'bg-devops-700 text-white' : 'text-devops-400 hover:text-white'}`}
                        >
                            <span className="flex items-center gap-2"><PenTool className="w-3 h-3"/> Editor</span>
                        </button>
                        <button 
                            onClick={() => setActiveTab('preview')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'preview' ? 'bg-devops-700 text-white' : 'text-devops-400 hover:text-white'}`}
                        >
                             <span className="flex items-center gap-2"><Eye className="w-3 h-3"/> Preview</span>
                        </button>
                        <button 
                            onClick={() => setActiveTab('deep-dive')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'deep-dive' ? 'bg-purple-600 text-white' : 'text-purple-400 bg-purple-500/10 hover:bg-purple-500/20'}`}
                        >
                             <Target className="w-3 h-3"/> Deep Dive
                        </button>
                        <button 
                            onClick={() => setActiveTab('compare')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'compare' ? 'bg-devops-700 text-white' : 'text-devops-400 hover:text-white'}`}
                        >
                             <span className="flex items-center gap-2"><GitCompare className="w-3 h-3"/> Compare</span>
                        </button>
                        <button 
                            onClick={() => setActiveTab('cover-letter')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'cover-letter' ? 'bg-devops-700 text-white' : 'text-devops-400 hover:text-white'}`}
                        >
                            Cover Letter
                        </button>
                        <button 
                            onClick={() => setActiveTab('interview')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'interview' ? 'bg-devops-700 text-white' : 'text-devops-400 hover:text-white'}`}
                        >
                            <span className="flex items-center gap-2"><MessageSquare className="w-3 h-3"/> Interview</span>
                        </button>
                        <button 
                            onClick={() => setActiveTab('linkedin')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'linkedin' ? 'bg-devops-700 text-white' : 'text-devops-400 hover:text-white'}`}
                        >
                            <span className="flex items-center gap-2"><Linkedin className="w-3 h-3"/> LinkedIn</span>
                        </button>
                     </div>
                </div>

                <div className="flex items-center gap-3 ml-4">
                    {/* Download Button */}
                    {activeTab === 'preview' && (
                        <button 
                            onClick={handleDownloadPDF}
                            className="flex items-center gap-2 px-3 py-1.5 bg-accent-600 hover:bg-accent-500 text-white rounded text-sm transition-colors whitespace-nowrap"
                        >
                            <Printer className="w-4 h-4" /> Download PDF
                        </button>
                    )}
                    {/* Status Dropdown */}
                    <select 
                        value={activeApp.status}
                        onChange={(e) => handleStatusChange(e.target.value as any)}
                        className="bg-devops-900 border border-devops-600 text-xs text-white rounded px-2 py-1 outline-none"
                    >
                        <option value="Researching">Researching</option>
                        <option value="Drafting">Drafting</option>
                        <option value="Applied">Applied</option>
                        <option value="Interviewing">Interviewing</option>
                        <option value="Offer">Offer</option>
                        <option value="Rejected">Rejected</option>
                    </select>
                </div>
            </div>

            <main className="flex-1 overflow-hidden print:overflow-visible">
                <div className="h-full grid grid-cols-1 lg:grid-cols-12 print:block">
                    
                    {/* LEFT SIDEBAR: Strategy & Versions (Hidden on Preview & Print) */}
                    {activeTab !== 'preview' && (
                        <div className="lg:col-span-2 bg-devops-900 border-r border-devops-800 p-4 overflow-y-auto hidden lg:block">
                            {(activeTab === 'resume' || activeTab === 'compare') && (
                                <>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-xs font-semibold text-devops-400 uppercase tracking-wider flex items-center gap-1"><History className="w-3 h-3"/> Versions</h3>
                                        <button 
                                            onClick={handleCreateSnapshot}
                                            className="text-accent-400 hover:text-white transition-colors"
                                            title="Create Snapshot"
                                        >
                                            <PlusCircle className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="space-y-2 mb-6">
                                        {activeApp.resumes.map((v, idx) => (
                                            <div 
                                                key={v.id} 
                                                className={`rounded border transition-all ${
                                                    activeResume.id === v.id 
                                                    ? 'bg-accent-600/10 border-accent-500' 
                                                    : 'bg-devops-800/50 border-devops-700'
                                                }`}
                                            >
                                                <button
                                                    onClick={() => handleVariantChange(v.id)}
                                                    className="w-full text-left p-2"
                                                >
                                                    <div className={`font-medium text-xs ${activeResume.id === v.id ? 'text-white' : 'text-devops-400'}`}>
                                                        {v.versionName || v.style || `Version ${idx+1}`}
                                                    </div>
                                                    <div className="text-[10px] text-devops-500 mt-0.5">
                                                        {v.timestamp ? new Date(v.timestamp).toLocaleTimeString() : 'Auto-generated'}
                                                    </div>
                                                </button>
                                                
                                                {/* Comparison Checkbox */}
                                                {activeTab === 'compare' && activeResume.id !== v.id && (
                                                    <div className="px-2 pb-2 pt-0 border-t border-devops-700/50 mt-1">
                                                        <button 
                                                            onClick={() => setCompareVersionId(v.id)}
                                                            className={`w-full text-[10px] py-1 rounded mt-1 flex items-center justify-center gap-1 ${
                                                                compareVersionId === v.id 
                                                                ? 'bg-purple-500/20 text-purple-300' 
                                                                : 'bg-devops-900 text-devops-400 hover:text-white'
                                                            }`}
                                                        >
                                                            <GitCompare className="w-3 h-3" />
                                                            {compareVersionId === v.id ? 'Comparing' : 'Compare'}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                            {activeTab === 'deep-dive' && (
                                <div className="text-xs text-purple-200 bg-purple-500/10 p-4 rounded border border-purple-500/20">
                                    <h4 className="font-bold mb-2 flex items-center gap-1"><Target className="w-3 h-3"/> Pro Tip</h4>
                                    Answer the AI's probing questions honestly and casually. It will do the hard work of converting your story into professional resume bullets using the STAR method.
                                </div>
                            )}
                        </div>
                    )}

                    {/* CENTER: Editor or Preview */}
                    <div className={`${activeTab === 'preview' ? 'lg:col-span-12 bg-gray-200' : 'lg:col-span-7 bg-devops-900/50'} h-full overflow-hidden print:h-auto print:overflow-visible`}>
                        {activeTab === 'resume' ? (
                             <div className="p-6 h-full overflow-hidden">
                                <ResumeEditor 
                                    resume={activeResume} 
                                    job={activeApp.jobAnalysis} 
                                    onUpdate={handleResumeUpdate}
                                />
                             </div>
                        ) : activeTab === 'preview' ? (
                            <ResumePreview 
                                resume={activeResume} 
                                job={activeApp.jobAnalysis}
                                onThemeUpdate={handleThemeUpdate}
                                onApplySuggestion={handleApplySuggestion}
                            />
                        ) : activeTab === 'deep-dive' && activeApp.jobAnalysis ? (
                            <div className="p-6 h-full overflow-hidden">
                                <DeepDiveProber 
                                    resume={activeResume}
                                    job={activeApp.jobAnalysis}
                                    onAddBullet={handleAddDeepDiveBullet}
                                />
                            </div>
                        ) : activeTab === 'compare' ? (
                            compareResume ? (
                                <div className="p-6 h-full overflow-hidden">
                                    <DiffViewer 
                                        oldResume={compareResume} 
                                        newResume={activeResume} 
                                    />
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-devops-400 p-8">
                                    <GitCompare className="w-12 h-12 mb-4 opacity-50" />
                                    <p>Select a version from the left sidebar to compare with your current resume.</p>
                                </div>
                            )
                        ) : activeTab === 'interview' && activeApp.jobAnalysis ? (
                            <div className="p-6 h-full overflow-hidden">
                                <InterviewPrep 
                                    job={activeApp.jobAnalysis}
                                    session={activeApp.interviewSession}
                                    onUpdateSession={handleUpdateInterviewSession}
                                />
                            </div>
                        ) : activeTab === 'linkedin' ? (
                            <div className="p-6 h-full overflow-hidden">
                                <LinkedInOptimizer 
                                    resume={activeResume}
                                    profile={activeApp.linkedInProfile}
                                    onUpdate={handleUpdateLinkedIn}
                                />
                            </div>
                        ) : activeTab === 'salary' && activeApp.jobAnalysis ? (
                            <div className="p-6 h-full overflow-hidden">
                                <SalaryInsights 
                                    job={activeApp.jobAnalysis}
                                    insight={activeApp.salaryInsight}
                                    onUpdate={handleUpdateSalary}
                                />
                            </div>
                        ) : activeTab === 'networking' && activeApp.jobAnalysis ? (
                            <div className="p-6 h-full overflow-hidden">
                                <NetworkingHub 
                                    job={activeApp.jobAnalysis}
                                    strategy={activeApp.networkingStrategy}
                                    onUpdate={handleUpdateNetworking}
                                />
                            </div>
                        ) : activeTab === 'autofill' ? (
                            <div className="p-6 h-full overflow-hidden">
                                <AutofillAssistant resume={activeResume} />
                            </div>
                        ) : (
                            <div className="p-6 h-full overflow-hidden">
                                <CoverLetterEditor 
                                    resume={activeResume}
                                    job={activeApp.jobAnalysis!}
                                    currentLetter={activeApp.coverLetter}
                                    onUpdate={(letter) => {
                                        setProfile(prev => ({
                                            ...prev,
                                            applications: prev.applications.map(app => {
                                                if (app.id === activeAppId) return { ...app, coverLetter: letter };
                                                return app;
                                            })
                                        }))
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    {/* RIGHT SIDEBAR: Insights (Hidden on Preview & Print) */}
                    {activeTab !== 'preview' && (
                        <div className="lg:col-span-3 bg-devops-900 border-l border-devops-800 p-4 overflow-y-auto">
                            <div className="space-y-6">
                                {/* Analysis Card */}
                                <div className="bg-devops-800 border border-devops-700 rounded-lg p-4">
                                    <h3 className="font-semibold text-white mb-2 text-sm">AI Research</h3>
                                    <div className="space-y-3 text-xs text-devops-300">
                                        <p><strong className="text-devops-200">Difficulty:</strong> {activeApp.jobAnalysis?.hiringReasoning}</p>
                                        <p><strong className="text-devops-200">Company Insights:</strong> {activeApp.jobAnalysis?.companyInsights}</p>
                                    </div>
                                </div>

                                <ATSScoreChart 
                                    score={activeApp.atsScore} 
                                    isLoading={isScoring} 
                                    onApplySuggestion={handleApplySuggestion}
                                />
                                <SkillsMatcher matches={activeApp.skillMatches} isLoading={isScoring} />
                                
                                <BiasChecker 
                                    analysis={activeApp.biasAnalysis || null} 
                                    isLoading={isCheckingBias}
                                    onAnalyze={handleAnalyzeBias}
                                />
                            </div>
                        </div>
                    )}
                    
                    {/* AI Chat Copilot - Always available in Application View */}
                    <AIChatAssistant 
                        resume={activeResume}
                        onUpdate={handleResumeUpdate}
                    />

                </div>
            </main>
        </div>
        )}
        </>
      )}

    </div>
  );
};

export default App;
