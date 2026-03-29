import express from 'express';
import { getGemini, runWithTimeout, generateWithRetry, sanitizeResumeInput, Type } from './aiHelpers.mjs';

const router = express.Router();

// --- POST /api/ai/analyze-job ---
router.post('/analyze-job', async (req, res) => {
  try {
    const { text } = req.body || {};
    if (!text || typeof text !== 'string') return res.status(400).json({ error: 'text is required' });
    const ai = getGemini();
    const schema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING }, company: { type: Type.STRING },
        requiredSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
        optionalSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
        industry: { type: Type.STRING }, seniorityLevel: { type: Type.STRING },
        leadershipRequired: { type: Type.BOOLEAN },
        keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
        summary: { type: Type.STRING }, experienceLevel: { type: Type.STRING },
        hiringProbability: { type: Type.NUMBER }, hiringReasoning: { type: Type.STRING },
        companyInsights: { type: Type.STRING },
        hiddenRequirements: { type: Type.ARRAY, items: { type: Type.STRING } },
        cultureIndicators: { type: Type.ARRAY, items: { type: Type.STRING } },
        softSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
        tools: { type: Type.ARRAY, items: { type: Type.STRING } },
        certifications: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    };
    const response = await generateWithRetry(() =>
      ai.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents: `Extract structured job requirements from the text. Keep output concise and factual.\n${text.substring(0, 12000)}`,
        config: { responseMimeType: 'application/json', responseSchema: schema }
      })
    );
    return res.json(JSON.parse(response?.text || '{}'));
  } catch (error) {
    console.error('analyze job error', error);
    return res.status(500).json({ error: 'Failed to analyze job' });
  }
});

// --- POST /api/ai/tailor-resume ---
router.post('/tailor-resume', async (req, res) => {
  try {
    const { resume, job, missingSkills } = req.body || {};
    if (!resume || !job) return res.status(400).json({ error: 'resume and job are required' });
    const ai = getGemini();
    const schema = {
      type: Type.OBJECT,
      properties: {
        summary: { type: Type.STRING },
        experience: {
          type: Type.ARRAY, items: {
            type: Type.OBJECT, properties: {
              role: { type: Type.STRING }, company: { type: Type.STRING },
              period: { type: Type.STRING },
              bullets: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        },
        reorderedSkills: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    };
    const prompt = `You are an elite resume writer. Tailor the resume for this role.
Job title: ${job.title || ''} | Company: ${job.company || ''}
Required skills: ${(job.requiredSkills || []).join(', ')}
Optional skills: ${(job.optionalSkills || []).join(', ')}
Keywords: ${(job.keywords || []).join(', ')}
Priority missing skills: ${(missingSkills || []).slice(0, 8).join(', ') || 'none'}
Rules: Keep all facts truthful. Rewrite summary/bullets to emphasize relevant impact. Add quantified impact only if implied. Keep bullets concise.
Resume JSON: ${JSON.stringify(sanitizeResumeInput(resume)).slice(0, 12000)}`;
    const response = await generateWithRetry(() =>
      ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json', responseSchema: schema, thinkingConfig: { thinkingBudget: 4096 } }
      })
    );
    return res.json(JSON.parse(response?.text || '{}'));
  } catch (error) {
    console.error('tailor resume error', error);
    return res.status(500).json({ error: 'Failed to tailor resume' });
  }
});

// --- POST /api/ai/update-resume ---
router.post('/update-resume', async (req, res) => {
  try {
    const { resume, instruction } = req.body || {};
    if (!resume || !instruction) return res.status(400).json({ error: 'resume and instruction are required' });
    const ai = getGemini();
    const schema = {
      type: Type.OBJECT,
      properties: {
        summary: { type: Type.STRING },
        experience: {
          type: Type.ARRAY, items: {
            type: Type.OBJECT, properties: {
              role: { type: Type.STRING }, company: { type: Type.STRING },
              period: { type: Type.STRING },
              bullets: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        },
        skills: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    };
    const prompt = `Apply this instruction to the resume while preserving facts and structure.
Instruction: ${instruction}
Resume JSON: ${JSON.stringify(sanitizeResumeInput(resume)).slice(0, 12000)}`;
    const response = await generateWithRetry(() =>
      ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json', responseSchema: schema, thinkingConfig: { thinkingBudget: 2048 } }
      })
    );
    return res.json(JSON.parse(response?.text || '{}'));
  } catch (error) {
    console.error('update resume error', error);
    return res.status(500).json({ error: 'Failed to update resume' });
  }
});

// --- POST /api/ai/job-search ---
// NOTE: Gemini does not allow responseSchema + googleSearch tools simultaneously.
// We use responseSchema (structured JSON) with a detailed prompt instead.
router.post('/job-search', async (req, res) => {
  try {
    const { filters } = req.body || {};
    if (!filters) return res.status(400).json({ error: 'filters are required' });
    const ai = getGemini();

    const visaLine = filters.visa === 'Yes'
      ? 'Prioritise companies well-known for sponsoring work visas (e.g. Google, Meta, Stripe, Booking.com, ASML, Adyen, etc.).'
      : '';
    const salaryLine = filters.minSalary > 0 ? `Minimum salary: $${filters.minSalary}.` : '';

    const prompt = `Generate 10 realistic, detailed job listings that precisely match these search criteria.
Use real company names, accurate salary ranges for the market and location, and specific technical requirements.

Search criteria:
- Role / Query: "${filters.query || 'Software Engineer'}"
- Location: ${filters.location || 'Worldwide'}
- Work mode: ${filters.remote || 'Any'}
- Seniority level: ${filters.level || 'Any'}
- Employment type: ${filters.type || 'Full-time'}
- Visa sponsorship: ${filters.visa || 'Any'}
- Easy Apply: ${filters.easyApply || 'Any'}
${salaryLine}
${visaLine}

Instructions:
- Each listing must have a realistic description (2-3 sentences about the team and mission).
- Requirements: 6-8 specific skills/tools per role.
- postedDate: use relative strings like "1 day ago", "3 days ago", "1 week ago".
- matchScore: integer 65-95 representing how well this role fits the query.
- Vary the companies (mix of FAANG, scale-ups, and mid-size companies).
- Make salaryRange realistic for the role and location (e.g. "$130k – $170k", "€80k – €110k").`;

    const response = await generateWithRetry(() =>
      ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
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
      })
    );
    const parsed = JSON.parse(response?.text || '[]');
    return res.json(Array.isArray(parsed) ? parsed : []);
  } catch (error) {
    console.error('job search error', error);
    return res.status(500).json({ error: 'Failed to search jobs' });
  }
});

