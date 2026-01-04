import React, { useState, useEffect, useRef } from 'react';
import { ResumeData, JobAnalysis, ProbingQuestion, GeneratedAchievement } from '../types';
import { generateProbingQuestion, transformAnswerToBullet } from '../services/geminiService';
import { Bot, User, Send, PlusCircle, CheckCircle, Loader2, Target, ArrowRight, MessageSquarePlus } from 'lucide-react';

interface DeepDiveProberProps {
  resume: ResumeData;
  job: JobAnalysis;
  onAddBullet: (section: string, id: string | undefined, bullet: string) => void;
}

interface ChatStep {
  type: 'question' | 'answer' | 'proposal';
  content: string | ProbingQuestion | GeneratedAchievement;
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
        setHistory([{ type: 'question', content: q }]);
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
    const currentHistory = [...history, { type: 'answer', content: answer } as ChatStep];
    setHistory(currentHistory);
    setInput('');
    setIsLoading(true);

    try {
        // 2. Transform to Bullet
        const lastQuestion = history[history.length - 1].content as ProbingQuestion;
        const achievement = await transformAnswerToBullet(lastQuestion.question, answer, resume);
        
        const historyWithProposal = [...currentHistory, { type: 'proposal', content: achievement } as ChatStep];
        setHistory(historyWithProposal);

    } catch (e) {
        console.error(e);
    } finally {
        setIsLoading(false);
    }
  };

  const handleAccept = (achievement: GeneratedAchievement) => {
      onAddBullet(achievement.suggestedSection, achievement.relatedId, achievement.improvedBullet);
      // Mark as added in UI (visual feedback only, simplified here)
  };

  const handleNextQuestion = async (customTopic?: string) => {
      setIsLoading(true);
      setShowTopicInput(false);
      if(customTopic) setTopic(''); // Clear local topic state

      try {
          const prevQuestions = history
            .filter(h => h.type === 'question')
            .map(h => (h.content as ProbingQuestion).question);
            
          const q = await generateProbingQuestion(resume, job, prevQuestions, customTopic);
          setHistory(prev => [...prev, { type: 'question', content: q }]);
          setQuestionCount(prev => prev + 1);
      } catch (e) {
          console.error(e);
      } finally {
          setIsLoading(false);
      }
  };

  return (
    <div className="flex flex-col h-full bg-devops-900 border border-devops-700 rounded-xl overflow-hidden relative">
        {/* Header */}
        <div className="p-4 bg-devops-800 border-b border-devops-700 flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center border border-purple-500/30">
                    <Target className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                    <h3 className="font-bold text-white">Achievement Hunter</h3>
                    <p className="text-xs text-devops-400">AI uncovers your hidden success stories</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => setShowTopicInput(!showTopicInput)}
                    className="text-xs bg-devops-700 hover:bg-devops-600 text-white px-3 py-1.5 rounded transition-colors flex items-center gap-1"
                >
                    <MessageSquarePlus className="w-3 h-3" /> Topic
                </button>
                <span className="text-xs bg-devops-900 px-2 py-1 rounded text-devops-400">
                    {questionCount} Questions Asked
                </span>
            </div>
        </div>

        {/* Custom Topic Input Overlay */}
        {showTopicInput && (
            <div className="absolute top-[72px] left-0 right-0 bg-devops-800 p-4 border-b border-devops-700 z-10 flex gap-2 animate-in slide-in-from-top-2">
                <input 
                    className="flex-1 bg-devops-900 border border-devops-600 rounded px-3 py-1.5 text-sm text-white focus:border-purple-500 outline-none"
                    placeholder="E.g., Ask me about my leadership experience..."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                />
                <button 
                    onClick={() => handleNextQuestion(topic)}
                    className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded text-sm font-medium"
                >
                    Ask
                </button>
            </div>
        )}

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6" ref={scrollRef}>
            {history.length === 0 && isLoading && (
                <div className="flex flex-col items-center justify-center h-full text-devops-500 space-y-4">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                    <p>Analyzing your profile gaps...</p>
                </div>
            )}

            {history.map((step, idx) => {
                if (step.type === 'question') {
                    const q = step.content as ProbingQuestion;
                    return (
                        <div key={idx} className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0 mt-1">
                                <Bot className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1">
                                <div className="bg-devops-800 border border-devops-700 rounded-2xl rounded-tl-none p-5 shadow-lg">
                                    <h4 className="text-purple-400 text-xs font-bold uppercase tracking-wide mb-2 flex items-center gap-2">
                                        <Target className="w-3 h-3" /> Targeted Skill: {q.targetSkill}
                                    </h4>
                                    <p className="text-white text-lg font-medium mb-3">{q.question}</p>
                                    <p className="text-devops-400 text-sm italic bg-devops-900/50 p-2 rounded border-l-2 border-purple-500/50">
                                        "I'm asking this because {q.reasoning}"
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                }
                
                if (step.type === 'answer') {
                    return (
                        <div key={idx} className="flex gap-4 flex-row-reverse">
                            <div className="w-8 h-8 rounded-full bg-devops-700 flex items-center justify-center flex-shrink-0 mt-1">
                                <User className="w-5 h-5 text-white" />
                            </div>
                            <div className="bg-devops-700 text-white p-4 rounded-2xl rounded-tr-none max-w-[80%] shadow-md">
                                {step.content as string}
                            </div>
                        </div>
                    );
                }

                if (step.type === 'proposal') {
                    const proposal = step.content as GeneratedAchievement;
                    return (
                        <div key={idx} className="flex gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                             <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0 mt-1">
                                <CheckCircle className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1">
                                <div className="bg-green-900/10 border border-green-500/30 rounded-xl p-5 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
                                    <h4 className="text-green-400 text-sm font-bold mb-3 flex items-center gap-2">
                                        Enhanced Bullet Point Generated
                                    </h4>
                                    <div className="bg-devops-900/80 p-4 rounded-lg border border-devops-600 mb-4">
                                        <p className="text-white font-mono text-sm leading-relaxed">
                                            {proposal.improvedBullet}
                                        </p>
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-devops-400">
                                            Suggestion: Add to {proposal.suggestedSection} {proposal.relatedId ? '(Matched Role)' : ''}
                                        </span>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => handleNextQuestion()}
                                                className="px-4 py-2 text-xs font-medium text-devops-400 hover:text-white transition-colors"
                                            >
                                                Skip / Next Question
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    handleAccept(proposal);
                                                    handleNextQuestion();
                                                }}
                                                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg hover:scale-105"
                                            >
                                                <PlusCircle className="w-4 h-4" /> Add to Resume
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                }
                return null;
            })}
             {isLoading && (
                <div className="flex items-center gap-3 text-devops-500 pl-12 animate-pulse">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Processing...</span>
                </div>
            )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-devops-800 border-t border-devops-700">
             <div className="relative">
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                    placeholder="Type your answer here..."
                    className="w-full bg-devops-900 border border-devops-600 rounded-xl pl-4 pr-12 py-3 text-white focus:outline-none focus:border-purple-500 resize-none h-14"
                    disabled={isLoading}
                />
                <button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="absolute right-2 top-2 p-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <Send className="w-4 h-4" />
                </button>
            </div>
            <p className="text-[10px] text-devops-500 mt-2 text-center">
                Answer casually. AI will format it professionally.
            </p>
        </div>
    </div>
  );
};

export default DeepDiveProber;