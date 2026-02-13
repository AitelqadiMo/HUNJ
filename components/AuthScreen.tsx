
import React, { useState, useEffect, useRef } from 'react';
import { User, UserProfile, ResumeData } from '../types';
import { storageService } from '../services/storageService';
import { logger } from '../services/loggingService';
import { Target, ArrowRight, Loader2, Info, AlertTriangle, UserCircle, Copy, Check, Sparkles, Fingerprint } from 'lucide-react';

declare global {
    interface Window {
        google: any;
    }
}

// Default Data for seeding
const INITIAL_RESUME: ResumeData = {
  id: 'master',
  versionName: 'Master v1',
  timestamp: Date.now(),
  style: 'Base',
  design: 'Executive',
  themeConfig: { 
      layout: 'Executive', 
      font: 'Inter', 
      accentColor: '#4f46e5', 
      pageSize: 'A4',
      density: 'Standard',
      targetPageCount: 2
  },
  fullName: '', role: '', email: '', phone: '', location: '', linkedin: '', website: '', contactInfo: '',
  summary: '', summaryVisible: true, skills: [], languages: [], achievements: [], awards: [], interests: [], strengths: [],
  education: '', educationVisible: true, experience: [], projects: [], certifications: [], publications: [], affiliations: [],
  personalKnowledgeBase: [],
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
  sectionOrder: ['summary', 'experience', 'education', 'skills', 'projects', 'certifications', 'languages', 'awards', 'interests', 'affiliations']
};

const INITIAL_PROFILE: UserProfile = {
    masterResume: INITIAL_RESUME,
    applications: [],
    privacyMode: false,
    preferences: {
        workAuthorization: 'US Citizen', availability: '1 Month', salaryExpectation: '', relocation: false, remotePreference: 'Hybrid',
        targetRoles: [], targetIndustries: [], preferredTechStack: [], companySize: []
    },
    documents: [],
    onboardingSeen: false,
    profileComplete: false
};