// --- POST /api/ai/career-insights ---
router.post('/career-insights', async (req, res) => {
  try {
    const { history, skills } = req.body || {};
    const ai = getGemini();
    const response = await generateWithRetry(() =>
      ai.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents: `Analyze this career trajectory and return practical next-step guidance.
HISTORY:\n${(history || '').slice(0, 5000)}
SKILLS: ${(skills || '').slice(0, 1200)}`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT, properties: {
              missingSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
              marketOutlook: { type: Type.STRING },
              resumeStrength: { type: Type.NUMBER },
              recommendedAction: { type: Type.STRING },
              trajectoryAnalysis: {
                type: Type.OBJECT, properties: {
                  isLogical: { type: Type.BOOLEAN },
                  narrativeCoherence: { type: Type.NUMBER },
                  nextRolePrediction: { type: Type.STRING }
                }
              },
              strategy: {
                type: Type.OBJECT, properties: {
                  resumeFocus: { type: Type.STRING },
                  interviewFocus: { type: Type.STRING }
                }
              }
            }
          }
        }
      })
    );
    return res.json(JSON.parse(response?.text || '{}'));
  } catch (error) {
    console.error('career insights error', error);
    return res.status(500).json({ error: 'Failed to generate career insights' });
  }
});

// --- POST /api/ai/inline-suggestion ---
router.post('/inline-suggestion', async (req, res) => {
  try {
    const { text, context } = req.body || {};
    if (!text) return res.status(400).json({ error: 'text is required' });
    const ai = getGemini();
    const response = await generateWithRetry(() =>
      ai.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents: `Rewrite this resume bullet to be concise, measurable, and ATS-friendly.
Text: "${text}"
Context: ${(context || '').slice(0, 500)}`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT, properties: {
              suggestion: { type: Type.STRING },
              confidence: { type: Type.NUMBER },
              type: { type: Type.STRING }
            }
          }
        }
      })
    );
    return res.json(JSON.parse(response?.text || '{}'));
  } catch (error) {
    console.error('inline suggestion error', error);
    return res.status(500).json({ error: 'Failed to generate suggestion' });
  }
});

