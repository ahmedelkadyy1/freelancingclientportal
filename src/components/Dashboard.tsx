import React, { useState, useEffect, useRef } from 'react';
import { User, Project, Message, FileMetadata, ActivityLog } from '../types';
import {
  Briefcase,
  Layers,
  FileText,
  MessageSquare,
  Activity,
  Plus,
  UserPlus,
  Send,
  Upload,
  Download,
  Clock,
  Coins,
  Settings,
  X,
  File,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  User as UserIcon,
  ChevronsUpDown,
  FileCheck,
  Trash2,
  Search,
  Moon,
  Sun,
  Terminal,
  HelpCircle,
  Sparkles,
  BookOpen
} from 'lucide-react';

interface DashboardProps {
  currentUser: User;
  onLogout: () => void;
  token: string;
}

export default function Dashboard({ currentUser, token }: DashboardProps) {
  // Navigation State
  const [activeSubTab, setActiveSubTab] = useState<'projects' | 'clients' | 'activity'>(() => {
    return (localStorage.getItem('dashboard_active_subtab') as 'projects' | 'clients' | 'activity') || 'projects';
  });

  // Loading status state for shimmers
  const [isLoading, setIsLoading] = useState(true);

  // Drag and drop asset state
  const [isDragging, setIsDragging] = useState(false);

  // Ctrl+K Search Palette config
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Sells Onboarding walkthrough popup setup
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(() => {
    try {
      return !localStorage.getItem(`has_onboarded_v3_${currentUser.id}`);
    } catch {
      return false;
    }
  });
  const [onboardingStep, setOnboardingStep] = useState(1);

  // Hotkeys coordination
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // Projects state
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(() => {
    return localStorage.getItem('selected_project_id');
  });
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  
  // Selected project auxiliary states
  const [messages, setMessages] = useState<Message[]>([]);
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  
  // Form input states
  const [newMessage, setNewMessage] = useState<string>('');
  
  // Loaded items for admin
  const [allClients, setAllClients] = useState<User[]>([]);

  // Popups/Modals
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // New Project Form Data
  const [projForm, setProjForm] = useState({
    title: '',
    description: '',
    client_id: '',
    is_public: false,
    deadline: '',
    category: '',
    budget: '',
    progress: 0,
    status: 'active' as Project['status']
  });

  // Edit Project Form Data
  const [editProjForm, setEditProjForm] = useState({
    title: '',
    description: '',
    deadline: '',
    category: '',
    budget: '',
    progress: 0,
    status: 'active' as Project['status'],
    is_public: false
  });

  // Register Form Data
  const [clientForm, setClientForm] = useState({
    email: '',
    name: '',
    company: '',
    password: ''
  });

  // Dummy file data simulation
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Message scroll bottom anchor
  const messageEndRef = useRef<HTMLDivElement>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // ----- API DATA FETCHERS -----

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/projects', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
        // Sync active selection
        if (selectedProjectId) {
          const matched = data.find((p: Project) => p.id === selectedProjectId);
          if (matched) setSelectedProject(matched);
        }
      }
    } catch {
      showToast('Connection issue while synchronizing projects list.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClients = async () => {
    if (currentUser.role !== 'admin') return;
    try {
      const res = await fetch('/api/clients', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setAllClients(await res.json());
      }
    } catch {
      console.error('Error fetching clients');
    }
  };

  const fetchProjectDetails = async (id: string) => {
    try {
      // 1. Details
      const resDetails = await fetch(`/api/projects/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resDetails.ok) {
        setSelectedProject(await resDetails.json());
      }

      // 2. Messages
      const resMsg = await fetch(`/api/projects/${id}/messages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resMsg.ok) {
        setMessages(await resMsg.json());
      }

      // 3. Files
      const resFiles = await fetch(`/api/projects/${id}/files`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resFiles.ok) {
        setFiles(await resFiles.json());
      }

      // 4. Activity Logs
      const resAct = await fetch(`/api/projects/${id}/activity`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resAct.ok) {
        setActivities(await resAct.json());
      }
    } catch {
      showToast('Error syncing workspace records.', 'error');
    }
  };

  useEffect(() => {
    localStorage.setItem('dashboard_active_subtab', activeSubTab);
  }, [activeSubTab]);

  useEffect(() => {
    if (selectedProjectId) {
      localStorage.setItem('selected_project_id', selectedProjectId);
    } else {
      localStorage.removeItem('selected_project_id');
    }
  }, [selectedProjectId]);

  useEffect(() => {
    fetchProjects();
    fetchClients();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetchProjectDetails(selectedProjectId);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // ----- HANDLERS -----

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(projForm)
      });

      if (res.ok) {
        showToast(`Workspace initialized: ${projForm.title}`);
        fetchProjects();
        setIsNewProjectModalOpen(false);
        setProjForm({
          title: '',
          description: '',
          client_id: '',
          is_public: false,
          deadline: '',
          category: '',
          budget: '',
          progress: 0,
          status: 'active'
        });
      } else {
        const err = await res.json();
        showToast(err.error || 'Setup failed.', 'error');
      }
    } catch {
      showToast('Server communication failure.', 'error');
    }
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) return;
    try {
      const res = await fetch(`/api/projects/${selectedProjectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editProjForm)
      });

      if (res.ok) {
        showToast('Project metrics modified successfully.');
        setIsEditingProject(false);
        fetchProjects();
        fetchProjectDetails(selectedProjectId);
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to update.', 'error');
      }
    } catch {
      showToast('Server state update failure.', 'error');
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
         body: JSON.stringify(clientForm)
      });

      if (res.ok) {
        showToast(`Authorized credentials created for: ${clientForm.name}`);
        fetchClients();
        setIsNewClientModalOpen(false);
        setClientForm({
          email: '',
          name: '',
          company: '',
          password: ''
        });
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to setup user credentials.', 'error');
      }
    } catch {
      showToast('Account setup failure.', 'error');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedProjectId) return;

    try {
      const res = await fetch(`/api/projects/${selectedProjectId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: newMessage })
      });

      if (res.ok) {
        setNewMessage('');
        // Sync detail stack immediately
        fetchProjectDetails(selectedProjectId);
      } else {
        const err = await res.json();
        showToast(err.error || 'Message draft blocked.', 'error');
      }
    } catch {
      showToast('Message delivery failed.', 'error');
    }
  };

  // Convert and dispatch file payloads, respecting layout constraints
  const processAndUploadFile = async (file: File) => {
    if (!file || !selectedProjectId) return;

    // 1. EXTENSION SECURITY PROTOCOL
    const dangerousExtensions = ['.exe', '.sh', '.bat', '.cmd', '.js', '.vbs', '.msi', '.scr', '.com', '.htm', '.html', '.php', '.py', '.pl'];
    const optMatch = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (dangerousExtensions.includes(optMatch)) {
      showToast('Dangerous file format blocked by clientside security protocols.', 'error');
      return;
    }

    // 2. PAYLOAD SIZE BOUNDARIES (8MB)
    if (file.size > 8 * 1024 * 1024) {
      showToast('Payload boundary exceeded: maximum file upload capacity is 8 MB.', 'error');
      return;
    }

    const sizeFormatted = (file.size / 1024) > 1024 
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${(file.size / 1024).toFixed(0)} KB`;

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const res = await fetch(`/api/projects/${selectedProjectId}/files`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: file.name,
            size: sizeFormatted,
            data: reader.result as string
          })
        });

        if (res.ok) {
          showToast(`Asset synchronized successfully: ${file.name}`);
          fetchProjectDetails(selectedProjectId);
        } else {
          const err = await res.json();
          showToast(err.error || 'Server rejected file upload.', 'error');
        }
      } catch {
        showToast('File upload connection failure.', 'error');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processAndUploadFile(file);
    }
  };

  const handleDownloadFile = async (fileObj: FileMetadata) => {
    try {
      const res = await fetch(`/api/projects/${selectedProjectId}/files/${fileObj.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const fullFile = await res.json();
        if (fullFile.file_data) {
          // Trigger dynamic browser download
          const link = document.createElement('a');
          link.href = fullFile.file_data;
          link.download = fullFile.name;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          showToast(`Downloading: ${fileObj.name}`);
        } else {
          showToast('Download payload is missing from mock.', 'error');
        }
      }
    } catch {
      showToast('Failed to contact download agent.', 'error');
    }
  };

  // ----- ADMINISTRATIVE MANAGEMENT OVERRIDES -----

  const handleDeleteProject = async (projectId: string) => {
    if (!window.confirm('CRITICAL: Are you absolutely sure you want to completely erase this project and all affiliated messages, activity history, and uploaded files? This action cannot be undone.')) {
      return;
    }
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast('Project and all compiled deliverables successfully expunged.');
        setSelectedProjectId(null);
        setSelectedProject(null);
        fetchProjects();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to remove project.', 'error');
      }
    } catch {
      showToast('Project elimination command interrupted.', 'error');
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!selectedProjectId) return;
    try {
      const res = await fetch(`/api/projects/${selectedProjectId}/messages/${messageId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast('Message redacted.');
        fetchProjectDetails(selectedProjectId);
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to moderate instruction.', 'error');
      }
    } catch {
      showToast('Refresher connection failed.', 'error');
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!selectedProjectId) return;
    try {
      const res = await fetch(`/api/projects/${selectedProjectId}/files/${fileId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast('Asset deliverable deleted.');
        fetchProjectDetails(selectedProjectId);
      } else {
        const err = await res.json();
        showToast(err.error || 'Purging asset refused.', 'error');
      }
    } catch {
      showToast('Purging connection lost.', 'error');
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!window.confirm('CRITICAL: Removing this client revokes their gateway login immediately! Their projects will remain in database but unassigned. Are you sure?')) {
      return;
    }
    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast('Client account fully deleted.');
        fetchClients();
        fetchProjects(); // Reload projects to reflect clean unassignment if needed
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to delete client account.', 'error');
      }
    } catch {
      showToast('Client account deletion lost interface contact.', 'error');
    }
  };

  // Editing Client Account State
  const [editingClient, setEditingClient] = useState<User | null>(null);
  const [editClientForm, setEditClientForm] = useState({
    name: '',
    email: '',
    company: '',
    password: ''
  });

  const startEditingClient = (client: User) => {
    setEditingClient(client);
    setEditClientForm({
      name: client.name,
      email: client.email,
      company: client.company || '',
      password: '' // Keep empty unless typing a new override
    });
  };

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;
    try {
      const res = await fetch(`/api/clients/${editingClient.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editClientForm)
      });
      if (res.ok) {
        showToast(`Client metrics adjusted: ${editClientForm.name}`);
        setEditingClient(null);
        fetchClients();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to adjust client specifications.', 'error');
      }
    } catch {
      showToast('Client edit dispatch broken.', 'error');
    }
  };

  const startEditingProject = (p: Project) => {
    setEditProjForm({
      title: p.title,
      description: p.description,
      deadline: p.deadline,
      category: p.category,
      budget: p.budget || '',
      progress: p.progress,
      status: p.status,
      is_public: p.is_public
    });
    setIsEditingProject(true);
  };

  return (
    <div id="dashboard-platform-wrapper" className="min-h-[calc(100vh-4rem)] flex flex-col lg:flex-row relative">
      
      {/* Toast Notifier */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-3 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-xl transition-all animate-bounce">
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400" />
          )}
          <span className="text-sm font-medium">{toastMessage.text}</span>
        </div>
      )}

      {/* ADMIN OR CLIENT SIDEBAR */}
      <aside className="w-full lg:w-72 bg-white dark:bg-slate-900 border-b lg:border-r border-slate-100 dark:border-slate-800 flex flex-col justify-between shrink-0 p-6 transition-all">
        <div>
          {/* Section Heading info */}
          <div className="mb-5">
            <span className="text-[10px] font-mono tracking-widest text-slate-400 dark:text-slate-500 uppercase">Interactive Workspace</span>
            <div className="flex items-center justify-between mt-1">
              <h2 className="text-xl font-display font-medium text-slate-800 dark:text-slate-100 tracking-tight">
                {currentUser.role === 'admin' ? 'Control Board' : 'Client Suite'}
              </h2>
              <button
                onClick={() => {
                  setOnboardingStep(1);
                  setIsOnboardingOpen(true);
                }}
                className="p-1.5 text-slate-405 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
                title="Trigger Guided Onboarding Walkthrough"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Luxury Ctrl+K Search Bar mockup */}
          <div className="mb-6">
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              className="w-full bg-slate-50 dark:bg-slate-950/40 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-150 dark:border-slate-800 text-slate-400 dark:text-slate-500 rounded-xl px-3.5 py-2.5 text-xs font-mono flex items-center justify-between transition-all cursor-pointer text-left"
            >
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                <span className="text-xs truncate">Search modules...</span>
              </div>
              <kbd className="bg-slate-200/60 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[9px] font-sans font-semibold text-slate-500 truncate select-none">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Sub Navigation */}
          <div className="space-y-1">
            <button
              onClick={() => {
                setActiveSubTab('projects');
                setSelectedProjectId(null);
                setSelectedProject(null);
              }}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-3 cursor-pointer ${
                activeSubTab === 'projects'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Briefcase className="w-4.5 h-4.5" />
              <span>Client Projects</span>
              <span className="ml-auto text-xs bg-slate-100/10 px-2 py-0.5 rounded-md font-mono">
                {projects.length}
              </span>
            </button>

            {currentUser.role === 'admin' && (
              <>
                <button
                  onClick={() => setActiveSubTab('clients')}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-3 cursor-pointer ${
                    activeSubTab === 'clients'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <UserIcon className="w-4.5 h-4.5" />
                  <span>Configure Clients</span>
                  <span className="ml-auto text-xs bg-slate-100/10 px-2 py-0.5 rounded-md font-mono">
                    {allClients.length}
                  </span>
                </button>
              </>
            )}
          </div>

          {/* Admin shortcuts segment */}
          {currentUser.role === 'admin' && (
            <div className="mt-8 pt-6 border-t border-slate-55 flex flex-col gap-2.5">
              <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase block mb-1">
                Owner Direct Action
              </span>
              <button
                onClick={() => setIsNewProjectModalOpen(true)}
                className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono flex items-center gap-2 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 text-emerald-600" />
                <span>Establish Project</span>
              </button>
              <button
                onClick={() => setIsNewClientModalOpen(true)}
                className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono flex items-center gap-2 transition-all cursor-pointer"
              >
                <UserPlus className="w-4 h-4 text-brand-650" />
                <span>Register Client User</span>
              </button>
            </div>
          )}
        </div>

        {/* Support Card */}
        <div className="mt-8 bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded-md uppercase font-semibold">
              Live Link
            </span>
            <span className="font-medium text-slate-600">Client Gateway Open</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
            Role-based scopes are fully enforced. Client sees strictly assigned private work models.
          </p>
        </div>
      </aside>

      {/* DASHBOARD EXPLORE CHANNELS */}
      <section className="flex-1 overflow-y-auto px-6 sm:px-8 py-8">
        
        {/* TAB 1: PROJECTS EXPLORE */}
        {activeSubTab === 'projects' && (
          <div className="h-full">
            {!selectedProjectId ? (
              // GENERAL PROJECTS LISTING
              <div>
                <div className="mb-8">
                  <h3 className="text-2xl font-display font-medium text-slate-900 tracking-tight">
                    Current Assigned Projects
                  </h3>
                  <p className="text-sm text-slate-400 mt-1 font-light">
                    Select any project portal from the archive list below to review shared notes, activities, downloads, and chat logs.
                  </p>
                </div>

                {projects.length === 0 ? (
                  <div className="text-center py-20 bg-white border border-dash border-slate-200 rounded-3xl p-8">
                    <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-slate-800">No active client files found</h4>
                    <p className="text-sm text-slate-400 mt-2">
                      {currentUser.role === 'admin' 
                        ? 'Setup dynamic customer project portals using the launch helper.' 
                        : 'No private projects are linked to your profile email at this moment.'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {projects.map(project => (
                      <div
                        key={project.id}
                        onClick={() => setSelectedProjectId(project.id)}
                        className="bg-white border border-slate-100 rounded-2xl p-6 hover:shadow-md hover:border-brand-200 transition-all cursor-pointer flex flex-col justify-between group h-full"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-mono bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md text-slate-500 uppercase">
                              {project.category}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-md capitalize font-medium ${
                              project.status === 'completed'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                : project.status === 'paused'
                                ? 'bg-amber-50 text-amber-750 border border-amber-100'
                                : 'bg-brand-50 text-brand-700 border border-brand-100'
                            }`}>
                              {project.status}
                            </span>
                          </div>

                          <h4 className="text-lg font-display font-medium text-slate-800 group-hover:text-brand-600 transition-all mt-4">
                            {project.title}
                          </h4>

                          <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                            {project.description}
                          </p>
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-50">
                          {/* Progress block */}
                          <div className="flex items-center justify-between text-xs mb-1.5 font-mono text-slate-450 uppercase">
                            <span>Fulfillment</span>
                            <span>{project.progress}%</span>
                          </div>
                          {/* Micro Progress bar */}
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-slate-900 rounded-full transition-all duration-500"
                              style={{ width: `${project.progress}%` }}
                            ></div>
                          </div>

                          <div className="flex items-center justify-between mt-4 text-[11px] text-slate-400 font-mono">
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {project.deadline}
                            </span>
                            <div className="flex items-center gap-2">
                              {project.budget && (
                                <span className="font-semibold text-slate-700">
                                  {project.budget}
                                </span>
                              )}
                              {currentUser.role === 'admin' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteProject(project.id);
                                  }}
                                  className="text-slate-405 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                                  title="Completely Purge Project Workspace File"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // ACTIVE SINGLE PROJECT SECURE PORTAL TREE
              <div className="space-y-8">
                {/* Single Project Header Row */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-6 gap-4">
                  <div>
                    <button
                      onClick={() => {
                        setSelectedProjectId(null);
                        setSelectedProject(null);
                      }}
                      className="text-xs font-mono text-slate-400 hover:text-slate-850 flex items-center gap-1 cursor-pointer"
                    >
                      ← Back to listings
                    </button>
                    <div className="flex items-center gap-2 mt-2">
                      <h3 className="text-3xl font-display font-semibold text-slate-900 tracking-tight">
                        {selectedProject?.title}
                      </h3>
                      {selectedProject?.is_public ? (
                        <span className="text-[10px] font-mono bg-cyan-50 text-cyan-700 px-2 py-0.5 rounded-md uppercase" title="Visible on Public Portfolio">
                          Public
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md uppercase" title="Private Workspace Vault">
                          Private
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Owner Controls */}
                  {currentUser.role === 'admin' && selectedProject && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEditingProject(selectedProject)}
                        className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-mono px-4 py-2 rounded-xl transition-all cursor-pointer"
                      >
                        Edit Details
                      </button>
                      <button
                        onClick={() => handleDeleteProject(selectedProject.id)}
                        className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-mono px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                        title="Purge Project Deliverables Workspace"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Workspace</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Grid Info Columns */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                  
                  {/* Left Column 1: Detailed Overview and Metrics */}
                  <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs">
                      <h4 className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-4">
                        Status Parameters
                      </h4>

                      <div className="space-y-4">
                        <div>
                          <span className="text-xs text-slate-400">Activity Class</span>
                          <p className="text-sm font-medium text-slate-800 capitalize mt-0.5">
                            {selectedProject?.category}
                          </p>
                        </div>

                        <div>
                          <span className="text-xs text-slate-400">System Status</span>
                          <span className={`inline-block ml-2 text-xs font-semibold uppercase px-2 py-0.5 rounded-md ${
                            selectedProject?.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-brand-100 text-brand-800'
                          }`}>
                            {selectedProject?.status}
                          </span>
                        </div>

                        {selectedProject?.budget && (
                          <div>
                            <span className="text-xs text-slate-400">Finance Scale</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Coins className="w-4 h-4 text-amber-500" />
                              <span className="text-sm font-mono font-medium text-slate-800">
                                {selectedProject?.budget}
                              </span>
                            </div>
                          </div>
                        )}

                        <div>
                          <span className="text-xs text-slate-400">Milestone Deadline</span>
                          <div className="text-sm font-mono text-slate-800 mt-0.5">
                            {selectedProject?.deadline}
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between text-xs mb-1.5 font-mono text-slate-450 uppercase">
                            <span>Stage Progress</span>
                            <span>{selectedProject?.progress}%</span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-slate-900 rounded-full transition-all duration-550"
                              style={{ width: `${selectedProject?.progress}%` }}
                            ></div>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-slate-50 text-[11px] text-slate-400 leading-relaxed font-light">
                          {selectedProject?.description}
                        </div>
                      </div>
                    </div>

                    {/* ACTIVITY LOGS WIDGET */}
                    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs">
                      <div className="flex items-center gap-2 mb-4">
                        <Activity className="w-4 h-4 text-slate-400" />
                        <h4 className="text-xs font-mono uppercase tracking-widest text-slate-400">
                          Audit Activity Log
                        </h4>
                      </div>

                      <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2">
                        {activities.length === 0 ? (
                          <span className="text-xs text-slate-400 block font-light">No logged history found.</span>
                        ) : (
                          activities.map(log => (
                            <div key={log.id} className="text-xs border-l-2 border-slate-100 pl-3">
                              <p className="text-slate-700 font-light">{log.text}</p>
                              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-1">
                                <span>{log.user_name}</span>
                                <span>{new Date(log.timestamp).toLocaleDateString()}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* High Fidelity Interactive System tabs: Files and Secure Client Chat */}
                  <div className="lg:col-span-2 space-y-6">
                    
                    {/* SECURE PROJECT MESSENGER CHAT */}
                    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs flex flex-col h-[520px]">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-brand-500" />
                          <h4 className="font-display font-medium text-slate-800 text-sm">
                            Project Workspace Messenger
                          </h4>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 uppercase">
                          Secure Client-Freelancer Encrypted Space
                        </span>
                      </div>

                      {/* Chat Logs Window */}
                      <div className="flex-1 overflow-y-auto space-y-4 pr-2 pb-4 scroll-smooth">
                        {messages.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-2">
                            <MessageSquare className="w-8 h-8 opacity-40" />
                            <span className="text-xs font-mono">No conversations initiated. Start the project sync below.</span>
                          </div>
                        ) : (
                          messages.map((msg) => {
                            const isMe = msg.sender_id === currentUser.id;
                            return (
                              <div 
                                key={msg.id} 
                                className={`flex flex-col max-w-[80%] ${
                                  isMe ? 'ml-auto items-end' : 'mr-auto items-start'
                                }`}
                              >
                                <span className="text-[10px] text-slate-400 font-mono mb-1">
                                  {msg.sender_name} ({msg.sender_role === 'admin' ? 'Freelancer' : 'Client'})
                                </span>
                                
                                <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                                  isMe 
                                    ? 'bg-slate-900 text-slate-50 rounded-tr-none' 
                                    : 'bg-slate-50 text-slate-800 border border-slate-100 rounded-tl-none'
                                }`}>
                                  {msg.content}
                                </div>
                                
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[9px] font-mono text-slate-400 font-light">
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                  {currentUser.role === 'admin' && (
                                    <button
                                      onClick={() => handleDeleteMessage(msg.id)}
                                      className="text-slate-350 hover:text-rose-600 transition-colors cursor-pointer"
                                      title="Moderate / Delete Message"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                        <div ref={messageEndRef} />
                      </div>

                      {/* Message Input Interface */}
                      <form onSubmit={handleSendMessage} className="mt-4 pt-4 border-t border-slate-150 flex gap-2">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Draft secure feedback message for team review..."
                          className="flex-1 bg-slate-50 border border-slate-200 focus:bg-white focus:outline-brand-200 outline-none rounded-xl px-4 py-2.5 text-xs transition-all"
                        />
                        <button
                          type="submit"
                          className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-4 py-2 flex items-center justify-center transition-all cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </form>
                    </div>

                    {/* SECURE FILE VAULT & ATTACHMENT HUB */}
                    <div 
                      className={`border rounded-2xl p-6 shadow-xs transition-all relative ${
                        isDragging 
                          ? 'border-brand-500 bg-brand-50/20 scale-[1.01] shadow-md ring-2 ring-brand-200 dark:ring-brand-900/30' 
                          : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'
                      }`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragEnter={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                      }}
                      onDrop={async (e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) {
                          await processAndUploadFile(file);
                        }
                      }}
                    >
                      {/* Interactive Drag & Drop Overlay element */}
                      {isDragging && (
                        <div className="absolute inset-0 bg-brand-500/5 backdrop-blur-[1px] rounded-2xl flex flex-col items-center justify-center text-brand-600 pointer-events-none z-10 font-mono text-xs gap-2 animate-pulse">
                          <Upload className="w-10 h-10 animate-bounce" />
                          <span>Release file to dispatch to Secure Vault</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                          <h4 className="font-display font-medium text-slate-800 dark:text-slate-100 text-sm">
                            Project File Vault & Blueprint Deliverables
                          </h4>
                        </div>

                        {/* Interactive Invisible File Selector */}
                        <div>
                          <input 
                            type="file" 
                            id="file-vault-selector" 
                            className="hidden" 
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                          />
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="text-xs font-mono bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-705 border border-slate-200 dark:border-slate-700 text-slate-705 dark:text-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Upload className="w-3 h-3 text-brand-600" />
                            <span>Upload Asset File</span>
                          </button>
                        </div>
                      </div>

                      {/* Files Index */}
                      <div className="space-y-3">
                        {files.length === 0 ? (
                          <div className="py-8 text-center text-slate-300">
                            <FileCheck className="w-8 h-8 mx-auto opacity-30 mb-2" />
                            <span className="text-xs font-mono">No deliverables loaded yet. Both uploader clients & admin can add specifications inside.</span>
                          </div>
                        ) : (
                          files.map(fileObj => (
                            <div 
                              key={fileObj.id} 
                              className="bg-slate-50/50 hover:bg-slate-50 border border-slate-100 p-3.5 rounded-xl flex items-center justify-between text-xs"
                            >
                              <div className="flex items-center gap-3">
                                <File className="w-5 h-5 text-brand-600" />
                                <div>
                                  <span className="font-semibold text-slate-800 block truncate max-w-xs">{fileObj.name}</span>
                                  <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                                    Size: {fileObj.size} · Uploaded by {fileObj.uploader_name}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleDownloadFile(fileObj)}
                                  className="bg-white hover:bg-slate-100 border border-slate-200 p-2 rounded-lg text-slate-600 hover:text-slate-900 transition-all cursor-pointer flex items-center gap-1"
                                  title="Download Secure Asset Content"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span className="font-mono text-[10px]">Save File</span>
                                </button>
                                {currentUser.role === 'admin' && (
                                  <button
                                    onClick={() => handleDeleteFile(fileObj.id)}
                                    className="bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 p-2 rounded-lg text-slate-400 hover:text-rose-600 transition-all cursor-pointer"
                                    title="Delete/Purge Deliverable Asset"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CONFIGURE CLIENT SECURE ACCOUNTS (ADMIN ONLY) */}
        {activeSubTab === 'clients' && currentUser.role === 'admin' && (
          <div>
            <div className="mb-8">
              <h3 className="text-2xl font-display font-medium text-slate-900 tracking-tight">
                Client Control Console
              </h3>
              <p className="text-sm text-slate-400 mt-1 font-light">
                Securely register new client profiles. Registered users retrieve instant login routes to see strictly non-public portfolios mapped to their unique client tag.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              {/* Clients Registry Index */}
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs">
                <h4 className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-4">
                  Authorized Clients Database
                </h4>
                
                <div className="divide-y divide-slate-100 space-y-4">
                  {allClients.map(client => (
                    <div key={client.id} className="pt-4 first:pt-0 flex items-center justify-between gap-4">
                      <div>
                        <span className="font-medium text-slate-800 block">{client.name}</span>
                        <span className="text-xs font-mono text-slate-400 block mt-0.5">{client.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md uppercase font-semibold">
                          {client.company || 'Independent'}
                        </span>
                        <button
                          onClick={() => startEditingClient(client)}
                          className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Edit Profile Information & Password Reset"
                        >
                          <Settings className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClient(client.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-lg transition-colors cursor-pointer"
                          title="Permanently Expunge and Revoke Client Login"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Instant Creation box */}
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs">
                <h4 className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-4">
                  Quick Client Provisioner
                </h4>

                <form onSubmit={handleCreateClient} className="space-y-4">
                  <div>
                    <label className="block text-xs text-slate-450 uppercase mb-1 font-mono">Client Name</label>
                    <input
                      type="text"
                      required
                      value={clientForm.name}
                      onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                      placeholder="e.g. Alexis Martinez"
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white outline-none rounded-xl px-4 py-2.5 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-450 uppercase mb-1 font-mono">Company / Entity</label>
                    <input
                      type="text"
                      value={clientForm.company}
                      onChange={(e) => setClientForm({ ...clientForm, company: e.target.value })}
                      placeholder="e.g. Apex Corp"
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white outline-none rounded-xl px-4 py-2.5 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-450 uppercase mb-1 font-mono">Client Email</label>
                    <input
                      type="email"
                      required
                      value={clientForm.email}
                      onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                      placeholder="alexis@apex.corp"
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white outline-none rounded-xl px-4 py-2.5 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-450 uppercase mb-1 font-mono">Temporary Secure Password</label>
                    <input
                      type="password"
                      required
                      value={clientForm.password}
                      onChange={(e) => setClientForm({ ...clientForm, password: e.target.value })}
                      placeholder="Set access credentials..."
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white outline-none rounded-xl px-4 py-2.5 text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-mono text-xs uppercase px-4 py-3 rounded-xl transition-all cursor-pointer tracking-wider"
                  >
                    Register and Authorize Account
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ----- POPUP MODALS ----- */}

      {/* MODAL 1: CREATE PROJECT (ADMIN ONLY) */}
      {isNewProjectModalOpen && (
        <div className="fixed inset-y-0 inset-x-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white border border-slate-250 w-full max-w-xl rounded-2xl p-6 shadow-2xl relative">
            <button 
              onClick={() => setIsNewProjectModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-display font-medium text-slate-900 mb-2">
              Launch Client Project Workspace
            </h3>
            <p className="text-xs text-slate-400 mb-6 font-light">
              Provision a new project dashboard. Choose whether to bind it to a private client account, or establish it as a public-facing portfolio asset.
            </p>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-450 uppercase font-mono mb-1">Project Title</label>
                  <input
                    type="text"
                    required
                    value={projForm.title}
                    onChange={(e) => setProjForm({ ...projForm, title: e.target.value })}
                    placeholder="e.g. Brand Audit MVP"
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white outline-none rounded-xl px-4 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-450 uppercase font-mono mb-1">Category tag</label>
                  <input
                    type="text"
                    required
                    value={projForm.category}
                    onChange={(e) => setProjForm({ ...projForm, category: e.target.value })}
                    placeholder="e.g. Web App / Brand"
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white outline-none rounded-xl px-4 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-450 uppercase font-mono mb-1">Project Description & Brief</label>
                <textarea
                  required
                  rows={3}
                  value={projForm.description}
                  onChange={(e) => setProjForm({ ...projForm, description: e.target.value })}
                  placeholder="Set client project expectations and architectural objectives clearly..."
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white outline-none rounded-xl px-4 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-450 uppercase font-mono mb-1">Project Client Pairing</label>
                  <select
                    value={projForm.client_id}
                    onChange={(e) => setProjForm({ ...projForm, client_id: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white outline-none rounded-xl px-4 py-2 text-xs"
                  >
                    <option value="">Public Portfolio Item ONLY</option>
                    {allClients.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.company})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-450 uppercase font-mono mb-1">Project Visibility</label>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      id="proj-is-public-checker"
                      checked={projForm.is_public}
                      onChange={(e) => setProjForm({ ...projForm, is_public: e.target.checked })}
                      className="w-4 h-4 text-brand-600 rounded bg-slate-50"
                    />
                    <label htmlFor="proj-is-public-checker" className="text-xs text-slate-700">Display in Public Work list</label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-450 uppercase font-mono mb-1">Milestone Deadline</label>
                  <input
                    type="date"
                    required
                    value={projForm.deadline}
                    onChange={(e) => setProjForm({ ...projForm, deadline: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white outline-none rounded-xl px-4 py-2 text-xs text-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-450 uppercase font-mono mb-1">Project Budget Scale (Optional)</label>
                  <input
                    type="text"
                    value={projForm.budget}
                    onChange={(e) => setProjForm({ ...projForm, budget: e.target.value })}
                    placeholder="e.g. $18,000"
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white outline-none rounded-xl px-4 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewProjectModalOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-xs uppercase px-4 py-3 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-mono text-xs uppercase px-4 py-3 rounded-xl transition-all cursor-pointer tracking-wider"
                >
                  Create Project File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: REGISTER CLIENT USER ACCOUNT */}
      {isNewClientModalOpen && (
        <div className="fixed inset-y-0 inset-x-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white border border-slate-250 w-full max-w-sm rounded-2xl p-6 shadow-2xl relative">
            <button 
              onClick={() => setIsNewClientModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-850 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-display font-medium text-slate-900 mb-2">
              Provision Client Account
            </h3>
            <p className="text-xs text-slate-400 mb-6 font-light">
              Add authorized credentials to allow clients to log in and review workspace components.
            </p>

            <form onSubmit={handleCreateClient} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-450 uppercase font-mono mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={clientForm.name}
                  onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white outline-none rounded-xl px-4 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-450 uppercase font-mono mb-1">Company Name</label>
                <input
                  type="text"
                  value={clientForm.company}
                  onChange={(e) => setClientForm({ ...clientForm, company: e.target.value })}
                  placeholder="e.g. Acme Corp"
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white outline-none rounded-xl px-4 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-450 uppercase font-mono mb-1">Security Email</label>
                <input
                  type="email"
                  required
                  value={clientForm.email}
                  onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                  placeholder="acme@client.com"
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white outline-none rounded-xl px-4 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-450 uppercase font-mono mb-1">Access Password</label>
                <input
                  type="password"
                  required
                  value={clientForm.password}
                  onChange={(e) => setClientForm({ ...clientForm, password: e.target.value })}
                  placeholder="Set access security passphrase..."
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white outline-none rounded-xl px-4 py-2 text-xs"
                />
              </div>

              <div className="pt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewClientModalOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-xs uppercase px-4 py-3 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-mono text-xs uppercase px-4 py-3 rounded-xl transition-all cursor-pointer"
                >
                  Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: EDIT PROJECT METRICS (ADMIN ONLY) */}
      {isEditingProject && (
        <div className="fixed inset-y-0 inset-x-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-250 w-full max-w-lg rounded-2xl p-6 shadow-2xl relative">
            <button 
              onClick={() => setIsEditingProject(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-850 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-display font-medium text-slate-900 mb-2">
              Update Workspace Parameters
            </h3>
            <p className="text-xs text-slate-400 mb-6 font-light">
              Fine-tune the project budget, adjust deadlines, progress percentage, or visibility settings.
            </p>

            <form onSubmit={handleUpdateProject} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-450 uppercase font-mono mb-1">Project Title</label>
                  <input
                    type="text"
                    required
                    value={editProjForm.title}
                    onChange={(e) => setEditProjForm({ ...editProjForm, title: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white outline-none rounded-xl px-4 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-450 uppercase font-mono mb-1">Category Code</label>
                  <input
                    type="text"
                    required
                    value={editProjForm.category}
                    onChange={(e) => setEditProjForm({ ...editProjForm, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white outline-none rounded-xl px-4 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-450 uppercase font-mono mb-1">Description Brief</label>
                <textarea
                  required
                  rows={2}
                  value={editProjForm.description}
                  onChange={(e) => setEditProjForm({ ...editProjForm, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white outline-none rounded-xl px-4 py-3 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-450 uppercase font-mono mb-1">Finance Scale</label>
                  <input
                    type="text"
                    value={editProjForm.budget}
                    onChange={(e) => setEditProjForm({ ...editProjForm, budget: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white outline-none rounded-xl px-4 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-450 uppercase font-mono mb-1">Milestone Deadline</label>
                  <input
                    type="date"
                    required
                    value={editProjForm.deadline}
                    onChange={(e) => setEditProjForm({ ...editProjForm, deadline: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white outline-none rounded-xl px-4 py-2 text-xs text-slate-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-450 uppercase font-mono mb-1">Current State Status</label>
                  <select
                    value={editProjForm.status}
                    onChange={(e) => setEditProjForm({ ...editProjForm, status: e.target.value as Project['status'] })}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white outline-none rounded-xl px-4 py-2 text-xs"
                  >
                    <option value="active">active</option>
                    <option value="paused">paused</option>
                    <option value="completed">completed</option>
                    <option value="ongoing">ongoing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-450 uppercase font-mono mb-1">Visibility Option</label>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      id="edit-is-public-tagger"
                      checked={editProjForm.is_public}
                      onChange={(e) => setEditProjForm({ ...editProjForm, is_public: e.target.checked })}
                      className="w-4 h-4 text-brand-600 rounded"
                    />
                    <label htmlFor="edit-is-public-tagger" className="text-xs text-slate-700">Display in Public Gallery</label>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs text-slate-450 uppercase font-mono">Stage Progress Completeness</label>
                  <span className="text-xs font-mono font-semibold">{editProjForm.progress}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={editProjForm.progress}
                  onChange={(e) => setEditProjForm({ ...editProjForm, progress: Number(e.target.value) })}
                  className="w-full accent-slate-900 cursor-pointer"
                />
              </div>

              <div className="pt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingProject(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-705 font-mono text-xs uppercase px-4 py-3 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-mono text-xs uppercase px-4 py-3 rounded-xl transition-all cursor-pointer tracking-wider"
                >
                  Commit Modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: EDIT CLIENT PROFILE (ADMIN ONLY) */}
      {editingClient && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-sm rounded-2xl p-6 shadow-2xl relative">
            <button 
              onClick={() => setEditingClient(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-850 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-display font-medium text-slate-900 mb-2">
              Edit Client Profile
            </h3>
            <p className="text-xs text-slate-400 mb-6 font-light">
              Revise name, organization affiliation, profile email, or set/reset a new temporary security passcode.
            </p>

            <form onSubmit={handleUpdateClient} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-450 uppercase font-mono mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editClientForm.name}
                  onChange={(e) => setEditClientForm({ ...editClientForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white outline-none rounded-xl px-4 py-2.5 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-450 uppercase font-mono mb-1">Company Entity</label>
                <input
                  type="text"
                  value={editClientForm.company}
                  onChange={(e) => setEditClientForm({ ...editClientForm, company: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white outline-none rounded-xl px-4 py-2.5 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-450 uppercase font-mono mb-1">Client Email</label>
                <input
                  type="email"
                  required
                  value={editClientForm.email}
                  onChange={(e) => setEditClientForm({ ...editClientForm, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white outline-none rounded-xl px-4 py-2.5 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-450 uppercase font-mono mb-1">New Password (Optional)</label>
                <input
                  type="password"
                  value={editClientForm.password}
                  onChange={(e) => setEditClientForm({ ...editClientForm, password: e.target.value })}
                  placeholder="Leave blank to preserve current passcode"
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white outline-none rounded-xl px-4 py-2.5 text-xs placeholder:text-[10px]"
                />
              </div>

              <div className="pt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingClient(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-xs uppercase px-4 py-3 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-mono text-xs uppercase px-3.5 py-3 rounded-xl transition-all cursor-pointer tracking-wider"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: SPOTLIGHT COMMAND PALETTE OVERLAY (CMD+K OR CTRL+K) */}
      {isCommandPaletteOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center z-50 p-4 pt-[10vh] animate-fade-in" onClick={() => setIsCommandPaletteOpen(false)}>
          <div 
            className="bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-850 w-full max-w-xl rounded-2xl p-4 shadow-2xl relative flex flex-col focus-within:ring-2 focus-within:ring-brand-500/20"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Input Header */}
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
              <Search className="w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0" />
              <input
                type="text"
                autoFocus
                placeholder="Search projects, client tag files, or quick actions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-sm text-slate-805 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-550 outline-none border-0 focus:ring-0 p-0"
              />
              <button 
                onClick={() => setIsCommandPaletteOpen(false)}
                className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded cursor-pointer border-0"
              >
                ESC
              </button>
            </div>

            {/* Results stack container */}
            <div className="max-h-80 overflow-y-auto space-y-4 pr-1">
              
              {/* Categorized Sprints */}
              <div>
                <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1.5 px-2">
                  Client Project Portals
                </span>
                
                {projects.filter(p => !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.category.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                  <span className="text-xs text-slate-405 dark:text-slate-500 italic block px-2 py-1">No matching project archives found.</span>
                ) : (
                  <div className="space-y-0.5">
                    {projects
                      .filter(p => !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.category.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map(p => (
                        <button
                          key={p.id}
                          onClick={() => {
                            setSelectedProjectId(p.id);
                            setSelectedProject(p);
                            setIsCommandPaletteOpen(false);
                            setActiveSubTab('projects');
                            showToast(`Selected workspace: ${p.title}`);
                          }}
                          className="w-full text-left px-2.5 py-2 rounded-xl text-xs hover:bg-slate-50 dark:hover:bg-slate-850 flex items-center justify-between text-slate-700 dark:text-slate-200 transition-colors border-0 cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <Briefcase className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                            <span className="font-medium truncate max-w-xs">{p.title}</span>
                          </div>
                          <span className="text-[9px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase px-1.5 py-0.5 rounded">
                            {p.category}
                          </span>
                        </button>
                      ))}
                  </div>
                )}
              </div>

              {/* Categorized Accounts for Admin */}
              {currentUser.role === 'admin' && (
                <div>
                  <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1.5 px-2">
                    Clients Database
                  </span>
                  
                  {allClients.filter(c => !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.company?.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                    <span className="text-xs text-slate-405 dark:text-slate-500 italic block px-2 py-1">No client credentials found.</span>
                  ) : (
                    <div className="space-y-0.5">
                      {allClients
                        .filter(c => !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.company?.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map(c => (
                          <div
                            key={c.id}
                            className="px-2.5 py-2 rounded-xl text-xs hover:bg-slate-50 dark:hover:bg-slate-850 flex items-center justify-between text-slate-700 dark:text-slate-200 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <UserIcon className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                              <span className="font-medium">{c.name} ({c.email})</span>
                            </div>
                            <span className="text-[9px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded">
                              {c.company || 'Direct'}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* Actions list */}
              <div>
                <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1.5 px-2">
                  Instant Shortcuts
                </span>
                
                <div id="quick-actions-palette-group" className="space-y-0.5">
                  <button
                    onClick={() => {
                      setIsCommandPaletteOpen(false);
                      setOnboardingStep(1);
                      setIsOnboardingOpen(true);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-xl text-xs hover:bg-slate-50 dark:hover:bg-slate-850 flex items-center gap-2 text-slate-700 dark:text-slate-200 border-0 cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-brand-500" />
                    <span>Launch Guided Workspace Tour</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsCommandPaletteOpen(false);
                      setActiveSubTab('projects');
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-xl text-xs hover:bg-slate-50 dark:hover:bg-slate-850 flex items-center gap-2 text-slate-700 dark:text-slate-200 border-0 cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5 text-indigo-550" />
                    <span>Review All Client Sprints</span>
                  </button>

                  {currentUser.role === 'admin' && (
                    <>
                      <button
                        onClick={() => {
                          setIsCommandPaletteOpen(false);
                          setIsNewProjectModalOpen(true);
                        }}
                        className="w-full text-left px-2.5 py-2 rounded-xl text-xs hover:bg-slate-50 dark:hover:bg-slate-850 flex items-center gap-2 text-slate-700 dark:text-slate-200 border-0 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Establish Custom Project Workspace</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsCommandPaletteOpen(false);
                          setIsNewClientModalOpen(true);
                        }}
                        className="w-full text-left px-2.5 py-2 rounded-xl text-xs hover:bg-slate-50 dark:hover:bg-slate-850 flex items-center gap-2 text-slate-700 dark:text-slate-200 border-0 cursor-pointer"
                      >
                        <UserPlus className="w-3.5 h-3.5 text-blue-500" />
                        <span>Register Secure Clientele Passcode</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: GUIDED ONBOARDING TOUR THROUGH WORKSPACE */}
      {isOnboardingOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl relative flex flex-col">
            
            {/* Stepper Header indicator */}
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="text-[10px] font-mono tracking-widest text-[#6366f1] dark:text-brand-400 font-bold uppercase">
                Guided Orientation (Step {onboardingStep} of 4)
              </span>
              <button 
                onClick={() => {
                  try {
                    localStorage.setItem(`has_onboarded_v3_${currentUser.id}`, 'true');
                  } catch {}
                  setIsOnboardingOpen(false);
                }}
                className="text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer border-0 bg-transparent"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Stepper Core Slide Panels */}
            <div className="min-h-56 pb-4 flex flex-col justify-between">
              {onboardingStep === 1 && (
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-slate-800 flex items-center justify-center text-white">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-display font-medium text-slate-800 dark:text-slate-100">
                    Bespoke Client Portals
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Welcome to the Freelance Workspace Client Suite. Under our advanced, compartmentalized workspace rule-set, customers login using a unique tag, granting private route privileges strictly to portfolios mapped to their email coordinate.
                  </p>
                </div>
              )}

              {onboardingStep === 2 && (
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                    <Layers className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-display font-medium text-slate-800 dark:text-slate-100">
                    Milestone Sprints Management
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Admin users update progress percentages, budget allocations, public gallery permissions, or milestone deadlines. The active sprint status updates in real-time, displaying custom meters as progress develops.
                  </p>
                </div>
              )}

              {onboardingStep === 3 && (
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
                    <Upload className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-display font-medium text-slate-800 dark:text-slate-100">
                    Collaborating Vault & Chat Space
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Collaborators submit designs, briefs, and deliverables securely inside the dashboard using drag-and-drop actions. File uploads contain client-side security format blockers and size thresholds ensuring protection against dangerous material.
                  </p>
                </div>
              )}

              {onboardingStep === 4 && (
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white">
                    <Terminal className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-display font-medium text-slate-800 dark:text-slate-100">
                    Spotlight Search Mechanics
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Open the Spotlight Search control console instantly by pressing <span className="font-semibold text-slate-950 dark:text-white px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono text-[10px]">⌘K</span> anywhere in the workspace. Quickly query files, toggle layouts, or filter registered client directories securely.
                  </p>
                </div>
              )}

              {/* Step dots Indicator & footer controller buttons */}
              <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                
                {/* Micro step tracker indices */}
                <div className="flex items-center gap-1.5 animate-pulse">
                  {[1, 2, 3, 4].map(idx => (
                    <div 
                      key={idx} 
                      className={`h-1.5 rounded-full transition-all ${
                        onboardingStep === idx 
                          ? 'w-4 bg-slate-900 dark:bg-slate-200' 
                          : 'w-1.5 bg-slate-300 dark:bg-slate-700'
                      }`}
                    />
                  ))}
                </div>

                <div className="flex gap-2">
                  {onboardingStep > 1 && (
                    <button
                      onClick={() => setOnboardingStep(prev => prev - 1)}
                      className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[10px] uppercase px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer border-0"
                    >
                      Back
                    </button>
                  )}
                  {onboardingStep < 4 ? (
                    <button
                      onClick={() => setOnboardingStep(prev => prev + 1)}
                      className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-mono text-[10px] uppercase px-3.5 py-2 rounded-lg hover:bg-slate-800 dark:hover:bg-white cursor-pointer border-0"
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        try {
                          localStorage.setItem(`has_onboarded_v3_${currentUser.id}`, 'true');
                        } catch {}
                        setIsOnboardingOpen(false);
                        showToast('Workspace set up complete! Launching modules.');
                      }}
                      className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-mono text-[10px] uppercase px-3.5 py-2 rounded-lg hover:bg-slate-800 dark:hover:bg-white cursor-pointer select-none font-bold border-0"
                    >
                      Unlock Desk
                    </button>
                  )}
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
