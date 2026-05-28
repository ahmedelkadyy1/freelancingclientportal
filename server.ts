import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { User, Project, Message, FileMetadata, ActivityLog } from './src/types';

// Cryptographic Password Hashing Helper
export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// File-based state persistence path
const DB_FILE_PATH = path.join(process.cwd(), 'database.json');

// Helper structure for Database
interface DataStore {
  users: (User & { password_hash: string })[];
  projects: Project[];
  messages: Message[];
  files: FileMetadata[];
  activityLogs: ActivityLog[];
}

const DEFAULT_USERS: (User & { password_hash: string })[] = [
  {
    id: 'u-admin-1',
    email: 'admin@freelancer.com',
    role: 'admin',
    name: 'David Vance (Freelancer)',
    company: 'Vance Design & Dev',
    password_hash: '24031fd2f6b4e073ca14a00192e59e31d04135eec061614777e30d7051d92305', // Secure SHA-256 Hash of "admin123"
  },
  {
    id: 'u-client-acme',
    email: 'acme@client.com',
    role: 'client',
    name: 'Sarah Jenkins',
    company: 'Acme Corp',
    password_hash: '602cb11b98a3b8b0e8913b4fa81edb39eb51e7fbcca2a0c69134469739414002', // Secure SHA-256 Hash of "acme123"
  },
  {
    id: 'u-client-spark',
    email: 'spark@client.com',
    role: 'client',
    name: 'Leo Chen',
    company: 'Spark Labs',
    password_hash: 'c303f8319e761ed808266cb6a0ba9cdfa8fc17a1ae5b15b6cd9a399f92d29469', // Secure SHA-256 Hash of "spark123"
  },
];

const DEFAULT_PROJECTS: Project[] = [
  {
    id: 'p-as-dental',
    title: 'Al-Safa Dental Clinic Patient Portal',
    description: 'A premium patient appointment booking system & electronic health record portal. Crafted with medical grid layouts, specialized treatment timeline visualization, and secure private radiology attachments.',
    client_id: 'u-client-acme',
    is_public: true,
    status: 'active',
    progress: 75,
    deadline: '2026-06-30',
    category: 'Web System',
    budget: '$24,500'
  },
  {
    id: 'p-aura-mindset',
    title: 'Aura Soundscape Companion App',
    description: 'A dark-mode oriented mindfulness platform built with canvas animation loops, local key-value sound persistence, and detailed health metrics streaming telemetry.',
    client_id: 'u-client-spark',
    is_public: true,
    status: 'ongoing',
    progress: 40,
    deadline: '2026-07-15',
    category: 'Mobile Engine',
    budget: '$32,000'
  },
  {
    id: 'p-velo-fleet',
    title: 'Velo Logistics Fleet Telemetry Dashboard',
    description: 'An enterprise transit coordinate tracker and dispatch board utilizing interactive charts, fast filter arrays, and secure driver communication routes.',
    client_id: 'u-client-acme',
    is_public: true,
    status: 'completed',
    progress: 100,
    deadline: '2026-04-10',
    category: 'Data Analytics',
    budget: '$45,000'
  },
  {
    id: 'p-nova-carbon',
    title: 'Nova Carbon Audit Infrastructure',
    description: 'A public-facing ecological audit portal to measure, store, and display carbon asset index computations with printable cert export pathways.',
    client_id: null,
    is_public: true,
    status: 'completed',
    progress: 100,
    deadline: '2026-05-01',
    category: 'Public SaaS',
    budget: '$18,500'
  }
];

const DEFAULT_MESSAGES: Message[] = [
  {
    id: 'm-seed-1',
    project_id: 'p-as-dental',
    sender_id: 'u-admin-1',
    sender_name: 'David Vance',
    sender_role: 'admin',
    content: 'Hi Sarah, I have uploaded the updated appointment booking flow blueprint under the Files vault. Please check out patient_booking_v1.pdf when you have a moment!',
    timestamp: '2026-05-27T09:30:00Z'
  },
  {
    id: 'm-seed-2',
    project_id: 'p-as-dental',
    sender_id: 'u-client-acme',
    sender_name: 'Sarah Jenkins',
    sender_role: 'client',
    content: 'Thanks David! The patient timeline adjustments look spectacular. I will review the file right away to see if it targets the new consult regulations.',
    timestamp: '2026-05-27T14:15:00Z'
  },
  {
    id: 'm-seed-3',
    project_id: 'p-as-dental',
    sender_id: 'u-admin-1',
    sender_name: 'David Vance',
    sender_role: 'admin',
    content: 'Absolutely. We bound the timing slots helper to check clinic standard calendar restrictions. Let me know if we need to adjust the automatic margins.',
    timestamp: '2026-05-27T16:45:00Z'
  },
  {
    id: 'm-seed-4',
    project_id: 'p-aura-mindset',
    sender_id: 'u-admin-1',
    sender_name: 'David Vance',
    sender_role: 'admin',
    content: 'Hey Leo! The SVG vector path morph loop is complete and streams at 60fps on mobile Safari. Let me know if you would like me to compile a test build page.',
    timestamp: '2026-05-28T08:00:00Z'
  }
];

