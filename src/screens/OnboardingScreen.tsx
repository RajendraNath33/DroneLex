import { useState } from 'react';
import { Plane, MessageSquare, GraduationCap, Scale, ArrowRight } from 'lucide-react';

interface OnboardingScreenProps {
  onComplete: () => void;
}

const slides = [
  {
    icon: MessageSquare,
    title: 'AI Chat Assistant',
    description: 'Ask anything about drone piloting, aircraft design, or aviation regulations. Upload PDFs for context-aware answers.',
    gradient: 'from-sky-500 to-cyan-500',
  },
  {
    icon: GraduationCap,
    title: 'Comprehensive Training',
    description: 'Master aircraft design, advanced drone technology, helicopter engineering, robotics, and DGCA compliance.',
    gradient: 'from-cyan-500 to-teal-500',
  },
  {
    icon: Scale,
    title: 'DGCA Law & Compliance',
    description: 'Stay updated with Indian drone regulations, airspace rules, and pilot licensing requirements.',
    gradient: 'from-orange-500 to-amber-500',
  },
  {
    icon: Plane,
    title: 'Track Your Progress',
    description: 'Bookmark legal sections, monitor training completion, and build your aviation expertise.',
    gradient: 'from-sky-500 to-blue-500',
  },
];

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [index, setIndex] = useState(0);
  const isLast = index === slides.length - 1;
  const slide = slides[index];
  const Icon = slide.icon;

  const next = () => {
    if (isLast) {
      onComplete();
    } else {
      setIndex(index + 1);
    }
  };

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0">
        <div className={`absolute -right-32 -top-20 h-72 w-72 rounded-full bg-gradient-to-br ${slide.gradient} opacity-10 blur-3xl transition-all duration-700`} />
        <div className="absolute -bottom-20 -left-32 h-72 w-72 rounded-full bg-sky-500/5 blur-3xl" />
      </div>

      {/* Skip button */}
      <div className="relative z-10 flex justify-end p-6">
        <button
          onClick={onComplete}
          className="text-xs font-medium text-slate-400 transition-colors hover:text-sky-300"
        >
          Skip
        </button>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-8">
        <div
          key={index}
          className="mb-10 flex h-32 w-32 items-center justify-center rounded-[2rem] bg-gradient-to-br shadow-2xl animate-scale-in"
          style={{
            background: `linear-gradient(135deg, var(--tw-gradient-stops))`,
          }}
        >
          <div className={`flex h-32 w-32 items-center justify-center rounded-[2rem] bg-gradient-to-br ${slide.gradient} shadow-2xl`}>
            <Icon size={56} className="text-white" />
          </div>
        </div>

        <h2
          key={`title-${index}`}
          className="font-display mb-4 text-2xl font-bold text-white animate-fade-in-up text-center"
        >
          {slide.title}
        </h2>
        <p
          key={`desc-${index}`}
          className="max-w-[280px] text-center text-sm leading-relaxed text-slate-400 animate-fade-in-up delay-1"
        >
          {slide.description}
        </p>
      </div>

      {/* Dots + button */}
      <div className="relative z-10 px-8 pb-10">
        <div className="mb-8 flex justify-center gap-2">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === index
                  ? 'w-6 bg-gradient-to-r from-sky-500 to-cyan-400'
                  : 'w-1.5 bg-slate-700'
              }`}
            />
          ))}
        </div>

        <button
          onClick={next}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-500 py-4 text-sm font-semibold text-white shadow-lg shadow-sky-500/30 transition-all hover:shadow-sky-500/40"
        >
          {isLast ? 'Get Started' : 'Continue'}
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
