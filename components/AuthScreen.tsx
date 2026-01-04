
import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { storageService } from '../services/storageService';
import { logger } from '../services/loggingService';
import { Target, ArrowRight, Loader2, Info, AlertTriangle, UserCircle, Copy, Check } from 'lucide-react';

declare global {
    interface Window {
        google: any;
    }
}

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
                      { theme: "filled_blue", size: "large", width: "100%", text: "continue_with", shape: "pill" }
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
      await new Promise(resolve => setTimeout(resolve, 800));
      
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
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-gradient-to-br from-hunj-600/10 to-neon-cyan/10 rounded-full blur-[100px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-gradient-to-tr from-purple-500/10 to-blue-500/10 rounded-full blur-[80px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-slate-900 to-hunj-900 shadow-2xl shadow-hunj-600/20 mb-6 transform rotate-3 hover:rotate-0 transition-transform duration-500 border border-white/20">
                <Target className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">HUNJ</h1>
            <p className="text-slate-500 font-medium">Hunt Your Job with Intelligence</p>
        </div>

        <div className="bg-white/80 border border-white/50 rounded-3xl shadow-2xl shadow-slate-200/50 p-8 backdrop-blur-xl">
            {/* Tab Switcher */}
            <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
                <button 
                    onClick={() => { setIsRegistering(false); setError(null); }}
                    className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${!isRegistering ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Log In
                </button>
                <button 
                    onClick={() => { setIsRegistering(true); setError(null); }}
                    className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${isRegistering ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Sign Up
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {isRegistering && (
                    <div className="space-y-1 animate-in fade-in slide-in-from-bottom-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Full Name</label>
                        <input 
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl p-3.5 text-slate-900 focus:border-hunj-600 focus:ring-1 focus:ring-hunj-600 outline-none transition-all placeholder-slate-400 shadow-sm"
                            placeholder="Alex Hunter"
                        />
                    </div>
                )}
                
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Email Address</label>
                    <input 
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-3.5 text-slate-900 focus:border-hunj-600 focus:ring-1 focus:ring-hunj-600 outline-none transition-all placeholder-slate-400 shadow-sm"
                        placeholder="alex@example.com"
                    />
                </div>

                {error && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-red-600 text-xs font-medium">
                        <Info className="w-4 h-4 flex-shrink-0" />
                        {error}
                    </div>
                )}

                <button 
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-slate-900 hover:bg-hunj-600 text-white rounded-xl font-bold shadow-lg shadow-slate-900/20 hover:shadow-hunj-600/30 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : (
                        <>
                            {isRegistering ? 'Start Hunting' : 'Welcome Back'}
                            <ArrowRight className="w-4 h-4" />
                        </>
                    )}
                </button>
            </form>

            <div className="my-6 flex items-center gap-3">
                <div className="h-px bg-slate-200 flex-1"></div>
                <span className="text-xs text-slate-400 font-medium uppercase">Or continue with</span>
                <div className="h-px bg-slate-200 flex-1"></div>
            </div>

            {/* Google Button Area */}
            <div className="w-full flex flex-col gap-3">
                
                {/* Guest/Demo Fallback */}
                <button 
                    onClick={handleGuestLogin}
                    disabled={loading}
                    className="w-full py-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-full font-bold transition-all flex items-center justify-center gap-2 text-sm shadow-sm group"
                >
                    <UserCircle className="w-5 h-5 text-hunj-600 group-hover:scale-110 transition-transform" />
                    Preview as Guest
                </button>

                <div className="relative group flex justify-center mt-2 flex-col items-center">
                    <div 
                        id="google-btn-wrapper" 
                        ref={googleBtnRef} 
                        className="w-full flex justify-center min-h-[44px]"
                    ></div>
                    
                    {/* Developer Help Trigger */}
                    <button 
                        onClick={() => setShowDevHelp(!showDevHelp)}
                        className="text-[10px] text-slate-400 hover:text-slate-600 mt-3 underline flex items-center gap-1"
                    >
                        {showDevHelp ? 'Hide Help' : 'Developer: Getting Error 400?'}
                    </button>
                </div>
            </div>
            
            {/* Developer Troubleshooting Panel */}
            {showDevHelp && (
                <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-xl text-left animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                        <span className="text-xs font-bold text-orange-800">Fixing "Error 400: origin_mismatch"</span>
                    </div>
                    <p className="text-[10px] text-orange-700 mb-2 leading-relaxed">
                        This error means your current deployed URL is not approved by Google. To fix it, you must add the URL below to your Google Cloud Console.
                    </p>
                    <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-orange-200">
                        <code className="text-[10px] text-orange-900 flex-1 overflow-hidden truncate font-mono">
                            {typeof window !== 'undefined' ? window.location.origin : ''}
                        </code>
                        <button 
                            onClick={handleCopyOrigin}
                            className="p-1.5 hover:bg-orange-100 rounded text-orange-600 transition-colors"
                            title="Copy URL"
                        >
                            {copiedOrigin ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        </button>
                    </div>
                </div>
            )}
            
        </div>
        
        <p className="text-center text-xs text-slate-400 mt-8">
            HUNJ stores data locally. By continuing, you agree to the Terms.
        </p>
      </div>
    </div>
  );
};

export default AuthScreen;
