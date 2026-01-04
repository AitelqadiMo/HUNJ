
import React, { useState, useEffect, useRef } from 'react';
import { ResumeData, ResumeThemeConfig, PreviewSuggestion, JobAnalysis } from '../types';
import { generatePreviewSuggestions } from '../services/geminiService';
import { Phone, Mail, MapPin, Globe, Linkedin, Palette, Download, ZoomIn, ZoomOut, Wand2, Sparkles, Loader2, Check, Type, Grid, ExternalLink, Copy, LayoutTemplate, Briefcase, GraduationCap, User, EyeOff, FileText, Bookmark } from 'lucide-react';

// Add declaration for html2pdf
declare var html2pdf: any;

interface ResumePreviewProps {
  resume: ResumeData;
  onThemeUpdate?: (theme: ResumeThemeConfig) => void;
  onApplySuggestion?: (instruction: string) => Promise<void>;
  job?: JobAnalysis | null;
}

const ResumePreview: React.FC<ResumePreviewProps> = ({ resume, onThemeUpdate, onApplySuggestion, job }) => {
  const [showAppearance, setShowAppearance] = useState(false);
  const [scale, setScale] = useState(1); 
  const [suggestions, setSuggestions] = useState<PreviewSuggestion[]>([]);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [applyingSuggestionId, setApplyingSuggestionId] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [canvaCopied, setCanvaCopied] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Responsive Scaling Logic
  useEffect(() => {
      const handleResize = () => {
          if (containerRef.current) {
              const containerWidth = containerRef.current.offsetWidth;
              const targetWidth = 794; // A4 width in pixels at 96 DPI (approx)
              const padding = 32; // Extra padding
              const newScale = Math.min((containerWidth - padding) / targetWidth, 1);
              setScale(newScale);
          }
      };

      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load suggestions when resume or job changes
  useEffect(() => {
      if (job && resume) {
          setIsGeneratingSuggestions(true);
          generatePreviewSuggestions(resume, job)
            .then(setSuggestions)
            .catch(console.error)
            .finally(() => setIsGeneratingSuggestions(false));
      }
  }, [resume.id]);

  const theme: ResumeThemeConfig = resume.themeConfig || {
      template: 'Minimalist', 
      font: 'Inter',
      accentColor: '#334155', 
      fontSize: 'medium',
      spacing: 'normal'
  };

  const updateTheme = (updates: Partial<ResumeThemeConfig>) => {
      if (onThemeUpdate) {
          onThemeUpdate({ ...theme, ...updates });
      }
  };

  const handleDownloadPDF = async () => {
      setIsDownloading(true);
      const element = document.getElementById('resume-preview-content');
      
      if (!element) {
          console.error("Resume content element not found");
          setIsDownloading(false);
          return;
      }

      // Temporarily reset scale for PDF generation
      const wrapper = document.getElementById('resume-preview-scale-wrapper');
      const originalTransform = wrapper?.style.transform;
      if (wrapper) wrapper.style.transform = 'scale(1)';

      const opt = {
        margin: 0,
        filename: `${resume.fullName.replace(/\s+/g, '_')}_Resume.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      try {
        await html2pdf().set(opt).from(element).save();
      } catch (err) {
        console.error("PDF generation failed:", err);
        alert("Download failed. Please try printing to PDF using Ctrl+P.");
      } finally {
        // Restore scale
        if (wrapper) wrapper.style.transform = originalTransform || '';
        setIsDownloading(false);
      }
  };

  const handleCanvaExport = () => {
      const textToCopy = `
NAME: ${resume.fullName}
ROLE: ${resume.role}
CONTACT: ${resume.email} | ${resume.phone} | ${resume.location}
LINKEDIN: ${resume.linkedin}
WEBSITE: ${resume.website}

SUMMARY:
${resume.summary}

EXPERIENCE:
${resume.experience.map(e => `${e.role} | ${e.company}\n${e.period}\n${e.bullets.filter(b=>b.visible !== false).map(b => '• ' + b.text).join('\n')}`).join('\n\n')}

EDUCATION:
${resume.education}

SKILLS:
${resume.skills.join(' • ')}
      `.trim();
      
      navigator.clipboard.writeText(textToCopy);
      setCanvaCopied(true);
      setTimeout(() => setCanvaCopied(false), 3000);
      window.open('https://www.canva.com/resumes/templates/', '_blank');
  };

  const handleMagicFix = async (suggestion: PreviewSuggestion) => {
      if (!onApplySuggestion) return;
      setApplyingSuggestionId(suggestion.id);
      await onApplySuggestion(suggestion.aiInstruction);
      setApplyingSuggestionId(null);
      setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
  };

  const getFontStyle = () => {
      switch(theme.font) {
          case 'Merriweather': return 'font-serif';
          case 'Roboto': return 'font-sans';
          case 'JetBrains Mono': return 'font-mono';
          case 'Lora': return 'font-lora';
          default: return 'font-sans';
      }
  };

  const getSizeClass = (base: string) => {
      if (theme.fontSize === 'small') return `${base} text-xs`;
      if (theme.fontSize === 'large') return `${base} text-base`;
      return `${base} text-sm`;
  };

  const getSpacingClass = () => {
      if (theme.spacing === 'compact') return 'space-y-1';
      if (theme.spacing === 'comfortable') return 'space-y-3';
      return 'space-y-2';
  };

  // --- TEMPLATES ---

  // 1. MODERN (Sidebar)
  const ModernTemplate = () => (
      <div className={`min-h-full bg-white text-slate-800 p-8 flex flex-col ${getFontStyle()}`}>
          <header className="flex justify-between items-start mb-8 pb-6 border-b-2 border-slate-100">
              <div className="flex-1">
                  <h1 className="text-4xl font-bold uppercase tracking-tight leading-none text-slate-900 mb-2" style={{color: theme.accentColor}}>{resume.fullName}</h1>
                  <p className="text-lg text-slate-500 font-medium tracking-wide">{resume.role}</p>
              </div>
              <div className="text-right text-xs text-slate-600 space-y-1">
                  <div className="font-medium">{resume.phone}</div>
                  <div className="font-medium">{resume.email}</div>
                  <div className="font-medium">{resume.location}</div>
                  {resume.linkedin && <div className="text-blue-600 font-medium truncate max-w-[150px]">{resume.linkedin.replace('https://www.', '')}</div>}
              </div>
          </header>
          
          <div className="flex flex-1 gap-8">
              <div className="w-[30%] border-r border-slate-100 pr-6 space-y-8">
                  {resume.educationVisible !== false && (
                      <section>
                          <h3 className="font-bold text-slate-900 uppercase tracking-wider mb-3 text-xs" style={{color: theme.accentColor}}>EDUCATION</h3>
                          <div className={`whitespace-pre-line text-slate-600 ${getSizeClass('')}`}>{resume.education}</div>
                      </section>
                  )}
                  <section>
                      <h3 className="font-bold text-slate-900 uppercase tracking-wider mb-3 text-xs" style={{color: theme.accentColor}}>SKILLS</h3>
                      <div className="flex flex-wrap gap-2">
                          {resume.skills.map((s, i) => (
                              <span key={i} className="px-2 py-1 bg-slate-100 rounded text-xs font-medium text-slate-700">
                                  {s}
                              </span>
                          ))}
                      </div>
                  </section>
              </div>
              
              <div className="flex-1 space-y-8">
                  {resume.summaryVisible !== false && (
                      <section>
                          <h3 className="font-bold text-slate-900 uppercase tracking-wider mb-3 text-xs" style={{color: theme.accentColor}}>PROFILE</h3>
                          <p className={`leading-relaxed text-slate-700 text-justify ${getSizeClass('')}`}>{resume.summary}</p>
                      </section>
                  )}
                  <section>
                      <h3 className="font-bold text-slate-900 uppercase tracking-wider mb-4 text-xs" style={{color: theme.accentColor}}>EXPERIENCE</h3>
                      <div className="space-y-6">
                          {resume.experience.filter(e => e.visible !== false).map((exp, i) => (
                              <div key={i} className="break-inside-avoid">
                                  <div className="mb-2">
                                      <h4 className="font-bold text-slate-900 text-base">{exp.role}</h4>
                                      <div className="flex justify-between items-center text-xs font-semibold text-slate-500 mt-0.5">
                                          <span style={{ color: theme.accentColor }}>{exp.company}</span>
                                          <span>{exp.period}</span>
                                      </div>
                                  </div>
                                  <ul className={`list-disc ml-4 text-slate-700 ${getSpacingClass()} ${getSizeClass('')}`}>
                                      {exp.bullets.filter(b => b.visible !== false).map((b) => <li key={b.id} className="pl-1">{b.text}</li>)}
                                  </ul>
                              </div>
                          ))}
                      </div>
                  </section>
              </div>
          </div>
      </div>
  );

  // 2. EXECUTIVE (Timeline / Heavy Header)
  const ExecutiveTemplate = () => (
      <div className={`min-h-full bg-white text-slate-800 p-12 ${getFontStyle()}`}>
          <div className="mb-10 text-center border-b border-slate-300 pb-8">
              <h1 className="text-4xl font-serif font-bold text-slate-900 mb-2 tracking-tight" style={{color: theme.accentColor}}>{resume.fullName}</h1>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500 mb-4">{resume.role}</p>
              <div className="flex justify-center gap-4 text-xs font-medium text-slate-600">
                  <span>{resume.email}</span> • <span>{resume.phone}</span> • <span>{resume.location}</span>
              </div>
          </div>
          
          <div className="space-y-8">
              {resume.summaryVisible !== false && (
                  <section>
                      <div className="flex items-center gap-4 mb-3">
                          <div className="h-px bg-slate-200 flex-1"></div>
                          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900">Summary</h3>
                          <div className="h-px bg-slate-200 flex-1"></div>
                      </div>
                      <p className={`text-center max-w-2xl mx-auto leading-relaxed text-slate-600 ${getSizeClass('')}`}>{resume.summary}</p>
                  </section>
              )}

              <section>
                  <div className="flex items-center gap-4 mb-6">
                      <div className="h-px bg-slate-200 flex-1"></div>
                      <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900">Experience</h3>
                      <div className="h-px bg-slate-200 flex-1"></div>
                  </div>
                  <div className="space-y-8">
                      {resume.experience.filter(e => e.visible !== false).map((exp, i) => (
                          <div key={i} className="break-inside-avoid relative pl-6 border-l-2 border-slate-100">
                              <div className="flex justify-between items-baseline mb-2">
                                  <h4 className="text-lg font-bold text-slate-900">{exp.company}</h4>
                                  <span className="text-xs font-bold uppercase tracking-wide text-slate-400">{exp.period}</span>
                              </div>
                              <div className="text-sm font-bold text-slate-600 mb-3" style={{color: theme.accentColor}}>{exp.role}</div>
                              <ul className={`list-disc ml-4 text-slate-600 ${getSpacingClass()} ${getSizeClass('')}`}>
                                  {exp.bullets.filter(b => b.visible !== false).map((b) => <li key={b.id}>{b.text}</li>)}
                              </ul>
                          </div>
                      ))}
                  </div>
              </section>
          </div>
      </div>
  );

  // 3. MINIMALIST (Clean, No Lines)
  const MinimalistTemplate = () => (
      <div className={`min-h-full bg-white text-slate-900 p-10 ${getFontStyle()}`}>
          <div className="mb-10">
              <h1 className="text-3xl font-medium tracking-tight mb-2">{resume.fullName}</h1>
              <div className="text-sm text-slate-500 space-y-0.5">
                  <p>{resume.role}</p>
                  <p>{resume.location} • {resume.email} • {resume.phone}</p>
              </div>
          </div>

          <div className="space-y-8">
              {resume.summaryVisible !== false && (
                  <section>
                      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">About</h3>
                      <p className={`leading-relaxed text-slate-700 ${getSizeClass('')}`}>{resume.summary}</p>
                  </section>
              )}

              <section>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Work Experience</h3>
                  <div className="space-y-8">
                      {resume.experience.filter(e => e.visible !== false).map((exp, i) => (
                          <div key={i} className="break-inside-avoid">
                              <div className="flex justify-between items-baseline mb-1">
                                  <h4 className="font-semibold text-slate-900">{exp.role}</h4>
                                  <span className="text-xs text-slate-400">{exp.period}</span>
                              </div>
                              <div className="text-sm text-slate-500 mb-2">{exp.company}</div>
                              <ul className={`list-none text-slate-700 ${getSpacingClass()} ${getSizeClass('')}`}>
                                  {exp.bullets.filter(b => b.visible !== false).map((b) => <li key={b.id} className="before:content-['•'] before:mr-2 before:text-slate-300">{b.text}</li>)}
                              </ul>
                          </div>
                      ))}
                  </div>
              </section>

              <div className="grid grid-cols-2 gap-8">
                  <section>
                      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Skills</h3>
                      <div className={`text-slate-700 ${getSizeClass('')}`}>
                          {resume.skills.join(', ')}
                      </div>
                  </section>
                  {resume.educationVisible !== false && (
                      <section>
                          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Education</h3>
                          <div className={`text-slate-700 whitespace-pre-line ${getSizeClass('')}`}>{resume.education}</div>
                      </section>
                  )}
              </div>
          </div>
      </div>
  );

  // 4. CREATIVE (Grid, Bold)
  const CreativeTemplate = () => (
      <div className={`min-h-full bg-white text-slate-900 p-8 ${getFontStyle()}`}>
          <div className="grid grid-cols-12 gap-8 h-full">
              <div className="col-span-4 bg-slate-50 p-6 rounded-xl h-fit">
                  <div className="mb-8">
                      <div className="w-16 h-16 rounded-full bg-slate-900 text-white flex items-center justify-center text-2xl font-bold mb-4">
                          {resume.fullName.charAt(0)}
                      </div>
                      <h1 className="text-2xl font-bold leading-tight mb-2">{resume.fullName}</h1>
                      <p className="text-sm font-medium text-slate-500 mb-4">{resume.role}</p>
                      <div className="text-xs text-slate-600 space-y-1.5">
                          <div className="flex items-center gap-2"><Mail className="w-3 h-3"/> {resume.email}</div>
                          <div className="flex items-center gap-2"><Phone className="w-3 h-3"/> {resume.phone}</div>
                          <div className="flex items-center gap-2"><MapPin className="w-3 h-3"/> {resume.location}</div>
                      </div>
                  </div>

                  <div className="space-y-6">
                      <section>
                          <h3 className="font-bold text-sm mb-3 border-b border-slate-200 pb-1">SKILLS</h3>
                          <div className="flex flex-wrap gap-2">
                              {resume.skills.map((s, i) => (
                                  <span key={i} className="text-xs bg-white border border-slate-200 px-2 py-1 rounded">
                                      {s}
                                  </span>
                              ))}
                          </div>
                      </section>
                      {resume.educationVisible !== false && (
                          <section>
                              <h3 className="font-bold text-sm mb-3 border-b border-slate-200 pb-1">EDUCATION</h3>
                              <div className="text-xs text-slate-600 whitespace-pre-line">{resume.education}</div>
                          </section>
                      )}
                  </div>
              </div>

              <div className="col-span-8 space-y-8 pt-2">
                  {resume.summaryVisible !== false && (
                      <section>
                          <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
                              <User className="w-5 h-5 text-slate-400" /> Profile
                          </h2>
                          <p className={`text-slate-600 leading-relaxed ${getSizeClass('')}`}>{resume.summary}</p>
                      </section>
                  )}

                  <section>
                      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                          <Briefcase className="w-5 h-5 text-slate-400" /> Experience
                      </h2>
                      <div className="space-y-8 border-l-2 border-slate-100 pl-6 ml-2">
                          {resume.experience.filter(e => e.visible !== false).map((exp, i) => (
                              <div key={i} className="relative">
                                  <div className="absolute -left-[31px] top-1.5 w-3 h-3 rounded-full bg-slate-200 border-2 border-white"></div>
                                  <div className="mb-2">
                                      <h4 className="font-bold text-lg">{exp.role}</h4>
                                      <div className="text-sm font-medium text-slate-500">{exp.company} • {exp.period}</div>
                                  </div>
                                  <ul className={`list-disc ml-4 text-slate-600 ${getSpacingClass()} ${getSizeClass('')}`}>
                                      {exp.bullets.filter(b => b.visible !== false).map((b) => <li key={b.id}>{b.text}</li>)}
                                  </ul>
                              </div>
                          ))}
                      </div>
                  </section>
              </div>
          </div>
      </div>
  );

  // 5. ACADEMIC (Serif, Dense)
  const AcademicTemplate = () => (
      <div className={`min-h-full bg-white text-black p-12 font-serif`}>
          <div className="text-center border-b-2 border-black pb-4 mb-6">
              <h1 className="text-3xl font-bold uppercase tracking-widest mb-2">{resume.fullName}</h1>
              <div className="text-sm space-x-3">
                  <span>{resume.email}</span>
                  <span>|</span>
                  <span>{resume.phone}</span>
                  <span>|</span>
                  <span>{resume.location}</span>
              </div>
          </div>

          <div className="space-y-6">
              {resume.educationVisible !== false && (
                  <section>
                      <h3 className="font-bold uppercase text-sm border-b border-gray-300 mb-3">Education</h3>
                      <div className="text-sm whitespace-pre-line">{resume.education}</div>
                  </section>
              )}

              <section>
                  <h3 className="font-bold uppercase text-sm border-b border-gray-300 mb-3">Professional Experience</h3>
                  <div className="space-y-5">
                      {resume.experience.filter(e => e.visible !== false).map((exp, i) => (
                          <div key={i}>
                              <div className="flex justify-between font-bold text-sm mb-1">
                                  <span>{exp.company}, {exp.role}</span>
                                  <span>{exp.period}</span>
                              </div>
                              <ul className="list-disc ml-5 text-sm space-y-1">
                                  {exp.bullets.filter(b => b.visible !== false).map((b) => <li key={b.id}>{b.text}</li>)}
                              </ul>
                          </div>
                      ))}
                  </div>
              </section>

              <section>
                  <h3 className="font-bold uppercase text-sm border-b border-gray-300 mb-3">Skills</h3>
                  <p className="text-sm">{resume.skills.join(', ')}</p>
              </section>
          </div>
      </div>
  );

  // 6. SWISS (Helvetica, Bold headers)
  const SwissTemplate = () => (
      <div className={`min-h-full bg-white text-slate-900 p-10 font-sans`}>
          <header className="mb-12">
              <h1 className="text-6xl font-black tracking-tighter mb-4 leading-none" style={{color: theme.accentColor}}>{resume.fullName}</h1>
              <p className="text-xl font-bold text-slate-400">{resume.role}</p>
              <div className="mt-4 text-sm font-bold flex gap-6 text-slate-900">
                  <span>{resume.email}</span>
                  <span>{resume.phone}</span>
                  <span>{resume.location}</span>
              </div>
          </header>

          <div className="grid grid-cols-12 gap-8">
              <div className="col-span-3">
                  <h3 className="font-black text-sm uppercase mb-4 pt-1 border-t-4 border-slate-900">Info</h3>
              </div>
              <div className="col-span-9 mb-8">
                  <p className="text-lg font-medium leading-relaxed">{resume.summary}</p>
              </div>

              <div className="col-span-3">
                  <h3 className="font-black text-sm uppercase mb-4 pt-1 border-t-4 border-slate-900">Experience</h3>
              </div>
              <div className="col-span-9 space-y-10 mb-8">
                  {resume.experience.filter(e => e.visible !== false).map((exp, i) => (
                      <div key={i}>
                          <h4 className="text-2xl font-bold mb-1">{exp.company}</h4>
                          <div className="flex justify-between text-sm font-bold text-slate-500 mb-4">
                              <span>{exp.role}</span>
                              <span>{exp.period}</span>
                          </div>
                          <ul className="space-y-2 text-base font-medium text-slate-700">
                              {exp.bullets.filter(b => b.visible !== false).map((b) => <li key={b.id}>{b.text}</li>)}
                          </ul>
                      </div>
                  ))}
              </div>

              <div className="col-span-3">
                  <h3 className="font-black text-sm uppercase mb-4 pt-1 border-t-4 border-slate-900">Skills</h3>
              </div>
              <div className="col-span-9">
                  <div className="text-lg font-bold text-slate-800 leading-loose">
                      {resume.skills.map((s,i) => <span key={i} className="mr-4">{s}</span>)}
                  </div>
              </div>
          </div>
      </div>
  );

  // 7. SERIF (Elegant)
  const SerifTemplate = () => (
      <div className={`min-h-full bg-[#fdfbf7] text-slate-800 p-12 font-serif`}>
          <div className="flex justify-between items-end border-b border-slate-300 pb-6 mb-8">
              <div>
                  <h1 className="text-4xl italic font-bold text-slate-900 mb-2">{resume.fullName}</h1>
                  <p className="text-sm tracking-widest uppercase text-slate-500">{resume.role}</p>
              </div>
              <div className="text-right text-sm italic text-slate-600">
                  <p>{resume.email}</p>
                  <p>{resume.phone}</p>
              </div>
          </div>

          <div className="grid grid-cols-3 gap-10">
              <div className="col-span-2 space-y-8">
                  <section>
                      <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">Experience</h3>
                      <div className="space-y-8">
                          {resume.experience.filter(e => e.visible !== false).map((exp, i) => (
                              <div key={i}>
                                  <div className="flex justify-between items-baseline mb-2">
                                      <h4 className="font-bold text-lg">{exp.company}</h4>
                                      <span className="text-xs italic text-slate-500">{exp.period}</span>
                                  </div>
                                  <div className="text-sm italic text-slate-600 mb-3">{exp.role}</div>
                                  <p className="text-sm leading-relaxed text-slate-700">
                                      {exp.bullets.filter(b => b.visible !== false).map(b => b.text).join(' ')}
                                  </p>
                              </div>
                          ))}
                      </div>
                  </section>
              </div>

              <div className="space-y-8">
                  <section>
                      <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">Profile</h3>
                      <p className="text-sm leading-relaxed text-slate-700 italic">{resume.summary}</p>
                  </section>
                  <section>
                      <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">Skills</h3>
                      <ul className="text-sm space-y-2 text-slate-700">
                          {resume.skills.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                  </section>
                  {resume.educationVisible !== false && (
                      <section>
                          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">Education</h3>
                          <div className="text-sm whitespace-pre-line text-slate-700">{resume.education}</div>
                      </section>
                  )}
              </div>
          </div>
      </div>
  );

  return (
    <div className="w-full h-full flex flex-col bg-slate-100">
        <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between shadow-sm z-30 print:hidden sticky top-0 h-14">
            <div className="flex items-center gap-4 overflow-x-auto no-scrollbar h-full">
                <button 
                    onClick={() => setShowAppearance(!showAppearance)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${showAppearance ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-200'}`}
                >
                    <Palette className="w-4 h-4" /> <span className="hidden sm:inline">Design</span>
                </button>
                <div className="h-6 w-px bg-slate-300 hidden sm:block"></div>
                <div className="hidden sm:flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                    <button onClick={() => setScale(Math.max(0.4, scale - 0.1))} className="p-1 hover:bg-white rounded"><ZoomOut className="w-4 h-4 text-slate-600"/></button>
                    <span className="text-xs font-mono text-slate-500 w-12 text-center">{Math.round(scale * 100)}%</span>
                    <button onClick={() => setScale(Math.min(1.5, scale + 0.1))} className="p-1 hover:bg-white rounded"><ZoomIn className="w-4 h-4 text-slate-600"/></button>
                 </div>
            </div>
            
            <div className="flex gap-2">
                <button 
                    onClick={handleCanvaExport}
                    className="flex items-center gap-2 px-4 py-2 bg-[#00C4CC] hover:bg-[#00b0b8] text-white rounded-lg text-xs font-bold shadow-lg transition-all whitespace-nowrap"
                >
                    {canvaCopied ? <Check className="w-4 h-4"/> : <LayoutTemplate className="w-4 h-4"/>}
                    {canvaCopied ? 'Opening...' : <span className="hidden sm:inline">Canva</span>}
                </button>
                <button 
                    onClick={handleDownloadPDF} 
                    disabled={isDownloading}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-lg transition-all"
                >
                    {isDownloading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Download className="w-4 h-4"/>}
                    PDF
                </button>
            </div>
        </div>

        {showAppearance && (
            <div className="bg-white border-b border-slate-200 p-6 print:hidden animate-in slide-in-from-top-2 z-20 shadow-xl relative grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="col-span-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Grid className="w-3 h-3"/> Templates</h4>
                    <div className="grid grid-cols-3 gap-3">
                        {['Modern', 'Minimalist', 'Creative', 'Executive', 'Swiss', 'Academic', 'Serif'].map((t) => (
                            <button 
                                key={t}
                                onClick={() => updateTheme({ template: t as any })}
                                className={`p-3 rounded-lg border text-left transition-all ${
                                    theme.template === t 
                                    ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-600' 
                                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                }`}
                            >
                                <span className="block font-bold text-sm mb-1">{t}</span>
                                <span className="text-[10px] text-slate-500 opacity-80">
                                    {t === 'Modern' ? 'Clean sidebar layout' : 
                                     t === 'Minimalist' ? 'Pure typography' :
                                     t === 'Swiss' ? 'Bold Helvetica grid' :
                                     t === 'Academic' ? 'Traditional serif' : 'Professional'}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Palette className="w-3 h-3"/> Brand Accent</h4>
                    <div className="flex flex-wrap gap-3">
                        {[
                            { color: '#0f172a', label: 'Slate' },
                            { color: '#2563eb', label: 'Royal' }, 
                            { color: '#059669', label: 'Emerald' },
                            { color: '#7c3aed', label: 'Violet' }, 
                            { color: '#db2777', label: 'Pink' },
                            { color: '#ea580c', label: 'Orange' },
                            { color: '#632024', label: 'Wine' }
                        ].map(item => (
                            <button
                                key={item.color}
                                onClick={() => updateTheme({ accentColor: item.color })}
                                className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center ${theme.accentColor === item.color ? 'border-slate-900 scale-110' : 'border-transparent'}`}
                                style={{ backgroundColor: item.color }}
                                title={item.label}
                            >
                                {theme.accentColor === item.color && <Check className="w-4 h-4 text-white" />}
                            </button>
                        ))}
                    </div>
                    
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 mt-6 flex items-center gap-2"><Type className="w-3 h-3"/> Typography</h4>
                    <div className="flex gap-2">
                        {['Inter', 'Merriweather', 'Roboto', 'Lora'].map(font => (
                            <button
                                key={font}
                                onClick={() => updateTheme({ font: font as any })}
                                className={`px-3 py-1 text-xs border rounded ${theme.font === font ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                            >
                                {font}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        )}

        <div className="flex-1 flex overflow-hidden">
            {/* Scrollable Container with centering */}
            <div ref={containerRef} className="flex-1 overflow-auto bg-slate-100 p-4 md:p-8 print:p-0 print:bg-white print:overflow-visible flex justify-center relative">
                <div 
                    id="resume-preview-scale-wrapper"
                    style={{ 
                        transform: `scale(${scale})`, 
                        transformOrigin: 'top center',
                        transition: 'transform 0.2s ease-out'
                    }}
                    className="shadow-2xl print:shadow-none bg-white origin-top"
                >
                    <div 
                        id="resume-preview-content"
                        style={{ width: '210mm', minHeight: '297mm', backgroundColor: 'white' }}
                    >
                        {theme.template === 'Modern' && <ModernTemplate />}
                        {theme.template === 'Executive' && <ExecutiveTemplate />}
                        {theme.template === 'Tech' && <ModernTemplate />} 
                        {theme.template === 'Minimalist' && <MinimalistTemplate />}
                        {theme.template === 'Creative' && <CreativeTemplate />}
                        {theme.template === 'Academic' && <AcademicTemplate />}
                        {theme.template === 'Swiss' && <SwissTemplate />}
                        {theme.template === 'Serif' && <SerifTemplate />}
                        {/* Fallback for Tech/others reuse modern for now or specific ones if implemented later */}
                        {theme.template === 'Classic' && <AcademicTemplate />}
                    </div>
                </div>
            </div>

            {/* Suggestions Sidebar - Hidden on Mobile */}
            {onApplySuggestion && (
                <div className="w-80 bg-white border-l border-slate-200 overflow-y-auto print:hidden flex flex-col hidden lg:flex shadow-sm z-10">
                    <div className="p-4 border-b border-slate-200 bg-slate-50/80 backdrop-blur sticky top-0 z-10">
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-blue-600" />
                            AI Suggestions
                        </h3>
                    </div>
                    <div className="p-4 space-y-4">
                        {isGeneratingSuggestions ? (
                            <div className="flex flex-col items-center justify-center py-8 text-slate-400 gap-2">
                                <Loader2 className="w-6 h-6 animate-spin" />
                                <span className="text-xs">Analyzing layout...</span>
                            </div>
                        ) : suggestions.length === 0 ? (
                            <div className="text-center py-8 text-slate-400 text-xs">
                                <Check className="w-8 h-8 mx-auto mb-2 text-green-500 opacity-50" />
                                <p>No suggestions found. Great job!</p>
                            </div>
                        ) : (
                            suggestions.map(suggestion => (
                                <div key={suggestion.id} className="bg-white border border-slate-200 rounded-lg p-3 hover:border-blue-400 hover:shadow-md transition-all group relative overflow-hidden">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-[10px] font-bold uppercase bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{suggestion.type}</span>
                                    </div>
                                    <p className="text-sm text-slate-700 font-medium mb-3">{suggestion.label}</p>
                                    <button 
                                        onClick={() => handleMagicFix(suggestion)}
                                        disabled={applyingSuggestionId !== null}
                                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                                    >
                                        {applyingSuggestionId === suggestion.id ? <Loader2 className="w-3 h-3 animate-spin"/> : <Wand2 className="w-3 h-3"/>}
                                        Fix Automatically
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default ResumePreview;
