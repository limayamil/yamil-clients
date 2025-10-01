export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      activity_log: {
        Row: {
          id: string;
          project_id: string | null;
          actor_type: 'provider' | 'client' | 'system';
          action: string;
          details: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id?: string | null;
          actor_type: 'provider' | 'client' | 'system';
          action: string;
          details?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string | null;
          actor_type?: 'provider' | 'client' | 'system';
          action?: string;
          details?: Json | null;
          created_at?: string;
        };
      };
      approvals: {
        Row: {
          id: string;
          project_id: string;
          stage_id: string | null;
          component_id: string | null;
          requested_by: 'provider' | 'client';
          requested_at: string;
          approved_by: string | null;
          approved_at: string | null;
          status: 'requested' | 'approved' | 'changes_requested';
        };
        Insert: {
          id?: string;
          project_id: string;
          stage_id?: string | null;
          component_id?: string | null;
          requested_by: 'provider' | 'client';
          requested_at?: string;
          approved_by?: string | null;
          approved_at?: string | null;
          status?: 'requested' | 'approved' | 'changes_requested';
        };
        Update: {
          id?: string;
          project_id?: string;
          stage_id?: string | null;
          component_id?: string | null;
          requested_by?: 'provider' | 'client';
          requested_at?: string;
          approved_by?: string | null;
          approved_at?: string | null;
          status?: 'requested' | 'approved' | 'changes_requested';
        };
      };
      clients: {
        Row: {
          id: string;
          organization_id: string | null;
          name: string;
          email: string;
          company: string | null;
          phone: string | null;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id?: string | null;
          name: string;
          email: string;
          company?: string | null;
          phone?: string | null;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string | null;
          name?: string;
          email?: string;
          company?: string | null;
          phone?: string | null;
          active?: boolean;
          created_at?: string;
        };
      };
      comments: {
        Row: {
          id: string;
          project_id: string;
          stage_id: string | null;
          component_id: string | null;
          author_type: 'provider' | 'client';
          body: string;
          created_at: string;
          mentions: Json | null;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          stage_id?: string | null;
          component_id?: string | null;
          author_type: 'provider' | 'client';
          body: string;
          created_at?: string;
          mentions?: Json | null;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          project_id?: string;
          stage_id?: string | null;
          component_id?: string | null;
          author_type?: 'provider' | 'client';
          body?: string;
          created_at?: string;
          mentions?: Json | null;
          created_by?: string | null;
        };
      };
      files: {
        Row: {
          id: string;
          project_id: string;
          stage_id: string | null;
          uploader_type: 'provider' | 'client';
          storage_path: string;
          file_name: string;
          mime: string | null;
          size: number | null;
          uploaded_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          stage_id?: string | null;
          uploader_type: 'provider' | 'client';
          storage_path: string;
          file_name: string;
          mime?: string | null;
          size?: number | null;
          uploaded_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          project_id?: string;
          stage_id?: string | null;
          uploader_type?: 'provider' | 'client';
          storage_path?: string;
          file_name?: string;
          mime?: string | null;
          size?: number | null;
          uploaded_at?: string;
          created_by?: string | null;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_email: string;
          project_id: string;
          type: 'material_request' | 'comment' | 'approval' | 'stage_completed' | 'deadline';
          payload: Json;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_email: string;
          project_id: string;
          type: 'material_request' | 'comment' | 'approval' | 'stage_completed' | 'deadline';
          payload?: Json;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_email?: string;
          project_id?: string;
          type?: 'material_request' | 'comment' | 'approval' | 'stage_completed' | 'deadline';
          payload?: Json;
          read_at?: string | null;
          created_at?: string;
        };
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string | null;
          created_at?: string;
        };
      };
      project_members: {
        Row: {
          id: string;
          project_id: string;
          email: string;
          role: 'client_viewer' | 'client_editor';
          invited_at: string | null;
          accepted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          email: string;
          role?: 'client_viewer' | 'client_editor';
          invited_at?: string | null;
          accepted_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          email?: string;
          role?: 'client_viewer' | 'client_editor';
          invited_at?: string | null;
          accepted_at?: string | null;
          created_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          organization_id: string | null;
          client_id: string;
          title: string;
          description: string | null;
          status: 'planned' | 'in_progress' | 'on_hold' | 'done' | 'archived';
          start_date: string | null;
          end_date: string | null;
          deadline: string | null;
          budget_amount: number | null;
          visibility_settings: Json;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id?: string | null;
          client_id: string;
          title: string;
          description?: string | null;
          status?: 'planned' | 'in_progress' | 'on_hold' | 'done' | 'archived';
          start_date?: string | null;
          end_date?: string | null;
          deadline?: string | null;
          budget_amount?: number | null;
          visibility_settings?: Json;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string | null;
          client_id?: string;
          title?: string;
          description?: string | null;
          status?: 'planned' | 'in_progress' | 'on_hold' | 'done' | 'archived';
          start_date?: string | null;
          end_date?: string | null;
          deadline?: string | null;
          budget_amount?: number | null;
          visibility_settings?: Json;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      settings: {
        Row: {
          id: string;
          key: string;
          value: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          value: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          key?: string;
          value?: Json;
          created_at?: string;
        };
      };
      stage_components: {
        Row: {
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
          config: Json;
          status: 'todo' | 'waiting_client' | 'in_review' | 'approved' | 'blocked' | 'done';
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
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
          config?: Json;
          status?: 'todo' | 'waiting_client' | 'in_review' | 'approved' | 'blocked' | 'done';
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          stage_id?: string;
          component_type?:
            | 'upload_request'
            | 'checklist'
            | 'prototype'
            | 'approval'
            | 'text_block'
            | 'form'
            | 'link'
            | 'milestone'
            | 'tasklist';
          config?: Json;
          status?: 'todo' | 'waiting_client' | 'in_review' | 'approved' | 'blocked' | 'done';
          metadata?: Json | null;
          created_at?: string;
        };
      };
      stages: {
        Row: {
          id: string;
          project_id: string;
          title: string;
          description: string | null;
          order: number;
          type: 'intake' | 'materials' | 'design' | 'development' | 'review' | 'handoff' | 'custom';
          status: 'todo' | 'waiting_client' | 'in_review' | 'approved' | 'blocked' | 'done';
          planned_start: string | null;
          planned_end: string | null;
          deadline: string | null;
          completion_at: string | null;
          completion_note: string | null;
          owner: 'provider' | 'client';
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          title: string;
          description?: string | null;
          order: number;
          type?: 'intake' | 'materials' | 'design' | 'development' | 'review' | 'handoff' | 'custom';
          status?: 'todo' | 'waiting_client' | 'in_review' | 'approved' | 'blocked' | 'done';
          planned_start?: string | null;
          planned_end?: string | null;
          deadline?: string | null;
          completion_at?: string | null;
          completion_note?: string | null;
          owner?: 'provider' | 'client';
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          title?: string;
          description?: string | null;
          order?: number;
          type?: 'intake' | 'materials' | 'design' | 'development' | 'review' | 'handoff' | 'custom';
          status?: 'todo' | 'waiting_client' | 'in_review' | 'approved' | 'blocked' | 'done';
          planned_start?: string | null;
          planned_end?: string | null;
          deadline?: string | null;
          completion_at?: string | null;
          completion_note?: string | null;
          owner?: 'provider' | 'client';
          created_at?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          stage_id: string;
          title: string;
          description: string | null;
          assignee_type: 'provider' | 'client';
          status: 'todo' | 'waiting_client' | 'in_review' | 'approved' | 'blocked' | 'done';
          due_date: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          stage_id: string;
          title: string;
          description?: string | null;
          assignee_type: 'provider' | 'client';
          status?: 'todo' | 'waiting_client' | 'in_review' | 'approved' | 'blocked' | 'done';
          due_date?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          stage_id?: string;
          title?: string;
          description?: string | null;
          assignee_type?: 'provider' | 'client';
          status?: 'todo' | 'waiting_client' | 'in_review' | 'approved' | 'blocked' | 'done';
          due_date?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      project_member_emails: {
        Row: {
          project_id: string | null;
          email: string | null;
        };
      };
    };
    Functions: {
      client_project_detail: {
        Args: {
          project_id_input: string;
          client_email: string;
        };
        Returns: Json;
      };
      client_projects_overview: {
        Args: {
          client_email: string;
        };
        Returns: {
          id: string;
          title: string;
          status: Database['public']['Tables']['projects']['Row']['status'];
          next_action: string | null;
          pending_items: number | null;
          deadline: string | null;
          progress: number | null;
        }[];
      };
      complete_stage_and_move_next: {
        Args: {
          stage_id_input: string;
        };
        Returns: undefined;
      };
      create_project_from_template: {
        Args: {
          template_slug: string;
          client_id_input: string;
          title_input: string;
          description_input: string;
          deadline_input: string;
          created_by_input: string;
        };
        Returns: string;
      };
      provider_dashboard_projects: {
        Args: {
          provider_id: string;
        };
        Returns: {
          id: string;
          title: string;
          description: string | null;
          status: Database['public']['Tables']['projects']['Row']['status'];
          client_name: string | null;
          deadline: string | null;
          start_date: string | null;
          end_date: string | null;
          progress: number | null;
          stages: Json | null;
          overdue: boolean | null;
          waiting_on_client: boolean | null;
        }[];
      };
      provider_project_detail: {
        Args: {
          project_id_input: string;
        };
        Returns: Json;
      };
      request_materials_for_project: {
        Args: {
          project_id_input: string;
        };
        Returns: undefined;
      };
      request_stage_approval: {
        Args: {
          project_id_input: string;
          stage_id_input: string | null;
        };
        Returns: undefined;
      };
    };
    Enums: {
      actor_type: 'provider' | 'client' | 'system';
      approval_status: 'requested' | 'approved' | 'changes_requested';
      assignee_type: 'provider' | 'client';
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
      member_role: 'client_viewer' | 'client_editor';
      notification_type: 'material_request' | 'comment' | 'approval' | 'stage_completed' | 'deadline';
      project_status: 'planned' | 'in_progress' | 'on_hold' | 'done' | 'archived';
      stage_owner: 'provider' | 'client';
      stage_status: 'todo' | 'waiting_client' | 'in_review' | 'approved' | 'blocked' | 'done';
      stage_type: 'intake' | 'materials' | 'design' | 'development' | 'review' | 'handoff' | 'custom';
    };
  };
}
