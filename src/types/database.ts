export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      sound_profiles: {
        Row: {
          id: string
          created_at: string
          title: string
          description: string
          slug: string
        }
        Insert: {
          id?: string
          created_at?: string
          title: string
          description: string
          slug: string
        }
        Update: {
          id?: string
          created_at?: string
          title?: string
          description?: string
          slug?: string
        }
      }
      sounds: {
        Row: {
          id: string
          created_at: string
          name: string
          description: string
          file_path: string
          profile_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          description: string
          file_path: string
          profile_id: string
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          description?: string
          file_path?: string
          profile_id?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}