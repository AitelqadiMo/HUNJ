
import React, { useState } from 'react';
import { User } from '../types';
import { storageService } from '../services/storageService';
import { logger } from '../services/loggingService';
import { Cpu, ArrowRight, UserPlus, LogIn, Loader2, Info } from 'lucide-react';

interface AuthScreenProps {
  onLogin: (user: User, isNewUser: boolean) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setLoading(true);
    setError(null);

    // Simulate API delay
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
            storageService.saveUser(newUser);
            logger.info('New user registered', { email });
            onLogin(newUser, true);
        } else {
            if (!existingUser) {
                setError("User not found. Please register.");
                setLoading(false);
                return;
            }
            // Update last login
            storageService.saveUser(existingUser);
            logger.info('User logged in', { email });
            onLogin(existingUser, false);
        }
    } catch (err) {
        setError("An authentication error occurred.");
        logger.error('Auth error', err);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-devops-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-600/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-devops-800 border-2 border-devops-700 mb-4 shadow-xl shadow-accent-500/10">
                <Cpu className="w-8 h-8 text-accent-500" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">DevOps Architect</h1>
            <p className="text-devops-400">Intelligent Resume & Career Platform</p>
        </div>

        <div className="bg-devops-800 border border-devops-700 rounded-2xl shadow-2xl p-8 backdrop-blur-sm bg-opacity-95">
            <div className="flex gap-4 mb-6 border-b border-devops-700 pb-1">
                <button 
                    onClick={() => { setIsRegistering(false); setError(null); }}
                    className={`flex-1 pb-3 text-sm font-medium transition-colors relative ${!isRegistering ? 'text-white' : 'text-devops-400 hover:text-devops-200'}`}
                >
                    Login
                    {!isRegistering && <div className="absolute bottom-[-5px] left-0 w-full h-0.5 bg-accent-500 rounded-full"></div>}
                </button>
                <button 
                    onClick={() => { setIsRegistering(true); setError(null); }}
                    className={`flex-1 pb-3 text-sm font-medium transition-colors relative ${isRegistering ? 'text-white' : 'text-devops-400 hover:text-devops-200'}`}
                >
                    Create Account
                    {isRegistering && <div className="absolute bottom-[-5px] left-0 w-full h-0.5 bg-accent-500 rounded-full"></div>}
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {isRegistering && (
                    <div className="space-y-1 animate-in fade-in slide-in-from-bottom-2">
                        <label className="text-xs font-semibold text-devops-300 uppercase tracking-wide">Full Name</label>
                        <input 
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-devops-900 border border-devops-600 rounded-lg p-3 text-white focus:border-accent-500 outline-none transition-all"
                            placeholder="Jane Doe"
                        />
                    </div>
                )}
                
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-devops-300 uppercase tracking-wide">Email Address</label>
                    <input 
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-devops-900 border border-devops-600 rounded-lg p-3 text-white focus:border-accent-500 outline-none transition-all"
                        placeholder="jane@example.com"
                    />
                </div>

                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-xs">
                        <Info className="w-4 h-4 flex-shrink-0" />
                        {error}
                    </div>
                )}

                <button 
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-3 bg-accent-600 hover:bg-accent-500 text-white rounded-lg font-bold shadow-lg shadow-accent-600/20 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : (
                        <>
                            {isRegistering ? 'Get Started' : 'Sign In'}
                            <ArrowRight className="w-4 h-4" />
                        </>
                    )}
                </button>
            </form>
        </div>
        
        <p className="text-center text-xs text-devops-500 mt-6">
            By continuing, you agree to our Terms of Service and Privacy Policy.
            <br/>Data is stored locally on your device.
        </p>
      </div>
    </div>
  );
};

export default AuthScreen;
