
import {
    JobAnalysis, ATSScore, ResumeData, TemplateRecommendation, ExternalJob,
    UserPreferences, JobSearchFilters, MarketTrends, UserProfile, CareerInsights,
    BiasAuditResult, InlineSuggestion, ResumeThemeConfig, PreviewSuggestion,
    AchievementEntity, RawDataSource, ScoredAchievement, JobProfile, CoverLetter,
    LinkedInProfile, SalaryInsight, NetworkingStrategy, ProbingQuestion,
    GeneratedAchievement, SkillMatch, BiasAnalysis, RecommendedJob
} from '../types';
import { anonymizeResume } from '../utils/privacy';
import { authService } from './authService';

// ---------------------------------------------------------------------------
// Server API Proxy Layer
// All AI calls go through the Express backend. No Gemini key on the client.
// ---------------------------------------------------------------------------

const AI_API_BASE =
    (import.meta as any)?.env?.VITE_AI_API_BASE ||
    (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8787');

const CACHE_PREFIX = 'hunj_ai_cache_v1:';
const CACHE_TTL_MS = 10 * 60 * 1000;

// --- Caching helpers (localStorage) ---
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
    } catch { /* ignore */ }
};

const hashPayload = (input: string): string => {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
        hash = (hash << 5) - hash + input.charCodeAt(i);
        hash |= 0;
    }
    return String(hash);
};

// --- Server call helper ---
const postAI = async <T>(path: string, body: any, fallback?: T): Promise<T> => {
    try {
        const response = await fetch(`${AI_API_BASE}${path}`, {
            method: 'POST',
            headers: authService.getAuthHeaders(),
            body: JSON.stringify(body)
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error((err as any)?.error || `Server error ${response.status}`);
        }
        return await response.json() as T;
    } catch (e) {
        if (fallback !== undefined) return fallback;
        throw e;
    }
};

const cachedPostAI = async <T>(cacheKey: string, path: string, body: any, fallback: T): Promise<T> => {
    const cached = readCache<T>(cacheKey);
    if (cached) return cached;
    try {
        const result = await postAI<T>(path, body);
        writeCache(cacheKey, result);
        return result;
    } catch {
        return fallback;
    }
};

// ---------------------------------------------------------------------------
// SANITIZATION (kept client-side — no AI needed)
// ---------------------------------------------------------------------------

export const sanitizeResumeData = (data: any): ResumeData => {
    if (!data || typeof data !== 'object') data = {};
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
            role: e.role || '', company: e.company || '', period: e.period || '',
            visible: e.visible !== false, location: e.location || undefined,
            bullets: Array.isArray(e.bullets) ? e.bullets.map((b: any, bi: number) => ({
                id: b.id || `bull-${Date.now()}-${bi}`,
                text: typeof b === 'string' ? b : b.text || '',
                visible: b.visible !== false
            })) : []
        })) : [],
        projects: Array.isArray(data.projects) ? data.projects.map((p: any, i: number) => ({
            id: p.id || `proj-${Date.now()}-${i}`, name: p.name || '',
            description: p.description || '', link: p.link || '', visible: p.visible !== false
        })) : [],
        certifications: Array.isArray(data.certifications) ? data.certifications.map((c: any, i: number) => ({
            id: c.id || `cert-${Date.now()}-${i}`, name: c.name || '',
            issuer: c.issuer || '', date: c.date || '', link: c.link || '',
            visible: c.visible !== false
        })) : [],
        publications: Array.isArray(data.publications) ? data.publications.map((p: any, i: number) => ({
            id: p.id || `pub-${Date.now()}-${i}`, title: p.title || '',
            publisher: p.publisher || '', date: p.date || '', link: p.link || '',
            visible: p.visible !== false
        })) : [],
        affiliations: Array.isArray(data.affiliations) ? data.affiliations.map((a: any, i: number) => ({
            id: a.id || `aff-${Date.now()}-${i}`, organization: a.organization || '',
            role: a.role || '', period: a.period || '', visible: a.visible !== false
        })) : []
    };
};

