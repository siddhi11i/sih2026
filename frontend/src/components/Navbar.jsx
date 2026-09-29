import React, { useState, useRef, useEffect } from 'react';
import { 
  Shield, BookOpen, Layers, FileCheck, Award, FolderKanban, 
  GitCompare, Database, BarChart3, Terminal, Sparkles, UserCheck, 
  Sun, Moon, ChevronDown, Wrench, Globe 
} from 'lucide-react';
import { LANGUAGES, getTranslation } from '../i18n';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  userRole, 
  setUserRole, 
  selectedCount = 0, 
  onStartTour,
  theme,
  setTheme,
  currentLang = 'en',
  setCurrentLang,
  onOpenLogin,
  currentUser
}) {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const moreMenuRef = useRef(null);
  const langMenuRef = useRef(null);

  const t = (key, params) => getTranslation(currentLang, key, params);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target)) {
        setShowMoreMenu(false);
      }
      if (langMenuRef.current && !langMenuRef.current.contains(event.target)) {
        setShowLangMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const primaryNavItems = [
    { id: 'search', label: t('nav_search'), icon: BookOpen },
    { id: 'bulk_boq', label: t('nav_bulk'), icon: Layers },
    { id: 'tender_checker', label: t('nav_tender_checker'), icon: FileCheck },
    { id: 'allied_graph', label: t('nav_allied'), icon: Shield },
    { id: 'comparison', label: `${t('nav_compare')} (${selectedCount})`, icon: GitCompare },
  ];

  const secondaryNavItems = [
    { id: 'supplier_check', label: t('nav_supplier_check'), icon: Award, desc: 'Assess bidder compliance against tender standards' },
    { id: 'saved_tenders', label: t('nav_saved_tenders'), icon: FolderKanban, desc: 'Monitor active tenders for BIS gazette revisions' },
    { id: 'dev_portal', label: t('nav_dev_portal'), icon: Terminal, desc: 'API keys, cURL snippets & embeddable widgets' },
    { id: 'data_readiness', label: t('nav_data_hub'), icon: Database, desc: 'Standards catalog status, CSV validator & sync' },
    { id: 'analytics', label: t('nav_analytics'), icon: BarChart3, desc: 'Outcome metrics, adoption trends & error logs' },
  ];

  const isSecondaryActive = secondaryNavItems.some(item => item.id === activeTab);
  const activeSecondaryItem = secondaryNavItems.find(item => item.id === activeTab);
  const currentLangObj = LANGUAGES.find(l => l.code === currentLang) || LANGUAGES[0];

  return (
    <header className="sticky top-0 z-30 shadow-md border-b bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 transition-colors">
      {/* Top Gazette National Bar */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-amber-900 dark:from-blue-950 dark:via-slate-900 dark:to-amber-950 px-4 py-1.5 text-xs text-slate-100 flex flex-wrap justify-between items-center gap-2 border-b border-white/10">
        <div className="flex items-center space-x-2 font-medium">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>{t('gov_header')}</span>
        </div>
        <div className="flex items-center space-x-3 text-[11px]">
          <button
            onClick={onStartTour}
            className="flex items-center space-x-1 text-amber-300 hover:text-amber-200 font-semibold bg-amber-500/20 hover:bg-amber-500/30 px-2.5 py-0.5 rounded border border-amber-400/40 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('guided_tour_btn')}</span>
          </button>
          <span className="text-slate-300 font-medium hidden sm:inline">SIH26108 • Team Aavishkara</span>
          <span className="bg-black/30 px-2 py-0.5 rounded text-amber-200 border border-white/10">Ver: v1.0.0</span>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center gap-2 sm:gap-4">
          {/* Logo & Portal Identity */}
          <div 
            className="flex items-center space-x-2.5 cursor-pointer select-none flex-shrink-0" 
            onClick={() => setActiveTab('search')}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 via-blue-600 to-indigo-700 flex items-center justify-center shadow-xs ring-1 ring-black/5 dark:ring-white/10">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-sm sm:text-base tracking-tight text-slate-900 dark:text-white font-['Outfit']">
                  {t('portal_title')}
                </span>
                <span className="bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-semibold px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800 hidden md:inline-block">
                  {t('portal_tag')}
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center bg-slate-100/70 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-200/80 dark:border-slate-800/80">
            {primaryNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-1.5 h-8 px-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`} />
                  <span className="whitespace-nowrap">{item.label}</span>
                </button>
              );
            })}

            {/* More Tools Dropdown Menu */}
            <div className="relative" ref={moreMenuRef}>
              <button
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className={`flex items-center space-x-1.5 h-8 px-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isSecondaryActive
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
                }`}
              >
                <Wrench className={`w-3.5 h-3.5 flex-shrink-0 ${isSecondaryActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`} />
                <span className="whitespace-nowrap">{isSecondaryActive ? activeSecondaryItem?.label : t('nav_more_tools')}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showMoreMenu ? 'rotate-180' : ''}`} />
              </button>

              {showMoreMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                    Compliance & Admin Tools
                  </div>
                  <div className="space-y-0.5 mt-1">
                    {secondaryNavItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveTab(item.id);
                            setShowMoreMenu(false);
                          }}
                          className={`w-full flex items-start space-x-2 p-1.5 rounded-lg text-left transition-all cursor-pointer ${
                            isActive
                              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <Icon className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                          <div>
                            <div className="text-xs font-semibold">{item.label}</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400">{item.desc}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* Right Controls: Language Selector, Theme Toggle & Session Button */}
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            {/* Multi-Language Selector Dropdown */}
            <div className="relative" ref={langMenuRef}>
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center space-x-1 h-8 bg-slate-100 dark:bg-slate-900 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-200/80 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-2xs"
                title="Select Indian Regional Language"
              >
                <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <span className="font-medium hidden sm:inline">{currentLangObj.nativeName}</span>
                <span className="font-bold sm:hidden uppercase text-[10px]">{currentLangObj.code}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showLangMenu ? 'rotate-180' : ''}`} />
              </button>

              {showLangMenu && (
                <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 mb-1">
                    Select Language / भाषा
                  </div>
                  <div className="space-y-0.5">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setCurrentLang(lang.code);
                          setShowLangMenu(false);
                        }}
                        className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                          currentLang === lang.code
                            ? 'bg-blue-600 text-white font-semibold'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span>{lang.nativeName}</span>
                        <span className={`text-[10px] ${currentLang === lang.code ? 'text-blue-100' : 'text-slate-400'}`}>
                          {lang.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              title={theme === 'light' ? t('theme_toggle_light') : t('theme_toggle_dark')}
              className="w-8 h-8 rounded-lg border bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200/80 dark:hover:bg-slate-800 transition-all cursor-pointer flex items-center justify-center shadow-2xs"
              aria-label="Toggle Light and Dark Theme"
            >
              {theme === 'light' ? (
                <Moon className="w-3.5 h-3.5 text-indigo-600" />
              ) : (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              )}
            </button>

            {/* Official Authorized Session & Login Button */}
            <button
              onClick={onOpenLogin}
              title="Official Government & Admin Login (RBAC)"
              className="flex items-center space-x-1.5 h-8 bg-blue-600 hover:bg-blue-500 text-white px-3 rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer whitespace-nowrap"
            >
              <Shield className="w-3.5 h-3.5 text-blue-200 flex-shrink-0" />
              <span>{userRole === 'admin' ? 'Admin' : userRole === 'reviewer' ? 'Reviewer' : 'Drafter'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile / Tablet Horizontal Navigation Scrollbar */}
      <div className="lg:hidden flex overflow-x-auto space-x-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 scrollbar-none">
        {[...primaryNavItems, ...secondaryNavItems].map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center space-x-1 h-7.5 px-2.5 rounded-md text-[11px] font-medium whitespace-nowrap transition-all flex-shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
