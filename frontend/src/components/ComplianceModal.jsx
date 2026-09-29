import React, { useState, useEffect } from 'react';
import { X, FileCheck2, AlertTriangle, ExternalLink, ShieldCheck, FlaskConical, Globe2, FileText } from 'lucide-react';
import { fetchApi } from '../api';

export default function ComplianceModal({ standard, complianceData, onClose }) {
  if (!standard) return null;

  const [activeTab, setActiveTab] = useState('qco');
  const [labsData, setLabsData] = useState(null);
  const [intlData, setIntlData] = useState(null);
  const [draftSpecData, setDraftSpecData] = useState(null);

  const data = complianceData || {};

  useEffect(() => {
    if (standard && standard.is_number) {
      const stdNum = encodeURIComponent(standard.is_number);
      fetchApi(`/advanced/testing-labs/${stdNum}`).then(setLabsData).catch(console.error);
      fetchApi(`/advanced/international-equivalents/${stdNum}`).then(setIntlData).catch(console.error);
      fetchApi(`/advanced/draft-specification/${stdNum}`).then(setDraftSpecData).catch(console.error);
    }
  }, [standard]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-100 dark:bg-amber-500/10 rounded-xl text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-500/20">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-sm font-bold text-slate-900 dark:text-white bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700">
                  {standard.is_number}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">Compliance & Regulatory Profile</span>
              </div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1 line-clamp-1">
                {standard.title}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Banner */}
        <div className="bg-amber-50 dark:bg-amber-950/50 border-b border-amber-200 dark:border-amber-500/30 px-5 py-2.5 text-xs flex items-center justify-between text-amber-800 dark:text-amber-300">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              <strong>{data.data_status || 'SAMPLE - verify before use'}:</strong> Official Gazette verification required before procurement citations.
            </span>
          </div>
        </div>

        {/* Inner Tabs Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 px-5 space-x-2 pt-2">
          <button
            onClick={() => setActiveTab('qco')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'qco'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>QCO & Schemes</span>
          </button>

          <button
            onClick={() => setActiveTab('labs')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'labs'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span>Testing Labs ({labsData?.accredited_labs?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('intl')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'intl'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Globe2 className="w-3.5 h-3.5" />
            <span>ISO / Codex Equivalents</span>
          </button>

          <button
            onClick={() => setActiveTab('draft')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'draft'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Draft Spec Clauses</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 text-xs text-slate-700 dark:text-slate-300 max-h-[480px] overflow-y-auto space-y-4">
          {/* TAB 1: QCO & SCHEMES */}
          {activeTab === 'qco' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Quality Control Order (QCO) */}
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Quality Control Order (QCO)</span>
                    {data.qco_mandatory ? (
                      <span className="bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-500/30 px-2 py-0.5 rounded font-bold text-[10px]">
                        MANDATORY QCO
                      </span>
                    ) : (
                      <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded text-[10px]">
                        Voluntary
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Order: <strong className="text-slate-900 dark:text-slate-200">{data.qco_order_name || 'Not Available'}</strong>
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Notifying Ministry: {data.qco_notifying_ministry || 'Ministry of Consumer Affairs'}
                  </p>
                </div>

                {/* 2. BIS ISI Certification Scheme */}
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">BIS ISI Mark Certification</span>
                    {data.isi_mark_mandatory ? (
                      <span className="bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30 px-2 py-0.5 rounded font-bold text-[10px] flex items-center space-x-1">
                        <ShieldCheck className="w-3 h-3" />
                        <span>ISI MANDATORY</span>
                      </span>
                    ) : (
                      <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded text-[10px]">
                        Scheme I (Voluntary)
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Scheme: <strong className="text-slate-900 dark:text-slate-200">{data.isi_certification_scheme || 'Scheme I (Marking under BIS Act 2016)'}</strong>
                  </p>
                </div>

                {/* 3. FSSAI Applicability */}
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">FSSAI Regulations</span>
                    <span className="bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-500/30 px-2 py-0.5 rounded font-bold text-[10px]">
                      APPLICABLE
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Regulation: <strong className="text-slate-900 dark:text-slate-200">{data.fssai_regulation || 'Food Safety and Standards Regulations, 2011'}</strong>
                  </p>
                </div>

                {/* 4. Trade & Procurement Identifiers */}
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">Trade & GeM Portal Identifiers</span>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-500 block">HSN Code:</span>
                      <strong className="text-amber-600 dark:text-amber-400 font-mono">{data.hsn_code || '04022100 (Sample)'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">GeM Category ID:</span>
                      <strong className="text-blue-600 dark:text-blue-400 font-mono">{data.gem_category_id || 'GEM/CAT/004'}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TESTING LABS & METHODS */}
          {activeTab === 'labs' && (
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">Standardized Test Methods</span>
                <div className="space-y-2">
                  {labsData?.test_methods?.map((m, i) => (
                    <div key={i} className="flex items-center justify-between text-[11px] bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-700 dark:text-slate-300 font-medium">{m.parameter}</span>
                      <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">{m.standard_method}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">Accredited Testing Laboratories (NABL / BIS Empanelled)</span>
                <div className="space-y-2">
                  {labsData?.accredited_labs?.map((lab, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block">{lab.name}</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">{lab.city} • Accreditation: {lab.accreditation}</span>
                      </div>
                      <span className="text-[10px] bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                        {lab.scope}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: INTERNATIONAL EQUIVALENTS */}
          {activeTab === 'intl' && (
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">Harmonized Global Standards (ISO / Codex Alimentarius)</span>
                {intlData?.international_equivalents?.length > 0 ? (
                  <div className="space-y-3">
                    {intlData.international_equivalents.map((eq, i) => (
                      <div key={i} className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{eq.standard_code}</span>
                          <span className="text-[10px] bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                            Equivalence: {eq.equivalence}
                          </span>
                        </div>
                        <p className="text-xs text-slate-800 dark:text-white font-medium">{eq.title}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 italic">{eq.differences_note}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">No international ISO or Codex equivalent mapped for this Indian Standard.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: DRAFT SPEC CLAUSES */}
          {activeTab === 'draft' && (
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Recommended Tender Clauses for Procurement RFP</span>
                  <span className="text-[10px] text-slate-500 font-mono">Ver: {draftSpecData?.standard_number}</span>
                </div>
                <div className="space-y-2.5">
                  {draftSpecData?.key_specification_clauses?.map((clause, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{clause.clause_ref}</span>
                        <span className="text-slate-500 dark:text-slate-400 font-medium">{clause.topic}</span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-200">{clause.draft_tender_text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