// ---------------------------------------------------------------------------
// 1. JOB INTELLIGENCE ENGINE (server-proxied)
// ---------------------------------------------------------------------------
export const analyzeJobDescription = async (text: string): Promise<JobAnalysis> => {
    const fallback: JobAnalysis = {
        title: "Unknown Role", company: "Unknown Company",
        requiredSkills: [], optionalSkills: [], industry: "General",
        seniorityLevel: "Mid", leadershipRequired: false, keywords: [],
        summary: "Unable to extract detailed job analysis.", rawText: text,
        experienceLevel: "Mid", hiringProbability: 50,
        hiringReasoning: "Insufficient signal.", companyInsights: "",
        hiddenRequirements: [], cultureIndicators: [], techStackClusters: {},
        softSkills: [], tools: [], certifications: []
    };
    const cacheKey = `job:${hashPayload(text.slice(0, 3000))}`;
    const data = await cachedPostAI<any>(cacheKey, '/api/ai/analyze-job', { text }, fallback);
    return { ...fallback, ...data, rawText: text, techStackClusters: {} };
};

// ---------------------------------------------------------------------------
// 2-3. SMART RESUME TAILORING (server-proxied)
// ---------------------------------------------------------------------------
export const assembleSmartResume = async (profile: UserProfile, job: JobAnalysis): Promise<ResumeData[]> => {
    const master = profile.masterResume;
    const skillGap = await analyzeSkillsGap(master.skills, job.requiredSkills);
    const missingSkills = skillGap.filter(s => s.status === 'missing').map(s => s.skill);

    try {
        const generated = await postAI<any>('/api/ai/tailor-resume', {
            resume: master,
            job,
            missingSkills: missingSkills.slice(0, 5)
        });

        const newResume: ResumeData = sanitizeResumeData({
            ...master,
            id: `gen-${Date.now()}`,
            versionName: `Tailored for ${job.company}`,
            summary: generated.summary || master.summary,
            skills: generated.reorderedSkills || master.skills,
            experience: (generated.experience || []).map((exp: any, i: number) => ({
                id: `exp-${Date.now()}-${i}`, role: exp.role, company: exp.company,
                period: exp.period, visible: true,
                bullets: (exp.bullets || []).map((b: string, bi: number) => ({
                    id: `b-${i}-${bi}`, text: b, visible: true
                }))
            })),
            education: master.education, projects: master.projects,
            certifications: master.certifications, languages: master.languages,
            awards: master.awards
        });

        const balancedVariant: ResumeData = sanitizeResumeData({
            ...master,
            id: `gen-balanced-${Date.now()}`,
            versionName: `Balanced for ${job.company}`,
            summary: generated.summary || master.summary,
            skills: master.skills
        });

        return [newResume, balancedVariant];
    } catch {
        return [{ ...master, id: `fallback-${Date.now()}`, versionName: `Copy for ${job.company}` }];
    }
};

export const generateTailoredResume = assembleSmartResume;

// ---------------------------------------------------------------------------
// 4. RESUME QUALITY AUDITOR (local heuristic — no AI needed)
// ---------------------------------------------------------------------------
export const calculateATSScore = async (r: ResumeData, j: JobAnalysis): Promise<ATSScore> => {
    const resumeText = [r.summary, ...r.skills, ...r.experience.flatMap(e => e.bullets.map(b => b.text))].join(' ').toLowerCase();
    const jobKeywords = Array.from(new Set([
        ...(j.requiredSkills || []), ...(j.optionalSkills || []), ...(j.keywords || [])
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
    const total = Math.round(breakdown.keywords * 1.8 + breakdown.quantifiable * 1.4 + breakdown.skills * 1.2 + breakdown.structure * 1.1 + breakdown.verbs * 1.0 + breakdown.format * 1.0 + breakdown.length * 0.5);
    const suggestions: string[] = [];
    if (breakdown.keywords < 8) suggestions.push('Add more role-specific keywords from the job description.');
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

// ---------------------------------------------------------------------------
// 5. SKILL GAP PREDICTOR (local heuristic)
// ---------------------------------------------------------------------------
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
            recommendation: exact ? 'Already covered.' : partial ? 'Highlight this more explicitly.' : `Add evidence of ${skill}.`,
            learningPriority: exact ? 'Low' : inferPriority(skill),
            suggestedResource: exact ? 'N/A' : `Hands-on project focused on ${skill}`
        } as SkillMatch;
    });
};

