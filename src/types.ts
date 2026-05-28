export type UserRole = 'admin' | 'client';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  company?: string;
}

export type ProjectStatus = 'active' | 'paused' | 'completed' | 'ongoing';

export interface Project {
  id: string;
  title: string;
  description: string;
  client_id: string | null; // null represents public-only portfolio projects
  is_public: boolean;
  status: ProjectStatus;
  progress: number; // 0 to 100
  deadline: string;
  category: string;
  budget?: string;
  preview_image?: string;
}

export interface Message {
  id: string;
  project_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: UserRole;
  content: string;
  timestamp: string;
}

export interface FileMetadata {
  id: string;
  project_id: string;
  name: string;
  size: string;
  uploaded_at: string;
  uploader_name: string;
  uploader_role: UserRole;
  url?: string;
  file_data?: string; // Base64 data if saved locally
}

export interface ActivityLog {
  id: string;
  project_id: string;
  text: string;
  timestamp: string;
  user_name: string;
}
