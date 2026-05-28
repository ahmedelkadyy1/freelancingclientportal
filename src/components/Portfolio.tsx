import { useState } from 'react';
import { Project } from '../types';
import { FolderGit2, ArrowUpRight, Filter, Grid, RefreshCw } from 'lucide-react';

interface PortfolioProps {
  projects: Project[];
  onSelectProject: (p: Project) => void;
  loading: boolean;
}

export default function Portfolio({ projects, onSelectProject, loading }: PortfolioProps) {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [activeStatus, setActiveStatus] = useState<string>('All');

  const categories = ['All', ...Array.from(new Set(projects.map(p => p.category)))];
  const statuses = ['All', 'completed', 'ongoing'];

  const filteredProjects = projects.filter(project => {
    const categoryMatch = activeCategory === 'All' || project.category === activeCategory;
    const statusMatch = activeStatus === 'All' || project.status === activeStatus;
    return categoryMatch && statusMatch;
  });

  return (
    <div id="portfolio-container" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 transition-all">
      {/* Portfolio Heading */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 gap-6">
        <div>
          <span className="text-xs font-mono tracking-widest text-brand-600 uppercase">Selected Work</span>
          <h1 className="text-4xl sm:text-5xl font-display font-semibold tracking-tight text-slate-900 mt-2">
            Signature Portfolios
          </h1>
          <p className="text-base text-slate-500 mt-3 max-w-xl font-light">
            A minimalist showcase of modern digital products, interactive workflows, and brand experience architectural blueprints.
          </p>
        </div>

        {/* Dynamic counter */}
        <div className="hidden sm:flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-xs">
          <FolderGit2 className="w-4 h-4 text-brand-500" />
          <span className="text-sm font-medium text-slate-700">
            {projects.length} Premier Releases
          </span>
        </div>
      </div>

      {/* Filter and Control Rail */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 mb-8 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between shadow-xs">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mr-2 uppercase">
            <Filter className="w-3.5 h-3.5" />
            <span>Category:</span>
          </div>
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                activeCategory === category
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-650 hover:bg-slate-100'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mr-2 uppercase">
            <Grid className="w-3.5 h-3.5" />
            <span>Status:</span>
          </div>
          {statuses.map(status => (
            <button
              key={status}
              onClick={() => setActiveStatus(status)}
              className={`px-3 py-1 text-xs font-medium rounded-lg capitalize transition-all cursor-pointer ${
                activeStatus === status
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-650 hover:bg-slate-100'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="border border-slate-100 rounded-2xl overflow-hidden bg-white p-5 space-y-4 animate-pulse">
              <div className="w-full h-44 bg-slate-100 rounded-xl"></div>
              <div className="flex justify-between items-center">
                <div className="w-1/4 h-3 bg-slate-100 rounded"></div>
                <div className="w-1/5 h-3 bg-slate-100 rounded"></div>
              </div>
              <div className="w-3/4 h-5 bg-slate-200 rounded mt-2"></div>
              <div className="space-y-2 pt-2">
                <div className="w-full h-3 bg-slate-50 rounded"></div>
                <div className="w-5/6 h-3 bg-slate-50 rounded"></div>
              </div>
              <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                <div className="w-1/3 h-3 bg-slate-100 rounded"></div>
                <div className="w-1/4 h-3 bg-slate-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-20 bg-white border border-dashed border-slate-200 rounded-3xl">
          <FolderGit2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900">No project assets match</h3>
          <p className="text-sm text-slate-400 mt-1">Try resetting the filter configurations above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProjects.map(project => (
            <div
              key={project.id}
              onClick={() => onSelectProject(project)}
              className="bg-white border border-slate-100 rounded-2xl overflow-hidden hover:border-brand-200 hover:shadow-lg transition-all duration-300 group cursor-pointer flex flex-col h-full"
            >
              {/* Graphic container */}
              <div className="h-48 w-full bg-slate-50 relative overflow-hidden flex items-center justify-center">
                {project.preview_image ? (
                  <img
                    src={project.preview_image}
                    alt={project.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-brand-50 to-slate-200 flex items-center justify-center p-6">
                    <span className="text-sm font-mono text-slate-400 uppercase tracking-widest">
                      {project.category}
                    </span>
                  </div>
                )}
                {/* Status Float tag */}
                <div className="absolute top-4 left-4">
                  <span
                    className={`text-[10px] font-mono tracking-wider uppercase px-2 py-1 rounded-md font-semibold ${
                      project.status === 'completed'
                        ? 'bg-slate-900/90 text-white backdrop-blur-xs'
                        : 'bg-brand-500/90 text-white backdrop-blur-xs'
                    }`}
                  >
                    {project.status}
                  </span>
                </div>
              </div>

              {/* Text metadata */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-brand-600 font-medium tracking-wide uppercase">
                      {project.category}
                    </span>
                    {project.budget && (
                      <span className="text-xs font-mono text-slate-400">
                        Budget: {project.budget}
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-display font-medium text-slate-900 group-hover:text-brand-600 transition-colors mt-2">
                    {project.title}
                  </h3>

                  <p className="text-sm text-slate-500 mt-2 line-clamp-3 font-light leading-relaxed">
                    {project.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between text-xs font-medium text-slate-600">
                  <span className="font-mono text-[11px] text-slate-400 uppercase">
                    Deadline: {project.deadline}
                  </span>
                  <div className="flex items-center gap-1 text-slate-700 group-hover:text-brand-600 transition-colors">
                    <span>View Specifications</span>
                    <ArrowUpRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