// ---------------------------------------------------------------------------
// 7. CAREER INSIGHTS (server-proxied)
// ---------------------------------------------------------------------------
export const generateCareerInsights = async (profile: UserProfile): Promise<CareerInsights> => {
    const history = profile.masterResume.experience.map(e => `${e.role} at ${e.company} (${e.period})`).join('\n');
    const skills = profile.masterResume.skills.join(', ');
    const fallback: CareerInsights = {
        missingSkills: [], marketOutlook: "Stable", resumeStrength: 70,
        recommendedAction: "Add more quantified outcomes to your recent roles.",
        trajectoryAnalysis: { isLogical: true, narrativeCoherence: 80, nextRolePrediction: profile.masterResume.role || "Senior Level" },
        strategy: { resumeFocus: "Quantified impact + role alignment", interviewFocus: "STAR-based measurable outcomes" }
    };
    return cachedPostAI<CareerInsights>(
        `career:${hashPayload(`${history}|${skills}`)}`,
        '/api/ai/career-insights',
        { history, skills },
        fallback
    );
};

// ---------------------------------------------------------------------------
// 8. INLINE SUGGESTION (server-proxied)
// ---------------------------------------------------------------------------
export const getInlineSuggestion = async (text: string, context: string): Promise<InlineSuggestion> => {
    const fallback: InlineSuggestion = { original: text, suggestion: text, confidence: 0.7, type: 'clarity' };
    const res = await cachedPostAI<any>(
        `inline:${hashPayload(`${text}|${context}`)}`,
        '/api/ai/inline-suggestion',
        { text, context },
        fallback
    );
    return { original: text, suggestion: res.suggestion || text, confidence: res.confidence || 0.7, type: res.type || 'clarity' };
};

// ---------------------------------------------------------------------------
// 10. TEMPLATE RECOMMENDATION (server-proxied)
// ---------------------------------------------------------------------------
export const recommendTemplate = async (j: JobAnalysis): Promise<TemplateRecommendation> => {
    const fallback: TemplateRecommendation = {
        layout: 'Minimalist', font: 'Inter', recommendedColor: '#0f172a',
        recommendedPageCount: 1, reasoning: "Safe default optimized for ATS.",
        recommendedTemplate: 'Minimalist', recommendedFont: 'Inter'
    };
    const res = await cachedPostAI<any>(
        `template:${hashPayload(`${j.title}|${j.industry}|${j.seniorityLevel}`)}`,
        '/api/ai/recommend-template',
        { title: j.title, industry: j.industry, seniorityLevel: j.seniorityLevel },
        fallback
    );
    return { ...fallback, ...res, recommendedTemplate: res.layout || fallback.layout, recommendedFont: res.font || fallback.font };
};

// ---------------------------------------------------------------------------
// 11. SALARY INSIGHTS (server-proxied)
// ---------------------------------------------------------------------------
export const analyzeSalary = async (j: JobAnalysis): Promise<SalaryInsight> => {
    const fallback: SalaryInsight = {
        estimatedRange: { min: 90000, max: 140000, currency: "USD" },
        marketTrend: 'Stable', reasoning: "Estimated from role and seniority baseline.",
        negotiationTips: ['Lead with quantified impact.', 'Anchor with a justified range.'],
        scripts: { screening: 'Targeting compensation aligned with impact.', counterOffer: 'Can we revisit total compensation?' },
        competitivenessIndex: 70
    };
    return cachedPostAI<SalaryInsight>(
        `salary:${hashPayload(`${j.title}|${j.location}|${j.seniorityLevel}`)}`,
        '/api/ai/salary',
        { title: j.title, seniorityLevel: j.seniorityLevel, location: j.location || 'Unknown', industry: j.industry },
        fallback
    );
};

// ---------------------------------------------------------------------------
// 12. LINKEDIN PROFILE (server-proxied)
// ---------------------------------------------------------------------------
export const generateLinkedInProfile = async (r: ResumeData): Promise<LinkedInProfile> => {
    const fallback: LinkedInProfile = {
        headline: `${r.role || 'Professional'} | ${r.skills.slice(0, 3).join(' | ')}`,
        about: r.summary || `Experienced ${r.role || 'professional'}.`,
        featuredSkills: r.skills.slice(0, 8),
        experienceHooks: r.experience.slice(0, 3).map(e => `${e.role} at ${e.company}`),
        brandStrengthScore: 70, brandTone: 'Professional'
    };
    return cachedPostAI<LinkedInProfile>(
        `linkedin:${hashPayload(`${r.fullName}|${r.role}|${r.summary}`)}`,
        '/api/ai/linkedin',
        {
            role: r.role, summary: r.summary,
            recentRoles: r.experience.slice(0, 4).map(e => `${e.role} at ${e.company}`).join('; '),
            skills: r.skills.slice(0, 15).join(', ')
        },
        fallback
    );
};

