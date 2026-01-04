import React, { useState, useEffect } from 'react';
import { ResumeData, ResumeThemeConfig, PreviewSuggestion, JobAnalysis } from '../types';
import { generatePreviewSuggestions } from '../services/geminiService';
import { Phone, Mail, MapPin, Globe, Linkedin, Palette, Download, ZoomIn, ZoomOut, Wand2, Sparkles, Loader2, Check, Type, Grid, ExternalLink, Copy, LayoutTemplate, Briefcase, GraduationCap, User } from 'lucide-react';

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
  const [zoom, setZoom] = useState(0.65); // Slightly smaller default zoom to see full page
  const [suggestions, setSuggestions] = useState<PreviewSuggestion[]>([]);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [applyingSuggestionId, setApplyingSuggestionId] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [canvaCopied, setCanvaCopied] = useState(false);

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
      template: 'Modern', 
      font: 'Inter',
      accentColor: '#2563eb',
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
      // Target the INNER content div which is not scaled by CSS transform
      const element = document.getElementById('resume-preview-content');
      
      if (!element) {
          console.error("Resume content element not found");
          setIsDownloading(false);
          return;
      }

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
        setIsDownloading(false);
      }
  };

  const handleCanvaExport = () => {
      // Format text specifically for easy copy-pasting into Canva text boxes
      const textToCopy = `
NAME:
${resume.fullName}

ROLE:
${resume.role}

CONTACT:
${resume.email} | ${resume.phone} | ${resume.location}
${resume.linkedin ? resume.linkedin : ''}
${resume.website ? resume.website : ''}

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
      
      // Open Canva Resume Templates in new tab
      window.open('https://www.canva.com/resumes/templates/', '_blank');
  };

  const handleMagicFix = async (suggestion: PreviewSuggestion) => {
      if (!onApplySuggestion) return;
      setApplyingSuggestionId(suggestion.id);
      await onApplySuggestion(suggestion.aiInstruction);
      setApplyingSuggestionId(null);
      setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
  };

  // Helper styles based on theme config
  const getFontStyle = () => {
      switch(theme.font) {
          case 'Merriweather': return 'font-serif';
          case 'Roboto': return 'font-sans';
          case 'JetBrains Mono': return 'font-mono';
          case 'Lora': return 'font-[Lora,serif]';
          default: return 'font-[Inter,sans-serif]';
      }
  };

  const getSizeClass = (base: string) => {
      if (theme.fontSize === 'small') return `${base} text-xs`;
      if (theme.fontSize === 'large') return `${base} text-base`;
      return `${base} text-sm`;
  };

  const getSpacingClass = () => {
      if (theme.spacing === 'compact') return 'gap-2 space-y-2';
      if (theme.spacing === 'comfortable') return 'gap-6 space-y-6';
      return 'gap-4 space-y-4';
  };

  // --- TEMPLATE RENDERERS ---

  // 1. MODERN (Style: Jack William - Left Sidebar, Clean Header)
  const ModernTemplate = () => (
      <div className={`min-h-full bg-white text-slate-800 p-10 flex flex-col ${getFontStyle()}`}>
          {/* Header */}
          <header className="flex justify-between items-start mb-8 pb-6 border-b-2 border-transparent">
              <div className="flex-1">
                  <h1 className="text-5xl font-extrabold uppercase tracking-tight leading-none text-slate-900 mb-2">{resume.fullName}</h1>
                  <p className="text-lg text-slate-500 font-medium tracking-widest uppercase">{resume.role}</p>
              </div>
              <div className="text-right text-sm text-slate-600 space-y-1">
                  <div className="flex items-center justify-end gap-2 font-medium">
                      {resume.phone} <Phone className="w-3 h-3 text-slate-400" />
                  </div>
                  <div className="flex items-center justify-end gap-2 font-medium">
                      {resume.email} <Mail className="w-3 h-3 text-slate-400" />
                  </div>
                  <div className="flex items-center justify-end gap-2 font-medium">
                      {resume.location} <MapPin className="w-3 h-3 text-slate-400" />
                  </div>
                  {resume.linkedin && (
                      <div className="flex items-center justify-end gap-2 font-medium">
                          <span className="text-blue-600">linkedin.com/in/{resume.linkedin.split('/in/')[1] || 'profile'}</span> 
                          <Linkedin className="w-3 h-3 text-slate-400" />
                      </div>
                  )}
              </div>
          </header>
          
          <div className="flex flex-1 gap-8">
              {/* Left Column (Sidebar) */}
              <div className="w-[32%] border-r border-slate-300 pr-6 space-y-6">
                  {resume.educationVisible !== false && (
                      <section>
                          <h3 className="font-bold text-slate-900 uppercase tracking-widest mb-4 text-sm">EDUCATION</h3>
                          <div className={`whitespace-pre-line text-slate-600 ${getSizeClass('')}`}>
                              {resume.education}
                          </div>
                      </section>
                  )}

                  <section>
                      <h3 className="font-bold text-slate-900 uppercase tracking-widest mb-4 text-sm">SKILLS</h3>
                      <ul className="space-y-2">
                          {resume.skills.map((s, i) => (
                              <li key={i} className={`flex items-start gap-2 text-slate-700 font-medium ${getSizeClass('')}`}>
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0"></span> 
                                  <span>{s}</span>
                              </li>
                          ))}
                      </ul>
                  </section>

                  {resume.languages && resume.languages.length > 0 && (
                      <section>
                          <h3 className="font-bold text-slate-900 uppercase tracking-widest mb-4 text-sm">LANGUAGES</h3>
                          <ul className="space-y-1">
                              {resume.languages.map((l, i) => (
                                  <li key={i} className={`text-slate-700 font-medium ${getSizeClass('')}`}>
                                      {l}
                                  </li>
                              ))}
                          </ul>
                      </section>
                  )}

                  {resume.certifications && resume.certifications.length > 0 && (
                      <section>
                          <h3 className="font-bold text-slate-900 uppercase tracking-widest mb-4 text-sm">AWARDS & SCHOLARSHIPS</h3>
                          <div className="space-y-4">
                              {resume.certifications.filter(c => c.visible !== false).map(c => (
                                  <div key={c.id} className="break-inside-avoid">
                                      <div className="text-xs font-bold text-slate-400 mb-0.5 uppercase">{c.date}</div>
                                      <div className="font-bold text-slate-800 text-sm leading-tight mb-1">{c.name}</div>
                                      <div className="text-xs text-slate-500 italic">{c.issuer}</div>
                                  </div>
                              ))}
                          </div>
                      </section>
                  )}

                  {resume.affiliations && resume.affiliations.some(a => a.visible !== false) && (
                      <section>
                          <h3 className="font-bold text-slate-900 uppercase tracking-widest mb-4 text-sm">EXTRA-CURRICULAR ACTIVITIES</h3>
                          <div className="space-y-4">
                              {resume.affiliations.filter(a => a.visible !== false).map((aff, i) => (
                                  <div key={i} className="break-inside-avoid">
                                      <div className="font-bold text-slate-800 text-sm leading-tight">{aff.organization}</div>
                                      <div className="text-xs text-slate-500 italic mb-1">{aff.role} • {aff.period}</div>
                                  </div>
                              ))}
                          </div>
                      </section>
                  )}
              </div>
              
              {/* Right Column (Main Content) */}
              <div className="flex-1 space-y-6">
                  {resume.summaryVisible !== false && (
                      <section>
                          <h3 className="font-bold text-slate-900 uppercase tracking-widest mb-4 text-sm">CAREER OBJECTIVE</h3>
                          <p className={`leading-relaxed text-slate-700 text-justify ${getSizeClass('')}`}>
                              {resume.summary}
                          </p>
                      </section>
                  )}

                  <section>
                      <h3 className="font-bold text-slate-900 uppercase tracking-widest mb-4 text-sm">WORK EXPERIENCE</h3>
                      <div className="space-y-6">
                          {resume.experience.filter(e => e.visible !== false).map((exp, i) => (
                              <div key={i} className="break-inside-avoid">
                                  <div className="mb-2">
                                      <h4 className="font-bold text-slate-900 text-base">{exp.role}</h4>
                                      <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wide text-slate-400 mt-1">
                                          <span>{exp.period}</span>
                                          <span style={{ color: theme.accentColor }}>{exp.company}</span>
                                      </div>
                                  </div>
                                  <ul className={`list-disc ml-4 text-slate-700 space-y-1.5 ${getSizeClass('')}`}>
                                      {exp.bullets.filter(b => b.visible !== false).map((b) => <li key={b.id} className="pl-1">{b.text}</li>)}
                                  </ul>
                              </div>
                          ))}
                      </div>
                  </section>

                  {resume.projects && resume.projects.some(p => p.visible !== false) && (
                    <section>
                        <h3 className="font-bold text-slate-900 uppercase tracking-widest mb-4 text-sm">PROJECTS</h3>
                        <div className="space-y-5">
                            {resume.projects.filter(p => p.visible !== false).map((proj, i) => (
                                <div key={i} className="break-inside-avoid">
                                    <h4 className="font-bold text-slate-900 text-sm mb-1">{proj.name}</h4>
                                    <p className={`text-slate-700 leading-relaxed ${getSizeClass('')}`}>{proj.description}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                  )}
              </div>
          </div>
      </div>
  );

  // 2. EXECUTIVE (Style: AHMDD SAAH - Timeline Layout)
  const ExecutiveTemplate = () => (
      <div className={`min-h-full bg-white text-gray-800 p-12 ${getFontStyle()}`}>
          {/* Header */}
          <div className="mb-8 border-b-2 border-gray-800 pb-6">
              <h1 className="text-4xl font-extrabold uppercase text-slate-800 mb-1 tracking-tight">{resume.fullName}</h1>
              <p className="text-lg uppercase tracking-[0.2em] text-slate-500 font-medium">{resume.role}</p>
          </div>

          <div className="flex gap-10">
              {/* Left Column: Contact & Skills */}
              <div className="w-[30%] space-y-8 pt-2">
                  <section>
                      <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-800 mb-4 border-b-2 border-slate-200 pb-2">Contact</h3>
                      <div className="space-y-3 text-sm text-slate-600 font-medium">
                          <div className="flex items-center gap-3">
                              <Phone className="w-4 h-4 text-slate-800" /> {resume.phone}
                          </div>
                          <div className="flex items-center gap-3">
                              <Mail className="w-4 h-4 text-slate-800" /> <span className="break-all">{resume.email}</span>
                          </div>
                          <div className="flex items-center gap-3">
                              <MapPin className="w-4 h-4 text-slate-800" /> {resume.location}
                          </div>
                          <div className="flex items-center gap-3">
                              <Globe className="w-4 h-4 text-slate-800" /> <span className="break-all">{resume.website?.replace('https://', '')}</span>
                          </div>
                      </div>
                  </section>

                  <section>
                      <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-800 mb-4 border-b-2 border-slate-200 pb-2">Skills</h3>
                      <ul className="space-y-2">
                          {resume.skills.map((s, i) => (
                              <li key={i} className="flex items-center gap-2 text-sm text-slate-700">
                                  <span className="w-1.5 h-1.5 bg-slate-800 rounded-full"></span> {s}
                              </li>
                          ))}
                      </ul>
                  </section>

                  {resume.languages && resume.languages.length > 0 && (
                      <section>
                          <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-800 mb-4 border-b-2 border-slate-200 pb-2">Languages</h3>
                          <ul className="space-y-1 text-sm text-slate-700">
                              {resume.languages.map((l, i) => (
                                  <li key={i}>{l}</li>
                              ))}
                          </ul>
                      </section>
                  )}

                  {resume.certifications && resume.certifications.some(c => c.visible !== false) && (
                      <section>
                          <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-800 mb-4 border-b-2 border-slate-200 pb-2">Awards</h3>
                          <div className="space-y-3">
                              {resume.certifications.filter(c => c.visible !== false).map((c, i) => (
                                  <div key={i} className="text-sm">
                                      <div className="font-bold text-slate-700">{c.name}</div>
                                      <div className="text-xs text-slate-500">{c.issuer} • {c.date}</div>
                                  </div>
                              ))}
                          </div>
                      </section>
                  )}
              </div>

              {/* Right Column: Timeline Content */}
              <div className="flex-1 relative pt-2">
                  {/* Timeline Line */}
                  <div className="absolute left-[19px] top-4 bottom-0 w-[2px] bg-slate-200"></div>

                  <div className="space-y-8">
                      {/* Profile Section */}
                      {resume.summaryVisible !== false && (
                          <section className="relative pl-12">
                              <div className="absolute left-0 top-0 w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center z-10">
                                  <User className="w-5 h-5 text-white" />
                              </div>
                              <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-800 mb-3 pt-2.5">Profile</h3>
                              <p className={`leading-relaxed text-slate-600 text-justify ${getSizeClass('')}`}>
                                  {resume.summary}
                              </p>
                          </section>
                      )}

                      {/* Experience Section */}
                      <section className="relative pl-12">
                          <div className="absolute left-0 top-0 w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center z-10">
                              <Briefcase className="w-5 h-5 text-white" />
                          </div>
                          <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-800 mb-6 pt-2.5">Work Experience</h3>
                          
                          <div className="space-y-8">
                              {resume.experience.filter(e => e.visible !== false).map((exp, i) => (
                                  <div key={i} className="relative break-inside-avoid">
                                      {/* Small timeline dot for each job */}
                                      <div className="absolute -left-[34px] top-1.5 w-3 h-3 bg-white border-2 border-slate-800 rounded-full z-10"></div>
                                      
                                      <div className="flex justify-between items-baseline mb-1">
                                          <h4 className="text-lg font-bold text-slate-900">{exp.company}</h4>
                                          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{exp.period}</span>
                                      </div>
                                      <div className="text-sm font-bold text-slate-600 uppercase tracking-wide mb-2">{exp.role}</div>
                                      <ul className={`list-disc ml-4 space-y-1.5 text-slate-600 ${getSizeClass('')}`}>
                                          {exp.bullets.filter(b => b.visible !== false).map((b) => <li key={b.id}>{b.text}</li>)}
                                      </ul>
                                  </div>
                              ))}
                          </div>
                      </section>

                      {/* Education Section */}
                      {resume.educationVisible !== false && (
                          <section className="relative pl-12">
                              <div className="absolute left-0 top-0 w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center z-10">
                                  <GraduationCap className="w-5 h-5 text-white" />
                              </div>
                              <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-800 mb-6 pt-2.5">Education</h3>
                              
                              <div className="relative break-inside-avoid">
                                   <div className="absolute -left-[34px] top-1.5 w-3 h-3 bg-white border-2 border-slate-800 rounded-full z-10"></div>
                                   <div className={`whitespace-pre-line text-slate-700 ${getSizeClass('')}`}>
                                       {resume.education}
                                   </div>
                              </div>
                          </section>
                      )}
                  </div>
              </div>
          </div>
      </div>
  );

  // 3. MINIMALIST (Whitespace, Simple Typography) - Kept as is, useful alternative
  const MinimalistTemplate = () => (
      <div className={`min-h-full bg-white text-gray-800 p-12 flex flex-col ${getFontStyle()} ${getSpacingClass()}`}>
          <div>
              <h1 className="text-5xl font-light tracking-tight mb-2" style={{ color: theme.accentColor }}>{resume.fullName}</h1>
              <p className="text-xl text-gray-400 font-light">{resume.role}</p>
              <div className="mt-6 text-xs text-gray-400 font-mono flex gap-4">
                  <span>{resume.email}</span>
                  <span>{resume.phone}</span>
                  <span>{resume.location}</span>
              </div>
          </div>

          {resume.summaryVisible !== false && (
              <div className="mt-8 border-t border-gray-100 pt-8 grid grid-cols-12 gap-8">
                  <div className="col-span-3">
                      <h3 className="text-xs text-gray-400 font-bold uppercase tracking-widest sticky top-0">About</h3>
                  </div>
                  <div className="col-span-9">
                      <p className={`leading-relaxed text-gray-600 ${getSizeClass('')}`}>{resume.summary}</p>
                  </div>
              </div>
          )}

          <div className="grid grid-cols-12 gap-8">
              <div className="col-span-3">
                  <h3 className="text-xs text-gray-400 font-bold uppercase tracking-widest sticky top-0">Experience</h3>
              </div>
              <div className="col-span-9 space-y-8">
                  {resume.experience.filter(e => e.visible !== false).map((exp, i) => (
                      <div key={i} className="break-inside-avoid">
                          <div className="flex justify-between items-baseline mb-2">
                              <h4 className="font-bold text-gray-900 text-md">{exp.company}</h4>
                              <span className="text-xs text-gray-400 font-mono">{exp.period}</span>
                          </div>
                          <div className="text-xs text-gray-500 mb-3 italic">{exp.role}</div>
                          <ul className={`space-y-2 text-gray-600 ${getSizeClass('')}`}>
                               {exp.bullets.filter(b => b.visible !== false).map((b) => <li key={b.id} className="flex gap-2"><span className="text-gray-300">-</span> <span>{b.text}</span></li>)}
                          </ul>
                      </div>
                  ))}
              </div>
          </div>

          <div className="grid grid-cols-12 gap-8">
              <div className="col-span-3">
                  <h3 className="text-xs text-gray-400 font-bold uppercase tracking-widest sticky top-0">Skills</h3>
              </div>
              <div className="col-span-9">
                  <div className={`flex flex-wrap gap-x-6 gap-y-2 text-gray-600 ${getSizeClass('')}`}>
                      {resume.skills.map((s, i) => <span key={i}>{s}</span>)}
                  </div>
              </div>
          </div>
      </div>
  );

  // 4. TECH (Dark Sidebar, Code-like aesthetic) - Kept as is
  const TechTemplate = () => (
      <div className={`min-h-full bg-white flex ${getFontStyle()}`}>
          <div className="w-1/3 text-white p-8 flex flex-col gap-8 min-h-full" style={{ backgroundColor: '#1e293b' }}>
              <div>
                  <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white mb-4 bg-white/10">
                      {resume.fullName.charAt(0)}
                  </div>
                  <h1 className="text-2xl font-bold text-white leading-tight">{resume.fullName}</h1>
                  <p className="text-slate-400 text-xs mt-2 uppercase tracking-widest">{resume.role}</p>
              </div>

              <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2"><Mail className="w-3 h-3"/> {resume.email}</div>
                  {resume.website && <div className="flex items-center gap-2"><Globe className="w-3 h-3"/> {resume.website.replace(/^https?:\/\//, '')}</div>}
                  <div className="flex items-center gap-2"><MapPin className="w-3 h-3"/> {resume.location}</div>
                  <div className="flex items-center gap-2"><Phone className="w-3 h-3"/> {resume.phone}</div>
              </div>

              <div>
                  <h3 className="text-white font-bold uppercase tracking-wider mb-4 text-xs border-b border-slate-700 pb-2">Tech Stack</h3>
                  <div className="flex flex-wrap gap-2">
                      {resume.skills.map((s, i) => (
                          <span key={i} className="bg-slate-800 px-2 py-1 rounded text-[10px] text-blue-300 border border-slate-700">{s}</span>
                      ))}
                  </div>
              </div>

              {resume.educationVisible !== false && (
                  <div>
                      <h3 className="text-white font-bold uppercase tracking-wider mb-4 text-xs border-b border-slate-700 pb-2">Education</h3>
                      <p className="text-xs whitespace-pre-line text-slate-300">{resume.education}</p>
                  </div>
              )}
          </div>

          <div className={`w-2/3 p-10 text-slate-800 ${getSpacingClass()}`}>
               {resume.summaryVisible !== false && (
                   <section>
                       <h3 className="font-bold text-lg mb-2 text-slate-900 border-b-2 border-slate-100 pb-1" style={{ color: theme.accentColor }}>// Summary</h3>
                       <p className={`leading-relaxed ${getSizeClass('')}`}>{resume.summary}</p>
                   </section>
               )}

               <section>
                   <h3 className="font-bold text-lg mb-4 text-slate-900 border-b-2 border-slate-100 pb-1" style={{ color: theme.accentColor }}>// Experience</h3>
                   <div className="space-y-6">
                        {resume.experience.filter(e => e.visible !== false).map((exp, i) => (
                          <div key={i} className="break-inside-avoid">
                              <div className="flex justify-between font-bold text-sm mb-1">
                                  <span>{exp.role}</span>
                                  <span className="text-slate-500 font-normal font-mono text-xs">{exp.period}</span>
                              </div>
                              <div className="text-xs font-bold mb-2 uppercase tracking-wide text-slate-600">@ {exp.company}</div>
                              <ul className="list-none space-y-1">
                                  {exp.bullets.filter(b => b.visible !== false).map((b) => <li key={b.id} className={`flex gap-2 ${getSizeClass('')}`}><span style={{ color: theme.accentColor }}>::</span> {b.text}</li>)}
                              </ul>
                          </div>
                      ))}
                   </div>
               </section>
          </div>
      </div>
  );

  return (
    <div className="w-full h-full flex flex-col bg-gray-100/50">
        {/* Toolbar */}
        <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between shadow-sm z-30 print:hidden sticky top-0 h-14">
            <div className="flex items-center gap-4 overflow-x-auto no-scrollbar h-full">
                <button 
                    onClick={() => setShowAppearance(!showAppearance)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${showAppearance ? 'bg-devops-800 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                    <Palette className="w-4 h-4" /> Appearance
                </button>
                <div className="h-6 w-px bg-gray-300"></div>
                
                {/* Quick Toggles */}
                <div className="flex items-center gap-2">
                    <button onClick={() => updateTheme({ fontSize: 'small' })} className={`p-1.5 rounded ${theme.fontSize === 'small' ? 'bg-gray-200' : 'hover:bg-gray-100'}`} title="Small Text"><Type className="w-3 h-3" /></button>
                    <button onClick={() => updateTheme({ fontSize: 'medium' })} className={`p-1.5 rounded ${theme.fontSize === 'medium' ? 'bg-gray-200' : 'hover:bg-gray-100'}`} title="Medium Text"><Type className="w-4 h-4" /></button>
                    <button onClick={() => updateTheme({ fontSize: 'large' })} className={`p-1.5 rounded ${theme.fontSize === 'large' ? 'bg-gray-200' : 'hover:bg-gray-100'}`} title="Large Text"><Type className="w-5 h-5" /></button>
                </div>
                <div className="h-6 w-px bg-gray-300"></div>
                
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                    <button onClick={() => setZoom(Math.max(0.4, zoom - 0.1))} className="p-1 hover:bg-white rounded"><ZoomOut className="w-4 h-4 text-gray-600"/></button>
                    <span className="text-xs font-mono text-gray-500 w-12 text-center">{Math.round(zoom * 100)}%</span>
                    <button onClick={() => setZoom(Math.min(1.5, zoom + 0.1))} className="p-1 hover:bg-white rounded"><ZoomIn className="w-4 h-4 text-gray-600"/></button>
                 </div>
            </div>
            
            <div className="flex gap-2">
                <button 
                    onClick={handleCanvaExport}
                    className="flex items-center gap-2 px-4 py-2 bg-[#00C4CC] hover:bg-[#00b0b8] text-white rounded-lg text-xs font-bold shadow-lg transition-all"
                    title="Copy formatted data and open Canva"
                >
                    {canvaCopied ? <Check className="w-4 h-4"/> : <LayoutTemplate className="w-4 h-4"/>}
                    {canvaCopied ? 'Copied & Opening...' : 'Design in Canva'}
                </button>
                <button 
                    onClick={handleDownloadPDF} 
                    disabled={isDownloading}
                    className="flex items-center gap-2 px-4 py-2 bg-devops-900 hover:bg-devops-800 text-white rounded-lg text-xs font-bold shadow-lg transition-all"
                >
                    {isDownloading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Download className="w-4 h-4"/>}
                    PDF
                </button>
            </div>
        </div>

        {/* Extended Appearance Panel */}
        {showAppearance && (
            <div className="bg-white border-b border-gray-200 p-6 print:hidden animate-in slide-in-from-top-2 z-20 shadow-xl relative grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Grid className="w-3 h-3"/> Templates</h4>
                    <div className="grid grid-cols-2 gap-3">
                        {['Modern', 'Executive', 'Minimalist', 'Tech'].map((t) => (
                            <button 
                                key={t}
                                onClick={() => updateTheme({ template: t as any })}
                                className={`p-3 rounded-lg border-2 text-left transition-all ${
                                    theme.template === t 
                                    ? 'border-accent-500 bg-accent-50 text-accent-700' 
                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                <span className="block font-bold text-xs mb-1">{t}</span>
                                <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-current w-2/3 opacity-30"></div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Type className="w-3 h-3"/> Typography</h4>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-2">
                            {['Inter', 'Merriweather', 'Roboto', 'JetBrains Mono', 'Lora'].map(font => (
                                <button
                                    key={font}
                                    onClick={() => updateTheme({ font: font as any })}
                                    className={`px-3 py-2 rounded text-xs border transition-colors ${
                                        theme.font === font ? 'border-accent-500 bg-accent-50 text-accent-700' : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                                    }`}
                                    style={{ fontFamily: font }}
                                >
                                    {font}
                                </button>
                            ))}
                        </div>
                        
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-600">Layout Density</label>
                            <div className="flex bg-gray-100 rounded-lg p-1">
                                {['compact', 'normal', 'comfortable'].map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => updateTheme({ spacing: s as any })}
                                        className={`flex-1 py-1.5 text-xs rounded capitalize transition-all ${theme.spacing === s ? 'bg-white shadow-sm text-gray-900 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Palette className="w-3 h-3"/> Accent Color</h4>
                    <div className="flex flex-wrap gap-3">
                        {['#2563eb', '#0f172a', '#059669', '#7c3aed', '#db2777', '#dc2626', '#d97706', '#4b5563'].map(color => (
                            <button
                                key={color}
                                onClick={() => updateTheme({ accentColor: color })}
                                className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${theme.accentColor === color ? 'border-gray-900 scale-110' : 'border-transparent'}`}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                    </div>
                    <div className="mt-4">
                        <label className="text-xs font-semibold text-gray-600 block mb-1">Custom Hex</label>
                        <div className="flex gap-2">
                            <input 
                                type="color" 
                                value={theme.accentColor}
                                onChange={(e) => updateTheme({ accentColor: e.target.value })}
                                className="w-8 h-8 rounded cursor-pointer border-none p-0"
                            />
                            <input 
                                type="text"
                                value={theme.accentColor}
                                onChange={(e) => updateTheme({ accentColor: e.target.value })}
                                className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs uppercase font-mono"
                            />
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
            {/* Preview Canvas */}
            <div className="flex-1 overflow-auto bg-gray-200/80 p-8 print:p-0 print:bg-white print:overflow-visible flex justify-center relative">
                
                {/* 
                    Structure for proper scaling and PDF generation:
                    1. Outer wrapper handles CSS Scale (zoom) for screen.
                    2. Inner 'resume-preview-content' has fixed A4 dimensions and is the PDF target.
                */}
                <div 
                    id="resume-preview-scale-wrapper"
                    style={{ 
                        transform: `scale(${zoom})`, 
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
                        {theme.template === 'Minimalist' && <MinimalistTemplate />}
                        {theme.template === 'Tech' && <TechTemplate />}
                        {theme.template === 'Classic' && <ExecutiveTemplate />} {/* Fallback map to Executive for legacy classic */}
                    </div>
                </div>
            </div>

            {/* Magic Suggestions Sidebar (Right Side) */}
            {onApplySuggestion && (
                <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto print:hidden flex flex-col">
                    <div className="p-4 border-b border-gray-200 bg-gray-50 sticky top-0 z-10">
                        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-purple-600" />
                            Magic Suggestions
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">One-click improvements by AI</p>
                    </div>

                    <div className="p-4 space-y-4">
                        {isGeneratingSuggestions ? (
                            <div className="flex flex-col items-center justify-center py-8 text-gray-400 gap-2">
                                <Loader2 className="w-6 h-6 animate-spin" />
                                <span className="text-xs">Analyzing resume layout...</span>
                            </div>
                        ) : suggestions.length === 0 ? (
                            <div className="text-center py-8 text-gray-400 text-xs">
                                <Check className="w-8 h-8 mx-auto mb-2 text-green-500 opacity-50" />
                                <p>No suggestions found. Your resume looks great!</p>
                            </div>
                        ) : (
                            suggestions.map(suggestion => (
                                <div key={suggestion.id} className="bg-white border border-gray-200 rounded-lg p-3 hover:border-purple-300 hover:shadow-md transition-all group relative overflow-hidden">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                            suggestion.type === 'content' ? 'bg-blue-100 text-blue-600' :
                                            suggestion.type === 'style' ? 'bg-pink-100 text-pink-600' :
                                            'bg-yellow-100 text-yellow-600'
                                        }`}>
                                            {suggestion.type}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-700 font-medium mb-3">{suggestion.label}</p>
                                    <button 
                                        onClick={() => handleMagicFix(suggestion)}
                                        disabled={applyingSuggestionId !== null}
                                        className="w-full py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                                    >
                                        {applyingSuggestionId === suggestion.id ? <Loader2 className="w-3 h-3 animate-spin"/> : <Wand2 className="w-3 h-3"/>}
                                        Apply Fix
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