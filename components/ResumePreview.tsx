
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ResumeData, DesignBlueprint, ResumeThemeConfig } from '../types';
import { generateDesignBlueprint } from '../services/geminiService';
import { Download, Loader2, Palette, Sparkles, ZoomIn, ZoomOut, Check, Eye, EyeOff, Layout, Type, Palette as PaletteIcon, ChevronRight, GripVertical } from 'lucide-react';

declare var html2pdf: any;

// --- ENGINE: SUB-COMPONENTS ---

// Explicitly type children to satisfy compiler expectations at call sites
const SectionHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h3 className="section-title">
        {children}
    </h3>
);

const ResumeHeader = ({ resume }: { resume: ResumeData }) => (
    <header className="resume-header">
        <h1 className="name">{resume.fullName}</h1>
        <div className="role-tag">{resume.role}</div>
        <div className="contact-strip">
            {resume.email && <span className="item">{resume.email}</span>}
            {resume.phone && <span className="item">{resume.phone}</span>}
            {resume.location && <span className="item">{resume.location}</span>}
            {resume.linkedin && <span className="item">{resume.linkedin.replace(/^https?:\/\//, '')}</span>}
        </div>
    </header>
);

const Experience = ({ items }: { items: ResumeData['experience'] }) => (
    <div className="experience-list">
        {items.filter(i => i.visible !== false).map((exp, idx) => (
            <div key={exp.id || idx} className="experience-item">
                <div className="row-main">
                    <span className="role">{exp.role}</span>
                    <span className="period">{exp.period}</span>
                </div>
                <div className="row-sub">
                    <span className="company">{exp.company}</span>
                    {exp.location && <span className="loc">{exp.location}</span>}
                </div>
                <ul className="bullets">
                    {exp.bullets.filter(b => b.visible !== false).map((b, i) => (
                        <li key={b.id || i}>{b.text}</li>
                    ))}
                </ul>
            </div>
        ))}
    </div>
);

const Skills = ({ skills, categories }: { skills: string[], categories?: ResumeData['skillCategories'] }) => (
    <div className="skills-grid">
        {categories && categories.length > 0 ? (
            categories.map((cat, idx) => (
                <div key={idx} className="skill-cat">
                    <span className="cat-name">{cat.name}:</span>
                    <span className="cat-vals">{cat.skills.join(', ')}</span>
                </div>
            ))
        ) : (
            <div className="skills-tags">
                {skills.map((s, i) => <span key={i} className="skill-tag">{s}</span>)}
            </div>
        )}
    </div>
);

// --- ENGINE: CORE ---

const ResumePreview: React.FC<{ resume: ResumeData; job?: any; onUpdate?: (resume: ResumeData) => void; onThemeUpdate?: (theme: ResumeThemeConfig) => void; }> = ({ resume, job, onUpdate }) => {
  const [blueprint, setBlueprint] = useState<DesignBlueprint | null>(resume.designBlueprint || null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [scale, setScale] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [activeStudioTab, setActiveStudioTab] = useState<'layout' | 'style' | 'visibility'>('layout');
  const [showStudio, setShowStudio] = useState(false);

  const surfaceRef = useRef<HTMLDivElement>(null);

  // Sync state if resume prop updates externally (e.g. from editor)
  useEffect(() => {
      if (resume.designBlueprint && resume.designBlueprint !== blueprint) {
          setBlueprint(resume.designBlueprint);
      }
  }, [resume.designBlueprint]);

  // Initial generation if blueprint is missing
  useEffect(() => {
    if (!resume.designBlueprint) {
        initBlueprint();
    }
  }, [resume.id]); // Only re-gen if ID changes to prevent loops

  const initBlueprint = async () => {
      setIsGenerating(true);
      try {
          const bp = await generateDesignBlueprint(job, resume);
          setBlueprint(bp);
          if (onUpdate) onUpdate({ ...resume, designBlueprint: bp });
      } catch (e) {
          console.error("Failed to init blueprint", e);
      } finally {
          setIsGenerating(false);
      }
  };

  const handleExport = async () => {
    setIsExporting(true);
    const element = document.getElementById('resume-canvas');
    if (!element) return;
    
    // Reset scale for export
    const originalTransform = element.style.transform;
    element.style.transform = 'scale(1)';
    
    const opt = {
      margin: 0,
      filename: `${resume.fullName.replace(/\s+/g, '_')}_Resume.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true, scrollY: 0 },
      jsPDF: { unit: 'mm', format: blueprint?.page_settings.format.toLowerCase() || 'a4', orientation: 'portrait' }
    };

    try {
      await html2pdf().set(opt).from(element).save();
    } finally {
      element.style.transform = originalTransform;
      setIsExporting(false);
    }
  };

  const toggleVisibility = (sectionId: string) => {
    if (!blueprint || !onUpdate) return;
    const nextBp = {
        ...blueprint,
        section_configs: {
            ...blueprint.section_configs,
            [sectionId]: { 
                ...(blueprint.section_configs[sectionId] || {}), 
                visible: !blueprint.section_configs[sectionId]?.visible 
            }
        }
    };
    setBlueprint(nextBp);
    onUpdate({ ...resume, designBlueprint: nextBp });
  };

  const updateTokens = (updates: Partial<DesignBlueprint['tokens']>) => {
    if (!blueprint || !onUpdate) return;
    const nextBp = { ...blueprint, tokens: { ...blueprint.tokens, ...updates } };
    setBlueprint(nextBp);
    onUpdate({ ...resume, designBlueprint: nextBp });
  };

  const getFontStack = (font: string) => {
      const stacks: Record<string, string> = {
          'Inter': "'Inter', sans-serif",
          'Merriweather': "'Merriweather', serif",
          'Roboto': "'Roboto', sans-serif",
          'Source Sans 3': "'Source Sans 3', sans-serif",
          'Lora': "'Lora', serif"
      };
      return stacks[font] || "sans-serif";
  };

  // Rendering logic for a single section
  const renderSection = (id: string) => {
    const config = blueprint?.section_configs[id] || { visible: true, variant: 'Standard' };
    const userOverride = resume.visibleSections[id] !== false;
    
    // Logic: If blueprint says hidden, it's hidden. If userOverride is false, it's hidden.
    if (config.visible === false || !userOverride) return null;

    let content = null;
    switch(id) {
        case 'summary': content = <p className="summary-text">{resume.summary}</p>; break;
        case 'experience': content = <Experience items={resume.experience} />; break;
        case 'skills': content = <Skills skills={resume.skills} categories={resume.skillCategories} />; break;
        case 'education': content = <p className="edu-text">{resume.education}</p>; break;
        case 'projects': content = (
            <div className="projects-list">
                {resume.projects.filter(p => p.visible !== false).map((p, i) => (
                    <div key={p.id || i} className="project-item">
                        <div className="proj-head">
                            <span className="name">{p.name}</span>
                            {p.link && <span className="link">{p.link.replace(/^https?:\/\//, '')}</span>}
                        </div>
                        <p className="desc">{p.description}</p>
                    </div>
                ))}
            </div>
        ); break;
        case 'certifications': content = (
            <div className="certs-grid">
                {resume.certifications.filter(c => c.visible !== false).map((c, i) => (
                    <div key={c.id || i} className="cert-item">
                        <span className="name">{c.name}</span>
                        <span className="meta">{c.issuer} • {c.date}</span>
                    </div>
                ))}
            </div>
        ); break;
        default: return null;
    }

    return (
        <section key={id} className={`section-${id} resume-section`}>
            <SectionHeader>{id.replace('_', ' ').toUpperCase()}</SectionHeader>
            {content}
        </section>
    );
  };

  if (!blueprint) {
    return (
        <div className="h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
            <p className="font-bold animate-pulse uppercase tracking-widest text-xs">Architecting Blueprint...</p>
        </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-100 overflow-hidden relative selection:bg-indigo-100">
        
        {/* TOP TOOLBAR */}
        <div className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-30 shadow-sm">
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => setShowStudio(!showStudio)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${showStudio ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-400'}`}
                >
                    <PaletteIcon className="w-4 h-4" /> Design Studio
                </button>
                <div className="h-4 w-px bg-slate-200"></div>
                <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200">
                    <button onClick={() => setScale(s => Math.max(0.4, s - 0.1))} className="p-1 hover:bg-white rounded transition-colors"><ZoomOut className="w-4 h-4 text-slate-400"/></button>
                    <span className="text-[10px] w-10 text-center font-mono font-bold text-slate-500">{Math.round(scale * 100)}%</span>
                    <button onClick={() => setScale(s => Math.min(1.5, s + 0.1))} className="p-1 hover:bg-white rounded transition-colors"><ZoomIn className="w-4 h-4 text-slate-400"/></button>
                </div>
            </div>

            <button 
                onClick={handleExport}
                disabled={isExporting}
                className="flex items-center gap-2 px-5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-lg active:scale-95 disabled:opacity-50"
            >
                {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Export PDF
            </button>
        </div>

        {/* MAIN RENDERING AREA */}
        <div className="flex-1 overflow-auto p-12 flex justify-center bg-slate-200/40 custom-scrollbar relative">
            <div 
                className="origin-top shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] transition-transform duration-300 ease-out" 
                style={{ transform: `scale(${scale})` }}
            >
                <div 
                    id="resume-canvas"
                    className={`bg-white relative overflow-hidden layout-${blueprint.layout_id}`}
                    style={{
                        width: blueprint.page_settings.format === 'A4' ? '210mm' : '215.9mm',
                        minHeight: blueprint.page_settings.format === 'A4' ? '297mm' : '279.4mm',
                        padding: blueprint.page_settings.margins,
                        /* CSS VARIABLE INJECTION */
                        // @ts-ignore
                        "--color-primary": blueprint.tokens.primary,
                        "--color-secondary": blueprint.tokens.secondary,
                        "--color-accent": blueprint.tokens.accent,
                        "--color-text-main": blueprint.tokens.text_main,
                        "--color-text-muted": blueprint.tokens.text_muted,
                        "--color-divider": blueprint.tokens.divider,
                        "--font-heading": getFontStack(blueprint.typography.heading_family),
                        "--font-body": getFontStack(blueprint.typography.body_family),
                        "--font-size-base": blueprint.typography.base_size,
                        "--line-height": blueprint.typography.line_height,
                        "--spacing-section": blueprint.typography.section_spacing,
                        "--spacing-item": blueprint.typography.item_spacing,
                        "--weight-heading": blueprint.typography.heading_weight
                    }}
                >
                    {/* ENGINE STYLES (Scoped to canvas) */}
                    <style dangerouslySetInnerHTML={{ __html: `
                        #resume-canvas {
                            color: var(--color-text-main);
                            font-family: var(--font-body);
                            line-height: var(--line-height);
                            font-size: var(--font-size-base);
                        }
                        #resume-canvas .resume-header {
                            margin-bottom: var(--spacing-section);
                            text-align: center;
                        }
                        #resume-canvas .resume-header .name {
                            font-family: var(--font-heading);
                            font-size: 2.5em;
                            font-weight: var(--weight-heading);
                            letter-spacing: -0.02em;
                            margin-bottom: 0.1em;
                            color: var(--color-primary);
                            text-transform: uppercase;
                        }
                        #resume-canvas .resume-header .role-tag {
                            font-weight: 600;
                            color: var(--color-accent);
                            text-transform: uppercase;
                            letter-spacing: 0.1em;
                            font-size: 0.9em;
                            margin-bottom: 0.5em;
                        }
                        #resume-canvas .resume-header .contact-strip {
                            display: flex;
                            justify-content: center;
                            gap: 1.5em;
                            font-size: 0.75em;
                            color: var(--color-text-muted);
                            font-weight: 500;
                        }
                        #resume-canvas .section-title {
                            font-family: var(--font-heading);
                            font-size: 1.1em;
                            font-weight: 700;
                            color: var(--color-accent);
                            border-bottom: 1px solid var(--color-divider);
                            padding-bottom: 0.3em;
                            margin-bottom: 0.8em;
                            text-transform: uppercase;
                            letter-spacing: 0.05em;
                        }
                        #resume-canvas .resume-section {
                            margin-bottom: var(--spacing-section);
                            page-break-inside: avoid;
                        }
                        #resume-canvas .summary-text {
                            text-align: justify;
                            font-size: 0.9em;
                        }
                        #resume-canvas .experience-item {
                            margin-bottom: var(--spacing-item);
                            page-break-inside: avoid;
                        }
                        #resume-canvas .experience-item .row-main {
                            display: flex;
                            justify-content: space-between;
                            font-weight: 700;
                            font-size: 0.95em;
                        }
                        #resume-canvas .experience-item .row-sub {
                            display: flex;
                            justify-content: space-between;
                            font-style: italic;
                            font-size: 0.85em;
                            color: var(--color-secondary);
                            margin-bottom: 0.4em;
                        }
                        #resume-canvas .bullets {
                            list-style: disc;
                            margin-left: 1.2em;
                            font-size: 0.85em;
                        }
                        #resume-canvas .bullets li {
                            margin-bottom: 0.2em;
                            padding-left: 0.3em;
                        }
                        #resume-canvas .skill-tag {
                            display: inline-block;
                            padding: 0.2em 0.5em;
                            margin: 0.2em;
                            background: var(--color-divider);
                            border-radius: 4px;
                            font-size: 0.75em;
                            font-weight: 600;
                        }
                        #resume-canvas.layout-SidebarLeft {
                            display: grid;
                            grid-template-columns: 1fr 2.5fr;
                            gap: 20mm;
                        }
                        #resume-canvas.layout-SidebarLeft .resume-header {
                            grid-column: 1 / -1;
                        }
                    `}} />

                    {/* CONTENT LAYOUT */}
                    <ResumeHeader resume={resume} />
                    
                    <div className="resume-body-content">
                        {resume.sectionOrder.map(renderSection)}
                    </div>

                    {/* Footer Marker (Visible only in UI) */}
                    <div className="absolute bottom-4 right-4 text-[8px] font-mono text-slate-300 uppercase tracking-widest pointer-events-none print:hidden">
                        A4 Engine v3.2 Optimized
                    </div>
                </div>
            </div>
        </div>

        {/* DESIGN STUDIO DRAWER */}
        {showStudio && (
            <div className="absolute left-0 top-14 bottom-0 w-80 bg-white border-r border-slate-200 z-40 shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 backdrop-blur-xl">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-indigo-500" />
                        Design Intelligence
                    </h3>
                    <button onClick={() => setShowStudio(false)} className="text-slate-400 hover:text-slate-900 transition-colors">✕</button>
                </div>

                <div className="flex border-b border-slate-100">
                    {['layout', 'style', 'visibility'].map(tab => (
                        <button 
                            key={tab} 
                            onClick={() => setActiveStudioTab(tab as any)}
                            className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all ${activeStudioTab === tab ? 'text-indigo-600 bg-indigo-50 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    
                    {activeStudioTab === 'layout' && (
                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">Structural Blueprint</label>
                                <div className="grid grid-cols-1 gap-2">
                                    {['SingleColumn', 'SidebarLeft', 'SidebarRight'].map(id => (
                                        <button 
                                            key={id} 
                                            onClick={() => {
                                                const nextBp = { ...blueprint, layout_id: id as any };
                                                setBlueprint(nextBp);
                                                onUpdate && onUpdate({ ...resume, designBlueprint: nextBp });
                                            }}
                                            className={`p-3 rounded-xl border-2 text-left flex items-center justify-between transition-all ${blueprint.layout_id === id ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100 hover:border-slate-300'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-white rounded-lg shadow-sm">
                                                    <Layout className="w-4 h-4 text-slate-600" />
                                                </div>
                                                <span className={`text-sm font-bold ${blueprint.layout_id === id ? 'text-indigo-900' : 'text-slate-600'}`}>{id.replace(/([A-Z])/g, ' $1').trim()}</span>
                                            </div>
                                            {blueprint.layout_id === id && <Check className="w-4 h-4 text-indigo-600" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeStudioTab === 'style' && (
                        <div className="space-y-8">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">Accent Palette</label>
                                <div className="grid grid-cols-4 gap-3">
                                    {['#4f46e5', '#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#0f172a', '#ec4899'].map(c => (
                                        <button 
                                            key={c}
                                            onClick={() => updateTokens({ accent: c })}
                                            className={`w-full aspect-square rounded-full border-2 transition-all hover:scale-110 shadow-sm ${blueprint.tokens.accent === c ? 'border-white ring-2 ring-indigo-500 scale-110' : 'border-transparent'}`}
                                            style={{ backgroundColor: c }}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">Typography</label>
                                <div className="space-y-2">
                                    {['Inter', 'Merriweather', 'Source Sans 3', 'Lora', 'Roboto'].map(f => (
                                        <button 
                                            key={f}
                                            onClick={() => {
                                                const nextBp = { ...blueprint, typography: { ...blueprint.typography, heading_family: f, body_family: f === 'Merriweather' ? 'Lora' : f } };
                                                setBlueprint(nextBp);
                                                onUpdate && onUpdate({ ...resume, designBlueprint: nextBp });
                                            }}
                                            className={`w-full p-2.5 rounded-lg border text-left text-sm transition-all ${blueprint.typography.heading_family === f ? 'border-indigo-200 bg-indigo-50 text-indigo-900 font-bold' : 'border-slate-200 text-slate-600'}`}
                                            style={{ fontFamily: getFontStack(f) }}
                                        >
                                            {f}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeStudioTab === 'visibility' && (
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Active Components</label>
                            {resume.sectionOrder.map(section => (
                                <button 
                                    key={section}
                                    onClick={() => toggleVisibility(section)}
                                    className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all group ${blueprint.section_configs[section]?.visible !== false ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-60'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <GripVertical className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                                        <span className={`text-sm font-bold capitalize ${blueprint.section_configs[section]?.visible !== false ? 'text-slate-700' : 'text-slate-400'}`}>
                                            {section.replace('_', ' ')}
                                        </span>
                                    </div>
                                    {blueprint.section_configs[section]?.visible !== false ? <Eye className="w-4 h-4 text-indigo-500" /> : <EyeOff className="w-4 h-4 text-slate-300" />}
                                </button>
                            ))}
                        </div>
                    )}

                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                    <button 
                        onClick={initBlueprint}
                        disabled={isGenerating}
                        className="w-full py-3 bg-slate-900 hover:bg-black text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin"/> : <Sparkles className="w-4 h-4 text-indigo-400" />}
                        Smart Regenerate
                    </button>
                </div>
            </div>
        )}
    </div>
  );
};

export default ResumePreview;
