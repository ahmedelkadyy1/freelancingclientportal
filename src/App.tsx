import { useState, useEffect } from 'react';
import { User, Project } from './types';
import Navbar from './components/Navbar';
import Portfolio from './components/Portfolio';
import AuthPanel from './components/AuthPanel';
import Dashboard from './components/Dashboard';
import { ArrowLeft, Globe, Briefcase, Sparkles, X, Layers, Coins, Calendar, CheckSquare } from 'lucide-react';

export default function App() {
  // Dark mode styling orchestration
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const savedTheme = localStorage.getItem('theme_mode');
      if (savedTheme === 'dark') return true;
      if (savedTheme === 'light') return false;
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      if (darkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme_mode', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme_mode', 'light');
      }
    } catch (e) {
      console.error(e);
    }
  }, [darkMode]);

  // Navigation Tabs Schema
  const [activeTab, setActiveTab] = useState<'portfolio' | 'portal'>('portfolio');
  
  // Auth state persisted to localStorage for bulletproof sandbox ergonomics
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem('portal_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('portal_token');
  });

  // Public Portfolios
  const [publicProjects, setPublicProjects] = useState<Project[]>([]);
  const [loadingPublic, setLoadingPublic] = useState(false);
  const [selectedPortfolioProject, setSelectedPortfolioProject] = useState<Project | null>(null);

  // Synchronize public portfolio work
  const loadPublicPortfolio = async () => {
    setLoadingPublic(true);
    try {
      const res = await fetch('/api/projects/public');
      if (res.ok) {
        setPublicProjects(await res.json());
      }
    } catch (e) {
      console.error('Error fetching public projects archive', e);
    } finally {
      setLoadingPublic(false);
    }
  };

  useEffect(() => {
    loadPublicPortfolio();
  }, []);

  // Handle Login Event
  const handleLoginSuccess = (userToken: string, userObj: User) => {
    setToken(userToken);
    setCurrentUser(userObj);
    localStorage.setItem('portal_token', userToken);
    localStorage.setItem('portal_user', JSON.stringify(userObj));
    setActiveTab('portal'); // Push to private portal workspace automatically on sign in!
  };

  // Handle Logout Event
  const handleLogout = () => {
    setToken(null);
    setCurrentUser(null);
    localStorage.removeItem('portal_token');
    localStorage.removeItem('portal_user');
    localStorage.removeItem('selected_project_id');
    localStorage.removeItem('dashboard_active_subtab');
    setActiveTab('portfolio'); // Reset to public face
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 antialiased transition-colors duration-200">
      {/* Top Navigation */}
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      {/* Main Container */}
      <main className="flex-1">
        {currentUser ? (
          // Authenticated Workspace State
          <Dashboard
            currentUser={currentUser}
            token={token || ''}
            onLogout={handleLogout}
          />
        ) : (
          // Logged Out Gateway - toggles Portfolio & Authenticated Panel
          <div className="animate-fade-in">
            {activeTab === 'portfolio' ? (
              <div id="public-portfolio-space">
                {/* HERO STATS */}
                <header className="bg-slate-900 text-white relative py-20 overflow-hidden">
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]"></div>
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                    <span className="text-[10px] font-mono tracking-widest text-brand-300 uppercase px-3 py-1.5 bg-brand-500/10 rounded-full border border-brand-500/20">
                      Now accepting client briefs
                    </span>
                    <h2 className="text-4xl sm:text-6xl font-display font-bold tracking-tight mt-6">
                      Bespoke Digital Architectural Systems
                    </h2>
                    <p className="text-sm sm:text-lg text-slate-350 mt-4 max-w-2xl mx-auto font-light leading-relaxed">
                      Collaborative, secure systems designed and integrated with absolute focus on typography-first design, fluid performance, and zero clutter.
                    </p>

                    {/* Meta numbers */}
                    <div className="flex flex-wrap items-center justify-center gap-8 mt-12 text-xs font-mono text-slate-400">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-brand-400" />
                        <span>Remote Integration Support</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-brand-400" />
                        <span>98% Deliverable Accuracy</span>
                      </div>
                    </div>
                  </div>
                </header>

                <Portfolio
                  projects={publicProjects}
                  onSelectProject={setSelectedPortfolioProject}
                  loading={loadingPublic}
                />
              </div>
            ) : (
              // Gateway Login panel
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <AuthPanel onLoginSuccess={handleLoginSuccess} />
              </div>
            )}
          </div>
        )}
      </main>

      {/* PORTFOLIO SINGLE SPECIFICATION DRAWERS / POPUPS */}
      {selectedPortfolioProject && (
        <div className="fixed inset-y-0 inset-x-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl relative animate-fade-in flex flex-col md:flex-row max-h-[90vh]">
            
            {/* Left Graphic Side */}
            <div className="w-full md:w-1/2 bg-slate-50 relative min-h-[160px] md:min-h-full">
              {selectedPortfolioProject.preview_image ? (
                <img
                  src={selectedPortfolioProject.preview_image}
                  alt={selectedPortfolioProject.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-brand-100 to-slate-200 flex items-center justify-center p-6">
                  <span className="text-sm font-mono text-slate-400 uppercase tracking-widest">
                    {selectedPortfolioProject.category}
                  </span>
                </div>
              )}
              {/* Back out Button */}
              <button
                onClick={() => setSelectedPortfolioProject(null)}
                className="absolute top-4 left-4 p-2 bg-white/90 backdrop-blur-sm hover:bg-white text-slate-700 rounded-full transition-all cursor-pointer shadow-sm md:hidden"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Right Specification Panel */}
            <div className="p-8 w-full md:w-1/2 flex flex-col justify-between overflow-y-auto">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono tracking-widest text-brand-600 uppercase font-semibold">
                    {selectedPortfolioProject.category}
                  </span>
                  <button
                    onClick={() => setSelectedPortfolioProject(null)}
                    className="hidden md:block p-1 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-800 rounded-lg transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="text-2xl font-display font-bold text-slate-900 tracking-tight">
                  {selectedPortfolioProject.title}
                </h3>

                <p className="text-xs text-slate-500 mt-4 leading-relaxed font-light">
                  {selectedPortfolioProject.description}
                </p>

                {/* Sub specifications grid */}
                <div className="mt-6 pt-6 border-t border-slate-100 space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5 font-light">
                      <Layers className="w-3.5 h-3.5" /> Structure Status
                    </span>
                    <span className="font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[10px] uppercase font-semibold">
                      {selectedPortfolioProject.status}
                    </span>
                  </div>

                  {selectedPortfolioProject.budget && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 flex items-center gap-1.5 font-light">
                        <Coins className="w-3.5 h-3.5" /> Budget Estimate
                      </span>
                      <span className="font-mono text-slate-800 font-semibold">
                        {selectedPortfolioProject.budget}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5 font-light">
                      <Calendar className="w-3.5 h-3.5" /> Completed Date
                    </span>
                    <span className="font-mono text-slate-800">
                      {selectedPortfolioProject.deadline}
                    </span>
                  </div>
                </div>
              </div>

              {/* Login Callout details */}
              <div className="mt-8 bg-slate-50 border border-slate-100 rounded-2xl p-4 text-[11px] leading-relaxed text-slate-500">
                <span className="font-semibold text-slate-805 block mb-1">Collaborative Workspace</span>
                To track live sprints, share secure asset deliverables, and stream design feedback logs, request client accounts from the project coordinator.
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="text-center py-10 border-t border-slate-100 bg-white">
        <p className="text-xs text-slate-400 font-mono tracking-wide">
          © {new Date().getFullYear()} Freelance Workspace Portal. Powered by Node.js, Express & React.
        </p>
      </footer>
    </div>
  );
}