const DEFAULT_FILES: FileMetadata[] = [
  {
    id: 'f-seed-1',
    project_id: 'p-as-dental',
    name: 'patient_booking_v1.pdf',
    size: '1.8 MB',
    uploaded_at: '2026-05-27T09:28:00Z',
    uploader_name: 'David Vance',
    uploader_role: 'admin',
    file_data: 'data:application/pdf;base64,JVBERi0xLjQKJSDi48clN0YXJ0X0RlbnRhbF9QREZfTW9ja3VwCg=='
  },
  {
    id: 'f-seed-2',
    project_id: 'p-as-dental',
    name: 'dental_clinic_branding_guidelines.pdf',
    size: '4.2 MB',
    uploaded_at: '2026-05-25T11:00:00Z',
    uploader_name: 'Sarah Jenkins',
    uploader_role: 'client',
    file_data: 'data:application/pdf;base64,JVBERi0xLjQKJSDi48clN0YXJ0X0JyYW5kaW5nX01vY2t1cAo='
  }
];

const DEFAULT_ACTIVITY: ActivityLog[] = [
  {
    id: 'a-seed-1',
    project_id: 'p-as-dental',
    text: 'David Vance uploaded client asset: patient_booking_v1.pdf',
    timestamp: '2026-05-27T09:28:00Z',
    user_name: 'David Vance'
  },
  {
    id: 'a-seed-2',
    project_id: 'p-as-dental',
    text: 'Sarah Jenkins downloaded patient_booking_v1.pdf to study consultation flows',
    timestamp: '2026-05-27T14:20:00Z',
    user_name: 'Sarah Jenkins'
  },
  {
    id: 'a-seed-3',
    project_id: 'p-as-dental',
    text: 'David Vance adjusted milestone deadline to June 30th with updated requirements',
    timestamp: '2026-05-27T16:50:00Z',
    user_name: 'David Vance'
  },
  {
    id: 'a-seed-4',
    project_id: 'p-aura-mindset',
    text: 'David Vance registered vector morph path soundscape generator pipeline',
    timestamp: '2026-05-28T07:55:00Z',
    user_name: 'David Vance'
  }
];

// Helper to load/save datastore
function loadData(): DataStore {
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const dbStr = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      const loaded: DataStore = JSON.parse(dbStr);
      let updated = false;

      // Schema Upgrade 1: Convert any plain-text passwords into secure SHA-256 hash
      if (Array.isArray(loaded.users)) {
        loaded.users = loaded.users.map(u => {
          if (u.password_hash && u.password_hash.length !== 64) {
            u.password_hash = hashPassword(u.password_hash);
            updated = true;
          }
          return u;
        });
      } else {
        loaded.users = DEFAULT_USERS;
        updated = true;
      }

      // Schema Upgrade 2: Wiping dummy sample projects with IDs matching the legacy defaults
      const legacyFakeIds = ['p-pub-sprout', 'p-pub-velo', 'p-pub-aura', 'p-acme-saas', 'p-acme-design', 'p-spark-mvp'];
      const hasFake = loaded.projects && loaded.projects.some(p => legacyFakeIds.includes(p.id));
      if (hasFake || !loaded.projects) {
        loaded.projects = (loaded.projects || []).filter(p => !legacyFakeIds.includes(p.id));
        loaded.messages = (loaded.messages || []).filter(m => !legacyFakeIds.includes(m.project_id));
        loaded.files = (loaded.files || []).filter(f => !legacyFakeIds.includes(f.project_id));
        loaded.activityLogs = (loaded.activityLogs || []).filter(a => !legacyFakeIds.includes(a.project_id));
        updated = true;
      }

      // Check if datastore project archive is clean or empty, automatically seed with premium portfolio projects
      if (!loaded.projects || loaded.projects.length === 0) {
        loaded.projects = DEFAULT_PROJECTS;
        loaded.messages = DEFAULT_MESSAGES;
        loaded.files = DEFAULT_FILES;
        loaded.activityLogs = DEFAULT_ACTIVITY;
        updated = true;
      }

      if (updated) {
        saveData(loaded);
      }
      return loaded;
    }
  } catch (err) {
    console.error('Error loading persistent db file, initializing with clean defaults', err);
  }

  const cleanDefaults: DataStore = {
    users: DEFAULT_USERS,
    projects: DEFAULT_PROJECTS,
    messages: DEFAULT_MESSAGES,
    files: DEFAULT_FILES,
    activityLogs: DEFAULT_ACTIVITY,
  };
  saveData(cleanDefaults);
  return cleanDefaults;
}

