import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Sparkles, CheckCircle2 } from 'lucide-react';

export default function GuidedTourModal({ isOpen, onClose, onSelectSampleQuery }) {
  const [step, setStep] = useState(0);

  if (!isOpen) return null;

  const tourSteps = [
    {
      title: "Welcome to the BIS Standards Recommender",
      description: "Designed for Public Procurement Officers across Ministries and Departments to rapidly identify, verify, and cite applicable Indian Standards (Bureau of Indian Standards) in procurement tenders.",
      actionText: "Start Walkthrough",
      sampleQuery: null
    },
    {
      title: "1. Semantic Matching (Hybrid BM25 + Dense Vectors)",
      description: "Unlike keyword lookup, type natural procurement specifications (e.g. Hindi, Hinglish, or noisy text). The engine accurately matches the underlying commodity and standards.",
      actionText: "Try Sample: 'Whole milk powder'",
      sampleQuery: "Supply of packaged pasteurized toned milk and skimmed milk powder for mid-day school meals program in district primary schools."
    },
    {
      title: "2. Tender Checker & QCO Compliance",
      description: "Audit full tender documents (PDF/DOCX/Excel) to detect outdated standards, missing mandatory QCO certifications, and proprietary brand bias.",
      actionText: "Next",
      sampleQuery: null
    },
    {
      title: "3. Normative & Allied Standards Graph",
      description: "Inspect Clause 2 normative test methods, packaging specifications, and sampling guidelines linked to each product standard.",
      actionText: "Next",
      sampleQuery: null
    },
    {
      title: "4. Multi-Role Verification & Audit Trail",
      description: "Drafters prepare specifications while Reviewers & Directors record formal approvals, creating an unalterable audit trail for accountability.",
      actionText: "Finish Tour",
      sampleQuery: null
    }
  ];

  const currentStepData = tourSteps[step];

  const handleNext = () => {
    if (currentStepData.sampleQuery && onSelectSampleQuery) {
      onSelectSampleQuery(currentStepData.sampleQuery);
    }
    if (step < tourSteps.length - 1) {
      setStep(step + 1);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 w-full max-w-lg rounded-2xl p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Guided Tour • Step {step + 1} of {tourSteps.length}
            </span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Outfit']">{currentStepData.title}</h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{currentStepData.description}</p>
        </div>

        {/* Dots progress indicator */}
        <div className="flex items-center justify-center space-x-1.5 py-2">
          {tourSteps.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all ${
                idx === step ? 'w-6 bg-blue-600' : 'w-1.5 bg-slate-300 dark:bg-slate-700'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={() => step > 0 && setStep(step - 1)}
            disabled={step === 0}
            className="flex items-center space-x-1 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <button
            onClick={handleNext}
            className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-md shadow-blue-600/20 cursor-pointer"
          >
            <span>{currentStepData.actionText}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
