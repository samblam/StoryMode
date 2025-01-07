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
      survey_responses: {
        Row: {
          id: string;
          created_at: string;
          survey_id: string;
          participant_id: string;
          status: 'started' | 'completed' | 'abandoned';
          success_rate: number | null;
          time_taken: number | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          survey_id: string;
          participant_id: string;
          status?: 'started' | 'completed' | 'abandoned';
          success_rate?: number | null;
          time_taken?: number | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          survey_id?: string;
          participant_id?: string;
          status?: 'started' | 'completed' | 'abandoned';
          success_rate?: number | null;
          time_taken?: number | null;
        };
      };
      sound_matches: {
        Row: {
          id: string;
          created_at: string;
          response_id: string;
          sound_id: string;
          function_id: string;
          is_correct: boolean;
        };
        Insert: {
          id?: string;
          created_at?: string;
          response_id: string;
          sound_id: string;
          function_id: string;
          is_correct: boolean;
        };
        Update: {
          id?: string;
          created_at?: string;
          response_id?: string;
          sound_id?: string;
          function_id?: string;
          is_correct?: boolean;
        };
      };
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
      surveys: {
        Row: {
          id: string;
          created_at: string;
          title: string;
          description: string | null;
          client_id: string;
          sound_profile_id: string;
          status: 'draft' | 'active' | 'completed';
        };
        Insert: {
          id?: string;
          created_at?: string;
          title: string;
          description?: string | null;
          client_id: string;
          sound_profile_id: string;
          status?: 'draft' | 'active' | 'completed';
        };
        Update: {
          id?: string;
          created_at?: string;
          title?: string;
          description?: string | null;
          client_id?: string;
          sound_profile_id?: string;
          status?: 'draft' | 'active' | 'completed';
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

// Survey table types
export type SoundMatch = Database['public']['Tables']['sound_matches']['Row'];

// Base survey response type from database
export type BaseSurveyResponse = Database['public']['Tables']['survey_responses']['Row'];

// Extended survey response type for analytics
export interface SurveyResponse extends BaseSurveyResponse {
  sound_matches?: SoundMatch[];
  // Derived properties for analytics
  is_success?: boolean;
  is_complete?: boolean;
  chosen_sound?: string;
  expected_sound?: string;
  score?: number;
}

export type Survey = Database['public']['Tables']['surveys']['Row'] & {
  sound_profiles?: Database['public']['Tables']['sound_profiles']['Row'] | null;
  survey_responses?: SurveyResponse[];
};

export type SurveyWithRelations = Survey & {
  clients?: Database['public']['Tables']['clients']['Row'] | null;
};