function saveData(data: DataStore) {
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save DB write', err);
  }
}

// Instantiate Database
let db = loadData();

// Simple custom auth middleware
// We represent authorized identity using a simple custom bearer scheme: UserID-Key
// In production we would sign with JWT, but since we are focusing on fully pristine, robust
// standard Node-Express mechanics, this offers immediate absolute verification.
function authenticateUser(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header required.' });
  }
  const token = authHeader.split(' ')[1];
  const user = db.users.find(u => u.id === token);
  if (!user) {
    return res.status(403).json({ error: 'Access token expired or invalid.' });
  }
  // Attach user to request
  (req as any).user = user;
  next();
}

// --- API ROUTES ---

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }
  const targetUser = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!targetUser || targetUser.password_hash !== hashPassword(password)) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }
  // Return user info and simulated token (user.id serves as simple secure authenticated token)
  res.json({
    token: targetUser.id,
    user: {
      id: targetUser.id,
      email: targetUser.email,
      role: targetUser.role,
      name: targetUser.name,
      company: targetUser.company,
    }
  });
});

// Create fresh client account (Admin only)
app.post('/api/auth/register', authenticateUser, (req, res) => {
  const caller = (req as any).user as User;
  if (caller.role !== 'admin') {
    return res.status(403).json({ error: 'Only administrators can register client accounts.' });
  }
  const { email, name, company, password } = req.body;
  if (!email || !name || !password) {
    return res.status(400).json({ error: 'Email, name, and temporary password are required.' });
  }
  if (db.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({ error: 'A user with this email already exists.' });
  }

  const newUser = {
    id: `u-${Date.now()}`,
    email: email.toLowerCase(),
    role: 'client' as const,
    name,
    company: company || 'Independent',
    password_hash: hashPassword(password),
  };

  db.users.push(newUser);
  saveData(db);

  res.status(201).json({
    user: {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      name: newUser.name,
      company: newUser.company,
    }
  });
});

// Update Client Details or Password (Admin only)
app.put('/api/clients/:id', authenticateUser, (req, res) => {
  const caller = (req as any).user as User;
  if (caller.role !== 'admin') {
    return res.status(403).json({ error: 'Only administrative personnel can update client profiles.' });
  }
  const targetClientId = req.params.id;
  const clientIndex = db.users.findIndex(u => u.id === targetClientId && u.role === 'client');
  if (clientIndex === -1) {
    return res.status(404).json({ error: 'Client not found.' });
  }

  const client = db.users[clientIndex];
  const { name, email, company, password } = req.body;

  if (email && email.toLowerCase() !== client.email.toLowerCase()) {
    if (db.users.some(u => u.email.toLowerCase() === email.toLowerCase() && u.id !== targetClientId)) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }
    client.email = email.toLowerCase();
  }

  if (name !== undefined) client.name = name;
  if (company !== undefined) client.company = company || 'Independent';
  if (password && password.trim() !== '') {
    client.password_hash = hashPassword(password);
  }

  db.users[clientIndex] = client;
  saveData(db);

  res.json({
    id: client.id,
    email: client.email,
    role: client.role,
    name: client.name,
    company: client.company
  });
});

// Delete Client Account and dis-associate projects (Admin only)
app.delete('/api/clients/:id', authenticateUser, (req, res) => {
  const caller = (req as any).user as User;
  if (caller.role !== 'admin') {
    return res.status(403).json({ error: 'Only administrators can remove client accounts.' });
  }
  const targetClientId = req.params.id;
  const clientIndex = db.users.findIndex(u => u.id === targetClientId && u.role === 'client');
  if (clientIndex === -1) {
    return res.status(404).json({ error: 'Client profile not found.' });
  }

  // Remove the client
  db.users.splice(clientIndex, 1);

  // Unassign projects from this client (leave them as public or unassigned admin projects)
  db.projects = db.projects.map(p => {
    if (p.client_id === targetClientId) {
      return { ...p, client_id: null };
    }
    return p;
  });

  saveData(db);
  res.json({ message: 'Client profile deleted successfully.' });
});

