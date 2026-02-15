import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  Building2,
  CheckCircle2,
  ChevronDown,
  FileText,
  LayoutTemplate,
  MessageSquare,
  Play,
  Shield,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Users
} from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
}

type MegaMenu = 'resume' | 'cover-letter' | null;
type LandingRoute =
  | 'home'
  | 'blog'
  | 'pricing'
  | 'organizations'
  | 'resume-builder'
  | 'cover-letter-builder'
  | 'resume-templates'
  | 'cover-letter-templates'
  | 'resume-examples'
  | 'cover-letter-examples'
  | 'resume-guides'
  | 'cover-letter-guides'
  | 'career-guide'
  | 'salary-data'
  | 'success-stories'
  | 'terms-and-conditions'
  | 'terms-of-service'
  | 'privacy-policy';

const FadeIn = ({ children, delay = 0 }: { children?: React.ReactNode; delay?: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

const SectionPage = ({
  eyebrow,
  title,
  subtitle,
  children
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) => (
  <section className="relative z-10 pt-36 pb-20">
    <div className="max-w-7xl mx-auto px-6">
      <div className="mb-10 max-w-3xl">
        <p className="text-hunj-300 uppercase tracking-[0.2em] text-xs font-semibold mb-4">{eyebrow}</p>
        <h1 className="text-4xl md:text-5xl font-display font-bold text-white leading-tight">{title}</h1>
        <p className="text-devops-300 mt-4 text-lg leading-relaxed">{subtitle}</p>
      </div>
      {children}
    </div>
  </section>
);

const cardClass =
  'rounded-3xl border border-white/10 bg-devops-900/60 p-6 shadow-[0_12px_30px_rgba(0,0,0,0.25)] backdrop-blur-sm';

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  const [activeDemo, setActiveDemo] = useState(0);
  const [openMenu, setOpenMenu] = useState<MegaMenu>(null);
  const [route, setRoute] = useState<LandingRoute>('home');

  const goTo = (next: LandingRoute) => {
    setRoute(next);
    setOpenMenu(null);
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [route]);

  useEffect(() => {
    if (route !== 'home') return;
    const interval = setInterval(() => {
      setActiveDemo((prev) => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(interval);
  }, [route]);

  const blogPosts = [
    {
      title: 'How To Build a Resume That Passes ATS in 2026',
      tag: 'Resume Strategy',
      summary: 'A practical framework to optimize skills, role keywords, and quantified impact for modern screening systems.'
    },
    {
      title: 'Interview Storytelling With STAR: Beyond Generic Answers',
      tag: 'Interview Prep',
      summary: 'Convert career history into concise, confidence-building narratives hiring managers can trust.'
    },
    {
      title: 'Salary Negotiation Playbook for Tech and Business Roles',
      tag: 'Career Growth',
      summary: 'Benchmarks, scripts, and negotiation structures to increase total compensation without friction.'
    },
    {
      title: 'LinkedIn Positioning: Turn Profile Views Into Recruiter Calls',
      tag: 'Personal Brand',
      summary: 'Profile architecture, headline formulas, and social proof placements that improve inbound opportunities.'
    }
  ];

  const resumeTemplates = [
    'Aurora Grid',
    'Ivy Signal',
    'Slate Executive',
    'Vertex Timeline',
    'Monolith Classic',
    'Atlas Double Column',
    'Nimbus Compact',
    'Catalyst Modern'
  ];

  const coverTemplates = [
    'Signature Intent',
    'Momentum Letter',
    'Opal Narrative',
    'Pulse Brief',
    'Frontier Professional',
    'Arc Executive'
  ];

  const resumeExamples = [
    'Data Scientist Resume Example',
    'Product Manager Resume Example',
    'Business Analyst Resume Example',
    'QA Engineer Resume Example',
    'Project Manager Resume Example',
    'Marketing Manager Resume Example'
  ];

  const coverExamples = [
    'Data Analyst Cover Letter Example',
    'UX Designer Cover Letter Example',
    'Software Engineer Cover Letter Example',
    'Consultant Cover Letter Example',
    'Operations Manager Cover Letter Example',
    'Sales Manager Cover Letter Example'
  ];

  const termsSections = useMemo(
    () => [
      {
        title: 'Welcome to Enhancv',
        body:
          'Thanks for using our platform and trusting us with your career goals. This website and platform ("Services") are provided by Enhancv R&D. ("us", "we", or "our"). By using Enhancv or accessing any of our Services, you are agreeing to these terms.'
      },
      {
        title: 'Accounts',
        body:
          'When you create an account on Enhancv, you are responsible for maintaining its security and for all activities under your account. Use a strong password or third-party authentication. We are not liable for losses arising from failure to protect your credentials. Enhancv is designed for individual job seekers. Commercial use is prohibited unless a business account is arranged via help@enhancv.com.'
      },
      {
        title: 'Content',
        body:
          'You are solely responsible for all content you create using our Services. We may review and remove content that violates our policies, but you should not assume all content is reviewed.'
      },
      {
        title: 'Responsible AI',
        body:
          'Enhancv uses AI to suggest resume content, recommend improvements, and optimize wording based on job descriptions and market trends. AI suggestions support your process but do not replace your judgment. We indicate AI-generated suggestions, maintain privacy and data security standards, do not sell or share personal data with AI model providers, and continuously monitor bias. You remain responsible for reviewing and approving final output. AI does not guarantee employment outcomes.'
      },
      {
        title: 'Subscription Fees',
        body:
          'Enhancv may require payment for some Services. At the start of each billing period, you are charged for that period. Prices may change with at least thirty (30) days notice by email or website posting. Continued use after notice means acceptance of updated charges. Downgrading may reduce capabilities and Enhancv is not liable for this loss of access.'
      },
      {
        title: 'Cancellation',
        body:
          'You must cancel your subscription through the Billing page before your next billing date. After successful cancellation, an email confirmation is sent. We may not be able to process cancellation requests via email, and refunds are not guaranteed if cancellation was not completed in Billing unless a verified technical issue prevented cancellation.'
      },
      {
        title: 'Refunds',
        body:
          'Monthly fees are non-refundable if services were used during that billing period. Quarterly and semi-annual fees may be eligible for partial pro-rated refunds.'
      },
      {
        title: 'Trials & Discounts',
        body:
          'Trials and promo pricing must be used in the specified period and canceled before promotion end to avoid regular charges. Enhancv may limit users to one trial or one promo code and may prevent combining promotions. Promo-discounted fees are non-refundable. Invite credit cannot be exchanged for cash and may have usage deadlines.'
      },
      {
        title: 'Educational Institution Invitations',
        body:
          'If you accept an invitation from a university, bootcamp, or educational organization, you consent to sharing your resumes and usage data with their authorized staff for reporting, evaluation, and career support purposes. You can revoke access by deleting your account.'
      },
      {
        title: 'Termination',
        body:
          'Enhancv may terminate accounts at its sole discretion at any time. Termination may deactivate or delete your account and content, and you may not be eligible for refunds. You may terminate your account through the Account page.'
      },
      {
        title: 'Privacy',
        body: 'Personal information and user content are governed by our Privacy Policy. By using Enhancv, you agree to that policy.'
      },
      {
        title: 'Limited Warranties and Liability',
        body:
          'The Service is provided "AS IS" without warranties on reliability or guaranteed data security. To the maximum extent permitted by law, you agree not to seek indemnification for damages resulting from loss of use, data, or profits connected to Service performance or failure.'
      },
      {
        title: 'Governing Law',
        body:
          'These Terms are governed by the laws of Bulgaria, without regard to conflict of law principles. If any provision is held invalid, the remainder remains in effect. These Terms constitute the entire agreement between you and Enhancv regarding the Services.'
      },
      {
        title: 'Changes',
        body:
          'We may modify these Terms at any time. For material revisions, we aim to provide at least fifteen (15) days notice before new terms take effect. Continued use after updates become effective means you accept the revised Terms.'
      }
    ],
    []
  );

  const privacySections = [
    {
      title: 'Overview',
      body:
        'Last updated: May 28, 2025. This Privacy Policy explains how Enhancv collects, uses, secures, and manages personal information when you use our website and services.'
    },
    {
      title: 'Information We Collect',
      body:
        'We collect account details (name, email, login credentials), profile/resume content, application activity, billing metadata, and technical usage information needed to operate and improve the service.'
    },
    {
      title: 'How We Use Information',
      body:
        'We use data to provide resume and cover-letter tools, power AI suggestions, maintain account security, support subscriptions, improve product performance, and deliver customer support.'
    },
    {
      title: 'AI and Data Handling',
      body:
        'AI tools are used to suggest improvements, optimize wording, and assist drafting. You retain final control of all submitted content. Enhancv does not sell or share personal data with AI model providers.'
    },
    {
      title: 'Data Sharing',
      body:
        'We share data only when required to run the service (for example, infrastructure or payment processing), comply with legal obligations, or with your explicit authorization. If invited by an educational institution, your usage/resume information may be shared with that institution as described in the Terms.'
    },
    {
      title: 'Security',
      body:
        'We use technical and organizational safeguards to protect your data. No method of storage or transmission is fully secure, but we continuously improve controls and monitoring.'
    },
    {
      title: 'Retention',
      body:
        'We retain data as long as needed to provide services, meet contractual obligations, and satisfy legal requirements. You may request deletion by closing your account.'
    },
    {
      title: 'Your Rights',
      body:
        'Depending on your jurisdiction, you may have rights to access, correct, export, or delete personal information. Contact help@enhancv.com for privacy requests.'
    },
    {
      title: 'Contact',
      body: 'If you have questions about this Privacy Policy, contact help@enhancv.com.'
    }
  ];

  const legalPage = (title: string, sections: { title: string; body: string }[]) => (
    <SectionPage
      eyebrow="Legal"
      title={title}
      subtitle="Please review these policies carefully. If you have questions, contact help@enhancv.com."
    >
      <div className="rounded-3xl border border-white/10 bg-devops-900/70 p-8 md:p-10 space-y-8">
        <div className="inline-flex items-center gap-2 text-xs text-devops-300 bg-devops-800/70 border border-white/10 rounded-full px-4 py-2">
          <Shield className="w-3.5 h-3.5 text-hunj-300" /> Last updated: May 28, 2025
        </div>
        {sections.map((section) => (
          <div key={section.title}>
            <h2 className="text-white text-xl font-bold mb-2">{section.title}</h2>
            <p className="text-devops-200 leading-relaxed">{section.body}</p>
          </div>
        ))}
      </div>
    </SectionPage>
  );

  const pageContent = () => {
    switch (route) {
      case 'home':
        return (
          <>
            <section className="relative pt-36 pb-24 lg:pt-44 lg:pb-28 z-10">
              <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
                <div className="space-y-8 max-w-2xl bg-devops-900/65 border border-white/10 rounded-3xl p-8 lg:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-sm">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-hunj-900/30 border border-hunj-500/30 text-hunj-300 text-xs font-bold uppercase tracking-widest">
                    <span className="w-2 h-2 rounded-full bg-hunj-400 animate-pulse"></span>
                    AI-Native Career OS
                  </div>

                  <h1 className="text-5xl lg:text-6xl font-display font-bold text-white leading-[1.05] tracking-tight">
                    Turn Your Resume Into
                    <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-hunj-400 via-purple-400 to-emerald-300">Career Intelligence</span>
                  </h1>

                  <p className="text-lg text-devops-300 max-w-lg leading-relaxed">
                    Engineer your next role using structured career data, role-matching AI, and workflow automation designed for high-intent candidates.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4 pt-2">
                    <button
                      onClick={onStart}
                      className="group px-8 py-4 bg-hunj-600 hover:bg-hunj-500 text-white rounded-2xl font-bold text-lg transition-all hover:scale-[1.02] shadow-[0_0_40px_-10px_rgba(124,58,237,0.5)] flex items-center justify-center gap-3"
                    >
                      Start Free Trial <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button
                      onClick={() => goTo('resume-examples')}
                      className="px-8 py-4 bg-devops-800 text-white border border-white/10 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3"
                    >
                      <Play className="w-5 h-5 fill-white" /> Explore Examples
                    </button>
                  </div>

                  <div className="pt-3 flex flex-wrap items-center gap-3 text-sm text-devops-200 font-medium">
                    <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10">
                      <Star className="w-4 h-4 text-emerald-400 fill-emerald-400" /> 5,100 Reviews
                    </span>
                    <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10">
                      <MessageSquare className="w-4 h-4 text-purple-300" /> 28,452 users landed interviews last month
                    </span>
                    <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" /> ATS-ready output
                    </span>
                  </div>
                </div>

                <div className="relative w-full h-[480px] hidden lg:block">
                  <div className={`absolute top-12 left-8 w-[340px] h-[430px] bg-white rounded-xl shadow-2xl border border-slate-200 p-6 transform transition-all duration-700 ${activeDemo === 0 ? 'scale-100 z-30 opacity-100' : 'scale-90 z-10 opacity-40 -rotate-6 translate-x-10'}`}>
                    <div className="h-4 w-20 bg-slate-200 rounded mb-6"></div>
                    <div className="space-y-3">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="h-2 bg-slate-100 rounded w-full"></div>
                      ))}
                      <div className="h-20 border-2 border-dashed border-red-200 bg-red-50 rounded-lg flex items-center justify-center text-red-400 text-xs font-bold mt-4">
                        UNSTRUCTURED TEXT
                      </div>
                    </div>
                  </div>

                  <div className={`absolute top-20 right-0 w-[400px] h-[390px] bg-devops-900 border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] p-5 transition-all duration-700 ${activeDemo === 0 ? 'translate-x-20 opacity-0' : 'translate-x-0 opacity-100 z-30'}`}>
                    <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                      <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      </div>
                      <div className="text-[10px] font-mono text-hunj-400">ANALYSIS_COMPLETE</div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2 bg-devops-800/50 p-4 rounded-xl border border-white/5">
                        <div className="flex justify-between mb-2">
                          <span className="text-xs text-devops-400">Job Match</span>
                          <span className="text-xs font-bold text-green-400">94%</span>
                        </div>
                        <div className="w-full bg-devops-950 h-2 rounded-full overflow-hidden">
                          <div className="bg-green-500 h-full w-[94%]"></div>
                        </div>
                      </div>

                      <div className="bg-devops-800/50 p-4 rounded-xl border border-white/5 text-center">
                        <div className="text-xl font-bold text-white">4</div>
                        <div className="text-[10px] text-devops-400">Skill Gaps</div>
                      </div>

                      <div className="bg-devops-800/50 p-4 rounded-xl border border-white/5 text-center">
                        <div className="text-xl font-bold text-white">$145k</div>
                        <div className="text-[10px] text-devops-400">Est. Salary</div>
                      </div>
                    </div>

                    <div className="mt-4 bg-devops-950 rounded-xl p-3 border border-white/5">
                      <div className="text-[10px] text-devops-500 mb-1">OPTIMIZED BULLET</div>
                      <div className="text-xs text-green-300 font-mono">{`> Architected scalable services reducing latency by 40%`}</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="py-20 relative z-10">
              <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-4">The New Standard in Career Engineering</h2>
                  <p className="text-devops-300 max-w-2xl mx-auto text-lg">
                    Traditional builders format text. HUNJ transforms your profile into reusable, queryable career intelligence.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    {
                      icon: <Briefcase className="w-6 h-6" />,
                      title: 'Structured Intelligence',
                      desc: 'Turn unstructured resumes into measurable, reusable achievement entities.'
                    },
                    {
                      icon: <Target className="w-6 h-6" />,
                      title: 'Semantic Tailoring',
                      desc: 'Match role intent with bullet-level optimization for better recruiter and ATS outcomes.'
                    },
                    {
                      icon: <TrendingUp className="w-6 h-6" />,
                      title: 'Market Recon',
                      desc: 'Track salary trends, skill demand, and opportunity quality before every application.'
                    }
                  ].map((item, index) => (
                    <FadeIn key={item.title} delay={index * 150}>
                      <div className={cardClass}>
                        <div className="w-12 h-12 rounded-2xl bg-hunj-500/20 text-hunj-300 flex items-center justify-center mb-4">{item.icon}</div>
                        <h3 className="text-white text-xl font-bold mb-2">{item.title}</h3>
                        <p className="text-devops-300">{item.desc}</p>
                      </div>
                    </FadeIn>
                  ))}
                </div>
              </div>
            </section>

            <section className="py-20 text-center relative z-10">
              <div className="max-w-3xl mx-auto px-6 space-y-8">
                <h2 className="text-4xl md:text-5xl font-display font-bold text-white">Ready to Upgrade Your Career?</h2>
                <p className="text-lg text-devops-300">Join thousands of candidates using AI to land stronger roles faster.</p>
                <button
                  onClick={onStart}
                  className="px-10 py-4 bg-white text-devops-950 rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-2xl inline-flex items-center gap-2"
                >
                  Initialize Career OS <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </section>
          </>
        );
      case 'blog':
        return (
          <SectionPage
            eyebrow="Resources"
            title="Career Blog"
            subtitle="Research-backed guides for resume optimization, interview performance, and long-term career strategy."
          >
            <div className="grid md:grid-cols-2 gap-6">
              {blogPosts.map((post) => (
                <article key={post.title} className={cardClass}>
                  <div className="inline-flex rounded-full px-3 py-1 text-xs bg-hunj-500/20 text-hunj-300 border border-hunj-400/30 mb-4">{post.tag}</div>
                  <h2 className="text-white text-2xl font-bold mb-3">{post.title}</h2>
                  <p className="text-devops-300 mb-5">{post.summary}</p>
                  <button onClick={() => goTo('career-guide')} className="text-hunj-300 font-semibold inline-flex items-center gap-2 hover:text-white transition-colors">
                    Read article <ArrowRight className="w-4 h-4" />
                  </button>
                </article>
              ))}
            </div>
          </SectionPage>
        );
      case 'pricing':
        return (
          <SectionPage
            eyebrow="Plans"
            title="Pricing"
            subtitle="Start free. Upgrade when you need deeper AI limits, advanced workflows, and premium optimization tools."
          >
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  name: 'Free',
                  price: '$0',
                  detail: 'Great for trying the platform',
                  features: ['Basic resume editor', '3 AI actions/day', 'Core templates'],
                  cta: 'Get Started'
                },
                {
                  name: 'Pro',
                  price: '$19/mo',
                  detail: 'Best for active job seekers',
                  features: ['Unlimited AI optimization', 'Advanced job matching', 'Interview copilot'],
                  cta: 'Upgrade to Pro'
                },
                {
                  name: 'Team',
                  price: '$79/mo',
                  detail: 'For institutions and career teams',
                  features: ['Multi-seat management', 'Analytics dashboard', 'Dedicated support'],
                  cta: 'Contact Sales'
                }
              ].map((plan, idx) => (
                <div key={plan.name} className={`${cardClass} ${idx === 1 ? 'border-hunj-400/50 shadow-[0_12px_40px_rgba(124,58,237,0.2)]' : ''}`}>
                  <h2 className="text-white text-2xl font-bold">{plan.name}</h2>
                  <p className="text-4xl font-bold text-hunj-300 mt-3">{plan.price}</p>
                  <p className="text-devops-300 mt-2">{plan.detail}</p>
                  <ul className="mt-6 space-y-3 text-devops-200">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <button onClick={onStart} className="mt-7 w-full px-4 py-3 rounded-xl bg-hunj-600 hover:bg-hunj-500 text-white font-semibold transition-colors">
                    {plan.cta}
                  </button>
                </div>
              ))}
            </div>
          </SectionPage>
        );
      case 'organizations':
        return (
          <SectionPage
            eyebrow="Enterprise"
            title="For Organizations"
            subtitle="Give career teams and educational institutions a measurable system for candidate outcomes."
          >
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {[
                {
                  icon: <Users className="w-6 h-6" />,
                  title: 'Bootcamps & Universities',
                  desc: 'Track resume quality and interview readiness across cohorts.'
                },
                {
                  icon: <Building2 className="w-6 h-6" />,
                  title: 'Career Services Teams',
                  desc: 'Standardize advising with AI-assisted personalization at scale.'
                },
                {
                  icon: <Sparkles className="w-6 h-6" />,
                  title: 'Upskilling Platforms',
                  desc: 'Bundle resume intelligence into professional development programs.'
                }
              ].map((item) => (
                <div key={item.title} className={cardClass}>
                  <div className="w-11 h-11 rounded-xl bg-hunj-500/20 text-hunj-300 flex items-center justify-center mb-4">{item.icon}</div>
                  <h2 className="text-white text-xl font-bold mb-2">{item.title}</h2>
                  <p className="text-devops-300">{item.desc}</p>
                </div>
              ))}
            </div>
            <div className={`${cardClass} bg-gradient-to-r from-hunj-900/50 to-devops-900/90`}>
              <h3 className="text-white text-2xl font-bold mb-2">Need a custom rollout?</h3>
              <p className="text-devops-200 mb-6">Contact help@enhancv.com to configure team onboarding, access policies, and reporting.</p>
              <button onClick={onStart} className="px-5 py-3 rounded-xl bg-white text-devops-950 font-semibold hover:bg-slate-100 transition-colors">
                Request Demo
              </button>
            </div>
          </SectionPage>
        );
      case 'resume-builder':
      case 'cover-letter-builder':
        return (
          <SectionPage
            eyebrow="Builder"
            title={route === 'resume-builder' ? 'AI Resume Builder' : 'AI Cover Letter Builder'}
            subtitle="Generate tailored, ATS-optimized documents with editable sections and intelligent recommendations."
          >
            <div className="grid md:grid-cols-2 gap-6">
              <div className={cardClass}>
                <h2 className="text-white text-2xl font-bold mb-3">What you can do</h2>
                <ul className="space-y-3 text-devops-200">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Build from scratch or import existing drafts</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Run AI rewrites for impact and clarity</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Optimize to specific jobs in one click</li>
                </ul>
              </div>
              <div className={`${cardClass} border-hunj-400/40`}>
                <h2 className="text-white text-2xl font-bold mb-3">Start now</h2>
                <p className="text-devops-300 mb-5">Open your workspace to create and manage documents from your Career OS dashboard.</p>
                <button onClick={onStart} className="px-5 py-3 rounded-xl bg-hunj-600 hover:bg-hunj-500 text-white font-semibold">
                  Open Workspace
                </button>
              </div>
            </div>
          </SectionPage>
        );
      case 'resume-templates':
      case 'cover-letter-templates':
        return (
          <SectionPage
            eyebrow="Templates"
            title={route === 'resume-templates' ? 'Resume Templates' : 'Cover Letter Templates'}
            subtitle="Professionally structured templates designed for readability, ATS compatibility, and modern visual polish."
          >
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(route === 'resume-templates' ? resumeTemplates : coverTemplates).map((template) => (
                <div key={template} className={cardClass}>
                  <div className="h-36 rounded-2xl bg-gradient-to-br from-hunj-700/30 to-emerald-600/20 border border-white/10 mb-4"></div>
                  <h2 className="text-white text-xl font-bold mb-2">{template}</h2>
                  <p className="text-devops-300 mb-4">Optimized for premium presentation and recruiter readability.</p>
                  <button onClick={onStart} className="text-hunj-300 font-semibold inline-flex items-center gap-2 hover:text-white transition-colors">
                    Use Template <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </SectionPage>
        );
      case 'resume-examples':
      case 'cover-letter-examples':
        return (
          <SectionPage
            eyebrow="Examples"
            title={route === 'resume-examples' ? 'Resume Examples' : 'Cover Letter Examples'}
            subtitle="Role-specific examples to accelerate your first draft with proven structures and language patterns."
          >
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(route === 'resume-examples' ? resumeExamples : coverExamples).map((example) => (
                <div key={example} className={cardClass}>
                  <h2 className="text-white text-xl font-bold mb-3">{example}</h2>
                  <p className="text-devops-300 mb-4">Includes section-by-section guidance and editable starter content.</p>
                  <button onClick={onStart} className="text-hunj-300 font-semibold inline-flex items-center gap-2 hover:text-white transition-colors">
                    Open Example <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </SectionPage>
        );
      case 'resume-guides':
      case 'cover-letter-guides':
      case 'career-guide':
        return (
          <SectionPage
            eyebrow="Guides"
            title={
              route === 'cover-letter-guides'
                ? 'Cover Letter Writing Guides'
                : route === 'career-guide'
                  ? 'Career Guide'
                  : 'Resume Writing Guides'
            }
            subtitle="Step-by-step reference material to improve writing quality, storytelling, and conversion outcomes."
          >
            <div className="grid md:grid-cols-2 gap-6">
              {[
                'Writing a compelling opening statement',
                'Quantifying impact with business metrics',
                'Choosing a format that fits your stage',
                'Fitting key experience on one page',
                'Avoiding common ATS parsing pitfalls',
                'Tailoring for role-specific outcomes'
              ].map((guide) => (
                <div key={guide} className={cardClass}>
                  <h2 className="text-white text-lg font-bold mb-2">{guide}</h2>
                  <p className="text-devops-300">Practical checklists and examples you can apply immediately.</p>
                </div>
              ))}
            </div>
          </SectionPage>
        );
      case 'salary-data':
        return (
          <SectionPage
            eyebrow="Insights"
            title="Salary Data"
            subtitle="Use compensation intelligence to benchmark offers and negotiate with confidence."
          >
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { role: 'Senior Product Manager', band: '$145k - $190k', trend: '+9% YoY' },
                { role: 'Data Scientist II', band: '$130k - $175k', trend: '+12% YoY' },
                { role: 'Software Engineer', band: '$125k - $180k', trend: '+8% YoY' }
              ].map((row) => (
                <div key={row.role} className={cardClass}>
                  <h2 className="text-white text-xl font-bold">{row.role}</h2>
                  <p className="text-hunj-300 text-3xl font-bold mt-3">{row.band}</p>
                  <p className="text-emerald-300 mt-2">{row.trend}</p>
                </div>
              ))}
            </div>
          </SectionPage>
        );
      case 'success-stories':
        return (
          <SectionPage
            eyebrow="Proof"
            title="Success Stories"
            subtitle="Real users improving interview rates through targeted resume intelligence and disciplined application strategy."
          >
            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  name: 'Mina K., Business Analyst',
                  story: 'Improved interview conversion from 7% to 28% after rebuilding resume with quantified achievements.'
                },
                {
                  name: 'Andre J., Software Engineer',
                  story: 'Used AI role matching to prioritize applications and landed a senior role in 6 weeks.'
                },
                {
                  name: 'Farah T., Product Manager',
                  story: 'Negotiated a 17% higher offer after using salary intelligence and negotiation prep guides.'
                },
                {
                  name: 'Luis C., Data Analyst',
                  story: 'Converted legacy CV into an ATS-friendly profile and doubled recruiter response rate.'
                }
              ].map((item) => (
                <div key={item.name} className={cardClass}>
                  <h2 className="text-white text-xl font-bold mb-2">{item.name}</h2>
                  <p className="text-devops-300">{item.story}</p>
                </div>
              ))}
            </div>
          </SectionPage>
        );
      case 'terms-and-conditions':
        return legalPage('Terms and Conditions', termsSections);
      case 'terms-of-service':
        return legalPage('Terms of Service', termsSections);
      case 'privacy-policy':
        return legalPage('Privacy Policy', privacySections);
      default:
        return null;
    }
  };

  const headerLinkClass = (isActive: boolean) =>
    `transition-colors ${isActive ? 'text-white' : 'text-devops-200 hover:text-white'}`;

  return (
    <div className="min-h-screen bg-devops-950 text-slate-300 font-sans selection:bg-hunj-500/30 overflow-x-hidden relative">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_85%_60%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        <div className="absolute top-[-10%] left-[-10%] w-[760px] h-[760px] bg-hunj-600/10 rounded-full blur-[130px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[640px] h-[640px] bg-emerald-500/10 rounded-full blur-[120px]"></div>
      </div>

      <nav className="fixed w-full z-50 top-0 border-b border-white/10 bg-devops-950/95 backdrop-blur-xl text-devops-100" onMouseLeave={() => setOpenMenu(null)}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <button className="flex items-center gap-3 group" onClick={() => goTo('home')}>
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-md">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div className="font-display font-bold text-white text-xl tracking-tight leading-none">HUNJ</div>
            </button>

            <div className="hidden lg:flex items-center gap-6 text-[16px] font-medium">
              <button onMouseEnter={() => setOpenMenu('resume')} className={headerLinkClass(openMenu === 'resume')}>
                <span className="inline-flex items-center gap-1.5">Resume <ChevronDown className="w-4 h-4" /></span>
              </button>
              <button onMouseEnter={() => setOpenMenu('cover-letter')} className={headerLinkClass(openMenu === 'cover-letter')}>
                <span className="inline-flex items-center gap-1.5">Cover Letter <ChevronDown className="w-4 h-4" /></span>
              </button>
              <button onClick={() => goTo('blog')} className={headerLinkClass(route === 'blog')}>Blog</button>
              <button onClick={() => goTo('organizations')} className={headerLinkClass(route === 'organizations')}>For Organizations</button>
              <button onClick={() => goTo('pricing')} className={headerLinkClass(route === 'pricing')}>Pricing</button>
            </div>
          </div>

          <div className="flex gap-3 items-center">
            <button onClick={onStart} className="text-sm font-semibold border border-white/20 text-white rounded-lg px-4 py-2 hover:bg-white/10 transition-colors">
              Sign In
            </button>
            <button onClick={onStart} className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg font-bold text-sm transition-colors">
              Get Started
            </button>
          </div>
        </div>

        {openMenu && (
          <div className="border-t border-white/10 bg-devops-950/98 shadow-xl">
            <div className="max-w-7xl mx-auto px-6 py-7 grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="space-y-4">
                <h4 className="text-hunj-300 font-bold text-lg">{openMenu === 'resume' ? 'Resume Tools' : 'Cover Letter Tools'}</h4>
                <button
                  onClick={() => goTo(openMenu === 'resume' ? 'resume-builder' : 'cover-letter-builder')}
                  className="w-full text-left flex items-center gap-2 text-devops-200 font-semibold hover:text-white"
                >
                  <FileText className="w-4 h-4" /> {openMenu === 'resume' ? 'AI Resume Builder' : 'Cover Letter Builder'}
                </button>
                <button
                  onClick={() => goTo(openMenu === 'resume' ? 'resume-templates' : 'cover-letter-templates')}
                  className="w-full text-left flex items-center gap-2 text-devops-200 font-semibold hover:text-white"
                >
                  <LayoutTemplate className="w-4 h-4" /> {openMenu === 'resume' ? 'Templates' : 'Cover Templates'}
                </button>
                <button
                  onClick={() => goTo(openMenu === 'resume' ? 'resume-examples' : 'cover-letter-examples')}
                  className="w-full text-left flex items-center gap-2 text-devops-200 font-semibold hover:text-white"
                >
                  <Sparkles className="w-4 h-4" /> Examples
                </button>
              </div>

              <div className="space-y-3">
                <h4 className="text-hunj-300 font-bold text-lg">{openMenu === 'resume' ? 'Template Categories' : 'Writing Guides'}</h4>
                {(openMenu === 'resume' ? ['Creative Templates', 'Traditional Templates', 'Modern Templates', 'Simple Templates'] : ['Opening Techniques', 'Body Paragraph Strategy', 'Closing with Impact', 'Role-Specific Writing']).map((item) => (
                  <button
                    key={item}
                    onClick={() => goTo(openMenu === 'resume' ? 'resume-templates' : 'cover-letter-guides')}
                    className="block text-devops-300 hover:text-white"
                  >
                    {item}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                <h4 className="text-hunj-300 font-bold text-lg">Guides & Examples</h4>
                <button onClick={() => goTo(openMenu === 'resume' ? 'resume-guides' : 'cover-letter-guides')} className="text-devops-300 hover:text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4" /> Writing Guide
                </button>
                {['Data Scientist', 'Project Manager', 'Business Analyst'].map((role) => (
                  <button key={role} onClick={() => goTo(openMenu === 'resume' ? 'resume-examples' : 'cover-letter-examples')} className="block text-devops-300 hover:text-white">
                    {role}
                  </button>
                ))}
              </div>

              <div className="bg-gradient-to-br from-hunj-800/50 via-devops-900 to-emerald-800/40 rounded-2xl p-5 border border-hunj-400/30">
                <h4 className="text-2xl font-bold text-white">ATS-friendly {openMenu === 'resume' ? 'resume' : 'cover letter'} builder</h4>
                <button onClick={onStart} className="mt-4 px-4 py-2.5 bg-hunj-600 hover:bg-hunj-500 text-white rounded-lg font-bold">
                  Build Your HUNJ Document
                </button>
                <p className="text-xs text-devops-300 mt-3 flex items-center gap-1">
                  <Building2 className="w-3 h-3" /> Used by candidates at top companies.
                </p>
              </div>
            </div>
          </div>
        )}
      </nav>

      {pageContent()}

      <footer className="relative z-10 border-t border-white/10 bg-devops-950 py-12 text-sm">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <button onClick={() => goTo('home')} className="flex items-center gap-2 font-bold text-white mb-4">
              <Target className="w-5 h-5 text-hunj-500" /> HUNJ
            </button>
            <p className="text-devops-400">The intelligent operating system for your career.</p>
          </div>

          <div>
            <h4 className="font-bold text-white mb-4">Platform</h4>
            <ul className="space-y-2 text-devops-300">
              <li><button onClick={() => goTo('resume-builder')} className="hover:text-white">Resume Builder</button></li>
              <li><button onClick={() => goTo('resume-templates')} className="hover:text-white">Resume Templates</button></li>
              <li><button onClick={() => goTo('cover-letter-builder')} className="hover:text-white">Cover Letter Builder</button></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-4">Resources</h4>
            <ul className="space-y-2 text-devops-300">
              <li><button onClick={() => goTo('blog')} className="hover:text-white">Blog</button></li>
              <li><button onClick={() => goTo('career-guide')} className="hover:text-white">Career Guide</button></li>
              <li><button onClick={() => goTo('salary-data')} className="hover:text-white">Salary Data</button></li>
              <li><button onClick={() => goTo('success-stories')} className="hover:text-white">Success Stories</button></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-4">Legal</h4>
            <ul className="space-y-2 text-devops-300">
              <li><button onClick={() => goTo('terms-and-conditions')} className="hover:text-white">Terms and Conditions</button></li>
              <li><button onClick={() => goTo('terms-of-service')} className="hover:text-white">Terms of Service</button></li>
              <li><button onClick={() => goTo('privacy-policy')} className="hover:text-white">Privacy Policy</button></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 text-center text-devops-500 border-t border-white/10 pt-8">
          &copy; {new Date().getFullYear()} HUNJ Inc. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
