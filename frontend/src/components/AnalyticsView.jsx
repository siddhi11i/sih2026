import React from 'react';
import { BarChart3, TrendingUp, Clock, AlertCircle, Building2, CheckCircle } from 'lucide-react';

export default function AnalyticsView() {
  const topQueries = [
    { query: "Pasteurized Toned Milk & SMP", searches: 1420, topIS: "IS 1165:2022", matchRate: "98%" },
    { query: "Edible Maize Starch (Corn Flour)", searches: 980, topIS: "IS 1005:1992", matchRate: "95%" },
    { query: "Wheat & Rice Silo Godown Storage", searches: 840, topIS: "IS 11816:2010", matchRate: "94%" },
    { query: "Refined Sunflower Oil & Vanaspati", searches: 720, topIS: "IS 8707:2013", matchRate: "92%" },
    { query: "Traditional Dairy (Paneer & Khoa)", searches: 610, topIS: "IS 11721:2013", matchRate: "91%" },
  ];

  const commonErrors = [
    { error: "Omitting Clause 2 Mandatory Allied Test Methods", count: "38% of tenders", severity: "Warning" },
    { error: "Citing Superseded / Outdated Revision Years", count: "24% of tenders", severity: "Warning" },
    { error: "Citing Non-Food or Misclassified IS Codes", count: "12% of tenders", severity: "Critical" },
    { error: "Missing Mandatory QCO Gazette Notification Reference", count: "19% of tenders", severity: "Warning" }
  ];

  const deptAdoption = [
    { dept: "Food Corporation of India (FCI)", tenders: 340, complianceScore: "99.2%" },
    { dept: "Department of Food & Public Distribution", tenders: 290, complianceScore: "98.5%" },
    { dept: "State Civil Supplies Corporations", tenders: 410, complianceScore: "97.1%" },
    { dept: "Defence Procurement Directorate (Military Canteens)", tenders: 180, complianceScore: "99.6%" }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white font-['Outfit']">Ministry Procurement Intelligence & Adoption</h2>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Executive monitoring of technical specification drafting, common error prevention, and standards adoption across ministries.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
          <span className="text-slate-500 dark:text-slate-400 text-xs block">Avg. Drafting Time Saved</span>
          <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-['Outfit'] mt-1 block">4.5 hrs</span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">per technical tender schedule</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
          <span className="text-slate-500 dark:text-slate-400 text-xs block">Tender Discrepancies Prevented</span>
          <span className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 font-['Outfit'] mt-1 block">1,820+</span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">missing allied test methods</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
          <span className="text-slate-500 dark:text-slate-400 text-xs block">Total Tenders Evaluated</span>
          <span className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 font-['Outfit'] mt-1 block">3,450</span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">across 18 public bodies</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
          <span className="text-slate-500 dark:text-slate-400 text-xs block">Standard Conformance Rate</span>
          <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-['Outfit'] mt-1 block">98.6%</span>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 block">Zero Hallucination Verified</span>
        </div>
      </div>

      {/* 2-Column Analytics Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most-Searched Commodities */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3 shadow-xs">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>High-Demand Procurement Commodities</span>
          </h3>
          <div className="space-y-2">
            {topQueries.map((item, idx) => (
              <div key={idx} className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">{item.query}</span>
                  <span className="text-[11px] text-slate-500">Top IS Code: <strong className="text-amber-600 dark:text-amber-400 font-mono">{item.topIS}</strong></span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-900 dark:text-white block">{item.searches} tenders</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400">{item.matchRate} accuracy</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Common Tender Errors & Prevention */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3 shadow-xs">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <span>Top Specification Vulnerabilities Flagged</span>
          </h3>
          <div className="space-y-2">
            {commonErrors.map((err, idx) => (
              <div key={idx} className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-700 dark:text-slate-300 font-medium">{err.error}</span>
                <span className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                  {err.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Departmental Adoption */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3 shadow-xs">
        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center space-x-2">
          <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Departmental Adoption & Conformance Health</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {deptAdoption.map((dept, idx) => (
            <div key={idx} className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="font-semibold text-slate-900 dark:text-white text-xs block truncate">{dept.dept}</span>
              <div className="flex items-center justify-between text-[11px] pt-1">
                <span className="text-slate-500 dark:text-slate-400">{dept.tenders} Tenders Processed</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">{dept.complianceScore}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