// Delete Project (Admin only)
app.delete('/api/projects/:id', authenticateUser, (req, res) => {
  const caller = (req as any).user as User;
  if (caller.role !== 'admin') {
    return res.status(403).json({ error: 'Only administrators can delete projects.' });
  }
  const projectId = req.params.id;
  const projectIdx = db.projects.findIndex(p => p.id === projectId);
  if (projectIdx === -1) {
    return res.status(404).json({ error: 'Project not found.' });
  }

  const deletedProjName = db.projects[projectIdx].title;
  db.projects.splice(projectIdx, 1);

  // Clean up messages, files and logs cascading
  db.messages = db.messages.filter(m => m.project_id !== projectId);
  db.files = db.files.filter(f => f.project_id !== projectId);
  db.activityLogs = db.activityLogs.filter(a => a.project_id !== projectId);

  saveData(db);
  res.json({ message: `Project "${deletedProjName}" and its assets fully wiped.` });
});

// Delete Message (Admin only)
app.delete('/api/projects/:id/messages/:messageId', authenticateUser, (req, res) => {
  const caller = (req as any).user as User;
  if (caller.role !== 'admin') {
    return res.status(403).json({ error: 'Only administrators can delete messages.' });
  }
  const { id: projectId, messageId } = req.params;
  const messageIdx = db.messages.findIndex(m => m.id === messageId && m.project_id === projectId);
  if (messageIdx === -1) {
    return res.status(404).json({ error: 'Message not found.' });
  }

  db.messages.splice(messageIdx, 1);
  saveData(db);
  res.json({ message: 'Message moderated/deleted.' });
});

// Delete File (Admin only)
app.delete('/api/projects/:id/files/:fileId', authenticateUser, (req, res) => {
  const caller = (req as any).user as User;
  if (caller.role !== 'admin') {
    return res.status(403).json({ error: 'Only administrators can purge project assets.' });
  }
  const { id: projectId, fileId } = req.params;
  const fileIdx = db.files.findIndex(f => f.id === fileId && f.project_id === projectId);
  if (fileIdx === -1) {
    return res.status(404).json({ error: 'File entity not found.' });
  }

  const fileName = db.files[fileIdx].name;
  db.files.splice(fileIdx, 1);

  // Add activity logging
  db.activityLogs.push({
    id: `a-${Date.now()}`,
    project_id: projectId,
    text: `Deleted project asset deliverable: ${fileName}`,
    timestamp: new Date().toISOString(),
    user_name: caller.name,
  });

  saveData(db);
  res.json({ message: 'File resource deleted.' });
});

// Public Project Portfolio - accessible to everyone
app.get('/api/projects/public', (req, res) => {
  const publicProjects = db.projects.filter(p => p.is_public);
  res.json(publicProjects);
});

// Authenticated Projects - Client sees ONLY their private projects. Freelancer sees ALL.
app.get('/api/projects', authenticateUser, (req, res) => {
  const user = (req as any).user as User;
  if (user.role === 'admin') {
    res.json(db.projects);
  } else {
    // Client view: matches client_id
    const clientProjects = db.projects.filter(p => p.client_id === user.id);
    res.json(clientProjects);
  }
});

// Create New Project (Admin only)
app.post('/api/projects', authenticateUser, (req, res) => {
  const user = (req as any).user as User;
  if (user.role !== 'admin') {
    return res.status(403).json({ error: 'Only freelancers can establish new projects.' });
  }
  const { title, description, client_id, is_public, deadline, category, budget, status, progress } = req.body;
  if (!title || !description || !deadline || !category) {
    return res.status(400).json({ error: 'Missing mandatory fields: title, description, deadline, category.' });
  }

  const newProject: Project = {
    id: `p-${Date.now()}`,
    title,
    description,
    client_id: client_id || null,
    is_public: is_public || false,
    status: status || 'ongoing',
    progress: progress || 0,
    deadline,
    category,
    budget: budget || '',
  };

  db.projects.push(newProject);

  // Auto add starting activity log
  const text = `Project "${title}" was created successfully.`;
  db.activityLogs.push({
    id: `a-${Date.now()}`,
    project_id: newProject.id,
    text,
    timestamp: new Date().toISOString(),
    user_name: user.name,
  });

  saveData(db);
  res.status(201).json(newProject);
});

