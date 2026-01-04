
import React, { useState } from 'react';
import { X, ArrowRight, Check } from 'lucide-react';

interface OnboardingTourProps {
  onComplete: () => void;
}

const STEPS = [
    {
        title: "Welcome to HUNJ",
        desc: "Your intelligent career command center. Let's take a quick tour to help you hunt your dream job effectively.",
        image: "🎯"
    },
    {
        title: "Master Profile",
        desc: "Go to the 'Profile' section to set up your base resume. This is the source of truth that AI uses to generate tailored applications.",
        image: "👤"
    },
    {
        title: "Start a Hunt",
        desc: "Click 'New Application' to paste a job description. HUNJ will analyze it, score your resume, and generate a tailored version instantly.",
        image: "🚀"
    },
    {
        title: "AI Assistant",
        desc: "Use the 'Copilot' button in the bottom right corner to ask for resume tweaks, rewrite summaries, or get career advice anytime.",
        image: "🤖"
    }
];

const OnboardingTour: React.FC<OnboardingTourProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);

  const handleNext = () => {
      if (step < STEPS.length - 1) {
          setStep(step + 1);
      } else {
          onComplete();
      }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
        <div className="bg-devops-900 border border-devops-700 rounded-2xl p-8 max-w-md w-full shadow-2xl relative">
            <button 
                onClick={onComplete}
                className="absolute top-4 right-4 text-devops-400 hover:text-white"
            >
                <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-20 h-20 bg-hunj-600/10 rounded-full flex items-center justify-center text-4xl mb-2 animate-bounce">
                    {STEPS[step].image}
                </div>
                
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2">{STEPS[step].title}</h2>
                    <p className="text-devops-300 leading-relaxed">
                        {STEPS[step].desc}
                    </p>
                </div>

                <div className="flex gap-2">
                    {STEPS.map((_, i) => (
                        <div 
                            key={i} 
                            className={`w-2 h-2 rounded-full transition-all ${i === step ? 'bg-hunj-500 w-6' : 'bg-devops-700'}`}
                        ></div>
                    ))}
                </div>

                <button 
                    onClick={handleNext}
                    className="w-full py-3 bg-hunj-600 hover:bg-hunj-500 text-white rounded-xl font-bold shadow-lg shadow-hunj-600/20 transition-all flex items-center justify-center gap-2"
                >
                    {step === STEPS.length - 1 ? (
                        <>Get Started <Check className="w-5 h-5" /></>
                    ) : (
                        <>Next Step <ArrowRight className="w-5 h-5" /></>
                    )}
                </button>
            </div>
        </div>
    </div>
  );
};

export default OnboardingTour;
