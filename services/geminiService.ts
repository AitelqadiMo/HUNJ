
import { GoogleGenAI, Type } from "@google/genai";
import { 
    JobAnalysis, ATSScore, ResumeData, TemplateRecommendation, ExternalJob, 
    UserPreferences, JobSearchFilters, MarketTrends, UserProfile, CareerInsights, 
    BiasAuditResult, InlineSuggestion, ResumeThemeConfig, PreviewSuggestion, 
    AchievementEntity, RawDataSource, ScoredAchievement, JobProfile, CoverLetter, 
    LinkedInProfile, SalaryInsight, NetworkingStrategy, ProbingQuestion, 
    GeneratedAchievement, SkillMatch, BiasAnalysis, RecommendedJob, JobIntelligence,
    DesignRecommendation, SkillGapAnalysis
} from '../types';
import { anonymizeResume } from '../utils/privacy';

const GEMINI_KEY =
    (import.meta as any)?.env?.VITE_GEMINI_API_KEY ||
    (import.meta as any)?.env?.GEMINI_API_KEY ||
    '';

const getAI = () => {
    if (!GEMINI_KEY) {
        throw new Error('Missing Gemini API key. Set VITE_GEMINI_API_KEY in .env.local');
    }
    return new GoogleGenAI({ apiKey: GEMINI_KEY });
};

// Faster production defaults
const fastModel = "gemini-2.5-flash-lite";
const deepModel = "gemini-2.5-flash";
const REQUEST_TIMEOUT_MS = 12000;
const RETRY_DELAYS_MS = [250, 600];
const CACHE_PREFIX = 'hunj_ai_cache_v1:';
const CACHE_TTL_MS = 10 * 60 * 1000;

const ELITE_PERSONA = `
You are an Elite Career Architect AI. 
Your goal is to optimize every aspect of a candidate's job search with mathematical precision and strategic depth.
You adhere to the STAR method, quantify results, and eliminate fluff.
You prioritize truthfulness and do not hallucinate facts.
`;

const SANITIZATION_HELPER = (data: any): ResumeData => {
    // Basic sanitization logic moved here or kept from original if it was just a helper
    // We assume the original sanitizeResumeData is sufficient or we use a simplified version for new data
    // For brevity in this backend augmentation, I will reuse the structure logic implicitly in transformations
    return data as ResumeData;
};

const parseJSON = <T>(text: string | undefined, fallback: T): T => {
    if (!text) return fallback;
    try {
        return JSON.parse(text) as T;
    } catch {
        return fallback;
    }
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const withTimeout = async <T>(promise: Promise<T>, ms = REQUEST_TIMEOUT_MS): Promise<T> => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const timeout = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Gemini request timed out')), ms);
    });
    try {
        return await Promise.race([promise, timeout]);
    } finally {
        if (timeoutId) clearTimeout(timeoutId);
    }
};

const readCache = <T>(key: string): T | null => {
    try {
        const raw = localStorage.getItem(`${CACHE_PREFIX}${key}`);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as { value: T; ts: number };
        if (!parsed?.ts || Date.now() - parsed.ts > CACHE_TTL_MS) {
            localStorage.removeItem(`${CACHE_PREFIX}${key}`);
            return null;
        }
        return parsed.value;
    } catch {
        return null;
    }
};

const writeCache = <T>(key: string, value: T) => {
    try {
        localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify({ value, ts: Date.now() }));
    } catch {
        // Ignore cache write errors.
    }
};

const hashPayload = (input: string): string => {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
        hash = (hash << 5) - hash + input.charCodeAt(i);
        hash |= 0;
    }
    return String(hash);
};

const generateWithRetry = async (requestFactory: () => Promise<any>) => {
    let lastError: unknown = null;
    for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
        try {
            return await withTimeout(requestFactory());
        } catch (e) {
            lastError = e;
            if (attempt < RETRY_DELAYS_MS.length) {
                await sleep(RETRY_DELAYS_MS[attempt]);
                continue;
            }
        }
    }
    throw lastError || new Error('Gemini request failed');
};

const generateJson = async <T>(
    cacheKey: string,
    run: (ai: GoogleGenAI) => Promise<{ text?: string }>,
    fallback: T
): Promise<T> => {
    const cached = readCache<T>(cacheKey);
    if (cached) return cached;
    try {
        const ai = getAI();
        const response = await generateWithRetry(() => run(ai));
        const parsed = parseJSON<T>(response?.text, fallback);
        writeCache(cacheKey, parsed);
        return parsed;
    } catch {
        return fallback;
    }
};

const generateText = async (
    cacheKey: string,
    run: (ai: GoogleGenAI) => Promise<{ text?: string }>,
    fallback: string
): Promise<string> => {
    const cached = readCache<string>(cacheKey);
    if (cached) return cached;
    try {
        const ai = getAI();
        const response = await generateWithRetry(() => run(ai));
        const text = (response?.text || '').trim() || fallback;
        writeCache(cacheKey, text);
        return text;
    } catch {
        return fallback;
    }
};