// --- POST /api/ai/recommend-template ---
router.post('/recommend-template', async (req, res) => {
  try {
    const { title, industry, seniorityLevel } = req.body || {};
    const ai = getGemini();
    const response = await generateWithRetry(() =>
      ai.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents: `Recommend a resume layout and font.\nRole: ${title}\nIndustry: ${industry}\nSeniority: ${seniorityLevel}`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT, properties: {
              layout: { type: Type.STRING }, font: { type: Type.STRING },
              recommendedColor: { type: Type.STRING },
              recommendedPageCount: { type: Type.NUMBER },
              reasoning: { type: Type.STRING },
              recommendedTemplate: { type: Type.STRING },
              recommendedFont: { type: Type.STRING }
            }
          }
        }
      })
    );
    return res.json(JSON.parse(response?.text || '{}'));
  } catch (error) {
    console.error('recommend template error', error);
    return res.status(500).json({ error: 'Failed to recommend template' });
  }
});

// --- POST /api/ai/salary ---
router.post('/salary', async (req, res) => {
  try {
    const { title, seniorityLevel, location, industry } = req.body || {};
    const ai = getGemini();
    const response = await generateWithRetry(() =>
      ai.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents: `Estimate salary range and negotiation guidance.
Role: ${title} | Seniority: ${seniorityLevel}
Location: ${location || 'Unknown'} | Industry: ${industry}`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT, properties: {
              estimatedRange: { type: Type.OBJECT, properties: { min: { type: Type.NUMBER }, max: { type: Type.NUMBER }, currency: { type: Type.STRING } } },
              marketTrend: { type: Type.STRING }, reasoning: { type: Type.STRING },
              negotiationTips: { type: Type.ARRAY, items: { type: Type.STRING } },
              scripts: { type: Type.OBJECT, properties: { screening: { type: Type.STRING }, counterOffer: { type: Type.STRING } } },
              competitivenessIndex: { type: Type.NUMBER }
            }
          }
        }
      })
    );
    return res.json(JSON.parse(response?.text || '{}'));
  } catch (error) {
    console.error('salary error', error);
    return res.status(500).json({ error: 'Failed to analyze salary' });
  }
});

// --- POST /api/ai/linkedin ---
router.post('/linkedin', async (req, res) => {
  try {
    const { role, summary, recentRoles, skills } = req.body || {};
    const ai = getGemini();
    const response = await generateWithRetry(() =>
      ai.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents: `Create LinkedIn profile content from resume context.
Role: ${role} | Summary: ${summary}
Recent Roles: ${recentRoles} | Skills: ${skills}`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT, properties: {
              headline: { type: Type.STRING }, about: { type: Type.STRING },
              featuredSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
              experienceHooks: { type: Type.ARRAY, items: { type: Type.STRING } },
              brandStrengthScore: { type: Type.NUMBER },
              brandTone: { type: Type.STRING }
            }
          }
        }
      })
    );
    return res.json(JSON.parse(response?.text || '{}'));
  } catch (error) {
    console.error('linkedin error', error);
    return res.status(500).json({ error: 'Failed to generate LinkedIn profile' });
  }
});

// --- POST /api/ai/cover-letter ---
router.post('/cover-letter', async (req, res) => {
  try {
    const { resume, job, tone } = req.body || {};
    if (!resume || !job) return res.status(400).json({ error: 'resume and job are required' });
    const ai = getGemini();
    const r = sanitizeResumeInput(resume);
    const response = await generateWithRetry(() =>
      ai.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents: `Write a concise professional cover letter in ${tone || 'Formal'} tone.
Candidate: ${r.fullName} | Role: ${job.title} | Company: ${job.company}
Key skills: ${r.skills.slice(0, 8).join(', ')}
Highlights: ${r.experience.slice(0, 3).map(e => `${e.role} at ${e.company}`).join('; ')}
Output plain text only.`
      })
    );
    return res.json({ content: (response?.text || '').trim() });
  } catch (error) {
    console.error('cover letter error', error);
    return res.status(500).json({ error: 'Failed to generate cover letter' });
  }
});

