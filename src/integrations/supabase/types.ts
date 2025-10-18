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
      bank_statements: {
        Row: {
          bank_name: string
          created_at: string
          currency: string
          file_type: string
          file_url: string
          id: string
          net_cashflow: number | null
          processed_at: string | null
          statement_date_from: string
          statement_date_to: string
          status: string
          total_expenses: number | null
          total_income: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bank_name: string
          created_at?: string
          currency?: string
          file_type: string
          file_url: string
          id?: string
          net_cashflow?: number | null
          processed_at?: string | null
          statement_date_from: string
          statement_date_to: string
          status?: string
          total_expenses?: number | null
          total_income?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bank_name?: string
          created_at?: string
          currency?: string
          file_type?: string
          file_url?: string
          id?: string
          net_cashflow?: number | null
          processed_at?: string | null
          statement_date_from?: string
          statement_date_to?: string
          status?: string
          total_expenses?: number | null
          total_income?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          color: string
          created_at: string
          icon: string
          id: string
          name: string
          parent_category_id: string | null
        }
        Insert: {
          color: string
          created_at?: string
          icon: string
          id?: string
          name: string
          parent_category_id?: string | null
        }
        Update: {
          color?: string
          created_at?: string
          icon?: string
          id?: string
          name?: string
          parent_category_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_category_id_fkey"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      income_categories: {
        Row: {
          color: string
          created_at: string
          icon: string
          id: string
          name: string
        }
        Insert: {
          color: string
          created_at?: string
          icon: string
          id?: string
          name: string
        }
        Update: {
          color?: string
          created_at?: string
          icon?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      merchant_mappings: {
        Row: {
          category_id: string | null
          confidence: number
          created_at: string
          id: string
          merchant_pattern: string
        }
        Insert: {
          category_id?: string | null
          confidence?: number
          created_at?: string
          id?: string
          merchant_pattern: string
        }
        Update: {
          category_id?: string | null
          confidence?: number
          created_at?: string
          id?: string
          merchant_pattern?: string
        }
        Relationships: [
          {
            foreignKeyName: "merchant_mappings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      receipt_items: {
        Row: {
          category: string | null
          created_at: string
          id: string
          item_name: string
          quantity: number | null
          receipt_id: string
          total_price: number
          unit_price: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          item_name: string
          quantity?: number | null
          receipt_id: string
          total_price: number
          unit_price?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          item_name?: string
          quantity?: number | null
          receipt_id?: string
          total_price?: number
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "receipt_items_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "receipts"
            referencedColumns: ["id"]
          },
        ]
      }
      receipts: {
        Row: {
          created_at: string
          id: string
          image_url: string
          receipt_date: string | null
          store_name: string | null
          subtotal: number | null
          tax: number | null
          total: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          receipt_date?: string | null
          store_name?: string | null
          subtotal?: number | null
          tax?: number | null
          total?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          receipt_date?: string | null
          store_name?: string | null
          subtotal?: number | null
          tax?: number | null
          total?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      statements: {
        Row: {
          card_number: string
          card_type: string | null
          created_at: string
          file_url: string
          id: string
          processed_at: string | null
          statement_date: string
          status: string
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          card_number: string
          card_type?: string | null
          created_at?: string
          file_url: string
          id?: string
          processed_at?: string | null
          statement_date: string
          status?: string
          total_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          card_number?: string
          card_type?: string | null
          created_at?: string
          file_url?: string
          id?: string
          processed_at?: string | null
          statement_date?: string
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount_ils: number
          bank_statement_id: string | null
          card_last_4: string | null
          category: string
          created_at: string
          description: string | null
          exchange_rate: number | null
          fee: number | null
          id: string
          merchant_name: string
          original_amount: number
          original_currency: string
          payment_date: string | null
          source_bank: string | null
          statement_id: string | null
          transaction_date: string
          transaction_direction: string | null
          transaction_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_ils: number
          bank_statement_id?: string | null
          card_last_4?: string | null
          category: string
          created_at?: string
          description?: string | null
          exchange_rate?: number | null
          fee?: number | null
          id?: string
          merchant_name: string
          original_amount: number
          original_currency: string
          payment_date?: string | null
          source_bank?: string | null
          statement_id?: string | null
          transaction_date: string
          transaction_direction?: string | null
          transaction_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_ils?: number
          bank_statement_id?: string | null
          card_last_4?: string | null
          category?: string
          created_at?: string
          description?: string | null
          exchange_rate?: number | null
          fee?: number | null
          id?: string
          merchant_name?: string
          original_amount?: number
          original_currency?: string
          payment_date?: string | null
          source_bank?: string | null
          statement_id?: string | null
          transaction_date?: string
          transaction_direction?: string | null
          transaction_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_bank_statement_id_fkey"
            columns: ["bank_statement_id"]
            isOneToOne: false
            referencedRelation: "bank_statements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_statement_id_fkey"
            columns: ["statement_id"]
            isOneToOne: false
            referencedRelation: "statements"
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
