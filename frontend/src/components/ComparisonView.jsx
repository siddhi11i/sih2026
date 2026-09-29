import React from 'react';
import { GitCompare, X, AlertTriangle, Shield, FileCheck2, CheckCircle2 } from 'lucide-react';

export default function ComparisonView({
  comparisonList,
  onRemoveFromComparison,
  onClearComparison,
  onOpenAllied,
  onOpenCompliance
}) {
  if (!comparisonList || comparisonList.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-400 dark:text-slate-500">
        <GitCompare className="w-16 h-16 mx-auto mb-4 opacity-30 text-slate-400" />
        <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">No Standards Selected for Comparison</h3>
        <p className="text-xs mt-1 text-slate-500 max-w-md mx-auto">
          In the Semantic Search view, click the <strong>Compare</strong> button on any 2 to 4 standard cards to inspect them side by side.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <GitCompare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white font-['Outfit']">Side-by-Side Standards Comparison</h2>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">Comparing technical, compliance, and allied normative attributes</p>
        </div>
        <button
          onClick={onClearComparison}
          className="text-xs text-red-700 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/40 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer font-medium"
        >
          Clear All ({comparisonList.length})
        </button>
      </div>

      {/* Comparison Grid Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <table className="w-full border-collapse text-left text-xs text-slate-700 dark:text-slate-300">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
              <th className="p-4 font-semibold text-slate-500 dark:text-slate-400 w-48">Attribute</th>
              {comparisonList.map((std) => (
                <th key={std.id} className="p-4 font-semibold text-slate-900 dark:text-white relative min-w-[240px]">
                  <button
                    onClick={() => onRemoveFromComparison(std.id)}
                    className="absolute top-3 right-3 text-slate-400 hover:text-red-500 p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                    title="Remove from comparison"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <span className="font-mono text-sm font-bold text-slate-900 dark:text-amber-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 block mb-1">
                    {std.is_number}
                  </span>
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-200 line-clamp-2">{std.title}</p>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-slate-900">
            {/* Revision Year */}
            <tr>
              <td className="p-4 font-medium text-slate-500 dark:text-slate-400">Publication / Revision Year</td>
              {comparisonList.map((std) => (
                <td key={std.id} className="p-4 font-mono text-slate-800 dark:text-slate-200">
                  {std.year || 'N/A'}
                </td>
              ))}
            </tr>

            {/* Category */}
            <tr>
              <td className="p-4 font-medium text-slate-500 dark:text-slate-400">Sector / Category</td>
              {comparisonList.map((std) => (
                <td key={std.id} className="p-4">
                  <span className="bg-slate-100 dark:bg-slate-950 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                    {std.category}
                  </span>
                </td>
              ))}
            </tr>

            {/* Conformance Status */}
            <tr>
              <td className="p-4 font-medium text-slate-500 dark:text-slate-400">Gazette Status</td>
              {comparisonList.map((std) => (
                <td key={std.id} className="p-4">
                  <span className="text-emerald-700 dark:text-emerald-400 flex items-center space-x-1 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{std.status || 'Active'}</span>
                  </span>
                </td>
              ))}
            </tr>

            {/* Match Relevance */}
            <tr>
              <td className="p-4 font-medium text-slate-500 dark:text-slate-400">Relevance Tier</td>
              {comparisonList.map((std) => (
                <td key={std.id} className="p-4">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {std.match_tier || 'High'} ({std.match_pct || 90}%)
                  </span>
                </td>
              ))}
            </tr>

            {/* Action Row */}
            <tr>
              <td className="p-4 font-medium text-slate-500 dark:text-slate-400">Quick Actions</td>
              {comparisonList.map((std) => (
                <td key={std.id} className="p-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onOpenAllied(std)}
                      className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-700 dark:text-slate-200 text-xs rounded-lg transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
                    >
                      Allied
                    </button>
                    <button
                      onClick={() => onOpenCompliance(std)}
                      className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-amber-600 hover:text-white text-slate-700 dark:text-slate-200 text-xs rounded-lg transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
                    >
                      QCO & Labs
                    </button>
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
