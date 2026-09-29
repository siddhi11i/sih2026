import React from 'react';
import { HelpCircle, ArrowRight, X } from 'lucide-react';

export default function ClarificationModal({ clarification, onSelectChoice, onDismiss }) {
  if (!clarification) return null;

  return (
    <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-500/40 rounded-2xl p-4 mb-6 shadow-sm dark:shadow-lg dark:shadow-amber-950/30 animate-in fade-in duration-200">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-amber-200/60 dark:bg-amber-500/20 rounded-xl text-amber-800 dark:text-amber-400 mt-0.5">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-200">Specification Clarification Required</h4>
              <span className="bg-amber-200 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 text-[10px] px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-500/30 uppercase tracking-wider font-bold">
                Ambiguous Scope
              </span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 mt-1">{clarification.question_text}</p>

            {/* Choices Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
              {clarification.choices.map((choice, idx) => (
                <button
                  key={idx}
                  onClick={() => onSelectChoice(choice.query_modifier)}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-amber-100/60 dark:hover:bg-amber-900/40 border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500/60 text-left transition-all group shadow-2xs cursor-pointer"
                >
                  <span className="text-xs text-slate-800 dark:text-slate-200 group-hover:text-amber-900 dark:group-hover:text-amber-200 font-medium">
                    {choice.label}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transform group-hover:translate-x-0.5 transition-all" />
                </button>
              ))}
            </div>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 cursor-pointer"
          title="Dismiss clarification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
