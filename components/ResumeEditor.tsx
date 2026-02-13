
import React, { useState, useEffect, useRef } from 'react';
import { ResumeData, JobAnalysis, ExperienceItem, CertificationItem } from '../types';
import { getInlineSuggestion, updateResumeWithAI } from '../services/geminiService';
import useHistory from '../hooks/useHistory';
import { Wand2, Undo2, Redo2, Sparkles, Check, X, Plus, Trash2, Link as LinkIcon, Briefcase, GraduationCap, Trophy, ChevronDown, ChevronUp, Loader2, Zap, Tag, Globe, Award, Medal, BookOpen } from 'lucide-react';

interface ResumeEditorProps {
  resume: ResumeData;
  job: JobAnalysis | null;
  onUpdate: (updatedResume: ResumeData) => void;
}

const ResumeEditor: React.FC<ResumeEditorProps> = ({ resume, job, onUpdate }) => {
  const { state: localResume, set: setLocalResume, undo, redo, canUndo, canRedo, reset } = useHistory<ResumeData>(resume);
  const [improvingFieldId, setImprovingFieldId] = useState<string | null>(null);
  
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if(resume.id !== localResume.id || resume.versionName !== localResume.versionName) reset(resume);
  }, [resume.id, resume.versionName]);

  useEffect(() => {
      const handler = setTimeout(() => { if (localResume !== resume) onUpdate(localResume); }, 800);
      return () => clearTimeout(handler);
  }, [localResume]);

  const handleChange = (field: keyof ResumeData, value: any) => {
    setLocalResume({ ...localResume, [field]: value });
  };

  // --- AI MAGIC HANDLER ---
  const handleSmartImprove = async (text: string, context: string, onApply: (newText: string) => void) => {
      if (!text.trim()) return;
      setImprovingFieldId(context); 
      try {
          const result = await getInlineSuggestion(text, "Professional Resume Bullet Point");
          if(result && result.suggestion) onApply(result.suggestion);
      } catch (e) {
          console.error("AI Improve failed", e);
      } finally {
          setImprovingFieldId(null);
      }
  };

  // --- ARRAY HANDLERS ---
  const handleAddItem = (section: keyof ResumeData, item: any) => {
      handleChange(section, [...(localResume[section] as any[] || []), item]);
  };
  const handleRemoveItem = (section: keyof ResumeData, index: number) => {
      handleChange(section, (localResume[section] as any[] || []).filter((_, i) => i !== index));
  };
  const handleUpdateItem = (section: keyof ResumeData, index: number, field: string, value: any) => {
      const updated = (localResume[section] as any[]).map((item, i) => i === index ? { ...item, [field]: value } : item);
      handleChange(section, updated);
  };
  
  const addExperience = () => handleAddItem('experience', { id: `exp-${Date.now()}`, role: 'Role Title', company: 'Company Name', period: 'Jan 2023 - Present', bullets: [{id: `b-${Date.now()}`, text: 'Describe your impact...', visible: true}], visible: true });
  const addProject = () => handleAddItem('projects', { id: `p-${Date.now()}`, name: 'Project Name', description: 'What did you build?', link: '', visible: true });
  const addCertification = () => handleAddItem('certifications', { id: `cert-${Date.now()}`, name: 'Certification Name', issuer: 'Issuer', date: 'Year', visible: true });
  
  // Helper to calculate simple impact score for visual bar
  const calculateImpact = (text: string) => {
      const hasMetrics = /\d+%|\$\d+|\d+x/.test(text);
      const length = text.length;
      if (length < 20) return 10;
      if (!hasMetrics) return 40;
      return Math.min(100, 60 + (length > 100 ? 20 : 0) + (text.match(/\d/g)?.length || 0) * 2);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full relative" ref={editorRef}>
      
      {/* --- TOOLBAR --- */}
      <div className="bg-white px-6 py-3 border-b border-slate-200 flex justify-between items-center sticky top-0 z-20 backdrop-blur-sm bg-white/90">
        <div className="flex items-center gap-4">
           <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2 uppercase">
               <Briefcase className="w-4 h-4 text-hunj-600" /> Editor
           </h2>
           <div className="h-4 w-px bg-slate-200"></div>
           <div className="flex items-center gap-1 bg-slate-50 rounded-lg p-0.5 border border-slate-200">
               <button onClick={undo} disabled={!canUndo} className="p-1.5 rounded-md hover:bg-white hover:shadow-sm disabled:opacity-30 text-slate-500 hover:text-slate-900 transition-all"><Undo2 className="w-3.5 h-3.5" /></button>
               <button onClick={redo} disabled={!canRedo} className="p-1.5 rounded-md hover:bg-white hover:shadow-sm disabled:opacity-30 text-slate-500 hover:text-slate-900 transition-all"><Redo2 className="w-3.5 h-3.5" /></button>
           </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            {job ? `Target: ${job.company}` : 'Master Profile'}
        </div>
      </div>

      {/* --- SCROLLABLE CONTENT --- */}
      <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar bg-slate-50/50">
        
        {/* Personal Info - Collapsed Style */}
        <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm group focus-within:border-hunj-500/50 transition-colors">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                Header Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InputGroup label="Full Name" value={localResume.fullName} onChange={(v) => handleChange('fullName', v)} />
                <InputGroup label="Current Role" value={localResume.role} onChange={(v) => handleChange('role', v)} />
                <InputGroup label="Location" value={localResume.location} onChange={(v) => handleChange('location', v)} />
                <div className="md:col-span-3 grid grid-cols-3 gap-4">
                    <InputGroup label="Email" value={localResume.email} onChange={(v) => handleChange('email', v)} />
                    <InputGroup label="Phone" value={localResume.phone} onChange={(v) => handleChange('phone', v)} />
                    <InputGroup label="LinkedIn" value={localResume.linkedin} onChange={(v) => handleChange('linkedin', v)} />
                </div>
            </div>
        </section>

        {/* Summary */}
        <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm focus-within:border-hunj-500/50 transition-colors relative group">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    Professional Summary
                </h3>
                <button 
                    onClick={() => handleSmartImprove(localResume.summary, 'summary', (v) => handleChange('summary', v))}
                    disabled={improvingFieldId === 'summary'}
                    className="text-[10px] font-bold text-hunj-600 bg-hunj-50 px-2 py-1 rounded flex items-center gap-1.5 hover:bg-hunj-100 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                >
                    {improvingFieldId === 'summary' ? <Loader2 className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3"/>}
                    Enhance
                </button>
             </div>
             <textarea 
                className="w-full h-28 bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-700 focus:ring-2 focus:ring-hunj-500/20 focus:border-hunj-500 outline-none transition-all leading-relaxed resize-none placeholder-slate-400"
                value={localResume.summary}
                onChange={(e) => handleChange('summary', e.target.value)}
                placeholder="Briefly describe your experience and career goals..."
             />
        </section>

        {/* Experience */}
        <section className="space-y-4">
            <div className="flex justify-between items-center px-1">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    Experience
                </h3>
                <button onClick={addExperience} className="text-[10px] font-bold text-hunj-600 hover:bg-hunj-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 border border-transparent hover:border-hunj-100"><Plus className="w-3 h-3"/> Add Role</button>
            </div>
            {localResume.experience.map((exp, idx) => (
                <div key={exp.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all relative group">
                    <button onClick={() => handleRemoveItem('experience', idx)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-4 h-4"/></button>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 pr-10">
                        <InputGroup label="Job Title" value={exp.role} onChange={(v) => handleUpdateItem('experience', idx, 'role', v)} bold />
                        <InputGroup label="Company" value={exp.company} onChange={(v) => handleUpdateItem('experience', idx, 'company', v)} />
                        <InputGroup label="Dates" value={exp.period} onChange={(v) => handleUpdateItem('experience', idx, 'period', v)} />
                    </div>

                    <div className="space-y-3 pl-4 border-l-2 border-slate-100">
                        {exp.bullets.map((bullet, bIdx) => {
                            const impact = calculateImpact(bullet.text);
                            const impactColor = impact > 70 ? 'bg-green-500' : impact > 40 ? 'bg-yellow-500' : 'bg-slate-300';
                            
                            return (
                                <div key={bullet.id} className="relative group/bullet">
                                    <div className="absolute left-[-22px] top-3 w-1.5 h-1.5 rounded-full bg-slate-300 group-hover/bullet:bg-hunj-400 transition-colors"></div>
                                    <textarea 
                                        className="w-full bg-transparent text-sm text-slate-700 leading-relaxed resize-none overflow-hidden focus:bg-slate-50 rounded p-2 outline-none focus:ring-1 focus:ring-hunj-500/30 transition-all border border-transparent focus:border-slate-200"
                                        rows={Math.max(1, Math.ceil(bullet.text.length / 90))}
                                        value={bullet.text}
                                        onChange={(e) => {
                                            const newBullets = [...exp.bullets];
                                            newBullets[bIdx] = { ...bullet, text: e.target.value };
                                            handleUpdateItem('experience', idx, 'bullets', newBullets);
                                        }}
                                    />
                                    
                                    {/* Smart Bullet Controls */}
                                    <div className="flex items-center gap-2 mt-1 opacity-0 group-hover/bullet:opacity-100 transition-opacity pl-2">
                                        {/* Impact Bar */}
                                        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5" title="Impact Score">
                                            <Zap className="w-3 h-3 text-slate-400" />
                                            <div className="w-10 h-1 bg-slate-200 rounded-full overflow-hidden">
                                                <div className={`h-full ${impactColor}`} style={{width: `${impact}%`}}></div>
                                            </div>
                                        </div>

                                        <div className="flex-1"></div>

                                        <button 
                                            onClick={() => handleSmartImprove(bullet.text, bullet.id, (v) => {
                                                const newBullets = [...exp.bullets];
                                                newBullets[bIdx] = { ...bullet, text: v };
                                                handleUpdateItem('experience', idx, 'bullets', newBullets);
                                            })}
                                            disabled={improvingFieldId === bullet.id}
                                            className="text-[10px] font-bold text-hunj-600 hover:bg-hunj-50 px-2 py-1 rounded flex items-center gap-1"
                                        >
                                            {improvingFieldId === bullet.id ? <Loader2 className="w-3 h-3 animate-spin"/> : <Wand2 className="w-3 h-3"/>}
                                            Improve
                                        </button>
                                        <button 
                                            onClick={() => {
                                                const newBullets = exp.bullets.filter((_, i) => i !== bIdx);
                                                handleUpdateItem('experience', idx, 'bullets', newBullets);
                                            }}
                                            className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                        <button 
                            onClick={() => {
                                const newBullets = [...exp.bullets, { id: `b-${Date.now()}`, text: '', visible: true }];
                                handleUpdateItem('experience', idx, 'bullets', newBullets);
                            }}
                            className="text-[10px] font-bold text-slate-400 hover:text-hunj-600 mt-2 px-2 flex items-center gap-1 transition-colors"
                        >
                            <Plus className="w-3 h-3" /> Add Achievement
                        </button>
                    </div>
                </div>
            ))}
        </section>

        {/* Projects */}
        <section className="space-y-4">
            <div className="flex justify-between items-center px-1">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    Projects
                </h3>
                <button onClick={addProject} className="text-[10px] font-bold text-hunj-600 hover:bg-hunj-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 border border-transparent hover:border-hunj-100"><Plus className="w-3 h-3"/> Add</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {localResume.projects.map((proj, idx) => (
                    <div key={proj.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all relative group">
                        <button onClick={() => handleRemoveItem('projects', idx)} className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3"/></button>
                        <div className="space-y-3">
                            <input className="w-full font-bold text-slate-900 border-b border-transparent hover:border-slate-200 focus:border-hunj-500 focus:outline-none bg-transparent transition-colors placeholder-slate-400" placeholder="Project Name" value={proj.name} onChange={(e) => handleUpdateItem('projects', idx, 'name', e.target.value)} />
                            <textarea className="w-full text-xs text-slate-600 bg-slate-50 rounded-lg p-2 focus:bg-white focus:ring-1 focus:ring-hunj-500/30 outline-none resize-none border border-slate-100 focus:border-slate-300" rows={3} placeholder="Description..." value={proj.description} onChange={(e) => handleUpdateItem('projects', idx, 'description', e.target.value)} />
                        </div>
                    </div>
                ))}
            </div>
        </section>

        {/* Credentials & Extras */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-8">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                Credentials & Additional Info
            </h3>

            {/* Education */}
            <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><GraduationCap className="w-3 h-3"/> Education</label>
                <textarea 
                    className="w-full h-20 bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-900 focus:ring-2 focus:ring-hunj-500/20 focus:border-hunj-500 outline-none transition-all leading-relaxed resize-none placeholder-slate-400"
                    value={localResume.education}
                    onChange={(e) => handleChange('education', e.target.value)}
                    placeholder="BS Computer Science, University of Technology, 2020"
                />
            </div>

            {/* Certifications */}
            <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><Medal className="w-3 h-3"/> Certifications</label>
                    <button onClick={addCertification} className="text-[10px] text-hunj-600 font-bold hover:bg-hunj-50 px-2 py-1 rounded border border-transparent hover:border-hunj-100">+ Add</button>
                </div>
                {localResume.certifications.map((cert, idx) => (
                    <div key={cert.id} className="flex gap-2 items-center bg-slate-50 p-2 rounded-lg border border-slate-100 group relative">
                        <input className="bg-transparent text-xs font-bold w-1/3 outline-none border-b border-transparent focus:border-slate-300" placeholder="Name" value={cert.name} onChange={(e) => handleUpdateItem('certifications', idx, 'name', e.target.value)} />
                        <input className="bg-transparent text-xs text-slate-600 w-1/3 outline-none border-b border-transparent focus:border-slate-300" placeholder="Issuer" value={cert.issuer} onChange={(e) => handleUpdateItem('certifications', idx, 'issuer', e.target.value)} />
                        <input className="bg-transparent text-xs text-slate-500 w-1/4 outline-none border-b border-transparent focus:border-slate-300" placeholder="Date" value={cert.date} onChange={(e) => handleUpdateItem('certifications', idx, 'date', e.target.value)} />
                        <button onClick={() => handleRemoveItem('certifications', idx)} className="ml-auto text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3"/></button>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Skills */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><Zap className="w-3 h-3"/> Skills</label>
                        <button onClick={() => handleAddItem('skills', 'New Skill')} className="text-[10px] text-hunj-600 font-bold hover:bg-hunj-50 px-2 py-1 rounded border border-transparent hover:border-hunj-100">+ Add</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {localResume.skills.map((skill, i) => (
                            <SimpleTag 
                                key={i} 
                                text={skill} 
                                onChange={(v) => {
                                    const newSkills = [...localResume.skills];
                                    newSkills[i] = v;
                                    handleChange('skills', newSkills);
                                }}
                                onDelete={() => handleRemoveItem('skills', i)}
                            />
                        ))}
                    </div>
                </div>

                {/* Languages */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><Globe className="w-3 h-3"/> Languages</label>
                        <button onClick={() => handleAddItem('languages', 'New Language')} className="text-[10px] text-hunj-600 font-bold hover:bg-hunj-50 px-2 py-1 rounded border border-transparent hover:border-hunj-100">+ Add</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {localResume.languages.map((lang, i) => (
                            <SimpleTag 
                                key={i} 
                                text={lang} 
                                onChange={(v) => {
                                    const newLangs = [...localResume.languages];
                                    newLangs[i] = v;
                                    handleChange('languages', newLangs);
                                }}
                                onDelete={() => handleRemoveItem('languages', i)}
                            />
                        ))}
                    </div>
                </div>

                {/* Awards */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><Award className="w-3 h-3"/> Awards</label>
                        <button onClick={() => handleAddItem('awards', 'New Award')} className="text-[10px] text-hunj-600 font-bold hover:bg-hunj-50 px-2 py-1 rounded border border-transparent hover:border-hunj-100">+ Add</button>
                    </div>
                    <div className="flex flex-col gap-2">
                        {localResume.awards && localResume.awards.map((award, i) => (
                            <SimpleInputRow 
                                key={i} 
                                text={award} 
                                onChange={(v) => {
                                    const newAwards = [...(localResume.awards || [])];
                                    newAwards[i] = v;
                                    handleChange('awards', newAwards);
                                }}
                                onDelete={() => {
                                    const newAwards = (localResume.awards || []).filter((_, idx) => idx !== i);
                                    handleChange('awards', newAwards);
                                }}
                            />
                        ))}
                    </div>
                </div>

                {/* Hobbies / Interests */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><BookOpen className="w-3 h-3"/> Hobbies / Interests</label>
                        <button onClick={() => handleAddItem('interests', 'New Interest')} className="text-[10px] text-hunj-600 font-bold hover:bg-hunj-50 px-2 py-1 rounded border border-transparent hover:border-hunj-100">+ Add</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {localResume.interests.map((interest, i) => (
                            <SimpleTag 
                                key={i} 
                                text={interest} 
                                onChange={(v) => {
                                    const newInterests = [...localResume.interests];
                                    newInterests[i] = v;
                                    handleChange('interests', newInterests);
                                }}
                                onDelete={() => handleRemoveItem('interests', i)}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

// UI Helpers
interface InputGroupProps {
    label: string;
    value: string;
    onChange: (v: string) => void;
    bold?: boolean;
}

const InputGroup: React.FC<InputGroupProps> = ({ label, value, onChange, bold }) => (
    <div className="space-y-1">
        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{label}</label>
        <input 
            className={`w-full bg-slate-50 border-b border-slate-200 focus:border-hunj-500 rounded-t-lg px-3 py-2 outline-none transition-all text-sm text-slate-900 focus:bg-white ${bold ? 'font-bold' : ''}`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
        />
    </div>
);

interface SimpleTagProps {
    text: string;
    onChange: (v: string) => void;
    onDelete: () => void;
}

const SimpleTag: React.FC<SimpleTagProps> = ({ text, onChange, onDelete }) => (
    <div className="flex items-center bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 transition-colors group">
        <Tag className="w-3 h-3 text-slate-400 mr-1.5" />
        <input 
            className="bg-transparent text-xs font-bold text-slate-700 w-auto min-w-[60px] max-w-[150px] outline-none" 
            value={text} 
            onChange={(e) => onChange(e.target.value)}
        />
        <button onClick={onDelete} className="ml-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3"/></button>
    </div>
);

interface SimpleInputRowProps {
    text: string;
    onChange: (v: string) => void;
    onDelete: () => void;
}

const SimpleInputRow: React.FC<SimpleInputRowProps> = ({ text, onChange, onDelete }) => (
    <div className="flex items-center bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 transition-colors group">
        <input 
            className="bg-transparent text-xs text-slate-700 w-full outline-none" 
            value={text} 
            onChange={(e) => onChange(e.target.value)}
        />
        <button onClick={onDelete} className="ml-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3"/></button>
    </div>
);

export default ResumeEditor;