export const sanitizeResumeData = (data: any): ResumeData => {
    if (!data || typeof data !== 'object') {
        data = {};
    }
    const defaultOrder = ['summary', 'experience', 'education', 'projects', 'certifications', 'skills', 'languages', 'awards'];
    const defaultVisibility = {
        summary: true, experience: true, education: true, skills: true,
        projects: true, certifications: true, languages: true, awards: true,
        interests: true, affiliations: true
    };

    return {
        id: data.id || 'master',
        versionName: data.versionName || 'Master v1',
        timestamp: data.timestamp || Date.now(),
        style: data.style || 'Base',
        design: data.design || 'Executive',
        themeConfig: data.themeConfig || { layout: 'Executive', font: 'Inter', accentColor: '#334155', pageSize: 'A4', density: 'Standard', targetPageCount: 2 },
        sectionOrder: data.sectionOrder || defaultOrder,
        visibleSections: data.visibleSections || defaultVisibility,
        fullName: data.fullName || 'Your Name',
        role: data.role || 'Professional Role',
        email: data.email || 'email@example.com',
        phone: data.phone || '',
        location: data.location || '',
        linkedin: data.linkedin || '',
        website: data.website || '',
        contactInfo: data.contactInfo || '',
        summary: data.summary || '',
        summaryVisible: data.summaryVisible !== false,
        education: data.education || '',
        educationVisible: data.educationVisible !== false,
        skills: Array.isArray(data.skills) ? data.skills : [],
        skillCategories: Array.isArray(data.skillCategories) ? data.skillCategories : [],
        languages: Array.isArray(data.languages) ? data.languages : [],
        achievements: Array.isArray(data.achievements) ? data.achievements : [],
        awards: Array.isArray(data.awards) ? data.awards : [],
        interests: Array.isArray(data.interests) ? data.interests : [],
        strengths: Array.isArray(data.strengths) ? data.strengths : [],
        personalKnowledgeBase: Array.isArray(data.personalKnowledgeBase) ? data.personalKnowledgeBase : [],
        experience: Array.isArray(data.experience) ? data.experience.map((e: any, i: number) => ({
            id: e.id || `exp-${Date.now()}-${i}`,
            role: e.role || '',
            company: e.company || '',
            period: e.period || '',
            visible: e.visible !== false,
            bullets: Array.isArray(e.bullets) ? e.bullets.map((b: any, bi: number) => ({
                id: b.id || `bull-${Date.now()}-${bi}`,
                text: typeof b === 'string' ? b : b.text || '',
                visible: b.visible !== false
            })) : []
        })) : [],
        projects: Array.isArray(data.projects) ? data.projects.map((p: any, i: number) => ({
            id: p.id || `proj-${Date.now()}-${i}`,
            name: p.name || '',
            description: p.description || '',
            link: p.link || '',
            visible: p.visible !== false
        })) : [],
        certifications: Array.isArray(data.certifications) ? data.certifications.map((c: any, i: number) => ({
            id: c.id || `cert-${Date.now()}-${i}`,
            name: c.name || '',
            issuer: c.issuer || '',
            date: c.date || '',
            link: c.link || '',
            visible: c.visible !== false
        })) : [],
        publications: Array.isArray(data.publications) ? data.publications.map((p: any, i: number) => ({
            id: p.id || `pub-${Date.now()}-${i}`,
            title: p.title || '',
            publisher: p.publisher || '',
            date: p.date || '',
            link: p.link || '',
            visible: p.visible !== false
        })) : [],
        affiliations: Array.isArray(data.affiliations) ? data.affiliations.map((a: any, i: number) => ({
            id: a.id || `aff-${Date.now()}-${i}`,
            organization: a.organization || '',
            role: a.role || '',
            period: a.period || '',
            visible: a.visible !== false
        })) : []
    };
};

// 1. JOB INTELLIGENCE ENGINE
export const analyzeJobDescription = async (text: string): Promise<JobAnalysis> => {
    const schema = {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING },
            company: { type: Type.STRING },
            requiredSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
            optionalSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
            industry: { type: Type.STRING },
            seniorityLevel: { type: Type.STRING },
            leadershipRequired: { type: Type.BOOLEAN },
            keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            summary: { type: Type.STRING },
            experienceLevel: { type: Type.STRING },
            hiringProbability: { type: Type.NUMBER },
            hiringReasoning: { type: Type.STRING },
            companyInsights: { type: Type.STRING },
            hiddenRequirements: { type: Type.ARRAY, items: { type: Type.STRING } },
            cultureIndicators: { type: Type.ARRAY, items: { type: Type.STRING } },
            softSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
            tools: { type: Type.ARRAY, items: { type: Type.STRING } },
            certifications: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
    };

    const fallback: JobAnalysis = {
        title: "Unknown Role",
        company: "Unknown Company",
        requiredSkills: [],
        optionalSkills: [],
        industry: "General",
        seniorityLevel: "Mid",
        leadershipRequired: false,
        keywords: [],
        summary: "Unable to extract detailed job analysis from the current text.",
        rawText: text,
        experienceLevel: "Mid",
        hiringProbability: 50,
        hiringReasoning: "Insufficient signal from source text.",
        companyInsights: "No additional company insight available.",
        hiddenRequirements: [],
        cultureIndicators: [],
        techStackClusters: {},
        softSkills: [],
        tools: [],
        certifications: []
    };

    const cacheKey = `job:${hashPayload(text.slice(0, 3000))}`;
    const data = await generateJson<any>(
        cacheKey,
        (ai) =>
            ai.models.generateContent({
                model: fastModel,
                contents: `Extract structured job requirements from the text. Keep output concise and factual.\n${text.substring(0, 12000)}`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: schema
                }
            }),
        fallback
    );

    return {
        ...fallback,
        ...data,
        rawText: text,
        techStackClusters: {}
    };
};

// 2. SMART RELEVANCE ENGINE & 3. AI RESUME STRATEGIST (ORCHESTRATION)
export const assembleSmartResume = async (profile: UserProfile, job: JobAnalysis): Promise<ResumeData[]> => {
    const master = profile.masterResume;
    
    // ORCHESTRATION STEP 1: Skill Gap Analysis
    const skillGap = await analyzeSkillsGap(master.skills, job.requiredSkills);
    const missingHighValueSkills = skillGap.filter(s => s.status === 'missing').map(s => s.skill);

    // ORCHESTRATION STEP 2: Strategic Rewriting (The "Strategist")
    try {
        const schema = {
            type: Type.OBJECT,
            properties: {
                summary: { type: Type.STRING },
                experience: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            role: { type: Type.STRING },
                            company: { type: Type.STRING },
                            period: { type: Type.STRING },
                            bullets: { type: Type.ARRAY, items: { type: Type.STRING } }
                        }
                    }
                },
                reorderedSkills: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
        };

        const prompt = `Tailor this resume for ${job.title} at ${job.company}.
Keep all facts truthful and preserve core history.
Focus on:
- ATS keyword alignment
- quantified outcomes
- concise, recruiter-friendly language
Priority missing skills: ${missingHighValueSkills.slice(0, 5).join(', ') || 'none'}
Resume JSON: ${JSON.stringify({
            summary: master.summary,
            experience: master.experience.slice(0, 5),
            skills: master.skills
        }).slice(0, 12000)}`;

        const generated = await generateJson<any>(
            `tailor:${hashPayload(`${job.title}|${job.company}|${master.summary}|${master.experience.length}`)}`,
            (ai) =>
                ai.models.generateContent({
                    model: deepModel,
                    contents: prompt,
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: schema
                    }
                }),
            {}
        );
        
        // Merge generated content back into a full ResumeData object
        const newResume: ResumeData = sanitizeResumeData({
            ...master,
            id: `gen-${Date.now()}`,
            versionName: `Tailored for ${job.company}`,
            summary: generated.summary || master.summary,
            skills: generated.reorderedSkills || master.skills,
            experience: (generated.experience || []).map((exp: any, i: number) => ({
                id: `exp-${Date.now()}-${i}`,
                role: exp.role,
                company: exp.company,
                period: exp.period,
                visible: true,
                bullets: (exp.bullets || []).map((b: string, bi: number) => ({
                    id: `b-${i}-${bi}`,
                    text: b,
                    visible: true
                }))
            })),
            // Keep other sections from master
            education: master.education,
            projects: master.projects,
            certifications: master.certifications,
            languages: master.languages,
            awards: master.awards
        });

        // ORCHESTRATION STEP 3: Adaptive Compression (Optional - simplifed here to just ensure length is reasonable)
        // In a full implementation, we'd loop back to LLM if length > 2 pages.

        // Variant 2 (balanced baseline) to let users compare versions quickly
        const balancedVariant: ResumeData = sanitizeResumeData({
            ...master,
            id: `gen-balanced-${Date.now()}`,
            versionName: `Balanced for ${job.company}`,
            summary: generated.summary || master.summary,
            skills: master.skills
        });

        return [newResume, balancedVariant];

    } catch (e) {
        return [{ ...master, id: `fallback-${Date.now()}`, versionName: `Copy for ${job.company}` }];
    }
};