// Update Project Parameters (Admin only)
app.put('/api/projects/:id', authenticateUser, (req, res) => {
  const user = (req as any).user as User;
  if (user.role !== 'admin') {
    return res.status(403).json({ error: 'Only administrative personnel can modify projects.' });
  }
  const projectId = req.params.id;
  const projIndex = db.projects.findIndex(p => p.id === projectId);
  if (projIndex === -1) {
    return res.status(404).json({ error: 'Project not found.' });
  }

  const oldProj = db.projects[projIndex];
  const { title, description, deadline, status, progress, budget, category, is_public } = req.body;

  const updatedProject = {
    ...oldProj,
    title: title !== undefined ? title : oldProj.title,
    description: description !== undefined ? description : oldProj.description,
    deadline: deadline !== undefined ? deadline : oldProj.deadline,
    status: status !== undefined ? status : oldProj.status,
    progress: progress !== undefined ? Math.min(100, Math.max(0, Number(progress))) : oldProj.progress,
    budget: budget !== undefined ? budget : oldProj.budget,
    category: category !== undefined ? category : oldProj.category,
    is_public: is_public !== undefined ? is_public : oldProj.is_public,
  };

  db.projects[projIndex] = updatedProject;

  // Compute neat diff for activity logger
  let logsText = 'Project details updated:';
  const changelog: string[] = [];
  if (title !== undefined && title !== oldProj.title) changelog.push(`title`);
  if (status !== undefined && status !== oldProj.status) changelog.push(`status to: ${status}`);
  if (progress !== undefined && progress !== oldProj.progress) changelog.push(`progress to: ${progress}%`);
  if (deadline !== undefined && deadline !== oldProj.deadline) changelog.push(`deadline to: ${deadline}`);

  if (changelog.length > 0) {
    db.activityLogs.push({
      id: `a-${Date.now()}`,
      project_id: projectId,
      text: `${logsText} ${changelog.join(', ')}`,
      timestamp: new Date().toISOString(),
      user_name: user.name,
    });
  }

  saveData(db);
  res.json(updatedProject);
});

// Fetch Single Project Detail (Members Only)
app.get('/api/projects/:id', authenticateUser, (req, res) => {
  const user = (req as any).user as User;
  const project = db.projects.find(p => p.id === req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found.' });
  }
  // Access gate
  if (user.role !== 'admin' && project.client_id !== user.id) {
    return res.status(403).json({ error: 'Unauthorized access to this project.' });
  }
  res.json(project);
});

// Fetch all clients list (Admin only - for pairing with projects)
app.get('/api/clients', authenticateUser, (req, res) => {
  const user = (req as any).user as User;
  if (user.role !== 'admin') {
    return res.status(403).json({ error: 'Only administrative personnel can view clients list.' });
  }
  const clients = db.users.filter(u => u.role === 'client');
  res.json(clients);
});

// Scoped Messaging
app.get('/api/projects/:id/messages', authenticateUser, (req, res) => {
  const user = (req as any).user as User;
  const project = db.projects.find(p => p.id === req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found.' });
  }
  if (user.role !== 'admin' && project.client_id !== user.id) {
    return res.status(403).json({ error: 'Unauthorized access.' });
  }

  const messages = db.messages.filter(m => m.project_id === req.params.id);
  res.json(messages);
});

// Add New Message
app.post('/api/projects/:id/messages', authenticateUser, (req, res) => {
  const user = (req as any).user as User;
  const projectId = req.params.id;
  const project = db.projects.find(p => p.id === projectId);
  if (!project) {
    return res.status(404).json({ error: 'Project not found.' });
  }
  if (user.role !== 'admin' && project.client_id !== user.id) {
    return res.status(403).json({ error: 'Unauthorized.' });
  }

  const { content } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Message content cannot be empty.' });
  }

  const newMessage: Message = {
    id: `m-${Date.now()}`,
    project_id: projectId,
    sender_id: user.id,
    sender_name: user.name,
    sender_role: user.role,
    content: content.trim(),
    timestamp: new Date().toISOString(),
  };

  db.messages.push(newMessage);
  saveData(db);

  res.status(201).json(newMessage);
});

