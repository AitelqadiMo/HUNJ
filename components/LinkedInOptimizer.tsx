import React, { useState } from 'react';
import { ResumeData, LinkedInProfile } from '../types';
import { generateLinkedInProfile } from '../services/geminiService';
import { Linkedin, Copy, Check, Loader2, Sparkles, User, Briefcase, Award } from 'lucide-react';

interface LinkedInOptimizerProps {
  resume: ResumeData;
  profile: LinkedInProfile | null | undefined;
  onUpdate: (profile: LinkedInProfile) => void;
}

const LinkedInOptimizer: React.FC<LinkedInOptimizerProps> = ({ resume, profile, onUpdate }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
        const result = await generateLinkedInProfile(resume);
        onUpdate(result);
    } catch (e) {
        console.error(e);
    } finally {
        setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  if (!profile) {
      return (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-devops-900/50 rounded-xl border border-devops-700">
              <div className="w-20 h-20 bg-[#0077b5]/10 rounded-full flex items-center justify-center mb-6">
                  <Linkedin className="w-10 h-10 text-[#0077b5]" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">LinkedIn Profile Optimizer</h2>
              <p className="text-devops-400 max-w-md mx-auto mb-8">
                  Transform your resume into a high-impact LinkedIn profile. We'll generate a catchy headline, engaging about section, and optimize your skills for the algorithm.
              </p>
              <button 
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="px-6 py-3 bg-[#0077b5] hover:bg-[#006097] text-white rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all hover:scale-105"
              >
                  {isGenerating ? <Loader2 className="w-5 h-5 animate-spin"/> : <Sparkles className="w-5 h-5" />}
                  Generate Profile
              </button>
          </div>
      );
  }

  return (
    <div className="h-full overflow-y-auto pr-2">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Linkedin className="w-6 h-6 text-[#0077b5]" />
                Optimized Profile
            </h2>
            <button 
                onClick={handleGenerate}
                disabled={isGenerating}
                className="text-xs text-[#0077b5] hover:text-white border border-[#0077b5] hover:bg-[#0077b5] px-3 py-1.5 rounded transition-colors"
            >
                {isGenerating ? 'Regenerating...' : 'Regenerate'}
            </button>
        </div>

        <div className="space-y-6">
            {/* Headline Section */}
            <div className="bg-devops-800 rounded-xl border border-devops-700 p-6 relative group">
                <div className="flex items-center gap-2 mb-3 text-[#0077b5]">
                    <User className="w-4 h-4" />
                    <h3 className="font-bold text-sm uppercase tracking-wide">Headline</h3>
                </div>
                <p className="text-lg font-medium text-white pr-8">{profile.headline}</p>
                <button 
                    onClick={() => copyToClipboard(profile.headline, 'headline')}
                    className="absolute top-4 right-4 p-2 text-devops-400 hover:text-white bg-devops-700/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Copy"
                >
                    {copiedSection === 'headline' ? <Check className="w-4 h-4 text-success"/> : <Copy className="w-4 h-4"/>}
                </button>
                <p className="text-xs text-devops-500 mt-2">
                    {profile.headline.length} / 220 characters
                </p>
            </div>

            {/* About Section */}
            <div className="bg-devops-800 rounded-xl border border-devops-700 p-6 relative group">
                <div className="flex items-center gap-2 mb-3 text-[#0077b5]">
                    <FileTextIcon className="w-4 h-4" />
                    <h3 className="font-bold text-sm uppercase tracking-wide">About Section</h3>
                </div>
                <div className="text-sm text-devops-100 leading-relaxed whitespace-pre-wrap pr-4 font-serif">
                    {profile.about}
                </div>
                <button 
                    onClick={() => copyToClipboard(profile.about, 'about')}
                    className="absolute top-4 right-4 p-2 text-devops-400 hover:text-white bg-devops-700/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Copy"
                >
                    {copiedSection === 'about' ? <Check className="w-4 h-4 text-success"/> : <Copy className="w-4 h-4"/>}
                </button>
            </div>

            {/* Experience Hooks */}
            <div className="bg-devops-800 rounded-xl border border-devops-700 p-6 relative group">
                <div className="flex items-center gap-2 mb-3 text-[#0077b5]">
                    <Briefcase className="w-4 h-4" />
                    <h3 className="font-bold text-sm uppercase tracking-wide">Experience Hooks</h3>
                </div>
                <div className="space-y-3">
                    {profile.experienceHooks.map((hook, i) => (
                        <div key={i} className="flex gap-3 text-sm text-devops-200">
                            <span className="text-[#0077b5] font-bold">•</span>
                            <span>{hook}</span>
                        </div>
                    ))}
                </div>
                 <button 
                    onClick={() => copyToClipboard(profile.experienceHooks.join('\n'), 'hooks')}
                    className="absolute top-4 right-4 p-2 text-devops-400 hover:text-white bg-devops-700/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Copy All"
                >
                    {copiedSection === 'hooks' ? <Check className="w-4 h-4 text-success"/> : <Copy className="w-4 h-4"/>}
                </button>
            </div>

            {/* Skills */}
            <div className="bg-devops-800 rounded-xl border border-devops-700 p-6 relative group">
                <div className="flex items-center gap-2 mb-3 text-[#0077b5]">
                    <Award className="w-4 h-4" />
                    <h3 className="font-bold text-sm uppercase tracking-wide">Top Skills</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                    {profile.featuredSkills.map((skill, i) => (
                        <span key={i} className="px-3 py-1 bg-[#0077b5]/10 text-[#0077b5] border border-[#0077b5]/30 rounded-full text-sm font-medium">
                            {skill}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
};

// Icon helper
const FileTextIcon = (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>
)

export default LinkedInOptimizer;