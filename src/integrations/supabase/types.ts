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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      analytics_access: {
        Row: {
          accessed_at: string
          id: string
          page_visited: string | null
          session_time: number | null
          user_id: string
        }
        Insert: {
          accessed_at?: string
          id?: string
          page_visited?: string | null
          session_time?: number | null
          user_id: string
        }
        Update: {
          accessed_at?: string
          id?: string
          page_visited?: string | null
          session_time?: number | null
          user_id?: string
        }
        Relationships: []
      }
      banks_accounts: {
        Row: {
          annual_fee: number | null
          card_limit: number | null
          created_at: string
          id: string
          interest_rate: number | null
          name: string
          other_fees: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          annual_fee?: number | null
          card_limit?: number | null
          created_at?: string
          id?: string
          interest_rate?: number | null
          name: string
          other_fees?: string | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          annual_fee?: number | null
          card_limit?: number | null
          created_at?: string
          id?: string
          interest_rate?: number | null
          name?: string
          other_fees?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contents: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          module_id: string | null
          order_index: number
          title: string
          type: Database["public"]["Enums"]["content_type"]
          url: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          module_id?: string | null
          order_index: number
          title: string
          type: Database["public"]["Enums"]["content_type"]
          url?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          module_id?: string | null
          order_index?: number
          title?: string
          type?: Database["public"]["Enums"]["content_type"]
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contents_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      debts_payable: {
        Row: {
          amount: number
          created_at: string
          creditor_name: string
          description: string | null
          due_date: string
          id: string
          paid_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          creditor_name: string
          description?: string | null
          due_date: string
          id?: string
          paid_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          creditor_name?: string
          description?: string | null
          due_date?: string
          id?: string
          paid_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      debts_receivable: {
        Row: {
          amount: number
          created_at: string
          debtor_name: string
          description: string | null
          due_date: string
          id: string
          received_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          debtor_name: string
          description?: string | null
          due_date: string
          id?: string
          received_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          debtor_name?: string
          description?: string | null
          due_date?: string
          id?: string
          received_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      finances: {
        Row: {
          category: string
          created_at: string | null
          date: string
          description: string | null
          id: string
          type: Database["public"]["Enums"]["finance_type"]
          user_id: string | null
          value: number
        }
        Insert: {
          category: string
          created_at?: string | null
          date: string
          description?: string | null
          id?: string
          type: Database["public"]["Enums"]["finance_type"]
          user_id?: string | null
          value: number
        }
        Update: {
          category?: string
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          type?: Database["public"]["Enums"]["finance_type"]
          user_id?: string | null
          value?: number
        }
        Relationships: []
      }
      goals: {
        Row: {
          created_at: string | null
          current_value: number | null
          deadline: string | null
          goal_name: string
          id: string
          status: string | null
          target_value: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          current_value?: number | null
          deadline?: string | null
          goal_name: string
          id?: string
          status?: string | null
          target_value: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          current_value?: number | null
          deadline?: string | null
          goal_name?: string
          id?: string
          status?: string | null
          target_value?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      investments_current: {
        Row: {
          created_at: string
          current_value: number
          estimated_rate: number | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_value?: number
          estimated_rate?: number | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_value?: number
          estimated_rate?: number | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      modules: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          order_index: number
          title: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          order_index: number
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          order_index?: number
          title?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          is_admin: boolean | null
          mercado_pago_payment_id: string | null
          payment_status: string | null
          phone: string | null
          profession: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          is_admin?: boolean | null
          mercado_pago_payment_id?: string | null
          payment_status?: string | null
          phone?: string | null
          profession?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_admin?: boolean | null
          mercado_pago_payment_id?: string | null
          payment_status?: string | null
          phone?: string | null
          profession?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      progress: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          content_id: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          content_id?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          content_id?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "progress_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
        ]
      }
      reduction_goals: {
        Row: {
          category: string
          created_at: string
          deadline: string | null
          id: string
          period_type: string
          status: string | null
          target_value: number
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          deadline?: string | null
          id?: string
          period_type: string
          status?: string | null
          target_value: number
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          deadline?: string | null
          id?: string
          period_type?: string
          status?: string | null
          target_value?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      weekly_tracking: {
        Row: {
          category: string
          created_at: string
          id: string
          reduction_goal_id: string | null
          total_spent: number
          user_id: string
          week_end: string
          week_start: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          reduction_goal_id?: string | null
          total_spent?: number
          user_id: string
          week_end: string
          week_start: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          reduction_goal_id?: string | null
          total_spent?: number
          user_id?: string
          week_end?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_tracking_reduction_goal_id_fkey"
            columns: ["reduction_goal_id"]
            isOneToOne: false
            referencedRelation: "reduction_goals"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      content_type: "video" | "pdf" | "exercise" | "checklist" | "extra"
      finance_type:
        | "income"
        | "fixed_expense"
        | "variable_expense"
        | "receivable"
        | "debt"
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
    Enums: {
      app_role: ["admin", "user"],
      content_type: ["video", "pdf", "exercise", "checklist", "extra"],
      finance_type: [
        "income",
        "fixed_expense",
        "variable_expense",
        "receivable",
        "debt",
      ],
    },
  },
} as const