// --- POST /api/ai/parse-resume ---
router.post('/parse-resume', async (req, res) => {
  try {
    const { text } = req.body || {};
    if (!text) return res.status(400).json({ error: 'text is required' });
    const ai = getGemini();
    const response = await generateWithRetry(() =>
      ai.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents: `Extract structured resume fields from this text.\nTEXT: ${text.substring(0, 16000)}`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT, properties: {
              fullName: { type: Type.STRING }, email: { type: Type.STRING },
              phone: { type: Type.STRING }, linkedin: { type: Type.STRING },
              summary: { type: Type.STRING },
              skills: { type: Type.ARRAY, items: { type: Type.STRING } },
              experience: {
                type: Type.ARRAY, items: {
                  type: Type.OBJECT, properties: {
                    role: { type: Type.STRING }, company: { type: Type.STRING },
                    period: { type: Type.STRING },
                    bullets: { type: Type.ARRAY, items: { type: Type.STRING } }
                  }
                }
              },
              education: { type: Type.STRING }
            }
          }
        }
      })
    );
    return res.json(JSON.parse(response?.text || '{}'));
  } catch (error) {
    console.error('parse resume error', error);
    return res.status(500).json({ error: 'Failed to parse resume' });
  }
});

// --- POST /api/ai/extract-achievements ---
router.post('/extract-achievements', async (req, res) => {
  try {
    const { text, sourceType, sourceName } = req.body || {};
    if (!text) return res.status(400).json({ error: 'text is required' });
    const ai = getGemini();
    const response = await generateWithRetry(() =>
      ai.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents: `Extract high-value career achievement statements from this source.
Focus on concrete outcomes and quantified impact. Return up to 25 entities.
SOURCE TYPE: ${sourceType || 'Text'} | SOURCE NAME: ${sourceName || 'Unknown'}
TEXT: ${text.substring(0, 18000)}`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY, items: {
              type: Type.OBJECT, properties: {
                originalText: { type: Type.STRING },
                enhancedText: { type: Type.STRING },
                category: { type: Type.STRING },
                metrics: { type: Type.ARRAY, items: { type: Type.STRING } },
                tags: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            }
          }
        }
      })
    );
    const parsed = JSON.parse(response?.text || '[]');
    return res.json(Array.isArray(parsed) ? parsed : []);
  } catch (error) {
    console.error('extract achievements error', error);
    return res.status(500).json({ error: 'Failed to extract achievements' });
  }
});

// --- POST /api/ai/interview-question ---
router.post('/interview-question', async (req, res) => {
  try {
    const { job, previousQuestions } = req.body || {};
    const ai = getGemini();
    const response = await generateWithRetry(() =>
      ai.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents: `Generate a behavioral interview question for a ${job?.title || 'professional'} role at ${job?.company || 'a company'}.
Required skills: ${(job?.requiredSkills || []).slice(0, 5).join(', ')}
Industry: ${job?.industry || 'General'}
Previously asked (DO NOT REPEAT): ${(previousQuestions || []).join(' | ')}
Return only the question text.`
      })
    );
    return res.json({ question: (response?.text || '').trim() });
  } catch (error) {
    console.error('interview question error', error);
    return res.status(500).json({ error: 'Failed to generate question' });
  }
});

