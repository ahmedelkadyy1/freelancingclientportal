import { User } from '../types';
import { Briefcase, LogOut, ShieldAlert, ArrowRight, Sparkles, Moon, Sun } from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  onLogout: () => void;
  activeTab: 'portfolio' | 'portal';
  setActiveTab: (tab: 'portfolio' | 'portal') => void;
  darkMode: boolean;
  setDarkMode: (d: boolean) => void;
}

export default function Navbar({ currentUser, onLogout, activeTab, setActiveTab, darkMode, setDarkMode }: NavbarProps) {
  return (
    <nav id="navbar-primary" className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Brand Logo */}
          <div
            onClick={() => setActiveTab('portfolio')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-905 dark:bg-slate-50 flex items-center justify-center text-white dark:text-slate-950 font-display font-bold text-sm tracking-wider group-hover:bg-brand-600 transition-all shadow-xs">
              FL
            </div>
            <div>
              <span className="font-display font-semibold text-slate-800 dark:text-slate-100 tracking-tight text-sm sm:text-base">
                Freelance Client Portal
              </span>
              <span className="block text-[10px] font-mono text-slate-400 dark:text-slate-500 -mt-0.5 tracking-widest uppercase">
                Workspace MVP
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Dark Mode Icon Switcher */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-405 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {!currentUser ? (
              <>
                <button
                  onClick={() => setActiveTab('portfolio')}
                  className={`text-xs font-mono uppercase tracking-wider py-1.5 px-3 rounded-lg transition-all cursor-pointer ${
                    activeTab === 'portfolio'
                      ? 'text-brand-600 bg-brand-50/50 dark:bg-brand-500/10 font-semibold'
                      : 'text-slate-550 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Portfolio
                </button>
                <button
                  onClick={() => setActiveTab('portal')}
                  className={`text-xs font-mono uppercase tracking-wider py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'portal'
                      ? 'text-brand-600 bg-brand-50/50 dark:bg-brand-500/10 font-semibold'
                      : 'text-slate-550 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Client Login
                  <ArrowRight className="w-3 h-3" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-4 sm:gap-6">
                {/* Active Session Status Badge */}
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl px-3 py-1.5">
                  <div className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </div>
                  <div className="text-left leading-none">
                    <span className="text-xs font-medium text-slate-750 dark:text-slate-100 block">
                      {currentUser.name}
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest block mt-0.5">
                      {currentUser.role === 'admin' ? 'Freelancer' : currentUser.company || 'Client'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={onLogout}
                  className="p-2 sm:px-3 sm:py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-705 text-slate-600 dark:text-slate-350 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg transition-all flex items-center gap-1.5 text-xs font-mono cursor-pointer"
                  title="Sign Out Session"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
