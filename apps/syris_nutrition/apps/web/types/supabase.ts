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
    PostgrestVersion: "14.1"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      daily_goals: {
        Row: {
          carbs_g_target: number | null
          effective_from: string
          fat_g_target: number | null
          id: string
          kcal_target: number
          protein_g_target: number | null
          user_id: string
        }
        Insert: {
          carbs_g_target?: number | null
          effective_from: string
          fat_g_target?: number | null
          id?: string
          kcal_target: number
          protein_g_target?: number | null
          user_id: string
        }
        Update: {
          carbs_g_target?: number | null
          effective_from?: string
          fat_g_target?: number | null
          id?: string
          kcal_target?: number
          protein_g_target?: number | null
          user_id?: string
        }
        Relationships: []
      }
      daily_totals: {
        Row: {
          carbs_g: number
          date: string
          fat_g: number
          fiber_g: number
          kcal: number
          protein_g: number
          salt_g: number
          sugars_g: number
          updated_at: string
          user_id: string
        }
        Insert: {
          carbs_g?: number
          date: string
          fat_g?: number
          fiber_g?: number
          kcal?: number
          protein_g?: number
          salt_g?: number
          sugars_g?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          carbs_g?: number
          date?: string
          fat_g?: number
          fiber_g?: number
          kcal?: number
          protein_g?: number
          salt_g?: number
          sugars_g?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      meal_item_assumptions: {
        Row: {
          assumption: string
          id: string
          meal_item_id: string
        }
        Insert: {
          assumption: string
          id?: string
          meal_item_id: string
        }
        Update: {
          assumption?: string
          id?: string
          meal_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_item_assumptions_meal_item_id_fkey"
            columns: ["meal_item_id"]
            isOneToOne: false
            referencedRelation: "meal_items"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_item_portions: {
        Row: {
          amount: number
          created_at: string
          grams_equivalent: number | null
          meal_item_id: string
          portion_label: string | null
          unit: Database["public"]["Enums"]["portion_unit"]
        }
        Insert: {
          amount: number
          created_at?: string
          grams_equivalent?: number | null
          meal_item_id: string
          portion_label?: string | null
          unit: Database["public"]["Enums"]["portion_unit"]
        }
        Update: {
          amount?: number
          created_at?: string
          grams_equivalent?: number | null
          meal_item_id?: string
          portion_label?: string | null
          unit?: Database["public"]["Enums"]["portion_unit"]
        }
        Relationships: [
          {
            foreignKeyName: "meal_item_portions_meal_item_id_fkey"
            columns: ["meal_item_id"]
            isOneToOne: true
            referencedRelation: "meal_items"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_item_snapshots: {
        Row: {
          carbs_g: number | null
          confidence: number
          created_at: string
          data_quality: Database["public"]["Enums"]["data_quality"]
          fat_g: number | null
          fiber_g: number | null
          kcal: number
          meal_item_id: string
          protein_g: number | null
          salt_g: number | null
          sugars_g: number | null
        }
        Insert: {
          carbs_g?: number | null
          confidence?: number
          created_at?: string
          data_quality: Database["public"]["Enums"]["data_quality"]
          fat_g?: number | null
          fiber_g?: number | null
          kcal: number
          meal_item_id: string
          protein_g?: number | null
          salt_g?: number | null
          sugars_g?: number | null
        }
        Update: {
          carbs_g?: number | null
          confidence?: number
          created_at?: string
          data_quality?: Database["public"]["Enums"]["data_quality"]
          fat_g?: number | null
          fiber_g?: number | null
          kcal?: number
          meal_item_id?: string
          protein_g?: number | null
          salt_g?: number | null
          sugars_g?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "meal_item_snapshots_meal_item_id_fkey"
            columns: ["meal_item_id"]
            isOneToOne: true
            referencedRelation: "meal_items"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_items: {
        Row: {
          brand: string | null
          created_at: string
          display_name: string
          id: string
          meal_id: string
          source_ref: string | null
          source_type: Database["public"]["Enums"]["source_type"]
        }
        Insert: {
          brand?: string | null
          created_at?: string
          display_name: string
          id?: string
          meal_id: string
          source_ref?: string | null
          source_type: Database["public"]["Enums"]["source_type"]
        }
        Update: {
          brand?: string | null
          created_at?: string
          display_name?: string
          id?: string
          meal_id?: string
          source_ref?: string | null
          source_type?: Database["public"]["Enums"]["source_type"]
        }
        Relationships: [
          {
            foreignKeyName: "meal_items_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
        ]
      }
      meals: {
        Row: {
          created_at: string
          eaten_at: string
          id: string
          local_date: string
          meal_type: Database["public"]["Enums"]["meal_type"]
          note: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          eaten_at: string
          id?: string
          local_date: string
          meal_type: Database["public"]["Enums"]["meal_type"]
          note?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          eaten_at?: string
          id?: string
          local_date?: string
          meal_type?: Database["public"]["Enums"]["meal_type"]
          note?: string | null
          user_id?: string
        }
        Relationships: []
      }
      portion_conversions: {
        Row: {
          applies_to_source_ref: string | null
          applies_to_source_type:
            | Database["public"]["Enums"]["source_type"]
            | null
          created_at: string
          grams: number
          id: string
          label: string
          user_id: string
        }
        Insert: {
          applies_to_source_ref?: string | null
          applies_to_source_type?:
            | Database["public"]["Enums"]["source_type"]
            | null
          created_at?: string
          grams: number
          id?: string
          label: string
          user_id: string
        }
        Update: {
          applies_to_source_ref?: string | null
          applies_to_source_type?:
            | Database["public"]["Enums"]["source_type"]
            | null
          created_at?: string
          grams?: number
          id?: string
          label?: string
          user_id?: string
        }
        Relationships: []
      }
      recipe_batches: {
        Row: {
          cooked_at: string
          id: string
          recipe_id: string
          remaining_yield_g: number
          total_yield_g: number
          user_id: string
        }
        Insert: {
          cooked_at?: string
          id?: string
          recipe_id: string
          remaining_yield_g: number
          total_yield_g: number
          user_id: string
        }
        Update: {
          cooked_at?: string
          id?: string
          recipe_id?: string
          remaining_yield_g?: number
          total_yield_g?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_batches_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_ingredients: {
        Row: {
          created_at: string
          display_name: string
          grams_equivalent: number | null
          id: string
          order_index: number
          quantity_amount: number
          quantity_unit: Database["public"]["Enums"]["portion_unit"]
          recipe_id: string
          source_ref: string | null
          source_type: Database["public"]["Enums"]["source_type"]
        }
        Insert: {
          created_at?: string
          display_name: string
          grams_equivalent?: number | null
          id?: string
          order_index: number
          quantity_amount: number
          quantity_unit: Database["public"]["Enums"]["portion_unit"]
          recipe_id: string
          source_ref?: string | null
          source_type: Database["public"]["Enums"]["source_type"]
        }
        Update: {
          created_at?: string
          display_name?: string
          grams_equivalent?: number | null
          id?: string
          order_index?: number
          quantity_amount?: number
          quantity_unit?: Database["public"]["Enums"]["portion_unit"]
          recipe_id?: string
          source_ref?: string | null
          source_type?: Database["public"]["Enums"]["source_type"]
        }
        Relationships: [
          {
            foreignKeyName: "recipe_ingredients_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          created_at: string
          id: string
          name: string
          notes: string | null
          user_id: string
          yield_amount: number | null
          yield_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          user_id: string
          yield_amount?: number | null
          yield_type: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          user_id?: string
          yield_amount?: number | null
          yield_type?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          display_name: string | null
          timezone: string
          unit_system: string
          updated_at: string
          user_id: string
        }
        Insert: {
          display_name?: string | null
          timezone?: string
          unit_system?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          display_name?: string | null
          timezone?: string
          unit_system?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      data_quality: "label_based" | "database" | "manual" | "estimated"
      meal_type: "breakfast" | "lunch" | "dinner" | "snack"
      portion_unit: "g" | "ml" | "serving" | "piece"
      source_type:
        | "off_barcode"
        | "recipe"
        | "recipe_batch"
        | "custom_food"
        | "quick_add"
        | "estimated_text"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      data_quality: ["label_based", "database", "manual", "estimated"],
      meal_type: ["breakfast", "lunch", "dinner", "snack"],
      portion_unit: ["g", "ml", "serving", "piece"],
      source_type: [
        "off_barcode",
        "recipe",
        "recipe_batch",
        "custom_food",
        "quick_add",
        "estimated_text",
      ],
    },
  },
} as const
