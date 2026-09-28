import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import type { TrainingModule } from '@/types';
import ContentBody from '@/components/ContentBody';

interface LessonViewProps {
  mod: TrainingModule;
  index: number;
  completed: boolean;
  onBack: () => void;
  onComplete: () => void;
}

export default function LessonView({ mod, index, completed, onBack, onComplete }: LessonViewProps) {
  const lawNote =
    mod.category === 'drone-law'
      ? ' Base it on the DGCA / drone regulation documents available to you.'
      : '';
  const prompt =
    `Module: "${mod.title}" (${mod.description}). ` +
    `Write lesson ${index + 1} of ${mod.lessons} as a beginner-friendly lesson for Indian drone learners.` +
    lawNote +
    ' Use short headings starting with "## " and bullet points starting with "- ".' +
    ' End with a 3-point summary. Keep it under 400 words.';

  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-28">
      <div className="px-5 pt-14">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-sky-400">
          <ArrowLeft size={18} /> Back to lessons
        </button>
        <p className="mt-4 text-[11px] uppercase tracking-wide text-slate-500">{mod.title}</p>
        <h1 className="font-display mt-1 text-xl font-bold leading-tight text-white">
          Lesson {index + 1}: {mod.title} - Part {index + 1}
        </h1>
      </div>

      <div className="mx-5 mt-5">
        <ContentBody cacheKey={`lesson:${mod.id}:${index}`} prompt={prompt} />
      </div>

      <div className="mx-5 mt-6">
        <button
          onClick={onComplete}
          disabled={completed}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 py-3.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 disabled:opacity-60"
        >
          <CheckCircle2 size={18} /> {completed ? 'Completed' : 'Mark complete'}
        </button>
      </div>
    </div>
  );
}
