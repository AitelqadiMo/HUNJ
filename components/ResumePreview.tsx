
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ResumeData, ResumeThemeConfig, PreviewSuggestion, JobAnalysis, TemplateRecommendation, ResumeLayout } from '../types';
import { generatePreviewSuggestions, recommendTemplate } from '../services/geminiService';
import { Palette, Download, ZoomIn, ZoomOut, Wand2, Sparkles, Loader2, Check, Phone, Mail, MapPin, Globe, Linkedin, LayoutTemplate, Type, Eye, MoveUp, MoveDown, Grid2X2, AlignLeft, BookOpen, Layers, Settings, EyeOff, FileText, GripVertical } from 'lucide-react';

declare var html2pdf: any;

interface ResumePreviewProps {
  resume: ResumeData;
  onThemeUpdate?: (theme: ResumeThemeConfig) => void;
  onUpdate?: (resume: ResumeData) => void;
  onApplySuggestion?: (instruction: string) => Promise<void>;
  job?: JobAnalysis | null;
}

// --- UTILITY: CONTENT OPTIMIZER HOOK ---
const useContentOptimizer = (resume: ResumeData, theme: ResumeThemeConfig) => {
    return useMemo(() => {
        if (theme.targetPageCount >= 3) return resume;

        const optimized = { ...resume };
        const isOnePage = theme.targetPageCount === 1;

        if (isOnePage && optimized.experience.length > 4) {
            optimized.experience = optimized.experience.slice(0, 4);
        }

        optimized.experience = optimized.experience.map((exp, i) => {
            const maxBullets = isOnePage ? (i === 0 ? 5 : i === 1 ? 4 : 2) : 6;
            return {
                ...exp,
                bullets: exp.bullets.filter(b => b.visible !== false).slice(0, maxBullets)
            };
        });

        if (isOnePage && optimized.projects.length > 3) {
            optimized.projects = optimized.projects.slice(0, 2);
        }

        if (isOnePage && optimized.certifications.length > 4) {
            optimized.certifications = optimized.certifications.slice(0, 4);
        }

        return optimized;
    }, [resume, theme.targetPageCount]);
};

// --- RENDERERS ---

const ImpactHighlighter = ({ text }: { text: string }) => {
    const parts = text.split(/(\d+(?:[,.]\d+)?(?:%|k|M|B|\+|x)|(?:\$|€|£)\d+(?:[,.]\d+)?(?:k|M|B)?)/g);
    return (
        <span>
            {parts.map((part, i) => {
                if (part.match(/(\d+(?:[,.]\d+)?(?:%|k|M|B|\+|x)|(?:\$|€|£)\d+(?:[,.]\d+)?(?:k|M|B)?)/)) {
                    return <strong key={i} className="font-bold text-inherit">{part}</strong>;
                }
                return <span key={i}>{part}</span>;
            })}
        </span>
    );
};

