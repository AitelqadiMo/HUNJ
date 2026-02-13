
import React, { useState, useEffect, useRef } from 'react';
import { ResumeData, JobAnalysis, ProbingQuestion, GeneratedAchievement } from '../types';
import { generateProbingQuestion, transformAnswerToBullet } from '../services/geminiService';
import { Bot, User, Send, PlusCircle, CheckCircle, Loader2, Target, MessageSquarePlus, Terminal, Cpu, Database } from 'lucide-react';

interface DeepDiveProberProps {
  resume: ResumeData;
  job: JobAnalysis;
  onAddBullet: (section: string, id: string | undefined, bullet: string) => void;
}

interface ChatStep {
  type: 'question' | 'answer' | 'proposal';
  content: string | ProbingQuestion | GeneratedAchievement;
  timestamp: number;
}

const DeepDiveProber: React.FC<DeepDiveProberProps> = ({ resume, job, onAddBullet }) => {
  const [history, setHistory] = useState<ChatStep[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [showTopicInput, setShowTopicInput] = useState(false);
  const [topic, setTopic] = useState('');
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (history.length === 0) {
      startSession();
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const startSession = async () => {
    setIsLoading(true);
    try {
        const q = await generateProbingQuestion(resume, job, []);
        setHistory([{ type: 'question', content: q, timestamp: Date.now() }]);
        setQuestionCount(1);
    } catch (e) {
        console.error(e);
    } finally {
        setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    
    // 1. Add User Answer
    const answer = input;
    const currentHistory = [...history, { type: 'answer', content: answer, timestamp: Date.now() } as ChatStep];
    setHistory(currentHistory);
    setInput('');
    setIsLoading(true);

    try {
        // 2. Transform to Bullet
        const lastQuestion = history[history.length - 1].content as ProbingQuestion;
        const achievement = await transformAnswerToBullet(lastQuestion.question, answer, resume);
        
        const historyWithProposal = [...currentHistory, { type: 'proposal', content: achievement, timestamp: Date.now() } as ChatStep];
        setHistory(historyWithProposal);

    } catch (e) {
        console.error(e);
    } finally {
        setIsLoading(false);
    }
  };

  const handleAccept = (achievement: GeneratedAchievement) => {
      onAddBullet(achievement.suggestedSection, achievement.relatedId, achievement.improvedBullet);
  };

  const handleNextQuestion = async (customTopic?: string) => {
      setIsLoading(true);
      setShowTopicInput(false);
      if(customTopic) setTopic(''); 

      try {
          const prevQuestions = history
            .filter(h => h.type === 'question')
            .map(h => (h.content as ProbingQuestion).question);
            
          const q = await generateProbingQuestion(resume, job, prevQuestions, customTopic);
          setHistory(prev => [...prev, { type: 'question', content: q, timestamp: Date.now() }]);
          setQuestionCount(prev => prev + 1);
      } catch (e) {
          console.error(e);
      } finally {
          setIsLoading(false);
      }
  };

  const TimeStamp = ({ ts }: { ts: number }) => (
      <span className="text-[9px] text-devops-600 font-mono ml-2 opacity-50">
          {new Date(ts).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}
      </span>
  );

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] border border-devops-800 rounded-xl overflow-hidden relative font-mono text-sm">
        {/* Header */}
        <div className="p-4 bg-devops-950 border-b border-devops-800 flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-900/20 rounded-lg flex items-center justify-center border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                    <Cpu className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                    <h3 className="font-bold text-white tracking-tight flex items-center gap-2">
                        Neural Prober <span className="px-1.5 py-0.5 rounded bg-green-900/30 text-green-400 text-[9px] border border-green-800">ACTIVE</span>
                    </h3>
                    <p className="text-[10px] text-devops-500">Extracting latent career data...</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => setShowTopicInput(!showTopicInput)}
                    className="text-[10px] uppercase font-bold bg-devops-800 hover:bg-devops-700 text-devops-300 px-3 py-1.5 rounded border border-devops-700 transition-colors flex items-center gap-1"
                >
                    <Target className="w-3 h-3" /> Focus Target
                </button>
                <span className="text-[10px] bg-devops-900 px-2 py-1 rounded text-devops-500 border border-devops-800">
                    Cycle: {questionCount}
                </span>
            </div>
        </div>

        {/* Custom Topic Input Overlay */}
        {showTopicInput && (
            <div className="absolute top-[72px] left-0 right-0 bg-devops-900/95 backdrop-blur-sm p-4 border-b border-devops-700 z-10 flex gap-2 animate-in slide-in-from-top-2">
                <span className="text-purple-500 flex items-center">{'>'}</span>
                <input 
                    className="flex-1 bg-transparent border-b border-devops-700 px-2 py-1 text-white focus:border-purple-500 outline-none"
                    placeholder="DEFINE_SEARCH_VECTOR (e.g. Leadership)"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    autoFocus
                />
                <button 
                    onClick={() => handleNextQuestion(topic)}
                    className="px-3 py-1 bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/50 rounded"
                >
                    EXECUTE
                </button>
            </div>
        )}

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8" ref={scrollRef}>
            {history.length === 0 && isLoading && (
                <div className="flex flex-col items-center justify-center h-full text-devops-600 space-y-4">
                    <div className="w-12 h-12 border-4 border-devops-800 border-t-purple-500 rounded-full animate-spin"></div>
                    <p className="animate-pulse">INITIALIZING SCAN...</p>
                </div>
            )}

            {history.map((step, idx) => {
                if (step.type === 'question') {
                    const q = step.content as ProbingQuestion;
                    return (
                        <div key={idx} className="flex gap-4 animate-in fade-in slide-in-from-left-4 duration-300">
                            <div className="w-6 h-6 flex-shrink-0 mt-1 flex items-center justify-center">
                                <Bot className="w-4 h-4 text-purple-500" />
                            </div>
                            <div className="flex-1">
                                <div className="text-[10px] text-purple-400 mb-1 flex items-center gap-2">
                                    SYSTEM_QUERY <TimeStamp ts={step.timestamp} />
                                </div>
                                <div className="text-devops-100 bg-purple-900/10 border-l-2 border-purple-500 pl-3 py-1">
                                    {q.question}
                                </div>
                                <div className="mt-2 text-[10px] text-devops-500 flex items-center gap-2">
                                    <span className="bg-devops-900 px-1.5 py-0.5 rounded text-devops-400 border border-devops-800">Target: {q.targetSkill}</span>
                                    <span>// {q.reasoning}</span>
                                </div>
                            </div>
                        </div>
                    );
                }
                
                if (step.type === 'answer') {
                    return (
                        <div key={idx} className="flex gap-4 flex-row-reverse animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="w-6 h-6 flex-shrink-0 mt-1 flex items-center justify-center">
                                <User className="w-4 h-4 text-devops-400" />
                            </div>
                            <div className="max-w-[80%]">
                                <div className="text-[10px] text-devops-500 mb-1 text-right flex items-center justify-end gap-2">
                                    USER_INPUT <TimeStamp ts={step.timestamp} />
                                </div>
                                <div className="text-devops-300 bg-devops-800/50 rounded p-3 border border-devops-800">
                                    {step.content as string}
                                </div>
                            </div>
                        </div>
                    );
                }

                if (step.type === 'proposal') {
                    const proposal = step.content as GeneratedAchievement;
                    return (
                        <div key={idx} className="pl-10 animate-in zoom-in-95 duration-500">
                            <div className="bg-green-900/5 border border-green-500/20 rounded-lg p-4 relative overflow-hidden group hover:border-green-500/40 transition-colors">
                                <div className="absolute top-0 right-0 p-2 opacity-50"><Database className="w-12 h-12 text-green-900/20" /></div>
                                
                                <div className="flex items-center gap-2 mb-3">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    <span className="text-xs font-bold text-green-400 uppercase tracking-widest">Achievement Synthesized</span>
                                    <TimeStamp ts={step.timestamp} />
                                </div>

                                <div className="bg-[#050505] p-3 rounded border border-devops-800 mb-4 font-mono text-sm text-gray-300 shadow-inner">
                                    <span className="text-green-600 mr-2">$</span>
                                    {proposal.improvedBullet}
                                    <span className="animate-pulse text-green-500">_</span>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-devops-500">
                                        Suggest: {proposal.suggestedSection}
                                    </span>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => handleNextQuestion()}
                                            className="px-3 py-1.5 text-[10px] font-bold text-devops-500 hover:text-white transition-colors uppercase tracking-wide"
                                        >
                                            Discard
                                        </button>
                                        <button 
                                            onClick={() => {
                                                handleAccept(proposal);
                                                handleNextQuestion();
                                            }}
                                            className="flex items-center gap-2 px-4 py-1.5 bg-green-600/20 hover:bg-green-600 text-green-400 hover:text-white border border-green-500/30 rounded text-xs font-bold transition-all uppercase tracking-wide"
                                        >
                                            <PlusCircle className="w-3 h-3" /> Commit to Database
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                }
                return null;
            })}
             {isLoading && (
                <div className="flex items-center gap-3 text-purple-500/50 pl-10 animate-pulse">
                    <span className="text-xs">PROCESSING_INPUT...</span>
                </div>
            )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-[#050505] border-t border-devops-800">
             <div className="relative flex gap-3 items-end">
                <span className="text-purple-500 py-3">{'>'}</span>
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                    placeholder="Provide raw data..."
                    className="flex-1 bg-transparent border-0 text-white focus:ring-0 resize-none h-12 py-3 placeholder-devops-700 leading-relaxed"
                    disabled={isLoading}
                />
                <button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="p-2 bg-devops-800 hover:bg-purple-600 text-devops-400 hover:text-white rounded transition-colors disabled:opacity-30 mb-1"
                >
                    <Send className="w-4 h-4" />
                </button>
            </div>
        </div>
    </div>
  );
};

export default DeepDiveProber;
