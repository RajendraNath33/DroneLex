import type { ReactNode } from 'react';

interface PhoneFrameProps {
  children: ReactNode;
}

export default function PhoneFrame({ children }: PhoneFrameProps) {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center sm:p-4">
      <div className="relative w-full max-w-md overflow-hidden bg-slate-950 shadow-2xl sm:rounded-[2.5rem] sm:border-[10px] sm:border-slate-800">
        <div className="relative h-screen overflow-hidden bg-slate-950 sm:h-[844px]">
          {children}
        </div>
      </div>
    </div>
  );
}
