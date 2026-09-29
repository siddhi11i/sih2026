import React from 'react';
import { Shield, FileCheck2, GitCompare, ThumbsUp, ThumbsDown, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { getTranslation, CATEGORY_TRANSLATIONS, STATUS_TRANSLATIONS } from '../i18n';

export default function StandardCard({
  standard,
  onOpenAllied,
  onOpenCompliance,
  onToggleCompare,
  isCompared,
  onReview,
  userRole,
  currentLang = 'en'
}) {
  const t = (key, params) => getTranslation(currentLang, key, params);

  const getTierBadgeStyle = (tier) => {
    switch (tier) {
      case 'High':
        return 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30';
      case 'Medium':
        return 'bg-blue-100 dark:bg-blue-500/10 text-blue-800 dark:text-blue-400 border-blue-300 dark:border-blue-500/30';
      default:
        return 'bg-amber-100 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 border-amber-300 dark:border-amber-500/30';
    }
  };

  const getProgressColor = (pct) => {
    if (pct >= 80) return 'from-emerald-500 to-teal-400';
    if (pct >= 60) return 'from-blue-500 to-indigo-400';
    return 'from-amber-500 to-yellow-400';
  };

  const isSample = standard.data_status && standard.data_status.includes('SAMPLE');
  const isUnverified = standard.data_status && standard.data_status.includes('UNVERIFIED');

  // Localized category and status
  const localizedCategory = CATEGORY_TRANSLATIONS[standard.category]?.[currentLang] || standard.category || 'General & Allied';
  const localizedStatus = STATUS_TRANSLATIONS[standard.status]?.[currentLang] || standard.status || 'Active';

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-slate-700 rounded-2xl p-5 shadow-sm hover:shadow-md dark:shadow-lg transition-all flex flex-col justify-between group">
      <div>
        {/* Header: IS Code & Match Badge */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 shadow-2xs">
              {standard.is_number}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Rev: {standard.year || 'N/A'}
            </span>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${getTierBadgeStyle(standard.match_tier)}`}>
              {standard.match_tier} {t('relevance')}
            </span>
          </div>

          {/* Percentage Match */}
          <div className="flex flex-col items-end flex-shrink-0">
            <span className="text-sm font-extrabold text-slate-900 dark:text-white font-['Outfit']">
              {standard.match_pct}%
            </span>
            <span className="text-[10px] text-slate-400">{t('match_score')}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mb-3 overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${getProgressColor(standard.match_pct)} transition-all duration-500`}
            style={{ width: `${standard.match_pct}%` }}
          ></div>
        </div>

        {/* Standard Title */}
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 line-clamp-2 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">
          {standard.title}
        </h3>

        {/* Localized Category & Status Badges */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="text-[11px] bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-800 font-medium">
            {localizedCategory}
          </span>
          <span className="text-[11px] bg-emerald-50 dark:bg-slate-950 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-slate-800 flex items-center space-x-1 font-medium">
            <CheckCircle2 className="w-3 h-3" />
            <span>{localizedStatus}</span>
          </span>

          {/* Data Status Warning Badges */}
          {isSample && (
            <span className="text-[10px] bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30 px-2 py-0.5 rounded-md font-semibold flex items-center space-x-1">
              <AlertTriangle className="w-3 h-3" />
              <span>SAMPLE - verify</span>
            </span>
          )}
          {isUnverified && (
            <span className="text-[10px] bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-500/30 px-2 py-0.5 rounded-md font-semibold flex items-center space-x-1">
              <AlertTriangle className="w-3 h-3" />
              <span>Extracted - Unverified</span>
            </span>
          )}
        </div>

        {/* Why Matched Explanations */}
        {standard.why_matched && standard.why_matched.length > 0 && (
          <div className="bg-slate-50 dark:bg-slate-950/60 rounded-xl p-2.5 mb-4 border border-slate-200 dark:border-slate-800/80">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
              {t('why_matched')}
            </span>
            <div className="flex flex-wrap gap-1">
              {standard.why_matched.map((reason, idx) => (
                <span
                  key={idx}
                  className="text-[11px] bg-blue-50 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 px-2 py-0.5 rounded-md font-medium"
                >
                  {reason}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Card Actions Footer */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Allied Drawer Button */}
          <button
            onClick={() => onOpenAllied(standard)}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-700 dark:text-slate-200 transition-all font-medium cursor-pointer shadow-2xs"
          >
            <Shield className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 group-hover:text-white" />
            <span>{t('allied_btn')}</span>
          </button>

          {/* Compliance Info Button */}
          <button
            onClick={() => onOpenCompliance(standard)}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-amber-600 hover:text-white text-slate-700 dark:text-slate-200 transition-all font-medium cursor-pointer shadow-2xs"
          >
            <FileCheck2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 group-hover:text-white" />
            <span>{t('qco_btn')}</span>
          </button>
        </div>

        <div className="flex items-center space-x-1.5">
          {/* Compare Checkbox */}
          <button
            onClick={() => onToggleCompare(standard)}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              isCompared
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title={t('compare_tooltip')}
          >
            <GitCompare className="w-4 h-4" />
          </button>

          {/* Human Review Actions */}
          {(userRole === 'reviewer' || userRole === 'admin') && (
            <div className="flex items-center space-x-1 pl-1 border-l border-slate-200 dark:border-slate-800">
              <button
                onClick={() => onReview(standard.is_number, 'APPROVED')}
                title="Approve Recommendation"
                className="p-1 rounded-md text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950 transition-all cursor-pointer"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onReview(standard.is_number, 'REJECTED')}
                title="Reject / Flag Inaccurate"
                className="p-1 rounded-md text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950 transition-all cursor-pointer"
              >
                <ThumbsDown className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