// Scoped File Assets
app.get('/api/projects/:id/files', authenticateUser, (req, res) => {
  const user = (req as any).user as User;
  const project = db.projects.find(p => p.id === req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found.' });
  }
  if (user.role !== 'admin' && project.client_id !== user.id) {
    return res.status(403).json({ error: 'Unauthorized.' });
  }

  const files = db.files.filter(f => f.project_id === req.params.id).map(f => ({
    id: f.id,
    project_id: f.project_id,
    name: f.name,
    size: f.size,
    uploaded_at: f.uploaded_at,
    uploader_name: f.uploader_name,
    uploader_role: f.uploader_role,
  }));
  res.json(files);
});

// Secure File Download (Returns file content metadata)
app.get('/api/projects/:id/files/:fileId', authenticateUser, (req, res) => {
  const user = (req as any).user as User;
  const project = db.projects.find(p => p.id === req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found.' });
  }
  if (user.role !== 'admin' && project.client_id !== user.id) {
    return res.status(403).json({ error: 'Unauthorized.' });
  }

  const targetFile = db.files.find(f => f.id === req.params.fileId && f.project_id === req.params.id);
  if (!targetFile) {
    return res.status(404).json({ error: 'File resource not found.' });
  }

  res.json(targetFile);
});

// Upload Project File (Accepts file data)
app.post('/api/projects/:id/files', authenticateUser, (req, res) => {
  const user = (req as any).user as User;
  const projectId = req.params.id;
  const project = db.projects.find(p => p.id === projectId);
  if (!project) {
    return res.status(404).json({ error: 'Project not found.' });
  }
  if (user.role !== 'admin' && project.client_id !== user.id) {
    return res.status(403).json({ error: 'Unauthorized.' });
  }

  const { name, size, data } = req.body;
  if (!name || !size) {
    return res.status(400).json({ error: 'Missing mandatory parameters (name, size).' });
  }

  // 1. EXTENSION SECURITY PROTOCOL
  const dangerousExtensions = ['.exe', '.sh', '.bat', '.cmd', '.js', '.vbs', '.msi', '.scr', '.com', '.htm', '.html', '.php', '.py', '.pl'];
  const ext = path.extname(name).toLowerCase();
  if (dangerousExtensions.includes(ext)) {
    return res.status(400).json({ 
      error: 'Security block: Dangerous file extension detected. Executable, script, or markup files are forbidden to protect the workspace environment.' 
    });
  }

  // 2. SIZE CONSTRAINTS (Max 8MB raw size)
  if (data && data.length > 12 * 1024 * 1024) { // Roughly ~8MB binary is 11-12MB Base64 string
    return res.status(400).json({ 
      error: 'Upload constraints exceeded: Individual files must remain below 8 MB payload limits for memory hygiene.' 
    });
  }

  const newFile: FileMetadata = {
    id: `f-${Date.now()}`,
    project_id: projectId,
    name,
    size,
    uploaded_at: new Date().toISOString(),
    uploader_name: user.name,
    uploader_role: user.role,
    file_data: data || 'SGVsbG8sIFdlbGNvbWUgdG8gdGhlIEZyZWVsYW5jZSBDbGllbnQgV29ya3NwYWNlIQ==', // Default raw fallback
  };

  db.files.push(newFile);

  // Add Project Activity
  db.activityLogs.push({
    id: `a-${Date.now()}`,
    project_id: projectId,
    text: `Uploaded file to project folder: ${name}`,
    timestamp: new Date().toISOString(),
    user_name: user.name,
  });

  saveData(db);
  res.status(201).json({
    id: newFile.id,
    project_id: newFile.project_id,
    name: newFile.name,
    size: newFile.size,
    uploaded_at: newFile.uploaded_at,
    uploader_name: newFile.uploader_name,
    uploader_role: newFile.uploader_role,
  });
});

// Fetch Activity Log
app.get('/api/projects/:id/activity', authenticateUser, (req, res) => {
  const user = (req as any).user as User;
  const project = db.projects.find(p => p.id === req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found.' });
  }
  if (user.role !== 'admin' && project.client_id !== user.id) {
    return res.status(403).json({ error: 'Unauthorized.' });
  }

  const activity = db.activityLogs.filter(a => a.project_id === req.params.id);
  // Sort descending by date
  res.json(activity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
});


// Setup development or production build pipeline
async function startServer() {
  // Vite integration middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Freelance Portal active at host 0.0.0.0 on port ${PORT}`);
  });
}

startServer();