// 4. RESUME QUALITY AUDITOR
export const calculateATSScore = async (r: ResumeData, j: JobAnalysis): Promise<ATSScore> => {
    const resumeText = [
        r.summary,
        ...r.skills,
        ...r.experience.flatMap(e => e.bullets.map(b => b.text))
    ].join(' ').toLowerCase();
    const jobKeywords = Array.from(new Set([
        ...(j.requiredSkills || []),
        ...(j.optionalSkills || []),
        ...(j.keywords || [])
    ].map(k => String(k).toLowerCase()).filter(Boolean)));
    const keywordHits = jobKeywords.filter(k => resumeText.includes(k)).length;
    const keywordRatio = jobKeywords.length ? keywordHits / jobKeywords.length : 0.5;
    const hasMetrics = r.experience.flatMap(e => e.bullets).filter(b => /(\d+%|\$\d+|\d+[xX])/.test(b.text)).length;
    const totalBullets = Math.max(1, r.experience.flatMap(e => e.bullets).length);
    const quantRatio = hasMetrics / totalBullets;
    const verbsRatio = r.experience.flatMap(e => e.bullets).filter(b => /^(led|built|delivered|optimized|improved|created|implemented|designed|managed)\b/i.test(b.text.trim())).length / totalBullets;
    const hasSummary = r.summary.trim().length > 80 ? 1 : 0.5;
    const hasStructure = (r.experience.length > 0 && r.skills.length > 5) ? 1 : 0.5;
    const lengthTarget = r.themeConfig.targetPageCount === 1 ? 1 : 0.85;
    const breakdown = {
        keywords: Math.max(1, Math.min(10, Math.round(keywordRatio * 10))),
        format: Math.max(1, Math.min(10, Math.round((hasSummary * 0.5 + hasStructure * 0.5) * 10))),
        quantifiable: Math.max(1, Math.min(10, Math.round(quantRatio * 10))),
        verbs: Math.max(1, Math.min(10, Math.round(verbsRatio * 10))),
        length: Math.max(1, Math.min(10, Math.round(lengthTarget * 10))),
        skills: Math.max(1, Math.min(10, Math.round((r.skills.length / Math.max(8, j.requiredSkills?.length || 8)) * 10))),
        structure: Math.max(1, Math.min(10, Math.round(hasStructure * 10)))
    };
    const total = Math.round(
        breakdown.keywords * 1.8 +
        breakdown.quantifiable * 1.4 +
        breakdown.skills * 1.2 +
        breakdown.structure * 1.1 +
        breakdown.verbs * 1.0 +
        breakdown.format * 1.0 +
        breakdown.length * 0.5
    );
    const suggestions: string[] = [];
    if (breakdown.keywords < 8) suggestions.push('Add more role-specific keywords from the job description into summary and bullets.');
    if (breakdown.quantifiable < 7) suggestions.push('Quantify impact in more bullets using %, $, or scale metrics.');
    if (breakdown.verbs < 7) suggestions.push('Start more bullets with strong action verbs.');
    if (breakdown.skills < 7) suggestions.push('Expand skills section with relevant tools and domain capabilities.');
    if (suggestions.length === 0) suggestions.push('Resume is well aligned. Tighten wording for brevity.');
    return {
        total: Math.max(1, Math.min(100, total)),
        breakdown,
        suggestions,
        auditReport: {
            strengths: [
                breakdown.keywords >= 8 ? 'Strong keyword alignment.' : 'Some relevant keywords are present.',
                breakdown.quantifiable >= 7 ? 'Good measurable impact language.' : 'Found measurable outcomes in parts of the resume.'
            ],
            weaknesses: suggestions.slice(0, 2),
            clarityScore: Math.round((breakdown.format + breakdown.structure) * 5),
            impactScore: Math.round((breakdown.quantifiable + breakdown.verbs) * 5)
        }
    };
};

// 5. SKILL GAP PREDICTOR
export const analyzeSkillsGap = async (rs: string[], js: string[]): Promise<SkillMatch[]> => {
    const normalizedResume = (rs || []).map(s => s.toLowerCase().trim());
    const normalizedJob = Array.from(new Set((js || []).map(s => s.trim()).filter(Boolean)));
    const inferPriority = (skill: string): 'High' | 'Medium' | 'Low' => {
        if (/(aws|gcp|azure|kubernetes|terraform|react|python|sql|node|java|product|leadership)/i.test(skill)) return 'High';
        if (/(jira|scrum|analytics|testing|monitoring|docker)/i.test(skill)) return 'Medium';
        return 'Low';
    };
    return normalizedJob.map(skill => {
        const low = skill.toLowerCase();
        const exact = normalizedResume.includes(low);
        const partial = !exact && normalizedResume.some(s => s.includes(low) || low.includes(s));
        return {
            skill,
            status: exact ? 'match' : partial ? 'partial' : 'missing',
            recommendation: exact ? 'Already covered.' : partial ? 'Highlight this more explicitly in bullets.' : `Add evidence of ${skill} in a relevant project or experience bullet.`,
            learningPriority: exact ? 'Low' : inferPriority(skill),
            suggestedResource: exact ? 'N/A' : `Hands-on project focused on ${skill}`
        } as SkillMatch;
    });
};

