import React, { useState } from 'react';
import { CheckCircle, AlertTriangle, ShieldAlert, Award, FileSearch, RefreshCw } from 'lucide-react';
import { fetchApi } from '../api';

export default function SupplierCheckView() {
  const [tenderStandard, setTenderStandard] = useState('IS 1165:2022');
  const [productName, setProductName] = useState('Whole Milk Powder Premium 25kg');
  const [certifiedStandard, setCertifiedStandard] = useState('IS 1165:2022');
  const [hasIsiLicense, setHasIsiLicense] = useState(true);
  const [isiLicenseNo, setIsiLicenseNo] = useState('CM/L-8472910');
  const [labAccredited, setLabAccredited] = useState(true);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleCheck = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchApi('/advanced/supplier-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tender_standard_required: tenderStandard,
          supplier_product_name: productName,
          supplier_standard_certified: certifiedStandard,
          has_isi_license: hasIsiLicense,
          isi_license_number: isiLicenseNo,
          test_lab_accredited: labAccredited
        })
      });
      setResult(data);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-in fade-in duration-200">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center space-x-2">
          <Award className="w-5 h-5 text-amber-500" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white font-['Outfit']">Supplier Conformance & Pre-Bid Eligibility Self-Check</h2>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Enables prospective bidders and suppliers to self-assess product certification, BIS ISI license validity, and test method conformity before tender submission.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Card */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl space-y-4 shadow-xs">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Product & Certification Details</h3>

          <div>
            <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">Tender Standard Required (Cited in RFP):</label>
            <input
              type="text"
              value={tenderStandard}
              onChange={(e) => setTenderStandard(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white font-mono focus:ring-1 focus:ring-blue-500"
              placeholder="e.g. IS 1165:2022"
            />
          </div>

          <div>
            <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">Supplier Offering / Product Name:</label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500"
              placeholder="e.g. Premium Pasteurized Toned Milk"
            />
          </div>

          <div>
            <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">Standard Certified by Supplier:</label>
            <input
              type="text"
              value={certifiedStandard}
              onChange={(e) => setCertifiedStandard(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white font-mono focus:ring-1 focus:ring-blue-500"
              placeholder="e.g. IS 1165:2022"
            />
          </div>

          <div className="pt-2 space-y-3">
            <label className="flex items-center space-x-3 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={hasIsiLicense}
                onChange={(e) => setHasIsiLicense(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs text-slate-700 dark:text-slate-300">Has Active BIS ISI Mark License (Scheme I)</span>
            </label>

            {hasIsiLicense && (
              <div>
                <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">BIS License (CM/L) Number:</label>
                <input
                  type="text"
                  value={isiLicenseNo}
                  onChange={(e) => setIsiLicenseNo(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2 text-xs text-amber-600 dark:text-amber-400 font-mono"
                  placeholder="e.g. CM/L-8472910"
                />
              </div>
            )}

            <label className="flex items-center space-x-3 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={labAccredited}
                onChange={(e) => setLabAccredited(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs text-slate-700 dark:text-slate-300">Test Report from NABL / BIS Accredited Laboratory</span>
            </label>
          </div>

          <button
            onClick={handleCheck}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl text-xs font-semibold shadow-md shadow-blue-600/20 flex items-center justify-center space-x-2 transition-all mt-4 cursor-pointer"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileSearch className="w-4 h-4" />}
            <span>{loading ? 'Evaluating Conformity...' : 'Evaluate Pre-Bid Conformance'}</span>
          </button>

          {errorMsg && (
            <div className="bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-500/50 p-3 rounded-xl text-xs text-red-800 dark:text-red-200">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Evaluation Output */}
        <div className="lg:col-span-6 space-y-4">
          {result ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl space-y-5 shadow-xs animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pre-Bid Conformance Outcome</span>
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full border ${
                    result.conformance_status === 'COMPLIANT'
                      ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30'
                      : 'bg-red-100 dark:bg-red-500/10 text-red-800 dark:text-red-400 border-red-300 dark:border-red-500/30'
                  }`}
                >
                  {result.conformance_status === 'COMPLIANT' ? 'ELIGIBLE TO BID' : 'NON-CONFORMANT'}
                </span>
              </div>

              {/* Metric Progress */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 dark:text-slate-400">Conformance Confidence</span>
                  <span className="font-bold text-slate-900 dark:text-white">{result.conformance_score_pct}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-200 dark:border-slate-800">
                  <div
                    className={`h-full transition-all duration-500 ${
                      result.conformance_score_pct >= 80 ? 'bg-emerald-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${result.conformance_score_pct}%` }}
                  ></div>
                </div>
              </div>

              {/* Findings */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-300 block">Compliance Audit Findings:</span>
                {result.findings.length === 0 ? (
                  <div className="flex items-center space-x-2 text-xs text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-xl border border-emerald-200 dark:border-emerald-500/20">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    <span>All standards, ISI licensing, and testing lab conditions match tender requirements.</span>
                  </div>
                ) : (
                  result.findings.map((f, i) => (
                    <div key={i} className="flex items-start space-x-2 text-xs text-red-800 dark:text-red-300 bg-red-50 dark:bg-red-950/30 p-2.5 rounded-xl border border-red-200 dark:border-red-500/20">
                      <ShieldAlert className="w-4 h-4 flex-shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
                      <span>{f}</span>
                    </div>
                  ))
                )}
              </div>

              {/* Guidance */}
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                <span className="font-semibold text-slate-800 dark:text-slate-300">Actionable Guidance:</span>
                <p className="text-slate-600 dark:text-slate-400">{result.actionable_guidance}</p>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-900/50 border border-dashed border-slate-300 dark:border-slate-800 p-12 rounded-2xl text-center text-slate-400 flex flex-col items-center justify-center min-h-[300px]">
              <Award className="w-10 h-10 mb-3 opacity-30 text-amber-500" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-400">No Evaluation Performed Yet</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                Fill the product and certification details on the left and click "Evaluate Pre-Bid Conformance".
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