// --- MINIMALIST LAYOUT ---
const MinimalistLayout = ({ resume, theme }: { resume: ResumeData, theme: ResumeThemeConfig }) => {
    const isOnePage = theme.targetPageCount === 1;
    const isThreePage = theme.targetPageCount === 3;

    const spacingClass = theme.density === 'Compact' || isOnePage ? 'space-y-4' : theme.density === 'Comfortable' || isThreePage ? 'space-y-8' : 'space-y-6';
    const headerSize = theme.density === 'Compact' || isOnePage ? 'text-2xl' : 'text-3xl';
    const bodySize = theme.density === 'Compact' || isOnePage ? 'text-[10px] leading-relaxed' : 'text-xs leading-relaxed';
    const sectionHeaderSize = theme.density === 'Compact' || isOnePage ? 'text-xs mb-2' : 'text-sm mb-3';

    const renderSectionContent = (sectionName: string) => {
        // Strict check for false. Undefined means visible.
        if (resume.visibleSections && resume.visibleSections[sectionName] === false) return null;

        switch(sectionName) {
            case 'summary':
                return resume.summary ? (
                    <div className="mb-4">
                        <h3 className={`font-bold text-gray-500 uppercase tracking-widest border-b border-gray-200 pb-1 ${sectionHeaderSize}`}>Professional Summary</h3>
                        <p className={`${bodySize} text-gray-800 text-justify`}>{resume.summary}</p>
                    </div>
                ) : null;
            case 'experience':
                return resume.experience.length > 0 ? (
                    <div className="mb-4">
                        <h3 className={`font-bold text-gray-500 uppercase tracking-widest border-b border-gray-200 pb-1 ${sectionHeaderSize}`}>Work Experience</h3>
                        <div className={`${isOnePage ? 'space-y-3' : 'space-y-5'}`}>
                            {resume.experience.filter(e => e.visible !== false).map((e, i) => (
                                <div key={i}>
                                    <div className="flex justify-between items-baseline mb-0.5">
                                        <h4 className="font-bold text-sm text-gray-900">{e.role}</h4>
                                        <span className="text-xs font-medium text-gray-500 font-mono">{e.period}</span>
                                    </div>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs font-semibold text-gray-700 italic">{e.company}</span>
                                        {e.location && <span className="text-[10px] text-gray-400">{e.location}</span>}
                                    </div>
                                    <ul className={`list-disc ml-3 space-y-0.5 text-gray-600 ${bodySize} marker:text-gray-300`}>
                                        {e.bullets.filter(b => b.visible !== false).map(b => (
                                            <li key={b.id} className="pl-1"><ImpactHighlighter text={b.text} /></li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : null;
            case 'education':
                return resume.education ? (
                    <div className="mb-4">
                        <h3 className={`font-bold text-gray-500 uppercase tracking-widest border-b border-gray-200 pb-1 ${sectionHeaderSize}`}>Education</h3>
                        <div className={`whitespace-pre-wrap ${bodySize} text-gray-800`}>{resume.education}</div>
                    </div>
                ) : null;
            case 'projects':
                return resume.projects.length > 0 ? (
                    <div className="mb-4">
                        <h3 className={`font-bold text-gray-500 uppercase tracking-widest border-b border-gray-200 pb-1 ${sectionHeaderSize}`}>Projects</h3>
                        <div className="space-y-3">
                            {resume.projects.map((p, i) => (
                                <div key={i}>
                                    <div className="flex justify-between items-baseline">
                                        <div className="font-bold text-sm text-gray-900">{p.name}</div>
                                        {p.link && <span className="text-[9px] text-blue-600 underline decoration-blue-200">{p.link.replace(/^https?:\/\//, '')}</span>}
                                    </div>
                                    <p className={`${bodySize} text-gray-600 mt-0.5`}>{p.description}</p>
                                    {p.technologies && p.technologies.length > 0 && (
                                        <div className="flex gap-2 mt-1">
                                            {p.technologies.map(t => <span key={t} className="text-[9px] bg-gray-100 text-gray-600 px-1.5 rounded">{t}</span>)}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : null;
            case 'certifications':
                return resume.certifications.length > 0 ? (
                    <div className="mb-4">
                        <h3 className={`font-bold text-gray-500 uppercase tracking-widest border-b border-gray-200 pb-1 ${sectionHeaderSize}`}>Certifications</h3>
                        <div className={isOnePage ? "grid grid-cols-2 gap-x-4 gap-y-1" : "space-y-2"}>
                            {resume.certifications.map((c, i) => (
                                <div key={i} className={`flex justify-between ${isOnePage ? 'text-[9px]' : 'text-xs'}`}>
                                    <span className="font-bold text-gray-800 truncate pr-2">{c.name}</span> 
                                    <span className="text-gray-500 whitespace-nowrap">{c.issuer} • {c.date}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : null;
            case 'skills':
                return (resume.skills.length > 0 || (resume.skillCategories && resume.skillCategories.length > 0)) ? (
                    <div className="mb-4">
                        <h3 className={`font-bold text-gray-500 uppercase tracking-widest border-b border-gray-200 pb-1 ${sectionHeaderSize}`}>Skills</h3>
                        {resume.skillCategories && resume.skillCategories.length > 0 ? (
                            <div className="space-y-2">
                                {resume.skillCategories.map((cat, i) => (
                                    <div key={i} className="flex gap-2 text-xs">
                                        <span className="font-bold text-gray-700 min-w-[120px]">{cat.name}:</span>
                                        <span className="text-gray-600 flex-1">{cat.skills.join(', ')}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={`leading-relaxed text-gray-700 ${isOnePage ? 'text-[10px]' : 'text-xs'}`}>
                                {resume.skills.join(' • ')}
                            </div>
                        )}
                    </div>
                ) : null;
            case 'languages':
                return resume.languages.length > 0 ? (
                    <div className="mb-4">
                        <h3 className={`font-bold text-gray-500 uppercase tracking-widest border-b border-gray-200 pb-1 ${sectionHeaderSize}`}>Languages</h3>
                        <p className={`text-gray-700 ${isOnePage ? 'text-[10px]' : 'text-xs'}`}>{resume.languages.join(' • ')}</p>
                    </div>
                ) : null;
            case 'awards':
                return resume.awards && resume.awards.length > 0 ? (
                    <div className="mb-4">
                        <h3 className={`font-bold text-gray-500 uppercase tracking-widest border-b border-gray-200 pb-1 ${sectionHeaderSize}`}>Awards & Scholarships</h3>
                        <ul className={`list-disc ml-3 text-gray-600 ${bodySize}`}>
                            {resume.awards.map((a, i) => <li key={i}>{a}</li>)}
                        </ul>
                    </div>
                ) : null;
            case 'interests':
                return resume.interests && resume.interests.length > 0 ? (
                    <div className="mb-4">
                        <h3 className={`font-bold text-gray-500 uppercase tracking-widest border-b border-gray-200 pb-1 ${sectionHeaderSize}`}>Interests</h3>
                        <p className={`text-gray-700 ${isOnePage ? 'text-[10px]' : 'text-xs'}`}>{resume.interests.join(' • ')}</p>
                    </div>
                ) : null;
            case 'affiliations':
                return resume.affiliations && resume.affiliations.length > 0 ? (
                    <div className="mb-4">
                        <h3 className={`font-bold text-gray-500 uppercase tracking-widest border-b border-gray-200 pb-1 ${sectionHeaderSize}`}>Affiliations</h3>
                        <div className="space-y-2">
                            {resume.affiliations.map((a, i) => (
                                <div key={i} className="flex justify-between items-baseline">
                                    <span className="text-sm font-medium text-gray-800">{a.role}, {a.organization}</span>
                                    <span className="text-xs text-gray-500">{a.period}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : null;
            default: return null;
        }
    };

    // Robust ordering: merge explicit order with any missing sections to ensure nothing is lost
    const sectionOrder = useMemo(() => {
        const baseOrder = resume.sectionOrder || [];
        const allPossible = ['summary', 'experience', 'education', 'projects', 'certifications', 'skills', 'languages', 'awards', 'interests', 'affiliations'];
        const missing = allPossible.filter(s => !baseOrder.includes(s));
        return [...baseOrder, ...missing];
    }, [resume.sectionOrder]);

    return (
        <div className="h-full p-10 bg-white text-gray-900 font-sans selection:bg-gray-200">
            {/* Header */}
            <header className="mb-8">
                <h1 className={`font-bold uppercase tracking-tight text-gray-900 mb-1 ${headerSize}`}>{resume.fullName}</h1>
                <div className="text-lg font-medium text-gray-600 mb-3">{resume.role}</div>
                <div className={`flex flex-wrap gap-3 text-gray-500 font-medium ${isOnePage ? 'text-[10px]' : 'text-xs'}`}>
                    {resume.email && <span>{resume.email}</span>}
                    {resume.phone && <span>| {resume.phone}</span>}
                    {resume.location && <span>| {resume.location}</span>}
                    {resume.linkedin && <span>| {resume.linkedin.replace(/^https?:\/\//, '')}</span>}
                    {resume.website && <span>| {resume.website.replace(/^https?:\/\//, '')}</span>}
                </div>
            </header>

            {/* Content */}
            <div className={spacingClass}>
                {sectionOrder.map(s => <React.Fragment key={s}>{renderSectionContent(s)}</React.Fragment>)}
            </div>
        </div>
    );
};

const ResumePreview: React.FC<ResumePreviewProps> = ({ resume, onThemeUpdate, onUpdate, onApplySuggestion, job }) => {
  const [showAppearance, setShowAppearance] = useState(false);
  const [scale, setScale] = useState(1); 
  const [suggestions, setSuggestions] = useState<PreviewSuggestion[]>([]);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState<TemplateRecommendation | null>(null);
  const [activeTab, setActiveTab] = useState<'templates' | 'layout' | 'sections' | 'style'>('templates');
  
  const containerRef = useRef<HTMLDivElement>(null);

  const optimizedResume = useContentOptimizer(resume, resume.themeConfig);

  useEffect(() => {
      const observer = new ResizeObserver((entries) => {
          if (entries[0]) {
              const containerWidth = entries[0].contentRect.width;
              const targetWidth = resume.themeConfig.pageSize === 'Letter' ? 816 : 794; 
              const padding = 64; 
              const availableWidth = containerWidth - padding;
              const newScale = Math.min(availableWidth / targetWidth, 1.2); 
              setScale(newScale > 0.3 ? newScale : 0.3);
          }
      });
      if (containerRef.current) observer.observe(containerRef.current);
      return () => observer.disconnect();
  }, [resume.themeConfig.pageSize]);

  useEffect(() => {
      if (job && resume) {
          setIsGeneratingSuggestions(true);
          Promise.all([
              generatePreviewSuggestions(resume, job),
              recommendTemplate(job)
          ]).then(([suggs, rec]) => {
              setSuggestions(suggs);
              setAiRecommendation(rec);
          }).catch(console.error).finally(() => setIsGeneratingSuggestions(false));
      }
  }, [resume.id, job]);

  const theme = resume.themeConfig;
  const updateTheme = (updates: Partial<ResumeThemeConfig>) => onThemeUpdate && onThemeUpdate({ ...theme, ...updates });

  const toggleSectionVisibility = (e: React.MouseEvent, sectionId: string) => {
      e.stopPropagation(); // Critical for avoiding parent click capture
      if (!onUpdate) return;
      
      const currentVisibility = resume.visibleSections || {};
      const isVisible = currentVisibility[sectionId] !== false; // default true
      
      onUpdate({
          ...resume,
          visibleSections: {
              ...currentVisibility,
              [sectionId]: !isVisible
          }
      });
  };

  // Robustly determine active sections for the sidebar, including any missing from order
  const activeSections = useMemo(() => {
      const currentOrder = resume.sectionOrder || [];
      const allPossible = ['summary', 'experience', 'education', 'skills', 'projects', 'certifications', 'languages', 'awards', 'interests', 'affiliations'];
      const missing = allPossible.filter(s => !currentOrder.includes(s));
      return [...currentOrder, ...missing];
  }, [resume.sectionOrder]);

  const moveSection = (e: React.MouseEvent, index: number, direction: 'up' | 'down') => {
      e.stopPropagation();
      if (!onUpdate) return;
      
      // We must use the full list to ensure we don't lose items during reorder
      const newOrder = [...activeSections];
      
      if (direction === 'up' && index > 0) {
          [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
      } else if (direction === 'down' && index < newOrder.length - 1) {
          [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      }
      onUpdate({ ...resume, sectionOrder: newOrder });
  };

  const handleDownloadPDF = async () => {
      setIsDownloading(true);
      const element = document.getElementById('resume-preview-content');
      if (!element) { setIsDownloading(false); return; }
      
      const wrapper = document.getElementById('resume-preview-scale-wrapper');
      const originalTransform = wrapper?.style.transform;
      if (wrapper) wrapper.style.transform = 'scale(1)';
      
      const opt = { 
          margin: 0, 
          filename: `${resume.fullName.replace(/\s+/g, '_')}_Resume.pdf`, 
          image: { type: 'jpeg', quality: 0.98 }, 
          html2canvas: { scale: 2, useCORS: true, scrollY: 0 }, 
          jsPDF: { unit: 'mm', format: theme.pageSize === 'Letter' ? 'letter' : 'a4', orientation: 'portrait' } 
      };
      
      try { 
          await html2pdf().set(opt).from(element).save(); 
      } catch (err) { 
          alert("Download failed. Please try printing to PDF (Ctrl+P)."); 
      } finally { 
          if (wrapper) wrapper.style.transform = originalTransform || ''; 
          setIsDownloading(false); 
      }
  };

  const getPageDimensions = () => {
      if (theme.pageSize === 'Letter') return { width: '215.9mm', minHeight: '279.4mm' }; 
      return { width: '210mm', minHeight: '297mm' }; 
  };

  const { width, minHeight } = getPageDimensions();

  const getFontFamily = () => {
      if (['Merriweather', 'Lora', 'Georgia'].includes(theme.font)) return 'font-serif';
      if (['JetBrains Mono', 'Courier New'].includes(theme.font)) return 'font-mono';
      return 'font-sans';
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-100 relative">
        {/* TOP TOOLBAR */}
        <div className="bg-white px-4 py-2 flex items-center justify-between border-b border-slate-200 z-30 print:hidden h-14 shrink-0 shadow-sm">
            <div className="flex items-center gap-4">
                <button onClick={() => setShowAppearance(!showAppearance)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${showAppearance ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 border border-slate-200 hover:text-slate-900'}`}>
                    <Palette className="w-4 h-4" /> Design Studio
                </button>
                <div className="h-6 w-px bg-slate-200"></div>
                <div className="flex items-center gap-2">
                    <button onClick={() => updateTheme({ targetPageCount: 1 })} className={`text-[10px] font-bold px-3 py-1.5 rounded border transition-all ${theme.targetPageCount === 1 ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}>1 Page</button>
                    <button onClick={() => updateTheme({ targetPageCount: 2 })} className={`text-[10px] font-bold px-3 py-1.5 rounded border transition-all ${theme.targetPageCount === 2 ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}>2 Pages</button>
                    <button onClick={() => updateTheme({ targetPageCount: 3 })} className={`text-[10px] font-bold px-3 py-1.5 rounded border transition-all ${theme.targetPageCount === 3 ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}>3 Pages</button>
                </div>
                <div className="h-6 w-px bg-slate-200"></div>
                <div className="flex items-center gap-1 bg-slate-50 rounded-lg p-1 border border-slate-200 ml-2">
                    <button onClick={() => setScale(Math.max(0.3, scale - 0.1))} className="p-1 hover:bg-white rounded text-slate-400"><ZoomOut className="w-3.5 h-3.5"/></button>
                    <span className="text-[10px] w-8 text-center font-mono text-slate-500">{Math.round(scale * 100)}%</span>
                    <button onClick={() => setScale(Math.min(1.2, scale + 0.1))} className="p-1 hover:bg-white rounded text-slate-400"><ZoomIn className="w-3.5 h-3.5"/></button>
                 </div>
            </div>
            <button onClick={handleDownloadPDF} disabled={isDownloading} className="flex items-center gap-2 px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all shadow-md active:scale-95 shadow-slate-900/10">
                {isDownloading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Download className="w-4 h-4"/>} 
                {isDownloading ? 'Rendering...' : 'Download PDF'}
            </button>
        </div>

        {/* DESIGN STUDIO DRAWER */}
        {showAppearance && (
            <div className="absolute top-14 left-0 w-80 bottom-0 bg-white/95 backdrop-blur-xl border-r border-slate-200 z-40 shadow-2xl animate-in slide-in-from-left-2 flex flex-col">
               <div className="flex border-b border-slate-200">
                   {['templates', 'layout', 'sections', 'style'].map(tab => (
                       <button 
                            key={tab} 
                            onClick={() => setActiveTab(tab as any)}
                            className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wide border-b-2 transition-colors ${activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                       >
                           {tab.slice(0,4)}
                       </button>
                   ))}
               </div>

               <div className="flex-1 overflow-y-auto p-6 space-y-6">
                   
                   {activeTab === 'templates' && (
                       <div className="space-y-4">
                           <h4 className="text-xs font-bold text-slate-400 uppercase">Premium Templates</h4>
                           <div className="grid grid-cols-1 gap-2">
                               {['Executive', 'Minimalist', 'Creative', 'Academic', 'ATS', 'International'].map((l) => (
                                   <button 
                                        key={l} 
                                        onClick={() => updateTheme({ layout: l as any })} 
                                        className={`p-3 rounded-lg border text-sm font-bold transition-all text-left flex justify-between items-center ${
                                            theme.layout === l ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200' : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                                        }`}
                                    >
                                       {l}
                                       {theme.layout === l && <Check className="w-4 h-4"/>}
                                   </button>
                               ))}
                           </div>
                       </div>
                   )}

                   {activeTab === 'layout' && (
                       <div className="space-y-6">
                           <div>
                               <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Paper Size</h4>
                               <div className="flex bg-slate-100 p-1 rounded-lg">
                                   {['A4', 'Letter'].map(s => (
                                       <button key={s} onClick={() => updateTheme({ pageSize: s as any })} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${theme.pageSize === s ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>{s}</button>
                                   ))}
                               </div>
                           </div>
                           <div>
                               <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Information Density</h4>
                               <div className="flex flex-col gap-2">
                                   {['Compact', 'Standard', 'Comfortable'].map(d => (
                                       <button key={d} onClick={() => updateTheme({ density: d as any })} className={`px-3 py-2 text-xs font-bold rounded-lg border text-left transition-all ${theme.density === d ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-600'}`}>
                                           {d}
                                       </button>
                                   ))}
                               </div>
                           </div>
                       </div>
                   )}

                   {activeTab === 'sections' && (
                       <div className="space-y-4">
                           <h4 className="text-xs font-bold text-slate-400 uppercase">Section Visibility & Order</h4>
                           <div className="space-y-2">
                               {activeSections.map((section, idx) => {
                                   const isVisible = resume.visibleSections?.[section] !== false;
                                   return (
                                       <div key={section} className={`flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg group hover:border-indigo-300 transition-all ${!isVisible ? 'opacity-50 grayscale' : ''}`}>
                                           <div className="flex items-center gap-3">
                                               <GripVertical className="w-4 h-4 text-slate-300 cursor-move" />
                                               <span className={`text-sm font-bold capitalize ${isVisible ? 'text-slate-700' : 'text-slate-400 line-through'}`}>{section}</span>
                                           </div>
                                           <div className="flex items-center gap-2">
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity mr-2">
                                                    <button onClick={(e) => moveSection(e, idx, 'up')} disabled={idx === 0} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-900 disabled:opacity-30"><MoveUp className="w-3.5 h-3.5"/></button>
                                                    <button onClick={(e) => moveSection(e, idx, 'down')} disabled={idx === activeSections.length - 1} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-900 disabled:opacity-30"><MoveDown className="w-3.5 h-3.5"/></button>
                                                </div>
                                                <button 
                                                    onClick={(e) => toggleSectionVisibility(e, section)} 
                                                    className={`p-1.5 rounded-md transition-colors ${isVisible ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 bg-slate-100'}`}
                                                    title={isVisible ? 'Hide Section' : 'Show Section'}
                                                >
                                                    {isVisible ? <Eye className="w-4 h-4"/> : <EyeOff className="w-4 h-4"/>}
                                                </button>
                                           </div>
                                       </div>
                                   );
                               })}
                           </div>
                       </div>
                   )}
                   
                   {activeTab === 'style' && (
                       <div className="space-y-6">
                           <div>
                               <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Typography</h4>
                               <div className="grid grid-cols-2 gap-2">
                                   {['Inter', 'Merriweather', 'Roboto', 'JetBrains Mono', 'Lora', 'Georgia'].map((f) => (
                                       <button 
                                            key={f} 
                                            onClick={() => updateTheme({ font: f as any })} 
                                            className={`p-2 rounded border text-xs transition-all truncate ${theme.font === f ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'}`} 
                                            style={{ fontFamily: f }}
                                        >
                                            {f}
                                       </button>
                                   ))}
                               </div>
                           </div>
                       </div>
                   )}
               </div>
            </div>
        )}

        {/* MAIN PREVIEW AREA */}
        <div className="flex-1 flex overflow-hidden">
            <div ref={containerRef} className="flex-1 overflow-auto bg-slate-200/50 p-8 flex justify-center relative custom-scrollbar">
                <div 
                    id="resume-preview-scale-wrapper" 
                    style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }} 
                    className="shadow-2xl shadow-slate-300 bg-white origin-top transition-transform duration-200 ease-out h-fit ring-1 ring-black/5"
                >
                    <div 
                        id="resume-preview-content" 
                        className={`${getFontFamily()} antialiased`}
                        style={{ 
                            width: width, 
                            minHeight: minHeight, 
                            backgroundColor: 'white', 
                            overflow: 'hidden', 
                            fontFamily: theme.font,
                            lineHeight: theme.density === 'Compact' ? 1.2 : theme.density === 'Comfortable' ? 1.6 : 1.4,
                            fontSize: theme.density === 'Compact' ? '13px' : '14px'
                        }}
                    >
                        {/* Renderer Switcher */}
                        {theme.layout === 'Minimalist' ? (
                            <MinimalistLayout resume={optimizedResume} theme={theme} />
                        ) : (
                            // Use Minimalist as default fallback for now to prevent crashes
                            <MinimalistLayout resume={optimizedResume} theme={theme} /> 
                        )}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default ResumePreview;