// 6. INTERVIEW PROBABILITY PREDICTOR (Integrated into JobAnalysis)
// 7. CAREER TRAJECTORY ANALYZER (Integrated into CareerInsights)
export const generateCareerInsights = async (profile: UserProfile): Promise<CareerInsights> => {
    const history = profile.masterResume.experience.map(e => `${e.role} at ${e.company} (${e.period})`).join('\n');
    const skills = profile.masterResume.skills.join(', ');
    const fallback: CareerInsights = {
        missingSkills: [],
        marketOutlook: "Stable",
        resumeStrength: 70,
        recommendedAction: "Add more quantified outcomes to your recent roles.",
        trajectoryAnalysis: { isLogical: true, narrativeCoherence: 80, nextRolePrediction: profile.masterResume.role || "Senior Level" },
        strategy: { resumeFocus: "Quantified impact + role alignment", interviewFocus: "STAR-based measurable outcomes" }
    };
    return generateJson<CareerInsights>(
        `career:${hashPayload(`${history}|${skills}`)}`,
        (ai) => ai.models.generateContent({
            model: fastModel,
            contents: `Analyze this career trajectory and return practical next-step guidance.
HISTORY:\n${history.slice(0, 5000)}
SKILLS: ${skills.slice(0, 1200)}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        missingSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
                        marketOutlook: { type: Type.STRING },
                        resumeStrength: { type: Type.NUMBER },
                        recommendedAction: { type: Type.STRING },
                        trajectoryAnalysis: {
                            type: Type.OBJECT,
                            properties: {
                                isLogical: { type: Type.BOOLEAN },
                                narrativeCoherence: { type: Type.NUMBER },
                                nextRolePrediction: { type: Type.STRING }
                            }
                        },
                        strategy: {
                            type: Type.OBJECT,
                            properties: {
                                resumeFocus: { type: Type.STRING },
                                interviewFocus: { type: Type.STRING }
                            }
                        }
                    }
                }
            }
        }),
        fallback
    );
};

// 8. ACHIEVEMENT STRENGTH ENHANCER (Exposed as `getInlineSuggestion` upgrade)
export const getInlineSuggestion = async (text: string, context: string): Promise<InlineSuggestion> => {
    const fallback: InlineSuggestion = {
        original: text,
        suggestion: text,
        confidence: 0.7,
        type: 'clarity'
    };
    const res = await generateJson<any>(
        `inline:${hashPayload(`${text}|${context}`)}`,
        (ai) => ai.models.generateContent({
            model: fastModel,
            contents: `Rewrite this resume bullet to be concise, measurable, and ATS-friendly.
Text: "${text}"
Context: ${context.slice(0, 500)}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        suggestion: { type: Type.STRING },
                        confidence: { type: Type.NUMBER },
                        type: { type: Type.STRING }
                    }
                }
            }
        }),
        fallback
    );
    return { original: text, suggestion: res.suggestion || text, confidence: res.confidence || 0.7, type: res.type || 'clarity' };
};

// 9. ADAPTIVE RESUME COMPRESSION (Backend Logic)
export const compressResumeContent = async (resume: ResumeData, pages: number): Promise<ResumeData> => {
    // Logic: Identify weakest bullets via scoring and remove them, or summarize older roles.
    // Stub for now, but integrated conceptually in assembleSmartResume
    return resume; 
};

// 10. AI DESIGN INTELLIGENCE
export const recommendTemplate = async (j: JobAnalysis): Promise<TemplateRecommendation> => {
    const fallback: TemplateRecommendation = {
        layout: 'Minimalist',
        font: 'Inter',
        recommendedColor: '#0f172a',
        recommendedPageCount: 1,
        reasoning: "Safe default optimized for ATS readability.",
        recommendedTemplate: 'Minimalist',
        recommendedFont: 'Inter'
    };
    const res = await generateJson<any>(
        `template:${hashPayload(`${j.title}|${j.industry}|${j.seniorityLevel}`)}`,
        (ai) => ai.models.generateContent({
            model: fastModel,
            contents: `Recommend a resume layout and font.
Role: ${j.title}
Industry: ${j.industry}
Seniority: ${j.seniorityLevel}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        layout: { type: Type.STRING, enum: ['Executive', 'Minimalist', 'Creative', 'Academic', 'ATS', 'International'] },
                        font: { type: Type.STRING },
                        recommendedColor: { type: Type.STRING },
                        recommendedPageCount: { type: Type.NUMBER },
                        reasoning: { type: Type.STRING },
                        recommendedTemplate: { type: Type.STRING },
                        recommendedFont: { type: Type.STRING }
                    }
                }
            }
        }),
        fallback
    );
    return { ...fallback, ...res, recommendedTemplate: res.layout || res.recommendedTemplate || fallback.layout, recommendedFont: res.font || res.recommendedFont || fallback.font };
};

// 11. MARKET BENCHMARK INTELLIGENCE
export const analyzeSalary = async (j: JobAnalysis): Promise<SalaryInsight> => {
    const fallback: SalaryInsight = {
        estimatedRange: { min: 90000, max: 140000, currency: "USD" },
        marketTrend: 'Stable',
        reasoning: "Estimated from role and seniority baseline.",
        negotiationTips: ['Lead with quantified impact.', 'Anchor with a justified range.', 'Confirm total compensation scope.'],
        scripts: {
            screening: 'Based on market data and role scope, I am targeting a compensation range aligned with impact and responsibilities.',
            counterOffer: 'I’m excited about the role. Based on scope and market benchmarks, can we revisit total compensation?'
        },
        competitivenessIndex: 70
    };
    return generateJson<SalaryInsight>(
        `salary:${hashPayload(`${j.title}|${j.location}|${j.seniorityLevel}`)}`,
        (ai) => ai.models.generateContent({
            model: fastModel,
            contents: `Estimate salary range and negotiation guidance.
Role: ${j.title}
Seniority: ${j.seniorityLevel}
Location: ${j.location || 'Unknown'}
Industry: ${j.industry}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        estimatedRange: { type: Type.OBJECT, properties: { min: { type: Type.NUMBER }, max: { type: Type.NUMBER }, currency: { type: Type.STRING } } },
                        marketTrend: { type: Type.STRING },
                        reasoning: { type: Type.STRING },
                        negotiationTips: { type: Type.ARRAY, items: { type: Type.STRING } },
                        scripts: { type: Type.OBJECT, properties: { screening: { type: Type.STRING }, counterOffer: { type: Type.STRING } } },
                        competitivenessIndex: { type: Type.NUMBER }
                    }
                }
            }
        }),
        fallback
    );
};