// ---------------------------------------------------------------------------
// 14. COVER LETTER (server-proxied)
// ---------------------------------------------------------------------------
export const generateCoverLetter = async (r: ResumeData, j: JobAnalysis, tone: any): Promise<string> => {
    const fallback = `Dear Hiring Team,\n\nI am excited to apply for the ${j.title} role at ${j.company}.\n\nSincerely,\n${r.fullName || 'Candidate'}`;
    const res = await cachedPostAI<any>(
        `cover:${hashPayload(`${r.fullName}|${j.title}|${j.company}|${tone}`)}`,
        '/api/ai/cover-letter',
        { resume: r, job: j, tone },
        { content: fallback }
    );
    return res.content || fallback;
};

// ---------------------------------------------------------------------------
// RESUME UPDATE (server-proxied)
// ---------------------------------------------------------------------------
export const updateResumeWithAI = async (r: ResumeData, instruction: string): Promise<ResumeData> => {
    try {
        const server = await postAI<any>('/api/ai/update-resume', { resume: r, instruction });
        if (server && (server.summary || server.experience || server.skills)) {
            return sanitizeResumeData({
                ...r,
                summary: server.summary || r.summary,
                skills: server.skills || r.skills,
                experience: (server.experience || r.experience).map((exp: any, i: number) => ({
                    id: exp.id || `exp-${Date.now()}-${i}`, role: exp.role, company: exp.company,
                    period: exp.period, visible: exp.visible !== false,
                    bullets: (exp.bullets || []).map((b: any, bi: number) => ({
                        id: b.id || `b-${i}-${bi}`,
                        text: typeof b === 'string' ? b : b.text || '',
                        visible: b.visible !== false
                    }))
                }))
            });
        }
    } catch { /* fall through */ }
    return sanitizeResumeData({ ...r, timestamp: Date.now() });
};

// ---------------------------------------------------------------------------
// RESUME PARSING (server-proxied)
// ---------------------------------------------------------------------------
export const parseResumeFromText = async (text: string): Promise<ResumeData> => {
    const data = await cachedPostAI<any>(
        `parse:${hashPayload(text.slice(0, 3000))}`,
        '/api/ai/parse-resume',
        { text },
        {}
    );
    const experience = (data.experience || []).map((e: any, i: number) => ({
        id: `exp-${i}`, role: e.role || "", company: e.company || "",
        period: e.period || "", visible: true,
        bullets: (e.bullets || []).map((b: string, bi: number) => ({ id: `b-${i}-${bi}`, text: b, visible: true }))
    }));
    return { ...sanitizeResumeData({}), ...data, experience };
};

// ---------------------------------------------------------------------------
// BIAS ANALYSIS (server-proxied)
// ---------------------------------------------------------------------------
export const analyzeBias = async (r: ResumeData): Promise<BiasAnalysis> => {
    const fallback: BiasAnalysis = { riskScore: 8, overallAssessment: 'Low Risk', items: [] };
    try {
        return await postAI<BiasAnalysis>('/api/ai/bias-analysis', { resume: r }, fallback);
    } catch {
        return fallback;
    }
};

// ---------------------------------------------------------------------------
// NETWORKING STRATEGY (server-proxied)
// ---------------------------------------------------------------------------
export const generateNetworkingStrategy = async (j: JobAnalysis): Promise<NetworkingStrategy> => {
    const fallback: NetworkingStrategy = {
        targetRoles: [`Recruiter at ${j.company}`, `${j.title} Hiring Manager`],
        outreachTemplates: [{ type: 'LinkedIn', subject: `${j.title} role`, body: `Hi, I'm exploring ${j.title} opportunities...` }]
    };
    try {
        return await postAI<NetworkingStrategy>('/api/ai/networking-strategy', { job: j }, fallback);
    } catch {
        return fallback;
    }
};

// ---------------------------------------------------------------------------
// PROBING QUESTION (server-proxied)
// ---------------------------------------------------------------------------
export const generateProbingQuestion = async (r: ResumeData, j: JobAnalysis, p: string[], t?: string): Promise<ProbingQuestion> => {
    const fallback: ProbingQuestion = {
        question: `Describe a situation where you demonstrated impact. What was the challenge, your actions, and the measurable result?`,
        targetSkill: t || 'Impact', reasoning: 'Core skill for this role.'
    };
    try {
        return await postAI<ProbingQuestion>('/api/ai/probing-question', {
            resume: r, job: j, previousQuestions: p, targetSkill: t
        }, fallback);
    } catch {
        return fallback;
    }
};

