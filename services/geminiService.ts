
import { GoogleGenAI, Type } from "@google/genai";
import { JobAnalysis, ATSScore, ResumeData, DesignBlueprint, SkillMatch, BiasAnalysis, UserProfile } from '../types';

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const analysisModel = "gemini-3-flash-preview";
const complexModel = "gemini-3-pro-preview"; // Using Pro for complex reasoning

export const generateDesignBlueprint = async (
    job: JobAnalysis | null | undefined,
    resume: ResumeData
): Promise<DesignBlueprint> => {
    const ai = getAI();
    
    const context = job 
        ? `JOB: ${job.title} at ${job.company} (${job.industry})`
        : `CONTEXT: General Professional Resume for ${resume.role}`;

    const prompt = `
    Generate a deterministic Design Blueprint for this Resume.
    
    ${context}
    CONTENT VOLUME: ${resume.experience.length} experiences, ${resume.skills.length} skills.
    
    RULES:
    1. For Tech roles, use "Inter" or "Source Sans 3".
    2. For Executive roles, use "Merriweather" for headers.
    3. Determine if "SidebarLeft" is better for high-density skills or "SingleColumn" for traditional layout.
    4. Provide specific color hex codes that are professional.
    5. section_configs must include 'summary', 'experience', 'education', 'skills', 'projects', 'certifications'.
    `;

    try {
        const response = await ai.models.generateContent({
            model: analysisModel,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        layout_id: { type: Type.STRING, enum: ['SingleColumn', 'SidebarLeft', 'SidebarRight', 'Grid2x2'] },
                        tokens: {
                            type: Type.OBJECT,
                            properties: {
                                primary: { type: Type.STRING },
                                secondary: { type: Type.STRING },
                                accent: { type: Type.STRING },
                                background: { type: Type.STRING },
                                surface: { type: Type.STRING },
                                text_main: { type: Type.STRING },
                                text_muted: { type: Type.STRING },
                                divider: { type: Type.STRING }
                            }
                        },
                        typography: {
                            type: Type.OBJECT,
                            properties: {
                                heading_family: { type: Type.STRING },
                                body_family: { type: Type.STRING },
                                base_size: { type: Type.STRING },
                                line_height: { type: Type.STRING },
                                heading_weight: { type: Type.STRING },
                                section_spacing: { type: Type.STRING },
                                item_spacing: { type: Type.STRING }
                            }
                        },
                        section_configs: {
                            type: Type.OBJECT,
                            additionalProperties: {
                                type: Type.OBJECT,
                                properties: {
                                    visible: { type: Type.BOOLEAN },
                                    variant: { type: Type.STRING, enum: ['Standard', 'Compact', 'Minimal'] }
                                }
                            }
                        },
                        page_settings: {
                            type: Type.OBJECT,
                            properties: {
                                format: { type: Type.STRING, enum: ['A4', 'Letter'] },
                                margins: { type: Type.STRING },
                                scaling: { type: Type.NUMBER }
                            }
                        }
                    },
                    required: ['layout_id', 'tokens', 'typography', 'section_configs']
                }
            }
        });

        return JSON.parse(response.text);
    } catch (e) {
        console.error("Blueprint generation failed", e);
        return DEFAULT_BLUEPRINT;
    }
};

const DEFAULT_BLUEPRINT: DesignBlueprint = {
    layout_id: 'SingleColumn',
    tokens: {
        primary: "#1e293b",
        secondary: "#64748b",
        accent: "#4f46e5",
        background: "#ffffff",
        surface: "#ffffff",
        text_main: "#0f172a",
        text_muted: "#475569",
        divider: "#e2e8f0"
    },
    typography: {
        heading_family: "Inter",
        body_family: "Inter",
        base_size: "11pt",
        line_height: "1.5",
        heading_weight: "700",
        section_spacing: "2rem",
        item_spacing: "1rem"
    },
    section_configs: {
        summary: { visible: true, variant: 'Standard' },
        experience: { visible: true, variant: 'Standard' },
        skills: { visible: true, variant: 'Standard' },
        education: { visible: true, variant: 'Standard' },
        projects: { visible: true, variant: 'Standard' },
        certifications: { visible: true, variant: 'Standard' }
    },
    page_settings: {
        format: 'A4',
        margins: '20mm',
        scaling: 1.0
    }
};

export const sanitizeResumeData = (data: any): ResumeData => {
    const base = {
        id: data?.id || 'master',
        fullName: data?.fullName || '',
        role: data?.role || '',
        email: data?.email || '',
        phone: data?.phone || '',
        location: data?.location || '',
        linkedin: data?.linkedin || '',
        website: data?.website || '',
        contactInfo: data?.contactInfo || '',
        summary: data?.summary || '',
        skills: data?.skills || [],
        experience: data?.experience || [],
        projects: data?.projects || [],
        certifications: data?.certifications || [],
        education: data?.education || '',
        languages: data?.languages || [],
        achievements: data?.achievements || [],
        awards: data?.awards || [],
        interests: data?.interests || [],
        strengths: data?.strengths || [],
        sectionOrder: data?.sectionOrder || ['summary', 'experience', 'skills', 'education', 'projects', 'certifications'],
        visibleSections: data?.visibleSections || {},
        themeConfig: data?.themeConfig || { layout: 'Minimalist', font: 'Inter', accentColor: '#000000', pageSize: 'A4', density: 'Standard', targetPageCount: 1 },
        style: data?.style || 'Base',
        design: data?.design || 'Executive'
    };
    return base;
};