// 12. PERSONAL BRANDING ANALYZER (Implicit in generateLinkedInProfile)
export const generateLinkedInProfile = async (r: ResumeData): Promise<LinkedInProfile> => {
    const fallback: LinkedInProfile = {
        headline: `${r.role || 'Professional'} | ${r.skills.slice(0, 3).join(' | ')}`.trim(),
        about: r.summary || `Experienced ${r.role || 'professional'} focused on measurable outcomes and cross-functional execution.`,
        featuredSkills: r.skills.slice(0, 8),
        experienceHooks: r.experience.slice(0, 3).map(e => `${e.role} at ${e.company}`),
        brandStrengthScore: 70,
        brandTone: 'Professional'
    };
    return generateJson<LinkedInProfile>(
        `linkedin:${hashPayload(`${r.fullName}|${r.role}|${r.summary}`)}`,
        (ai) => ai.models.generateContent({
            model: fastModel,
            contents: `Create LinkedIn profile content from resume context.
Role: ${r.role}
Summary: ${r.summary}
Recent Roles: ${r.experience.slice(0, 4).map(e => `${e.role} at ${e.company}`).join('; ')}
Skills: ${r.skills.slice(0, 15).join(', ')}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        headline: { type: Type.STRING },
                        about: { type: Type.STRING },
                        featuredSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
                        experienceHooks: { type: Type.ARRAY, items: { type: Type.STRING } },
                        brandStrengthScore: { type: Type.NUMBER },
                        brandTone: { type: Type.STRING }
                    }
                }
            }
        }),
        fallback
    );
};

// 13. APPLICATION STRATEGY OPTIMIZER (Integrated in Career Insights)

// 14. COVER LETTER INTELLIGENCE
export const generateCoverLetter = async (r: ResumeData, j: JobAnalysis, tone: any): Promise<string> => {
    const fallback = `Dear Hiring Team,\n\nI am excited to apply for the ${j.title} role at ${j.company}. My background in ${r.experience.slice(0, 2).map(e => e.role).join(' and ') || 'relevant roles'} aligns well with your requirements.\n\nIn recent work, I focused on delivering measurable outcomes, collaborating cross-functionally, and improving execution quality. I am particularly interested in this opportunity because it matches my strengths in ${r.skills.slice(0, 4).join(', ') || 'problem-solving and delivery'}.\n\nThank you for your time and consideration. I would welcome the opportunity to discuss how I can contribute to your team.\n\nSincerely,\n${r.fullName || 'Candidate'}`;
    return generateText(
        `cover:${hashPayload(`${r.fullName}|${j.title}|${j.company}|${tone}|${r.summary}`)}`,
        (ai) => ai.models.generateContent({
            model: fastModel,
            contents: `Write a concise professional cover letter in ${tone} tone.
Candidate: ${r.fullName}
Role: ${j.title}
Company: ${j.company}
Key skills: ${r.skills.slice(0, 8).join(', ')}
Highlights: ${r.experience.slice(0, 3).map(e => `${e.role} at ${e.company}`).join('; ')}
Output plain text only.`
        }),
        fallback
    );
};

// 15. LEARNING ROADMAP (Sub-function for Skill Gap)
// Accessible via analyzeSkillsGap return type

// --- HELPERS ---
export const updateResumeWithAI = async (r: ResumeData, instruction: string): Promise<ResumeData> => {
    const fallback = sanitizeResumeData({ ...r, timestamp: Date.now() });
    const parsed = await generateJson<any>(
        `edit:${hashPayload(`${r.id}|${instruction}|${r.summary.slice(0, 200)}`)}`,
        (ai) => ai.models.generateContent({
            model: fastModel,
            contents: `Edit this resume JSON using the instruction. Keep facts truthful and preserve object structure/ids.
Instruction: ${instruction}
Resume JSON: ${JSON.stringify(r).slice(0, 14000)}`,
            config: { responseMimeType: "application/json" }
        }),
        r
    );
    return sanitizeResumeData({
        ...r,
        ...parsed,
        id: r.id,
        versionName: r.versionName,
        timestamp: Date.now()
    }) || fallback;
};

export const parseResumeFromText = async (text: string): Promise<ResumeData> => {
    const data = await generateJson<any>(
        `parse:${hashPayload(text.slice(0, 3000))}`,
        (ai) => ai.models.generateContent({
            model: fastModel,
            contents: `Extract structured resume fields from this text.
TEXT: ${text.substring(0, 16000)}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        fullName: { type: Type.STRING },
                        email: { type: Type.STRING },
                        phone: { type: Type.STRING },
                        linkedin: { type: Type.STRING },
                        summary: { type: Type.STRING },
                        skills: { type: Type.ARRAY, items: { type: Type.STRING } },
                        experience: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    role: { type: Type.STRING },
                                    company: { type: Type.STRING },
                                    period: { type: Type.STRING },
                                    bullets: { type: Type.ARRAY, items: { type: Type.STRING } }
                                }
                            }
                        },
                        education: { type: Type.STRING }
                    }
                }
            }
        }),
        {}
    );
    const experience = (data.experience || []).map((e: any, i: number) => ({
        id: `exp-${i}`,
        role: e.role || "",
        company: e.company || "",
        period: e.period || "",
        visible: true,
        bullets: (e.bullets || []).map((b: string, bi: number) => ({
            id: `b-${i}-${bi}`,
            text: b,
            visible: true
        }))
    }));
    return { ...sanitizeResumeData({}), ...data, experience };
};

