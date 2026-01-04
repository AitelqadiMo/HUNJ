
import React from 'react';
import { Target, Zap, Shield, ArrowRight, Briefcase, Cpu, FileText, MessageSquare, Linkedin, CheckCircle2, Play, Users, BarChart3, Layers, Sparkles } from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
}

// Updated Logo to match Royal Blue/Slate branding
const LogoSVG = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="40" height="40" rx="10" className="fill-slate-900" />
    <path d="M12 28V12" stroke="white" strokeWidth="3" strokeLinecap="round"/>
    <path d="M28 28V12" stroke="white" strokeWidth="3" strokeLinecap="round"/>
    <path d="M12 20H28" stroke="white" strokeWidth="3" strokeLinecap="round"/>
    <circle cx="20" cy="20" r="6" stroke="#3b82f6" strokeWidth="2" strokeDasharray="2 2" className="animate-spin-slow origin-center"/>
  </svg>
);

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 overflow-x-hidden">
        
        {/* Modern Aurora Background */}
        <div className="fixed inset-0 z-0 pointer-events-none">
            <div className="absolute top-[-20%] left-[-10%] w-[80vw] h-[80vw] bg-blue-400/10 rounded-full blur-[120px] animate-blob mix-blend-multiply"></div>
            <div className="absolute top-[-20%] right-[-10%] w-[80vw] h-[80vw] bg-indigo-400/10 rounded-full blur-[120px] animate-blob animation-delay-2000 mix-blend-multiply"></div>
            <div className="absolute bottom-[-20%] left-[20%] w-[80vw] h-[80vw] bg-slate-300/20 rounded-full blur-[120px] animate-blob animation-delay-4000 mix-blend-multiply"></div>
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]"></div>
        </div>

        {/* Navbar */}
        <nav className="relative z-50 max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
            <div className="flex items-center gap-3 group cursor-pointer" onClick={onStart}>
                <LogoSVG />
                <span className="text-2xl font-bold tracking-tight text-slate-900">HUNJ</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
                <button onClick={() => document.getElementById('features')?.scrollIntoView({behavior: 'smooth'})} className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Platform</button>
                <button 
                    onClick={onStart}
                    className="px-5 py-2.5 text-sm font-semibold bg-slate-900 text-white rounded-full hover:bg-blue-600 transition-all shadow-lg hover:shadow-blue-600/20 active:scale-95"
                >
                    Launch App
                </button>
            </div>
        </nav>

        {/* Hero Section */}
        <main className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-32 flex flex-col lg:flex-row items-center gap-20">
            
            <div className="flex-1 space-y-8 animate-fade-in-up">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 shadow-sm text-slate-600 text-xs font-semibold uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                    AI Career Architect v2.0
                </div>
                
                <h1 className="text-6xl md:text-7xl font-bold leading-[1.05] tracking-tight text-slate-900">
                    Hunt Smarter, <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                        Not Harder.
                    </span>
                </h1>
                
                <p className="text-xl text-slate-500 max-w-lg leading-relaxed font-medium">
                    The only career platform that actively works for you. Automated tailoring, rigorous interview prep, and predictive job matching.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <button 
                        onClick={onStart}
                        className="px-8 py-4 bg-slate-900 hover:bg-blue-600 text-white rounded-2xl font-bold text-lg shadow-2xl shadow-slate-900/20 hover:shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3"
                    >
                        Get Started Free
                        <ArrowRight className="w-5 h-5 opacity-70" />
                    </button>
                    <button 
                        onClick={() => window.open('https://www.youtube.com/watch?v=dQw4w9WgXcQ', '_blank')} 
                        className="px-8 py-4 bg-white hover:bg-slate-50 text-slate-900 rounded-2xl font-bold text-lg border border-slate-200 shadow-sm transition-all flex items-center justify-center gap-3"
                    >
                        <Play className="w-5 h-5 fill-slate-900" />
                        See it in Action
                    </button>
                </div>

                <div className="pt-8 border-t border-slate-200/60">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Trusted by professionals from</p>
                    <div className="flex gap-6 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                        {['Google', 'Amazon', 'Spotify', 'Tesla'].map((logo) => (
                            <span key={logo} className="text-lg font-bold text-slate-800">{logo}</span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Hero Visual - Floating Cards */}
            <div className="flex-1 w-full relative perspective-[2000px]">
                {/* Main Card */}
                <div className="relative z-20 bg-white/70 backdrop-blur-2xl border border-white/40 rounded-[2rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] p-8 transform rotate-y-[-10deg] rotate-x-[5deg] hover:rotate-0 transition-transform duration-700 ease-out">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">H</div>
                            <div>
                                <h3 className="font-bold text-slate-900 text-lg">Senior DevOps Engineer</h3>
                                <p className="text-slate-500 text-sm">Netflix • Los Gatos, CA</p>
                            </div>
                        </div>
                        <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-200 flex items-center gap-1">
                            <Zap className="w-3 h-3 fill-current" /> 98% Match
                        </div>
                    </div>
                    
                    <div className="space-y-4 mb-8">
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="w-4 h-4 text-blue-600" />
                                <span className="text-xs font-bold text-blue-600 uppercase">AI Insight</span>
                            </div>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Your experience with <span className="font-bold text-slate-900 bg-blue-100 px-1 rounded">Kubernetes</span> matches the job requirement perfectly. I've emphasized your cluster management project in the summary.
                            </p>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full w-full overflow-hidden">
                            <div className="h-full bg-blue-600 w-3/4 rounded-full animate-pulse"></div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                         <button className="flex-1 py-3 bg-slate-900 rounded-xl text-white text-sm font-bold shadow-lg">Apply Now</button>
                         <button className="flex-1 py-3 bg-white border border-slate-200 rounded-xl text-slate-600 text-sm font-bold hover:bg-slate-50">View Analysis</button>
                    </div>
                </div>

                {/* Floating Elements */}
                <div className="absolute top-10 -right-12 z-30 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 animate-float delay-700">
                    <div className="flex items-center gap-3">
                        <div className="bg-green-100 p-2 rounded-lg text-green-600"><CheckCircle2 className="w-5 h-5"/></div>
                        <div>
                            <div className="text-xs text-slate-400 font-bold uppercase">Resume</div>
                            <div className="font-bold text-slate-900">Tailored</div>
                        </div>
                    </div>
                </div>

                <div className="absolute -bottom-8 -left-8 z-30 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 animate-float">
                    <div className="flex items-center gap-3">
                        <div className="bg-purple-100 p-2 rounded-lg text-purple-600"><MessageSquare className="w-5 h-5"/></div>
                        <div>
                            <div className="text-xs text-slate-400 font-bold uppercase">Interview</div>
                            <div className="font-bold text-slate-900">Prep Ready</div>
                        </div>
                    </div>
                </div>
            </div>
        </main>

        {/* Bento Grid Features */}
        <section id="features" className="py-24 relative">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight">Everything you need to <br/>dominate the job market.</h2>
                    <p className="text-slate-500 max-w-xl mx-auto">A unified ecosystem of AI tools designed to manage every stage of your application lifecycle.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-6 h-auto md:h-[600px]">
                    {/* Large Card */}
                    <div className="md:col-span-2 md:row-span-2 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-100 transition-colors"></div>
                        <div className="relative z-10 h-full flex flex-col">
                            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white mb-6">
                                <Cpu className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-3">Hyper-Personalization Engine</h3>
                            <p className="text-slate-500 leading-relaxed mb-8 flex-1">
                                Our core AI doesn't just swap keywords. It fundamentally restructures your resume's narrative to align with the specific psychological and technical requirements of each job description.
                            </p>
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                <div className="flex gap-2 mb-2">
                                    <span className="w-2 h-2 rounded-full bg-red-400"></span>
                                    <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                                    <span className="w-2 h-2 rounded-full bg-green-400"></span>
                                </div>
                                <div className="space-y-2">
                                    <div className="h-2 bg-slate-200 rounded w-full"></div>
                                    <div className="h-2 bg-slate-200 rounded w-5/6"></div>
                                    <div className="h-2 bg-blue-200 rounded w-full"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Medium Card */}
                    <div className="md:col-span-2 bg-slate-900 rounded-3xl p-8 shadow-sm group hover:shadow-xl transition-all relative overflow-hidden text-white">
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
                        <div className="relative z-10 flex items-center gap-6">
                            <div className="flex-1">
                                <h3 className="text-xl font-bold mb-2">Mock Interviewer</h3>
                                <p className="text-slate-400 text-sm">Real-time voice and text simulation with feedback on your STAR method delivery.</p>
                            </div>
                            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                                <MessageSquare className="w-8 h-8 text-blue-400" />
                            </div>
                        </div>
                    </div>

                    {/* Small Card 1 */}
                    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-lg transition-all group">
                        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-green-600 mb-4">
                            <BarChart3 className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-slate-900 mb-1">Salary Intel</h3>
                        <p className="text-xs text-slate-500">Real-time market rate analysis.</p>
                    </div>

                    {/* Small Card 2 */}
                    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-lg transition-all group">
                        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 mb-4">
                            <Linkedin className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-slate-900 mb-1">LinkedIn Sync</h3>
                        <p className="text-xs text-slate-500">Profile optimization hooks.</p>
                    </div>
                </div>
            </div>
        </section>

        {/* Retention / CTA */}
        <section className="py-24 bg-white border-t border-slate-200">
            <div className="max-w-4xl mx-auto px-6 text-center">
                <h2 className="text-4xl font-bold text-slate-900 mb-6 tracking-tight">Your career command center.</h2>
                <p className="text-lg text-slate-500 mb-10">
                    Join thousands of professionals who have stopped applying blindly and started hunting with intelligence.
                </p>
                <button 
                    onClick={onStart}
                    className="px-12 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold text-lg shadow-xl shadow-blue-600/30 transition-all hover:scale-105 active:scale-95"
                >
                    Create Free Account
                </button>
                <p className="mt-6 text-xs font-medium text-slate-400">No credit card required. Data stored locally.</p>
            </div>
        </section>
        
    </div>
  );
};

export default LandingPage;
