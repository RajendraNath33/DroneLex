import { useState } from 'react';
import { ArrowLeft, Award, FileText, Fingerprint, Gavel, Layers, MapPin, MessageSquare } from 'lucide-react';
import type { ScreenName } from '@/types';
import ContentBody from '@/components/ContentBody';

const FORMAT =
  ' Use short headings starting with "## " and bullet points starting with "- ". Keep it under 350 words.';

const topics = [
  {
    id: 'rules-2021',
    title: 'Drone Rules, 2021',
    desc: 'Overview and key points',
    icon: FileText,
    prompt: "Explain India's Drone Rules, 2021 in simple language: purpose, who they apply to, and key points." + FORMAT,
  },
  {
    id: 'registration',
    title: 'Registration & UIN',
    desc: 'Who needs it and how',
    icon: Fingerprint,
    prompt: 'Explain drone registration and Unique Identification Number (UIN) requirements in India, and the process.' + FORMAT,
  },
  {
    id: 'zones',
    title: 'Airspace Zones',
    desc: 'Green, Yellow, Red',
    icon: MapPin,
    prompt: 'Explain drone airspace zones in India (Green, Yellow, Red) and how to check them on Digital Sky.' + FORMAT,
  },
  {
    id: 'licence',
    title: 'Remote Pilot Certificate',
    desc: 'Licence and training',
    icon: Award,
    prompt: 'Explain the Remote Pilot Certificate (drone pilot licence) in India: who needs it, eligibility, and the process.' + FORMAT,
  },
  {
    id: 'categories',
    title: 'Drone Categories',
    desc: 'Weight classes',
    icon: Layers,
    prompt: 'Explain drone categories by weight/size under Indian drone rules and what changes for each category.' + FORMAT,
  },
  {
    id: 'penalties',
    title: 'Penalties & Compliance',
    desc: 'Violations and fines',
    icon: Gavel,
    prompt: 'Explain penalties for violating Indian drone rules and a practical compliance checklist for pilots.' + FORMAT,
  },
];

export default function LawsScreen({ onNavigate }: { onNavigate: (screen: ScreenName) => void }) {
  const [topicId, setTopicId] = useState<string | null>(null);
  const topic = topics.find((t) => t.id === topicId);

  if (topic) {
    return (
      <div className="h-full overflow-y-auto no-scrollbar pb-28">
        <div className="px-5 pt-14">
          <button onClick={() => setTopicId(null)} className="flex items-center gap-2 text-sm text-sky-400">
            <ArrowLeft size={18} /> Back to Drone Laws
          </button>
          <h1 className="font-display mt-4 text-xl font-bold text-white">{topic.title}</h1>
        </div>
        <div className="mx-5 mt-5">
          <ContentBody key={topic.id} cacheKey={`law:${topic.id}`} prompt={topic.prompt} />
        </div>
        <div className="mx-5 mt-6">
          <button
            onClick={() => onNavigate('chat')}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-sky-500/20 bg-sky-500/10 py-3.5 text-sm font-medium text-sky-300"
          >
            <MessageSquare size={18} /> AI se poochho
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-28">
      <div className="px-6 pt-14 pb-4">
        <h1 className="font-display text-2xl font-bold text-white">Drone Laws</h1>
        <p className="mt-1 text-xs text-slate-400">DGCA rules aur compliance, topic-wise</p>
      </div>

      <div className="mx-5 space-y-2">
        {topics.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTopicId(t.id)}
              className="flex w-full items-center gap-3 rounded-xl border border-white/5 bg-slate-900/60 p-3.5 text-left"
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-amber-500/15">
                <Icon size={20} className="text-amber-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{t.title}</p>
                <p className="text-[11px] text-slate-500">{t.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mx-5 mt-6">
        <button
          onClick={() => onNavigate('chat')}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 py-3.5 text-sm font-semibold text-white"
        >
          <MessageSquare size={18} /> AI se poochho
        </button>
      </div>
    </div>
  );
}
