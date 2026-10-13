import React from 'react';
import { AlertTriangle, ShieldAlert } from 'lucide-react';

export const DisclaimerBanner: React.FC = () => {
  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-xs sm:text-sm text-amber-900 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 max-w-6xl mx-auto w-full">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
        <div>
          <span className="font-semibold uppercase tracking-wider text-amber-800 mr-2">
            Educational Prototype Only:
          </span>
          <span>
            This system demonstrates computer science concepts (DMGT Propositional Logic, ADSA Min-Heap, OOP in Java, Python Acuity Scoring).
            It is <strong className="font-semibold">NOT</strong> a clinically validated diagnostic tool. Emergency patients require immediate assessment by qualified medical professionals.
          </span>
        </div>
      </div>
    </div>
  );
};
