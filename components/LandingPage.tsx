
import React, { useState, useEffect, useRef } from 'react';
import { 
    Target, ArrowRight, CheckCircle2, Cpu, Database, LayoutTemplate, 
    Search, BarChart3, Terminal, Activity, Shield, Sparkles, 
    MessageSquare, Briefcase, Play, Layers, Zap, TrendingUp, 
    Globe, Lock, ChevronRight, Star, MousePointer2, BrainCircuit 
} from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
}

// --- UTILS ---
const FadeIn = ({ children, delay = 0 }: { children?: React.ReactNode, delay?: number }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setIsVisible(true);
                observer.disconnect();
            }
        }, { threshold: 0.1 });
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    return (
        <div 
            ref={ref} 
            className={`transition-all duration-1000 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
};

const FeatureCard = ({ icon: Icon, title, desc, className = "" }: any) => (
    <div className={`group relative bg-devops-900/40 border border-white/5 p-8 rounded-3xl hover:border-hunj-500/30 transition-all duration-500 hover:shadow-2xl hover:shadow-hunj-500/10 overflow-hidden ${className}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-hunj-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="relative z-10">
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-6 text-hunj-400 group-hover:scale-110 group-hover:bg-hunj-600 group-hover:text-white transition-all duration-300">
                <Icon className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
            <p className="text-devops-400 leading-relaxed text-sm">{desc}</p>
        </div>
    </div>
);

// --- MAIN COMPONENT ---
const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  const [activeDemo, setActiveDemo] = useState(0);

  // Auto-cycle demo visuals
  useEffect(() => {
      const interval = setInterval(() => {
          setActiveDemo(prev => (prev + 1) % 3);
      }, 4000);
      return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-devops-950 text-slate-300 font-sans selection:bg-hunj-500/30 overflow-x-hidden relative">
        
        {/* --- GLOBAL AMBIANCE --- */}
        <div className="fixed inset-0 z-0 pointer-events-none">
            {/* Grid */}
            <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
            
            {/* Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[800px] h-[800px] bg-hunj-600/10 rounded-full blur-[120px] animate-pulse-slow"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-accent-600/10 rounded-full blur-[120px] animate-float"></div>
        </div>

        {/* --- NAVBAR --- */}
        <nav className="fixed w-full z-50 top-0 border-b border-white/5 bg-devops-950/80 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                <div className="flex items-center gap-3 group cursor-pointer" onClick={onStart}>
                    <div className="w-10 h-10 bg-gradient-to-br from-hunj-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-hunj-500/20 group-hover:rotate-12 transition-transform">
                        <Target className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <div className="font-display font-bold text-white text-xl tracking-tight leading-none">HUNJ</div>
                        <div className="text-[10px] text-devops-400 font-mono tracking-widest uppercase">Career Intelligence</div>
                    </div>
                </div>
                <div className="flex gap-4 items-center">
                    <button onClick={onStart} className="text-sm font-medium hover:text-white transition-colors hidden md:block">Sign In</button>
                    <button 
                        onClick={onStart} 
                        className="group relative px-5 py-2.5 bg-white text-devops-950 rounded-lg font-bold text-sm hover:bg-hunj-50 transition-all shadow-glow hover:shadow-white/20 overflow-hidden"
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            Initialize <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform"/>
                        </span>
                    </button>
                </div>
            </div>
        </nav>

        {/* --- HERO SECTION --- */}
        <section className="relative pt-40 pb-24 lg:pt-52 lg:pb-32 z-10">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                
                {/* Hero Content */}
                <div className="space-y-8 max-w-2xl animate-slide-up-stagger">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-hunj-900/30 border border-hunj-500/30 text-hunj-300 text-xs font-bold uppercase tracking-widest backdrop-blur-md">
                        <span className="w-2 h-2 rounded-full bg-hunj-400 animate-pulse"></span>
                        AI-Native Career OS
                    </div>
                    
                    <h1 className="text-5xl lg:text-7xl font-display font-bold text-white leading-[1.1] tracking-tight">
                        Turn Your Resume Into <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-hunj-400 via-purple-400 to-accent-400 animate-gradient-x">Career Intelligence</span>
                    </h1>
                    
                    <p className="text-lg text-devops-300 max-w-lg leading-relaxed">
                        Stop guessing keywords. Start engineering your career.
                        Use AI to structure your history, reverse-engineer job requirements, and deploy tailored applications at scale.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <button 
                            onClick={onStart}
                            className="group relative px-8 py-4 bg-hunj-600 hover:bg-hunj-500 text-white rounded-2xl font-bold text-lg transition-all hover:scale-[1.02] shadow-[0_0_40px_-10px_rgba(124,58,237,0.5)] flex items-center justify-center gap-3"
                        >
                            Start Free Trial <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button 
                            onClick={onStart}
                            className="px-8 py-4 bg-devops-900/50 hover:bg-devops-800 text-white border border-white/10 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 backdrop-blur-md"
                        >
                            <Play className="w-5 h-5 fill-white" /> Watch Demo
                        </button>
                    </div>

                    <div className="pt-8 flex items-center gap-6 text-sm text-devops-500 font-medium">
                        <span className="flex items-center gap-2"><Shield className="w-4 h-4 text-accent-500"/> Privacy First</span>
                        <span className="flex items-center gap-2"><Cpu className="w-4 h-4 text-accent-500"/> Gemini 1.5 Pro</span>
                        <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent-500"/> 90% ATS Success</span>
                    </div>
                </div>

                {/* Hero Visual: The Transformation Engine */}
                <div className="relative w-full h-[500px] perspective-1000 hidden lg:block animate-slide-up-stagger" style={{ animationDelay: '200ms' }}>
                    
                    {/* Floating Cards Container */}
                    <div className="relative w-full h-full">
                        
                        {/* 1. Raw Resume (Back Layer) */}
                        <div className={`absolute top-10 left-10 w-[350px] h-[450px] bg-white rounded-xl shadow-2xl border border-slate-200 p-6 transform transition-all duration-700 ease-out origin-bottom-left ${activeDemo === 0 ? 'scale-100 z-30 opacity-100 rotate-0' : 'scale-90 z-10 opacity-40 -rotate-6 translate-x-10'}`}>
                            <div className="h-4 w-20 bg-slate-200 rounded mb-6"></div>
                            <div className="space-y-3">
                                {[1,2,3,4,5,6].map(i => (
                                    <div key={i} className="h-2 bg-slate-100 rounded w-full"></div>
                                ))}
                                <div className="h-20 border-2 border-dashed border-red-200 bg-red-50 rounded-lg flex items-center justify-center text-red-400 text-xs font-bold mt-4">
                                    UNSTRUCTURED TEXT
                                </div>
                            </div>
                        </div>

                        {/* 2. Scanning Beam */}
                        <div className={`absolute top-0 left-[185px] w-1 h-[500px] bg-gradient-to-b from-transparent via-hunj-500 to-transparent z-40 transition-opacity duration-300 ${activeDemo === 0 ? 'opacity-100 animate-pulse' : 'opacity-0'}`}></div>

                        {/* 3. Intelligence Dashboard (Front Layer) */}
                        <div className={`absolute top-20 right-0 w-[400px] h-[400px] bg-devops-900 border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] p-5 backdrop-blur-xl transform transition-all duration-700 ease-out ${activeDemo === 0 ? 'translate-x-20 opacity-0' : 'translate-x-0 opacity-100 z-30'}`}>
                            {/* Header */}
                            <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                                <div className="flex gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                </div>
                                <div className="text-[10px] font-mono text-hunj-400">ANALYSIS_COMPLETE</div>
                            </div>

                            {/* Widgets */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 bg-devops-800/50 p-4 rounded-xl border border-white/5">
                                    <div className="flex justify-between mb-2">
                                        <span className="text-xs text-devops-400">Job Match</span>
                                        <span className="text-xs font-bold text-green-400">94%</span>
                                    </div>
                                    <div className="w-full bg-devops-950 h-2 rounded-full overflow-hidden">
                                        <div className="bg-green-500 h-full w-[94%] animate-[shimmer_2s_infinite]"></div>
                                    </div>
                                </div>
                                
                                <div className="bg-devops-800/50 p-4 rounded-xl border border-white/5 flex flex-col items-center justify-center text-center">
                                    <div className="w-10 h-10 bg-hunj-500/20 rounded-full flex items-center justify-center mb-2">
                                        <BrainCircuit className="w-5 h-5 text-hunj-400" />
                                    </div>
                                    <div className="text-xl font-bold text-white">4</div>
                                    <div className="text-[10px] text-devops-400">Skill Gaps Found</div>
                                </div>

                                <div className="bg-devops-800/50 p-4 rounded-xl border border-white/5 flex flex-col items-center justify-center text-center">
                                    <div className="w-10 h-10 bg-accent-500/20 rounded-full flex items-center justify-center mb-2">
                                        <TrendingUp className="w-5 h-5 text-accent-400" />
                                    </div>
                                    <div className="text-xl font-bold text-white">$145k</div>
                                    <div className="text-[10px] text-devops-400">Est. Salary</div>
                                </div>
                            </div>

                            {/* Bullet Rewrite Visualization */}
                            <div className="mt-4 bg-devops-950 rounded-xl p-3 border border-white/5 relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
                                <div className="text-[10px] text-devops-500 mb-1">OPTIMIZED BULLET</div>
                                <div className="text-xs text-green-300 font-mono">
                                    {">"} Architected scaleable microservices reducing latency by 40%...
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </section>

        {/* --- LOGO TICKER --- */}
        <div className="border-y border-white/5 bg-black/20 backdrop-blur-sm py-8 overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 flex items-center gap-12 justify-center opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
                {/* Mock Logos - Text for simplicity/performance */}
                <span className="font-display font-bold text-xl">ACME Corp</span>
                <span className="font-display font-bold text-xl">Nebulon</span>
                <span className="font-display font-bold text-xl">Vertex AI</span>
                <span className="font-display font-bold text-xl">Globex</span>
                <span className="font-display font-bold text-xl">Soylent</span>
            </div>
        </div>

        {/* --- VALUE PILLARS --- */}
        <section className="py-32 relative">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-20">
                    <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-6">The New Standard in <br/> Career Engineering</h2>
                    <p className="text-devops-400 max-w-2xl mx-auto text-lg">
                        Traditional builders just format text. HUNJ structures your career data into a queryable knowledge graph to dominate ATS algorithms.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <FadeIn delay={0}>
                        <FeatureCard 
                            icon={Database}
                            title="Structured Intelligence"
                            desc="We parse your PDF into atomic career entities—skills, metrics, and achievements—creating a reusable database, not just a document."
                        />
                    </FadeIn>
                    <FadeIn delay={150}>
                        <FeatureCard 
                            icon={Target}
                            title="Semantic Tailoring"
                            desc="Our engine analyzes the semantic intent of job descriptions to rewrite your bullets for maximum relevance scores."
                        />
                    </FadeIn>
                    <FadeIn delay={300}>
                        <FeatureCard 
                            icon={BarChart3}
                            title="Market Reconnaissance"
                            desc="Real-time salary estimation and demand forecasting for every role, giving you leverage before the first interview."
                        />
                    </FadeIn>
                </div>
            </div>
        </section>

        {/* --- BENTO GRID SHOWCASE --- */}
        <section className="py-20 bg-devops-900/30 border-y border-white/5">
            <div className="max-w-7xl mx-auto px-6">
                <div className="mb-16 md:flex justify-between items-end">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-2">Command Center</h2>
                        <p className="text-devops-400">Everything you need to execute a successful campaign.</p>
                    </div>
                    <button onClick={onStart} className="hidden md:flex items-center gap-2 text-hunj-400 font-bold hover:text-white transition-colors">
                        Explore Features <ArrowRight className="w-4 h-4"/>
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-6 h-auto md:h-[600px]">
                    
                    {/* 1. Large Editor Mockup */}
                    <div className="md:col-span-2 md:row-span-2 bg-devops-800 rounded-3xl border border-white/5 p-8 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
                        <div className="relative z-10 h-full flex flex-col">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-hunj-500/20 rounded-lg text-hunj-400"><Layers className="w-6 h-6"/></div>
                                <h3 className="text-xl font-bold text-white">Live Editor</h3>
                            </div>
                            <p className="text-devops-400 mb-8 text-sm">Real-time suggestions and "Magic Fix" for weak bullet points.</p>
                            
                            {/* Editor Visual */}
                            <div className="flex-1 bg-white rounded-t-xl shadow-2xl overflow-hidden relative translate-y-4 group-hover:translate-y-2 transition-transform duration-500">
                                <div className="h-8 bg-slate-100 border-b border-slate-200 flex items-center px-4 gap-2">
                                    <div className="w-2 h-2 rounded-full bg-red-400"></div>
                                    <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div className="h-4 bg-slate-100 w-1/3 rounded"></div>
                                    <div className="h-2 bg-slate-50 w-full rounded"></div>
                                    <div className="h-2 bg-slate-50 w-5/6 rounded"></div>
                                    <div className="p-3 bg-hunj-50 border border-hunj-200 rounded-lg flex items-center justify-between">
                                        <div className="h-2 bg-hunj-200 w-2/3 rounded"></div>
                                        <div className="px-2 py-1 bg-white text-[9px] font-bold text-hunj-600 rounded border border-hunj-200 shadow-sm">
                                            Improved
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. Match Score */}
                    <div className="md:col-span-1 md:row-span-1 bg-devops-800 rounded-3xl border border-white/5 p-6 relative overflow-hidden group hover:border-green-500/30 transition-colors">
                        <div className="absolute top-0 right-0 p-4 opacity-10"><Target className="w-24 h-24"/></div>
                        <h3 className="text-lg font-bold text-white mb-2">Rank #1</h3>
                        <div className="flex items-end gap-2 mb-2">
                            <span className="text-4xl font-bold text-green-400">98</span>
                            <span className="text-sm text-devops-400 mb-1">/ 100</span>
                        </div>
                        <div className="w-full bg-devops-950 h-2 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 w-[98%]"></div>
                        </div>
                        <p className="text-xs text-devops-500 mt-3">Beats 98% of applicants.</p>
                    </div>

                    {/* 3. Interview Prep */}
                    <div className="md:col-span-1 md:row-span-2 bg-gradient-to-b from-purple-900/40 to-devops-800 rounded-3xl border border-white/5 p-6 flex flex-col relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
                        <div className="flex items-center gap-2 mb-6">
                            <MessageSquare className="w-5 h-5 text-purple-400" />
                            <h3 className="text-lg font-bold text-white">Mock Interview</h3>
                        </div>
                        <div className="flex-1 space-y-3">
                            <div className="bg-devops-950/50 p-3 rounded-lg rounded-tl-none border border-white/5 text-xs text-devops-200">
                                Tell me about a time you handled a production outage?
                            </div>
                            <div className="bg-purple-600/20 p-3 rounded-lg rounded-tr-none border border-purple-500/20 text-xs text-white ml-auto max-w-[90%]">
                                In my last role at TechCorp, I led the incident response...
                            </div>
                            <div className="mt-auto bg-green-900/20 border border-green-500/20 p-3 rounded-xl flex items-center gap-3">
                                <div className="p-2 bg-green-500/20 rounded-lg text-green-400"><Star className="w-4 h-4"/></div>
                                <div>
                                    <div className="text-xs font-bold text-white">Strong Answer</div>
                                    <div className="text-[10px] text-green-400">STAR Method Detected</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 4. Salary Data */}
                    <div className="md:col-span-1 md:row-span-1 bg-devops-800 rounded-3xl border border-white/5 p-6 flex flex-col justify-center relative overflow-hidden group">
                        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-accent-500/20 rounded-full blur-xl group-hover:bg-accent-500/30 transition-colors"></div>
                        <div className="relative z-10">
                            <h3 className="text-sm font-bold text-devops-400 uppercase tracking-widest mb-1">Salary Intel</h3>
                            <div className="text-2xl font-bold text-white flex items-center gap-2">
                                $140k - $180k
                            </div>
                            <div className="flex items-center gap-1 text-xs text-green-400 mt-1">
                                <TrendingUp className="w-3 h-3"/> +12% vs Market
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>

        {/* --- TESTIMONIAL / TRUST --- */}
        <section className="py-24 max-w-7xl mx-auto px-6">
            <div className="bg-gradient-to-br from-hunj-900/40 to-devops-900 border border-hunj-500/20 rounded-3xl p-10 md:p-16 text-center relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-hunj-500/10 via-transparent to-transparent"></div>
                
                <div className="relative z-10 space-y-8">
                    <div className="flex justify-center gap-1">
                        {[1,2,3,4,5].map(i => <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />)}
                    </div>
                    <h2 className="text-2xl md:text-4xl font-display font-bold text-white leading-tight">
                        "I stopped applying blindly. <br/>
                        HUNJ turned my job search into a <span className="text-hunj-400">sniper mission</span>."
                    </h2>
                    <div className="flex items-center justify-center gap-4">
                        <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center font-bold text-white">SJ</div>
                        <div className="text-left">
                            <div className="font-bold text-white">Sarah Jenkins</div>
                            <div className="text-xs text-devops-400">Senior DevOps Engineer @ CloudScale</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* --- CTA SECTION --- */}
        <section className="py-20 text-center relative z-10">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-hunj-900/20 pointer-events-none"></div>
            <div className="max-w-3xl mx-auto px-6 space-y-8">
                <h2 className="text-4xl md:text-5xl font-display font-bold text-white">Ready to Upgrade Your Career?</h2>
                <p className="text-lg text-devops-300">Join 10,000+ engineers using AI to land top-tier roles.</p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <button 
                        onClick={onStart}
                        className="px-10 py-4 bg-white text-devops-950 rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-2xl flex items-center justify-center gap-2"
                    >
                        Initialize Career OS <ArrowRight className="w-5 h-5"/>
                    </button>
                </div>
                <p className="text-xs text-devops-500 mt-6">No credit card required. Free tier available.</p>
            </div>
        </section>

        {/* --- FOOTER --- */}
        <footer className="border-t border-white/5 bg-devops-950 py-12 text-sm">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                <div className="col-span-2 md:col-span-1">
                    <div className="flex items-center gap-2 font-bold text-white mb-4">
                        <Target className="w-5 h-5 text-hunj-500" /> HUNJ
                    </div>
                    <p className="text-devops-500">The intelligent operating system for your career.</p>
                </div>
                <div>
                    <h4 className="font-bold text-white mb-4">Platform</h4>
                    <ul className="space-y-2 text-devops-400">
                        <li className="hover:text-white cursor-pointer">Resume Builder</li>
                        <li className="hover:text-white cursor-pointer">Job Intelligence</li>
                        <li className="hover:text-white cursor-pointer">Interview Prep</li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-bold text-white mb-4">Resources</h4>
                    <ul className="space-y-2 text-devops-400">
                        <li className="hover:text-white cursor-pointer">Career Guide</li>
                        <li className="hover:text-white cursor-pointer">Salary Data</li>
                        <li className="hover:text-white cursor-pointer">Success Stories</li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-bold text-white mb-4">Legal</h4>
                    <ul className="space-y-2 text-devops-400">
                        <li className="hover:text-white cursor-pointer">Privacy Policy</li>
                        <li className="hover:text-white cursor-pointer">Terms of Service</li>
                    </ul>
                </div>
            </div>
            <div className="max-w-7xl mx-auto px-6 text-center text-devops-600 border-t border-white/5 pt-8">
                &copy; {new Date().getFullYear()} HUNJ Inc. All rights reserved.
            </div>
        </footer>

    </div>
  );
};

export default LandingPage;