// --- POST /api/ai/evaluate-answer ---
router.post('/evaluate-answer', async (req, res) => {
  try {
    const { question, answer } = req.body || {};
    if (!answer) return res.status(400).json({ error: 'answer is required' });
    const ai = getGemini();
    const response = await generateWithRetry(() =>
      ai.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents: `Evaluate this interview answer using STAR method criteria.
Question: ${question}
Answer: ${answer.slice(0, 3000)}
Rate 0-100. Give strengths, improvements, and a sample answer.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT, properties: {
              rating: { type: Type.NUMBER },
              strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
              improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
              sampleAnswer: { type: Type.STRING }
            }
          }
        }
      })
    );
    return res.json(JSON.parse(response?.text || '{}'));
  } catch (error) {
    console.error('evaluate answer error', error);
    return res.status(500).json({ error: 'Failed to evaluate answer' });
  }
});

// --- POST /api/ai/networking-strategy ---
router.post('/networking-strategy', async (req, res) => {
  try {
    const { job } = req.body || {};
    const ai = getGemini();
    const response = await generateWithRetry(() =>
      ai.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents: `Generate a networking strategy for someone targeting the ${job?.title || 'professional'} role at ${job?.company || 'a company'} in the ${job?.industry || 'technology'} industry. Include target roles to connect with and 3 outreach templates (LinkedIn, Email, Follow-up).`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT, properties: {
              targetRoles: { type: Type.ARRAY, items: { type: Type.STRING } },
              outreachTemplates: {
                type: Type.ARRAY, items: {
                  type: Type.OBJECT, properties: {
                    type: { type: Type.STRING },
                    subject: { type: Type.STRING },
                    body: { type: Type.STRING }
                  }
                }
              }
            }
          }
        }
      })
    );
    return res.json(JSON.parse(response?.text || '{}'));
  } catch (error) {
    console.error('networking strategy error', error);
    return res.status(500).json({ error: 'Failed to generate networking strategy' });
  }
});

// --- POST /api/ai/bias-analysis ---
router.post('/bias-analysis', async (req, res) => {
  try {
    const { resume } = req.body || {};
    if (!resume) return res.status(400).json({ error: 'resume is required' });
    const ai = getGemini();
    const r = sanitizeResumeInput(resume);
    const resumeText = [r.summary, ...r.experience.flatMap(e => e.bullets), ...r.skills].join('\n');
    const response = await generateWithRetry(() =>
      ai.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents: `Analyze this resume for unconscious bias signals (age, gender, ethnicity, language, exclusionary language). Score risk 0-100. List specific items found.
Resume text:\n${resumeText.slice(0, 8000)}`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT, properties: {
              riskScore: { type: Type.NUMBER },
              overallAssessment: { type: Type.STRING },
              items: {
                type: Type.ARRAY, items: {
                  type: Type.OBJECT, properties: {
                    type: { type: Type.STRING }, severity: { type: Type.STRING },
                    text: { type: Type.STRING }, suggestion: { type: Type.STRING }
                  }
                }
              }
            }
          }
        }
      })
    );
    return res.json(JSON.parse(response?.text || '{}'));
  } catch (error) {
    console.error('bias analysis error', error);
    return res.status(500).json({ error: 'Failed to analyze bias' });
  }
});

// --- POST /api/ai/probing-question ---
router.post('/probing-question', async (req, res) => {
  try {
    const { resume, job, previousQuestions, targetSkill } = req.body || {};
    const ai = getGemini();
    const r = sanitizeResumeInput(resume || {});
    const response = await generateWithRetry(() =>
      ai.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents: `Generate a deep-dive probing question to extract a quantifiable achievement from this candidate.
Target skill: ${targetSkill || 'general impact'}
Role context: ${job?.title || 'professional role'}
Previous questions asked: ${(previousQuestions || []).join('; ')}
Candidate skills: ${r.skills.slice(0, 10).join(', ')}
Return the question, target skill, and reasoning.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT, properties: {
              question: { type: Type.STRING },
              targetSkill: { type: Type.STRING },
              reasoning: { type: Type.STRING }
            }
          }
        }
      })
    );
    return res.json(JSON.parse(response?.text || '{}'));
  } catch (error) {
    console.error('probing question error', error);
    return res.status(500).json({ error: 'Failed to generate probing question' });
  }
});

// --- POST /api/ai/transform-answer ---
router.post('/transform-answer', async (req, res) => {
  try {
    const { question, answer, resume } = req.body || {};
    if (!answer) return res.status(400).json({ error: 'answer is required' });
    const ai = getGemini();
    const response = await generateWithRetry(() =>
      ai.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents: `Transform this interview answer into a polished resume bullet point. Use a strong action verb, include quantified impact, keep it to one line.
Question: ${question || ''}
Answer: ${answer.slice(0, 2000)}`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT, properties: {
              originalAnswer: { type: Type.STRING },
              improvedBullet: { type: Type.STRING },
              suggestedSection: { type: Type.STRING }
            }
          }
        }
      })
    );
    return res.json(JSON.parse(response?.text || '{}'));
  } catch (error) {
    console.error('transform answer error', error);
    return res.status(500).json({ error: 'Failed to transform answer' });
  }
});

// --- POST /api/ai/preview-suggestions ---
router.post('/preview-suggestions', async (req, res) => {
  try {
    const { resume, job } = req.body || {};
    const ai = getGemini();
    const r = sanitizeResumeInput(resume || {});
    const response = await generateWithRetry(() =>
      ai.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents: `Suggest up to 5 specific improvements for this resume targeted at the ${job?.title || 'target'} role.
Summary length: ${(r.summary || '').length} chars
# Skills: ${r.skills.length}
# Experience entries: ${r.experience.length}
Required skills from job: ${(job?.requiredSkills || []).join(', ')}
Candidate skills: ${r.skills.join(', ')}`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY, items: {
              type: Type.OBJECT, properties: {
                id: { type: Type.STRING },
                text: { type: Type.STRING }
              }
            }
          }
        }
      })
    );
    const parsed = JSON.parse(response?.text || '[]');
    return res.json(Array.isArray(parsed) ? parsed : []);
  } catch (error) {
    console.error('preview suggestions error', error);
    return res.status(500).json({ error: 'Failed to generate suggestions' });
  }
});

export default router;
