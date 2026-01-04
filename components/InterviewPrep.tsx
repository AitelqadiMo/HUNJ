import React, { useState, useRef, useEffect } from 'react';
import { JobAnalysis, InterviewMessage } from '../types';
import { getInterviewQuestion, evaluateInterviewAnswer } from '../services/geminiService';
import { Send, Bot, User, Star, ThumbsUp, Lightbulb, RefreshCw, MessageSquare } from 'lucide-react';

interface InterviewPrepProps {
  job: JobAnalysis;
  session: InterviewMessage[] | undefined;
  onUpdateSession: (session: InterviewMessage[]) => void;
}

const InterviewPrep: React.FC<InterviewPrepProps> = ({ job, session = [], onUpdateSession }) => {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [session]);

  const startTextSession = async () => {
    setIsProcessing(true);
    try {
        const question = await getInterviewQuestion(job, []);
        const newSession: InterviewMessage[] = [{
            id: Date.now().toString(),
            role: 'ai',
            content: question
        }];
        onUpdateSession(newSession);
    } finally {
        setIsProcessing(false);
    }
  };

  const handleTextAnswer = async () => {
    if (!input.trim() || isProcessing) return;

    const userMsg: InterviewMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: input
    };
    
    const updatedSession = [...session, userMsg];
    onUpdateSession(updatedSession);
    setInput('');
    setIsProcessing(true);

    try {
        const lastQuestion = session[session.length - 1].content;
        const feedback = await evaluateInterviewAnswer(lastQuestion, userMsg.content);
        
        updatedSession[updatedSession.length - 1].feedback = feedback;
        onUpdateSession([...updatedSession]);

        const previousQuestions = session.filter(m => m.role === 'ai').map(m => m.content);
        const nextQuestion = await getInterviewQuestion(job, previousQuestions);
        
        onUpdateSession([...updatedSession, {
            id: (Date.now() + 1).toString(),
            role: 'ai',
            content: nextQuestion
        }]);

    } catch (e) {
        console.error(e);
    } finally {
        setIsProcessing(false);
    }
  };

  if (session.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-6">
            <div className="w-24 h-24 bg-devops-800 rounded-full flex items-center justify-center border-4 border-devops-700 relative">
                <Bot className="w-12 h-12 text-accent-500" />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-white mb-2">AI Mock Interview</h2>
                <p className="text-devops-400 max-w-md mx-auto">
                    Practice for the <span className="text-white font-medium">{job.title}</span> role at <span className="text-white font-medium">{job.company}</span>.
                </p>
            </div>
            
            <button 
                onClick={startTextSession}
                disabled={isProcessing}
                className="px-6 py-3 bg-accent-600 hover:bg-accent-500 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-accent-600/20 transition-all hover:scale-105"
            >
                <MessageSquare className="w-5 h-5" />
                Start Interview
            </button>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-devops-900 rounded-xl overflow-hidden border border-devops-700 relative">
        {/* Header */}
        <div className="p-4 border-b border-devops-700 bg-devops-800 flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent-600 rounded-full flex items-center justify-center">
                    <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h3 className="font-bold text-white">Interviewer AI</h3>
                    <p className="text-xs text-devops-400">Simulating {job.company} Interview</p>
                </div>
            </div>
            <button 
                onClick={() => onUpdateSession([])}
                className="text-xs text-devops-400 hover:text-white flex items-center gap-1 px-2"
            >
                <RefreshCw className="w-3 h-3" /> Reset
            </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6" ref={scrollRef}>
            {session.map((msg, idx) => (
                <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    {/* Message Bubble */}
                    <div className={`max-w-[85%] rounded-2xl p-4 ${
                        msg.role === 'user' 
                        ? 'bg-devops-700 text-white rounded-br-none' 
                        : 'bg-devops-800 border border-devops-700 text-devops-100 rounded-bl-none'
                    }`}>
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>

                    {/* Feedback Card */}
                    {msg.feedback && (
                        <div className="mt-4 max-w-[85%] w-full bg-devops-800/50 border border-accent-500/30 rounded-xl p-4 animate-fadeIn">
                            <div className="flex items-center justify-between mb-3 border-b border-devops-700 pb-2">
                                <span className="text-xs font-bold text-accent-400 uppercase tracking-wider flex items-center gap-1">
                                    <Star className="w-3 h-3 fill-current" /> AI Analysis
                                </span>
                                <span className={`text-sm font-bold px-2 py-0.5 rounded ${
                                    msg.feedback.rating >= 80 ? 'bg-green-500/20 text-green-400' :
                                    msg.feedback.rating >= 60 ? 'bg-yellow-500/20 text-yellow-400' :
                                    'bg-red-500/20 text-red-400'
                                }`}>
                                    Score: {msg.feedback.rating}/100
                                </span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <h4 className="text-xs font-semibold text-green-400 mb-1 flex items-center gap-1"><ThumbsUp className="w-3 h-3"/> Strengths</h4>
                                    <ul className="text-xs text-devops-300 list-disc ml-4 space-y-1">
                                        {msg.feedback.strengths.map((s, i) => <li key={i}>{s}</li>)}
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="text-xs font-semibold text-orange-400 mb-1 flex items-center gap-1"><Lightbulb className="w-3 h-3"/> Improvements</h4>
                                    <ul className="text-xs text-devops-300 list-disc ml-4 space-y-1">
                                        {msg.feedback.improvements.map((s, i) => <li key={i}>{s}</li>)}
                                    </ul>
                                </div>
                            </div>

                            <div className="bg-devops-900/50 rounded-lg p-3 border border-devops-700/50">
                                <h4 className="text-xs font-semibold text-devops-400 mb-2 uppercase">Gold Standard Answer</h4>
                                <p className="text-xs text-devops-200 italic leading-relaxed">"{msg.feedback.sampleAnswer}"</p>
                            </div>
                        </div>
                    )}
                </div>
            ))}
            {isProcessing && (
                <div className="flex items-center gap-2 text-devops-400 text-sm animate-pulse">
                    <Bot className="w-4 h-4" /> Interviewer is thinking...
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
                            handleTextAnswer();
                        }
                    }}
                    placeholder="Type your answer here... (Use the STAR method)"
                    className="w-full bg-devops-900 border border-devops-600 rounded-xl pl-4 pr-12 py-3 text-white focus:outline-none focus:border-accent-500 resize-none h-14 max-h-32 disabled:opacity-50"
                    disabled={isProcessing}
                />
                <button
                    onClick={handleTextAnswer}
                    disabled={!input.trim() || isProcessing}
                    className="absolute right-2 top-2 p-2 bg-accent-600 hover:bg-accent-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <Send className="w-4 h-4" />
                </button>
            </div>
            <div className="flex justify-between items-center mt-2 px-1">
                <span className="text-[10px] text-devops-500">Press Enter to send • Shift + Enter for new line</span>
            </div>
        </div>
    </div>
  );
};

export default InterviewPrep;