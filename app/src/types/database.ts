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
      chapters: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          color: string | null
          icon: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          color?: string | null
          icon?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          color?: string | null
          icon?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapters_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      topics: {
        Row: {
          id: string
          chapter_id: string
          user_id: string
          title: string
          description: string | null
          order_index: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          chapter_id: string
          user_id: string
          title: string
          description?: string | null
          order_index?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          chapter_id?: string
          user_id?: string
          title?: string
          description?: string | null
          order_index?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "topics_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      study_items: {
        Row: {
          id: string
          topic_id: string
          user_id: string
          type: 'molecule' | 'enzyme' | 'medication'
          name: string
          description: string | null
          image_url: string | null
          structure_description: string | null
          mechanism_description: string | null
          uses: string | null
          effects: string | null
          pubchem_cid: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          topic_id: string
          user_id: string
          type: 'molecule' | 'enzyme' | 'medication'
          name: string
          description?: string | null
          image_url?: string | null
          structure_description?: string | null
          mechanism_description?: string | null
          uses?: string | null
          effects?: string | null
          pubchem_cid?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          topic_id?: string
          user_id?: string
          type?: 'molecule' | 'enzyme' | 'medication'
          name?: string
          description?: string | null
          image_url?: string | null
          structure_description?: string | null
          mechanism_description?: string | null
          uses?: string | null
          effects?: string | null
          pubchem_cid?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_items_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      item_type: 'molecule' | 'enzyme' | 'medication'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