// ---------------------------------------------------------------------------
// TRANSFORM ANSWER TO BULLET (server-proxied)
// ---------------------------------------------------------------------------
export const transformAnswerToBullet = async (q: string, a: string, r: ResumeData): Promise<GeneratedAchievement> => {
    const fallback: GeneratedAchievement = {
        originalAnswer: a, improvedBullet: a, suggestedSection: 'experience', relatedId: r.experience[0]?.id
    };
    try {
        const res = await postAI<any>('/api/ai/transform-answer', { question: q, answer: a, resume: r }, fallback);
        return { ...fallback, ...res, relatedId: r.experience[0]?.id };
    } catch {
        return fallback;
    }
};

// ---------------------------------------------------------------------------
// INTERVIEW (server-proxied)
// ---------------------------------------------------------------------------
export const getInterviewQuestion = async (j: JobAnalysis, p: string[]): Promise<string> => {
    try {
        const res = await postAI<any>('/api/ai/interview-question', { job: j, previousQuestions: p });
        return res.question || `What questions do you have about this ${j.title || 'role'}?`;
    } catch {
        return `Walk me through a project where you used ${j.requiredSkills?.[0] || 'core technical skills'} to solve a complex problem.`;
    }
};

export const evaluateInterviewAnswer = async (q: string, a: string): Promise<any> => {
    const fallback = {
        rating: 50,
        strengths: ['Your answer is clear and understandable.'],
        improvements: ['Add quantified outcomes to strengthen impact.'],
        sampleAnswer: 'In a similar scenario, I clarified the goal and delivered with measurable impact.'
    };
    try {
        return await postAI<any>('/api/ai/evaluate-answer', { question: q, answer: a }, fallback);
    } catch {
        return fallback;
    }
};

// ---------------------------------------------------------------------------
// JOB SEARCH (server-proxied with google grounding)
// ---------------------------------------------------------------------------
export const findVisaSponsoringJobs = async (f: JobSearchFilters): Promise<ExternalJob[]> => {
    try {
        const jobs = await cachedPostAI<ExternalJob[]>(
            `jobs:${hashPayload(JSON.stringify(f))}`,
            '/api/ai/job-search',
            { filters: f },
            []
        );
        const safeJobs = Array.isArray(jobs) && jobs.length > 0 ? jobs : [];
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
        return [];
    }
};

// ---------------------------------------------------------------------------
// BIAS AUDIT (separate from analyzeBias — kept for API compat)
// ---------------------------------------------------------------------------
export const runBiasAudit = async (r: ResumeData): Promise<BiasAuditResult> => {
    const analysis = await analyzeBias(r);
    return {
        originalScore: Math.max(52, 88 - analysis.items.length * 7),
        blindScore: Math.max(50, 88 - analysis.items.length * 7 - (analysis.items.length > 0 ? 6 : 1)),
        variance: analysis.items.length > 0 ? 6 : 1,
        isBiased: analysis.items.length > 0,
        reasoning: analysis.overallAssessment
    };
};

// ---------------------------------------------------------------------------
// REMAINING HELPERS (local heuristics)
// ---------------------------------------------------------------------------
export const updateMasterProfile = async (r: ResumeData, i: string): Promise<ResumeData> => {
    return updateResumeWithAI(r, i?.trim() || 'Improve summary clarity and keyword relevance.');
};

export const extractAchievements = async (text: string, source: RawDataSource): Promise<AchievementEntity[]> => {
    const cleaned = (text || '').trim();
    if (!cleaned) return [];
    try {
        const parsed = await cachedPostAI<any[]>(
            `ach:${hashPayload(`${source.id}|${source.type}|${cleaned.slice(0, 2000)}`)}`,
            '/api/ai/extract-achievements',
            { text: cleaned, sourceType: source.type, sourceName: source.name },
            []
        );
        const safe = Array.isArray(parsed) ? parsed : [];
        return safe
            .filter(item => item?.originalText?.trim()?.length > 10)
            .map((item, idx) => ({
                id: `ach-${source.id}-${idx}`,
                originalText: item.originalText.trim(),
                enhancedText: item.enhancedText?.trim(),
                category: item.category || 'General',
                metrics: Array.isArray(item.metrics) ? item.metrics : [],
                tags: Array.isArray(item.tags) ? item.tags.map((t: any) => ({ label: typeof t === 'string' ? t : t.label || '' })) : [],
                hidden: false
            }));
    } catch {
        return [];
    }
};

