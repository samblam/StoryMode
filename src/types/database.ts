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
      clients: {
        Row: {
          id: string;
          created_at: string;
          name: string;
          company: string | null;
          email: string;
          active: boolean;
        };
        Insert: {
          id?: string;
          created_at?: string;
          name: string;
          company?: string | null;
          email: string;
          active?: boolean;
        };
        Update: {
          id?: string;
          created_at?: string;
          name?: string;
          company?: string | null;
          email?: string;
          active?: boolean;
        };
      };
      users: {
        Row: {
          id: string;
          created_at: string;
          role: 'admin' | 'client';
          client_id: string | null;
          email: string;
        };
        Insert: {
          id: string;
          created_at?: string;
          role: 'admin' | 'client';
          client_id?: string | null;
          email: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          role?: 'admin' | 'client';
          client_id?: string | null;
          email?: string;
        };
      };
      sound_profiles: {
        Row: {
          id: string;
          created_at: string;
          title: string;
          description: string;
          slug: string;
          client_id: string | null;
          is_template: boolean;
        };
        Insert: {
          id?: string;
          created_at?: string;
          title: string;
          description: string;
          slug: string;
          client_id?: string | null;
          is_template?: boolean;
        };
        Update: {
          id?: string;
          created_at?: string;
          title?: string;
          description?: string;
          slug?: string;
          client_id?: string | null;
          is_template?: boolean;
        };
      };
      sounds: {
        Row: {
          id: string;
          created_at: string;
          name: string;
          description: string;
          file_path: string;
          storage_path: string;
          profile_id: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          name: string;
          description: string;
          file_path: string;
          storage_path: string;
          profile_id: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          name?: string;
          description?: string;
          file_path?: string;
          storage_path?: string;
          profile_id?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: 'admin' | 'client';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Helper types for common join queries
export type UserWithClient = Database['public']['Tables']['users']['Row'] & {
  clients?: Database['public']['Tables']['clients']['Row'] | null;
};

export type SoundProfileWithSounds = Database['public']['Tables']['sound_profiles']['Row'] & {
  sounds: Database['public']['Tables']['sounds']['Row'][];
};

export type ClientWithUsers = Database['public']['Tables']['clients']['Row'] & {
  users: Database['public']['Tables']['users']['Row'][];
};