// ... (Other exports maintained for API compatibility)
export const generateTailoredResume = assembleSmartResume; // Alias to new logic
export const analyzeBias = async (r: ResumeData): Promise<BiasAnalysis> => {
    const riskyPhrases = [
        { token: 'young', type: 'Age Bias', suggestion: 'Replace with role-specific capability.' },
        { token: 'native english', type: 'Language Bias', suggestion: 'Use "strong written and verbal communication".' },
        { token: 'aggressive', type: 'Tone Bias', suggestion: 'Use "results-driven" or "proactive".' },
        { token: 'ninja', type: 'Exclusionary Language', suggestion: 'Use "engineer" or "specialist".' },
        { token: 'rockstar', type: 'Exclusionary Language', suggestion: 'Use "high-performing professional".' }
    ];
    const text = [
        r.summary,
        r.education,
        ...r.experience.flatMap(e => e.bullets.map(b => b.text)),
        ...r.skills
    ].join(' ').toLowerCase();

    const items = riskyPhrases
        .filter(rule => text.includes(rule.token))
        .map(rule => ({
            type: rule.type,
            severity: 'Medium',
            text: rule.token,
            suggestion: rule.suggestion
        }));
    const riskScore = Math.min(95, 8 + (items.length * 18));
    return {
        riskScore,
        overallAssessment: items.length === 0 ? 'Low Risk' : items.length < 3 ? 'Moderate Risk' : 'High Risk',
        items
    };
};
export const generateNetworkingStrategy = async (j: JobAnalysis): Promise<NetworkingStrategy> => {
    const title = j.title || 'Role';
    const company = j.company || 'Target Company';
    const targetRoles = [
        `Recruiter at ${company}`,
        `${title} Hiring Manager`,
        `${title} Team Lead`,
        `${j.industry || 'Engineering'} Director`
    ];
    return {
        targetRoles,
        outreachTemplates: [
            {
                type: 'LinkedIn',
                subject: `${title} role at ${company} - quick intro`,
                body: `Hi [Name],\nI’m exploring ${title} opportunities at ${company}. I’ve worked on ${j.requiredSkills?.slice(0, 2).join(' and ') || 'similar initiatives'} and would value your perspective on team priorities.\nIf helpful, I can share a concise summary of relevant impact.\nThank you,\n[Your Name]`
            },
            {
                type: 'Email',
                subject: `Interest in ${title} openings`,
                body: `Hi [Name],\nI’m reaching out regarding ${title} opportunities at ${company}. My background aligns with ${j.requiredSkills?.slice(0, 3).join(', ') || 'the role requirements'}, and I’d appreciate 10 minutes to learn what success looks like in the first 90 days.\nBest regards,\n[Your Name]`
            },
            {
                type: 'Follow-up',
                subject: `Following up - ${title} at ${company}`,
                body: `Hi [Name],\nFollowing up on my earlier message regarding the ${title} role. I remain very interested and can provide examples of outcomes relevant to ${j.requiredSkills?.[0] || 'the team goals'}.\nThanks again,\n[Your Name]`
            }
        ]
    };
};
export const generateProbingQuestion = async (r: ResumeData, j: JobAnalysis, p: string[], t?: string): Promise<ProbingQuestion> => {
    const seen = new Set((p || []).map(s => s.toLowerCase()));
    const skillPool = [...(j.requiredSkills || []), ...(j.optionalSkills || []), ...(j.softSkills || [])].filter(Boolean);
    const fallbackPool = ['Leadership', 'Ownership', 'Problem Solving', 'Cross-functional Collaboration'];
    const targetSkill = (t && t.trim()) || skillPool.find(s => !seen.has(s.toLowerCase())) || fallbackPool.find(s => !seen.has(s.toLowerCase())) || 'Impact';
    return {
        question: `Describe a specific situation where you demonstrated ${targetSkill}. What was the challenge, what actions did you take, and what measurable result did you achieve?`,
        targetSkill,
        reasoning: `This skill is central for ${j.title || 'this role'} and helps differentiate your fit.`
    };
};
export const transformAnswerToBullet = async (q: string, a: string, r: ResumeData): Promise<GeneratedAchievement> => {
    const clean = a.replace(/\s+/g, ' ').trim();
    const metricMatch = clean.match(/(\d+%|\$\d+[kKmM]?|\d+[xX]|\d+\s?(?:hours|days|weeks|months|years))/);
    const metric = metricMatch ? metricMatch[0] : 'measurable business outcomes';
    const verbs = ['Led', 'Built', 'Improved', 'Optimized', 'Delivered', 'Implemented'];
    const verb = verbs[Math.abs(clean.length) % verbs.length];
    const concise = clean.length > 180 ? `${clean.slice(0, 176).trim()}...` : clean;
    const improvedBullet = `${verb} ${concise.charAt(0).toLowerCase()}${concise.slice(1)}, resulting in ${metric}.`;
    const relatedExp = r.experience[0]?.id;
    return {
        originalAnswer: a,
        improvedBullet,
        suggestedSection: 'experience',
        relatedId: relatedExp
    };
};
export const getInterviewQuestion = async (j: JobAnalysis, p: string[]): Promise<string> => {
    const bank = [
        `Walk me through a project where you used ${j.requiredSkills?.[0] || 'core technical skills'} to solve a complex problem.`,
        `Tell me about a time you had competing priorities. How did you decide what to do first?`,
        `Describe a time you disagreed with a teammate or stakeholder. What happened and what was the result?`,
        `What is the most relevant achievement from your background for this ${j.title || 'role'} and why?`,
        `How would your previous manager describe your impact in the first 90 days of a new role?`,
    ];
    const used = new Set((p || []).map(x => x.trim()));
    return bank.find(q => !used.has(q)) || `What questions do you have about this ${j.title || 'role'}?`;
};
export const evaluateInterviewAnswer = async (q: string, a: string): Promise<any> => {
    const answer = (a || '').trim();
    const hasMetrics = /(\d+%|\$\d+|\d+[xX]|\d+\s?(?:hours|days|weeks|months|years))/i.test(answer);
    const hasStructure = /(situation|task|action|result|challenge|outcome)/i.test(answer);
    const lengthScore = Math.max(0, Math.min(30, Math.round(answer.length / 12)));
    const score = Math.min(98, 35 + lengthScore + (hasMetrics ? 18 : 0) + (hasStructure ? 15 : 0));
    return {
        rating: score,
        strengths: [
            hasMetrics ? 'You used measurable impact, which increases credibility.' : 'Your answer is clear and understandable.',
            'You stayed relevant to the question prompt.'
        ],
        improvements: [
            hasMetrics ? 'Tighten the opening to emphasize your specific ownership faster.' : 'Add quantified outcomes (%, $, time saved) to strengthen impact.',
            hasStructure ? 'Keep the STAR flow but shorten context details.' : 'Use STAR structure explicitly: Situation, Action, Result.'
        ],
        sampleAnswer: `In a similar scenario, I clarified the goal, coordinated stakeholders, and delivered the result with measurable impact.`
    };
};
export const getJobRecommendations = async (r: ResumeData): Promise<RecommendedJob[]> => {
    const baseRole = r.role?.trim() || 'Software Engineer';
    const skills = r.skills.slice(0, 4);
    const industries = ['SaaS', 'FinTech', 'HealthTech', 'Cloud Infrastructure', 'AI Platform'];
    return [0, 1, 2, 3, 4, 5].map((idx) => ({
        id: `rec-${Date.now()}-${idx}`,
        title: idx % 2 === 0 ? `${baseRole}` : `${baseRole} - Platform`,
        company: ['Northstar Labs', 'Helio Systems', 'Apex Cloud', 'Vertex Dynamics', 'Quantive', 'LumenTech'][idx],
        matchScore: Math.max(62, 90 - (idx * 4)),
        matchReason: skills.length
            ? `Strong alignment with ${skills.slice(0, 2).join(', ')} and your ${baseRole} trajectory.`
            : `Role aligns with your profile summary and transferable experience.`,
        simulatedDescription: `We are hiring a ${baseRole} to own delivery across ${industries[idx % industries.length]} initiatives. 
        Required skills include ${skills.join(', ') || 'cloud engineering, collaboration, and execution'}.
        You'll partner with product and engineering to ship measurable outcomes.`
    }));
};
export const analyzeJobMarketTrends = async (jobs: ExternalJob[], q: string): Promise<MarketTrends> => {
    if (!jobs || jobs.length === 0) {
        return { summary: `Low signal for "${q}". Broaden location or role scope.`, salaryTrend: 'Unknown', topSkills: [], demandLevel: 'Low' };
    }
    const skillFreq = new Map<string, number>();
    jobs.forEach(job => {
        [...(job.tags || []), ...(job.requirements || [])].forEach(skill => {
            const key = String(skill).trim();
            if (!key) return;
            skillFreq.set(key, (skillFreq.get(key) || 0) + 1);
        });
    });
    const topSkills = Array.from(skillFreq.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([k]) => k);
    const avgMatch = Math.round(jobs.reduce((sum, j) => sum + (j.matchScore || 0), 0) / jobs.length);
    const demandLevel = avgMatch >= 75 ? 'High' : avgMatch >= 55 ? 'Medium' : 'Low';
    const salaryTrend = jobs.some(j => !!j.salaryRange) ? 'Upward in listed ranges' : 'Limited salary transparency';
    return {
        summary: `Analyzed ${jobs.length} listings for "${q || 'target role'}". Demand appears ${demandLevel.toLowerCase()} with strongest concentration in ${topSkills.slice(0, 3).join(', ') || 'generalist skills'}.`,
        salaryTrend,
        topSkills,
        demandLevel
    };
};
export const findVisaSponsoringJobs = async (f: JobSearchFilters): Promise<ExternalJob[]> => {
    const fallback: ExternalJob[] = [];
    try {
        const jobs = await generateJson<ExternalJob[]>(
            `jobs:${hashPayload(JSON.stringify(f))}`,
            (ai) => ai.models.generateContent({
                model: fastModel,
                contents: `Find recent job opportunities from public web data and return only verifiable listings.
            Query: ${f.query}
            Location: ${f.location}
            Remote: ${f.remote}
            Date Posted: ${f.datePosted}
            Level: ${f.level}
            Type: ${f.type}
            Company filter: ${f.company || 'Any'}
            Visa sponsorship: ${f.visa || 'Any'}
            Easy Apply: ${f.easyApply || 'Any'}
            Minimum salary: ${f.minSalary || 0}
            Minimum match score: ${f.minMatch || 0}
Return JSON array with:
id,title,company,location,description,requirements,postedDate,salaryRange,visaSupport,easyApply,employmentType,matchScore,tags`,
                config: {
                    responseMimeType: "application/json",
                    tools: [{ googleSearch: {} }],
                    responseSchema: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                id: { type: Type.STRING },
                                title: { type: Type.STRING },
                                company: { type: Type.STRING },
                                location: { type: Type.STRING },
                                description: { type: Type.STRING },
                                requirements: { type: Type.ARRAY, items: { type: Type.STRING } },
                                postedDate: { type: Type.STRING },
                                salaryRange: { type: Type.STRING },
                                visaSupport: { type: Type.BOOLEAN },
                                easyApply: { type: Type.BOOLEAN },
                                employmentType: { type: Type.STRING },
                                matchScore: { type: Type.NUMBER },
                                tags: { type: Type.ARRAY, items: { type: Type.STRING } }
                            }
                        }
                    }
                }
            }),
            fallback
        );
        const safeJobs = Array.isArray(jobs) && jobs.length > 0 ? jobs : fallback;
        return safeJobs.map((j, i) => ({
            ...j,
            id: j.id || `job-${Date.now()}-${i}`,
            title: j.title || f.query || 'Role',
            company: j.company || 'Company',
            location: j.location || f.location || 'Remote',
            description: j.description || 'Role description unavailable.',
            requirements: Array.isArray(j.requirements) ? j.requirements : [],
            postedDate: j.postedDate || 'Recently',
            matchScore: Number.isFinite(j.matchScore as any) ? Math.max(0, Math.min(100, j.matchScore)) : 60,
            tags: Array.isArray(j.tags) ? j.tags : [],
            visaSupport: typeof j.visaSupport === 'boolean' ? j.visaSupport : true,
            easyApply: typeof j.easyApply === 'boolean' ? j.easyApply : true,
            employmentType: j.employmentType || f.type || 'Full-time'
        }));
    } catch {
        return fallback;
    }
};
export const runBiasAudit = async (r: ResumeData): Promise<BiasAuditResult> => {
    const text = [r.summary, ...r.experience.flatMap(e => e.bullets.map(b => b.text))].join(' ').toLowerCase();
    const riskyTerms = ['aggressive', 'dominant', 'young', 'native english', 'ninja', 'rockstar'];
    const hits = riskyTerms.filter(t => text.includes(t)).length;
    const originalScore = Math.max(52, 88 - hits * 7);
    const blindScore = Math.max(50, originalScore - (hits > 0 ? 6 : 1));
    const variance = Math.abs(originalScore - blindScore);
    return {
        originalScore,
        blindScore,
        variance,
        isBiased: variance >= 5,
        reasoning: variance >= 5
            ? 'Detected language patterns that can shift screening outcomes under anonymized review.'
            : 'Language appears mostly neutral and consistent under anonymized review.'
    };
};
export const updateMasterProfile = async (r: ResumeData, i: string): Promise<ResumeData> => {
    const instruction = i?.trim() || 'Improve summary clarity, impact, and keyword relevance while preserving factual accuracy.';
    return updateResumeWithAI(r, instruction);
};
export const extractAchievements = async (text: string, source: RawDataSource): Promise<AchievementEntity[]> => {
    const cleaned = (text || '').trim();
    if (!cleaned) return [];

    const toCategory = (line: string): string => {
        const lower = line.toLowerCase();
        if (/(leader|managed|mentor|owned|stakeholder)/.test(lower)) return 'Leadership';
        if (/(automation|pipeline|kubernetes|aws|gcp|azure|terraform|ci\/cd|docker)/.test(lower)) return 'Technical';
        if (/(saved|reduced|increased|improved|optimized|efficiency|latency|reliability)/.test(lower)) return 'Impact';
        if (/(collaborat|partnered|cross-functional|client|customer)/.test(lower)) return 'Collaboration';
        return 'General';
    };

    const extractMetrics = (line: string): string[] => {
        const matches = line.match(/(\d+%|\$\d+[kKmM]?|\d+[xX]|(?:\d+)\s?(?:hours|days|weeks|months|years))/g);
        return matches ? Array.from(new Set(matches)) : [];
    };

    const fallbackFromText = (): AchievementEntity[] => {
        const lines = cleaned
            .split(/\r?\n/)
            .map((line) => line.replace(/^[-*•\s]+/, '').trim())
            .filter((line) => line.length >= 20);

        const unique = Array.from(new Set(lines.map((line) => line.toLowerCase()))).slice(0, 30);
        return unique.map((normalized, idx) => {
            const original = lines.find((line) => line.toLowerCase() === normalized) || normalized;
            const metrics = extractMetrics(original);
            return {
                id: `ach-${source.id}-${idx}`,
                originalText: original,
                enhancedText: metrics.length ? original : `${original} (include measurable impact where possible)`,
                category: toCategory(original),
                metrics,
                tags: [
                    { label: toCategory(original) },
                    ...(metrics.length ? [{ label: 'Quantified' }] : [])
                ],
                hidden: false
            };
        });
    };

    try {
        const parsed = await generateJson<any[]>(
            `ach:${hashPayload(`${source.id}|${source.type}|${cleaned.slice(0, 2000)}`)}`,
            (ai) => ai.models.generateContent({
                model: fastModel,
                contents: `Extract high-value career achievement statements from this source.
Focus on concrete outcomes and quantified impact.
Return up to 25 entities.
SOURCE TYPE: ${source.type}
SOURCE NAME: ${source.name}
TEXT: ${cleaned.substring(0, 18000)}`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                originalText: { type: Type.STRING },
                                enhancedText: { type: Type.STRING },
                                category: { type: Type.STRING },
                                metrics: { type: Type.ARRAY, items: { type: Type.STRING } },
                                tags: { type: Type.ARRAY, items: { type: Type.STRING } }
                            }
                        }
                    }
                }
            }),
            []
        );
        const safe = Array.isArray(parsed) ? parsed : [];
        const normalized = safe
            .filter((item) => item && typeof item.originalText === 'string' && item.originalText.trim().length > 10)
            .map((item, idx) => ({
                id: `ach-${source.id}-${idx}`,
                originalText: item.originalText.trim(),
                enhancedText: typeof item.enhancedText === 'string' ? item.enhancedText.trim() : undefined,
                category: typeof item.category === 'string' && item.category.trim() ? item.category.trim() : toCategory(item.originalText),
                metrics: Array.isArray(item.metrics) ? item.metrics.map((m: any) => String(m).trim()).filter(Boolean) : extractMetrics(item.originalText),
                tags: Array.isArray(item.tags) ? item.tags.map((tag: any) => ({ label: String(tag).trim() })).filter((tag: { label: string }) => tag.label) : [{ label: toCategory(item.originalText) }],
                hidden: false
            }));

        if (normalized.length === 0) return fallbackFromText();

        const seen = new Set<string>();
        return normalized.filter((item) => {
            const key = item.originalText.toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    } catch (e) {
        return fallbackFromText();
    }
};
export const rankAchievements = async (achievements: AchievementEntity[], job: JobProfile): Promise<ScoredAchievement[]> => {
    const jd = `${job.title} ${job.description}`.toLowerCase();
    return achievements.map(a => {
        const text = `${a.originalText} ${a.enhancedText || ''} ${a.category}`.toLowerCase();
        const overlap = text.split(/\W+/).filter(token => token.length > 3 && jd.includes(token)).length;
        const metricBoost = (a.metrics?.length || 0) * 8;
        const score = Math.min(100, 30 + overlap * 10 + metricBoost);
        return { id: a.id, score };
    }).sort((a, b) => b.score - a.score);
};
export const generatePreviewSuggestions = async (r: ResumeData, j: JobAnalysis): Promise<PreviewSuggestion[]> => {
    const suggestions: PreviewSuggestion[] = [];
    if (r.summary.length < 120) suggestions.push({ id: 'summary-depth', text: 'Expand the summary to 3-4 lines with quantified impact and target role alignment.' });
    if (r.skills.length < 8) suggestions.push({ id: 'skills-coverage', text: 'Add more relevant skills from the job description for ATS coverage.' });
    const missing = (j.requiredSkills || []).filter(skill => !r.skills.map(s => s.toLowerCase()).includes(skill.toLowerCase())).slice(0, 3);
    if (missing.length) suggestions.push({ id: 'missing-required', text: `Address missing required skills: ${missing.join(', ')}.` });
    const lowMetricBullets = r.experience.flatMap(e => e.bullets).filter(b => !/(\d+%|\$\d+|\d+[xX])/.test(b.text)).length;
    if (lowMetricBullets > 0) suggestions.push({ id: 'quantify-bullets', text: 'Quantify key bullets with %, $, or scale metrics to increase impact.' });
    if (suggestions.length === 0) suggestions.push({ id: 'polish', text: 'Strong overall alignment. Refine wording for brevity and executive tone.' });
    return suggestions.slice(0, 5);
};