export const analyzeJobDescription = async (text: string): Promise<JobAnalysis> => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: analysisModel,
        contents: `Analyze this job description: ${text}`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    company: { type: Type.STRING },
                    industry: { type: Type.STRING },
                    requiredSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
                    optionalSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
                    seniorityLevel: { type: Type.STRING },
                    leadershipRequired: { type: Type.BOOLEAN },
                    summary: { type: Type.STRING },
                    experienceLevel: { type: Type.STRING },
                    hiringProbability: { type: Type.NUMBER },
                    hiringReasoning: { type: Type.STRING },
                    companyInsights: { type: Type.STRING }
                }
            }
        }
    });
    return { ...JSON.parse(response.text), rawText: text, keywords: [] };
};

export const calculateATSScore = async (r: ResumeData, j: JobAnalysis): Promise<ATSScore> => {
    // Simplified simulation for speed, in prod this would check keyword overlap
    const keywords = j.requiredSkills.filter(k => r.skills.some(s => s.toLowerCase().includes(k.toLowerCase()))).length;
    const score = Math.min(100, Math.round((keywords / j.requiredSkills.length) * 100));
    
    return { 
        total: score, 
        breakdown: { keywords: Math.min(10, Math.floor(score/10)), impact: 8, quantifiable: 7, format: 9, structure: 8 }, 
        suggestions: j.requiredSkills.filter(k => !r.skills.some(s => s.toLowerCase().includes(k.toLowerCase()))).slice(0, 3).map(k => `Add experience with ${k}`) 
    };
};

export const analyzeSkillsGap = async (rs: string[], js: string[]): Promise<SkillMatch[]> => {
    return js.map(s => ({ skill: s, status: rs.some(r => r.toLowerCase().includes(s.toLowerCase())) ? 'match' : 'missing' }));
};

export const updateResumeWithAI = async (r: ResumeData, instruction: string): Promise<ResumeData> => {
    const ai = getAI();
    const prompt = `
    Act as an expert Resume Writer. 
    Update the following Resume JSON based on the user's instruction.
    
    INSTRUCTION: "${instruction}"
    
    CURRENT RESUME JSON:
    ${JSON.stringify(r)}
    
    Return the fully updated Resume JSON. Do not lose any existing data unless instructed.
    `;

    const response = await ai.models.generateContent({
        model: complexModel, 
        contents: prompt,
        config: { responseMimeType: "application/json" }
    });
    
    try {
        return JSON.parse(response.text);
    } catch(e) {
        console.error("Failed to parse AI update", e);
        return r;
    }
};

export const getInlineSuggestion = async (text: string, context: string): Promise<{ suggestion: string }> => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: analysisModel,
        contents: `Improve this resume bullet point: "${text}"`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: { suggestion: { type: Type.STRING } }
            }
        }
    });
    return JSON.parse(response.text);
};

// Stubs for other functionalities to ensure app compiles
export const assembleSmartResume = async (p: any, j: any): Promise<ResumeData[]> => [p.masterResume];
export const generateTailoredResume = async (r: any, j: any): Promise<ResumeData[]> => [r];
export const analyzeBias = async (r: any): Promise<BiasAnalysis> => ({ riskScore: 0, overallAssessment: 'Safe', items: [] });
export const generateCareerInsights = async (p: UserProfile): Promise<any> => ({ opportunities: [] });
export const generateLinkedInProfile = async (r: any): Promise<any> => ({ headline: r.role, about: r.summary, experienceHooks: [], featuredSkills: r.skills });
export const analyzeSalary = async (j: any): Promise<any> => ({ estimatedRange: { min: 80000, max: 120000, currency: 'USD' }, marketTrend: 'Stable', reasoning: 'Standard range', negotiationTips: [], scripts: { screening: '', counterOffer: '' } });
export const generateNetworkingStrategy = async (j: any): Promise<any> => ({ targetRoles: [], outreachTemplates: [] });
export const getInterviewQuestion = async (j: any, p: any): Promise<string> => "Tell me about yourself.";
export const evaluateInterviewAnswer = async (q: any, a: any): Promise<any> => ({ rating: 80, strengths: ['Clear'], improvements: ['More detail'] });
export const getJobRecommendations = async (r: any): Promise<any[]> => [];
export const generateCoverLetter = async (r: any, j: any, t: any): Promise<string> => `Dear Hiring Manager,\n\nI am applying for the ${j.title} role.`;
export const parseResumeFromText = async (t: any): Promise<ResumeData> => sanitizeResumeData({ summary: t.slice(0,200) });
export const generateProbingQuestion = async (r: any, j: any, p: any, t?: any): Promise<any> => ({ question: 'What did you do?', targetSkill: 'General', reasoning: 'Context' });
export const transformAnswerToBullet = async (q: any, a: any, r: any): Promise<any> => ({ improvedBullet: a, suggestedSection: 'experience' });
export const findVisaSponsoringJobs = async (f: any): Promise<any[]> => [];
export const analyzeJobMarketTrends = async (j: any, q: any): Promise<any> => ({ demandLevel: 'Medium', salaryTrend: 'Stable', topSkills: [] });
export const runBiasAudit = async (r: any): Promise<any> => ({ originalScore: 85, blindScore: 85, variance: 0, isBiased: false, reasoning: 'No bias detected' });
export const extractAchievements = async (c: any, s: any): Promise<any[]> => [];
export const updateMasterProfile = async (p: any, u: any): Promise<any> => p;
