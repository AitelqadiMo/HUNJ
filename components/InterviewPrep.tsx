
import React, { useState, useRef, useEffect } from 'react';
import { JobAnalysis, InterviewMessage } from '../types';
import { getInterviewQuestion, evaluateInterviewAnswer } from '../services/geminiService';
import { Send, Bot, User, Star, ThumbsUp, Lightbulb, RefreshCw, MessageSquare, Mic, Loader2, Play } from 'lucide-react';

interface InterviewPrepProps {
  job: JobAnalysis;
  session: InterviewMessage[] | undefined;
  onUpdateSession: (session: InterviewMessage[]) => void;
}

const InterviewPrep: React.FC<InterviewPrepProps> = ({ job, session = [], onUpdateSession }) => {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [session, isProcessing]);

  const startTextSession = async () => {
    setIsProcessing(true);
    try {
        const question = await getInterviewQuestion(job, []);
        const newSession: InterviewMessage[] = [{ id: Date.now().toString(), role: 'ai', content: question }];
        onUpdateSession(newSession);
    } finally {
        setIsProcessing(false);
    }
  };

  const handleTextAnswer = async () => {
    if (!input.trim() || isProcessing) return;
    const userMsg: InterviewMessage = { id: Date.now().toString(), role: 'user', content: input };
    onUpdateSession([...session, userMsg]);
    setInput('');
    setIsProcessing(true);

    try {
        const lastQuestion = session[session.length - 1].content;
        const feedback = await evaluateInterviewAnswer(lastQuestion, userMsg.content);
        const updatedWithFeedback = [...session, userMsg];
        updatedWithFeedback[updatedWithFeedback.length - 1].feedback = feedback;
        
        onUpdateSession([...updatedWithFeedback]); // Show feedback first

        // Delay for natural conversational feel
        await new Promise(r => setTimeout(r, 800));

        const previousQuestions = session.filter(m => m.role === 'ai').map(m => m.content);
        const nextQuestion = await getInterviewQuestion(job, previousQuestions);
        onUpdateSession([...updatedWithFeedback, { id: (Date.now() + 1).toString(), role: 'ai', content: nextQuestion }]);
    } catch (e) {
        console.error(e);
    } finally {
        setIsProcessing(false);
    }
  };

  if (session.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-devops-900 rounded-xl relative overflow-hidden">
            {/* Background Animation */}
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none"></div>
            <div className="absolute top-[-20%] right-[-20%] w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[80px]"></div>

            <div className="relative z-10 w-32 h-32 bg-devops-800 rounded-full flex items-center justify-center shadow-2xl shadow-purple-500/20 mb-8 border border-white/5 animate-float">
                <div className="absolute inset-0 rounded-full border border-purple-500/30 animate-ping opacity-20"></div>
                <Bot className="w-16 h-16 text-purple-400" />
            </div>
            
            <h2 className="text-3xl font-display font-bold text-white mb-4">Simulation Ready</h2>
            <p className="text-devops-400 max-w-md mx-auto mb-10 leading-relaxed">
                Initializing persona: <strong className="text-white">{job.company} Hiring Manager</strong>. <br/>
                Focus: <span className="text-hunj-400 font-mono">{job.title}</span> competencies.
            </p>
            
            <button onClick={startTextSession} disabled={isProcessing} className="px-8 py-4 bg-white text-devops-950 rounded-2xl font-bold text-lg hover:bg-hunj-50 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center gap-3 active:scale-95 group">
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-devops-950 group-hover:scale-110 transition-transform" />}
                Begin Sequence
            </button>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-devops-950 relative rounded-xl overflow-hidden border border-white/5">
        
        {/* Header */}
        <div className="px-6 py-4 bg-devops-900/80 backdrop-blur-md border-b border-white/10 flex justify-between items-center sticky top-0 z-20">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-devops-800 rounded-full flex items-center justify-center border border-white/10">
                    <Bot className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                    <h3 className="font-bold text-white tracking-tight">{job.company} Manager</h3>
                    <p className="text-[10px] text-green-400 font-mono flex items-center gap-1 uppercase tracking-wider"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Live Connection</p>
                </div>
            </div>
            <button onClick={() => onUpdateSession([])} className="text-xs font-bold text-red-400 hover:text-red-300 px-3 py-1.5 hover:bg-red-500/10 rounded-lg transition-colors uppercase tracking-wide border border-transparent hover:border-red-500/20">
                Terminate
            </button>
        </div>

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-noise" ref={scrollRef}>
            {session.map((msg, idx) => (
                <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                    
                    {/* Message Bubble */}
                    <div className={`max-w-[85%] rounded-2xl p-5 shadow-lg text-sm leading-relaxed border ${
                        msg.role === 'user' 
                        ? 'bg-hunj-600/20 border-hunj-500/30 text-white rounded-br-sm' 
                        : 'bg-devops-800/80 border-white/10 text-devops-100 rounded-bl-sm'
                    }`}>
                        <p className="whitespace-pre-wrap font-sans">{msg.content}</p>
                    </div>

                    {/* Feedback (Collapsible or Inline) */}
                    {msg.feedback && (
                        <div className="mt-3 max-w-[85%] bg-yellow-900/20 border border-yellow-500/20 rounded-xl p-4 animate-in fade-in zoom-in-95 backdrop-blur-sm">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-bold text-yellow-400 uppercase tracking-wider flex items-center gap-1">
                                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /> Evaluation
                                </span>
                                <span className="text-xs font-bold bg-yellow-500/20 px-2 py-0.5 rounded text-yellow-200 border border-yellow-500/30">
                                    {msg.feedback.rating}/100
                                </span>
                            </div>
                            <div className="space-y-2 text-xs text-devops-300">
                                <p><strong className="text-green-400">Strength:</strong> {msg.feedback.strengths[0]}</p>
                                <p><strong className="text-red-400">Gap:</strong> {msg.feedback.improvements[0]}</p>
                            </div>
                        </div>
                    )}
                </div>
            ))}
            
            {/* Typing Indicator */}
            {isProcessing && (
                <div className="flex items-center gap-1 p-4 bg-devops-800/50 border border-white/5 rounded-2xl rounded-bl-sm w-fit shadow-sm animate-pulse">
                    <div className="w-2 h-2 bg-devops-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-devops-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-devops-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
            )}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-devops-900 border-t border-white/10">
            <div className="relative max-w-4xl mx-auto">
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleTextAnswer(); } }}
                    placeholder="Reply to the interviewer..."
                    className="w-full bg-devops-950 border border-white/10 rounded-xl pl-5 pr-14 py-4 text-white focus:ring-1 focus:ring-hunj-500 focus:border-hunj-500 outline-none transition-all resize-none shadow-inner placeholder-devops-600 font-sans"
                    rows={1}
                    disabled={isProcessing}
                />
                <button
                    onClick={handleTextAnswer}
                    disabled={!input.trim() || isProcessing}
                    className="absolute right-2 top-2 p-2.5 bg-hunj-600 hover:bg-hunj-500 text-white rounded-lg shadow-lg shadow-hunj-500/20 transition-all disabled:opacity-50 disabled:shadow-none"
                >
                    <Send className="w-4 h-4" />
                </button>
            </div>
        </div>
    </div>
  );
};

export default InterviewPrep;
