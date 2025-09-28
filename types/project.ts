export type ProjectStatus = 'planned' | 'in_progress' | 'on_hold' | 'done' | 'archived';
export type StageType = 'intake' | 'materials' | 'design' | 'development' | 'review' | 'handoff' | 'custom';
export type StageStatus = 'todo' | 'waiting_client' | 'in_review' | 'approved' | 'blocked' | 'done';
export type StageOwner = 'provider' | 'client';

export interface StageComponent {
  id: string;
  stage_id: string;
  component_type:
    | 'upload_request'
    | 'checklist'
    | 'prototype'
    | 'approval'
    | 'text_block'
    | 'form'
    | 'link'
    | 'milestone'
    | 'tasklist';
  title?: string | null;
  config: Record<string, unknown>;
  status: StageStatus;
  metadata?: Record<string, unknown> | null;
}

export interface Stage {
  id: string;
  project_id: string;
  title: string;
  description?: string | null;
  order: number;
  type: StageType;
  status: StageStatus;
  planned_start?: string | null;
  planned_end?: string | null;
  deadline?: string | null;
  completion_at?: string | null;
  owner: StageOwner;
  components?: StageComponent[];
}

export interface ProjectMember {
  id: string;
  email: string;
  role: 'client_viewer' | 'client_editor';
  invited_at?: string | null;
  accepted_at?: string | null;
  created_at: string;
}

export interface FileEntry {
  id: string;
  project_id: string;
  stage_id?: string | null;
  uploader_type: 'provider' | 'client';
  storage_path: string;
  file_name: string;
  mime?: string | null;
  size?: number | null;
  uploaded_at: string;
  created_by?: string | null;
}

export interface CommentEntry {
  id: string;
  project_id: string;
  stage_id?: string | null;
  component_id?: string | null;
  author_type: 'provider' | 'client';
  body: string;
  created_at: string;
  created_by?: string | null;
  mentions?: Record<string, unknown> | null;
}

export interface ApprovalEntry {
  id: string;
  stage_id?: string | null;
  component_id?: string | null;
  requested_by: 'provider' | 'client';
  requested_at: string;
  approved_by?: string | null;
  approved_at?: string | null;
  status: 'requested' | 'approved' | 'changes_requested';
}

export interface ActivityEntry {
  id: string;
  project_id: string;
  actor_type: 'provider' | 'client' | 'system';
  action: string;
  details?: Record<string, unknown> | null;
  created_at: string;
}

export interface ProjectLinkEntry {
  id: string;
  project_id: string;
  title: string;
  url: string;
  created_by?: string | null;
  created_at: string;
}

export interface ProjectMinuteEntry {
  id: string;
  project_id: string;
  stage_id?: string | null;
  title?: string | null;
  meeting_date: string;
  content_markdown: string;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectSummary {
  id: string;
  title: string;
  description?: string | null;
  status: ProjectStatus;
  client_name: string;
  provider_name?: string;
  deadline?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  progress: number;
  stages?: Stage[];
  overdue: boolean;
  waiting_on_client: boolean;
  members?: ProjectMember[];
  files?: FileEntry[];
  comments?: CommentEntry[];
  approvals?: ApprovalEntry[];
  activity?: ActivityEntry[];
  links?: ProjectLinkEntry[];
  minutes?: ProjectMinuteEntry[];
  project_members?: ProjectMember[];
}

export interface ClientProjectCard {
  id: string;
  title: string;
  status: ProjectStatus;
  next_action?: string | null;
  pending_items: number;
  deadline?: string | null;
  progress: number;
}
