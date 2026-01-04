import React, { useState, useRef, useEffect } from 'react';
import { ResumeData } from '../types';
import { updateResumeWithAI } from '../services/geminiService';
import { MessageCircle, X, Send, Sparkles, User, Bot, Loader2 } from 'lucide-react';

interface AIChatAssistantProps {
  resume: ResumeData;
  onUpdate: (updatedResume: ResumeData) => void;
}

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
}

const AIChatAssistant: React.FC<AIChatAssistantProps> = ({ resume, onUpdate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'ai', content: "Hi! I'm your Resume Copilot. Tell me how you'd like to improve your resume (e.g., 'Make the summary more punchy', 'Add Python to skills', 'Fix typos')." }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

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
      
      const aiMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        role: 'ai', 
        content: "I've updated your resume based on your request! Check the changes in the editor or preview." 
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      const errorMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        role: 'ai', 
        content: "Sorry, I encountered an issue updating the resume. Please try again." 
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 p-4 bg-accent-600 hover:bg-accent-500 text-white rounded-full shadow-2xl hover:scale-105 transition-all animate-bounce-slow print:hidden"
        title="Open AI Assistant"
      >
        <Sparkles className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 md:w-96 bg-devops-900 border border-devops-700 rounded-2xl shadow-2xl flex flex-col max-h-[600px] h-[500px] print:hidden">
      {/* Header */}
      <div className="p-4 border-b border-devops-700 bg-devops-800 rounded-t-2xl flex justify-between items-center">
        <div className="flex items-center gap-2 text-white font-semibold">
          <Sparkles className="w-5 h-5 text-accent-500" />
          <h3>Resume Copilot</h3>
        </div>
        <button 
          onClick={() => setIsOpen(false)}
          className="text-devops-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'ai' ? 'bg-accent-600' : 'bg-devops-700'}`}>
              {msg.role === 'ai' ? <Bot className="w-4 h-4 text-white" /> : <User className="w-4 h-4 text-white" />}
            </div>
            <div className={`p-3 rounded-lg text-sm max-w-[80%] ${
              msg.role === 'user' 
                ? 'bg-devops-700 text-white rounded-tr-none' 
                : 'bg-devops-800 border border-devops-700 text-devops-100 rounded-tl-none'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-devops-400 text-xs pl-12">
            <Loader2 className="w-3 h-3 animate-spin" /> Thinking & Updating...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-devops-700 bg-devops-800 rounded-b-2xl">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type instructions..."
            className="flex-1 bg-devops-900 border border-devops-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-2 bg-accent-600 hover:bg-accent-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default AIChatAssistant;