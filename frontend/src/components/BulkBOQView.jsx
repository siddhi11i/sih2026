import React, { useState } from 'react';
import { Layers, FileSpreadsheet, ArrowRight, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';
import { fetchApi } from '../api';

export default function BulkBOQView({ onOpenAllied, onOpenCompliance }) {
  const [boqText, setBoqText] = useState(
    `Item 1: Supply of Pasteurized Toned Milk in 500ml food-grade pouches.\nItem 2: Whole Milk Powder conforming to ISI marking packed in 25kg bags.\nItem 3: Refined edible sunflower oil and vanaspati in 15kg tins.\nItem 4: Edible maize starch (corn flour) for school canteen food preparation.\nItem 5: Purchase of Amul brand butter and Britannia cheese slices (Restrictive Brand Check).`
  );
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleProcessBOQ = async () => {
    if (!boqText.trim()) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchApi('/advanced/bulk-recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tender_text: boqText })
      });
      setResults(data);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center space-x-2">
          <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white font-['Outfit']">Bulk BOQ & Requirement Extraction Engine</h2>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Paste multi-item Bill of Quantities (BOQ) schedules or procurement line items. The engine segments each line item, detects packaging/handling attributes, checks for proprietary brand restrictions, and recommends matching Indian Standards.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-300">Enter Bill of Quantities (One Line Per Item)</span>
          <button onClick={() => setBoqText("")} className="text-[11px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer">Clear</button>
        </div>
        <textarea
          rows={6}
          value={boqText}
          onChange={(e) => setBoqText(e.target.value)}
          placeholder="Paste line items here (e.g. Item 1: Pasteurized milk, Item 2: Wheat flour)..."
          className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono resize-none"
        />
        <button
          onClick={handleProcessBOQ}
          disabled={loading || !boqText.trim()}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-2.5 rounded-xl font-medium text-xs shadow-md shadow-blue-600/20 flex items-center justify-center space-x-2 transition-all cursor-pointer"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
          <span>{loading ? 'Processing BOQ Items...' : 'Process Bill of Quantities (Bulk Mode)'}</span>
        </button>
      </div>

      {errorMsg && (
        <div className="bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-500/50 p-4 rounded-xl text-xs text-red-800 dark:text-red-200">
          {errorMsg}
        </div>
      )}

      {results && (
        <div className="space-y-4 pt-2 animate-in fade-in duration-300">
          <div className="font-semibold text-xs text-slate-800 dark:text-slate-200">
            Segmented Line Items & Conformance Analysis ({results.length} items evaluated)
          </div>

          <div className="space-y-3">
            {results.map((item, idx) => {
              const hasBrandFlag = item.restrictive_spec_advisory && item.restrictive_spec_advisory.has_restrictive_clauses;
              const topStd = item.recommended_standards && item.recommended_standards[0];
              return (
                <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-xs">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs flex items-center justify-center font-bold">
                        {item.line_number}
                      </span>
                      <span className="text-xs font-semibold text-slate-900 dark:text-white">{item.raw_item_text}</span>
                    </div>
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                      Mode: {item.detected_attributes.packaging_mode}
                    </span>
                  </div>

                  {/* Restrictive Brand Warning */}
                  {hasBrandFlag && (
                    <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/30 p-2.5 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start space-x-2">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                      <div>
                        <strong>Proprietary Brand Detected:</strong> {item.restrictive_spec_advisory.advisory_flags[0].advisory}
                      </div>
                    </div>
                  )}

                  {/* Top Recommendation */}
                  {topStd ? (
                    <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center space-x-3">
                        <span className="font-mono font-bold text-slate-900 dark:text-amber-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                          {topStd.is_number}
                        </span>
                        <div>
                          <span className="font-medium text-slate-800 dark:text-slate-200 block">{topStd.title}</span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">Match: {topStd.match_pct}% ({topStd.match_tier} Relevance)</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onOpenAllied(topStd)}
                          className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-700 dark:text-slate-200 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                        >
                          Allied
                        </button>
                        <button
                          onClick={() => onOpenCompliance(topStd)}
                          className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-amber-600 hover:text-white text-slate-700 dark:text-slate-200 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                        >
                          QCO
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 italic">No direct standard match found for this line item.</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