export const rankAchievements = async (achievements: AchievementEntity[], job: JobProfile): Promise<ScoredAchievement[]> => {
    const jd = `${job.title} ${job.description}`.toLowerCase();
    return achievements.map(a => {
        const text = `${a.originalText} ${a.enhancedText || ''} ${a.category}`.toLowerCase();
        const overlap = text.split(/\W+/).filter(token => token.length > 3 && jd.includes(token)).length;
        const metricBoost = (a.metrics?.length || 0) * 8;
        return { id: a.id, score: Math.min(100, 30 + overlap * 10 + metricBoost) };
    }).sort((a, b) => b.score - a.score);
};

export const generatePreviewSuggestions = async (r: ResumeData, j: JobAnalysis): Promise<PreviewSuggestion[]> => {
    try {
        const res = await cachedPostAI<PreviewSuggestion[]>(
            `preview:${hashPayload(`${r.id}|${j.title}`)}`,
            '/api/ai/preview-suggestions',
            { resume: r, job: j },
            []
        );
        if (Array.isArray(res) && res.length > 0) return res.slice(0, 5);
    } catch { /* fall through */ }
    // Local fallback
    const suggestions: PreviewSuggestion[] = [];
    if (r.summary.length < 120) suggestions.push({ id: 'summary-depth', text: 'Expand the summary to 3-4 lines with quantified impact.' });
    if (r.skills.length < 8) suggestions.push({ id: 'skills-coverage', text: 'Add more relevant skills for ATS coverage.' });
    if (suggestions.length === 0) suggestions.push({ id: 'polish', text: 'Strong alignment. Refine wording for brevity.' });
    return suggestions;
};

export const getJobRecommendations = async (r: ResumeData): Promise<RecommendedJob[]> => {
    const baseRole = r.role?.trim() || 'Software Engineer';
    if (!baseRole || baseRole === 'Professional Role') return [];
    try {
        const jobs = await cachedPostAI<ExternalJob[]>(
            `rec:${hashPayload(`${baseRole}|${r.skills.slice(0, 5).join('|')}`)}`,
            '/api/ai/job-search',
            {
                filters: {
                    query: baseRole,
                    location: '',
                    remote: 'Any',
                    level: 'Any',
                    type: 'Full-time',
                    visa: 'Any',
                    easyApply: 'Any',
                    minSalary: 0
                }
            },
            []
        );
        if (!Array.isArray(jobs) || jobs.length === 0) return [];
        return jobs.slice(0, 3).map((job, idx) => ({
            id: `rec-${Date.now()}-${idx}`,
            title: job.title,
            company: job.company,
            matchScore: job.matchScore || 75,
            matchReason: (job.description || '').split('.')[0] || `Matches your ${baseRole} background.`,
            simulatedDescription: [
                job.description,
                job.requirements?.length ? `Requirements: ${job.requirements.join(', ')}` : ''
            ].filter(Boolean).join('\n\n')
        }));
    } catch {
        return [];
    }
};

export const analyzeJobMarketTrends = async (jobs: ExternalJob[], q: string): Promise<MarketTrends> => {
    if (!jobs || jobs.length === 0) {
        return { summary: `Low signal for "${q}".`, salaryTrend: 'Unknown', topSkills: [], demandLevel: 'Low' };
    }
    const skillFreq = new Map<string, number>();
    jobs.forEach(job => {
        [...(job.tags || []), ...(job.requirements || [])].forEach(skill => {
            const key = String(skill).trim();
            if (!key) return;
            skillFreq.set(key, (skillFreq.get(key) || 0) + 1);
        });
    });
    const topSkills = Array.from(skillFreq.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k]) => k);
    const avgMatch = Math.round(jobs.reduce((sum, j) => sum + (j.matchScore || 0), 0) / jobs.length);
    const demandLevel = avgMatch >= 75 ? 'High' : avgMatch >= 55 ? 'Medium' : 'Low';
    return {
        summary: `Analyzed ${jobs.length} listings. Demand: ${demandLevel.toLowerCase()}.`,
        salaryTrend: jobs.some(j => !!j.salaryRange) ? 'Upward' : 'Limited data',
        topSkills, demandLevel
    };
};

export const compressResumeContent = async (resume: ResumeData, _pages: number): Promise<ResumeData> => resume;
