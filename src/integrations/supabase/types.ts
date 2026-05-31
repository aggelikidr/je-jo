export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      apartments: {
        Row: {
          id: string
          household_id: string
          title: string
          area: string
          price: number
          sqm: number
          floor: number
          rooms: number
          year: number
          heat: string
          source: string
          url: string
          photo: { hue: number; label: string; imageUrl?: string }
          status: string
          visit_date: string | null
          reactions: { p1?: string; p2?: string }
          notes: { who: string; text: string; at: number }[]
          tags: string[]
          created_at: string
        }
        Insert: {
          id?: string
          household_id: string
          title: string
          area?: string
          price?: number
          sqm?: number
          floor?: number
          rooms?: number
          year?: number
          heat?: string
          source?: string
          url?: string
          photo?: { hue: number; label: string; imageUrl?: string }
          status?: string
          visit_date?: string | null
          reactions?: { p1?: string; p2?: string }
          notes?: { who: string; text: string; at: number }[]
          tags?: string[]
          created_at?: string
        }
        Update: {
          id?: string
          household_id?: string
          title?: string
          area?: string
          price?: number
          sqm?: number
          floor?: number
          rooms?: number
          year?: number
          heat?: string
          source?: string
          url?: string
          photo?: { hue: number; label: string; imageUrl?: string }
          status?: string
          visit_date?: string | null
          reactions?: { p1?: string; p2?: string }
          notes?: { who: string; text: string; at: number }[]
          tags?: string[]
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "apartments_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      hub_mood: {
        Row: {
          id: string
          household_id: string
          text: string
          who: string
          at: number
          updated_at: string
        }
        Insert: {
          id?: string
          household_id: string
          text?: string
          who?: string
          at?: number
          updated_at?: string
        }
        Update: {
          id?: string
          household_id?: string
          text?: string
          who?: string
          at?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hub_mood_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: true
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      furniture_items: {
        Row: {
          added_by: string
          created_at: string
          household_id: string
          id: string
          name: string
          note: string | null
          room: string
          status: string
        }
        Insert: {
          added_by: string
          created_at?: string
          household_id: string
          id?: string
          name: string
          note?: string | null
          room: string
          status?: string
        }
        Update: {
          added_by?: string
          created_at?: string
          household_id?: string
          id?: string
          name?: string
          note?: string | null
          room?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "furniture_items_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      households: {
        Row: {
          code: string
          created_at: string
          id: string
          setup: Json
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          setup?: Json
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          setup?: Json
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          added_by: string
          category: string
          completed_by: string | null
          created_at: string
          due_date: string | null
          household_id: string
          id: string
          name: string
          status: string
        }
        Insert: {
          added_by: string
          category: string
          completed_by?: string | null
          created_at?: string
          due_date?: string | null
          household_id: string
          id?: string
          name: string
          status?: string
        }
        Update: {
          added_by?: string
          category?: string
          completed_by?: string | null
          created_at?: string
          due_date?: string | null
          household_id?: string
          id?: string
          name?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      wish_links: {
        Row: {
          added_by: string
          created_at: string
          id: string
          item_id: string
          label: string | null
          price: number | null
          reactions: Json
          url: string
        }
        Insert: {
          added_by: string
          created_at?: string
          id?: string
          item_id: string
          label?: string | null
          price?: number | null
          reactions?: Json
          url: string
        }
        Update: {
          added_by?: string
          created_at?: string
          id?: string
          item_id?: string
          label?: string | null
          price?: number | null
          reactions?: Json
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "wish_links_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "furniture_items"
            referencedColumns: ["id"]
          },
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
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