interface AuthScreenProps {
  onLogin: (user: User, isNewUser: boolean) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDevHelp, setShowDevHelp] = useState(false);
  const [copiedOrigin, setCopiedOrigin] = useState(false);
  
  const GOOGLE_CLIENT_ID = "320374865308-32l01sgrf0u5seerei3ei2ke31udq5o5.apps.googleusercontent.com"; 
  
  const googleBtnRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
      if (typeof window !== 'undefined' && window.google && window.google.accounts) {
          try {
              window.google.accounts.id.initialize({
                  client_id: GOOGLE_CLIENT_ID,
                  callback: handleGoogleCredentialResponse,
                  auto_select: false,
                  cancel_on_tap_outside: true,
                  context: 'signin',
                  ux_mode: 'popup'
              });
              
              if (googleBtnRef.current) {
                  window.google.accounts.id.renderButton(
                      googleBtnRef.current,
                      { theme: "filled_black", size: "large", width: "100%", text: "continue_with", shape: "pill" }
                  );
              }
          } catch (e) {
              console.warn("Google Auth failed to initialize.", e);
          }
      }
  }, [isRegistering]);

  const parseJwt = (token: string) => {
      try {
        var base64Url = token.split('.')[1];
        var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
      } catch (e) {
          return null;
      }
  };

  const handleGoogleCredentialResponse = (response: any) => {
      setLoading(true);
      const payload = parseJwt(response.credential);
      
      if (payload) {
          const googleUser: User = {
              id: `google-${payload.sub}`,
              email: payload.email,
              name: payload.name,
              picture: payload.picture,
              lastLogin: Date.now()
          };
          completeLogin(googleUser, 'Google');
      } else {
          setError("Failed to decode Google profile.");
          setLoading(false);
      }
  };

  const handleGuestLogin = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 800)); // Cinematic delay
      
      const guestUser: User = {
          id: `guest-${Date.now()}`,
          email: 'guest@hunj.ai',
          name: 'Hunter Guest',
          picture: undefined,
          lastLogin: Date.now()
      };
      
      completeLogin(guestUser, 'Guest');
  };

  const completeLogin = (user: User, method: string) => {
      storageService.saveUser(user);
      logger.info(`User logged in via ${method}`, { email: user.email });
      
      const existingUsers = storageService.getUsers();
      const exists = existingUsers.some(u => u.id === user.id);
      
      if (!exists || !storageService.loadUserProfile(user.id)) {
          const newProfile = { ...INITIAL_PROFILE };
          newProfile.masterResume.fullName = user.name;
          newProfile.masterResume.email = user.email;
          storageService.saveUserProfile(user.id, newProfile);
      }
      
      onLogin(user, !exists);
      setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setLoading(true);
    setError(null);

    await new Promise(resolve => setTimeout(resolve, 800));

    try {
        const users = storageService.getUsers();
        const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (isRegistering) {
            if (existingUser) {
                setError("User already exists. Please login.");
                setLoading(false);
                return;
            }
            if (!name) {
                setError("Please enter your name.");
                setLoading(false);
                return;
            }

            const newUser: User = {
                id: `user-${Date.now()}`,
                email,
                name,
                lastLogin: Date.now()
            };
            completeLogin(newUser, 'Email');
        } else {
            if (!existingUser) {
                setError("User not found. Please register.");
                setLoading(false);
                return;
            }
            completeLogin(existingUser, 'Email');
        }
    } catch (err) {
        setError("An authentication error occurred.");
        logger.error('Auth error', err);
        setLoading(false);
    }
  };

  const handleCopyOrigin = () => {
      if (typeof window !== 'undefined') {
          navigator.clipboard.writeText(window.location.origin);
          setCopiedOrigin(true);
          setTimeout(() => setCopiedOrigin(false), 2000);
      }
  };

  return (
    <div className="min-h-screen bg-devops-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans bg-noise">
      
      {/* Cinematic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-hunj-600/20 rounded-full blur-[120px] animate-pulse-slow"></div>
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent to-devops-950/80"></div>
      </div>

      <div className="relative z-10 w-full max-w-md animate-slide-up">
        
        {/* The Singularity Core */}
        <div className="flex flex-col items-center mb-10">
            <div className="relative group cursor-pointer mb-6">
                <div className="absolute -inset-1 bg-gradient-to-r from-hunj-500 to-accent-500 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative w-24 h-24 bg-devops-900 rounded-3xl flex items-center justify-center border border-white/10 shadow-2xl overflow-hidden glass-card">
                    <div className="absolute inset-0 bg-gradient-to-br from-hunj-600/20 to-transparent"></div>
                    <Target className="w-10 h-10 text-white relative z-10" />
                    {/* Scanning effect */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-hunj-400/50 blur-sm animate-[scan_3s_ease-in-out_infinite]"></div>
                </div>
            </div>
            <h1 className="text-4xl font-display font-bold text-white mb-2 tracking-tight text-center">HUNJ</h1>
            <div className="flex items-center gap-2 text-hunj-400 text-sm font-medium bg-hunj-500/10 px-3 py-1 rounded-full border border-hunj-500/20">
                <Sparkles className="w-3 h-3" />
                <span>Intelligent Career Acceleration</span>
            </div>
        </div>

        {/* Glass Card */}
        <div className="bg-devops-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-hunj-500 to-transparent opacity-50"></div>

            {/* Mode Switcher */}
            <div className="grid grid-cols-2 gap-1 bg-devops-950/50 p-1 rounded-xl mb-6 border border-white/5">
                <button 
                    onClick={() => { setIsRegistering(false); setError(null); }}
                    className={`py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${!isRegistering ? 'bg-devops-800 text-white shadow-lg border border-white/5' : 'text-devops-400 hover:text-white'}`}
                >
                    Log In
                </button>
                <button 
                    onClick={() => { setIsRegistering(true); setError(null); }}
                    className={`py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${isRegistering ? 'bg-devops-800 text-white shadow-lg border border-white/5' : 'text-devops-400 hover:text-white'}`}
                >
                    Initialize
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {isRegistering && (
                    <div className="space-y-1 animate-in fade-in slide-in-from-bottom-2">
                        <label className="text-[10px] font-bold text-devops-400 uppercase tracking-widest ml-1">Identity</label>
                        <input 
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-devops-950/50 border border-white/10 rounded-xl p-3.5 text-white focus:border-hunj-500 focus:ring-1 focus:ring-hunj-500 outline-none transition-all placeholder-devops-600"
                            placeholder="Full Name"
                        />
                    </div>
                )}
                
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-devops-400 uppercase tracking-widest ml-1">Access Key (Email)</label>
                    <input 
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-devops-950/50 border border-white/10 rounded-xl p-3.5 text-white focus:border-hunj-500 focus:ring-1 focus:ring-hunj-500 outline-none transition-all placeholder-devops-600"
                        placeholder="user@example.com"
                    />
                </div>

                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-xs font-medium animate-in fade-in">
                        <Info className="w-4 h-4 flex-shrink-0" />
                        {error}
                    </div>
                )}

                <button 
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-white text-devops-950 rounded-xl font-bold hover:bg-hunj-50 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2 shadow-[0_0_20px_rgba(255,255,255,0.2)] group"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : (
                        <>
                            {isRegistering ? 'Establish Link' : 'Authenticate'}
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>
            </form>

            <div className="my-6 flex items-center gap-3">
                <div className="h-px bg-white/10 flex-1"></div>
                <span className="text-[10px] text-devops-500 font-bold uppercase tracking-widest">Or Access Via</span>
                <div className="h-px bg-white/10 flex-1"></div>
            </div>

            <div className="w-full flex flex-col gap-3">
                <button 
                    onClick={handleGuestLogin}
                    disabled={loading}
                    className="w-full py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl font-bold transition-all flex items-center justify-center gap-3 text-sm group"
                >
                    <Fingerprint className="w-5 h-5 text-hunj-400" />
                    Guest Access
                </button>

                <div className="relative group flex justify-center mt-2 flex-col items-center">
                    <div id="google-btn-wrapper" ref={googleBtnRef} className="w-full flex justify-center min-h-[44px]"></div>
                    
                    <button 
                        onClick={() => setShowDevHelp(!showDevHelp)}
                        className="text-[10px] text-devops-600 hover:text-devops-400 mt-4 flex items-center gap-1 transition-colors"
                    >
                        {showDevHelp ? 'Hide Console' : 'System Status: 400?'}
                    </button>
                </div>
            </div>
            
            {showDevHelp && (
                <div className="mt-4 p-4 bg-orange-950/30 border border-orange-500/20 rounded-xl text-left animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                        <span className="text-xs font-bold text-orange-400">Origin Mismatch Detected</span>
                    </div>
                    <p className="text-[10px] text-orange-300 mb-3 leading-relaxed opacity-80">
                        The current domain is not whitelisted in the Google Cloud Console.
                    </p>
                    <div className="flex items-center gap-2 bg-black/20 p-2 rounded-lg border border-orange-500/20">
                        <code className="text-[10px] text-orange-200 flex-1 overflow-hidden truncate font-mono">
                            {typeof window !== 'undefined' ? window.location.origin : ''}
                        </code>
                        <button 
                            onClick={handleCopyOrigin}
                            className="p-1.5 hover:bg-orange-500/20 rounded text-orange-400 transition-colors"
                            title="Copy URL"
                        >
                            {copiedOrigin ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
