
import React, { useState, useRef, useEffect } from 'react';
import { ResumeData } from '../types';
import { updateResumeWithAI } from '../services/geminiService';
import { X, Send, Sparkles, User, Bot, Loader2, ChevronDown } from 'lucide-react';

interface AIChatAssistantProps {
  resume: ResumeData;
  onUpdate: (updatedResume: ResumeData) => void;
  mode?: 'widget' | 'embedded';
}

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
}

const AIChatAssistant: React.FC<AIChatAssistantProps> = ({ resume, onUpdate, mode = 'widget' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'ai', content: "I'm online. Ready to optimize your resume. What's the objective?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const updatedResume = await updateResumeWithAI(resume, userMsg.content);
      onUpdate(updatedResume);
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'ai', content: "Executed. Resume updated based on your command." }]);
    } catch (error) {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'ai', content: "Error executing command. Please retry." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const ChatWindow = () => (
      <div className={`flex flex-col bg-devops-950/90 backdrop-blur-xl border border-devops-700 shadow-2xl overflow-hidden ${mode === 'widget' ? 'w-80 md:w-96 h-[500px] rounded-2xl' : 'h-full rounded-none border-0'}`}>
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-devops-900 to-devops-800 border-b border-devops-700 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                  <div className="relative">
                      <div className="w-2 h-2 bg-green-500 rounded-full absolute bottom-0 right-0 border border-devops-900"></div>
                      <div className="w-8 h-8 bg-devops-700 rounded-full flex items-center justify-center border border-devops-600">
                          <Bot className="w-4 h-4 text-white" />
                      </div>
                  </div>
                  <div>
                      <h3 className="text-sm font-bold text-white">Resume Copilot</h3>
                      <p className="text-[10px] text-devops-400 font-mono">v2.5.0 connected</p>
                  </div>
              </div>
              {mode === 'widget' && (
                  <button onClick={() => setIsOpen(false)} className="text-devops-400 hover:text-white p-1 rounded-lg hover:bg-devops-700/50">
                      <ChevronDown className="w-5 h-5" />
                  </button>
              )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {messages.map((msg) => (
                  <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-in slide-in-from-bottom-2`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-1 ${msg.role === 'ai' ? 'bg-transparent' : 'bg-devops-700'}`}>
                          {msg.role === 'ai' ? <Sparkles className="w-4 h-4 text-purple-400" /> : <User className="w-3 h-3 text-white" />}
                      </div>
                      <div className={`p-3 rounded-2xl max-w-[85%] text-xs leading-relaxed ${
                          msg.role === 'ai' 
                          ? 'bg-devops-800/50 border border-devops-700 text-devops-200 rounded-tl-none' 
                          : 'bg-blue-600 text-white shadow-lg rounded-tr-none'
                      }`}>
                          {msg.content}
                      </div>
                  </div>
              ))}
              {isLoading && (
                  <div className="flex gap-3 animate-pulse">
                      <div className="w-6 h-6 flex items-center justify-center"><Sparkles className="w-4 h-4 text-purple-400"/></div>
                      <div className="bg-devops-800/50 rounded-2xl rounded-tl-none p-3 border border-devops-700">
                          <div className="flex gap-1">
                              <div className="w-1.5 h-1.5 bg-devops-500 rounded-full animate-bounce"></div>
                              <div className="w-1.5 h-1.5 bg-devops-500 rounded-full animate-bounce delay-75"></div>
                              <div className="w-1.5 h-1.5 bg-devops-500 rounded-full animate-bounce delay-150"></div>
                          </div>
                      </div>
                  </div>
              )}
              <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-3 bg-devops-900 border-t border-devops-700 shrink-0">
              <div className="relative">
                  <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Instruct AI..."
                      className="w-full bg-devops-950 border border-devops-700 rounded-xl pl-4 pr-10 py-3 text-xs text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all shadow-inner"
                      disabled={isLoading}
                  />
                  <button type="submit" disabled={!input.trim() || isLoading} className="absolute right-2 top-2 p-1.5 bg-devops-800 hover:bg-purple-600 text-devops-400 hover:text-white rounded-lg transition-all disabled:opacity-0">
                      <Send className="w-4 h-4" />
                  </button>
              </div>
          </form>
      </div>
  );

  if (mode === 'widget') {
      return (
          <>
            {isOpen ? (
                <div className="fixed bottom-24 right-6 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
                    <ChatWindow />
                </div>
            ) : (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-slate-900 rounded-full shadow-2xl flex items-center justify-center group hover:scale-110 transition-transform duration-300 border border-slate-700"
                >
                    <div className="absolute inset-0 bg-purple-600 rounded-full opacity-0 group-hover:opacity-20 animate-ping"></div>
                    <Sparkles className="w-6 h-6 text-white group-hover:rotate-12 transition-transform" />
                </button>
            )}
          </>
      );
  }

  return <ChatWindow />;
};

export default AIChatAssistant;
